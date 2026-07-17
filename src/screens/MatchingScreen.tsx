import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Pill, Stat, colors } from '../components/Primitives';
import { MarketplaceRequest } from '../api';
import { formatDuration, formatEstimateTotal, formatScheduledStart } from '../format';
import { isPreLiveRequest } from '../requestState';
import { WalkRequest } from '../types';

export function MatchingScreen({
  request,
  remoteRequest,
  onCheck,
  onReset,
  onCancel,
  isCancelling,
  cancelError,
}: {
  request: WalkRequest;
  remoteRequest?: MarketplaceRequest;
  onCheck: () => void;
  onReset: () => void;
  onCancel: () => void;
  isCancelling: boolean;
  cancelError?: string;
}) {
  const accepted = remoteRequest?.status === 'accepted' || remoteRequest?.status === 'live';
  const cancellable = isPreLiveRequest(remoteRequest);
  const route = remoteRequest?.route ?? `${request.origin.label} → ${request.destination.label}`;
  return (
    <View>
      <Header
        kicker="Live marketplace"
        title={accepted ? 'A guide accepted your walk.' : 'Your request is visible to guides.'}
        body="The guide APK polls the same backend every few seconds. Accept it there and this screen moves to confirmed automatically."
      />
      <View style={styles.pendingCard}>
        <View style={styles.radar}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          <Ionicons name={accepted ? 'checkmark' : 'radio'} size={24} color={colors.onDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingTitle}>{accepted ? `${remoteRequest?.guide?.name} accepted` : 'Waiting for guide response'}</Text>
          <Text style={styles.pendingBody}>Status: {remoteRequest?.status ?? 'not sent'} {remoteRequest?.id ? `• ${remoteRequest.id}` : ''}</Text>
        </View>
      </View>
      <Card style={styles.requestCard}>
        <Text style={styles.sectionTitle}>Shared request</Text>
        <Text style={styles.route}>{route}</Text>
        <View style={styles.stats}>
          <Stat label="Start" value={formatScheduledStart(remoteRequest?.scheduledStart ?? request.scheduledStart)} />
          <Stat label="Duration" value={formatDuration(remoteRequest?.durationMinutes ?? request.durationMinutes)} />
          <Stat label="Estimate" value={formatEstimateTotal(remoteRequest?.estimate)} />
        </View>
        <View style={styles.pills}>
          <Pill label={request.language} selected />
          {request.interests.slice(0, 4).map((interest) => <Pill key={interest} label={interest} />)}
        </View>
        <View style={styles.syncRow}>
          <Ionicons name="sync" size={18} color={colors.success} />
          <Text style={styles.syncText}>Polling the backend every 2 seconds for near real-time booking updates.</Text>
        </View>
      </Card>
      <Button label="Check now" icon="refresh" onPress={onCheck} disabled={isCancelling} style={{ marginTop: 18 }} />
      {cancellable ? <Button label={isCancelling ? 'Cancelling request…' : 'Cancel request'} icon="close-circle" variant="danger" onPress={onCancel} disabled={isCancelling} style={{ marginTop: 8 }} /> : <Button label="Start over locally" variant="ghost" onPress={onReset} style={{ marginTop: 8 }} />}
      {cancelError ? <Text accessibilityLiveRegion="polite" style={styles.cancelError}>{cancelError}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pendingCard: { backgroundColor: colors.textPrimary, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  radar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ringOuter: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: colors.onDarkMuted },
  ringInner: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.onDarkMuted },
  pendingTitle: { color: colors.onDark, fontSize: 18, fontWeight: '900' },
  pendingBody: { color: colors.onDarkMuted, marginTop: 4, lineHeight: 19, fontWeight: '700' },
  requestCard: { gap: 10 },
  sectionTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 18 },
  route: { color: colors.textPrimary, fontWeight: '900', fontSize: 17, lineHeight: 24 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap' },
  syncRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.surfaceSuccess, borderRadius: 16, padding: 12 },
  syncText: { color: colors.textPrimary, flex: 1, fontWeight: '800', lineHeight: 20 },
  cancelError: { color: colors.danger, fontWeight: '700', lineHeight: 19, marginTop: 10, textAlign: 'center' },
});
