import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, colors } from '../components/Primitives';
import { LiveGuideMap, LiveProgressRail, VideoPlaceholder } from '../components/TravelVisuals';
import { MAPBOX_TOKEN } from '../config';
import { LiveSession, MarketplaceRequest, SessionMessage } from '../api';
import type { SessionLocation } from '../types';

export function LiveWalkScreen({
  remoteRequest,
  liveSession,
  messages,
  onSendMessage,
  onEnd,
}: {
  remoteRequest?: MarketplaceRequest;
  liveSession?: LiveSession;
  messages: SessionMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEnd: () => Promise<boolean>;
}) {
  const [talking, setTalking] = useState(false);
  const [translation, setTranslation] = useState(true);
  const sessionReady = Boolean(remoteRequest?.sessionId && remoteRequest?.status === 'live');
  const [actionNote, setActionNote] = useState('Live controls send updates to the guide through the shared session.');
  const liveControlNote = sessionReady
    ? actionNote
    : 'Controls unlock after the guide starts the shared live session.';
  const guideLocation = liveSession?.location ?? remoteRequest?.location ?? null;
  const guideCoordinates = readCoordinates(guideLocation);
  const progressState = deriveProgress(guideLocation, remoteRequest);
  const accuracyLabel = formatAccuracy(guideLocation?.accuracy);
  const timestampLabel = formatTimestamp(guideLocation?.timestamp);
  const coordinatesLabel = guideCoordinates
    ? `${guideCoordinates.lat.toFixed(5)}, ${guideCoordinates.lng.toFixed(5)}`
    : 'Waiting for live coordinates';

  const sendSessionEvent = async (text: string, success: string) => {
    if (!sessionReady) {
      setActionNote('Controls unlock after the guide starts the shared live session.');
      Alert.alert('Session not live yet', 'Wait for the guide to complete readiness checks and start the live session.');
      return;
    }
    try {
      await onSendMessage(text);
      setActionNote(success);
    } catch {
      setActionNote('Not sent yet — the guide has not started live.');
      Alert.alert('Message not sent', 'Wait for the guide to start the live session first.');
    }
  };

  const sendQuickMessage = () => sendSessionEvent(
    'Traveler message: Please slow down near the market.',
    'Message sent to the guide.'
  );

  const requestStopHere = () => sendSessionEvent(
    '🚩 STOP HERE requested by traveler.',
    'Stop-here request sent to the guide.'
  );

  const startTalking = () => {
    if (!sessionReady) return;
    setTalking(true);
    void sendSessionEvent('🎙️ Traveler is holding to talk.', 'Talk status sent to the guide.');
  };

  const stopTalking = () => {
    if (!talking) return;
    setTalking(false);
    void sendSessionEvent('🎙️ Traveler finished talking.', 'Talk status ended.');
  };

  const endWalk = async () => {
    if (!sessionReady) return;
    const ended = await onEnd();
    if (ended) {
      setActionNote('Shared walk ended. Preparing your summary.');
      return;
    }
    setActionNote('The walk is still live. Please retry ending it.');
    Alert.alert('Walk still live', 'We could not end the shared walk. Check your connection and retry.');
  };

  return (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Shared live session</Text>
          <Text style={styles.title}>{remoteRequest?.route ?? 'Shibuya → Meiji Shrine'}</Text>
        </View>
        <View style={styles.timerPill}><Text style={styles.timerText}>{remoteRequest?.status === 'live' ? 'LIVE' : 'Ready'}</Text></View>
      </View>
      <VideoPlaceholder guideName={remoteRequest?.guide?.name?.trim() || 'Guide'} routeLabel={remoteRequest?.origin.label || 'live route'} />
      <Card style={styles.controlCard}>
        <View style={styles.controlGrid}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Hold to talk"
            accessibilityState={{ disabled: !sessionReady, selected: talking }}
            activeOpacity={0.82}
            onPressIn={startTalking}
            onPressOut={stopTalking}
            disabled={!sessionReady}
            style={[styles.holdButton, talking && styles.holdButtonActive, !sessionReady && styles.controlDisabled, styles.controlButton]}
          >
            <Ionicons name={talking ? 'mic' : 'mic-outline'} size={18} color={talking ? colors.onAction : (!sessionReady ? colors.disabledText : colors.textPrimary)} />
            <Text style={[styles.holdButtonText, !sessionReady && styles.holdButtonTextDisabled, talking && styles.holdButtonTextActive]}>{talking ? 'Talking…' : 'Hold to talk'}</Text>
          </TouchableOpacity>
          <Button label="Message" icon="chatbubble-ellipses" variant="secondary" onPress={sendQuickMessage} disabled={!sessionReady} style={styles.controlButton} />
          <Button label="Stop here" icon="hand-left" variant="secondary" onPress={requestStopHere} disabled={!sessionReady} style={styles.controlButton} />
          <Button label="Change route" icon="git-branch" variant="secondary" onPress={() => sendSessionEvent('Traveler requested a route change: quieter street.', 'Route-change request sent to the guide.')} disabled={!sessionReady} style={styles.controlButton} />
        </View>
        <Text style={styles.actionNote}>{liveControlNote}</Text>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Map and GPS</Text>
            <Text style={styles.panelSub}>Session state shared with guide APK</Text>
          </View>
          <Ionicons name="navigate-circle" size={28} color={colors.action} />
        </View>
        <LiveGuideMap location={guideLocation} request={remoteRequest} mapboxToken={MAPBOX_TOKEN} />
        <View style={styles.gpsMetaGrid}>
          <Metric label="Guide coordinates" value={coordinatesLabel} />
          <Metric label="Accuracy" value={accuracyLabel} />
          <Metric label="Last GPS update" value={timestampLabel} />
        </View>
        <LiveProgressRail
          progress={progressState.progress}
          etaLabel={progressState.etaLabel}
          distanceLabel={progressState.distanceLabel}
          originLabel={remoteRequest?.origin.label}
          destinationLabel={remoteRequest?.destination.label}
        />
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Shared messages</Text>
            <Text style={styles.panelSub}>Synced through the backend session room</Text>
          </View>
          <Ionicons name="chatbubbles" size={25} color={colors.accentWarm} />
        </View>
        <View style={styles.captionList}>
          {(messages.length ? messages : [{ id: 'empty', text: 'No shared messages yet. Tap Message after joining.', senderName: 'LiveWalk', senderRole: 'system', sessionId: '', createdAt: '' }]).map((message) => (
            <View key={message.id} style={styles.captionBubble}>
              <Text style={styles.messageFrom}>{message.senderName}</Text>
              <Text style={styles.captionText}>{message.text}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Captions and translation</Text>
            <Text style={styles.panelSub}>{translation ? 'Auto-translation on' : 'Original captions only'}</Text>
          </View>
          <Button label={translation ? 'On' : 'Off'} variant="secondary" onPress={() => setTranslation((value) => !value)} />
        </View>
      </Card>
      <Button label="End walk" icon="stop-circle" variant="danger" onPress={() => void endWalk()} disabled={!sessionReady} style={{ marginTop: 18 }} />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function numeric(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readCoordinates(location?: SessionLocation | null) {
  if (!numeric(location?.lat) || !numeric(location?.lng)) return undefined;
  return { lat: location.lat, lng: location.lng };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radius = 6371000;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function projectProgress(
  point: { lat: number; lng: number },
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) {
  const metersPerLat = 111320;
  const metersPerLng = 111320 * Math.cos(origin.lat * Math.PI / 180);
  const ax = 0;
  const ay = 0;
  const bx = (destination.lng - origin.lng) * metersPerLng;
  const by = (destination.lat - origin.lat) * metersPerLat;
  const px = (point.lng - origin.lng) * metersPerLng;
  const py = (point.lat - origin.lat) * metersPerLat;
  const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2;
  if (lengthSquared < 1) return undefined;
  return clamp01(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSquared);
}

function deriveProgress(location?: SessionLocation | null, request?: MarketplaceRequest) {
  const guide = readCoordinates(location);
  const origin = request?.origin;
  const destination = request?.destination;
  let progress = numeric(location?.progress) ? clamp01(location.progress) : undefined;
  let distanceLabel = 'Waiting for route GPS';

  if (guide && origin && destination) {
    progress = projectProgress(guide, origin, destination) ?? progress;
    const remainingMeters = distanceMeters(guide, destination);
    distanceLabel = remainingMeters >= 1000
      ? `${(remainingMeters / 1000).toFixed(1)} km to destination`
      : `${Math.round(remainingMeters)} m to destination`;
  }

  const durationMinutes = request?.durationMinutes;
  const etaLabel = numeric(progress) && numeric(durationMinutes)
    ? `~${Math.max(1, Math.ceil((1 - progress) * durationMinutes))} min remaining`
    : 'ETA after first GPS fix';

  return { progress, etaLabel, distanceLabel };
}

function formatAccuracy(accuracy: number | null | undefined) {
  return numeric(accuracy) ? `±${Math.round(accuracy)} m` : 'Waiting';
}

function formatTimestamp(timestamp: string | null | undefined) {
  if (!timestamp) return 'Waiting';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Just updated';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  kicker: { color: colors.accentWarm, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 4, flexShrink: 1 },
  timerPill: { backgroundColor: colors.action, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  timerText: { color: colors.onAction, fontWeight: '900' },
  controlCard: { marginTop: 14 },
  controlGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  controlButton: { flexBasis: '47%', flexGrow: 1 },
  holdButton: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  holdButtonActive: { backgroundColor: colors.action, borderColor: colors.action },
  controlDisabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  holdButtonText: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
  holdButtonTextDisabled: { color: colors.disabledText },
  holdButtonTextActive: { color: colors.onAction },
  actionNote: { color: colors.textSecondary, fontWeight: '700', lineHeight: 19, marginTop: 12 },
  panel: { marginTop: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  panelTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  panelSub: { color: colors.textSecondary, fontWeight: '700', marginTop: 2 },
  gpsMetaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  metric: { flexBasis: '31%', flexGrow: 1, backgroundColor: colors.surfaceInfo, borderRadius: 14, padding: 10 },
  metricLabel: { color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.3 },
  metricValue: { color: colors.textPrimary, fontWeight: '900', marginTop: 4, fontSize: 12 },
  captionList: { gap: 8 },
  captionBubble: { backgroundColor: colors.surfaceInfo, borderRadius: 16, padding: 12 },
  captionText: { color: colors.textPrimary, lineHeight: 20, fontWeight: '700' },
  messageFrom: { color: colors.accentWarm, fontWeight: '900', marginBottom: 3, fontSize: 12 },
});
