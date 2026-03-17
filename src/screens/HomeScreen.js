// ============================================================
// SCHERMATA HOME - EquiScan
// ============================================================
// Questa è la prima schermata che l'utente vede aprendo l'app.
// Per ora mostra un messaggio di benvenuto.
// La personalizzeremo dopo con i dettagli del progetto.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐴 EquiScan</Text>
      <Text style={styles.subtitle}>La tua app per i cavalli</Text>
      <Text style={styles.status}>✅ App funzionante!</Text>
      <Text style={styles.info}>Pronta per essere personalizzata</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
  },
  status: {
    fontSize: 16,
    color: '#2E7D32',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#888',
  },
});
