<?php

use BaseApi\App;
use App\Controllers\HealthController;
use App\Controllers\HotelSearchController;
use App\Controllers\HotelOffersController;
use App\Controllers\LoginController;
use App\Controllers\LogoutController;
use App\Controllers\MeController;
use App\Controllers\SignupController;
use BaseApi\Http\Middleware\RateLimitMiddleware;
use BaseApi\Http\Middleware\AuthMiddleware;

$router = App::router();

// Health check endpoints
$router->get(
    '/health',
    [
        RateLimitMiddleware::class => ['limit' => '60/1m'],
        HealthController::class,
    ],
);

$router->post(
    '/health',
    [
        HealthController::class,
    ],
);

// Authentication endpoints
$router->post(
    '/auth/signup',
    [
        SignupController::class,
    ],
);

$router->post(
    '/auth/login',
    [
        LoginController::class,
    ],
);

$router->post(
    '/auth/logout',
    [
        AuthMiddleware::class,
        LogoutController::class,
    ],
);

// Protected endpoints
$router->get(
    '/me',
    [
        AuthMiddleware::class,
        MeController::class,
    ],
);

// Hotel search and offers endpoints
$router->get(
    '/hotels/search',
    [
        RateLimitMiddleware::class => ['limit' => '100/1m'],
        HotelSearchController::class,
    ],
);

$router->get(
    '/hotels/{hotel_id}/offers',
    [
        RateLimitMiddleware::class => ['limit' => '100/1m'],
        HotelOffersController::class,
    ],
);
