import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field, Header, Pill, Button, Card, colors } from '../components/Primitives';
import { interestOptions, languageOptions } from '../data/mock';
import { WalkRequest } from '../types';

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

  return (
    <View>
      <Header
        kicker="New request"
        title="Where should your guide walk?"
        body="Start with clear route labels. Demo coordinates are fixed for now, and the backend calculates the estimate when you send."
      />
      <Card>
        <Field label="Starting point" value={request.origin.label} onChangeText={(label) => onChange({ ...request, origin: { ...request.origin, label } })} />
        <Field label="Destination" value={request.destination.label} onChangeText={(label) => onChange({ ...request, destination: { ...request.destination, label } })} />
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
      <Button label="Review route" icon="map" onPress={onReview} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 4 },
});
