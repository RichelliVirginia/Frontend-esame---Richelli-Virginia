<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('POST');
$data = get_json_body();

$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
    json_response([
        'success' => false,
        'message' => 'Inserisci email e password.'
    ], 422);
}

$findUser = $pdo->prepare(
    'SELECT id, name, email, password, role FROM users WHERE email = :email'
);
$findUser->execute(['email' => $email]);
$user = $findUser->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    json_response([
        'success' => false,
        'message' => 'Email o password non corretti.'
    ], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['role'] = $user['role'];

json_response([
    'success' => true,
    'message' => 'Login effettuato.',
    'user' => [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role']
    ]
]);

/* Nome: Virginia
mail: virginia@prova.com
password: password1234*/