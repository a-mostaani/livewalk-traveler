import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, Stat, colors } from '../components/Primitives';

export function SummaryScreen({ onNewWalk }: { onNewWalk: () => void }) {
  const [rating, setRating] = useState(5);
  return (
    <View>
      <Header
        kicker="Session complete"
        title="You walked Tokyo live."
        body="The summary screen captures receipt-ready details and the guide rating flow."
      />
      <Card style={styles.receipt}>
        <View style={styles.medal}>
          <Ionicons name="sparkles" size={30} color={colors.onDark} />
        </View>
        <Text style={styles.receiptTitle}>45 minute walk completed</Text>
        <View style={styles.stats}>
          <Stat label="Distance" value="2.8 km" />
          <Stat label="Stops" value="4" />
          <Stat label="Total" value="$38" />
        </View>
      </Card>
      <Card style={styles.ratingCard}>
        <Text style={styles.sectionTitle}>Rate your guide</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Rate ${star} star${star === 1 ? '' : 's'}`} accessibilityState={{ selected: star <= rating }} key={star} onPress={() => setRating(star)}>
              <Ionicons name={star <= rating ? 'star' : 'star-outline'} size={34} color={colors.accentWarm} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.feedback}>“Great pacing, clear explanations, and the ramen alley detour was exactly what I wanted.”</Text>
      </Card>
      <Card style={styles.nextCard}>
        <Text style={styles.sectionTitle}>What happens next</Text>
        {['Receipt and recording access can be added once backend storage exists.', 'Favorites and rebooking should attach to the traveler profile.', 'Disputes/refunds will need payment state and session logs.'].map((item) => (
          <View key={item} style={styles.nextRow}>
            <Ionicons name="chevron-forward" size={16} color={colors.accentWarm} />
            <Text style={styles.nextText}>{item}</Text>
          </View>
        ))}
      </Card>
      <Button label="Book another walk" icon="add-circle" onPress={onNewWalk} style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  receipt: { alignItems: 'center', backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  medal: { width: 64, height: 64, borderRadius: 24, backgroundColor: colors.accentWarm, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  receiptTitle: { color: colors.onDark, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 16 },
  ratingCard: { marginTop: 14, alignItems: 'center' },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  stars: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  feedback: { color: colors.textSecondary, textAlign: 'center', lineHeight: 21, fontWeight: '700' },
  nextCard: { marginTop: 14 },
  nextRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 8 },
  nextText: { color: colors.textSecondary, fontWeight: '700', flex: 1, lineHeight: 20 },
});
