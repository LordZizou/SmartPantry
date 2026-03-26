<?php
// Endpoint logout utente
session_start();
require_once __DIR__ . '/../config/cors.php';

// Distrugge la sessione corrente
$_SESSION = [];
session_destroy();

echo json_encode([
    'success' => true,
    'message' => 'Logout effettuato'
]);
