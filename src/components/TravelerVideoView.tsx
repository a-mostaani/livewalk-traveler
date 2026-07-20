import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LiveKitRoom, VideoTrack } from '@livekit/react-native';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { LIVEKIT_WS_URL } from '../config';
import { VideoPlaceholder } from './TravelVisuals';
import type { TravelerSubscribeConnectionProps } from '../session/travelerSubscribe';

function RemoteGuideVideo() {
  // Traveler never publishes, so the only camera track ever present in the
  // room is the Guide's - no participant filtering needed.
  const trackRef = useTracks([Track.Source.Camera])[0];
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
