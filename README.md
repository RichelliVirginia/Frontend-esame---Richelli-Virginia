# Template esame ITS con frontend e backend separati

## Struttura

```text
template_esame_api/
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── assets/style.css
│   └── js/
│       ├── config.js
│       ├── auth.js
│       └── dashboard.js
└── backend/
    ├── api/
    │   ├── register.php
    │   ├── login.php
    │   ├── me.php
    │   ├── logout.php
    │   └── admin/users.php
    ├── config/
    │   ├── bootstrap.php
    │   └── database.php
    ├── helpers/response.php
    └── database.sql
```

## Comunicazione tramite API

Il frontend non contiene PHP e utilizza `fetch()` per inviare e ricevere JSON.

Endpoint disponibili:

- `POST backend/api/register.php`
- `POST backend/api/login.php`
- `GET backend/api/me.php`
- `POST backend/api/logout.php`
- `GET backend/api/admin/users.php`

L'autenticazione usa una sessione PHP. Nel frontend ogni richiesta protetta usa:

```javascript
credentials: 'include'
```

## Installazione con XAMPP

1. Copia `template_esame_api` dentro `htdocs`.
2. Avvia Apache e MySQL.
3. Apri phpMyAdmin.
4. Importa `backend/database.sql`.
5. Apri nel browser:

```text
http://localhost/template_esame_api/frontend/
```

Non aprire direttamente il file HTML con doppio clic: deve essere servito tramite HTTP.

## Configurazione database

Il file `backend/config/database.php` usa la configurazione standard di XAMPP:

```php
$username = 'root';
$password = '';
```

## Configurazione indirizzo API

Nel file `frontend/js/config.js` trovi:

```javascript
const API_BASE_URL = '../backend/api';
```

Se frontend e backend si trovano su indirizzi differenti, inserisci l'URL completo e aggiungi l'origine del frontend a `$allowedOrigins` in `backend/config/bootstrap.php`.

## Esempio richiesta di registrazione

```json
{
  "name": "Virginia",
  "email": "virginia@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "isAdmin": true
}
```

## Nuova API protetta

```php
<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('GET');
require_auth();

$query = $pdo->query('SELECT * FROM products');

json_response([
    'success' => true,
    'products' => $query->fetchAll()
]);
```

Per limitarla agli amministratori, sostituisci `require_auth()` con:

```php
require_admin();
```

## Chiamata dal frontend

```javascript
const response = await fetch(`${API_BASE_URL}/products.php`, {
    credentials: 'include'
});

const data = await response.json();
console.log(data.products);
```

## Nota di sicurezza

La checkbox che permette la creazione diretta di un admin è presente perché richiesta per la simulazione. In un progetto reale la creazione degli amministratori dovrebbe essere riservata a un admin già autenticato.
