<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/bootstrap.php';
require_method('GET');
require_academy();

$query = $pdo->query(
    'SELECT id, first_name, last_name, email, role, created_at FROM users ORDER BY last_name, first_name'
);

json_response(['success' => true, 'users' => array_map(
    static fn (array $user): array => [
        'id' => (int) $user['id'],
        'name' => $user['first_name'] . ' ' . $user['last_name'],
        'email' => $user['email'],
        'role' => $user['role'],
        'createdAt' => $user['created_at'],
    ],
    $query->fetchAll()
)]);
