import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';
import { MiniRouteMap } from '../components/TravelVisuals';
import { Estimate, WalkRequest } from '../types';
import { MarketplaceRequest } from '../api';

export function ConfirmedScreen({
  request,
  estimate,
  remoteRequest,
  canJoinLive,
  onJoin,
}: {
  request: WalkRequest;
  estimate: Estimate;
  remoteRequest?: MarketplaceRequest;
  canJoinLive: boolean;
  onJoin: () => void;
}) {
  const confirmed = remoteRequest?.status === 'accepted' || remoteRequest?.status === 'live';
  const guideName = remoteRequest?.guide?.name;
  const joinLabel = canJoinLive ? 'Join shared live walk' : (confirmed ? 'Waiting for guide to start' : 'Waiting for guide');
  return (
    <View>
      <Header kicker={confirmed ? 'Confirmed' : 'Pending'} title={confirmed ? 'Your live walk is booked.' : 'Your request is waiting for a guide.'} />
      <Card style={styles.hero}>
        <View style={[styles.statusIcon, !confirmed && styles.statusPending]}>
          <Ionicons name={confirmed ? 'checkmark' : 'time'} size={28} color={colors.white} />
        </View>
        <Text style={styles.heroTitle}>{confirmed ? `${guideName} will guide you` : 'Guides can accept this request'}</Text>
        <Text style={styles.heroBody}>{request.dateTime} • {request.duration} • {request.language}</Text>
        {remoteRequest?.id ? <Text style={styles.bookingId}>Booking {remoteRequest.id}</Text> : null}
      </Card>
      <MiniRouteMap compact />
      <Card style={styles.detailCard}>
        <Text style={styles.sectionTitle}>Booking detail</Text>
        <Text style={styles.route}>{request.start}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.route}>{request.destination}</Text>
        <View style={styles.stats}>
          <Stat label="Estimated" value={`$${estimate.total}`} />
          <Stat label="Language" value={request.language} />
        </View>
        <View style={styles.checklist}>
          {['Guide acceptance is shared through the backend', 'Guide starts the live session after the readiness checklist', 'Traveler controls unlock only once the guide is live'].map((item) => (
            <View key={item} style={styles.checkRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.green} />
              <Text style={styles.checkText}>{item}</Text>
            </View>
          ))}
        </View>
      </Card>
      <Button label={joinLabel} icon={canJoinLive ? 'videocam' : 'lock-closed'} onPress={onJoin} disabled={!canJoinLive} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, alignItems: 'center', marginBottom: 14 },
  statusIcon: { width: 58, height: 58, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statusPending: { backgroundColor: colors.gold },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  heroBody: { color: 'rgba(255,255,255,0.72)', marginTop: 6, fontWeight: '700' },
  bookingId: { color: 'rgba(255,255,255,0.54)', marginTop: 8, fontWeight: '800', fontSize: 12 },
  detailCard: { marginTop: 14 },
  sectionTitle: { color: colors.ink, fontWeight: '900', fontSize: 18, marginBottom: 12 },
  route: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  arrow: { color: colors.gold, marginVertical: 4, fontWeight: '900' },
  stats: { flexDirection: 'row', gap: 10, marginVertical: 14 },
  checklist: { gap: 8 },
  checkRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  checkText: { color: colors.muted, fontWeight: '700', flex: 1 },
});
