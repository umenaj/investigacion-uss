<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class MonitoreadorAuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'documento' => 'required',
            'password' => 'required'
        ]);
        
        $user = DB::table('users')
            ->where('documento', $request->documento)
            ->where('perfil', 'MONITOREADOR')
            ->first();
        
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 401);
        }
        
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Contraseña incorrecta'], 401);
        }
        
        $token = bin2hex(random_bytes(32));
        
        DB::table('users')->where('id', $user->id)->update([
            'token_notificacion' => $token,
            'ultimo_login' => now()
        ]);
        
        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->nombres . ' ' . $user->primer_apellido,
                'documento' => $user->documento,
                'perfil' => $user->perfil
            ]
        ]);
    }
}