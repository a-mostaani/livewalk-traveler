import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, colors } from './Primitives';

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.logo}>
        <Ionicons name="navigate" size={20} color={colors.white} />
      </View>
      <View>
        <Text style={styles.brand}>LiveWalk</Text>
        <Text style={styles.brandSub}>Traveler</Text>
      </View>
    </View>
  );
}

export function MiniRouteMap({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.map, compact && styles.mapCompact]}>
      <View style={[styles.mapBlock, styles.blockOne]} />
      <View style={[styles.mapBlock, styles.blockTwo]} />
      <View style={[styles.mapBlock, styles.blockThree]} />
      <View style={styles.routeLine} />
      <View style={[styles.pin, styles.pinStart]}>
        <Ionicons name="walk" size={15} color={colors.white} />
      </View>
      <View style={[styles.pin, styles.pinEnd]}>
        <Ionicons name="flag" size={14} color={colors.white} />
      </View>
      <View style={styles.gpsDot} />
      <Text style={styles.mapLabel}>Live GPS route preview</Text>
    </View>
  );
}

export function VideoPlaceholder({ guideName = 'Guide', routeLabel = 'live route' }: { guideName?: string; routeLabel?: string }) {
  return (
    <View style={styles.video}>
      <View style={styles.videoGradientTop} />
      <View style={styles.videoBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.videoBadgeText}>LIVE WALK</Text>
      </View>
      <View style={styles.videoCenter}>
        <Ionicons name="videocam" size={36} color={colors.white} />
        <Text style={styles.videoTitle}>Guide camera feed</Text>
        <Text style={styles.videoText}>Mock stream placeholder until video integration</Text>
      </View>
      <View style={styles.videoBottom}>
        <Text style={styles.videoMeta}>{guideName} • {routeLabel}</Text>
        <Text style={styles.videoMeta}>12:18 remaining</Text>
      </View>
    </View>
  );
}

export function ProgressRail() {
  return (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Walk progress</Text>
        <Text style={styles.progressPct}>62%</Text>
      </View>
      <View style={styles.track}>
        <View style={styles.trackFill} />
      </View>
      <View style={styles.routeStops}>
        <Text style={styles.stopText}>Start</Text>
        <Text style={styles.stopText}>Ramen alley</Text>
        <Text style={styles.stopText}>Shrine gate</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  brandSub: { color: colors.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  map: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.blueSoft,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(13,77,102,0.16)',
  },
  mapCompact: { height: 154, borderRadius: 22 },
  mapBlock: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 18 },
  blockOne: { left: 18, top: 20, width: 112, height: 70, transform: [{ rotate: '-9deg' }] },
  blockTwo: { right: 14, top: 42, width: 132, height: 82, transform: [{ rotate: '12deg' }] },
  blockThree: { left: 58, bottom: 24, width: 170, height: 62, transform: [{ rotate: '5deg' }] },
  routeLine: {
    position: 'absolute',
    left: 58,
    top: 72,
    width: 212,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.gold,
    transform: [{ rotate: '28deg' }],
  },
  pin: { position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pinStart: { left: 42, top: 56, backgroundColor: colors.green },
  pinEnd: { right: 42, bottom: 50, backgroundColor: colors.ink },
  gpsDot: {
    position: 'absolute',
    left: '54%',
    top: '48%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.white,
    borderWidth: 5,
    borderColor: colors.blue,
  },
  mapLabel: { position: 'absolute', left: 16, bottom: 14, color: colors.blue, fontWeight: '900' },
  video: { height: 342, borderRadius: 32, backgroundColor: '#07131D', overflow: 'hidden', position: 'relative' },
  videoGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: '#173D52', opacity: 0.9 },
  videoBadge: { position: 'absolute', top: 18, left: 18, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A57' },
  videoBadgeText: { color: colors.white, fontWeight: '900', fontSize: 12 },
  videoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  videoTitle: { color: colors.white, fontSize: 24, fontWeight: '900', marginTop: 10 },
  videoText: { color: 'rgba(255,255,255,0.72)', textAlign: 'center', marginTop: 8 },
  videoBottom: { position: 'absolute', bottom: 18, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' },
  videoMeta: { color: colors.white, fontWeight: '800', fontSize: 12 },
  progressCard: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: colors.ink, fontWeight: '900', fontSize: 16 },
  progressPct: { color: colors.green, fontWeight: '900' },
  track: { height: 10, backgroundColor: colors.blueSoft, borderRadius: 999, overflow: 'hidden' },
  trackFill: { width: '62%', height: '100%', backgroundColor: colors.green, borderRadius: 999 },
  routeStops: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stopText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});
