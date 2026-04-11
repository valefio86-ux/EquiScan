import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Svg, { Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const CHART_HEIGHT = 200;
const CHART_PADDING = 40;
const MIN_BCS = 0;
const MAX_BCS = 9;

function getAlertColor(score) {
  if (score <= 3) return COLORS.warning;
  if (score <= 6) return COLORS.success;
  if (score <= 7) return COLORS.warning;
  return COLORS.error;
}

function getAlertLabel(score) {
  if (score <= 3) return 'Sottopeso';
  if (score <= 6) return 'Ideale';
  if (score <= 7) return 'Sovrappeso';
  return 'Obeso';
}

const ZONE_LABELS = {
  neck: 'Collo',
  withers: 'Garrese',
  shoulder: 'Spalla',
  ribs: 'Costole',
  back: 'Schiena',
  tailhead: 'Coda',
};

export default function BCSHistoryScreen({ route }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'bcsMeasurements'),
          where('horseId', '==', horseId),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
        setMeasurements(data);
      } catch (err) {
        console.error('Errore caricamento storico BCS:', err);
        try {
          const q2 = query(
            collection(db, 'bcsMeasurements'),
            where('horseId', '==', horseId),
            where('userId', '==', user.uid),
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

  const average = measurements.length > 0
    ? Math.round(measurements.reduce((sum, m) => sum + m.bcsScore, 0) / measurements.length * 10) / 10
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Storico BCS</Text>

      {error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : measurements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nessuna valutazione BCS registrata.</Text>
          <Text style={styles.emptyHint}>Torna alla schermata Body Condition Score per effettuare la prima valutazione.</Text>
        </View>
      ) : (
        <>
          {/* Media */}
          {average !== null && (
            <View style={styles.baselineCard}>
              <Text style={styles.baselineLabel}>Media BCS</Text>
              <Text style={[styles.baselineValue, { color: getAlertColor(Math.round(average)) }]}>
                {average}/9
              </Text>
              <Text style={[styles.baselineLevel, { color: getAlertColor(Math.round(average)) }]}>
                {getAlertLabel(Math.round(average))}
              </Text>
              <Text style={styles.baselineCount}>su {measurements.length} valutazioni</Text>
            </View>
          )}

          {/* Grafico */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Andamento nel tempo</Text>
            <BCSChart data={measurements} />
          </View>

          {/* Lista valutazioni */}
          <Text style={styles.sectionTitle}>Dettaglio</Text>
          {[...measurements].reverse().map((m) => {
            const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
            return (
              <View key={m.id} style={styles.measureCard}>
                <View style={[styles.scoreBadge, { backgroundColor: getAlertColor(m.bcsScore) }]}>
                  <Text style={styles.scoreBadgeText}>{m.bcsScore}</Text>
                </View>
                <View style={styles.measureInfo}>
                  <Text style={styles.measureScore}>BCS {m.bcsScore}/9 — {getAlertLabel(m.bcsScore)}</Text>
                  <Text style={styles.measureDate}>
                    {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {m.scores && (
                    <Text style={styles.measureZones}>
                      {Object.entries(m.scores).map(([k, v]) => `${ZONE_LABELS[k] || k}: ${v}`).join(' · ')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

function BCSChart({ data }) {
  if (data.length < 2) {
    return <Text style={styles.chartHint}>Servono almeno 2 valutazioni per il grafico.</Text>;
  }

  const width = Math.max(data.length * 60, 300);
  const chartW = width - CHART_PADDING * 2;
  const chartH = CHART_HEIGHT - 40;

  const getY = (score) => {
    const clamped = Math.max(MIN_BCS, Math.min(MAX_BCS, score));
    return chartH - ((clamped - MIN_BCS) / (MAX_BCS - MIN_BCS)) * chartH + 20;
  };
  const getX = (i) => CHART_PADDING + (i / (data.length - 1)) * chartW;

  // Zona ideale (4-6)
  const idealTop = getY(6);
  const idealH = getY(4) - idealTop;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={CHART_HEIGHT}>
        {/* Zona ideale */}
        <Rect x={CHART_PADDING} y={idealTop} width={chartW} height={idealH} fill={COLORS.success} opacity={0.1} />

        {/* Linee guida */}
        {[1, 3, 4, 6, 7, 9].map((v) => (
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
              x1={getX(i - 1)} y1={getY(data[i - 1].bcsScore)}
              x2={getX(i)} y2={getY(m.bcsScore)}
              stroke={COLORS.primary} strokeWidth={2}
            />
          );
        })}

        {/* Punti */}
        {data.map((m, i) => (
          <Circle
            key={`dot-${i}`}
            cx={getX(i)} cy={getY(m.bcsScore)}
            r={6} fill={getAlertColor(m.bcsScore)} stroke={COLORS.white} strokeWidth={2}
          />
        ))}

        {/* Etichette date */}
        {data.map((m, i) => {
          const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
          return (
            <SvgText
              key={`label-${i}`}
              x={getX(i)}
              y={CHART_HEIGHT - 4}
              textAnchor="middle"
              fontSize={9}
              fill={COLORS.textLight}
            >
              {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </SvgText>
          );
        })}
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
  baselineLevel: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
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
  scoreBadge: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  scoreBadgeText: { fontSize: 18, fontWeight: 'bold', color: COLORS.white },
  measureInfo: { flex: 1 },
  measureScore: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  measureDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  measureZones: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
});
