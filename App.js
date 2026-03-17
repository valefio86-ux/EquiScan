// ============================================================
// APP PRINCIPALE - EquiScan
// ============================================================
// Questo è il "cuore" dell'app. Da qui partono tutte le schermate.
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2E7D32' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'EquiScan' }}
        />
        {/* Qui aggiungeremo le altre schermate del progetto */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
