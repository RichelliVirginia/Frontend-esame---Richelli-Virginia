<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('POST');
$data = get_json_body();

/* Validazione dei dati di input */
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    json_response(['success' => false, 'message' => 'Inserisci email e password.'], 422);
}

/* Recuperare l'utente dal database */
$query = $pdo->prepare(
    'SELECT id, first_name, last_name, email, password, role FROM users WHERE email = :email'
);
$query->execute(['email' => $email]);
$user = $query->fetch();



/* Password verification */
if (!$user || !password_verify($password, $user['password'])) {
    json_response(['success' => false, 'message' => 'Email o password non corretti.'], 401);
}

/* Salvare l'utente nella sessione */
session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['first_name'] = $user['first_name'];
$_SESSION['last_name'] = $user['last_name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['role'] = $user['role'];

json_response([
    'success' => true,
    'message' => 'Login effettuato.',
    'user' => [
        'id' => (int) $user['id'],
        'firstName' => $user['first_name'],
        'lastName' => $user['last_name'],
        'name' => $user['first_name'] . ' ' . $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role'],
    ],
]);
