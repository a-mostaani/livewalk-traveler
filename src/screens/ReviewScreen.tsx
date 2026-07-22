import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { MiniRouteMap } from '../components/TravelVisuals';
import { MAPBOX_TOKEN } from '../config';
import { formatDuration } from '../format';
import { useRoutePolyline } from '../hooks/useRoutePolyline';
import { Estimate, WalkRequest } from '../types';

export function ReviewScreen({
  request,
  estimate,
  onBack,
  onFindGuide,
  onRetryEstimate,
  busy = false,
  estimateBusy = false,
  estimateError,
}: {
  request: WalkRequest;
  estimate?: Estimate;
  onBack: () => void;
  onFindGuide: () => void;
  onRetryEstimate: () => void;
  busy?: boolean;
  estimateBusy?: boolean;
  estimateError?: string;
}) {
  const routePolyline = useRoutePolyline(request.origin, request.destination, MAPBOX_TOKEN);

  return (
    <View>
      <Header kicker="Route review" title="Check the walk before guides see it." />
      <MiniRouteMap origin={request.origin} destination={request.destination} mapboxToken={MAPBOX_TOKEN} routePolyline={routePolyline} />
      <Card style={styles.card}>
        <Text style={styles.route}>{request.origin.label}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.route}>{request.destination.label}</Text>
        <View style={styles.stats}>
          <Stat label="Distance" value={estimate ? `${estimate.distanceKm} km` : (estimateBusy ? '…' : 'Pending')} />
          <Stat label="Walk time" value={estimate ? `${estimate.walkingMinutes} min` : (estimateBusy ? '…' : 'Pending')} />
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
          ) : estimateBusy ? (
            <View style={styles.quoteState}>
              <ActivityIndicator color={colors.action} />
              <Text style={styles.estimatePending}>Calculating your server quote…</Text>
            </View>
          ) : estimateError ? (
            <View style={[styles.quoteState, styles.quoteStateError]}>
              <Text style={styles.estimateError}>{estimateError}</Text>
              <Button label="Retry quote" variant="secondary" onPress={onRetryEstimate} />
            </View>
          ) : (
            <Text style={styles.estimatePending}>Your quote will appear here before you send the request.</Text>
          )}
        </View>
      </Card>
      <View style={styles.actions}>
        <Button label="Edit" variant="secondary" onPress={onBack} style={{ flex: 1 }} />
        <Button label={busy ? "Sending…" : "Send to guides"} icon="cloud-upload" onPress={onFindGuide} disabled={busy || estimateBusy || !estimate || Boolean(estimateError)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  route: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  arrow: { color: colors.accentWarm, fontSize: 24, fontWeight: '900', marginVertical: 4 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  priceBox: { backgroundColor: colors.surfaceWarm, borderRadius: 20, padding: 14, marginTop: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  priceLabel: { color: colors.textSecondary, fontWeight: '700' },
  priceValue: { color: colors.textPrimary, fontWeight: '800' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 },
  totalLabel: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  totalValue: { color: colors.textPrimary, fontWeight: '900', fontSize: 24 },
  estimatePending: { color: colors.textSecondary, fontWeight: '800', lineHeight: 20 },
  quoteState: { gap: 12, backgroundColor: colors.surfaceInfo, borderRadius: 16, padding: 12 },
  quoteStateError: { backgroundColor: colors.surfaceDanger, borderWidth: 1, borderColor: colors.danger },
  estimateError: { color: colors.danger, fontWeight: '800', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
