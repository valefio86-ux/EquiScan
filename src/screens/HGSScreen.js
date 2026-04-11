import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, Alert, Platform, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

// ── 6 Action Units ──
const ACTION_UNITS = [
  {
    key: 'ears',
    icon: '👂',
    title: 'Orecchie',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Orecchie in avanti o laterali, rilassate e mobili.' },
      { score: 1, label: 'Moderato', text: 'Orecchie leggermente indietro o poco mobili.' },
      { score: 2, label: 'Evidente', text: 'Orecchie appiattite all\'indietro, rigide e immobili.' },
    ],
  },
  {
    key: 'eye',
    icon: '👁️',
    title: 'Occhio',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Occhio aperto, sguardo attento, nessuna tensione.' },
      { score: 1, label: 'Moderato', text: 'Occhio parzialmente chiuso o tensione sopra l\'orbita.' },
      { score: 2, label: 'Evidente', text: 'Occhio a triangolo, molto socchiuso, espressione assente.' },
    ],
  },
  {
    key: 'orbital',
    icon: '🔲',
    title: 'Area Sopraorbitale',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Muscoli rilassati, nessun rigonfiamento sopra l\'occhio.' },
      { score: 1, label: 'Moderato', text: 'Leggera tensione o rigonfiamento sopra l\'occhio.' },
      { score: 2, label: 'Evidente', text: 'Muscoli molto contratti, zona sopraorbitale prominente.' },
    ],
  },
  {
    key: 'nostrils',
    icon: '👃',
    title: 'Narici',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Narici rilassate, forma rotonda e morbida.' },
      { score: 1, label: 'Moderato', text: 'Narici leggermente dilatate o contratte.' },
      { score: 2, label: 'Evidente', text: 'Narici molto dilatate, a punta o rigide.' },
    ],
  },
  {
    key: 'mouth',
    icon: '👄',
    title: 'Bocca',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Labbra rilassate, mento morbido.' },
      { score: 1, label: 'Moderato', text: 'Labbra leggermente serrate o mento teso.' },
      { score: 2, label: 'Evidente', text: 'Labbra molto serrate, mento prominente e rigido.' },
    ],
  },
  {
    key: 'profile',
    icon: '🐴',
    title: 'Profilo (Naso)',
    descriptions: [
      { score: 0, label: 'Assente', text: 'Linea del naso morbida, muscoli rilassati.' },
      { score: 1, label: 'Moderato', text: 'Leggera tensione lungo la linea del naso.' },
      { score: 2, label: 'Evidente', text: 'Linea del naso molto tesa e rigida, muscoli contratti.' },
    ],
  },
];

function getHGSAlert(score) {
  if (score <= 2) return { level: 'Dolore nullo/lieve', color: COLORS.success, message: 'Nessun segno evidente di dolore. Continuare il monitoraggio di routine.' };
  if (score <= 5) return { level: 'Dolore moderato', color: COLORS.warning, message: 'Ricontrolla tra 30 minuti. Verifica anche borborigmi e battito cardiaco.' };
  return { level: 'Dolore significativo', color: COLORS.error, message: '🚨 Contatta il veterinario. Probabile colica o dolore acuto.' };
}

export default function HGSScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [phase, setPhase] = useState('guide'); // guide → photo → checklist → result
  const [photoUri, setPhotoUri] = useState(null);
  const [scores, setScores] = useState({});
  const [activeAU, setActiveAU] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hgsScore, setHgsScore] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  const completedCount = Object.keys(scores).length;
  const allCompleted = completedCount === 6;

  // ── Scatta foto ──
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        window.alert('Permesso fotocamera negato. Usa "Carica da galleria" in alternativa.');
      } else {
        Alert.alert('Permesso negato', 'Consenti l\'accesso alla fotocamera nelle impostazioni.');
      }
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhase('checklist');
    }
  };

  // ── Carica da galleria ──
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (Platform.OS === 'web') {
        window.alert('Permesso galleria negato.');
      } else {
        Alert.alert('Permesso negato', 'Consenti l\'accesso alla galleria nelle impostazioni.');
      }
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhase('checklist');
    }
  };

  // ── Seleziona punteggio per AU ──
  const handleScoreSelect = (auKey, score) => {
    setScores(prev => ({ ...prev, [auKey]: score }));
  };

  // ── Calcola e salva ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const total = Object.values(scores).reduce((sum, v) => sum + v, 0);
      const alert = getHGSAlert(total);

      // Salva su Firestore (foto resta solo sul dispositivo)
      await addDoc(collection(db, 'hgsMeasurements'), {
        horseId,
        userId: user.uid,
        scores,
        hgsScore: total,
        alertLevel: alert.level,
        createdAt: serverTimestamp(),
      });

      setHgsScore(total);
      setAlertInfo(alert);
      setPhase('result');
    } catch (error) {
      console.error('Errore salvataggio HGS:', error);
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
    setPhotoUri(null);
    setScores({});
    setActiveAU(null);
    setHgsScore(null);
    setAlertInfo(null);
  };

  // ════════════════════════════════════
  // FASE 1 — Guida scatto foto (Step 6.1)
  // ════════════════════════════════════
  if (phase === 'guide') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>🐴 Horse Grimace Scale</Text>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Come scattare la foto</Text>
          <Text style={styles.infoText}>
            Per una valutazione accurata del dolore, segui queste indicazioni:
          </Text>
        </View>

        <View style={styles.guideList}>
          <GuideItem emoji="📸" text="Posizionati di lato al cavallo (profilo)" />
          <GuideItem emoji="👁️" text="Mettiti all'altezza degli occhi del cavallo" />
          <GuideItem emoji="☀️" text="Assicurati di avere buona illuminazione" />
          <GuideItem emoji="😌" text="Il cavallo deve essere fermo e non stare mangiando" />
          <GuideItem emoji="🤫" text="Non disturbare il cavallo — osserva il suo stato naturale" />
          <GuideItem emoji="📐" text="Inquadra tutta la testa, dalle orecchie al muso" />
        </View>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>
          <Text style={styles.warningText}>
            Non valutare il cavallo subito dopo l'esercizio, il pasto o eventi stressanti.
            Aspetta almeno 30 minuti per una valutazione affidabile.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
          <Text style={styles.primaryButtonText}>📷 Scatta Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { marginTop: 12 }]} onPress={pickPhoto}>
          <Text style={styles.secondaryButtonText}>🖼️ Carica da Galleria</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('HGSHistory', { horseId })}
        >
          <Text style={styles.secondaryButtonText}>📊 Storico HGS</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ════════════════════════════════════
  // FASE 2 — Checklist 6 Action Units (Steps 6.2-6.4)
  // ════════════════════════════════════
  if (phase === 'checklist') {
    const activeAUData = ACTION_UNITS.find(au => au.key === activeAU);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Valutazione HGS</Text>

        {/* Foto scattata */}
        {photoUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="contain" />
            <TouchableOpacity style={styles.retakeButton} onPress={() => setPhase('guide')}>
              <Text style={styles.retakeText}>Cambia foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Progresso */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(completedCount / 6) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{completedCount}/6 Action Units completate</Text>

        {/* Lista Action Units */}
        <View style={styles.auList}>
          {ACTION_UNITS.map((au) => (
            <TouchableOpacity
              key={au.key}
              style={[
                styles.auItem,
                activeAU === au.key && styles.auItemActive,
                scores[au.key] !== undefined && styles.auItemCompleted,
              ]}
              onPress={() => setActiveAU(activeAU === au.key ? null : au.key)}
            >
              <Text style={styles.auIcon}>{au.icon}</Text>
              <Text style={styles.auTitle}>{au.title}</Text>
              {scores[au.key] !== undefined && (
                <View style={[styles.auScoreBadge, {
                  backgroundColor: scores[au.key] === 0 ? COLORS.success : scores[au.key] === 1 ? COLORS.warning : COLORS.error,
                }]}>
                  <Text style={styles.auScoreText}>{scores[au.key]}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Pannello punteggio per AU attiva */}
        {activeAUData && (
          <View style={styles.auPanel}>
            <Text style={styles.auPanelTitle}>{activeAUData.icon} {activeAUData.title}</Text>
            {activeAUData.descriptions.map((desc) => (
              <TouchableOpacity
                key={desc.score}
                style={[
                  styles.scoreOption,
                  scores[activeAUData.key] === desc.score && styles.scoreOptionSelected,
                ]}
                onPress={() => handleScoreSelect(activeAUData.key, desc.score)}
              >
                <View style={[
                  styles.scoreDot,
                  { backgroundColor: desc.score === 0 ? COLORS.success : desc.score === 1 ? COLORS.warning : COLORS.error },
                  scores[activeAUData.key] === desc.score && styles.scoreDotSelected,
                ]}>
                  <Text style={styles.scoreDotText}>{desc.score}</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={[
                    styles.scoreLabel,
                    scores[activeAUData.key] === desc.score && styles.scoreLabelSelected,
                  ]}>{desc.label}</Text>
                  <Text style={[
                    styles.scoreDesc,
                    scores[activeAUData.key] === desc.score && styles.scoreDescSelected,
                  ]}>{desc.text}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
              <Text style={styles.primaryButtonText}>Salva Valutazione HGS</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  // ════════════════════════════════════
  // FASE 3 — Risultato (Steps 6.5)
  // ════════════════════════════════════
  if (phase === 'result') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Risultato HGS</Text>

        <View style={styles.resultCard}>
          <View style={styles.resultScoreRow}>
            <Text style={[styles.resultScore, { color: alertInfo.color }]}>{hgsScore}</Text>
            <Text style={styles.resultMax}>/12</Text>
          </View>
          <Text style={[styles.resultLevel, { color: alertInfo.color }]}>{alertInfo.level}</Text>
          <Text style={styles.resultMessage}>{alertInfo.message}</Text>

          {/* Riepilogo AU */}
          <View style={styles.auSummary}>
            {ACTION_UNITS.map((au) => (
              <View key={au.key} style={styles.auSummaryRow}>
                <Text style={styles.auSummaryLabel}>{au.icon} {au.title}</Text>
                <Text style={[styles.auSummaryScore, {
                  color: scores[au.key] === 0 ? COLORS.success : scores[au.key] === 1 ? COLORS.warning : COLORS.error,
                }]}>{scores[au.key]}/2</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleReset}>
          <Text style={styles.primaryButtonText}>Nuova Valutazione</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { marginTop: 12 }]}
          onPress={() => navigation.navigate('HGSHistory', { horseId })}
        >
          <Text style={styles.secondaryButtonText}>📊 Storico HGS</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return null;
}

// ── Componente guida ──
function GuideItem({ emoji, text }) {
  return (
    <View style={styles.guideItem}>
      <Text style={styles.guideEmoji}>{emoji}</Text>
      <Text style={styles.guideText}>{text}</Text>
    </View>
  );
}

// ── Stili ──
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },

  // Info card
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    borderLeftWidth: 4, borderLeftColor: COLORS.primary,
  },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },

  // Guida
  guideList: { marginBottom: 16 },
  guideItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 10, padding: 12, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  guideEmoji: { fontSize: 24, marginRight: 12 },
  guideText: { fontSize: 14, color: COLORS.text, flex: 1 },

  // Warning
  warningCard: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14, marginBottom: 20,
    borderLeftWidth: 4, borderLeftColor: COLORS.warning,
  },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.warning, marginBottom: 4 },
  warningText: { fontSize: 13, color: '#5D4037', lineHeight: 18 },

  // Buttons
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  secondaryButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  secondaryButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },

  // Photo
  photoContainer: { alignItems: 'center', marginBottom: 16 },
  photo: { width: '100%', height: 250, borderRadius: 12, backgroundColor: COLORS.white },
  retakeButton: { marginTop: 8 },
  retakeText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // Progress
  progressBar: {
    height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginBottom: 4, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginBottom: 16 },

  // AU list
  auList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  auItem: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 10,
    width: '48%', flexGrow: 1, flexBasis: '45%',
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0',
  },
  auItemActive: { borderColor: COLORS.primary, borderWidth: 2 },
  auItemCompleted: { borderColor: COLORS.success, backgroundColor: '#F1F8F1' },
  auIcon: { fontSize: 24, marginBottom: 4 },
  auTitle: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  auScoreBadge: {
    width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  auScoreText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },

  // AU Panel
  auPanel: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  auPanelTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
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

  auSummary: {
    width: '100%', borderTopWidth: 1, borderTopColor: '#E0E0E0', paddingTop: 12,
  },
  auSummaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6,
  },
  auSummaryLabel: { fontSize: 14, color: COLORS.text },
  auSummaryScore: { fontSize: 14, fontWeight: 'bold' },
});
