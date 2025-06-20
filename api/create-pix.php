<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Ler dados da requisição
$input = json_decode(file_get_contents('php://input'), true);

$amount = $input['amount'] ?? '';
$description = $input['description'] ?? '';
$email = $input['email'] ?? '';
$pedidoId = $input['pedidoId'] ?? '';

// Validar dados
if (empty($amount) || empty($description) || empty($email) || empty($pedidoId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados obrigatórios faltando']);
    exit;
}

// Converter preço
$amountNumber = floatval(str_replace(['R$ ', ','], ['', '.'], $amount));

// Configurar Mercado Pago
$accessToken = 'APP_USR-2303516479543987-062014-1b953593c2522bfea92a27092a437f59-334838550';

$paymentData = [
    'transaction_amount' => $amountNumber,
    'description' => $description,
    'payment_method_id' => 'pix',
    'payer' => [
        'email' => $email
    ],
    'external_reference' => $pedidoId
];

// Fazer requisição para Mercado Pago
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://api.mercadopago.com/v1/payments');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 201) {
    $result = json_decode($response, true);
    
    echo json_encode([
        'success' => true,
        'payment_id' => $result['id'],
        'status' => $result['status'],
        'qr_code' => $result['point_of_interaction']['transaction_data']['qr_code'] ?? '',
        'qr_code_base64' => $result['point_of_interaction']['transaction_data']['qr_code_base64'] ?? '',
        'ticket_url' => $result['point_of_interaction']['transaction_data']['ticket_url'] ?? ''
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao criar pagamento PIX'
    ]);
}
?>
