# 📋 PIANO PROGETTO — EquiScan

**Sistema di Monitoraggio Predittivo Equino**
**Progetto di tesi universitaria**
**Data inizio pianificazione:** 17 Marzo 2026

---

## 🎯 Obiettivo

EquiScan è un'app mobile (iPhone + Android) che previene le emergenze veterinarie equine.
Trasforma dati biometrici e visivi in indicatori di rischio immediati, facendo da ponte tra proprietario e veterinario.

**Non è un sostituto della diagnosi veterinaria** — è un Decision Support System (DSS).

---

## 🏗 Architettura

| Cosa | Tecnologia | Ruolo |
|------|-----------|-------|
| Codice | GitHub | Salva il codice sorgente |
| Database | Firebase Firestore | Salva i dati dei cavalli |
| Framework | React Native + Expo | App cross-platform (iOS + Android) |
| Navigazione | React Navigation | Gestione schermate |
| Autenticazione | Firebase Auth | Login email/password |
| File/Foto | Firebase Storage | Salvataggio foto e audio |
| Report | react-native-html-to-pdf | Generazione PDF |
| Notifiche | Expo Notifications | Push notifications |
| Lingue | i18n | Italiano + Inglese |

---

## 🎨 Design System

### Palette Colori
| Colore | Hex | Uso |
|--------|-----|-----|
| Verde Petrolio Scuro | `#004D40` | Colore principale, header, tasti primari |
| Verde Salvia Chiaro | `#A5D6A7` | Sfondi secondari, card attive |
| Bianco Ghiaccio | `#F5F7F8` | Sfondo principale |
| Arancione Corallo | `#FF7043` | Alert, tasti azione ("Inizia Check-up") |

### Tipografia
- **Titoli:** Poppins (Sans-Serif, moderno)
- **Corpo:** Roboto (leggibile, standard mobile)

### Stile UI
- **Icone:** Line Art pulita, minimalista, tratti sottili
- **Sagome cavallo:** Schematizzazione anatomica (non fumettosa)
- **Card:** Bianche con angoli arrotondati
- **Dashboard:** Indicatore circolare (Gauge) verde → rosso
- **Grafici:** Linee fluide con gradienti leggeri

### Logo
Sagoma stilizzata testa cavallo + onda sinusoidale (battito cardiaco) che attraversa la sagoma.

---

## 👤 Utenti

- **Unico tipo di utente:** il proprietario del cavallo
- **Login:** email + password (Firebase Auth)
- **Multi-cavallo:** un utente può gestire più cavalli
- **Veterinario:** non ha accesso all'app, riceve report PDF dal proprietario
- **Privacy by Design:** dati cavalli separati da anagrafiche proprietari

---

## 📱 Mappa delle Schermate

1. **Login / Registrazione**
2. **Dashboard** (stato salute a colpo d'occhio: gauge verde/giallo/rosso)
3. **Lista Cavalli** (se l'utente ne ha più di uno)
4. **Profilo Cavallo** (anagrafica + dati biometrici + storico sanitario)
5. **Monitoraggio Cardiaco** (metodo TAP)
6. **BCS Interattivo** (sagoma con 6 zone cliccabili)
7. **Horse Grimace Scale** (foto + checklist 6 Action Units)
8. **Borborigmi** (4 quadranti + registrazione audio opzionale)
9. **Gestione Dieta** (foraggio, concentrati, idratazione, pascolo, log variazioni)
10. **Modulo Riabilitazione** (post-colica)
11. **Diario Parassitario** (esami coprologici + trattamenti)
12. **Report PDF** (generazione e condivisione)
13. **Impostazioni** (lingua, notifiche, profilo utente)

---

## 📊 Dettaglio Funzionalità

---

### F1 — Autenticazione

**Cosa fa:** Login e registrazione con email e password.

- Registrazione con email + password
- Login
- Recupero password ("Password dimenticata")
- Logout
- Dati utente salvati su Firebase Auth

---

### F2 — Gestione Cavalli (Profilo)

**Cosa fa:** Creare, modificare, eliminare il profilo di un cavallo.

**Dati Identificativi:**
- Nome del cavallo
- Numero di microchip
- Sesso (Maschio / Femmina / Castrone) + stato gravidanza/lattazione per femmine
- Razza (con nota su predisposizioni: Quarter Horse, Pony = rischio insulino-resistenza)

**Dati Biometrici:**
- Data di nascita / Età
- Peso stimato (kg)
- Altezza al garrese

**Profilo Sanitario Pregresso:**
- Storia di coliche precedenti (sì/no, quante, dettagli)
- Interventi chirurgici addominali (sì/no, dettagli)
- Patologie metaboliche note (Cushing, Sindrome Metabolica Equina)

**Scadenze Routine:**
- Data ultima sverminazione
- Data ultimo intervento dentista

---

### F3 — Dashboard

**Cosa fa:** Mostra lo stato di salute del cavallo a colpo d'occhio.

- Indicatore circolare (Gauge) che va da verde a rosso
- Il punteggio è calcolato combinando tutti i moduli (battito, HGS, borborigmi, dieta, BCS)
- Card riassuntive per ogni parametro con stato colorato
- Se l'utente ha più cavalli: selettore in alto per cambiare cavallo
- Ultimo check-up registrato con data e ora

---

### F4 — Monitoraggio Cardiaco (Metodo TAP)

**Cosa fa:** Guida l'utente a misurare il battito cardiaco e calcola il rischio.

**Interfaccia:**
- Istruzioni: "Metti la mano dietro il gomito sinistro del cavallo"
- Tasto grande: l'utente preme a ogni pulsazione per 15 secondi
- Formula: BPM = (numero tocchi) × 4
- Risultato mostrato con colore dello stato

**Baseline:**
- Calcolata automaticamente come media delle ultime N misurazioni a riposo
- Salvata nel database per ogni cavallo

**Matrice di Rischio:**

| Incremento vs Baseline | Valore Assoluto | Stato | Colore | Azione |
|------------------------|----------------|-------|--------|--------|
| < 10% | 36 - 40 bpm | Normale | 🟢 Verde | Nessuna |
| +20% / 30% | 44 - 48 bpm | Warning | 🟡 Giallo | Ricontrolla tra 15 min, verifica borborigmi |
| +50% o > 52 bpm | > 52 bpm | Critical | 🟠 Arancione | Contatta il veterinario, non dare cibo |
| — | > 80 bpm | Emergency | 🔴 Rosso | Emergenza immediata, pericolo di vita |

---

### F5 — BCS Interattivo (Body Condition Score)

**Cosa fa:** Calcola il punteggio di grasso corporeo Henneke (1-9) tramite valutazione visiva e tattile guidata.

**Interfaccia:**
- Sagoma anatomica del cavallo con **6 zone cliccabili**
- L'utente clicca su ogni zona e risponde a domande guidate
- Immagini di riferimento per ogni zona

**Le 6 Zone:**
1. **Collo** — accumulo di adipe sulla cresta nuchale
2. **Garrese** — osso prominente o circondato da grasso
3. **Dietro la spalla** — zona di accumulo precoce
4. **Costole** — visibili? Palpabili solo premendo?
5. **Schiena** — colonna vertebrale sporgente o affondata nel grasso
6. **Attaccatura della coda** — morbidezza del tessuto

**Scala e Alert:**

| Punteggio | Stato | Azione |
|-----------|-------|--------|
| 1 - 3 | Sottopeso | Monitoraggio nutrizionale |
| 4 - 6 | Ideale | Normale |
| 7 | Sovrappeso | Attenzione dieta |
| 8 - 9 | Obeso | 🔴 Alert Metabolico (rischio insulino-resistenza, chetoni) |

---

### F6 — Horse Grimace Scale (HGS)

**Cosa fa:** Valuta il dolore tramite analisi delle espressioni facciali del cavallo.

**Flusso:**
1. L'app guida l'utente a scattare una foto del muso (di profilo, a livello occhi)
2. La foto viene mostrata grande sullo schermo
3. Accanto: checklist interattiva per le 6 Action Units
4. Per ogni zona: 3 immagini di riferimento (punteggio 0, 1, 2)
5. L'utente confronta e assegna il punteggio
6. Foto + punteggio salvati su Firebase

**6 Action Units (scala 0-1-2 ciascuna, max totale = 12):**
1. **Orecchie** — Indietro, abbassate o divaricate?
2. **Occhio** — Tensione sopra l'orbita, occhio a triangolo o socchiuso?
3. **Area Sopraorbitale** — Muscoli tesi o prominenti?
4. **Narici** — Contratte, dilatate o a punta?
5. **Bocca** — Labbra serrate, mento teso o prominente?
6. **Profilo (Naso)** — Linea del naso tesa e rigida?

**Alert:**

| Punteggio | Livello Dolore | Colore | Azione |
|-----------|---------------|--------|--------|
| 0 - 2 | Nullo / Lieve | 🟢 Verde | Normale |
| 3 - 5 | Moderato | 🟡 Giallo | Ricontrolla tra 30 min, verifica borborigmi e battito |
| ≥ 6 | Significativo | 🔴 Rosso | Contatta il veterinario. Probabile colica o dolore acuto |

---

### F7 — Borborigmi (Auscultazione Intestinale)

**Cosa fa:** Monitora i suoni intestinali nei 4 quadranti addominali.

**Interfaccia:**
- Foto/sagoma del fianco del cavallo divisa in **4 zone cliccabili**
- L'utente clicca una zona, ascolta (con orecchio o fonendoscopio), e assegna il voto
- Opzione: registrazione audio di 10 secondi (per il veterinario, non per analisi automatica)

**4 Quadranti:**
1. **Superiore Destro** (Ceco) — suono idroaereo ("sciacquone")
2. **Inferiore Destro** (Grosso Colon) — suoni di fermentazione
3. **Superiore Sinistro** (Piccolo Colon/Tenue) — suoni più acuti
4. **Inferiore Sinistro** (Grosso Colon) — suoni di transito

**Scala per quadrante (0-3):**

| Punteggio | Stato | Significato |
|-----------|-------|-------------|
| 0 | Assenti | Silenzio ileale (GRAVE): possibile blocco o torsione |
| 1 | Ridotti | Ipomotilità: inizio di colica o disidratazione |
| 2 | Normali | Motilità regolare |
| 3 | Aumentati | Ipermotilità: possibile colica gassosa o irritazione |

**Alert Incrociati:**

| Condizione | Livello | Colore |
|-----------|---------|--------|
| ≥ 2 quadranti a 0 (Assenti) | Emergency | 🔴 Rosso |
| ≥ 3 quadranti a 1 (Ridotti), soprattutto se HR +30% | Critical | 🟠 Arancione |
| Suoni persistenti a 3 (Aumentati) | Warning | 🟡 Giallo |

---

### F8 — Gestione Dieta e Metabolismo

**Cosa fa:** Traccia l'alimentazione e calcola i rischi metabolici.

**A. Foraggio:**
- Tipologia prevalente (menu: Fieno polifita, Erba medica, Loietto, Insilato)
- Quantità giornaliera (kg) — alert se < 2% del peso corporeo
- Modalità somministrazione (A terra, Rete/Slow-feeder, Ad libitum)
- Qualità percepita (Presenza polvere, muffe, corpi estranei)

**B. Concentrati:**
- Tipo mangime (Fioccato, Pellettato, Cereali schiacciati)
- Numero pasti al giorno
- Quantità per singolo pasto (kg) — alert se > 2.5 kg
- Zuccheri aggiunti (Melassa, integratori dolcificati)

**C. Idratazione:**
- Tipo di abbeverata (Beverino automatico, Secchio, Vasca)
- Accesso al sale (Rullo presente/assente)

**D. Pascolo:**
- Ore di accesso al pascolo
- Tipo di erba (Verde/Primaverile, Secca/Estiva)

**E. Log di Variazione (CRITICO):**
- Cambio partita di fieno (Sì/No + data)
- Cambio marca di mangime (Sì/No)
- Spostamento di box/scuderia

**Alert Chetoni (Iperlipemia / Bilancio Energetico Negativo):**
```
Rischio = Fattore_BCS_Inverso + Fattore_Sesso + StressorAlimentare
Dove: BCS basso (1-3) = rischio alto, BCS alto (7-9) = rischio basso
```
- BCS 1-3: **alto rischio** (poche riserve → il corpo mobilizza grassi rapidamente → produzione chetoni)
- BCS 7-9: rischio basso (più riserve energetiche disponibili)
- Femmina gravida/lattante: rischio raddoppiato (fabbisogno energetico elevato)
- Pony/Muli: metabolismo grassi più aggressivo, predisposti a iperlipemia
- Trigger: il cavallo smette di mangiare o ha una colica → alert immediato (bilancio energetico negativo)

**Alert Acidosi (Cambio Dieta):**
- Periodo critico: **primi 5-7 giorni** dopo un cambio
- Trigger: sostituzione >20% razione in un giorno, passaggio fieno→erba primaverile, pasto cereali >2.5 kg
- L'app entra in **Safe-Mode per 7 giorni**: chiede ogni sera "Le feci sono più molli del solito?"

---

### F9 — Modulo Riabilitazione (Post-Colica)

**Cosa fa:** Monitoraggio granulare durante il recupero da una colica.

- Somministrazione pastone/mash (quantità, grado idratazione)
- Presenza di feci nel box (consistenza: Normali, Secche, Diarrea)
- Appetito (Ha consumato tutto il pasto? Sì/No)

---

### F10 — Diario Parassitario (Strongili)

**Cosa fa:** Traccia gli esami coprologici e i trattamenti antiparassitari.

**Campi per ogni registrazione:**
- Data esame
- Risultato (conta UPG/FEC)
- Tipo di parassiti trovati
- Trattamento eseguito (Sì/No + data trattamento)
- Principio attivo utilizzato (se disponibile)
- Promemoria prossimo controllo (impostazione manuale, non obbligatorio)

---

### F11 — Report PDF

**Cosa fa:** Genera un documento scaricabile e inviabile al veterinario.

**Opzioni per l'utente:**
- **Report completo:** tutti i dati del cavallo
- **Report periodico:** scegli il periodo
  - Ultima settimana
  - Ultimo mese
  - Ultimi 3 mesi
  - Ultimi 6 mesi
  - Ultimo anno

**Condivisione:** tramite il menu di condivisione del telefono (WhatsApp, email, Telegram, ecc.)

---

### F12 — Notifiche Push

**Cosa fa:** Invia notifiche al telefono anche quando l'app è chiusa.

- Attivabili/disattivabili dall'utente nelle impostazioni
- Tipi: alert battito, promemoria check-up, scadenze sverminazione/dentista, fine Safe-Mode

---

### F13 — Internazionalizzazione (i18n)

**Cosa fa:** L'app funziona in italiano e inglese.

- L'utente sceglie la lingua nelle impostazioni
- Tutti i testi dell'interfaccia sono tradotti
- La lingua di default segue quella del telefono

---

## 📦 Fasi di Sviluppo (Step-by-Step)

Ogni fase viene completata e testata prima di passare alla successiva.

---

### FASE 0 — Setup Iniziale ✅
- [x] Creare repository GitHub
- [x] Struttura progetto React Native + Expo
- [x] Collegamento Firebase (Firestore)
- [x] File di configurazione

---

### FASE 1 — Autenticazione ✅
- [x] Step 1.1: Schermata di Registrazione (email + password)
- [x] Step 1.2: Schermata di Login
- [x] Step 1.3: Funzione "Password dimenticata"
- [x] Step 1.4: Protezione delle schermate (solo utenti loggati)
- [x] Step 1.5: Pulsante Logout
- [ ] 🧪 **TEST:** Registrazione, login, logout, recupero password

---

### FASE 2 — Profilo Cavallo
- [ ] Step 2.1: Schermata Lista Cavalli (con tasto "Aggiungi cavallo")
- [ ] Step 2.2: Form creazione cavallo (dati identificativi)
- [ ] Step 2.3: Form dati biometrici (peso, altezza, età)
- [ ] Step 2.4: Form profilo sanitario pregresso
- [ ] Step 2.5: Form scadenze routine (sverminazione, dentista)
- [ ] Step 2.6: Modifica e eliminazione cavallo
- [ ] Step 2.7: Struttura dati Firestore (collezioni e documenti)
- [ ] 🧪 **TEST:** Creare, modificare, eliminare un cavallo. Verificare i dati su Firebase.

---

### FASE 3 — Dashboard
- [ ] Step 3.1: Layout dashboard con Gauge circolare
- [ ] Step 3.2: Card riassuntive per ogni parametro
- [ ] Step 3.3: Selettore cavallo (se più di uno)
- [ ] Step 3.4: Collegamento dati reali dai moduli (inizialmente vuoti)
- [ ] 🧪 **TEST:** Visualizzazione corretta, cambio cavallo

---

### FASE 4 — Monitoraggio Cardiaco
- [ ] Step 4.1: Schermata con istruzioni per l'utente
- [ ] Step 4.2: Tasto TAP grande + timer 15 secondi
- [ ] Step 4.3: Calcolo BPM (tocchi × 4)
- [ ] Step 4.4: Salvataggio misurazione su Firestore
- [ ] Step 4.5: Calcolo baseline automatico (media ultime N misurazioni)
- [ ] Step 4.6: Logica alert (4 livelli: Verde, Giallo, Arancione, Rosso)
- [ ] Step 4.7: Storico misurazioni con grafico
- [ ] 🧪 **TEST:** Simulare misurazioni, verificare calcolo BPM, alert, baseline

---

### FASE 5 — BCS Interattivo
- [x] Step 5.1: Sagoma cavallo con 6 zone cliccabili
- [x] Step 5.2: Domande guidate per ogni zona
- [x] Step 5.3: Immagini di riferimento per ogni zona
- [x] Step 5.4: Calcolo punteggio Henneke (media delle 6 zone)
- [x] Step 5.5: Salvataggio su Firestore + alert metabolico (BCS 8-9)
- [x] Step 5.6: Storico BCS
- [x] 🧪 **TEST:** Completare una valutazione, verificare punteggio e alert

---

### FASE 6 — Horse Grimace Scale
- [ ] Step 6.1: Guida scatto foto (istruzioni posizionamento)
- [ ] Step 6.2: Cattura foto con fotocamera del telefono
- [ ] Step 6.3: Visualizzazione foto + checklist 6 Action Units
- [ ] Step 6.4: Immagini di riferimento (punteggio 0, 1, 2 per ogni AU)
- [ ] Step 6.5: Calcolo punteggio totale + alert (Verde/Giallo/Rosso)
- [ ] Step 6.6: Salvataggio foto su Firebase Storage + punteggio su Firestore
- [ ] Step 6.7: Storico valutazioni HGS
- [ ] 🧪 **TEST:** Scattare foto, completare checklist, verificare salvataggio e alert

---

### FASE 7 — Borborigmi
- [ ] Step 7.1: Sagoma fianco cavallo con 4 quadranti cliccabili
- [ ] Step 7.2: Interfaccia valutazione per quadrante (scala 0-3)
- [ ] Step 7.3: Registrazione audio opzionale (10 secondi)
- [ ] Step 7.4: Salvataggio audio su Firebase Storage
- [ ] Step 7.5: Logica alert incrociati (Rosso/Arancione/Giallo)
- [ ] Step 7.6: Storico auscultazioni
- [ ] 🧪 **TEST:** Valutazione 4 quadranti, registrazione audio, alert incrociati

---

### FASE 8 — Gestione Dieta e Metabolismo
- [ ] Step 8.1: Form Foraggio (tipo, quantità, modalità, qualità)
- [ ] Step 8.2: Form Concentrati (tipo, pasti, quantità, zuccheri)
- [ ] Step 8.3: Form Idratazione (abbeverata, sale)
- [ ] Step 8.4: Form Pascolo (ore, tipo erba)
- [ ] Step 8.5: Log di Variazione (cambio fieno, mangime, box)
- [ ] Step 8.6: Alert foraggio < 2% peso + pasto > 2.5 kg
- [ ] Step 8.7: Algoritmo rischio chetoni (BCS + Sesso + Stressor)
- [ ] Step 8.8: Safe-Mode 7 giorni (domanda serale feci)
- [ ] Step 8.9: Alert acidosi per cambio dieta
- [ ] 🧪 **TEST:** Inserimento dieta, cambio mangime, verifica Safe-Mode e alert

---

### FASE 9 — Modulo Riabilitazione (Post-Colica)
- [ ] Step 9.1: Attivazione modulo post-colica
- [ ] Step 9.2: Form pastone/mash
- [ ] Step 9.3: Form feci (consistenza)
- [ ] Step 9.4: Form appetito
- [ ] 🧪 **TEST:** Ciclo completo di riabilitazione

---

### FASE 10 — Diario Parassitario
- [ ] Step 10.1: Lista esami coprologici
- [ ] Step 10.2: Form nuovo esame (data, UPG, parassiti, trattamento)
- [ ] Step 10.3: Promemoria manuale (prossimo controllo)
- [ ] 🧪 **TEST:** Aggiungere esami, verificare lista e promemoria

---

### FASE 11 — Sistema Alert Combinato
- [ ] Step 11.1: Algoritmo che combina tutti i moduli per il punteggio dashboard
- [ ] Step 11.2: Pesi relativi di ogni modulo nel calcolo totale
- [ ] Step 11.3: Logica alert incrociati (es. borborigmi assenti + battito alto)
- [ ] 🧪 **TEST:** Simulare scenari multipli, verificare coerenza alert

---

### FASE 12 — Report PDF
- [ ] Step 12.1: Template PDF con branding EquiScan
- [ ] Step 12.2: Report completo (tutti i dati)
- [ ] Step 12.3: Report periodico (settimana/mese/3mesi/6mesi/anno)
- [ ] Step 12.4: Download e condivisione tramite menu telefono
- [ ] 🧪 **TEST:** Generare PDF, condividere via WhatsApp/email

---

### FASE 13 — Notifiche Push
- [ ] Step 13.1: Setup Expo Notifications
- [ ] Step 13.2: Notifiche per alert sanitari
- [ ] Step 13.3: Notifiche per scadenze (sverminazione, dentista)
- [ ] Step 13.4: Impostazioni on/off per l'utente
- [ ] 🧪 **TEST:** Ricevere notifiche su dispositivo reale

---

### FASE 14 — Internazionalizzazione (i18n)
- [ ] Step 14.1: Setup sistema traduzioni
- [ ] Step 14.2: Traduzione interfaccia Italiano
- [ ] Step 14.3: Traduzione interfaccia Inglese
- [ ] Step 14.4: Selezione lingua nelle impostazioni
- [ ] 🧪 **TEST:** Cambio lingua, verifica tutti i testi

---

### FASE 15 — Design e Polish Finale
- [ ] Step 15.1: Applicare palette colori definitiva
- [ ] Step 15.2: Inserire font Poppins + Roboto
- [ ] Step 15.3: Icone Line Art per tutte le sezioni
- [ ] Step 15.4: Logo EquiScan
- [ ] Step 15.5: Splash screen e icona app
- [ ] Step 15.6: Revisione UI/UX completa
- [ ] 🧪 **TEST FINALE:** Test completo su iOS e Android

---

## ⚖️ Note Legali e Accademiche

- **Privacy by Design:** i dati dei cavalli sono separati dalle anagrafiche dei proprietari
- **Disclaimer in-app:** "EquiScan è uno strumento di supporto decisionale. Non sostituisce la diagnosi veterinaria professionale."
- **Dati su Firebase:** i dati restano nel cloud europeo (server `eur3`)
