import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS } from '../theme/colors';
import HealthGauge from '../components/HealthGauge';

// Moduli che verranno implementati nelle fasi successive
const MODULES = [
  { key: 'heart', icon: '❤️', title: 'Battito Cardiaco', unit: 'BPM', phase: 4 },
  { key: 'bcs', icon: '⚖️', title: 'Body Condition', unit: '/9', phase: 5 },
  { key: 'pain', icon: '😣', title: 'Scala Dolore', unit: '/12', phase: 6 },
  { key: 'gut', icon: '🔊', title: 'Borborigmi', unit: '/12', phase: 7 },
  { key: 'diet', icon: '🥕', title: 'Dieta', unit: '', phase: 8 },
];

export default function DashboardScreen({ route, navigation }) {
  const { horseId } = route.params;
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'horses', horseId), (snap) => {
      if (snap.exists()) {
        setHorse({ id: snap.id, ...snap.data() });
      } else {
        navigation.goBack();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [horseId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!horse) return null;

  // Per ora il punteggio è null (nessun dato). Si collegherà nelle fasi 4-8.
  const healthScore = null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Nome cavallo */}
      <Text style={styles.horseName}>{horse.name}</Text>
      <Text style={styles.horseInfo}>
        {[horse.breed, horse.sex, horse.age ? `${horse.age} anni` : null].filter(Boolean).join(' · ')}
      </Text>

      {/* Gauge centrale */}
      <View style={styles.gaugeContainer}>
        <HealthGauge score={healthScore} />
        <Text style={styles.gaugeLabel}>Stato di Salute</Text>
      </View>

      {/* Card parametri */}
      <Text style={styles.sectionTitle}>Parametri</Text>
      <View style={styles.cardsGrid}>
        {MODULES.map((mod) => (
          <TouchableOpacity key={mod.key} style={styles.card} activeOpacity={0.7}>
            <Text style={styles.cardIcon}>{mod.icon}</Text>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardValue}>—</Text>
            <Text style={styles.cardStatus}>Fase {mod.phase}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pulsanti azioni */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('HorseDetail', { horseId: horse.id })}
      >
        <Text style={styles.profileButtonText}>Profilo Completo</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  horseName: { fontSize: 26, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginTop: 8 },
  horseInfo: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20 },
  gaugeContainer: { alignItems: 'center', marginBottom: 24 },
  gaugeLabel: { fontSize: 13, color: COLORS.textLight, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    width: '48%', flexGrow: 1, flexBasis: '45%',
    alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardIcon: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4, textAlign: 'center' },
  cardValue: { fontSize: 22, fontWeight: 'bold', color: COLORS.textLight, marginBottom: 2 },
  cardStatus: { fontSize: 11, color: COLORS.textLight },
  profileButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  profileButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
});
