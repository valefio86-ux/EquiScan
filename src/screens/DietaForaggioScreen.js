import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native';
import { COLORS } from '../theme/colors';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const FORAGGIO_TIPI = [
  {
    id: 'fieno_polifita',
    nome: 'Fieno Polifita',
    descrizione: 'Fieno di prato stabile composto da varie erbe. Ideale per il mantenimento e la salute intestinale.'
  },
  {
    id: 'erba_medica',
    nome: 'Erba Medica',
    descrizione: 'Leguminosa ricca di proteine e calcio. Ottimo tampone gastrico naturale per prevenire ulcere.'
  },
  {
    id: 'loietto',
    nome: 'Loietto / Graminacee',
    descrizione: 'Foraggio monofita ad alto valore energetico, adatto a cavalli in attività sportiva.'
  },
  {
    id: 'fleolo_timothy',
    nome: 'Fieno di Fleolo (Timothy)',
    descrizione: 'Basso contenuto di zuccheri e polveri. Ideale per cavalli con problemi metabolici o respiratori.'
  },
  {
    id: 'fienilato',
    nome: 'Fienilato (Haylage)',
    descrizione: 'Foraggio parzialmente fermentato e privo di polvere. Specifico per cavalli con asma equina (RAO).'
  },
  {
    id: 'paglia',
    nome: 'Paglia',
    descrizione: 'Fibra pura a basso contenuto energetico. Utile per aumentare i tempi di masticazione senza ingrassare.'
  },
  {
    id: 'pascolo',
    nome: 'Pascolo (Erba Fresca)',
    descrizione: 'Alimentazione naturale. Massima idratazione e apporto vitaminico, ma monitorare gli zuccheri.'
  },
  {
    id: 'processato',
    nome: 'Wafer / Pellet di fieno',
    descrizione: 'Foraggio pressato o sminuzzato. Indicato per cavalli anziani con difficoltà di masticazione.'
  },
  {
    id: 'altro',
    nome: 'Altro / Mix Specifico',
    descrizione: 'Scegli questa opzione per miscele particolari o foraggi non elencati.'
  },
];
const MODALITA = [
  'A terra',
  'Rete/Slow-feeder',
  'Ad libitum',
];

export default function DietaForaggioScreen({ route, navigation }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [tipo, setTipo] = useState(null); // oggetto
  const [quantita, setQuantita] = useState('');
  const [modalita, setModalita] = useState('');
  const [qualita, setQualita] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tipo || !quantita || !modalita) {
      if (Platform.OS === 'web') window.alert('Compila tutti i campi obbligatori');
      else Alert.alert('Compila tutti i campi obbligatori');
      return;
    }
    if (tipo.id === 'altro' && !note.trim()) {
      if (Platform.OS === 'web') window.alert('Inserisci una nota per il foraggio Altro/Mix');
      else Alert.alert('Inserisci una nota per il foraggio Altro/Mix');
      return;
    }
    if (!horseId || !user || !user.uid) {
      if (Platform.OS === 'web') window.alert('Errore: cavallo o utente non selezionato.');
      else Alert.alert('Errore', 'Cavallo o utente non selezionato.');
      console.error('horseId o user mancante', { horseId, user });
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'dietaForaggio'), {
        horseId,
        userId: user.uid,
        tipo: tipo.nome,
        tipoId: tipo.id,
        quantita: parseFloat(quantita.replace(',', '.')),
        modalita,
        qualita,
        note: tipo.id === 'altro' ? note : '',
        createdAt: serverTimestamp(),
      });
      if (Platform.OS === 'web') {
        window.alert('Dati salvati!');
      } else {
        Alert.alert('Salvato', 'Dati foraggio inseriti con successo');
      }
      navigation.goBack();
    } catch (e) {
      if (Platform.OS === 'web') window.alert('Errore salvataggio: ' + (e?.message || e));
      else Alert.alert('Errore', 'Errore salvataggio: ' + (e?.message || e));
      console.error('Errore salvataggio dietaForaggio:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Foraggio</Text>
      <Text style={styles.label}>Tipo *</Text>
      {FORAGGIO_TIPI.map(opt => (
        <TouchableOpacity
          key={opt.id}
          style={[styles.option, tipo && tipo.id === opt.id && styles.optionSelected]}
          onPress={() => setTipo(opt)}
        >
          <Text style={styles.optionText}>{opt.nome}</Text>
          <Text style={styles.optionDesc}>{opt.descrizione}</Text>
        </TouchableOpacity>
      ))}
      {tipo && tipo.id === 'altro' && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.label}>Note *</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Descrivi il foraggio o la miscela..."
          />
        </View>
      )}
      <Text style={styles.label}>Quantità giornaliera (kg) *</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={quantita}
        onChangeText={setQuantita}
        placeholder="Es: 8.5"
      />
      <Text style={styles.label}>Modalità somministrazione *</Text>
      {MODALITA.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.option, modalita === opt && styles.optionSelected]}
          onPress={() => setModalita(opt)}
        >
          <Text style={styles.optionText}>{opt}</Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.label}>Qualità percepita</Text>
      <TextInput
        style={styles.input}
        value={qualita}
        onChangeText={setQualita}
        placeholder="Polvere, muffe, corpi estranei..."
      />
      <TouchableOpacity
        style={[styles.saveButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>Salva</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 18, textAlign: 'center' },
  label: { fontSize: 15, color: COLORS.text, marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 15,
    borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 8,
  },
  option: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight + '40' },
  optionText: { fontSize: 15, color: COLORS.text },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
