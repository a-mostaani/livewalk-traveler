import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
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

  const sendQuickMessage = async () => {
    try {
      await onSendMessage('Please slow down near the market.');
    } catch {
      Alert.alert('Message not sent', 'The shared session is not ready yet.');
    }
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
      <VideoPlaceholder />
      <Card style={styles.controlCard}>
        <View style={styles.controlGrid}>
          <Button label={talking ? 'Talking' : 'Hold to talk'} icon={talking ? 'mic' : 'mic-outline'} variant={talking ? 'primary' : 'secondary'} onPress={() => setTalking((value) => !value)} style={styles.controlButton} />
          <Button label="Message" icon="chatbubble-ellipses" variant="secondary" onPress={sendQuickMessage} style={styles.controlButton} />
          <Button label="Stop here" icon="hand-left" variant="secondary" onPress={() => Alert.alert('Guide notified', 'Shared control mock: stop here.')} style={styles.controlButton} />
          <Button label="Change route" icon="git-branch" variant="secondary" onPress={() => Alert.alert('Route change requested', 'Shared control mock: quieter street.')} style={styles.controlButton} />
        </View>
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
  panel: { marginTop: 14 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  panelTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  panelSub: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  captionList: { gap: 8 },
  captionBubble: { backgroundColor: colors.cream, borderRadius: 16, padding: 12 },
  captionText: { color: colors.ink, lineHeight: 20, fontWeight: '700' },
  messageFrom: { color: colors.gold, fontWeight: '900', marginBottom: 3, fontSize: 12 },
});
