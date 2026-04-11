import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const TIMER_SECONDS = 15;

const INSTRUCTIONS = [
  { icon: '1️⃣', text: 'Posizionati vicino al cavallo in un momento di calma.' },
  { icon: '2️⃣', text: 'Trova il polso: sotto la mandibola (arteria facciale) o dietro il gomito sinistro (cuore).' },
  { icon: '3️⃣', text: 'Premi "Inizia Misurazione" e tocca il bottone ogni volta che senti un battito.' },
  { icon: '4️⃣', text: `Il timer dura ${TIMER_SECONDS} secondi. L'app calcolerà i BPM automaticamente.` },
];

const REFERENCE = [
  { label: 'Adulto a riposo', value: '28–44 BPM', color: COLORS.success },
  { label: 'Puledro', value: '80–120 BPM', color: COLORS.success },
  { label: 'Dopo esercizio', value: 'fino a 200 BPM', color: COLORS.warning },
  { label: 'Attenzione', value: '> 48 BPM a riposo', color: COLORS.error },
];

// Alert a 4 livelli per cavallo adulto a riposo
function getAlertLevel(bpm) {
  if (bpm >= 28 && bpm <= 44) return { level: 'Verde', color: COLORS.success, message: 'Battito nella norma.' };
  if ((bpm >= 20 && bpm < 28) || (bpm > 44 && bpm <= 52)) return { level: 'Giallo', color: COLORS.warning, message: 'Leggermente fuori norma. Tieni sotto controllo.' };
  if ((bpm >= 12 && bpm < 20) || (bpm > 52 && bpm <= 64)) return { level: 'Arancione', color: '#FF9800', message: 'Fuori norma. Consiglia visita veterinaria.' };
  return { level: 'Rosso', color: COLORS.error, message: 'Valore critico! Contatta il veterinario.' };
}

export default function HeartRateScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [phase, setPhase] = useState('instructions');
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [tapCount, setTapCount] = useState(0);
  const [bpm, setBpm] = useState(null);
  const [alert, setAlert] = useState(null);
  const [baseline, setBaseline] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startMeasuring = () => {
    setPhase('measuring');
    setTapCount(0);
    setTimeLeft(TIMER_SECONDS);
    setBpm(null);
    setAlert(null);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          // Il calcolo avviene nel useEffect sotto
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Quando il timer arriva a 0, calcola BPM
  useEffect(() => {
    if (phase === 'measuring' && timeLeft === 0) {
      const calculatedBpm = tapCount * (60 / TIMER_SECONDS);
      const rounded = Math.round(calculatedBpm);
      setBpm(rounded);
      setAlert(getAlertLevel(rounded));
      setPhase('result');
      saveMeasurement(rounded);
    }
  }, [timeLeft, phase]);

  const saveMeasurement = async (bpmValue) => {
    setSaving(true);
    try {
      await addDoc(collection(db, 'heartRateMeasurements'), {
        horseId,
        userId: user.uid,
        bpm: bpmValue,
        tapCount,
        timerSeconds: TIMER_SECONDS,
        alert: getAlertLevel(bpmValue).level,
        createdAt: serverTimestamp(),
      });
      // Calcola baseline (media ultime 10 misurazioni)
      await loadBaseline();
    } catch (error) {
      // Salvataggio fallito silenziosamente
    } finally {
      setSaving(false);
    }
  };

  const loadBaseline = async () => {
    try {
      const q = query(
        collection(db, 'heartRateMeasurements'),
        where('horseId', '==', horseId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const values = snap.docs.map((d) => d.data().bpm);
        const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        setBaseline(avg);
      }
    } catch (error) {
      // Errore lettura baseline
    }
  };

  const handleTap = () => {
    if (timeLeft > 0) setTapCount((prev) => prev + 1);
  };

  const resetToInstructions = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('instructions');
    setTimeLeft(TIMER_SECONDS);
    setTapCount(0);
    setBpm(null);
    setAlert(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* === FASE: ISTRUZIONI === */}
      {phase === 'instructions' && (
        <>
          <Text style={styles.title}>❤️ Monitoraggio Cardiaco</Text>
          <Text style={styles.subtitle}>Come misurare il battito del tuo cavallo</Text>

          <View style={styles.card}>
            {INSTRUCTIONS.map((item, i) => (
              <View key={i} style={styles.instructionRow}>
                <Text style={styles.instructionIcon}>{item.icon}</Text>
                <Text style={styles.instructionText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Valori di riferimento</Text>
          <View style={styles.card}>
            {REFERENCE.map((item, i) => (
              <View key={i} style={styles.refRow}>
                <Text style={styles.refLabel}>{item.label}</Text>
                <Text style={[styles.refValue, { color: item.color }]}>{item.value}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.startButton} onPress={startMeasuring}>
            <Text style={styles.startButtonText}>Inizia Misurazione</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('HeartRateHistory', { horseId })}
          >
            <Text style={styles.historyButtonText}>📊 Storico Misurazioni</Text>
          </TouchableOpacity>
        </>
      )}

      {/* === FASE: MISURAZIONE (TAP) === */}
      {phase === 'measuring' && (
        <View style={styles.measuringContainer}>
          <Text style={styles.timerText}>{timeLeft}</Text>
          <Text style={styles.timerLabel}>secondi rimasti</Text>

          <TouchableOpacity
            style={styles.tapButton}
            onPress={handleTap}
            activeOpacity={0.6}
          >
            <Text style={styles.tapIcon}>❤️</Text>
            <Text style={styles.tapText}>TAP</Text>
          </TouchableOpacity>

          <Text style={styles.tapCount}>{tapCount} battiti</Text>

          <TouchableOpacity style={styles.cancelButton} onPress={resetToInstructions}>
            <Text style={styles.cancelButtonText}>Annulla</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* === FASE: RISULTATO === */}
      {phase === 'result' && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultBpm}>{bpm}</Text>
          <Text style={styles.resultUnit}>BPM</Text>

          {alert && (
            <View style={[styles.alertCard, { borderLeftColor: alert.color }]}>
              <Text style={[styles.alertLevel, { color: alert.color }]}>{alert.level}</Text>
              <Text style={styles.alertMessage}>{alert.message}</Text>
            </View>
          )}

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Battiti contati</Text>
              <Text style={styles.detailValue}>{tapCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Durata</Text>
              <Text style={styles.detailValue}>{TIMER_SECONDS} sec</Text>
            </View>
            {baseline !== null && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Baseline (media)</Text>
                <Text style={styles.detailValue}>{baseline} BPM</Text>
              </View>
            )}
          </View>

          {saving && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 10 }} />}

          <TouchableOpacity style={styles.startButton} onPress={startMeasuring}>
            <Text style={styles.startButtonText}>Misura di nuovo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('HeartRateHistory', { horseId })}
          >
            <Text style={styles.historyButtonText}>📊 Storico Misurazioni</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={resetToInstructions}>
            <Text style={styles.backButtonText}>Torna alle istruzioni</Text>
          </TouchableOpacity>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 20, marginBottom: 8 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  instructionIcon: { fontSize: 20, marginRight: 10, marginTop: 2 },
  instructionText: { fontSize: 15, color: COLORS.text, flex: 1, lineHeight: 22 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  refLabel: { fontSize: 14, color: COLORS.text },
  refValue: { fontSize: 14, fontWeight: '600' },
  startButton: {
    backgroundColor: COLORS.error, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 24,
  },
  startButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },

  // Misurazione
  measuringContainer: { alignItems: 'center', paddingTop: 30 },
  timerText: { fontSize: 72, fontWeight: 'bold', color: COLORS.primary },
  timerLabel: { fontSize: 16, color: COLORS.textLight, marginBottom: 30 },
  tapButton: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: COLORS.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  tapIcon: { fontSize: 48 },
  tapText: { fontSize: 28, fontWeight: 'bold', color: COLORS.white, marginTop: 4 },
  tapCount: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginTop: 24 },
  cancelButton: { marginTop: 20 },
  cancelButtonText: { fontSize: 16, color: COLORS.textLight },

  // Risultato
  resultContainer: { alignItems: 'center', paddingTop: 20 },
  resultBpm: { fontSize: 80, fontWeight: 'bold', color: COLORS.text },
  resultUnit: { fontSize: 20, color: COLORS.textLight, marginBottom: 16 },
  alertCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, width: '100%',
    borderLeftWidth: 5, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  alertLevel: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  alertMessage: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  detailCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, width: '100%',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  detailLabel: { fontSize: 14, color: COLORS.textLight },
  detailValue: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  backButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12,
  },
  backButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  historyButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12,
  },
  historyButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
});
