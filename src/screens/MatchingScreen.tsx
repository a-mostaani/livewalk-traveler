import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, colors } from '../components/Primitives';
import { Guide } from '../types';

export function MatchingScreen({ guides, onSelect, onPending }: { guides: Guide[]; onSelect: (guide: Guide) => void; onPending: () => void }) {
  const [selectedId, setSelectedId] = useState(guides[0]?.id);
  const selected = useMemo(() => guides.find((guide) => guide.id === selectedId) ?? guides[0], [guides, selectedId]);

  return (
    <View>
      <Header
        kicker="Guide match"
        title="Choose a local or let the request go pending."
        body="In the real product, nearby guides receive this request and can accept or decline."
      />
      <View style={styles.pendingCard}>
        <View style={styles.radar}>
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          <Ionicons name="radio" size={24} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.pendingTitle}>2 matching guides found</Text>
          <Text style={styles.pendingBody}>Mocked availability based on language, location, and requested slot.</Text>
        </View>
      </View>
      <View style={styles.list}>
        {guides.map((guide) => {
          const active = guide.id === selectedId;
          return (
            <TouchableOpacity key={guide.id} activeOpacity={0.85} onPress={() => setSelectedId(guide.id)}>
              <Card style={[styles.guideCard, active && styles.guideCardActive]}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{guide.avatar}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.guideTop}>
                    <Text style={styles.guideName}>{guide.name}</Text>
                    <Text style={styles.rating}>★ {guide.rating}</Text>
                  </View>
                  <Text style={styles.guideMeta}>{guide.city} • {guide.walks} walks</Text>
                  <Text style={styles.specialty}>{guide.specialty}</Text>
                  <Text style={styles.eta}>{guide.eta}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
      <Button label="Request selected guide" icon="checkmark-circle" onPress={() => onSelect(selected)} />
      <Button label="Skip and keep booking pending" variant="ghost" onPress={onPending} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  pendingCard: { backgroundColor: colors.ink, borderRadius: 28, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  radar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ringOuter: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' },
  ringInner: { position: 'absolute', width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)' },
  pendingTitle: { color: colors.white, fontSize: 18, fontWeight: '900' },
  pendingBody: { color: 'rgba(255,255,255,0.72)', marginTop: 4, lineHeight: 19 },
  list: { gap: 12, marginBottom: 18 },
  guideCard: { flexDirection: 'row', gap: 14, borderWidth: 2, borderColor: 'transparent' },
  guideCardActive: { borderColor: colors.gold },
  avatar: { width: 54, height: 54, borderRadius: 20, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.ink, fontWeight: '900' },
  guideTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  guideName: { color: colors.ink, fontSize: 17, fontWeight: '900', flex: 1 },
  rating: { color: colors.gold, fontWeight: '900' },
  guideMeta: { color: colors.muted, fontWeight: '700', marginTop: 2 },
  specialty: { color: colors.ink, marginTop: 8, lineHeight: 20 },
  eta: { color: colors.green, marginTop: 8, fontWeight: '900' },
});
