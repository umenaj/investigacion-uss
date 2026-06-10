<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::get('/', function () {
    return redirect()->route('Auth/Login');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth'])->name('dashboard');

Route::middleware(['auth'])->group(function () {

    // ========== VÍCTIMAS ==========
    Route::get('/victimas', function () {
        return Inertia::render('Victimas');
    })->name('victimas');

    Route::get('/victimas/nuevo', function () {
        return Inertia::render('VictimaNuevo'); 
    })->name('victimas.nuevo');

    Route::get('/victimas/{id}', function ($id) {
        return Inertia::render('VictimaDetalle', [  
            'id' => $id
        ]);
    })->name('victimas.detalle');

    // ========== INSTITUCIONES ==========
    Route::get('/instituciones', function () {
        return Inertia::render('Instituciones');
    })->name('instituciones');

    Route::get('/instituciones/nuevo', function () {
        return Inertia::render('InstitucionNuevo');
    })->name('instituciones.nuevo');

    Route::get('/instituciones/{id}', function ($id) {
        return Inertia::render('InstitucionDetalle', [
            'id' => $id
        ]);
    })->name('instituciones.detalle');

    // ========== USUARIOS WEB ==========
    Route::get('/usuarios-web', function () {
        return Inertia::render('UsuariosWeb');
    })->name('usuarios-web');

    Route::get('/usuarios-web/nuevo', function () {
        return Inertia::render('UsuarioWebNuevo');
    })->name('usuarios-web.nuevo');

    Route::get('/usuarios-web/{id}', function ($id) {
        return Inertia::render('UsuarioWebDetalle', [
            'id' => $id
        ]);
    })->name('usuarios-web.detalle');

    // ========== MONITOREO ==========
    Route::get('/monitoreo', function () {
        return Inertia::render('Monitoreo');
    })->name('monitoreo');

});

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

require __DIR__.'/auth.php';