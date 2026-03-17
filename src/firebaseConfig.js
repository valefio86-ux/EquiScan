// ============================================================
// CONFIGURAZIONE FIREBASE - EquiScan
// ============================================================
// Qui sotto devi inserire i TUOI dati di Firebase.
// Segui la guida nel README per ottenerli.
// ============================================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "INSERISCI_QUI_LA_TUA_API_KEY",
  authDomain: "INSERISCI_QUI.firebaseapp.com",
  projectId: "INSERISCI_QUI",
  storageBucket: "INSERISCI_QUI.appspot.com",
  messagingSenderId: "INSERISCI_QUI",
  appId: "INSERISCI_QUI"
};

// Avvia Firebase
const app = initializeApp(firebaseConfig);

// Avvia Firestore (il database dove salveremo i dati dei cavalli)
const db = getFirestore(app);

export { db };
