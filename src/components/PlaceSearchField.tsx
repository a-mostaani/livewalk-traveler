import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPBOX_TOKEN } from '../config';
import { classifyMapboxPlaceSearch, isAbortError, mapboxPlaceSearchUrl } from '../lib/mapboxPlaceSearch';
import type { RequestDraftPoint, RequestPoint } from '../types';
import { isRequestPoint } from '../types';
import { colors } from './Primitives';

type PlaceResult = RequestPoint;

type MapboxFeature = {
  id?: string;
  properties?: { full_address?: string; name_preferred?: string };
  place_formatted?: string;
  geometry?: { coordinates?: unknown };
};

function placeResult(feature: MapboxFeature): PlaceResult | undefined {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
  const lng = Number(coordinates[0]);
  const lat = Number(coordinates[1]);
  const label = String(feature.properties?.full_address || feature.place_formatted || feature.properties?.name_preferred || '').trim();
  if (!label || !Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { label, lat, lng };
}

export function PlaceSearchField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RequestDraftPoint;
  onChange: (place: RequestDraftPoint) => void;
}) {
  const [query, setQuery] = useState(value.label);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const selected = isRequestPoint(value);

  useEffect(() => {
    if (value.label !== query) setQuery(value.label);
  }, [query, value.label]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setResults([]);
      setLoading(false);
      setError('');
      return undefined;
    }
    if (!MAPBOX_TOKEN) {
      setResults([]);
      setLoading(false);
      setError('Place search is unavailable in this build.');
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(mapboxPlaceSearchUrl(trimmedQuery, MAPBOX_TOKEN), { signal: controller.signal });
        if (!response.ok) {
          const diagnostic = classifyMapboxPlaceSearch(response.status);
          console.warn('Mapbox place search failed', { category: diagnostic.category, status: response.status });
          setResults([]);
          setError(diagnostic.message);
          return;
        }
        const payload = await response.json() as { features?: MapboxFeature[] };
        const places = Array.isArray(payload.features) ? payload.features.map(placeResult).filter((item): item is PlaceResult => Boolean(item)) : [];
        const diagnostic = classifyMapboxPlaceSearch(response.status, places.length);
        if (diagnostic.category === 'empty-result') console.info('Mapbox place search completed', { category: diagnostic.category, status: response.status });
        setResults(places);
      } catch (searchError) {
        if (!isAbortError(searchError)) {
          const diagnostic = classifyMapboxPlaceSearch(undefined);
          console.warn('Mapbox place search failed', { category: diagnostic.category });
          setResults([]);
          setError(diagnostic.message);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setResults([]);
    setError('');
    onChange({ label: nextQuery });
  };

  const selectPlace = (place: PlaceResult) => {
    setQuery(place.label);
    setResults([]);
    setError('');
    onChange(place);
  };

  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputShell}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          accessibilityLabel={`${label} place search`}
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={updateQuery}
          placeholder="Search for a real place"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          value={query}
        />
        {loading ? <ActivityIndicator color={colors.action} size="small" /> : null}
        {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.success} /> : null}
      </View>
      {selected ? <Text style={styles.selection}>Place selected with map coordinates</Text> : <Text style={styles.helper}>Choose a result to set the route coordinates.</Text>}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && query.trim().length >= 3 && results.length === 0 ? <Text style={styles.empty}>No matching places yet.</Text> : null}
      {results.length > 0 ? (
        <View style={styles.results}>
          {results.map((place, index) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Select ${place.label}`}
              key={`${place.label}-${place.lat}-${place.lng}-${index}`}
              onPress={() => selectPlace(place)}
              style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
            >
              <Ionicons name="location-outline" size={18} color={colors.action} />
              <Text style={styles.resultText}>{place.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 14 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  inputShell: { minHeight: 52, alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 14 },
  input: { color: colors.textPrimary, flex: 1, fontSize: 16, paddingVertical: 12 },
  helper: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 7 },
  selection: { color: colors.success, fontSize: 12, fontWeight: '800', marginTop: 7 },
  error: { color: colors.danger, fontSize: 12, fontWeight: '800', marginTop: 7 },
  empty: { color: colors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 8 },
  results: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: 18, borderWidth: 1, marginTop: 8, overflow: 'hidden' },
  result: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 10, minHeight: 52, paddingHorizontal: 14, paddingVertical: 10 },
  resultPressed: { backgroundColor: colors.actionSoft },
  resultText: { color: colors.textPrimary, flex: 1, fontWeight: '700', lineHeight: 19 },
});
