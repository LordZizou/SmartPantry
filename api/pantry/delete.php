<?php
// Endpoint per eliminare un prodotto dalla dispensa
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

// Accetta solo richieste POST (o DELETE)
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'DELETE'])) {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo non consentito']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Validazione ID prodotto
$productId = $data['id'] ?? null;
if (!$productId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ID prodotto obbligatorio']);
    exit;
}

$userId = $_SESSION['user_id'];

// Elimina il prodotto solo se appartiene all'utente
$stmt = $pdo->prepare('DELETE FROM products WHERE id = ? AND user_id = ?');
$stmt->execute([$productId, $userId]);

if ($stmt->rowCount() === 0) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Prodotto non trovato']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Prodotto eliminato'
]);
