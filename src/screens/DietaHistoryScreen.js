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
      try {
        // Recupera tutte le categorie dieta
        const categorie = [
          { key: 'foraggio', col: 'dietaForaggio' },
          { key: 'concentrati', col: 'dietaConcentrati' },
          { key: 'idratazione', col: 'dietaIdratazione' },
          { key: 'pascolo', col: 'dietaPascolo' },
          { key: 'variazioni', col: 'dietaVariazioni' },
        ];
        let all = [];
        for (const cat of categorie) {
          try {
            const q = query(
              collection(db, cat.col),
              where('horseId', '==', horseId),
              where('userId', '==', user.uid),
              orderBy('createdAt', 'desc')
            );
            const snap = await getDocs(q);
            const dati = snap.docs.map(doc => ({ ...doc.data(), id: doc.id, categoria: cat.key }));
            all = all.concat(dati);
          } catch (err) {
            // Se la collezione non esiste o manca l'indice, ignora e continua
            console.warn('DietaHistoryScreen - errore su', cat.col, err?.message || err);
          }
        }
        // Ordina tutti i record per data decrescente
        all.sort((a, b) => {
          const da = a.createdAt?.toDate?.() || a.createdAt || 0;
          const db = b.createdAt?.toDate?.() || b.createdAt || 0;
          return db - da;
        });
        console.log('DietaHistoryScreen - dati recuperati:', all);
        setRecords(all);
      } catch (err) {
        console.error('DietaHistoryScreen - errore fetchData:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [horseId, user, filtro]);



  // Calcolo alert dieta e semafori per ogni categoria
  const alertDieta = [];
  // Foraggio
  const recForaggio = records.find(r => r.categoria === 'foraggio');
  let colorForaggio = '#388e3c';
  if (!recForaggio || !recForaggio.quantita) colorForaggio = '#b71c1c';
  else if (recForaggio.quantita < 4) colorForaggio = '#b71c1c';
  else if (recForaggio.quantita < 6) colorForaggio = '#fbc02d';
  // Concentrati
  const recConcentrati = records.find(r => r.categoria === 'concentrati');
  let colorConcentrati = '#388e3c';
  if (!recConcentrati || !recConcentrati.quantita) colorConcentrati = '#b71c1c';
  // Idratazione
  const recIdratazione = records.find(r => r.categoria === 'idratazione');
  let colorIdratazione = '#388e3c';
  if (!recIdratazione || !recIdratazione.quantita) colorIdratazione = '#b71c1c';
  else if (recIdratazione.quantita < 10) colorIdratazione = '#b71c1c';
  else if (recIdratazione.quantita < 15) colorIdratazione = '#fbc02d';
  // Variazioni
  const recVariazioni = records.find(r => r.categoria === 'variazioni');
  let colorVariazioni = '#388e3c';
  if (recVariazioni) colorVariazioni = '#b71c1c';

  const filtered = filtro === 'all' ? records : records.filter(r => r.categoria === filtro);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Storico Dieta</Text>
      {/* Semafori categorie dieta */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 18, marginBottom: 18 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colorForaggio, borderWidth: 1, borderColor: '#888', marginBottom: 2 }} />
          <Text style={{ fontSize: 12, color: '#333' }}>Foraggio</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colorConcentrati, borderWidth: 1, borderColor: '#888', marginBottom: 2 }} />
          <Text style={{ fontSize: 12, color: '#333' }}>Concentrati</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colorIdratazione, borderWidth: 1, borderColor: '#888', marginBottom: 2 }} />
          <Text style={{ fontSize: 12, color: '#333' }}>Idratazione</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: colorVariazioni, borderWidth: 1, borderColor: '#888', marginBottom: 2 }} />
          <Text style={{ fontSize: 12, color: '#333' }}>Variazioni</Text>
        </View>
      </View>
      {/* ALERT CATEGORIA SE SELEZIONATA E SEMAFORO ROSSO/GIALLO */}
      {(() => {
        if (filtro === 'foraggio' && colorForaggio !== '#388e3c') {
          let msg = 'Foraggio insufficiente.';
          if (!recForaggio || !recForaggio.quantita) msg = 'Nessun dato foraggio inserito.';
          else if (recForaggio.quantita < 4) msg = 'Foraggio molto basso: meno di 4 kg/giorno.';
          else if (recForaggio.quantita < 6) msg = 'Foraggio insufficiente: meno di 6 kg/giorno.';
          return (
            <View style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#ffeeba' }}>
              <Text style={{ color: '#856404', fontWeight: 'bold' }}>Attenzione:</Text>
              <Text style={{ color: '#856404' }}>{msg}</Text>
            </View>
          );
        }
        if (filtro === 'concentrati' && colorConcentrati !== '#388e3c') {
          let msg = 'Nessun dato concentrati inserito.';
          return (
            <View style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#ffeeba' }}>
              <Text style={{ color: '#856404', fontWeight: 'bold' }}>Attenzione:</Text>
              <Text style={{ color: '#856404' }}>{msg}</Text>
            </View>
          );
        }
        if (filtro === 'idratazione' && colorIdratazione !== '#388e3c') {
          let msg = 'Idratazione insufficiente.';
          if (!recIdratazione || !recIdratazione.quantita) msg = 'Nessun dato idratazione inserito.';
          else if (recIdratazione.quantita < 10) msg = 'Idratazione molto bassa: meno di 10 L/giorno.';
          else if (recIdratazione.quantita < 15) msg = 'Idratazione bassa: meno di 15 L/giorno.';
          return (
            <View style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#ffeeba' }}>
              <Text style={{ color: '#856404', fontWeight: 'bold' }}>Attenzione:</Text>
              <Text style={{ color: '#856404' }}>{msg}</Text>
            </View>
          );
        }
        if (filtro === 'variazioni' && colorVariazioni !== '#388e3c') {
          let msg = 'Variazione recente nella dieta.';
          return (
            <View style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#ffeeba' }}>
              <Text style={{ color: '#856404', fontWeight: 'bold' }}>Attenzione:</Text>
              <Text style={{ color: '#856404' }}>{msg}</Text>
            </View>
          );
        }
        return null;
      })()}
      {alertDieta.length > 0 && (
        <View style={{ backgroundColor: '#fff3cd', borderRadius: 10, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#ffeeba' }}>
          <Text style={{ color: '#856404', fontWeight: 'bold', marginBottom: 4 }}>Alert dieta:</Text>
          {alertDieta.map((msg, i) => (
            <Text key={i} style={{ color: '#856404', marginBottom: 2 }}>• {msg}</Text>
          ))}
        </View>
      )}
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
        filtered.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.empty}>Nessun dato presente nello storico dieta.</Text>
          </View>
        ) : (
          filtered.map(rec => (
            <View key={rec.id} style={styles.card}>
              <Text style={styles.cardCat}>{
                rec.categoria === 'foraggio' ? 'Foraggio' :
                rec.categoria === 'concentrati' ? 'Concentrati' :
                rec.categoria === 'idratazione' ? 'Idratazione' :
                rec.categoria === 'pascolo' ? 'Pascolo' :
                rec.categoria === 'variazioni' ? 'Variazioni' : rec.categoria
              }</Text>
              {/* Campi principali per ogni categoria (adatta quando aggiungi i form) */}
              {rec.categoria === 'foraggio' && (
                <>
                  <Text style={styles.cardTipo}>Tipo: <Text style={{fontWeight:'normal'}}>{rec.tipo || '-'}</Text></Text>
                  <Text style={styles.cardDett}>Quantità: <Text style={{fontWeight:'normal'}}>{rec.quantita ? rec.quantita + ' kg' : '-'}</Text></Text>
                  <Text style={styles.cardDett}>Modalità: <Text style={{fontWeight:'normal'}}>{rec.modalita || '-'}</Text></Text>
                  {rec.qualita ? <Text style={styles.cardDett}>Qualità: <Text style={{fontWeight:'normal'}}>{rec.qualita}</Text></Text> : null}
                  {rec.note ? <Text style={styles.cardDett}>Note: <Text style={{fontWeight:'normal'}}>{rec.note}</Text></Text> : null}
                </>
              )}
              {rec.categoria === 'concentrati' && (
                <>
                  <Text style={styles.cardTipo}>Tipo: <Text style={{fontWeight:'normal'}}>{rec.tipo || '-'}</Text></Text>
                  <Text style={styles.cardDett}>Quantità: <Text style={{fontWeight:'normal'}}>{rec.quantita ? rec.quantita + ' kg' : '-'}</Text></Text>
                  <Text style={styles.cardDett}>Fornitore: <Text style={{fontWeight:'normal'}}>{rec.fornitore || '-'}</Text></Text>
                  {rec.note ? <Text style={styles.cardDett}>Note: <Text style={{fontWeight:'normal'}}>{rec.note}</Text></Text> : null}
                </>
              )}
              {rec.categoria === 'idratazione' && (
                <>
                  <Text style={styles.cardTipo}>Tipo: <Text style={{fontWeight:'normal'}}>{rec.tipo || '-'}</Text></Text>
                  <Text style={styles.cardDett}>Quantità: <Text style={{fontWeight:'normal'}}>{rec.quantita ? rec.quantita + ' L' : '-'}</Text></Text>
                  <Text style={styles.cardDett}>Modalità: <Text style={{fontWeight:'normal'}}>{rec.modalita || '-'}</Text></Text>
                  {rec.note ? <Text style={styles.cardDett}>Note: <Text style={{fontWeight:'normal'}}>{rec.note}</Text></Text> : null}
                </>
              )}
              {rec.categoria === 'pascolo' && (
                <>
                  <Text style={styles.cardTipo}>Tipo: <Text style={{fontWeight:'normal'}}>{rec.tipo || '-'}</Text></Text>
                  <Text style={styles.cardDett}>Durata: <Text style={{fontWeight:'normal'}}>{rec.durata ? rec.durata + ' h' : '-'}</Text></Text>
                  {rec.note ? <Text style={styles.cardDett}>Note: <Text style={{fontWeight:'normal'}}>{rec.note}</Text></Text> : null}
                </>
              )}
              {rec.categoria === 'variazioni' && (
                <>
                  <Text style={styles.cardTipo}>Tipo: <Text style={{fontWeight:'normal'}}>{rec.tipo || '-'}</Text></Text>
                  <Text style={styles.cardDett}>Descrizione: <Text style={{fontWeight:'normal'}}>{rec.descrizione || '-'}</Text></Text>
                  {rec.note ? <Text style={styles.cardDett}>Note: <Text style={{fontWeight:'normal'}}>{rec.note}</Text></Text> : null}
                </>
              )}
              <Text style={styles.cardData}>Data: {rec.createdAt?.toDate?.().toLocaleString?.('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) || '-'}</Text>
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
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  empty: { textAlign: 'center', color: COLORS.textLight, fontSize: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 14, elevation: 1 },
  cardCat: { fontSize: 13, color: COLORS.primary, fontWeight: 'bold', marginBottom: 2 },
  cardTipo: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 2 },
  cardDett: { fontSize: 13, color: COLORS.text, marginBottom: 1 },
  cardData: { fontSize: 11, color: COLORS.textLight, marginTop: 6, textAlign: 'right' },
});
