import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function DietaIdratazioneScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [tipo, setTipo] = useState('');
  const [quantita, setQuantita] = useState('');
  const [modalita, setModalita] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tipo || !quantita) {
      Alert.alert('Errore', 'Tipo e quantità sono obbligatori');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'dietaIdratazione'), {
        horseId,
        userId: user.uid,
        tipo,
        quantita: parseFloat(quantita.replace(',', '.')),
        modalita,
        note,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Successo', 'Dati idratazione inseriti!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Errore', 'Impossibile salvare i dati: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aggiungi Idratazione</Text>
      <Text style={styles.label}>Tipo*</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Es: Acqua, Sale..." />
      <Text style={styles.label}>Quantità (L)*</Text>
      <TextInput style={styles.input} value={quantita} onChangeText={setQuantita} placeholder="Es: 10" keyboardType="decimal-pad" />
      <Text style={styles.label}>Modalità</Text>
      <TextInput style={styles.input} value={modalita} onChangeText={setModalita} placeholder="Es: Abbeverata, Secchio..." />
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
