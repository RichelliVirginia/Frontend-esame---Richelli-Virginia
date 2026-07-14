<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('GET');
require_auth();

json_response([
    'success' => true,
    'user' => [
        'id' => (int) $_SESSION['user_id'],
        'firstName' => (string) $_SESSION['first_name'],
        'lastName' => (string) $_SESSION['last_name'],
        'name' => trim($_SESSION['first_name'] . ' ' . $_SESSION['last_name']),
        'email' => (string) $_SESSION['user_email'],
        'role' => (string) $_SESSION['role'],
    ],
]);
