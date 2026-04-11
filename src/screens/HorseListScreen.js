import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function HorseListScreen({ navigation }) {
  const { user } = useAuth();
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'horses'),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setHorses(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const showAlert = (title, msg) => {
    if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert(title, msg); }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Vuoi uscire dal tuo account?')) signOut(auth);
    } else {
      Alert.alert('Logout', 'Vuoi uscire dal tuo account?', [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', style: 'destructive', onPress: () => signOut(auth) },
      ]);
    }
  };

  const handleDelete = (horse) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Eliminare ${horse.name}?`)) {
        deleteDoc(doc(db, 'horses', horse.id));
      }
    } else {
      Alert.alert('Elimina', `Eliminare ${horse.name}?`, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => deleteDoc(doc(db, 'horses', horse.id)) },
      ]);
    }
  };

  const renderHorse = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('HorseDetail', { horseId: item.id })}
    >
      <View style={styles.cardContent}>
        <Text style={styles.horseName}>{item.name}</Text>
        <Text style={styles.horseInfo}>
          {[item.breed, item.age ? `${item.age} anni` : null].filter(Boolean).join(' · ') || 'Nessun dettaglio'}
        </Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {horses.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🐴</Text>
          <Text style={styles.emptyTitle}>Nessun cavallo</Text>
          <Text style={styles.emptyText}>Aggiungi il tuo primo cavallo per iniziare!</Text>
        </View>
      ) : (
        <FlatList
          data={horses}
          keyExtractor={(item) => item.id}
          renderItem={renderHorse}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddHorse')}
      >
        <Text style={styles.addButtonText}>+ Aggiungi Cavallo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16, paddingBottom: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingTop: 16, paddingBottom: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  cardContent: { flex: 1 },
  horseName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  horseInfo: { fontSize: 14, color: COLORS.textLight },
  arrow: { fontSize: 24, color: COLORS.textLight, marginLeft: 8 },
  emptyIcon: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 40 },
  addButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, marginBottom: 8,
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  logoutButton: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, paddingVertical: 10, alignItems: 'center',
  },
  logoutText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },
});
