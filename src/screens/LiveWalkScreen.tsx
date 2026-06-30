import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, colors } from '../components/Primitives';
import { MiniRouteMap, ProgressRail, VideoPlaceholder } from '../components/TravelVisuals';
import { captions } from '../data/mock';

export function LiveWalkScreen({ onEnd }: { onEnd: () => void }) {
  const [talking, setTalking] = useState(false);
  const [translation, setTranslation] = useState(true);

  return (
    <View>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.kicker}>Live session</Text>
          <Text style={styles.title}>Shibuya → Meiji Shrine</Text>
        </View>
        <View style={styles.timerPill}>
          <Text style={styles.timerText}>12:18</Text>
        </View>
      </View>
      <VideoPlaceholder />
      <Card style={styles.controlCard}>
        <View style={styles.controlGrid}>
          <Button
            label={talking ? 'Talking' : 'Hold to talk'}
            icon={talking ? 'mic' : 'mic-outline'}
            variant={talking ? 'primary' : 'secondary'}
            onPress={() => setTalking((value) => !value)}
            style={styles.controlButton}
          />
          <Button label="Message" icon="chatbubble-ellipses" variant="secondary" onPress={() => Alert.alert('Message sent', 'Mock message: Please slow down near the market.')} style={styles.controlButton} />
          <Button label="Stop here" icon="hand-left" variant="secondary" onPress={() => Alert.alert('Guide notified', 'Mock control sent: stop here.')} style={styles.controlButton} />
          <Button label="Change route" icon="git-branch" variant="secondary" onPress={() => Alert.alert('Route change requested', 'Mock control sent: turn toward the quieter street.')} style={styles.controlButton} />
        </View>
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Map and GPS</Text>
            <Text style={styles.panelSub}>Mock position updates and route progress</Text>
          </View>
          <Ionicons name="navigate-circle" size={28} color={colors.blue} />
        </View>
        <MiniRouteMap compact />
        <ProgressRail />
      </Card>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Captions and translation</Text>
            <Text style={styles.panelSub}>{translation ? 'Auto-translation on' : 'Original captions only'}</Text>
          </View>
          <Button label={translation ? 'On' : 'Off'} variant="secondary" onPress={() => setTranslation((value) => !value)} />
        </View>
        <View style={styles.captionList}>
          {captions.map((caption) => (
            <View key={caption} style={styles.captionBubble}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Button label="End walk" icon="stop-circle" variant="danger" onPress={onEnd} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  kicker: { color: colors.gold, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 22, fontWeight: '900', marginTop: 4 },
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
});
