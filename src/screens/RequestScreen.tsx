import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field, Header, Pill, Button, Card, colors } from '../components/Primitives';
import { PlaceSearchField } from '../components/PlaceSearchField';
import { interestOptions, languageOptions } from '../data/mock';
import { hasRouteCoordinates, WalkRequest } from '../types';

export function RequestScreen({
  request,
  onChange,
  onReview,
}: {
  request: WalkRequest;
  onChange: (next: WalkRequest) => void;
  onReview: () => void;
}) {
  const toggleInterest = (interest: string) => {
    const selected = request.interests.includes(interest);
    onChange({
      ...request,
      interests: selected ? request.interests.filter((item) => item !== interest) : [...request.interests, interest],
    });
  };

  const updateDuration = (value: string) => {
    const minutes = parseInt(value, 10);
    onChange({ ...request, durationMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 45 });
  };

  const routeReady = hasRouteCoordinates(request);

  return (
    <View>
      <Header
        kicker="New request"
        title="Where should your guide walk?"
        body="Search and select both places so your route has real map coordinates before you review it."
      />
      <Card>
        <PlaceSearchField label="Starting point" value={request.origin} onChange={(origin) => onChange({ ...request, origin })} />
        <PlaceSearchField label="Destination" value={request.destination} onChange={(destination) => onChange({ ...request, destination })} />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Start ISO time" value={request.scheduledStart} onChangeText={(scheduledStart) => onChange({ ...request, scheduledStart })} />
          </View>
          <View style={styles.half}>
            <Field label="Duration minutes" value={String(request.durationMinutes)} onChangeText={updateDuration} />
          </View>
        </View>
        <Text style={styles.label}>Language</Text>
        <View style={styles.wrap}>
          {languageOptions.map((language) => (
            <Pill
              key={language}
              label={language}
              selected={request.language === language}
              onPress={() => onChange({ ...request, language })}
            />
          ))}
        </View>
        <Text style={styles.label}>Interests</Text>
        <View style={styles.wrap}>
          {interestOptions.map((interest) => (
            <Pill key={interest} label={interest} selected={request.interests.includes(interest)} onPress={() => toggleInterest(interest)} />
          ))}
        </View>
      </Card>
      {!routeReady ? <Text style={styles.routeHint}>Select one Mapbox result for both points to continue.</Text> : null}
      <Button label="Review route" icon="map" onPress={onReview} disabled={!routeReady} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 14 },
  label: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginTop: 4 },
  routeHint: { color: colors.textSecondary, fontSize: 13, fontWeight: '800', lineHeight: 19, marginTop: 14 },
});
