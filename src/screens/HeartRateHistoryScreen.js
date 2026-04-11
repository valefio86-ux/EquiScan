import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { db } from '../firebaseConfig';
import { COLORS } from '../theme/colors';

const CHART_HEIGHT = 200;
const CHART_PADDING = 40;
const MIN_BPM = 0;
const MAX_BPM = 80;

function getAlertColor(bpm) {
  if (bpm >= 28 && bpm <= 44) return COLORS.success;
  if ((bpm >= 20 && bpm < 28) || (bpm > 44 && bpm <= 52)) return COLORS.warning;
  if ((bpm >= 12 && bpm < 20) || (bpm > 52 && bpm <= 64)) return '#FF9800';
  return COLORS.error;
}

export default function HeartRateHistoryScreen({ route }) {
  const { horseId } = route.params;
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'heartRateMeasurements'),
          where('horseId', '==', horseId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
        setMeasurements(data);
      } catch (err) {
        console.error('Errore caricamento storico:', err);
        // Fallback: query senza orderBy (non richiede indice composito)
        try {
          const q2 = query(
            collection(db, 'heartRateMeasurements'),
            where('horseId', '==', horseId),
            limit(20)
          );
          const snap2 = await getDocs(q2);
          const data2 = snap2.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const ta = a.createdAt?.toMillis?.() || 0;
              const tb = b.createdAt?.toMillis?.() || 0;
              return ta - tb;
            });
          setMeasurements(data2);
        } catch (err2) {
          console.error('Errore fallback:', err2);
          setError('Errore nel caricamento dei dati.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [horseId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  const baseline = measurements.length > 0
    ? Math.round(measurements.reduce((sum, m) => sum + m.bpm, 0) / measurements.length)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Storico Battito</Text>

      {error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : measurements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nessuna misurazione registrata.</Text>
          <Text style={styles.emptyHint}>Torna alla schermata Battito Cardiaco per effettuare la prima misurazione.</Text>
        </View>
      ) : (
        <>
          {/* Baseline */}
          {baseline !== null && (
            <View style={styles.baselineCard}>
              <Text style={styles.baselineLabel}>Baseline (media)</Text>
              <Text style={[styles.baselineValue, { color: getAlertColor(baseline) }]}>{baseline} BPM</Text>
              <Text style={styles.baselineCount}>su {measurements.length} misurazioni</Text>
            </View>
          )}

          {/* Grafico */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Ultime misurazioni</Text>
            <MiniChart data={measurements} />
          </View>

          {/* Lista misurazioni */}
          <Text style={styles.sectionTitle}>Dettaglio</Text>
          {[...measurements].reverse().map((m, i) => {
            const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
            return (
              <View key={m.id} style={styles.measureCard}>
                <View style={[styles.dot, { backgroundColor: getAlertColor(m.bpm) }]} />
                <View style={styles.measureInfo}>
                  <Text style={styles.measureBpm}>{m.bpm} BPM</Text>
                  <Text style={styles.measureDate}>
                    {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.measureAlert, { color: getAlertColor(m.bpm) }]}>
                  {m.alert || '—'}
                </Text>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function MiniChart({ data }) {
  if (data.length < 2) {
    return <Text style={styles.chartHint}>Servono almeno 2 misurazioni per il grafico.</Text>;
  }

  const width = Math.max(data.length * 50, 300);
  const chartW = width - CHART_PADDING * 2;
  const chartH = CHART_HEIGHT - 40;

  const getY = (bpm) => {
    const clamped = Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));
    return chartH - ((clamped - MIN_BPM) / (MAX_BPM - MIN_BPM)) * chartH + 20;
  };
  const getX = (i) => CHART_PADDING + (i / (data.length - 1)) * chartW;

  // Zona normale (28-44)
  const normalTop = getY(44);
  const normalH = getY(28) - normalTop;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Zona normale */}
        <Rect x={CHART_PADDING} y={normalTop} width={chartW} height={normalH} fill={COLORS.success} opacity={0.1} />

        {/* Linee guida */}
        {[20, 28, 36, 44, 52, 64].map((v) => (
          <React.Fragment key={v}>
            <Line x1={CHART_PADDING} y1={getY(v)} x2={width - CHART_PADDING} y2={getY(v)} stroke={COLORS.border} strokeWidth={1} strokeDasharray="4 4" />
            <SvgText x={4} y={getY(v) + 4} fontSize={10} fill={COLORS.textLight}>{v}</SvgText>
          </React.Fragment>
        ))}

        {/* Linee tra punti */}
        {data.map((m, i) => {
          if (i === 0) return null;
          return (
            <Line
              key={`line-${i}`}
              x1={getX(i - 1)} y1={getY(data[i - 1].bpm)}
              x2={getX(i)} y2={getY(m.bpm)}
              stroke={COLORS.primary} strokeWidth={2}
            />
          );
        })}

        {/* Punti */}
        {data.map((m, i) => (
          <Circle
            key={`dot-${i}`}
            cx={getX(i)} cy={getY(m.bpm)}
            r={5} fill={getAlertColor(m.bpm)} stroke={COLORS.white} strokeWidth={2}
          />
        ))}
      </Svg>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginTop: 16, marginBottom: 8 },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 24, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  emptyText: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: 8 },
  emptyHint: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
  baselineCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  baselineLabel: { fontSize: 13, color: COLORS.textLight },
  baselineValue: { fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  baselineCount: { fontSize: 12, color: COLORS.textLight },
  chartCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 8,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  chartTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  chartHint: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', paddingVertical: 20 },
  measureCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  measureInfo: { flex: 1 },
  measureBpm: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  measureDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  measureAlert: { fontSize: 13, fontWeight: '600' },
});
