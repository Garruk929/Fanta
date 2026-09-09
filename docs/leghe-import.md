# Import da Leghe Fantacalcio

Fanta Live 2.1 supporta due strade per preparare l'asta di riparazione.

## 1. File esportati

È la strada consigliata quando disponibile: importa il file degli svincolati (`.fclist`, JSON, CSV o TXT) e un file con nomi squadra + crediti residui.

## 2. Snapshot JSON della lega

Durante una sessione autenticata, il frontend di Leghe Fantacalcio usa API JSON interne. La risposta della lista squadre contiene, per ogni fantasquadra:

- `n`: nome squadra
- `nu`: proprietario
- `cri`: crediti iniziali
- `crs`: crediti spesi
- `cr`: crediti residui
- `cal`: ID dei giocatori in rosa, separati da `;`
- `cs`: costi di acquisto, nello stesso ordine di `cal`

Fanta Live può leggere un JSON salvato di questa risposta. Dal momento che conosce gli ID di tutti i giocatori posseduti, ricava automaticamente gli svincolati come differenza rispetto al catalogo corrente. In questo modo un singolo snapshot può compilare:

- squadre della lega
- crediti residui
- giocatori già in rosa
- lista degli svincolati

Sono accettati sia l'oggetto originale con `data: [...]`, sia wrapper con `teams` o `leagueTeams`.

## Perché Fanta Live non chiede il token

Le API interne richiedono un Bearer token legato alla lega. Quel token è una credenziale privata. Fanta Live gira su GitHub Pages e non deve riceverlo, salvarlo o inoltrarlo.

Per questo l'import è volutamente **file-based e read-only**: Fanta Live legge lo snapshot che l'utente decide di importare, ma non effettua login su Leghe Fantacalcio e non conserva credenziali.

## Endpoint osservati

La piattaforma usa, tra gli altri, questi endpoint read-only:

- `/onboarding/v1/league/teams`
- `/onboarding/v1/league/teams/my`
- `/onboarding/v1/league/players`
- `/onboarding/v1/league/settings/rosters`

Non sono documentati come API pubbliche per integrazioni di terze parti. Il loro formato può quindi cambiare senza preavviso.

Fanta Live è un progetto indipendente e non affiliato a Fantacalcio.it o Leghe Fantacalcio.
