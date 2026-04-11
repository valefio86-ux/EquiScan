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

const QUADRANT_LABELS = {
  topRight: 'Sup. DX',
  bottomRight: 'Inf. DX',
  topLeft: 'Sup. SX',
  bottomLeft: 'Inf. SX',
};

const SCORE_LABELS = ['Assenti', 'Ridotti', 'Normali', 'Aumentati'];

function getAlertColor(level) {
  if (level === 'Normale') return COLORS.success;
  if (level === 'Attenzione') return COLORS.warning;
  if (level === 'Critico') return '#FF9800';
  return COLORS.error;
}

function getAlertFromScores(scores) {
  const values = Object.values(scores);
  const zeros = values.filter(v => v === 0).length;
  const ones = values.filter(v => v === 1).length;
  const threes = values.filter(v => v === 3).length;
  if (zeros >= 2) return 'Emergency';
  if (ones >= 3) return 'Critico';
  if (threes >= 2 || zeros >= 1) return 'Attenzione';
  return 'Normale';
}

export default function BorborigmiHistoryScreen({ route }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, 'borborigmiMeasurements'),
          where('horseId', '==', horseId),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse();
        setMeasurements(data);
      } catch (err) {
        try {
          const q2 = query(
            collection(db, 'borborigmiMeasurements'),
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
    ? Math.round(measurements.reduce((sum, m) => sum + m.totalScore, 0) / measurements.length * 10) / 10
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>📊 Storico Borborigmi</Text>

      {error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : measurements.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nessuna auscultazione registrata.</Text>
          <Text style={styles.emptyHint}>Torna alla schermata Borborigmi per effettuare la prima valutazione.</Text>
        </View>
      ) : (
        <>
          {average !== null && (
            <View style={styles.baselineCard}>
              <Text style={styles.baselineLabel}>Media Totale</Text>
              <Text style={[styles.baselineValue, { color: COLORS.primary }]}>
                {average}/12
              </Text>
              <Text style={styles.baselineCount}>su {measurements.length} auscultazioni</Text>
            </View>
          )}

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Andamento nel tempo</Text>
            <BorborigmiChart data={measurements} />
          </View>

          <Text style={styles.sectionTitle}>Dettaglio</Text>
          {[...measurements].reverse().map((m) => {
            const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
            const level = m.alertLevel || getAlertFromScores(m.scores || {});
            return (
              <View key={m.id} style={styles.measureCard}>
                <View style={[styles.scoreBadge, { backgroundColor: getAlertColor(level) }]}>
                  <Text style={styles.scoreBadgeText}>{m.totalScore}</Text>
                </View>
                <View style={styles.measureInfo}>
                  <Text style={styles.measureScore}>{m.totalScore}/12 — {level}</Text>
                  <Text style={styles.measureDate}>
                    {date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {m.scores && (
                    <Text style={styles.measureZones}>
                      {Object.entries(m.scores).map(([k, v]) => `${QUADRANT_LABELS[k] || k}: ${SCORE_LABELS[v]}`).join(' · ')}
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

function BorborigmiChart({ data }) {
  if (data.length < 2) {
    return <Text style={styles.chartHint}>Servono almeno 2 valutazioni per il grafico.</Text>;
  }

  const width = Math.max(data.length * 60, 300);
  const chartW = width - CHART_PADDING * 2;
  const chartH = CHART_HEIGHT - 40;

  const getY = (score) => {
    const clamped = Math.max(0, Math.min(12, score));
    return chartH - (clamped / 12) * chartH + 20;
  };
  const getX = (i) => CHART_PADDING + (i / (data.length - 1)) * chartW;

  // Zona normale: 8 (tutti normali = 2*4=8)
  const idealTop = getY(8);
  const idealH = getY(6) - idealTop;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <Svg width={width} height={CHART_HEIGHT}>
        <Rect x={CHART_PADDING} y={idealTop} width={chartW} height={idealH} fill={COLORS.success} opacity={0.1} />

        {[0, 4, 6, 8, 12].map((v) => (
          <React.Fragment key={v}>
            <Line x1={CHART_PADDING} y1={getY(v)} x2={width - CHART_PADDING} y2={getY(v)} stroke={COLORS.border} strokeWidth={1} strokeDasharray="4 4" />
            <SvgText x={4} y={getY(v) + 4} fontSize={10} fill={COLORS.textLight}>{v}</SvgText>
          </React.Fragment>
        ))}

        {data.map((m, i) => {
          if (i === 0) return null;
          return (
            <Line
              key={`line-${i}`}
              x1={getX(i - 1)} y1={getY(data[i - 1].totalScore)}
              x2={getX(i)} y2={getY(m.totalScore)}
              stroke={COLORS.primary} strokeWidth={2}
            />
          );
        })}

        {data.map((m, i) => {
          const level = m.alertLevel || 'Normale';
          return (
            <Circle
              key={`dot-${i}`}
              cx={getX(i)} cy={getY(m.totalScore)}
              r={6} fill={getAlertColor(level)} stroke={COLORS.white} strokeWidth={2}
            />
          );
        })}

        {data.map((m, i) => {
          const date = m.createdAt?.toDate ? m.createdAt.toDate() : new Date();
          return (
            <SvgText
              key={`label-${i}`}
              x={getX(i)} y={CHART_HEIGHT - 4}
              textAnchor="middle" fontSize={9} fill={COLORS.textLight}
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
