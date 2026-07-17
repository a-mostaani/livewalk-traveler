import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandMark, MiniRouteMap } from '../components/TravelVisuals';
import { Button, Card, Header, colors } from '../components/Primitives';
import { getFirstWalkCta, type WalkHistoryState } from '../flow';

export function OnboardingScreen({
  historyState,
  onStart,
}: {
  historyState: WalkHistoryState;
  onStart: () => void;
}) {
  const cta = getFirstWalkCta(historyState);
  return (
    <View>
      <BrandMark />
      <Header
        kicker="Walk the world live"
        title="Book a local guide to be your eyes on the street."
        body="Choose a route, match with a nearby guide, then join a live video walk with voice, translation, GPS progress, and real-time detours."
      />
      <MiniRouteMap />
      <View style={styles.cards}>
        {[
          ['videocam', 'Video-first', 'See the place live, not a stale recording.'],
          ['map', 'Route aware', 'Follow progress, stops, and destination timing.'],
          ['language', 'Travel-ready', 'Captions and translation designed into the session.'],
        ].map(([icon, title, body]) => (
          <Card key={title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureBody}>{body}</Text>
            </View>
          </Card>
        ))}
      </View>
      <Button label={cta.label} icon="arrow-forward" onPress={onStart} disabled={cta.disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  cards: { gap: 10, marginVertical: 18 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14, borderRadius: 22 },
  featureIcon: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.surfaceWarm, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 15 },
  featureBody: { color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
});
