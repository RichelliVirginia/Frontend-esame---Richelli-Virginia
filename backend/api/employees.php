<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('GET');
require_academy();

$query = $pdo->query(
    'SELECT id, first_name, last_name, email FROM users
     WHERE role = "employee" ORDER BY last_name, first_name'
);

$employees = array_map(
    static fn (array $employee): array => [
        'id' => (int) $employee['id'],
        'name' => $employee['first_name'] . ' ' . $employee['last_name'],
        'email' => $employee['email'],
    ],
    $query->fetchAll()
);

json_response(['success' => true, 'employees' => $employees]);
