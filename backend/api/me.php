<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/bootstrap.php';
require_method('GET');
require_auth();

json_response([
    'success' => true,
    'user' => [
        'id' => (int) $_SESSION['user_id'],
        'name' => (string) $_SESSION['user_name'],
        'email' => (string) $_SESSION['user_email'],
        'role' => (string) $_SESSION['role']
    ]
]);
