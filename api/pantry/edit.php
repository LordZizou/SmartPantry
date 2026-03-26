<?php
// Endpoint per modificare un prodotto nella dispensa
session_start();
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/db.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

// Accetta solo richieste POST (o PUT)
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
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

// Verifica che il prodotto appartenga all'utente
$stmt = $pdo->prepare('SELECT id FROM products WHERE id = ? AND user_id = ?');
$stmt->execute([$productId, $userId]);

if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Prodotto non trovato']);
    exit;
}

// Costruisce la query di aggiornamento dinamicamente (aggiorna solo i campi inviati)
$allowedFields = ['category_id', 'name', 'brand', 'barcode', 'quantity', 'unit', 'expiry_date', 'nutritional_info'];
$updates = [];
$params  = [];

foreach ($allowedFields as $field) {
    if (array_key_exists($field, $data)) {
        $updates[] = "$field = ?";
        // Codifica nutritional_info come JSON se presente
        if ($field === 'nutritional_info' && is_array($data[$field])) {
            $params[] = json_encode($data[$field]);
        } else {
            $params[] = $data[$field] ?: null;
        }
    }
}

// Se non ci sono campi da aggiornare
if (empty($updates)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Nessun campo da aggiornare']);
    exit;
}

// Esegue l'aggiornamento
$sql = 'UPDATE products SET ' . implode(', ', $updates) . ' WHERE id = ? AND user_id = ?';
$params[] = $productId;
$params[] = $userId;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);

echo json_encode([
    'success' => true,
    'message' => 'Prodotto aggiornato'
]);
