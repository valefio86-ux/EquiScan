import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../theme/colors';

export default function DietaMenuScreen({ route, navigation }) {
  const { horseId } = route.params || {};
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gestione Dieta</Text>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DietaForaggio', { horseId })}
      >
        <Text style={styles.menuButtonText}>Foraggio</Text>
        <Text style={styles.menuButtonDesc}>Tipo, quantità, modalità, qualità</Text>
      </TouchableOpacity>
      {/* ...categorie inserimento... */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DietaConcentrati', { horseId })}
      >
        <Text style={styles.menuButtonText}>Concentrati</Text>
        <Text style={styles.menuButtonDesc}>Tipo, pasti, quantità, zuccheri</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DietaIdratazione', { horseId })}
      >
        <Text style={styles.menuButtonText}>Idratazione</Text>
        <Text style={styles.menuButtonDesc}>Abbeverata, sale</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DietaPascolo', { horseId })}
      >
        <Text style={styles.menuButtonText}>Pascolo</Text>
        <Text style={styles.menuButtonDesc}>Ore, tipo erba</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => navigation.navigate('DietaVariazioni', { horseId })}
      >
        <Text style={styles.menuButtonText}>Variazioni dieta</Text>
        <Text style={styles.menuButtonDesc}>Cambi fieno, mangime, box</Text>
      </TouchableOpacity>

      {/* Pulsante storico separato in fondo */}
      <TouchableOpacity
        style={[styles.menuButton, { borderColor: COLORS.primary, marginTop: 32, flexDirection: 'row', alignItems: 'center' }]}
        onPress={() => navigation.navigate('DietaHistory', { horseId })}
      >
        <Text style={{ fontSize: 22, marginRight: 10 }}>📊</Text>
        <View>
          <Text style={[styles.menuButtonText, { color: COLORS.primary }]}>Storico Dieta</Text>
          <Text style={[styles.menuButtonDesc, { color: COLORS.primary }]}>Visualizza tutte le registrazioni alimentari</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, marginBottom: 18, textAlign: 'center' },
  menuButton: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.primaryLight, elevation: 1,
  },
  menuButtonText: { fontSize: 17, fontWeight: 'bold', color: COLORS.primary },
  menuButtonDesc: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
});
