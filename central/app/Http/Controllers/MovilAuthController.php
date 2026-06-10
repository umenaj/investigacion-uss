<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User; 

class MovilAuthController extends Controller
{
    /**
     * Login para la app móvil
     */
    public function login(Request $request)
    {
        // Log para depuración
        Log::info('=== Login method called ===');
        Log::info('Request data:', $request->all());
        
        // Validar campos
        $request->validate([
            'documento' => 'required',
            'password' => 'required'
        ]);
        
        $documento = $request->documento;
        $password = $request->password;
        
        // Buscar en la tabla 'users' por documento
        $user = DB::table('users')->where('documento', $documento)->first();
        
        // Si no existe el usuario
        if (!$user) {
            Log::error('Usuario no encontrado con documento: ' . $documento);
            return response()->json([
                'error' => 'Usuario no encontrado'
            ], 401);
        }
        
        // Verificar contraseña
        if (!Hash::check($password, $user->password)) {
            Log::error('Contraseña incorrecta para documento: ' . $documento);
            return response()->json([
                'error' => 'Contraseña incorrecta'
            ], 401);
        }
        
        // Verificar que el perfil sea VICTIMA 
        if ($user->perfil !== 'VICTIMA') {
            Log::warning('Usuario no es VICTIMA: ' . $user->perfil);
            return response()->json([
                'error' => 'Esta app es solo para víctimas'
            ], 403);
        }
        
        // Login exitoso - Generar token simple
        $token = bin2hex(random_bytes(32));
        
        // Guardar token en la base de datos 
        DB::table('users')->where('id', $user->id)->update([
            'token_notificacion' => $token,
            'ultimo_login' => now()
        ]);
        
        Log::info('Login exitoso para: ' . $documento);
        
        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->nombres . ' ' . $user->primer_apellido,
                'documento' => $user->documento,
                'email' => $user->email,
                'perfil' => $user->perfil
            ]
        ]);
    }
}