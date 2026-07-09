import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { MiniRouteMap } from '../components/TravelVisuals';
import { formatDuration } from '../format';
import { Estimate, WalkRequest } from '../types';

export function ReviewScreen({
  request,
  estimate,
  onBack,
  onFindGuide,
  busy = false,
}: {
  request: WalkRequest;
  estimate?: Estimate;
  onBack: () => void;
  onFindGuide: () => void;
  busy?: boolean;
}) {
  return (
    <View>
      <Header kicker="Route review" title="Check the walk before guides see it." />
      <MiniRouteMap />
      <Card style={styles.card}>
        <Text style={styles.route}>{request.origin.label}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.route}>{request.destination.label}</Text>
        <View style={styles.stats}>
          <Stat label="Distance" value={estimate ? `${estimate.distanceKm} km` : 'Server'} />
          <Stat label="Walk time" value={estimate ? `${estimate.walkingMinutes} min` : 'Server'} />
          <Stat label="Booked" value={formatDuration(request.durationMinutes)} />
        </View>
        <View style={styles.pills}>
          <Pill label={request.language} selected />
          {request.interests.slice(0, 3).map((interest) => (
            <Pill key={interest} label={interest} />
          ))}
        </View>
        <View style={styles.priceBox}>
          {estimate ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Guide fee</Text>
                <Text style={styles.priceValue}>${estimate.guideFee}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>LiveWalk service</Text>
                <Text style={styles.priceValue}>${estimate.platformFee}</Text>
              </View>
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Estimated total</Text>
                <Text style={styles.totalValue}>${estimate.total}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.estimatePending}>Server estimate appears after this request is created.</Text>
          )}
        </View>
      </Card>
      <View style={styles.actions}>
        <Button label="Edit" variant="secondary" onPress={onBack} style={{ flex: 1 }} />
        <Button label={busy ? "Sending…" : "Send to guides"} icon="cloud-upload" onPress={onFindGuide} disabled={busy} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  route: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  arrow: { color: colors.gold, fontSize: 24, fontWeight: '900', marginVertical: 4 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  priceBox: { backgroundColor: colors.cream, borderRadius: 20, padding: 14, marginTop: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { color: colors.muted, fontWeight: '700' },
  priceValue: { color: colors.ink, fontWeight: '800' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 8, paddingTop: 12 },
  totalLabel: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  totalValue: { color: colors.ink, fontWeight: '900', fontSize: 24 },
  estimatePending: { color: colors.muted, fontWeight: '800', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
