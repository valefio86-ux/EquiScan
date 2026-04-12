import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function DietaVariazioniScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [tipo, setTipo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!tipo || !descrizione) {
      Alert.alert('Errore', 'Tipo e descrizione sono obbligatori');
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'dietaVariazioni'), {
        horseId,
        userId: user.uid,
        tipo,
        descrizione,
        note,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Successo', 'Variazione registrata!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Errore', 'Impossibile salvare i dati: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Aggiungi Variazione</Text>
      <Text style={styles.label}>Tipo*</Text>
      <TextInput style={styles.input} value={tipo} onChangeText={setTipo} placeholder="Es: Cambio fieno, Cambio box..." />
      <Text style={styles.label}>Descrizione*</Text>
      <TextInput style={styles.input} value={descrizione} onChangeText={setDescrizione} placeholder="Dettagli della variazione" multiline />
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
