<?php
// Endpoint per cercare un prodotto tramite barcode su OpenFoodFacts
session_start();
require_once __DIR__ . '/../config/cors.php';

// Verifica autenticazione
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato']);
    exit;
}

// Accetta solo richieste GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo non consentito']);
    exit;
}

// Validazione parametro barcode
$barcode = trim($_GET['barcode'] ?? '');
if (empty($barcode)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Barcode obbligatorio']);
    exit;
}

// Chiama l'API di OpenFoodFacts
$url = "https://world.openfoodfacts.org/api/v0/product/" . urlencode($barcode) . ".json";

$response = file_get_contents($url);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['success' => false, 'error' => 'Errore nella comunicazione con OpenFoodFacts']);
    exit;
}

$result = json_decode($response, true);

// Verifica se il prodotto è stato trovato
if (!isset($result['status']) || $result['status'] !== 1) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Prodotto non trovato']);
    exit;
}

$product = $result['product'];

// Estrae i valori nutrizionali in formato pulito
$nutriments = $product['nutriments'] ?? [];
$nutritionalInfo = [
    'energy_kcal'  => $nutriments['energy-kcal_100g'] ?? null,
    'fat'          => $nutriments['fat_100g'] ?? null,
    'saturated_fat'=> $nutriments['saturated-fat_100g'] ?? null,
    'carbohydrates'=> $nutriments['carbohydrates_100g'] ?? null,
    'sugars'       => $nutriments['sugars_100g'] ?? null,
    'proteins'     => $nutriments['proteins_100g'] ?? null,
    'salt'         => $nutriments['salt_100g'] ?? null,
    'fiber'        => $nutriments['fiber_100g'] ?? null,
];

// Restituisce i dati del prodotto in formato pulito
echo json_encode([
    'success' => true,
    'product' => [
        'name'             => $product['product_name'] ?? 'Sconosciuto',
        'brand'            => $product['brands'] ?? '',
        'ingredients'      => $product['ingredients_text'] ?? '',
        'image_url'        => $product['image_url'] ?? '',
        'barcode'          => $barcode,
        'nutritional_info' => $nutritionalInfo,
    ]
]);
