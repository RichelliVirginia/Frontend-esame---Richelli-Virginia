<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_method('GET');
require_admin();

$query = $pdo->query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY id DESC'
);

$users = array_map(
    static fn (array $user): array => [
        'id' => (int) $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'createdAt' => $user['created_at'],
    ],
    $query->fetchAll()
);

json_response([
    'success' => true,
    'users' => $users
]);
