import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/theme/colors';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HorseListScreen from './src/screens/HorseListScreen';
import AddHorseScreen from './src/screens/AddHorseScreen';
import HorseDetailScreen from './src/screens/HorseDetailScreen';
import EditHorseScreen from './src/screens/EditHorseScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HeartRateScreen from './src/screens/HeartRateScreen';
import HeartRateHistoryScreen from './src/screens/HeartRateHistoryScreen';
import BCSScreen from './src/screens/BCSScreen';
import BCSHistoryScreen from './src/screens/BCSHistoryScreen';
import HGSScreen from './src/screens/HGSScreen';
import HGSHistoryScreen from './src/screens/HGSHistoryScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: COLORS.white, headerTitleStyle: { fontWeight: 'bold' } }}>
      <AppStack.Screen name="HorseList" component={HorseListScreen} options={{ title: 'I miei Cavalli' }} />
      <AppStack.Screen name="AddHorse" component={AddHorseScreen} options={{ title: 'Nuovo Cavallo' }} />
      <AppStack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <AppStack.Screen name="HorseDetail" component={HorseDetailScreen} options={{ title: 'Profilo Cavallo' }} />
      <AppStack.Screen name="EditHorse" component={EditHorseScreen} options={{ title: 'Modifica Cavallo' }} />
      <AppStack.Screen name="HeartRate" component={HeartRateScreen} options={{ title: 'Battito Cardiaco' }} />
      <AppStack.Screen name="HeartRateHistory" component={HeartRateHistoryScreen} options={{ title: 'Storico Battito' }} />
      <AppStack.Screen name="BCS" component={BCSScreen} options={{ title: 'Body Condition Score' }} />
      <AppStack.Screen name="BCSHistory" component={BCSHistoryScreen} options={{ title: 'Storico BCS' }} />
      <AppStack.Screen name="HGS" component={HGSScreen} options={{ title: 'Scala Dolore (HGS)' }} />
      <AppStack.Screen name="HGSHistory" component={HGSHistoryScreen} options={{ title: 'Storico HGS' }} />
    </AppStack.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return (
    <NavigationContainer>
      <StatusBar style={user ? 'light' : 'dark'} />
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
