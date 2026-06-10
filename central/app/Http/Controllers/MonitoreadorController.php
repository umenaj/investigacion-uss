<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonitoreadorController extends Controller
{
    public function buscarVictima($dni)
    {
        $victima = DB::table('users')
            ->join('victimas', 'users.id', '=', 'victimas.user_id')
            ->where('users.documento', $dni)
            ->where('users.perfil', 'VICTIMA')
            ->select(
                'users.id as user_id',
                'users.documento',
                'users.nombres',
                'users.primer_apellido',
                'users.segundo_apellido',
                'users.telefono',
                'victimas.id as victima_id',
                'victimas.nivel_riesgo'
            )
            ->first();
        
        if (!$victima) {
            return response()->json(['error' => 'Víctima no encontrada'], 404);
        }
        
        $alertaActiva = DB::table('alertas')
            ->where('victima_id', $victima->victima_id)
            ->whereIn('estado', ['PENDIENTE', 'EN_ATENCION'])
            ->first();
        
        return response()->json([
            'success' => true,
            'victima' => $victima,
            'alerta_activa' => $alertaActiva ? [
                'id' => $alertaActiva->id,
                'estado' => $alertaActiva->estado,
                'latitud' => $alertaActiva->latitud_actual,
                'longitud' => $alertaActiva->longitud_actual,
                'ultima_emision' => $alertaActiva->ultima_emision
            ] : null
        ]);
    }
    
    public function getUbicacionTiempoReal($victimaId)
    {
        $alerta = DB::table('alertas')
            ->where('victima_id', $victimaId)
            ->whereIn('estado', ['PENDIENTE', 'EN_ATENCION'])
            ->orderBy('created_at', 'desc')
            ->first();
        
        if (!$alerta) {
            return response()->json([
                'success' => true,
                'tiene_alerta' => false
            ]);
        }
        
        $tiempoTranscurrido = now()->diffInSeconds($alerta->ultima_emision);
        
        return response()->json([
            'success' => true,
            'tiene_alerta' => true,
            'alerta_id' => $alerta->id,
            'latitud' => $alerta->latitud_actual,
            'longitud' => $alerta->longitud_actual,
            'ultima_emision' => $alerta->ultima_emision,
            'tiempo_transcurrido' => $tiempoTranscurrido,
            'estado' => $alerta->estado
        ]);
    }
    
    public function getHistorialUbicaciones($victimaId)
    {
        $ubicaciones = DB::table('ubicaciones_alerta')
            ->join('alertas', 'ubicaciones_alerta.alerta_id', '=', 'alertas.id')
            ->where('alertas.victima_id', $victimaId)
            ->orderBy('ubicaciones_alerta.created_at', 'desc')
            ->limit(50)
            ->select(
                'ubicaciones_alerta.latitud',
                'ubicaciones_alerta.longitud',
                'ubicaciones_alerta.created_at'
            )
            ->get();
        
        return response()->json([
            'success' => true,
            'historial' => $ubicaciones
        ]);
    }
}