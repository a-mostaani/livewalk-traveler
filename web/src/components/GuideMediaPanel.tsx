import { useCallback, useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, Track, type RemoteTrack } from 'livekit-client';
import { liveWalkApi, type LiveWalkApiSurface } from '../api';
import { LIVEKIT_WS_URL } from '../config';
import type { LiveSession } from '../types';

type MediaState = 'waiting' | 'connecting' | 'connected' | 'reconnecting' | 'ended' | 'error';
type MediaTrack = Pick<RemoteTrack, 'kind' | 'sid' | 'attach' | 'detach'>;

export type GuideMediaRoom = {
  on: (event: RoomEvent, listener: (...args: any[]) => void) => GuideMediaRoom;
  off: (event: RoomEvent, listener: (...args: any[]) => void) => GuideMediaRoom;
  connect: (url: string, token: string, options?: { autoSubscribe?: boolean }) => Promise<void>;
  disconnect: () => Promise<void>;
  startAudio: () => Promise<void>;
  readonly canPlaybackAudio: boolean;
};

const defaultRoomFactory = () => new Room({ adaptiveStream: true }) as unknown as GuideMediaRoom;

export function GuideMediaPanel({
  session,
  authToken,
  apiClient = liveWalkApi,
  roomFactory = defaultRoomFactory,
  liveKitWsUrl = LIVEKIT_WS_URL,
}: {
  session: LiveSession;
  authToken: string;
  apiClient?: Pick<LiveWalkApiSurface, 'getLiveKitToken'>;
  roomFactory?: () => GuideMediaRoom;
  liveKitWsUrl?: string;
}) {
  const isLive = session.status === 'live';
  const [mediaState, setMediaState] = useState<MediaState>(
    session.status === 'ended' || session.status === 'cancelled' ? 'ended' : isLive ? 'connecting' : 'waiting',
  );
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [videoTrack, setVideoTrack] = useState<MediaTrack | null>(null);
  const [audioTrack, setAudioTrack] = useState<MediaTrack | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const roomRef = useRef<GuideMediaRoom | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (session.status === 'ended' || session.status === 'cancelled') {
      setMediaState('ended');
      setError('');
      return;
    }
    if (!isLive) {
      setMediaState('waiting');
      return;
    }
    if (!liveKitWsUrl) {
      setMediaState('error');
      setError('Live media is not configured in this Traveler release.');
      return;
    }

    let active = true;
    const room = roomFactory();
    roomRef.current = room;
    setMediaState('connecting');
    setError('');
    setVideoTrack(null);
    setAudioTrack(null);
    setAudioEnabled(false);

    const connected = () => {
      if (!active) return;
      setMediaState('connected');
      setAudioEnabled(room.canPlaybackAudio);
    };
    const reconnecting = () => {
      if (active) setMediaState('reconnecting');
    };
    const reconnected = () => {
      if (active) setMediaState('connected');
    };
    const disconnected = () => {
      if (!active) return;
      setMediaState('error');
      setError('Guide media disconnected. Rejoin to continue watching.');
    };
    const subscribed = (track: MediaTrack) => {
      if (!active) return;
      if (track.kind === Track.Kind.Video) setVideoTrack(track);
      if (track.kind === Track.Kind.Audio) setAudioTrack(track);
    };
    const unsubscribed = (track: MediaTrack) => {
      if (!active) return;
      if (track.kind === Track.Kind.Video) setVideoTrack((current) => current === track ? null : current);
      if (track.kind === Track.Kind.Audio) setAudioTrack((current) => current === track ? null : current);
    };
    const subscriptionFailed = () => {
      if (!active) return;
      setMediaState('error');
      setError('Could not receive the Guide media track. Rejoin to retry.');
    };
    const audioPlaybackChanged = () => {
      if (active) setAudioEnabled(room.canPlaybackAudio);
    };

    room
      .on(RoomEvent.Connected, connected)
      .on(RoomEvent.Reconnecting, reconnecting)
      .on(RoomEvent.Reconnected, reconnected)
      .on(RoomEvent.Disconnected, disconnected)
      .on(RoomEvent.TrackSubscribed, subscribed)
      .on(RoomEvent.TrackUnsubscribed, unsubscribed)
      .on(RoomEvent.TrackSubscriptionFailed, subscriptionFailed)
      .on(RoomEvent.AudioPlaybackStatusChanged, audioPlaybackChanged);

    void (async () => {
      try {
        const data = await apiClient.getLiveKitToken(authToken, session.id);
        if (!active) return;
        if (data.canPublish !== false) throw new Error('Traveler media permission is not subscribe-only.');
        await room.connect(liveKitWsUrl, data.token, { autoSubscribe: true });
        if (active) connected();
      } catch (reason) {
        if (!active) return;
        setMediaState('error');
        setError(reason instanceof Error ? reason.message : 'Could not join Guide media.');
      }
    })();

    return () => {
      active = false;
      room
        .off(RoomEvent.Connected, connected)
        .off(RoomEvent.Reconnecting, reconnecting)
        .off(RoomEvent.Reconnected, reconnected)
        .off(RoomEvent.Disconnected, disconnected)
        .off(RoomEvent.TrackSubscribed, subscribed)
        .off(RoomEvent.TrackUnsubscribed, unsubscribed)
        .off(RoomEvent.TrackSubscriptionFailed, subscriptionFailed)
        .off(RoomEvent.AudioPlaybackStatusChanged, audioPlaybackChanged);
      if (roomRef.current === room) roomRef.current = null;
      void room.disconnect();
    };
  }, [apiClient, attempt, authToken, isLive, liveKitWsUrl, roomFactory, session.id, session.status]);

  useEffect(() => {
    const element = videoRef.current;
    if (!videoTrack || !element) return;
    videoTrack.attach(element);
    return () => {
      videoTrack.detach(element);
    };
  }, [videoTrack]);

  useEffect(() => {
    const element = audioRef.current;
    if (!audioTrack || !element) return;
    element.muted = !audioEnabled;
    audioTrack.attach(element);
    return () => {
      audioTrack.detach(element);
    };
  }, [audioEnabled, audioTrack]);

  const enableAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room || audioBusy) return;
    setAudioBusy(true);
    setError('');
    try {
      await room.startAudio();
      if (audioRef.current) {
        audioRef.current.muted = false;
        await audioRef.current.play();
      }
      setAudioEnabled(true);
    } catch {
      setAudioEnabled(false);
      setError('Your browser blocked audio. Tap enable again after interacting with the page.');
    } finally {
      setAudioBusy(false);
    }
  }, [audioBusy]);

  const retry = () => setAttempt((value) => value + 1);
  const statusCopy = mediaState === 'waiting'
    ? 'Waiting for the Guide to start media.'
    : mediaState === 'connecting'
      ? 'Connecting to Guide video and audio…'
      : mediaState === 'reconnecting'
        ? 'Reconnecting to Guide media…'
        : mediaState === 'ended'
          ? 'Live Guide media has ended.'
          : mediaState === 'error'
            ? error
            : videoTrack
              ? 'Guide media connected.'
              : 'Connected. Waiting for the Guide camera.';

  return (
    <section className={`guide-media-panel state-${mediaState}`} aria-labelledby="guide-media-heading">
      <div className="guide-media-heading">
        <div>
          <span className="overline">GUIDE MEDIA · VIEW ONLY</span>
          <h4 id="guide-media-heading">Live video and audio</h4>
        </div>
        <span className="media-state" role={mediaState === 'error' ? 'alert' : 'status'}>{statusCopy}</span>
      </div>
      <div className="guide-video-stage">
        <video ref={videoRef} autoPlay playsInline muted aria-label="Guide live video" />
        {!videoTrack ? <div className="guide-video-placeholder"><span>{mediaState === 'reconnecting' ? '↻' : mediaState === 'ended' ? '✓' : '◉'}</span><strong>{statusCopy}</strong></div> : null}
      </div>
      <audio ref={audioRef} autoPlay aria-label="Guide live audio" />
      {isLive && mediaState !== 'error' ? (
        <button className="audio-control" type="button" onClick={() => void enableAudio()} disabled={audioEnabled || audioBusy}>
          {audioBusy ? 'Enabling audio…' : audioEnabled ? 'Guide audio on' : 'Enable Guide audio'}
        </button>
      ) : null}
      {mediaState === 'error' ? <button className="audio-control" type="button" onClick={retry}>Rejoin Guide media</button> : null}
    </section>
  );
}
