# ⚽ Fanta Live

<p align="center">
  <img src="assets/fanta-live-icon.png" alt="Fanta Live" width="260">
</p>

**Fanta Live** è una web app gratuita pensata per accompagnarti sia durante l'asta iniziale del Fantacalcio sia durante l'**asta di riparazione**. Cerca i giocatori, registra gli acquisti e lascia che l'app ricalcoli in tempo reale budget, hard stop, potere d'acquisto e correzioni per reparto.

👉 **App pubblica:** https://garruk929.github.io/Fanta/

## Anteprima

<p align="center">
  <img src="docs/preview.svg" alt="Anteprima Fanta Live" width="380">
</p>

## Modalità Asta

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

## Modalità Riparazione

La modalità **Riparazione** è separata dall'asta iniziale, usa un tema grafico dedicato e salva i propri dati in modo indipendente.

Funzioni principali:

- import del file degli **svincolati** della lega
- supporto ai file **`.fclist`**, JSON, CSV e TXT
- riconoscimento degli ID giocatore contenuti nei file `.fclist`
- import automatico di **nomi squadre e crediti residui** quando presenti nel file
- inserimento/modifica manuale dei crediti se il file non li contiene
- scelta della propria squadra
- classifica live del **potere d'acquisto** delle squadre
- confronto dei propri crediti con la media della lega
- ricerca e filtri P/D/C/A sugli svincolati importati
- tetto consigliato sul giocatore corrente
- registrazione dell'acquisto indicando **squadra e prezzo**
- aggiornamento automatico dei crediti della squadra che compra
- storico movimenti con annullamento
- reset della sola riparazione senza toccare l'asta principale

> I formati di esportazione possono cambiare tra piattaforme e leghe. Se un file non viene riconosciuto, apri una Issue allegando un esempio anonimizzato del formato.

## Come usarla

### Asta iniziale

1. Apri **https://garruk929.github.io/Fanta/**.
2. Seleziona **Asta**.
3. Imposta budget, numero di squadre e numero di giocatori per ruolo.
4. Durante l'asta cerca un giocatore e apri la sua scheda.
5. Inserisci il prezzo finale e scegli **Preso da me**, oppure segna **Uscito / preso da un altro**.
6. Controlla la sezione **Strategia dinamica**.

### Asta di riparazione

1. Seleziona il tab **Riparazione**.
2. Premi **Importa svincolati** e carica il file esportato dalla tua lega.
3. Se hai un file con le disponibilità economiche, usa **Importa crediti**. In alternativa apri **Squadre** e inseriscili a mano.
4. Contrassegna la tua squadra con la stella.
5. Quando un giocatore viene acquistato, aprilo, scegli la squadra acquirente e inserisci il prezzo.
6. Fanta Live scala automaticamente i crediti e aggiorna il ranking economico.

### Installazione su iPhone/iPad

Apri l'app in **Safari** → **Condividi** → **Aggiungi alla schermata Home**.

Non serve installare nulla da App Store.

## Strategia dinamica

Il motore dell'asta iniziale parte da una distribuzione del budget per ruolo e misura, dopo ogni acquisto, il delta tra il prezzo pagato e il tetto previsto.

Se spendi più del previsto, il deficit viene distribuito sui reparti ancora aperti; se risparmi, il margine viene redistribuito. L'app mostra sia la correzione complessiva per reparto sia l'effetto sul prossimo hard stop.

Nella modalità Riparazione il tetto tiene invece conto soprattutto dei **crediti residui della propria squadra** e del confronto con la disponibilità economica degli avversari.

> È uno strumento di supporto: non sostituisce le tue valutazioni, le regole specifiche della lega o le notizie dell'ultimo minuto.

## Dati e fonti

Il listone utilizzato dall'app è mantenuto nel file `players.csv` del repository. All'apertura Fanta Live prova a leggere la versione più recente e invalida la cache al cambio di stagione.

Per associare gli ID presenti nei file `.fclist` e recuperare i campioncini vengono consultate fonti pubbliche esterne. Informazioni come infortuni, gerarchie e rigoristi possono cambiare rapidamente e vanno considerate indicative.

Fanta Live è un progetto indipendente e **non è affiliato** a Fantacalcio.it, Leghe Fantacalcio, Serie A o alle società calcistiche.

## Privacy

- nessun account obbligatorio
- nessun database utenti di Fanta Live
- rosa, prezzi, budget, dati di riparazione e impostazioni vengono salvati nel `localStorage` del browser
- i file importati vengono elaborati nel browser; Fanta Live non dispone di un backend per archiviarli
- il backup dell'asta è un file JSON esportato volontariamente dall'utente
- richieste verso fonti esterne possono trasmettere a tali servizi i normali dati tecnici di una richiesta web, come IP e user-agent

Per eliminare i dati dell'asta principale usa **Impostazioni → Azzera asta**. Per eliminare solo la riparazione usa **Riparazione → Squadre → Azzera solo riparazione**.

## Struttura del progetto

```text
.
├── index.html
├── app.js
├── repair.js
├── photo-fix.js
├── style.css
├── repair.css
├── players.csv
├── manifest.webmanifest
├── sw.js
├── apple-touch-icon.png
├── favicon.png
├── assets/
│   └── fanta-live-icon.png
├── docs/
│   └── preview.svg
└── LICENSE
```

## Contribuire

Bug, correzioni del listone, nuovi formati di import e proposte di miglioramento sono benvenuti tramite **Issue** o **Pull Request** su GitHub.

Se segnali un dato sportivo errato, indica possibilmente una fonte e la data di verifica.

## Licenza

Il **codice originale del progetto** è distribuito con licenza [MIT](LICENSE).

La licenza MIT non concede diritti su nomi, marchi, immagini, loghi o dati appartenenti a terzi eventualmente visualizzati o richiamati dall'app.

---

**Fanta Live 2.0.0** · Asta. Riparazione. Bid. Build. Win.
