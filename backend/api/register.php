<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('POST');
$data = get_json_body();

$name = trim((string) ($data['name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirmPassword'] ?? '');
$isAdmin = filter_var($data['isAdmin'] ?? false, FILTER_VALIDATE_BOOLEAN);

$errors = [];
if ($name === '') $errors[] = 'Il nome è obbligatorio.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Inserisci un indirizzo email valido.';
if (strlen($password) < 6) $errors[] = 'La password deve contenere almeno 6 caratteri.';
if ($password !== $confirmPassword) $errors[] = 'Le due password non coincidono.';

if (strlen($password) < 6) {
    $errors[] = 'La password deve contenere almeno 6 caratteri.';
}

if ($password !== '' && preg_match('/^\s/', $password)) {
    $errors[] = 'La password non può iniziare con uno spazio.';
}

if ($password !== $confirmPassword) {
    $errors[] = 'Le due password non coincidono.';
}

if ($errors !== []) {
    json_response([
        'success' => false,
        'message' => implode(' ', $errors),
        'errors' => $errors
    ], 422);
}

$checkUser = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$checkUser->execute(['email' => $email]);
if ($checkUser->fetch()) {
    json_response([
        'success' => false,
        'message' => 'Esiste già un utente con questa email.'
    ], 409);
}

$role = $isAdmin ? 'admin' : 'user';
$insertUser = $pdo->prepare(
    'INSERT INTO users (name, email, password, role)
     VALUES (:name, :email, :password, :role)'
);
$insertUser->execute([
    'name' => $name,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'role' => $role,
]);

json_response([
    'success' => true,
    'message' => 'Registrazione completata. Ora puoi effettuare il login.',
    'user' => [
        'id' => (int) $pdo->lastInsertId(),
        'name' => $name,
        'email' => $email,
        'role' => $role
    ]
], 201);
