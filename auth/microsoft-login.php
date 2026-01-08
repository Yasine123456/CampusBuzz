<?php
session_start();

// Charger la configuration
$config = require_once 'microsoft-config.php';

// Générer un state unique pour la sécurité CSRF
$state = bin2hex(random_bytes(16));
$_SESSION['oauth_state'] = $state;

// Paramètres de la requête OAuth
$params = [
    'client_id' => $config['client_id'],
    'response_type' => 'code',
    'redirect_uri' => $config['redirect_uri'],
    'response_mode' => 'query',
    'scope' => $config['scope'],
    'state' => $state,
    'prompt' => 'select_account'  // Force la sélection du compte
];

// Construire l'URL d'autorisation
$auth_url = $config['authorize_url'] . '?' . http_build_query($params);

// Rediriger vers Microsoft
header('Location: ' . $auth_url);
exit;
?>