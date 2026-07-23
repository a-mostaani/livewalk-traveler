import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, colors } from './Primitives';
import type { MarketplaceRequest, SessionLocation } from '../types';

export function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.logo}>
        <Ionicons name="navigate" size={20} color={colors.onDark} />
      </View>
      <View>
        <Text style={styles.brand}>LiveWalk</Text>
        <Text style={styles.brandSub}>Traveler</Text>
      </View>
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
        <Ionicons name="videocam" size={36} color={colors.onDark} />
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

type LiveMapProps = {
  location?: SessionLocation | null;
  request?: MarketplaceRequest;
  mapboxToken: string;
  routePolyline?: string;
};

function numeric(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function coordinate(location?: { lat?: number; lng?: number } | null) {
  if (!numeric(location?.lat) || !numeric(location?.lng)) return undefined;
  return { lat: location.lat, lng: location.lng };
}

function pin(size: 's' | 'l', label: string, color: string, lng: number, lat: number) {
  return `pin-${size}-${label}+${color}(${lng.toFixed(5)},${lat.toFixed(5)})`;
}

// Static Images can render a path overlay, but it only draws geometry that's
// already been computed - the actual walking route comes from the separate
// Directions API (see routeGeometry.ts/useRoutePolyline), fetched once and
// passed in here as an encoded polyline.
function path(polyline: string, color: string) {
  return `path-4+${color}-0.85(${encodeURIComponent(polyline)})`;
}

type RouteMapParams = {
  origin?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  guide?: { lat: number; lng: number };
  routePolyline?: string;
  mapboxToken: string;
};

function buildRouteMapImageUrl({ origin, destination, guide, routePolyline, mapboxToken }: RouteMapParams) {
  if (!mapboxToken) return undefined;
  const anchor = guide ?? origin ?? destination;
  if (!anchor) return undefined;

  const overlays = [
    routePolyline ? path(routePolyline, colors.action.slice(1)) : undefined,
    origin ? pin('s', 'a', colors.success.slice(1), origin.lng, origin.lat) : undefined,
    destination ? pin('s', 'b', colors.textPrimary.slice(1), destination.lng, destination.lat) : undefined,
    guide ? pin('l', 'g', colors.action.slice(1), guide.lng, guide.lat) : undefined,
  ].filter(Boolean).join(',');
  const viewport = (origin && destination) || routePolyline ? 'auto' : `${anchor.lng.toFixed(5)},${anchor.lat.toFixed(5)},15,0`;
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${overlays}/${viewport}/600x360@2x?access_token=${encodeURIComponent(mapboxToken)}`;
}

export function MiniRouteMap({ origin: originPoint, destination: destinationPoint, mapboxToken, routePolyline, compact = false }: {
  origin?: { label: string; lat?: number; lng?: number };
  destination?: { label: string; lat?: number; lng?: number };
  mapboxToken: string;
  routePolyline?: string;
  compact?: boolean;
}) {
  const origin = coordinate(originPoint);
  const destination = coordinate(destinationPoint);
  const imageUrl = buildRouteMapImageUrl({ origin, destination, routePolyline, mapboxToken });
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [imageUrl]);

  if (!origin || !destination) {
    return (
      <View style={[styles.map, compact && styles.mapCompact, styles.liveMapWaiting]}>
        <Ionicons name="map-outline" size={30} color={colors.action} />
        <Text style={styles.liveMapTitle}>Add both places</Text>
        <Text style={styles.liveMapText}>The planned route appears here once origin and destination are set.</Text>
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={[styles.map, compact && styles.mapCompact, styles.liveMapWaiting]}>
        <Ionicons name="map-outline" size={30} color={colors.action} />
        <Text style={styles.liveMapTitle}>Map token missing</Text>
        <Text style={styles.liveMapText}>The Mapbox public token is not configured for this build.</Text>
      </View>
    );
  }

  if (imageFailed) {
    return (
      <View style={[styles.map, compact && styles.mapCompact, styles.liveMapWaiting]}>
        <Ionicons name="map-outline" size={30} color={colors.action} />
        <Text style={styles.liveMapTitle}>Map preview unavailable</Text>
        <Text style={styles.liveMapText}>The Mapbox token could not load a map image. It may be missing the Static Images (styles:tiles) scope.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.map, compact && styles.mapCompact]}>
      <Image source={{ uri: imageUrl }} style={styles.mapImage} resizeMode="cover" onError={() => setImageFailed(true)} />
      <Text style={styles.mapLabel}>{routePolyline ? 'Planned walking route' : 'Route preview'}</Text>
    </View>
  );
}

export function LiveGuideMap({ location, request, mapboxToken, routePolyline }: LiveMapProps) {
  const guide = coordinate(location);
  const origin = coordinate(request?.origin);
  const destination = coordinate(request?.destination);
  const imageUrl = buildRouteMapImageUrl({ origin, destination, guide, routePolyline, mapboxToken });
  const [imageFailed, setImageFailed] = React.useState(false);
  React.useEffect(() => setImageFailed(false), [imageUrl]);

  if (!guide) {
    return (
      <View style={[styles.liveMap, styles.liveMapWaiting]}>
        <Ionicons name="locate-outline" size={34} color={colors.action} />
        <Text style={styles.liveMapTitle}>Waiting for guide GPS</Text>
        <Text style={styles.liveMapText}>The map will switch on as soon as the Guide APK publishes latitude and longitude for this live session.</Text>
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={[styles.liveMap, styles.liveMapWaiting]}>
        <Ionicons name="map-outline" size={34} color={colors.action} />
        <Text style={styles.liveMapTitle}>Map token missing</Text>
        <Text style={styles.liveMapText}>Live coordinates are available, but the Mapbox public token is not configured for this build.</Text>
      </View>
    );
  }

  if (imageFailed) {
    return (
      <View style={[styles.liveMap, styles.liveMapWaiting]}>
        <Ionicons name="map-outline" size={34} color={colors.action} />
        <Text style={styles.liveMapTitle}>Map preview unavailable</Text>
        <Text style={styles.liveMapText}>The Mapbox token could not load a map image. It may be missing the Static Images (styles:tiles) scope.</Text>
      </View>
    );
  }

  return (
    <View style={styles.liveMap}>
      <Image source={{ uri: imageUrl }} style={styles.mapImage} resizeMode="cover" onError={() => setImageFailed(true)} />
      <View style={styles.mapOverlay}>
        <View style={styles.liveDot} />
        <Text style={styles.mapOverlayText}>Guide GPS live</Text>
      </View>
    </View>
  );
}

export function LiveProgressRail({
  progress,
  etaLabel,
  distanceLabel,
  originLabel,
  destinationLabel,
}: {
  progress?: number;
  etaLabel: string;
  distanceLabel: string;
  originLabel?: string;
  destinationLabel?: string;
}) {
  const pct = numeric(progress) ? Math.round(Math.max(0, Math.min(1, progress)) * 100) : undefined;
  return (
    <Card style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <View>
          <Text style={styles.progressTitle}>Walk progress</Text>
          <Text style={styles.progressMeta}>{etaLabel} • {distanceLabel}</Text>
        </View>
        <Text style={styles.progressPct}>{pct === undefined ? 'GPS' : `${pct}%`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${pct ?? 0}%` }]} />
      </View>
      <View style={styles.routeStops}>
        <Text style={styles.stopText} numberOfLines={1}>{originLabel ?? 'Origin'}</Text>
        <Text style={styles.stopText} numberOfLines={1}>{destinationLabel ?? 'Destination'}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  logo: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.textPrimary, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', letterSpacing: -0.4 },
  brandSub: { color: colors.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  map: {
    height: 220,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.actionSoft,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCompact: { height: 154, borderRadius: 22 },
  mapLabel: { position: 'absolute', left: 16, bottom: 14, color: colors.actionPressed, fontWeight: '900', backgroundColor: colors.overlay, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  video: { height: 342, borderRadius: 32, backgroundColor: colors.textPrimary, overflow: 'hidden', position: 'relative' },
  videoGradientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 130, backgroundColor: colors.actionPressed },
  videoBadge: { position: 'absolute', top: 18, left: 18, backgroundColor: colors.action, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  videoBadgeText: { color: colors.onAction, fontWeight: '900', fontSize: 12 },
  videoCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  videoTitle: { color: colors.onDark, fontSize: 24, fontWeight: '900', marginTop: 10 },
  videoText: { color: colors.onDarkMuted, textAlign: 'center', marginTop: 8 },
  videoBottom: { position: 'absolute', bottom: 18, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' },
  videoMeta: { color: colors.onDark, fontWeight: '800', fontSize: 12 },
  progressCard: { marginTop: 14 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: colors.textPrimary, fontWeight: '900', fontSize: 16 },
  progressPct: { color: colors.success, fontWeight: '900' },
  track: { height: 10, backgroundColor: colors.actionSoft, borderRadius: 999, overflow: 'hidden' },
  trackFill: { width: '62%', height: '100%', backgroundColor: colors.success, borderRadius: 999 },
  routeStops: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  stopText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' },
  liveMap: {
    height: 208,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.actionSoft,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  liveMapWaiting: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  liveMapTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 10 },
  liveMapText: { color: colors.textSecondary, textAlign: 'center', lineHeight: 20, fontWeight: '700', marginTop: 6 },
  mapImage: { width: '100%', height: '100%' },
  mapOverlay: {
    position: 'absolute',
    left: 14,
    top: 14,
    backgroundColor: colors.overlay,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapOverlayText: { color: colors.onDark, fontWeight: '900', fontSize: 12 },
  progressMeta: { color: colors.textSecondary, fontWeight: '700', marginTop: 3, fontSize: 12 },
});
