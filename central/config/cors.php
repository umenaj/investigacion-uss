<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'movil/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Permite todas las origenes (solo para desarrollo)
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
