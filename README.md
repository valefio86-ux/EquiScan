# 🐴 EquiScan

App mobile (iPhone + Android) per la gestione dei cavalli.

- **GitHub** → salva il codice (le "istruzioni" dell'app)
- **Firebase** → salva i dati (le informazioni sui cavalli)

---

## 📁 Struttura del progetto

```
EquiScan/
├── App.js                    ← Cuore dell'app (punto di partenza)
├── package.json              ← Lista delle librerie usate
├── app.json                  ← Impostazioni dell'app (nome, icona, ecc.)
├── babel.config.js           ← Configurazione tecnica
└── src/
    ├── firebaseConfig.js     ← Collegamento a Firebase (database)
    └── screens/
        └── HomeScreen.js     ← Schermata principale
```

---

## 🔥 Come collegare Firebase (passo per passo)

### Passo 1 — Creare il progetto Firebase
1. Apri il browser e vai su: https://console.firebase.google.com
2. Accedi con il tuo account Google
3. Clicca il pulsante **"Aggiungi progetto"**
4. Scrivi come nome: **EquiScan project**
5. Clicca **Continua** (puoi disattivare Google Analytics)
6. Clicca **Crea progetto** e aspetta che finisca

### Passo 2 — Aggiungere un'app Web
1. Nella pagina del progetto, clicca l'icona **</>** (Web)
2. Come nome scrivi: **EquiScan App**
3. Clicca **Registra app**
4. Ti apparirà un blocco di codice — **copia questi valori:**
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Passo 3 — Inserire i valori nel codice
1. Apri il file `src/firebaseConfig.js`
2. Sostituisci i testi `"INSERISCI_QUI..."` con i valori che hai copiato

### Passo 4 — Attivare Firestore (il database)
1. Nella console Firebase, nel menu a sinistra clicca **"Firestore Database"**
2. Clicca **"Crea database"**
3. Scegli **"Avvia in modalità test"** (per ora va bene così)
4. Scegli la posizione del server più vicina a te (es. `eur3 - Europe`)
5. Clicca **Abilita**

✅ **Fatto!** Firebase è pronto per salvare i dati dei cavalli.

---

## 🛠 Tecnologie usate

| Cosa | A cosa serve |
|------|-------------|
| **React Native + Expo** | Creare l'app per iPhone e Android |
| **Firebase Firestore** | Salvare i dati dei cavalli nel cloud |
| **React Navigation** | Spostarsi tra le schermate dell'app |