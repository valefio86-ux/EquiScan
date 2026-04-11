import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Platform, ActivityIndicator,
  Image,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// ── Le 6 zone BCS (scala Henneke) ──
const BCS_ZONES = [
  {
    key: 'neck',
    label: 'Collo',
    icon: '1',
    description: 'Valuta la cresta nuchale del collo.',
    questions: [
      { score: 1, text: 'Struttura ossea facilmente visibile, nessun grasso palpabile.' },
      { score: 3, text: 'Collo sottile ma non emaciato, leggero grasso palpabile.' },
      { score: 5, text: 'Collo ben proporzionato, cresta arrotondata e liscia.' },
      { score: 7, text: 'Grasso depositato lungo il collo, cresta ispessita.' },
      { score: 9, text: 'Cresta molto spessa e dura, grasso abbondante, possibile caduta laterale.' },
    ],
  },
  {
    key: 'withers',
    label: 'Garrese',
    icon: '2',
    description: 'Valuta l\'area del garrese (sopra le spalle).',
    questions: [
      { score: 1, text: 'Garrese molto prominente, ossatura ben visibile.' },
      { score: 3, text: 'Garrese visibile ma leggermente coperto.' },
      { score: 5, text: 'Garrese arrotondato, ben coperto di muscolo.' },
      { score: 7, text: 'Garrese coperto da grasso, difficile da individuare.' },
      { score: 9, text: 'Garrese completamente nascosto dal grasso, area gonfia.' },
    ],
  },
  {
    key: 'shoulder',
    label: 'Spalla',
    icon: '3',
    description: 'Valuta l\'area dietro la spalla.',
    questions: [
      { score: 1, text: 'Struttura ossea della spalla molto evidente.' },
      { score: 3, text: 'Spalla visibile, leggera copertura di grasso.' },
      { score: 5, text: 'Spalla ben integrata nel corpo, transizione liscia.' },
      { score: 7, text: 'Grasso depositato dietro la spalla, piega visibile.' },
      { score: 9, text: 'Grasso abbondante, spalla difficile da individuare, rigonfiamenti evidenti.' },
    ],
  },
  {
    key: 'ribs',
    label: 'Costole',
    icon: '4',
    description: 'Valuta la visibilità e palpabilità delle costole.',
    questions: [
      { score: 1, text: 'Costole molto visibili, si vedono chiaramente.' },
      { score: 3, text: 'Costole non visibili ma facilmente palpabili.' },
      { score: 5, text: 'Costole non visibili, palpabili con leggera pressione.' },
      { score: 7, text: 'Costole difficili da palpare, strato di grasso evidente.' },
      { score: 9, text: 'Costole non palpabili nemmeno con pressione, grasso spesso.' },
    ],
  },
  {
    key: 'back',
    label: 'Schiena',
    icon: '5',
    description: 'Valuta la colonna vertebrale e la linea dorsale.',
    questions: [
      { score: 1, text: 'Colonna vertebrale e processi spinosi molto prominenti.' },
      { score: 3, text: 'Colonna visibile, leggera copertura muscolare.' },
      { score: 5, text: 'Schiena piatta e liscia, colonna non visibile.' },
      { score: 7, text: 'Solco lungo la schiena, grasso ai lati della colonna.' },
      { score: 9, text: 'Solco profondo, grasso abbondante su tutta la schiena.' },
    ],
  },
  {
    key: 'tailhead',
    label: 'Coda',
    icon: '6',
    description: 'Valuta l\'area intorno all\'attaccatura della coda.',
    questions: [
      { score: 1, text: 'Ossa molto prominenti, cavità profonde ai lati.' },
      { score: 3, text: 'Attaccatura visibile, leggero grasso palpabile.' },
      { score: 5, text: 'Attaccatura liscia, grasso morbido e spugnoso.' },
      { score: 7, text: 'Grasso morbido e abbondante, ossa difficili da palpare.' },
      { score: 9, text: 'Grasso molto abbondante e sporgente, rigonfiamenti evidenti.' },
    ],
  },
];

// ── Livelli di alert BCS ──
function getBCSAlert(score) {
  if (score <= 3) return { level: 'Sottopeso', color: COLORS.warning, message: 'Monitoraggio nutrizionale consigliato. Valuta la dieta con il veterinario.' };
  if (score <= 6) return { level: 'Ideale', color: COLORS.success, message: 'Condizione corporea nella norma. Ottimo!' };
  if (score <= 7) return { level: 'Sovrappeso', color: COLORS.warning, message: 'Attenzione alla dieta. Riduci concentrati e monitora il peso.' };
  return { level: 'Obeso', color: COLORS.error, message: '⚠️ Alert metabolico! Rischio insulino-resistenza. Contatta il veterinario.' };
}

// ── Componente sagoma cavallo con immagine reale ──
const horseImage = require('../../assets/horse-standing.png');

// Zone posizionate in percentuale sulla sagoma (il cavallo guarda a destra)
const ZONE_POSITIONS = [
  { key: 'neck', top: '20%', left: '68%', label: '1' },      // Collo
  { key: 'withers', top: '6%', left: '52%', label: '2' },     // Garrese
  { key: 'shoulder', top: '44%', left: '62%', label: '3' },   // Spalla
  { key: 'ribs', top: '40%', left: '42%', label: '4' },       // Costole
  { key: 'back', top: '8%', left: '32%', label: '5' },        // Schiena
  { key: 'tailhead', top: '14%', left: '8%', label: '6' },    // Coda
];

function HorseSilhouette({ scores, activeZone, onZonePress }) {
  const getZoneColor = (key) => {
    if (activeZone === key) return COLORS.accent;
    if (scores[key] !== undefined) return COLORS.success;
    return COLORS.primaryLight;
  };

  return (
    <View style={styles.svgContainer}>
      <View style={styles.horseImageWrapper}>
        <Image
          source={horseImage}
          style={styles.horseImage}
          resizeMode="contain"
        />
        {/* Zone cliccabili sovrapposte */}
        {ZONE_POSITIONS.map((zone) => (
          <TouchableOpacity
            key={zone.key}
            style={[
              styles.zoneCircle,
              {
                top: zone.top,
                left: zone.left,
                backgroundColor: getZoneColor(zone.key),
                borderColor: activeZone === zone.key ? COLORS.accent : COLORS.primary,
                borderWidth: activeZone === zone.key ? 3 : 1.5,
              },
            ]}
            activeOpacity={0.7}
            onPress={() => onZonePress(zone.key)}
          >
            <Text style={styles.zoneLabel}>{zone.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
// ── Schermata principale BCS ──
export default function BCSScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [scores, setScores] = useState({});
  const [activeZone, setActiveZone] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const completedCount = Object.keys(scores).length;
  const allCompleted = completedCount === 6;

  const handleZonePress = (zoneKey) => {
    setActiveZone(zoneKey);
    setResult(null);
  };

  const handleScoreSelect = (zoneKey, score) => {
    setScores((prev) => ({ ...prev, [zoneKey]: score }));
    // Avanza alla zona successiva
    const currentIdx = BCS_ZONES.findIndex((z) => z.key === zoneKey);
    const nextUncompleted = BCS_ZONES.find(
      (z, i) => i > currentIdx && scores[z.key] === undefined
    );
    if (nextUncompleted) {
      setTimeout(() => setActiveZone(nextUncompleted.key), 300);
    } else {
      setTimeout(() => setActiveZone(null), 300);
    }
  };

  const calculateBCS = () => {
    const total = Object.values(scores).reduce((sum, s) => sum + s, 0);
    return Math.round(total / 6);
  };

  const handleSave = async () => {
    if (!allCompleted) return;
    const bcsScore = calculateBCS();
    const alertInfo = getBCSAlert(bcsScore);
    setSaving(true);

    try {
      await addDoc(collection(db, 'bcsMeasurements'), {
        horseId,
        userId: user.uid,
        scores,
        bcsScore,
        alertLevel: alertInfo.level,
        createdAt: serverTimestamp(),
      });
      setResult({ bcsScore, alert: alertInfo });
    } catch (error) {
      const msg = 'Errore nel salvataggio. Riprova.';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Errore', msg); }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setScores({});
    setActiveZone(null);
    setResult(null);
  };

  const activeZoneData = BCS_ZONES.find((z) => z.key === activeZone);

  // ── Schermata risultato ──
  if (result) {
    const { bcsScore, alert: alertInfo } = result;
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={[styles.resultCard, { borderColor: alertInfo.color }]}>
          <Text style={styles.resultTitle}>Punteggio BCS</Text>
          <View style={[styles.resultBadge, { backgroundColor: alertInfo.color }]}>
            <Text style={styles.resultScore}>{bcsScore}</Text>
            <Text style={styles.resultMax}>/9</Text>
          </View>
          <Text style={[styles.resultLevel, { color: alertInfo.color }]}>{alertInfo.level}</Text>
          <Text style={styles.resultMessage}>{alertInfo.message}</Text>

          {/* Riepilogo zone */}
          <View style={styles.zoneSummary}>
            {BCS_ZONES.map((zone) => (
              <View key={zone.key} style={styles.zoneSummaryRow}>
                <Text style={styles.zoneSummaryLabel}>{zone.icon}. {zone.label}</Text>
                <Text style={styles.zoneSummaryScore}>{scores[zone.key]}/9</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
          <Text style={styles.primaryButtonText}>Nuova Valutazione</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('BCSHistory', { horseId })}
        >
          <Text style={styles.secondaryButtonText}>📊 Storico BCS</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Schermata di valutazione ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Istruzioni */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Body Condition Score (Henneke)</Text>
        <Text style={styles.infoText}>
          Tocca ogni zona numerata sulla sagoma per valutare la condizione corporea del cavallo.
          Per ogni zona, scegli la descrizione che corrisponde meglio.
        </Text>
      </View>

      {/* Pulsante Storico */}
      <TouchableOpacity
        style={[styles.secondaryButton, { marginBottom: 16 }]}
        onPress={() => navigation.navigate('BCSHistory', { horseId })}
      >
        <Text style={styles.secondaryButtonText}>📊 Storico BCS</Text>
      </TouchableOpacity>

      {/* Progresso */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(completedCount / 6) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>{completedCount}/6 zone completate</Text>

      {/* Sagoma cavallo con zone */}
      <HorseSilhouette
        scores={scores}
        activeZone={activeZone}
        onZonePress={handleZonePress}
      />

      {/* Legenda zone */}
      <View style={styles.legendContainer}>
        {BCS_ZONES.map((zone) => (
          <TouchableOpacity
            key={zone.key}
            style={[
              styles.legendItem,
              activeZone === zone.key && styles.legendItemActive,
              scores[zone.key] !== undefined && styles.legendItemCompleted,
            ]}
            onPress={() => handleZonePress(zone.key)}
          >
            <Text style={styles.legendNumber}>{zone.icon}</Text>
            <Text style={styles.legendLabel}>{zone.label}</Text>
            {scores[zone.key] !== undefined && (
              <Text style={styles.legendScore}>{scores[zone.key]}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Pannello domande per zona attiva */}
      {activeZoneData && (
        <View style={styles.questionPanel}>
          <Text style={styles.questionTitle}>
            {activeZoneData.icon}. {activeZoneData.label}
          </Text>
          <Text style={styles.questionDesc}>{activeZoneData.description}</Text>

          {activeZoneData.questions.map((q) => (
            <TouchableOpacity
              key={q.score}
              style={[
                styles.questionOption,
                scores[activeZoneData.key] === q.score && styles.questionOptionSelected,
              ]}
              onPress={() => handleScoreSelect(activeZoneData.key, q.score)}
            >
              <View style={[
                styles.scoreBadge,
                scores[activeZoneData.key] === q.score && styles.scoreBadgeSelected,
              ]}>
                <Text style={[
                  styles.scoreBadgeText,
                  scores[activeZoneData.key] === q.score && styles.scoreBadgeTextSelected,
                ]}>{q.score}</Text>
              </View>
              <Text style={[
                styles.questionText,
                scores[activeZoneData.key] === q.score && styles.questionTextSelected,
              ]}>{q.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Tasto salva */}
      {allCompleted && !activeZone && (
        <TouchableOpacity
          style={[styles.primaryButton, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Salva Valutazione BCS</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Stili ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },

  // Info card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },

  // Progress bar
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },

  // SVG container → Image container
  svgContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  horseImageWrapper: {
    width: 300,
    height: 280,
    position: 'relative',
    alignSelf: 'center',
  },
  horseImage: {
    width: '100%',
    height: '100%',
    opacity: 0.2,
    tintColor: COLORS.primary,
  },
  zoneCircle: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.9,
  },
  zoneLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  legendItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendItemActive: { borderColor: COLORS.accent, borderWidth: 2 },
  legendItemCompleted: { borderColor: COLORS.success, backgroundColor: '#E8F5E9' },
  legendNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginRight: 8, width: 20 },
  legendLabel: { fontSize: 14, color: COLORS.text, flex: 1 },
  legendScore: { fontSize: 14, fontWeight: 'bold', color: COLORS.success },

  // Question panel
  questionPanel: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  questionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 4 },
  questionDesc: { fontSize: 14, color: COLORS.textLight, marginBottom: 16 },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionOptionSelected: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  scoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreBadgeSelected: { backgroundColor: COLORS.success },
  scoreBadgeText: { fontSize: 14, fontWeight: 'bold', color: COLORS.textLight },
  scoreBadgeTextSelected: { color: COLORS.white },
  questionText: { fontSize: 13, color: COLORS.text, flex: 1, lineHeight: 18 },
  questionTextSelected: { fontWeight: '600' },

  // Result
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 20,
  },
  resultTitle: { fontSize: 16, color: COLORS.textLight, marginBottom: 16 },
  resultBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  resultScore: { fontSize: 42, fontWeight: 'bold', color: COLORS.white },
  resultMax: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginTop: 10 },
  resultLevel: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  resultMessage: { fontSize: 14, color: COLORS.text, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  zoneSummary: { width: '100%', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  zoneSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  zoneSummaryLabel: { fontSize: 14, color: COLORS.text },
  zoneSummaryScore: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
