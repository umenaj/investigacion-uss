<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Alerta; 
use Illuminate\Support\Facades\DB;

class NotificacionController extends Controller
{
    public function index()
    {
        $notificaciones = DB::table('alertas as a')
            ->join('victimas as v', 'a.victima_id', '=', 'v.id')
            ->join('users as u', 'v.user_id', '=', 'u.id')
            ->where('a.estado', 'pendiente')
            ->select('a.created_at', 'u.nombres', 'u.primer_apellido')
            ->orderBy('a.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($alerta) {
                return [
                    'mensaje' => "Nueva alerta de {$alerta->nombres} {$alerta->primer_apellido}",
                    'tiempo' => \Carbon\Carbon::parse($alerta->created_at)->diffForHumans(),
                ];
            });
        
        return response()->json($notificaciones);
    }
}