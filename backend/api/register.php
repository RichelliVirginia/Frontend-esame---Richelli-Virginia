<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('POST');
$data = get_json_body();

$firstName = trim((string) ($data['firstName'] ?? ''));
$lastName = trim((string) ($data['lastName'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$confirmPassword = (string) ($data['confirmPassword'] ?? '');

$errors = [];
if ($firstName === '') $errors[] = 'Il nome è obbligatorio.';
if ($lastName === '') $errors[] = 'Il cognome è obbligatorio.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Inserisci un indirizzo email valido.';
if (strlen($password) < 8) $errors[] = 'La password deve contenere almeno 8 caratteri.';
if ($password !== '' && preg_match('/^\s/', $password)) $errors[] = 'La password non può iniziare con uno spazio.';
if ($password !== $confirmPassword) $errors[] = 'Le due password non coincidono.';

if ($errors !== []) {
    json_response(['success' => false, 'message' => implode(' ', $errors), 'errors' => $errors], 422);
}

$check = $pdo->prepare('SELECT id FROM users WHERE email = :email');
$check->execute(['email' => $email]);
if ($check->fetch()) {
    json_response(['success' => false, 'message' => 'Esiste già un utente con questa email.'], 409);
}

$insert = $pdo->prepare(
    'INSERT INTO users (first_name, last_name, email, password, role)
     VALUES (:first_name, :last_name, :email, :password, "employee")'
);
$insert->execute([
    'first_name' => $firstName,
    'last_name' => $lastName,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
]);

json_response([
    'success' => true,
    'message' => 'Registrazione completata. Ora puoi effettuare il login.',
], 201);
