import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function DietaConcentratiScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [tipo, setTipo] = useState('');
  const [quantita, setQuantita] = useState('');
  const [fornitore, setFornitore] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tipo || !quantita) {
      Alert.alert('Errore', 'Tipo e quantità sono obbligatori');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'dietaConcentrati'), {
        horseId,
        userId: user.uid,
        tipo,
        quantita: parseFloat(quantita.replace(',', '.')),
        fornitore,
        note,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Successo', 'Dati concentrati inseriti!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Errore', 'Impossibile salvare i dati: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aggiungi Concentrati</Text>
      <Text style={styles.label}>Tipo*</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Es: Mangime, Crusca..." />
      <Text style={styles.label}>Quantità (kg)*</Text>
      <TextInput style={styles.input} value={quantita} onChangeText={setQuantita} placeholder="Es: 1.5" keyboardType="decimal-pad" />
      <Text style={styles.label}>Fornitore</Text>
      <TextInput style={styles.input} value={fornitore} onChangeText={setFornitore} placeholder="Es: Nome fornitore" />
      <Text style={styles.label}>Note</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Note aggiuntive" multiline />
      <Button title={loading ? 'Salvataggio...' : 'Salva'} onPress={handleSave} color={COLORS.primary} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: COLORS.background, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 18, textAlign: 'center' },
  label: { fontWeight: 'bold', color: COLORS.text, marginTop: 12 },
  input: { backgroundColor: COLORS.white, borderRadius: 8, padding: 10, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: COLORS.primaryLight },
});
