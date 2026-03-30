// ============================================================
// CONFIGURAZIONE FIREBASE - EquiScan
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAZTT8jTcGFId8VcaVlSBqFDBo6qXwMhlM",
  authDomain: "equiscan-project.firebaseapp.com",
  projectId: "equiscan-project",
  storageBucket: "equiscan-project.firebasestorage.app",
  messagingSenderId: "342494832550",
  appId: "1:342494832550:web:455cab58c41d85958b9167"
};

// Avvia Firebase
const app = initializeApp(firebaseConfig);

// Avvia Firestore (il database dove salveremo i dati dei cavalli)
const db = getFirestore(app);

// Avvia Auth (il sistema di login) con persistenza locale
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, auth };
