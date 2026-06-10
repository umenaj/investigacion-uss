<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PruebaController extends Controller
{
    public function login(Request $request)
    {
        // Devolver siempre éxito para pruebas
        return response()->json([
            'success' => true,
            'token' => 'test-token-12345',
            'user' => [
                'id' => 1,
                'name' => 'Usuario de Prueba',
                'documento' => $request->documento,
                'email' => 'test@test.com'
            ]
        ]);
    }
}