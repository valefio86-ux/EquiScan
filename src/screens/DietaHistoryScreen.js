import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

const CATEGORIE = [
  { key: 'all', label: 'Tutte' },
  { key: 'foraggio', label: 'Foraggio' },
  { key: 'concentrati', label: 'Concentrati' },
  { key: 'idratazione', label: 'Idratazione' },
  { key: 'pascolo', label: 'Pascolo' },
  { key: 'variazioni', label: 'Variazioni' },
];

export default function DietaHistoryScreen({ route }) {
  const { horseId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [filtro, setFiltro] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Per ora solo foraggio, poi aggiungi altre collezioni
      const q = query(
        collection(db, 'dietaForaggio'),
        where('horseId', '==', horseId),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const dati = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, categoria: 'foraggio' }));
      setRecords(dati);
      setLoading(false);
    };
    fetchData();
  }, [horseId, user, filtro]);

  const filtered = filtro === 'all' ? records : records.filter(r => r.categoria === filtro);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Storico Dieta</Text>
      <View style={styles.filtroRow}>
        {CATEGORIE.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.filtroBtn, filtro === cat.key && styles.filtroBtnActive]}
            onPress={() => setFiltro(cat.key)}
          >
            <Text style={[styles.filtroText, filtro === cat.key && styles.filtroTextActive]}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={COLORS.primary} /> : (
        filtered.length === 0 ? <Text style={styles.empty}>Nessun dato presente.</Text> : (
          filtered.map(rec => (
            <View key={rec.id} style={styles.card}>
              <Text style={styles.cardCat}>Foraggio</Text>
              <Text style={styles.cardTipo}>{rec.tipo}</Text>
              <Text style={styles.cardDett}>Quantità: {rec.quantita} kg</Text>
              <Text style={styles.cardDett}>Modalità: {rec.modalita}</Text>
              {rec.qualita ? <Text style={styles.cardDett}>Qualità: {rec.qualita}</Text> : null}
              {rec.note ? <Text style={styles.cardDett}>Note: {rec.note}</Text> : null}
              <Text style={styles.cardData}>{rec.createdAt?.toDate?.().toLocaleString?.() || ''}</Text>
            </View>
          ))
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 18, textAlign: 'center' },
  filtroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filtroBtn: { backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.primaryLight },
  filtroBtnActive: { backgroundColor: COLORS.primary },
  filtroText: { color: COLORS.primary, fontSize: 14 },
  filtroTextActive: { color: COLORS.white },
  empty: { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  cardCat: { fontSize: 13, color: COLORS.primary, fontWeight: 'bold', marginBottom: 2 },
  cardTipo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  cardDett: { fontSize: 13, color: COLORS.text, marginBottom: 1 },
  cardData: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'right' },
});
