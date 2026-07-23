import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useTracks } from '@livekit/components-react';
import { RemoteTrackPublication, Track, TrackEvent } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { VideoPlaceholder } from './TravelVisuals';
import type { TravelerSubscribeConnectionProps } from '../session/travelerSubscribe';

// The guide publishes 3 simulcast layers by default (q ~180p, h ~360p,
// f ~720p - see GuideBroadcastVideo, which sets no explicit
// VideoPublishOptions so LiveKit's default ladder for a 720p 16:9 source
// applies). Received frame dimensions are the only client-visible signal for
// which layer the SFU is actually sending right now, since
// RemoteTrackPublication.videoQuality reports the *requested* max quality,
// not what's currently arriving.
function describeSimulcastLayer(width?: number, height?: number): string {
  if (!width || !height) return 'unknown';
  const shortSide = Math.min(width, height);
  if (shortSide <= 200) return 'q (~180p)';
  if (shortSide <= 400) return 'h (~360p)';
  return 'f (~720p, top layer)';
}

function useLogSubscribedVideoQuality(publication: unknown) {
  useEffect(() => {
    if (!(publication instanceof RemoteTrackPublication)) return;
    const track = publication.track;
    if (!track) return;

    const logQuality = (dimensions?: Track.Dimensions) => {
      const settings = track.mediaStreamTrack?.getSettings();
      const width = dimensions?.width ?? settings?.width;
      const height = dimensions?.height ?? settings?.height;
      console.log(
        `[LiveWalk] guide video: received ${width}x${height} -> ${describeSimulcastLayer(width, height)}` +
        ` | requested max quality: ${publication.videoQuality} | frameRate: ${settings?.frameRate ?? 'unknown'}`,
      );
    };

    logQuality();
    track.on(TrackEvent.VideoDimensionsChanged, logQuality);
    return () => {
      track.off(TrackEvent.VideoDimensionsChanged, logQuality);
    };
  }, [publication]);
}

function RemoteGuideVideo() {
  // Traveler never publishes, so the only camera track ever present in the
  // room is the Guide's - no participant filtering needed.
  const trackRef = useTracks([Track.Source.Camera])[0];
  useLogSubscribedVideoQuality(trackRef?.publication);
  if (!trackRef) {
    return (
      <View style={styles.waiting}>
        <Text style={styles.waitingText}>Waiting for the guide to start their camera…</Text>
      </View>
    );
  }
  return <VideoTrack trackRef={trackRef} style={styles.video} objectFit="cover" />;
}

export function TravelerVideoView({
  connectionProps,
  guideName,
  routeLabel,
}: {
  connectionProps: TravelerSubscribeConnectionProps;
  guideName: string;
  routeLabel: string;
}) {
  if (!connectionProps.connect || !connectionProps.token) {
    return <VideoPlaceholder guideName={guideName} routeLabel={routeLabel} />;
  }
  return (
    <View style={styles.wrapper}>
      <LiveKitRoom
        serverUrl={LIVEKIT_WS_URL}
        token={connectionProps.token}
        connect={connectionProps.connect}
        video={connectionProps.video}
        audio={connectionProps.audio}
      >
        <RemoteGuideVideo />
      </LiveKitRoom>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { height: 342, borderRadius: 32, overflow: 'hidden', backgroundColor: '#07131D' },
  video: { flex: 1 },
  waiting: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitingText: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
});
