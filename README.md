# Academy Aziendale

Progetto della prova pratica "Web Developer Full Stack - prova C".

Il frontend è realizzato con HTML, CSS e JavaScript senza framework. Il backend è in PHP e comunica con il frontend tramite API JSON. I dati sono salvati in MySQL.

## Avvio con XAMPP

1. Avvia **Apache** e **MySQL** dal pannello XAMPP.
2. Apri phpMyAdmin: `http://localhost/phpmyadmin`.
3. Seleziona **Importa** e carica il file `backend/database.sql`.
4. Apri `http://localhost/template_esame_api/frontend/`.

Il file SQL crea automaticamente il database `academy_aziendale`, le tre tabelle e i dati iniziali.

## Utenti di prova

| Ruolo | Email | Password |
|---|---|---|
| Referente Academy | `academy@example.com` | `Password123!` |
| Dipendente | `marco.bianchi@example.com` | `Dipendente123!` |
| Dipendente | `giulia.verdi@example.com` | `Dipendente123!` |
| Dipendente | `luca.neri@example.com` | `Dipendente123!` |

## Struttura

```text
frontend/
  index.html              login
  register.html           registrazione dipendente
  dashboard.html          applicazione CSR
  assets/style.css
  js/                     chiamate API e logica dell'interfaccia

backend/
  api/                    endpoint PHP che restituiscono JSON
  config/                 connessione MySQL e autenticazione
  helpers/                risposta JSON
  database.sql            database e dati dimostrativi
  Academy_API.postman_collection.json
```

## Funzionalità

Il dipendente può vedere e filtrare solo i corsi assegnati a sé, consultare dettagli e scadenze e segnare un corso come completato.

Il referente Academy può gestire corsi, vedere i dipendenti, creare/modificare/annullare assegnazioni, usare i filtri e consultare statistiche aggregate per mese e categoria.

Le autorizzazioni sono controllate anche dal backend. Un corso con assegnazioni non può essere eliminato e un corso non attivo non può essere usato per una nuova assegnazione.

## API

Tutte le risposte sono in JSON. L'autenticazione usa una sessione PHP tramite cookie.

| Metodo | Endpoint | Accesso | Funzione |
|---|---|---|---|
| POST | `api/register.php` | Pubblico | Registra un dipendente |
| POST | `api/login.php` | Pubblico | Login |
| GET | `api/me.php` | Autenticato | Utente corrente |
| POST | `api/logout.php` | Autenticato | Logout |
| GET/POST/PUT/DELETE | `api/courses.php` | Referente | Gestione catalogo |
| GET | `api/employees.php` | Referente | Elenco dipendenti |
| GET | `api/assignments.php` | Autenticato | Elenco e filtri, limitato per ruolo |
| POST/DELETE | `api/assignments.php` | Referente | Crea o annulla assegnazione |
| PUT | `api/assignments.php` | Dipende dall'azione | Modifica, completa o annulla |
| GET | `api/statistics.php` | Referente | Statistiche mensili |

Per provare le API con Postman, importa `backend/Academy_API.postman_collection.json`. Esegui prima **Login referente** o **Login dipendente**: Postman conserverà automaticamente il cookie di sessione.

## Configurazione

La connessione predefinita è quella standard di XAMPP (`root` senza password). Se necessario, modifica `backend/config/database.php`.

Il frontend usa `../backend/api` come indirizzo API. La configurazione si trova in `frontend/js/config.js`.
