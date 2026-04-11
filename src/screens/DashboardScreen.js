import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS } from '../theme/colors';
import HealthGauge from '../components/HealthGauge';

// Moduli che verranno implementati nelle fasi successive
const MODULES = [
  { key: 'heart', icon: '❤️', title: 'Battito Cardiaco', unit: 'BPM', phase: 4, screen: 'HeartRate' },
  { key: 'bcs', icon: '⚖️', title: 'Body Condition', unit: '/9', phase: 5, screen: 'BCS' },
  { key: 'pain', icon: '😣', title: 'Scala Dolore', unit: '/12', phase: 6, screen: null },
  { key: 'gut', icon: '🔊', title: 'Borborigmi', unit: '/12', phase: 7, screen: null },
  { key: 'diet', icon: '🥕', title: 'Dieta', unit: '', phase: 8, screen: null },
];

export default function DashboardScreen({ route, navigation }) {
  const { horseId } = route.params;
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestValues, setLatestValues] = useState({ heart: null, bcs: null });

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

  // Carica ultimi valori misurazioni
  useEffect(() => {
    const fetchLatest = async () => {
      const results = {};

      // Ultimo battito cardiaco
      try {
        const hq = query(
          collection(db, 'heartRateMeasurements'),
          where('horseId', '==', horseId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const hSnap = await getDocs(hq);
        if (!hSnap.empty) {
          results.heart = hSnap.docs[0].data().bpm;
        }
      } catch (e) {
        try {
          const hq2 = query(
            collection(db, 'heartRateMeasurements'),
            where('horseId', '==', horseId),
            limit(5)
          );
          const hSnap2 = await getDocs(hq2);
          if (!hSnap2.empty) {
            const sorted = hSnap2.docs
              .map(d => d.data())
              .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            results.heart = sorted[0].bpm;
          }
        } catch (_) { /* ignore */ }
      }

      // Ultimo BCS
      try {
        const bq = query(
          collection(db, 'bcsMeasurements'),
          where('horseId', '==', horseId),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
        const bSnap = await getDocs(bq);
        if (!bSnap.empty) {
          results.bcs = bSnap.docs[0].data().bcsScore;
        }
      } catch (e) {
        try {
          const bq2 = query(
            collection(db, 'bcsMeasurements'),
            where('horseId', '==', horseId),
            limit(5)
          );
          const bSnap2 = await getDocs(bq2);
          if (!bSnap2.empty) {
            const sorted = bSnap2.docs
              .map(d => d.data())
              .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
            results.bcs = sorted[0].bcsScore;
          }
        } catch (_) { /* ignore */ }
      }

      setLatestValues(prev => ({ ...prev, ...results }));
    };

    fetchLatest();
  }, [horseId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!horse) return null;

  // Calcola punteggio salute basato sui dati disponibili
  const scores = [];
  if (latestValues.heart != null) {
    // BPM ideale cavallo a riposo: 28-44
    if (latestValues.heart >= 28 && latestValues.heart <= 44) scores.push(100);
    else if (latestValues.heart >= 20 && latestValues.heart <= 52) scores.push(70);
    else if (latestValues.heart >= 12 && latestValues.heart <= 60) scores.push(40);
    else scores.push(15);
  }
  if (latestValues.bcs != null) {
    // BCS ideale: 4-6
    if (latestValues.bcs >= 4 && latestValues.bcs <= 6) scores.push(100);
    else if (latestValues.bcs === 3 || latestValues.bcs === 7) scores.push(60);
    else scores.push(25);
  }
  const healthScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const getCardValue = (mod) => {
    const val = latestValues[mod.key];
    if (val == null) return '—';
    return `${val}`;
  };

  const getCardStatus = (mod) => {
    const val = latestValues[mod.key];
    if (val == null) return `Fase ${mod.phase}`;
    if (mod.key === 'heart') {
      if (val >= 28 && val <= 44) return 'Normale';
      if (val >= 20 && val <= 52) return 'Attenzione';
      return 'Critico';
    }
    if (mod.key === 'bcs') {
      if (val >= 4 && val <= 6) return 'Ideale';
      if (val <= 3) return 'Sottopeso';
      if (val === 7) return 'Sovrappeso';
      return 'Obeso';
    }
    return `Fase ${mod.phase}`;
  };

  const getStatusColor = (mod) => {
    const val = latestValues[mod.key];
    if (val == null) return COLORS.textLight;
    if (mod.key === 'heart') {
      if (val >= 28 && val <= 44) return COLORS.success;
      if (val >= 20 && val <= 52) return COLORS.warning;
      return COLORS.error;
    }
    if (mod.key === 'bcs') {
      if (val >= 4 && val <= 6) return COLORS.success;
      if (val <= 3 || val === 7) return COLORS.warning;
      return COLORS.error;
    }
    return COLORS.textLight;
  };

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
          <TouchableOpacity
            key={mod.key}
            style={[styles.card, mod.screen && styles.cardActive]}
            activeOpacity={0.7}
            onPress={() => mod.screen && navigation.navigate(mod.screen, { horseId: horse.id })}
          >
            <Text style={styles.cardIcon}>{mod.icon}</Text>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={[styles.cardValue, latestValues[mod.key] != null && { color: getStatusColor(mod) }]}>
              {getCardValue(mod)}{latestValues[mod.key] != null ? ` ${mod.unit}` : ''}
            </Text>
            <Text style={[styles.cardStatus, { color: getStatusColor(mod) }]}>{getCardStatus(mod)}</Text>
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
  cardActive: { borderWidth: 1, borderColor: COLORS.primary },
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
