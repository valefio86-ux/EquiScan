import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// ── 4 Quadranti ──
const QUADRANTS = [
  { key: 'topRight', label: 'Sup. Destro', zone: 'Ceco', desc: 'Suono idroaereo ("sciacquone")', position: 'Fianco destro, dietro l\'ultima costola, parte alta' },
  { key: 'bottomRight', label: 'Inf. Destro', zone: 'Grosso Colon', desc: 'Suoni di fermentazione', position: 'Fianco destro, sotto la linea mediana' },
  { key: 'topLeft', label: 'Sup. Sinistro', zone: 'Piccolo Colon/Tenue', desc: 'Suoni più acuti', position: 'Fianco sinistro, dietro l\'ultima costola, parte alta' },
  { key: 'bottomLeft', label: 'Inf. Sinistro', zone: 'Grosso Colon', desc: 'Suoni di transito', position: 'Fianco sinistro, sotto la linea mediana' },
];

const SCORE_OPTIONS = [
  { score: 0, label: 'Assenti', desc: 'Silenzio ileale — possibile blocco o torsione', color: COLORS.error },
  { score: 1, label: 'Ridotti', desc: 'Ipomotilità — inizio colica o disidratazione', color: COLORS.warning },
  { score: 2, label: 'Normali', desc: 'Motilità regolare', color: COLORS.success },
  { score: 3, label: 'Aumentati', desc: 'Ipermotilità — possibile colica gassosa o irritazione', color: '#FF9800' },
];

function getBorborigmiAlert(scores) {
  const values = Object.values(scores);
  const zerosCount = values.filter(v => v === 0).length;
  const onesCount = values.filter(v => v === 1).length;
  const threesCount = values.filter(v => v === 3).length;

  if (zerosCount >= 2) {
    return {
      level: 'Emergency',
      color: COLORS.error,
      message: '🚨 EMERGENZA: ≥2 quadranti silenti. Possibile blocco o torsione intestinale. Contatta SUBITO il veterinario.',
    };
  }
  if (onesCount >= 3) {
    return {
      level: 'Critico',
      color: '#FF9800',
      message: '⚠️ CRITICO: ≥3 quadranti con suoni ridotti. Possibile colica in evoluzione. Monitora battito cardiaco e controlla ogni 15 min.',
    };
  }
  if (threesCount >= 2) {
    return {
      level: 'Attenzione',
      color: COLORS.warning,
      message: '⚠️ Suoni aumentati in più quadranti. Possibile colica gassosa o irritazione. Ricontrolla tra 30 min.',
    };
  }
  if (zerosCount >= 1) {
    return {
      level: 'Attenzione',
      color: COLORS.warning,
      message: '⚠️ Un quadrante silente. Monitora la situazione e ricontrolla tra 30 min.',
    };
  }
  return {
    level: 'Normale',
    color: COLORS.success,
    message: 'Motilità intestinale nella norma. Continuare il monitoraggio di routine.',
  };
}

export default function BorborigmiScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [phase, setPhase] = useState('guide'); // guide → evaluate → summary → result
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [totalScore, setTotalScore] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // Audio
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const timerRef = useRef(null);
  const [recordSeconds, setRecordSeconds] = useState(0);

  const [step, setStep] = useState(0); // 0-3 = quadrant index

  const completedCount = Object.keys(scores).length;
  const allCompleted = completedCount === 4;

  // ── Registrazione audio ──
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        if (Platform.OS === 'web') {
          window.alert('Permesso microfono negato.');
        } else {
          Alert.alert('Permesso negato', 'Consenti l\'accesso al microfono nelle impostazioni.');
        }
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds(prev => {
          if (prev >= 9) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Errore avvio registrazione:', err);
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
      } catch (err) {
        console.error('Errore stop registrazione:', err);
      }
      setRecording(null);
    }
  };

  const playRecording = async () => {
    if (!recordingUri) return;
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: recordingUri });
      soundRef.current = sound;
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) setIsPlaying(false);
      });
      await sound.playAsync();
    } catch (err) {
      console.error('Errore riproduzione:', err);
      setIsPlaying(false);
    }
  };

  // ── Salva ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
      const alert = getBorborigmiAlert(scores);

      await addDoc(collection(db, 'borborigmiMeasurements'), {
        horseId,
        userId: user.uid,
        scores,
        totalScore: total,
        alertLevel: alert.level,
        hasAudio: !!recordingUri,
        createdAt: serverTimestamp(),
      });

      setTotalScore(total);
      setAlertInfo(alert);
      setPhase('result');
    } catch (error) {
      console.error('Errore salvataggio:', error);
      if (Platform.OS === 'web') {
        window.alert('Errore nel salvataggio. Riprova.');
      } else {
        Alert.alert('Errore', 'Errore nel salvataggio. Riprova.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ──
  const handleReset = () => {
    setPhase('guide');
    setScores({});
    setStep(0);
    setTotalScore(null);
    setAlertInfo(null);
    setRecordingUri(null);
    setRecordSeconds(0);
  };

  // ════════════════════════════════════
  // GUIDA
  // ════════════════════════════════════
  if (phase === 'guide') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔊 Borborigmi</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Auscultazione Intestinale</Text>
          <Text style={styles.infoText}>
            Ascolta i suoni intestinali del cavallo nei 4 quadranti dell'addome.
            Usa l'orecchio o un fonendoscopio appoggiato al fianco.
          </Text>
        </View>

        <View style={styles.guideList}>
          <GuideItem emoji="🔇" text="Trova un ambiente silenzioso" />
          <GuideItem emoji="👂" text="Appoggia l'orecchio o il fonendoscopio al fianco" />
          <GuideItem emoji="⏱️" text="Ascolta ogni quadrante per almeno 30 secondi" />
          <GuideItem emoji="📝" text="Valuta i suoni: assenti, ridotti, normali o aumentati" />
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>💡 Consiglio</Text>
          <Text style={styles.warningText}>
            Inizia dal quadrante superiore destro (Ceco) e procedi in senso orario.
            Puoi registrare un audio di 10 secondi per ogni auscultazione.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={() => setPhase('evaluate')}>
          <Text style={styles.primaryButtonText}>Inizia Valutazione</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('BorborigmiHistory', { horseId })}
        >
          <Text style={styles.secondaryButtonText}>📊 Storico Borborigmi</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ════════════════════════════════════
  // VALUTAZIONE — Passo per passo
  // ════════════════════════════════════
  if (phase === 'evaluate') {
    const currentQ = QUADRANTS[step];
    const currentScore = scores[currentQ.key];
    const isLastStep = step === 3;

    const handleNext = () => {
      if (isLastStep) {
        // Tutti completati, mostra riepilogo
        setPhase('summary');
      } else {
        setStep(step + 1);
      }
    };

    const handleBack = () => {
      if (step > 0) setStep(step - 1);
      else setPhase('guide');
    };

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Progresso */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Quadrante {step + 1} di 4</Text>

        {/* Card quadrante */}
        <View style={styles.stepCard}>
          <Text style={styles.stepNumber}>Quadrante {step + 1}</Text>
          <Text style={styles.stepTitle}>🔊 {currentQ.label}</Text>
          <Text style={styles.stepZone}>{currentQ.zone}</Text>
          <Text style={styles.stepDesc}>{currentQ.desc}</Text>

          <View style={styles.stepPosition}>
            <Text style={styles.stepPositionTitle}>📍 Dove ascoltare:</Text>
            <Text style={styles.stepPositionText}>{currentQ.position}</Text>
          </View>
        </View>

        {/* Opzioni punteggio */}
        <Text style={styles.questionTitle}>Cosa senti?</Text>
        {SCORE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.score}
            style={[
              styles.scoreOption,
              currentScore === opt.score && styles.scoreOptionSelected,
            ]}
            onPress={() => setScores(prev => ({ ...prev, [currentQ.key]: opt.score }))}
          >
            <View style={[styles.scoreDot, { backgroundColor: opt.color },
              currentScore === opt.score && styles.scoreDotSelected,
            ]}>
              <Text style={styles.scoreDotText}>{opt.score}</Text>
            </View>
            <View style={styles.scoreInfo}>
              <Text style={[styles.scoreLabel,
                currentScore === opt.score && styles.scoreLabelSelected,
              ]}>{opt.label}</Text>
              <Text style={[styles.scoreDesc,
                currentScore === opt.score && styles.scoreDescSelected,
              ]}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Navigazione */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navBackButton} onPress={handleBack}>
            <Text style={styles.navBackText}>← Indietro</Text>
          </TouchableOpacity>

          {currentScore !== undefined && (
            <TouchableOpacity style={styles.navNextButton} onPress={handleNext}>
              <Text style={styles.navNextText}>
                {isLastStep ? 'Riepilogo →' : 'Avanti →'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // ════════════════════════════════════
  // RIEPILOGO + AUDIO + SALVA
  // ════════════════════════════════════
  if (phase === 'summary') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Riepilogo Valutazione</Text>

        {/* Riepilogo quadranti */}
        <View style={styles.summaryCard}>
          {QUADRANTS.map((q, i) => (
            <TouchableOpacity
              key={q.key}
              style={styles.summaryRow}
              onPress={() => { setStep(i); setPhase('evaluate'); }}
            >
              <View style={[styles.summaryDot, { backgroundColor: SCORE_OPTIONS[scores[q.key]].color }]}>
                <Text style={styles.summaryDotText}>{scores[q.key]}</Text>
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryLabel}>{q.label} — {q.zone}</Text>
                <Text style={styles.summaryValue}>{SCORE_OPTIONS[scores[q.key]].label}</Text>
              </View>
              <Text style={styles.summaryEdit}>✏️</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Registrazione audio */}
        <View style={styles.audioCard}>
          <Text style={styles.audioTitle}>🎙️ Registrazione Audio (opzionale)</Text>
          <Text style={styles.audioHint}>Registra 10 secondi di suoni intestinali per riferimento futuro.</Text>

          {!recordingUri ? (
            <TouchableOpacity
              style={[styles.audioButton, isRecording && styles.audioButtonRecording]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.audioButtonText}>
                {isRecording ? `⏹️ Stop (${recordSeconds}s / 10s)` : '🎙️ Registra Audio'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.audioPlayRow}>
              <TouchableOpacity style={styles.audioPlayButton} onPress={playRecording} disabled={isPlaying}>
                <Text style={styles.audioPlayText}>{isPlaying ? '🔊 In riproduzione...' : '▶️ Riascolta'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.audioDeleteButton}
                onPress={() => setRecordingUri(null)}
              >
                <Text style={styles.audioDeleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tasto Salva */}
        {allCompleted && (
          <TouchableOpacity
            style={[styles.primaryButton, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Salva Valutazione</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // ════════════════════════════════════
  // RISULTATO
  // ════════════════════════════════════
  if (phase === 'result') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Risultato Borborigmi</Text>

        <View style={styles.resultCard}>
          <View style={styles.resultScoreRow}>
            <Text style={[styles.resultScore, { color: alertInfo.color }]}>{totalScore}</Text>
            <Text style={styles.resultMax}>/12</Text>
          </View>
          <Text style={[styles.resultLevel, { color: alertInfo.color }]}>{alertInfo.level}</Text>
          <Text style={styles.resultMessage}>{alertInfo.message}</Text>

          <View style={styles.auSummary}>
            {QUADRANTS.map((q) => (
              <View key={q.key} style={styles.auSummaryRow}>
                <Text style={styles.auSummaryLabel}>{q.label} ({q.zone})</Text>
                <Text style={[styles.auSummaryScore, { color: SCORE_OPTIONS[scores[q.key]].color }]}>
                  {scores[q.key]}/3 — {SCORE_OPTIONS[scores[q.key]].label}
                </Text>
              </View>
            ))}
          </View>

          {recordingUri && (
            <View style={styles.audioResultRow}>
              <Text style={styles.audioResultText}>🎙️ Audio registrato (salvato sul dispositivo)</Text>
              <TouchableOpacity onPress={playRecording}>
                <Text style={styles.audioResultPlay}>{isPlaying ? '🔊 ...' : '▶️ Riascolta'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
          <Text style={styles.primaryButtonText}>Nuova Valutazione</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('BorborigmiHistory', { horseId })}
        >
          <Text style={styles.secondaryButtonText}>📊 Storico Borborigmi</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

function GuideItem({ emoji, text }) {
  return (
    <View style={styles.guideItem}>
      <Text style={styles.guideEmoji}>{emoji}</Text>
      <Text style={styles.guideText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },

  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },

  guideList: { marginBottom: 16 },
  guideItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 10, padding: 12, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  guideEmoji: { fontSize: 24, marginRight: 12 },
  guideText: { fontSize: 14, color: COLORS.text, flex: 1 },

  warningCard: {
    backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: COLORS.success,
  },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.success, marginBottom: 4 },
  warningText: { fontSize: 13, color: '#2E7D32', lineHeight: 18 },

  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  // Progress
  progressBar: {
    height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },

  // Step-by-step
  stepCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  stepNumber: { fontSize: 12, fontWeight: 'bold', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1 },
  stepTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 4 },
  stepZone: { fontSize: 14, color: COLORS.textLight, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  stepPosition: {
    backgroundColor: '#E8F5E9', borderRadius: 10, padding: 12, marginTop: 12,
  },
  stepPositionTitle: { fontSize: 13, fontWeight: 'bold', color: COLORS.success, marginBottom: 2 },
  stepPositionText: { fontSize: 13, color: '#2E7D32', lineHeight: 18 },

  questionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 10 },

  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 },
  navBackButton: {
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E0E0E0',
  },
  navBackText: { fontSize: 15, color: COLORS.textLight, fontWeight: '600' },
  navNextButton: {
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  navNextText: { fontSize: 15, color: COLORS.white, fontWeight: 'bold' },

  // Summary
  summaryCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  summaryDot: {
    width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  summaryDotText: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  summaryInfo: { flex: 1 },
  summaryLabel: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  summaryValue: { fontSize: 12, color: COLORS.textLight },
  summaryEdit: { fontSize: 16, marginLeft: 8 },
  scoreOption: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10,
    marginBottom: 8, backgroundColor: '#F5F5F5',
  },
  scoreOptionSelected: { backgroundColor: COLORS.primaryLight + '40' },
  scoreDot: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  scoreDotSelected: { borderWidth: 3, borderColor: COLORS.primary },
  scoreDotText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  scoreInfo: { flex: 1 },
  scoreLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  scoreLabelSelected: { color: COLORS.primary },
  scoreDesc: { fontSize: 12, color: COLORS.textLight, lineHeight: 16 },
  scoreDescSelected: { color: COLORS.text },

  // Audio
  audioCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  audioTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  audioHint: { fontSize: 12, color: COLORS.textLight, marginBottom: 12 },
  audioButton: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  audioButtonRecording: { backgroundColor: COLORS.error },
  audioButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  audioPlayRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  audioPlayButton: {
    flex: 1, backgroundColor: '#E8F5E9', borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  audioPlayText: { fontSize: 14, color: COLORS.success, fontWeight: '600' },
  audioDeleteButton: {
    backgroundColor: '#FFEBEE', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16,
  },
  audioDeleteText: { fontSize: 16 },

  // Result
  resultCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
  },
  resultScoreRow: { flexDirection: 'row', alignItems: 'baseline' },
  resultScore: { fontSize: 56, fontWeight: 'bold' },
  resultMax: { fontSize: 20, color: COLORS.textLight, marginLeft: 4 },
  resultLevel: { fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 8 },
  resultMessage: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  auSummary: { width: '100%', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12 },
  auSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  auSummaryLabel: { fontSize: 13, color: COLORS.text },
  auSummaryScore: { fontSize: 13, fontWeight: 'bold' },

  audioResultRow: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12, marginTop: 8,
  },
  audioResultText: { fontSize: 12, color: COLORS.textLight, flex: 1 },
  audioResultPlay: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
