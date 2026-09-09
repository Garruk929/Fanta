# ⚽ Fanta Live

![Fanta Live](logo.svg)

**Fanta Live** è una web app gratuita pensata per accompagnarti durante l'asta del Fantacalcio: cerca i giocatori, registra gli acquisti e lascia che l'app ricalcoli in tempo reale budget, hard stop e correzioni per reparto.

👉 **App pubblica:** https://garruk929.github.io/Fanta/

## Anteprima

<p align="center">
  <img src="docs/preview.svg" alt="Anteprima Fanta Live" width="380">
</p>

## Funzioni principali

- configurazione iniziale di **crediti, numero squadre e slot P/D/C/A**
- ricerca rapida del listone
- **hard stop dinamico** per ogni giocatore
- strategia che si adatta dopo ogni acquisto:
  - quanto hai speso/risparmiato rispetto al piano
  - quanti crediti togliere o aggiungere a P, D, C e A
  - budget consigliato residuo per ogni reparto
- gestione **Preso da me / Preso da un altro**
- rosa ordinata per ruolo e, all'interno del ruolo, per prezzo pagato
- indicazione di rigoristi, indisponibilità e profilo tecnico
- alternative immediate per ruolo
- undo dell'ultima operazione
- backup/import dell'asta dalle Impostazioni
- PWA installabile su iPhone/iPad e altri dispositivi compatibili
- dati dell'asta salvati localmente nel browser

## Come usarla

1. Apri **https://garruk929.github.io/Fanta/**.
2. Imposta budget, numero di squadre e numero di giocatori per ruolo.
3. Durante l'asta cerca un giocatore e apri la sua scheda.
4. Inserisci il prezzo finale e scegli **Preso da me**, oppure segna **Uscito / preso da un altro**.
5. Controlla la sezione **Strategia dinamica**: i budget dei reparti e gli hard stop si aggiornano automaticamente.

### Installazione su iPhone/iPad

Apri l'app in **Safari** → **Condividi** → **Aggiungi alla schermata Home**.

Non serve installare nulla da App Store.

## Strategia dinamica

Il motore parte da una distribuzione del budget per ruolo e misura, dopo ogni acquisto, il delta tra il prezzo pagato e il tetto previsto.

Se spendi più del previsto, il deficit viene distribuito sui reparti ancora aperti; se risparmi, il margine viene redistribuito. L'app mostra sia la correzione complessiva per reparto sia l'effetto sul prossimo hard stop.

> È uno strumento di supporto: non sostituisce le tue valutazioni, le regole specifiche della lega o le notizie dell'ultimo minuto.

## Dati e fonti

Il listone utilizzato dall'app è mantenuto nel file `players.csv` del repository. All'apertura Fanta Live prova a leggere la versione più recente e invalida la cache al cambio di stagione.

Per campioncini e alcune informazioni sportive possono essere consultate fonti pubbliche esterne, tra cui **Fantacalcio.it**. Informazioni come infortuni, gerarchie e rigoristi possono cambiare rapidamente e vanno considerate indicative.

Fanta Live è un progetto indipendente e **non è affiliato** a Fantacalcio.it, Leghe Fantacalcio, Serie A o alle società calcistiche.

## Privacy

- nessun account obbligatorio
- nessun database utenti di Fanta Live
- rosa, prezzi, budget e impostazioni vengono salvati nel `localStorage` del browser
- il backup è un file JSON esportato volontariamente dall'utente
- richieste verso fonti esterne possono trasmettere a tali servizi i normali dati tecnici di una richiesta web (ad esempio IP e user-agent)

Per eliminare i dati dell'asta basta usare **Impostazioni → Azzera asta** oppure cancellare i dati del sito dal browser.

## Struttura del progetto

```text
.
├── index.html
├── app.js
├── style.css
├── players.csv
├── manifest.webmanifest
├── sw.js
├── logo.svg
├── docs/
│   └── preview.svg
└── LICENSE
```

## Contribuire

Bug, correzioni del listone e proposte di miglioramento sono benvenuti tramite **Issue** o **Pull Request** su GitHub.

Se segnali un dato sportivo errato, indica possibilmente una fonte e la data di verifica.

## Licenza

Il **codice originale del progetto** è distribuito con licenza [MIT](LICENSE).

La licenza MIT non concede diritti su nomi, marchi, immagini, loghi o dati appartenenti a terzi eventualmente visualizzati o richiamati dall'app.

---

**Fanta Live 1.0.0** · Bid. Build. Win.
