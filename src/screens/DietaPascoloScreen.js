import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function DietaPascoloScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [tipo, setTipo] = useState('');
  const [durata, setDurata] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tipo || !durata) {
      Alert.alert('Errore', 'Tipo e durata sono obbligatori');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'dietaPascolo'), {
        horseId,
        userId: user.uid,
        tipo,
        durata: parseFloat(durata.replace(',', '.')),
        note,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Successo', 'Dati pascolo inseriti!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Errore', 'Impossibile salvare i dati: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aggiungi Pascolo</Text>
      <Text style={styles.label}>Tipo*</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Es: Erba, Paddock..." />
      <Text style={styles.label}>Durata (ore)*</Text>
      <TextInput style={styles.input} value={durata} onChangeText={setDurata} placeholder="Es: 3" keyboardType="decimal-pad" />
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
