# 🐴 EquiScan

**Sistema di Monitoraggio Predittivo Equino**

App mobile (iPhone + Android) per la prevenzione delle emergenze veterinarie, con focus su coliche equine e sindromi metaboliche. Progetto di tesi universitaria.

> ⚕️ *EquiScan è uno strumento di supporto decisionale (DSS). Non sostituisce la diagnosi veterinaria professionale.*

---

## 💡 Come funziona

- **GitHub** → salva il **codice** (le "istruzioni" dell'app)
- **Firebase** → salva i **dati** (le informazioni sui cavalli)

L'app trasforma dati biometrici e visivi in indicatori di rischio immediati, facendo da ponte tra proprietario e veterinario.

---

## 🔧 Funzionalità principali

| Funzione | Descrizione |
|----------|-------------|
| 🔐 **Login** | Registrazione e accesso con email e password |
| 🐴 **Profilo Cavallo** | Anagrafica, biometria, storico sanitario, scadenze |
| 📊 **Dashboard** | Stato di salute a colpo d'occhio (Gauge verde/giallo/rosso) |
| ❤️ **Monitoraggio Cardiaco** | Metodo TAP per misurare il battito + alert a 4 livelli |
| ⚖️ **BCS Interattivo** | Body Condition Score Henneke (1-9) con sagoma cliccabile |
| 👁 **Horse Grimace Scale** | Foto + checklist dolore (6 Action Units) |
| 🔊 **Borborigmi** | Auscultazione 4 quadranti + registrazione audio opzionale |
| 🥕 **Gestione Dieta** | Foraggio, concentrati, idratazione, pascolo, log variazioni |
| 🧪 **Alert Metabolici** | Rischio chetoni + Safe-Mode 7 giorni per cambio dieta |
| 🪱 **Diario Parassitario** | Esami coprologici e trattamenti strongili |
| 🩹 **Riabilitazione** | Monitoraggio post-colica (feci, appetito, pastone) |
| 📄 **Report PDF** | Completo o periodico, condivisibile con il veterinario |
| 🔔 **Notifiche Push** | Alert sanitari e scadenze (attivabili/disattivabili) |
| 🌐 **Bilingue** | Italiano + Inglese |

---

## 🏗 Tecnologie usate

| Cosa | A cosa serve |
|------|-------------|
| **React Native + Expo** | Creare l'app per iPhone e Android |
| **Firebase Auth** | Login e registrazione utenti |
| **Firebase Firestore** | Salvare i dati dei cavalli nel cloud |
| **Firebase Storage** | Salvare foto e audio |
| **React Navigation** | Spostarsi tra le schermate dell'app |
| **Expo Notifications** | Notifiche push |

---

## 🎨 Design

| Elemento | Valore |
|----------|--------|
| Colore principale | Verde Petrolio `#004D40` |
| Colore secondario | Verde Salvia `#A5D6A7` |
| Sfondo | Bianco Ghiaccio `#F5F7F8` |
| Accento / Alert | Arancione Corallo `#FF7043` |
| Font titoli | Poppins |
| Font corpo | Roboto |
| Stile icone | Line Art minimalista |

---

## 📁 Struttura del progetto

```
EquiScan/
├── App.js                     ← Cuore dell'app (punto di partenza)
├── package.json               ← Lista delle librerie usate
├── app.json                   ← Impostazioni dell'app (nome, icona, ecc.)
├── babel.config.js            ← Configurazione tecnica
├── PIANO_PROGETTO.md          ← Piano dettagliato con tutte le fasi
└── src/
    ├── firebaseConfig.js      ← Collegamento a Firebase (database)
    └── screens/
        └── HomeScreen.js      ← Schermata principale
```

---

## 🔥 Configurazione Firebase

**Progetto Firebase:** `equiscan-project`

### Passo 1 — Creare il progetto Firebase
1. Vai su: https://console.firebase.google.com
2. Accedi con il tuo account Google
3. Clicca **"Aggiungi progetto"** → nome: **EquiScan project**
4. Clicca **Continua** → **Crea progetto**

### Passo 2 — Aggiungere un'app Web
1. Clicca l'icona **</>** (Web)
2. Nome: **EquiScan App** → **Registra app**
3. Copia i valori di configurazione (apiKey, authDomain, ecc.)

### Passo 3 — Inserire i valori nel codice
1. Apri `src/firebaseConfig.js`
2. Sostituisci i testi placeholder con i valori copiati
3. ✅ Già completato!

### Passo 4 — Attivare Firestore
1. Nel menu a sinistra: **Firestore Database** → **Crea database**
2. Modalità test → Server `eur3 - Europe` → **Abilita**

---

## 📋 Piano di sviluppo

Il piano dettagliato con tutte le fasi, gli step e i test è nel file **PIANO_PROGETTO.md**.