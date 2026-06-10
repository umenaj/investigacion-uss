<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MovilAlertaController extends Controller
{
    /**
     * Crear una nueva alerta de pánico
     */
    public function crearAlerta(Request $request)
    {
        try {
            $token = $request->bearerToken();
            if (!$token) {
                return response()->json(['error' => 'Token no proporcionado'], 401);
            }

            $user = DB::table('users')->where('token_notificacion', $token)->first();
            if (!$user) {
                return response()->json(['error' => 'Usuario no encontrado'], 401);
            }

            if ($user->perfil !== 'VICTIMA') {
                return response()->json(['error' => 'Solo víctimas pueden activar alertas'], 403);
            }

            $victima = DB::table('victimas')->where('user_id', $user->id)->first();
            
            if (!$victima) {
                $victimaId = DB::table('victimas')->insertGetId([
                    'user_id' => $user->id,
                    'nivel_riesgo' => 'MEDIO',
                    'puntaje_riesgo' => 50,
                    'tiene_app_antigua' => 0,
                    'consentimiento_firmado' => 1,
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            } else {
                $victimaId = $victima->id;
            }

            $request->validate([
                'latitud' => 'required|numeric',
                'longitud' => 'required|numeric',
                'precision' => 'nullable|numeric'
            ]);

            $latitud = $request->latitud;
            $longitud = $request->longitud;
            $precision = $request->precision ?? 50;

            // Verificar alerta activa
            $alertaActiva = DB::table('alertas')
                ->where('victima_id', $victimaId)
                ->whereIn('estado', ['PENDIENTE', 'EN_ATENCION', 'ASIGNADA'])
                ->first();

            if ($alertaActiva) {
                // Si ya tiene alerta activa, solo actualizar ubicación
                $this->actualizarUbicacion($alertaActiva->id, $latitud, $longitud, $precision, $user->id);
                return response()->json([
                    'success' => true,
                    'alerta_id' => $alertaActiva->id,
                    'estado' => $alertaActiva->estado,
                    'message' => 'Ubicación actualizada'
                ]);
            }

            // Buscar comisaría más cercana (geofencing)
            $comisariaCercana = $this->encontrarComisariaCercana($latitud, $longitud);

            // Crear nueva alerta
            $alertaId = DB::table('alertas')->insertGetId([
                'victima_id' => $victimaId,
                'latitud_inicial' => $latitud,
                'longitud_inicial' => $longitud,
                'latitud_actual' => $latitud,
                'longitud_actual' => $longitud,
                'precision_metros' => $precision,
                'ubicacion_texto' => $this->getDireccionAproximada($latitud, $longitud),
                'tipo_app' => 'NUEVA',
                'estado' => 'PENDIENTE',
                'prioridad' => 'ALTA',
                'puntaje_prioridad' => 85,
                'tiempo_espera_segundos' => 0,
                'comisaria_asignada_id' => $comisariaCercana['id'] ?? null,
                'distancia_comisaria_metros' => $comisariaCercana['distancia'] ?? null,
                'ultima_emision' => now(),
                'flag_duplicidad' => 0,
                'alerta_escalada' => 0,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Registrar en historial_estados_alerta 
            DB::table('historial_estados_alerta')->insert([
                'alerta_id' => $alertaId,
                'estado_anterior' => null,
                'estado_nuevo' => 'PENDIENTE',
                'motivo_cambio' => 'Activación por víctima',
                'observacion' => 'Alerta activada desde app móvil',
                'usuario_id' => $user->id,
                'latitud_usuario' => $latitud,
                'longitud_usuario' => $longitud,
                'tiempo_transcurrido_segundos' => 0,
                'created_at' => now()
            ]);

            // Crear reporte inicial
            $numeroOficio = $this->generarNumeroOficio();
            DB::table('reportes')->insert([
                'victima_id' => $victimaId,
                'alerta_id' => $alertaId,
                'tipo_reporte' => 'ACTIVACION',
                'numero_oficio' => $numeroOficio,
                'descripcion' => 'Alerta de pánico activada',
                'accion_tomada' => 'Alerta registrada en el sistema',
                'responsable_nombre' => $user->nombres . ' ' . ($user->primer_apellido ?? ''),
                'fecha_reporte' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            // Crear notificación de geofencing
            if ($comisariaCercana) {
                DB::table('notificaciones_geofencing')->insert([
                    'alerta_id' => $alertaId,
                    'institucion_id' => $comisariaCercana['id'],
                    'distancia_metros' => $comisariaCercana['distancia'],
                    'fue_la_ganadora' => 1,
                    'notificacion_enviada' => 1,
                    'notificacion_leida' => 0,
                    'tipo_notificacion' => 'ALERTA_PANICO',
                    'created_at' => now()
                ]);
            }

            // Guardar primera ubicación
            DB::table('ubicaciones_alerta')->insert([
                'alerta_id' => $alertaId,
                'latitud' => $latitud,
                'longitud' => $longitud,
                'precision_metros' => $precision,
                'fuente' => 'GPS',
                'created_at' => now()
            ]);

            Log::info("✅ Alerta creada ID: {$alertaId}");

            return response()->json([
                'success' => true,
                'alerta_id' => $alertaId,
                'estado' => 'PENDIENTE',
                'comisaria' => $comisariaCercana['nombre'] ?? null,
                'distancia' => $comisariaCercana['distancia'] ?? null,
                'message' => 'Alerta activada correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Error crear alerta: ' . $e->getMessage());
            return response()->json(['error' => 'Error al activar alerta: ' . $e->getMessage()], 500);
        }
    }

  
public function enviarUbicacion(Request $request)
{
    try {
        $token = $request->bearerToken();
        if (!$token) {
            return response()->json(['error' => 'Token no proporcionado'], 401);
        }

        $user = DB::table('users')->where('token_notificacion', $token)->first();
        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 401);
        }

        $victima = DB::table('victimas')->where('user_id', $user->id)->first();
        if (!$victima) {
            return response()->json(['error' => 'Perfil de víctima no encontrado'], 404);
        }

        $request->validate([
            'alerta_id' => 'required|integer',
            'latitud' => 'required|numeric',
            'longitud' => 'required|numeric',
            'precision' => 'nullable|numeric'
        ]);

        $alertaId = $request->alerta_id;
        $latitud = $request->latitud;
        $longitud = $request->longitud;
        $precision = $request->precision ?? 10;

        // Verificar que la alerta existe y pertenece a esta víctima
        $alerta = DB::table('alertas')
            ->where('id', $alertaId)
            ->where('victima_id', $victima->id)
            ->first();

        if (!$alerta) {
            return response()->json(['error' => 'Alerta no encontrada'], 404);
        }

        // NUEVO REGISTRO EN ubicaciones_alerta 
        DB::table('ubicaciones_alerta')->insert([
            'alerta_id' => $alertaId,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'precision_metros' => $precision,
            'fuente' => 'GPS',
            'created_at' => now()
        ]);

        // Actualizar la alerta con la última ubicación
        DB::table('alertas')->where('id', $alertaId)->update([
            'latitud_actual' => $latitud,
            'longitud_actual' => $longitud,
            'precision_metros' => $precision,
            'ultima_emision' => now(),
            'updated_at' => now()
        ]);

        Log::info("✅ Ubicación guardada para alerta {$alertaId}: {$latitud}, {$longitud}");

        return response()->json([
            'success' => true,
            'message' => 'Ubicación guardada correctamente'
        ]);

    } catch (\Exception $e) {
        Log::error('❌ Error enviar ubicación: ' . $e->getMessage());
        return response()->json([
            'error' => 'Error al enviar ubicación: ' . $e->getMessage()
        ], 500);
    }
}
    /**
     * Actualizar ubicación en alerta existente
     */
    private function actualizarUbicacion($alertaId, $latitud, $longitud, $precision, $usuarioId)
    {
        DB::table('alertas')->where('id', $alertaId)->update([
            'latitud_actual' => $latitud,
            'longitud_actual' => $longitud,
            'precision_metros' => $precision,
            'ultima_emision' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Verificar si hay alerta activa
     */
    public function alertaActiva(Request $request)
    {
        try {
            $token = $request->bearerToken();
            if (!$token) {
                return response()->json(['error' => 'Token no proporcionado'], 401);
            }

            $user = DB::table('users')->where('token_notificacion', $token)->first();
            if (!$user) {
                return response()->json(['error' => 'Usuario no encontrado'], 401);
            }

            $victima = DB::table('victimas')->where('user_id', $user->id)->first();
            if (!$victima) {
                return response()->json(['alerta_id' => null]);
            }

            $alerta = DB::table('alertas')
                ->where('victima_id', $victima->id)
                ->whereIn('estado', ['PENDIENTE', 'EN_ATENCION', 'ASIGNADA'])
                ->first();

            if ($alerta) {
                return response()->json([
                    'alerta_id' => $alerta->id,
                    'estado' => $alerta->estado
                ]);
            }

            return response()->json(['alerta_id' => null]);

        } catch (\Exception $e) {
            Log::error('❌ Error verificar alerta activa: ' . $e->getMessage());
            return response()->json(['alerta_id' => null]);
        }
    }

    /**
     * Encontrar comisaría más cercana
     */
    private function encontrarComisariaCercana($lat, $lng)
    {
        $zonas = DB::table('geofencing_zonas')
            ->where('activo', 1)
            ->get();

        $cercana = null;
        $distanciaMinima = PHP_INT_MAX;

        foreach ($zonas as $zona) {
            $distancia = $this->calcularDistancia($lat, $lng, $zona->centro_latitud, $zona->centro_longitud);
            if ($distancia < $distanciaMinima && $distancia <= $zona->radio_metros) {
                $distanciaMinima = $distancia;
                $cercana = [
                    'id' => $zona->institucion_id,
                    'nombre' => $zona->nombre,
                    'distancia' => $distancia
                ];
            }
        }

        return $cercana;
    }

    /**
     * Verificar geofencing al moverse
     */
    private function verificarGeofencing($alertaId, $lat, $lng, $comisariaAsignadaId)
    {
        $zonas = DB::table('geofencing_zonas')
            ->where('activo', 1)
            ->get();

        foreach ($zonas as $zona) {
            $distancia = $this->calcularDistancia($lat, $lng, $zona->centro_latitud, $zona->centro_longitud);
            
            if ($distancia <= $zona->radio_metros) {
                // Verificar si ya existe notificación
                $existe = DB::table('notificaciones_geofencing')
                    ->where('alerta_id', $alertaId)
                    ->where('institucion_id', $zona->institucion_id)
                    ->exists();

                if (!$existe) {
                    DB::table('notificaciones_geofencing')->insert([
                        'alerta_id' => $alertaId,
                        'institucion_id' => $zona->institucion_id,
                        'distancia_metros' => $distancia,
                        'fue_la_ganadora' => ($zona->institucion_id == $comisariaAsignadaId) ? 1 : 0,
                        'notificacion_enviada' => 1,
                        'notificacion_leida' => 0,
                        'tipo_notificacion' => 'ENTRADA_ZONA',
                        'created_at' => now()
                    ]);
                }
                break;
            }
        }
    }

    /**
     * Calcular distancia entre dos puntos (Haversine formula)
     */
    private function calcularDistancia($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371000; // metros
        
        $latDelta = deg2rad($lat2 - $lat1);
        $lonDelta = deg2rad($lon2 - $lon1);
        
        $a = sin($latDelta / 2) * sin($latDelta / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($lonDelta / 2) * sin($lonDelta / 2);
        
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        
        return $earthRadius * $c;
    }

    private function generarNumeroOficio()
    {
        $year = date('Y');
        $count = DB::table('reportes')
            ->whereYear('created_at', $year)
            ->count();
        
        return "ACT-" . $year . "-" . str_pad($count + 1, 6, '0', STR_PAD_LEFT);
    }

    private function getDireccionAproximada($lat, $lng)
    {
        return "Lat: {$lat}, Lng: {$lng}";
    }
   public function getUbicacionEnTiempoReal($alertaId)
{
    try {
        // Obtener la ÚLTIMA ubicación registrada
        $ultimaUbicacion = DB::table('ubicaciones_alerta')
            ->where('alerta_id', $alertaId)
            ->orderBy('created_at', 'desc')
            ->first();
        
        $alerta = DB::table('alertas')
            ->where('id', $alertaId)
            ->select('id', 'estado', 'victima_id')
            ->first();
        
        if (!$alerta) {
            return response()->json([
                'success' => false, 
                'error' => 'Alerta no encontrada'
            ], 404);
        }
        
        if (!$ultimaUbicacion) {
            return response()->json([
                'success' => false,
                'error' => 'No hay ubicaciones para esta alerta'
            ], 404);
        }
        
        // Calcular tiempo desde última actualización
        $tiempoTranscurrido = now()->diffInSeconds($ultimaUbicacion->created_at);
        
        return response()->json([
            'success' => true,
            'id' => $alerta->id,
            'latitud' => $ultimaUbicacion->latitud,
            'longitud' => $ultimaUbicacion->longitud,
            'ultima_emision' => $ultimaUbicacion->created_at,
            'tiempo_transcurrido_segundos' => $tiempoTranscurrido,
            'estado' => $alerta->estado
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error getUbicacionEnTiempoReal: ' . $e->getMessage());
        return response()->json([
            'success' => false, 
            'error' => 'Error al obtener ubicación: ' . $e->getMessage()
        ], 500);
    }
}
}