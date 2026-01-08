<?php
// Microsoft OAuth Configuration for Northumbria University
// Copy this file to microsoft-config.php and fill in your credentials

return [
    'client_id' => 'your-application-client-id',
    'client_secret' => 'your-client-secret',
    'tenant_id' => 'your-tenant-id',
    'redirect_uri' => 'https://your-domain.com/nu/auth/microsoft-callback.php',
    
    // Microsoft endpoints
    'authorize_url' => 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize',
    'token_url' => 'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token',
    'user_info_url' => 'https://graph.microsoft.com/v1.0/me',
    
    // Required scopes
    'scope' => 'openid profile email User.Read',
    
    // Domain restriction
    'allowed_domain' => 'northumbria.ac.uk'
];
?>
