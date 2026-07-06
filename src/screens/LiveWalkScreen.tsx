import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, colors } from '../components/Primitives';
import { MiniRouteMap, ProgressRail, VideoPlaceholder } from '../components/TravelVisuals';
import { MarketplaceRequest, SessionMessage } from '../api';

export function LiveWalkScreen({
  remoteRequest,
  messages,
  onSendMessage,
  onEnd,
}: {
  remoteRequest?: MarketplaceRequest;
  messages: SessionMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onEnd: () => void;
}) {
  const [talking, setTalking] = useState(false);
  const [translation, setTranslation] = useState(true);
  const sessionReady = Boolean(remoteRequest?.sessionId && remoteRequest?.status === 'live');
  const [actionNote, setActionNote] = useState('Live controls send updates to the guide through the shared session.');
  const liveControlNote = sessionReady
    ? actionNote
    : 'Controls unlock after the guide starts the shared live session.';

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

  return (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Shared live session</Text>
          <Text style={styles.title}>{remoteRequest?.route ?? 'Shibuya → Meiji Shrine'}</Text>
        </View>
        <View style={styles.timerPill}><Text style={styles.timerText}>{remoteRequest?.status === 'live' ? 'LIVE' : 'Ready'}</Text></View>
      </View>
      <VideoPlaceholder guideName={remoteRequest?.guide?.name?.trim() || 'Guide'} routeLabel={remoteRequest?.origin || 'live route'} />
      <Card style={styles.controlCard}>
        <View style={styles.controlGrid}>
          <TouchableOpacity
            activeOpacity={0.82}
            onPressIn={startTalking}
            onPressOut={stopTalking}
            disabled={!sessionReady}
            style={[styles.holdButton, talking && styles.holdButtonActive, !sessionReady && styles.controlDisabled, styles.controlButton]}
          >
            <Ionicons name={talking ? 'mic' : 'mic-outline'} size={18} color={talking ? colors.white : colors.ink} />
            <Text style={[styles.holdButtonText, talking && styles.holdButtonTextActive]}>{talking ? 'Talking…' : 'Hold to talk'}</Text>
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
          <Ionicons name="navigate-circle" size={28} color={colors.blue} />
        </View>
        <MiniRouteMap compact />
        <ProgressRail />
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Shared messages</Text>
            <Text style={styles.panelSub}>Synced through the backend session room</Text>
          </View>
          <Ionicons name="chatbubbles" size={25} color={colors.gold} />
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
      <Button label="End walk" icon="stop-circle" variant="danger" onPress={onEnd} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 10 },
  kicker: { color: colors.gold, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 4, flexShrink: 1 },
  timerPill: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  timerText: { color: colors.white, fontWeight: '900' },
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
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  holdButtonActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  controlDisabled: { opacity: 0.45 },
  holdButtonText: { color: colors.ink, fontWeight: '800', fontSize: 15 },
  holdButtonTextActive: { color: colors.white },
  actionNote: { color: colors.muted, fontWeight: '700', lineHeight: 19, marginTop: 12 },
  panel: { marginTop: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  panelTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  panelSub: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  captionList: { gap: 8 },
  captionBubble: { backgroundColor: colors.cream, borderRadius: 16, padding: 12 },
  captionText: { color: colors.ink, lineHeight: 20, fontWeight: '700' },
  messageFrom: { color: colors.gold, fontWeight: '900', marginBottom: 3, fontSize: 12 },
});
