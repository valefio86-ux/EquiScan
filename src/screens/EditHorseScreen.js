import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS } from '../theme/colors';

const SEX_OPTIONS = ['Stallone', 'Castrone', 'Cavalla'];

export default function EditHorseScreen({ route, navigation }) {
  const { horseId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dati identificativi
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('');
  const [coatColor, setCoatColor] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [microchip, setMicrochip] = useState('');

  // Dati biometrici
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Profilo sanitario
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Scadenze routine
  const [nextDeworming, setNextDeworming] = useState('');
  const [nextDentist, setNextDentist] = useState('');
  const [nextVaccination, setNextVaccination] = useState('');
  const [nextFarrier, setNextFarrier] = useState('');

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert(title, msg); }
  };

  useEffect(() => {
    const loadHorse = async () => {
      const snap = await getDoc(doc(db, 'horses', horseId));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name || '');
        setBreed(d.breed || '');
        setSex(d.sex || '');
        setCoatColor(d.coatColor || '');
        setBirthYear(d.birthYear ? String(d.birthYear) : '');
        setMicrochip(d.microchip || '');
        setWeight(d.weight ? String(d.weight) : '');
        setHeight(d.height ? String(d.height) : '');
        setMedicalHistory(d.medicalHistory || '');
        setAllergies(d.allergies || '');
        setCurrentMedications(d.currentMedications || '');
        setNextDeworming(d.nextDeworming || '');
        setNextDentist(d.nextDentist || '');
        setNextVaccination(d.nextVaccination || '');
        setNextFarrier(d.nextFarrier || '');
      }
      setLoading(false);
    };
    loadHorse();
  }, [horseId]);

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Errore', 'Il nome del cavallo è obbligatorio.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        breed: breed.trim(),
        sex,
        coatColor: coatColor.trim(),
        microchip: microchip.trim(),
        medicalHistory: medicalHistory.trim(),
        allergies: allergies.trim(),
        currentMedications: currentMedications.trim(),
        nextDeworming: nextDeworming.trim(),
        nextDentist: nextDentist.trim(),
        nextVaccination: nextVaccination.trim(),
        nextFarrier: nextFarrier.trim(),
      };

      // Anno di nascita + calcolo età
      if (birthYear.trim()) {
        const year = parseInt(birthYear.trim(), 10);
        if (year > 1980 && year <= new Date().getFullYear()) {
          data.birthYear = year;
          data.age = new Date().getFullYear() - year;
        }
      } else {
        data.birthYear = null;
        data.age = null;
      }

      // Peso
      if (weight.trim()) {
        const w = parseFloat(weight.trim());
        if (w > 0) data.weight = w;
      } else {
        data.weight = null;
      }

      // Altezza
      if (height.trim()) {
        const h = parseFloat(height.trim());
        if (h > 0) data.height = h;
      } else {
        data.height = null;
      }

      await updateDoc(doc(db, 'horses', horseId), data);
      navigation.goBack();
    } catch (error) {
      showAlert('Errore', 'Impossibile salvare le modifiche. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* === DATI IDENTIFICATIVI === */}
        <Text style={styles.sectionTitle}>Dati identificativi</Text>

        <Text style={styles.label}>Nome *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Es. Furia" placeholderTextColor={COLORS.textLight} autoCapitalize="words" />

        <Text style={styles.label}>Razza</Text>
        <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="Es. Purosangue Inglese" placeholderTextColor={COLORS.textLight} autoCapitalize="words" />

        <Text style={styles.label}>Sesso</Text>
        <View style={styles.optionsRow}>
          {SEX_OPTIONS.map((option) => (
            <TouchableOpacity key={option} style={[styles.optionButton, sex === option && styles.optionSelected]} onPress={() => setSex(option)}>
              <Text style={[styles.optionText, sex === option && styles.optionTextSelected]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Colore mantello</Text>
        <TextInput style={styles.input} value={coatColor} onChangeText={setCoatColor} placeholder="Es. Baio" placeholderTextColor={COLORS.textLight} autoCapitalize="words" />

        <Text style={styles.label}>Anno di nascita</Text>
        <TextInput style={styles.input} value={birthYear} onChangeText={setBirthYear} placeholder="Es. 2018" placeholderTextColor={COLORS.textLight} keyboardType="numeric" maxLength={4} />

        <Text style={styles.label}>Numero Microchip</Text>
        <TextInput style={styles.input} value={microchip} onChangeText={setMicrochip} placeholder="Es. 380098100012345" placeholderTextColor={COLORS.textLight} keyboardType="numeric" maxLength={15} />

        {/* === DATI BIOMETRICI === */}
        <Text style={styles.sectionTitle}>Dati biometrici</Text>

        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Es. 500" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />

        <Text style={styles.label}>Altezza al garrese (cm)</Text>
        <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="Es. 165" placeholderTextColor={COLORS.textLight} keyboardType="numeric" />

        {/* === PROFILO SANITARIO === */}
        <Text style={styles.sectionTitle}>Profilo sanitario</Text>

        <Text style={styles.label}>Patologie pregresse</Text>
        <TextInput style={[styles.input, styles.textArea]} value={medicalHistory} onChangeText={setMedicalHistory} placeholder="Es. Colica nel 2022, zoppia anteriore dx" placeholderTextColor={COLORS.textLight} multiline numberOfLines={3} textAlignVertical="top" />

        <Text style={styles.label}>Allergie</Text>
        <TextInput style={[styles.input, styles.textArea]} value={allergies} onChangeText={setAllergies} placeholder="Es. Allergia alla polvere di fieno" placeholderTextColor={COLORS.textLight} multiline numberOfLines={2} textAlignVertical="top" />

        <Text style={styles.label}>Farmaci in corso</Text>
        <TextInput style={[styles.input, styles.textArea]} value={currentMedications} onChangeText={setCurrentMedications} placeholder="Es. Omeprazolo 2g/giorno" placeholderTextColor={COLORS.textLight} multiline numberOfLines={2} textAlignVertical="top" />

        {/* === SCADENZE ROUTINE === */}
        <Text style={styles.sectionTitle}>Scadenze routine</Text>
        <Text style={styles.hint}>Formato: AAAA-MM-GG (es. 2026-06-15)</Text>

        <Text style={styles.label}>Prossima sverminazione</Text>
        <TextInput style={styles.input} value={nextDeworming} onChangeText={setNextDeworming} placeholder="Es. 2026-06-15" placeholderTextColor={COLORS.textLight} />

        <Text style={styles.label}>Prossimo dentista</Text>
        <TextInput style={styles.input} value={nextDentist} onChangeText={setNextDentist} placeholder="Es. 2026-09-01" placeholderTextColor={COLORS.textLight} />

        <Text style={styles.label}>Prossima vaccinazione</Text>
        <TextInput style={styles.input} value={nextVaccination} onChangeText={setNextVaccination} placeholder="Es. 2026-12-01" placeholderTextColor={COLORS.textLight} />

        <Text style={styles.label}>Prossimo maniscalco</Text>
        <TextInput style={styles.input} value={nextFarrier} onChangeText={setNextFarrier} placeholder="Es. 2026-05-10" placeholderTextColor={COLORS.textLight} />

        {/* Pulsante Salva */}
        <TouchableOpacity style={[styles.saveButton, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveButtonText}>Salva Modifiche</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary, marginTop: 24, marginBottom: 4 },
  hint: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
  textArea: { minHeight: 70, paddingTop: 12 },
  optionsRow: { flexDirection: 'row', gap: 8 },
  optionButton: {
    flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.white, alignItems: 'center',
  },
  optionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optionText: { fontSize: 14, color: COLORS.text },
  optionTextSelected: { color: COLORS.white, fontWeight: '600' },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 30,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
