// ============================================================
// SCHERMATA HOME - EquiScan
// ============================================================
// Schermata principale dopo il login.
// Mostra un messaggio di benvenuto e il pulsante Logout.
// Diventerà la Dashboard nelle fasi successive.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

export default function HomeScreen() {
  const { user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Vuoi uscire dal tuo account?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: () => signOut(auth),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐴 EquiScan</Text>
      <Text style={styles.subtitle}>Benvenuto!</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.statusCard}>
        <Text style={styles.status}>✅ Autenticazione funzionante</Text>
        <Text style={styles.info}>Pronta per la Fase 2: Profilo Cavallo</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  status: {
    fontSize: 16,
    color: COLORS.success,
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
