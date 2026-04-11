import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const SEX_OPTIONS = ['Stallone', 'Castrone', 'Cavalla'];

export default function AddHorseScreen({ navigation }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('');
  const [coatColor, setCoatColor] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [loading, setLoading] = useState(false);

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert(title, msg); }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Errore', 'Il nome del cavallo è obbligatorio.');
      return;
    }

    setLoading(true);
    try {
      const horseData = {
        userId: user.uid,
        name: name.trim(),
        breed: breed.trim(),
        sex,
        coatColor: coatColor.trim(),
        microchip: microchip.trim(),
        createdAt: serverTimestamp(),
      };

      // Calcola età dall'anno di nascita
      if (birthYear.trim()) {
        const year = parseInt(birthYear.trim(), 10);
        if (year > 1980 && year <= new Date().getFullYear()) {
          horseData.birthYear = year;
          horseData.age = new Date().getFullYear() - year;
        }
      }

      await addDoc(collection(db, 'horses'), horseData);
      navigation.goBack();
    } catch (error) {
      showAlert('Errore', 'Impossibile salvare il cavallo. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Nome */}
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Furia"
          placeholderTextColor={COLORS.textLight}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        {/* Razza */}
        <Text style={styles.label}>Razza</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Purosangue Inglese"
          placeholderTextColor={COLORS.textLight}
          value={breed}
          onChangeText={setBreed}
          autoCapitalize="words"
        />

        {/* Sesso */}
        <Text style={styles.label}>Sesso</Text>
        <View style={styles.optionsRow}>
          {SEX_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, sex === option && styles.optionSelected]}
              onPress={() => setSex(option)}
            >
              <Text style={[styles.optionText, sex === option && styles.optionTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Colore mantello */}
        <Text style={styles.label}>Colore mantello</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. Baio"
          placeholderTextColor={COLORS.textLight}
          value={coatColor}
          onChangeText={setCoatColor}
          autoCapitalize="words"
        />

        {/* Anno di nascita */}
        <Text style={styles.label}>Anno di nascita</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. 2018"
          placeholderTextColor={COLORS.textLight}
          value={birthYear}
          onChangeText={setBirthYear}
          keyboardType="numeric"
          maxLength={4}
        />

        {/* Microchip */}
        <Text style={styles.label}>Numero Microchip</Text>
        <TextInput
          style={styles.input}
          placeholder="Es. 380098100012345"
          placeholderTextColor={COLORS.textLight}
          value={microchip}
          onChangeText={setMicrochip}
          keyboardType="numeric"
          maxLength={15}
        />

        {/* Pulsante Salva */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Salva Cavallo</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: COLORS.text, borderWidth: 1, borderColor: COLORS.border,
  },
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
