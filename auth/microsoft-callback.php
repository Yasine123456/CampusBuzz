<?php
session_start();
require_once '../backend/db_connection.php';

// Charger la configuration
$config = require_once 'microsoft-config.php';

// Vérifier le state pour CSRF
if (!isset($_GET['state']) || $_GET['state'] !== $_SESSION['oauth_state']) {
    die(json_encode(['error' => 'Invalid state parameter']));
}

// Vérifier le code d'autorisation
if (!isset($_GET['code'])) {
    die(json_encode(['error' => 'No authorization code received']));
}

$code = $_GET['code'];

// Échanger le code contre un access token
$token_params = [
    'client_id' => $config['client_id'],
    'client_secret' => $config['client_secret'],
    'code' => $code,
    'redirect_uri' => $config['redirect_uri'],
    'grant_type' => 'authorization_code',
    'scope' => $config['scope']
];

$ch = curl_init($config['token_url']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($token_params));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/x-www-form-urlencoded'
]);

$token_response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code !== 200) {
    die(json_encode(['error' => 'Failed to get access token', 'response' => $token_response]));
}

$token_data = json_decode($token_response, true);
$access_token = $token_data['access_token'];

// Récupérer les informations utilisateur
$ch = curl_init($config['user_info_url']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $access_token
]);

$user_response = curl_exec($ch);
curl_close($ch);

$user_data = json_decode($user_response, true);

// Vérifier que c'est un email Northumbria
if (!isset($user_data['mail']) || !str_ends_with(strtolower($user_data['mail']), '@' . $config['allowed_domain'])) {
    die(json_encode([
        'error' => 'Only Northumbria University emails are allowed',
        'email' => $user_data['mail'] ?? 'unknown'
    ]));
}

// Extraire les informations
$email = strtolower($user_data['mail']);
$given_name = $user_data['givenName'] ?? '';
$surname = $user_data['surname'] ?? '';
$display_name = $user_data['displayName'] ?? ($given_name . ' ' . $surname);
$microsoft_id = $user_data['id'];

// Créer un username à partir de l'email
$username = explode('@', $email)[0];

// Vérifier si l'utilisateur existe déjà (using $pdo from db_connection.php)
$query = "SELECT * FROM users WHERE email = :email OR microsoft_id = :microsoft_id LIMIT 1";
$stmt = $pdo->prepare($query);
$stmt->bindParam(':email', $email);
$stmt->bindParam(':microsoft_id', $microsoft_id);
$stmt->execute();

if ($stmt->rowCount() > 0) {
    // Utilisateur existe - connexion
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Mettre à jour le microsoft_id si nécessaire
    if (empty($user['microsoft_id'])) {
        $update_query = "UPDATE users SET microsoft_id = :microsoft_id WHERE id = :user_id";
        $update_stmt = $pdo->prepare($update_query);
        $update_stmt->bindParam(':microsoft_id', $microsoft_id);
        $update_stmt->bindParam(':user_id', $user['id']);
        $update_stmt->execute();
    }
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    
} else {
    // Nouvel utilisateur - inscription automatique
    
    // Générer un username unique si nécessaire
    $check_username = "SELECT COUNT(*) FROM users WHERE username = :username";
    $check_stmt = $pdo->prepare($check_username);
    $check_stmt->bindParam(':username', $username);
    $check_stmt->execute();
    
    if ($check_stmt->fetchColumn() > 0) {
        // Username existe déjà, ajouter un numéro
        $username = $username . rand(100, 999);
    }
    
    // Insérer le nouvel utilisateur
    $insert_query = "INSERT INTO users (username, email, display_name, microsoft_id, auth_provider, created_at) 
                     VALUES (:username, :email, :display_name, :microsoft_id, 'microsoft', NOW())";
    $insert_stmt = $pdo->prepare($insert_query);
    $insert_stmt->bindParam(':username', $username);
    $insert_stmt->bindParam(':email', $email);
    $insert_stmt->bindParam(':display_name', $display_name);
    $insert_stmt->bindParam(':microsoft_id', $microsoft_id);
    
    if ($insert_stmt->execute()) {
        $new_user_id = $pdo->lastInsertId();
        $_SESSION['user_id'] = $new_user_id;
        $_SESSION['username'] = $username;
    } else {
        die(json_encode(['error' => 'Failed to create user account']));
    }
}

// Nettoyer la session OAuth
unset($_SESSION['oauth_state']);

// Rediriger vers la page d'accueil
header('Location: /nu/index.html');
exit;
?>