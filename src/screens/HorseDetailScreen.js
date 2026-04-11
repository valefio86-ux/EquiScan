import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLORS } from '../theme/colors';

export default function HorseDetailScreen({ route, navigation }) {
  const { horseId } = route.params;
  const [horse, setHorse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'horses', horseId), (snap) => {
      if (snap.exists()) {
        setHorse({ id: snap.id, ...snap.data() });
      } else {
        navigation.goBack();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [horseId]);

  const handleDelete = () => {
    const doDelete = async () => {
      await deleteDoc(doc(db, 'horses', horseId));
      navigation.goBack();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Eliminare ${horse?.name}? Questa azione non può essere annullata.`)) doDelete();
    } else {
      Alert.alert('Elimina Cavallo', `Eliminare ${horse?.name}? Questa azione non può essere annullata.`, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!horse) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isOverdue = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Dati identificativi */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dati identificativi</Text>
        <InfoRow label="Nome" value={horse.name} />
        <InfoRow label="Razza" value={horse.breed} />
        <InfoRow label="Sesso" value={horse.sex} />
        <InfoRow label="Mantello" value={horse.coatColor} />
        <InfoRow label="Anno di nascita" value={horse.birthYear ? `${horse.birthYear} (${horse.age} anni)` : null} />
        <InfoRow label="Microchip" value={horse.microchip} />
      </View>

      {/* Dati biometrici */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dati biometrici</Text>
        <InfoRow label="Peso" value={horse.weight ? `${horse.weight} kg` : null} />
        <InfoRow label="Altezza al garrese" value={horse.height ? `${horse.height} cm` : null} />
      </View>

      {/* Profilo sanitario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profilo sanitario</Text>
        <InfoRow label="Patologie pregresse" value={horse.medicalHistory} />
        <InfoRow label="Allergie" value={horse.allergies} />
        <InfoRow label="Farmaci in corso" value={horse.currentMedications} />
      </View>

      {/* Scadenze routine */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scadenze routine</Text>
        <DateRow label="Prossima sverminazione" value={horse.nextDeworming} formatDate={formatDate} isOverdue={isOverdue} />
        <DateRow label="Prossimo dentista" value={horse.nextDentist} formatDate={formatDate} isOverdue={isOverdue} />
        <DateRow label="Prossima vaccinazione" value={horse.nextVaccination} formatDate={formatDate} isOverdue={isOverdue} />
        <DateRow label="Prossimo maniscalco" value={horse.nextFarrier} formatDate={formatDate} isOverdue={isOverdue} />
      </View>

      {/* Pulsanti */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => navigation.navigate('EditHorse', { horseId: horse.id })}
      >
        <Text style={styles.editButtonText}>Modifica</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Elimina Cavallo</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

function DateRow({ label, value, formatDate, isOverdue }) {
  const overdue = isOverdue(value);
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, overdue && styles.overdueText]}>
        {value ? formatDate(value) : '—'}
        {overdue ? ' ⚠️ Scaduta' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: 14, color: COLORS.textLight, flex: 1 },
  rowValue: { fontSize: 14, color: COLORS.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  overdueText: { color: COLORS.error },
  editButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 10,
  },
  editButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 20,
  },
  deleteButtonText: { color: COLORS.error, fontSize: 16, fontWeight: '600' },
});
