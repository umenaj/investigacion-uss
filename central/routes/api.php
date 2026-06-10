<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\VictimaController;
use App\Http\Controllers\OperadorTelefonicoController;
use App\Http\Controllers\InstitucionController;
use App\Http\Controllers\UsuarioWebController;
use App\Http\Controllers\AlertaController;
use App\Http\Controllers\ResolucionController;
use App\Http\Controllers\AgresorController;
use App\Http\Controllers\MovilAuthController;     
use App\Http\Controllers\MovilAlertaController;
use App\Http\Controllers\PruebaController;
use App\Http\Controllers\MonitoreadorController;
use App\Http\Controllers\MonitoreadorAuthController;
use App\Http\Controllers\NotificacionController;
// Rutas para víctimas
Route::get('/victimas', [VictimaController::class, 'index']);
Route::get('/victimas/validar', [VictimaController::class, 'validarDocumentoExpediente']);
Route::get('/victimas/{id}', [VictimaController::class, 'show']);
Route::get('/victimas/{id}/expedientes', [VictimaController::class, 'getExpedientes']);
Route::post('/victimas', [VictimaController::class, 'store']);
Route::put('/victimas/{id}', [VictimaController::class, 'update']);
Route::post('/victimas/{id}/expedientes', [VictimaController::class, 'addExpediente']);

// Rutas para operadores
Route::get('/operadores-telefonicos', [OperadorTelefonicoController::class, 'index']);

// Rutas para instituciones
Route::get('/instituciones', [InstitucionController::class, 'index']);
Route::get('/instituciones/{id}', [InstitucionController::class, 'show']);
Route::post('/instituciones', [InstitucionController::class, 'store']);
Route::put('/instituciones/{id}', [InstitucionController::class, 'update']);
Route::delete('/instituciones/{id}', [InstitucionController::class, 'destroy']);

// Rutas para usuarios web
Route::get('/usuarios-web', [UsuarioWebController::class, 'index']);
Route::get('/usuarios-web/{id}', [UsuarioWebController::class, 'show']);
Route::post('/usuarios-web', [UsuarioWebController::class, 'store']);
Route::put('/usuarios-web/{id}', [UsuarioWebController::class, 'update']);
Route::delete('/usuarios-web/{id}', [UsuarioWebController::class, 'destroy']);

// Rutas para alertas (protegidas con auth:sanctum)
// Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/alertas', [AlertaController::class, 'index']);
    Route::get('/alertas/{id}', [AlertaController::class, 'show']);
    Route::put('/alertas/{id}', [AlertaController::class, 'update']);
// });

// Rutas para resoluciones
Route::get('/resoluciones', [ResolucionController::class, 'index']);
Route::get('/resoluciones/{id}', [ResolucionController::class, 'show']);

// Rutas para agresores
Route::get('/agresores', [AgresorController::class, 'index']);
Route::get('/agresores/{id}', [AgresorController::class, 'show']);

// ==============================================
// RUTAS PARA LA APP MÓVIL (VÍCTIMA) - CORREGIDAS
// ==============================================

// ✅ Login - CORREGIDO (antes usaba AuthController)
Route::post('/movil/login', [MovilAuthController::class, 'login']);

// Rutas para alertas móviles
Route::post('/movil/alerta', [MovilAlertaController::class, 'crearAlerta']);
Route::post('/movil/ubicacion', [MovilAlertaController::class, 'enviarUbicacion']);
Route::get('/movil/alerta/activa', [MovilAlertaController::class, 'alertaActiva']);
// Route::post('/prueba/login', [PruebaController::class, 'login']);

Route::get('/ubicacion/{alertaId}', [MovilAlertaController::class, 'getUbicacionEnTiempoReal']);
// ==============================================
// RUTAS PARA MONITOREADOR MÓVIL
// ==============================================
Route::post('/monitoreador/login', [MonitoreadorAuthController::class, 'login']);
Route::get('/monitoreador/victima/{dni}', [MonitoreadorController::class, 'buscarVictima']);
Route::get('/monitoreador/ubicacion/{victimaId}', [MonitoreadorController::class, 'getUbicacionTiempoReal']);
Route::get('/monitoreador/historial/{victimaId}', [MonitoreadorController::class, 'getHistorialUbicaciones']);
// RUTAS PARA NOTIFICACIONES
Route::get('/notificaciones', [NotificacionController::class, 'index']);
Route::get('/alertas-pendientes-count', [AlertaController::class, 'pendientesCount']);