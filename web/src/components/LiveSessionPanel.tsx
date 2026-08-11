import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { ApiError, liveWalkApi } from '../api';
import { LIVEKIT_WS_URL, MAPBOX_TOKEN } from '../config';
import { LiveSessionSubscribeController, getConnectionProps } from '../liveSession';
import type { LiveSession, SessionMessage, WalkRequest } from '../types';

function RemoteGuideVideo() {
  // Traveler never publishes, so the only camera track ever present in the
  // room is the Guide's - no participant filtering needed (same reasoning
  // as the mobile app's TravelerVideoView).
  const trackRef = useTracks([Track.Source.Camera])[0];
  if (!trackRef) {
    return <div className="live-video-waiting">Waiting for the guide to start their camera…</div>;
  }
  return <VideoTrack trackRef={trackRef} className="live-video-el" autoPlay muted={false} />;
}

function coordinate(location?: { lat?: number; lng?: number } | null) {
  const lat = location?.lat;
  const lng = location?.lng;
  return typeof lat === 'number' && Number.isFinite(lat) && typeof lng === 'number' && Number.isFinite(lng) ? { lat, lng } : undefined;
}

function pin(size: 's' | 'l', label: string, color: string, lng: number, lat: number) {
  return `pin-${size}-${label}+${color}(${lng.toFixed(5)},${lat.toFixed(5)})`;
}

function buildMapImageUrl(location: LiveSession['location'] | undefined, request: WalkRequest) {
  const guide = coordinate(location);
  if (!guide || !MAPBOX_TOKEN) return undefined;
  const origin = coordinate(request.origin);
  const destination = coordinate(request.destination);
  const overlays = [
    origin ? pin('s', 'a', '3ee6ae', origin.lng, origin.lat) : undefined,
    destination ? pin('s', 'b', 'edf6ff', destination.lng, destination.lat) : undefined,
    pin('l', 'g', '21d4fd', guide.lng, guide.lat),
  ].filter(Boolean).join(',');
  const viewport = origin && destination ? 'auto' : `${guide.lng.toFixed(5)},${guide.lat.toFixed(5)},15,0`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/${viewport}/640x360@2x?access_token=${encodeURIComponent(MAPBOX_TOKEN)}`;
}

export function LiveSessionPanel({
  token,
  request,
  onClose,
  onEnded,
}: {
  token: string;
  request: WalkRequest;
  onClose: () => void;
  onEnded: (request: WalkRequest) => void;
}) {
  const sessionId = request.sessionId as string;
  const controllerRef = useRef<LiveSessionSubscribeController | null>(null);
  const controller = controllerRef.current ?? (controllerRef.current = new LiveSessionSubscribeController({
    fetchToken: (id) => liveWalkApi.fetchLiveKitToken(token, id),
  }));

  const [session, setSession] = useState<LiveSession | null>(null);
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [connectionState, setConnectionState] = useState(() => controller.getState());
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [talking, setTalking] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');

  const sessionReady = session?.status === 'live';

  const poll = useCallback(async () => {
    try {
      const data = await liveWalkApi.getSessionStatus(token, sessionId);
      setSession(data.session);
      setMessages(data.messages);
      setError('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not refresh the live session.');
    }
  }, [token, sessionId]);

  useEffect(() => {
    void poll();
    const interval = window.setInterval(() => { void poll(); }, 2000);
    return () => window.clearInterval(interval);
  }, [poll]);

  useEffect(() => {
    let cancelled = false;
    if (sessionReady) {
      void controller.start(sessionId).then((next) => { if (!cancelled) setConnectionState(next); });
    } else {
      setConnectionState(controller.stop());
    }
    return () => {
      cancelled = true;
      setConnectionState(controller.stop());
    };
  }, [controller, sessionReady, sessionId]);

  const connectionProps = getConnectionProps(connectionState);

  const sendMessage = async (text: string) => {
    if (!sessionReady || !text.trim()) return;
    setSending(true);
    try {
      await liveWalkApi.sendSessionMessage(token, sessionId, text);
      await poll();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Message not sent - the shared session is not ready.');
    } finally {
      setSending(false);
    }
  };

  const sendQuickMessage = () => void sendMessage('Traveler message: Please slow down near the market.');
  const requestStopHere = () => void sendMessage('🚩 STOP HERE requested by traveler.');

  const startTalking = () => {
    if (!sessionReady) return;
    setTalking(true);
    void sendMessage('🎙️ Traveler is holding to talk.');
  };
  const stopTalking = () => {
    if (!talking) return;
    setTalking(false);
    void sendMessage('🎙️ Traveler finished talking.');
  };

  const submitMessage = (event: FormEvent) => {
    event.preventDefault();
    const text = messageText.trim();
    if (!text) return;
    setMessageText('');
    void sendMessage(text);
  };

  const endWalk = async () => {
    if (!sessionReady) return;
    setEnding(true);
    try {
      const data = await liveWalkApi.endSession(token, sessionId);
      controller.stop();
      onEnded(data.request ?? { ...request, status: 'completed' });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Could not end the shared walk. Check your connection and retry.');
    } finally {
      setEnding(false);
    }
  };

  const mapImageUrl = buildMapImageUrl(session?.location, request);

  return (
    <div className="live-session-panel">
      <div className="live-session-head">
        <div><span className="overline">LIVE SESSION</span><h3>{request.route}</h3></div>
        <button type="button" className="live-session-close" onClick={onClose} aria-label="Close live session">✕</button>
      </div>
      {error ? <div className="message error-message" role="alert">{error}</div> : null}
      {/* TICKET-3: video and chat used to stack full-width (video on top,
          chat below), so on desktop the video alone could fill the viewport
          and push the message input off-screen - travelers couldn't watch
          and type at once. Side-by-side here keeps both onscreen together;
          the existing 980px breakpoint below collapses this back to a
          single column, matching the original stacked layout on mobile. */}
      <div className="live-session-body">
        <div className="live-video-wrapper">
          {connectionProps.connect && connectionProps.token ? (
            <LiveKitRoom
              serverUrl={LIVEKIT_WS_URL}
              token={connectionProps.token}
              connect={connectionProps.connect}
              video={connectionProps.video}
              audio={connectionProps.audio}
              className="live-video-room"
            >
              <RemoteGuideVideo />
            </LiveKitRoom>
          ) : (
            <div className="live-video-placeholder">
              <span className="live-dot" />
              {sessionReady ? 'Connecting to the guide’s camera…' : 'Video starts once the guide begins the live session.'}
            </div>
          )}
        </div>
        <div className="live-session-side">
          <div className="live-messages-card">
            <h4>Shared messages</h4>
            <div className="live-messages-list">
              {messages.length === 0
                ? <p className="live-messages-empty">No shared messages yet.</p>
                : messages.map((message) => <div key={message.id} className="live-message"><strong>{message.senderName}</strong><span>{message.text}</span></div>)}
            </div>
            <form className="live-message-form" onSubmit={submitMessage}>
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Send a message to your guide"
                disabled={!sessionReady || sending}
                aria-label="Message to guide"
              />
              <button type="submit" className="button button-secondary" disabled={!sessionReady || sending || !messageText.trim()}>Send</button>
            </form>
          </div>
          <div className="live-map-card">
            <h4>Map and GPS</h4>
            {mapImageUrl ? <img src={mapImageUrl} alt="Guide's live location" className="live-map-image" /> : <div className="live-map-waiting">Waiting for guide GPS</div>}
          </div>
        </div>
      </div>
      <div className="live-session-controls">
        <button
          type="button"
          className={`button ${talking ? 'button-primary' : 'button-secondary'}`}
          onPointerDown={startTalking}
          onPointerUp={stopTalking}
          onPointerLeave={stopTalking}
          disabled={!sessionReady}
        >
          {talking ? 'Talking…' : 'Hold to talk'}
        </button>
        <button type="button" className="button button-secondary" onClick={sendQuickMessage} disabled={!sessionReady || sending}>Message guide</button>
        <button type="button" className="button button-secondary" onClick={requestStopHere} disabled={!sessionReady || sending}>Stop here</button>
        <button type="button" className="button button-danger-ghost" onClick={() => void endWalk()} disabled={!sessionReady || ending}>{ending ? 'Ending…' : 'End walk'}</button>
      </div>
    </div>
  );
}
