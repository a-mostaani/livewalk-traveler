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

  return (
    <View>
      <Header
        kicker="New request"
        title="Where should your guide walk?"
        body="Start with a clear route. The matching side is mocked for this MVP, so you can test the complete traveler journey."
      />
      <Card>
        <Field label="Starting point" value={request.start} onChangeText={(start) => onChange({ ...request, start })} />
        <Field label="Destination" value={request.destination} onChangeText={(destination) => onChange({ ...request, destination })} />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Date & time" value={request.dateTime} onChangeText={(dateTime) => onChange({ ...request, dateTime })} />
          </View>
          <View style={styles.half}>
            <Field label="Duration" value={request.duration} onChangeText={(duration) => onChange({ ...request, duration })} />
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
      <Button label="Review route and price" icon="map" onPress={onReview} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginBottom: 14 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 4 },
});
