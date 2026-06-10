<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use DateTime;
use App\Models\Alerta;

class AlertaController extends Controller
{
    // ==============================================
    // LISTAR TODAS LAS ALERTAS
    // ==============================================
    public function index()
    {
        try {
            $alertas = DB::table('alertas')
                ->leftJoin('victimas', 'alertas.victima_id', '=', 'victimas.id')
                ->leftJoin('users', 'victimas.user_id', '=', 'users.id')
                ->select(
                    'alertas.*',
                    'users.documento',
                    'users.nombres',
                    'users.primer_apellido',
                    'users.segundo_apellido',
                    'users.telefono',
                    'users.email_personal',
                    'users.direccion_completa'
                )
                ->orderBy('alertas.created_at', 'desc')
                ->get();
            
            $instituciones = DB::table('instituciones')->where('activo', 1)->get();
            
            return response()->json([
                'pendientes' => $alertas->where('estado', 'PENDIENTE')->values(),
                'en_atencion' => $alertas->where('estado', 'EN_ATENCION')->values(),
                'app_antigua' => $alertas->where('tipo_app', 'ANTIGUA')->values(),
                'instituciones' => $instituciones
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==============================================
    // MOSTRAR UNA ALERTA ESPECÍFICA
    // ==============================================
    public function show($id)
    {
        try {
            $alerta = DB::table('alertas')
                ->leftJoin('victimas', 'alertas.victima_id', '=', 'victimas.id')
                ->leftJoin('users', 'victimas.user_id', '=', 'users.id')
                ->where('alertas.id', $id)
                ->select(
                    'alertas.*',
                    'users.documento',
                    'users.nombres',
                    'users.primer_apellido',
                    'users.segundo_apellido',
                    'users.telefono',
                    'users.email_personal',
                    'users.direccion_completa'
                )
                ->first();
            
            $ubicaciones = DB::table('ubicaciones_alerta')
                ->where('alerta_id', $id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'alerta' => $alerta,
                'ubicaciones' => $ubicaciones
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // ==============================================
    // ACTUALIZAR ESTADO DE ALERTA
    // ==============================================
    public function update(Request $request, $id)
    {
        try {
            // Obtener la alerta actual
            $alertaActual = DB::table('alertas')->where('id', $id)->first();
            
            if (!$alertaActual) {
                return response()->json(['error' => 'Alerta no encontrada'], 404);
            }
            
            $estadoAnterior = $alertaActual->estado;
            $nuevoEstado = $request->estado;
            
            // Si no hay cambio de estado, no hacer nada
            if ($estadoAnterior === $nuevoEstado) {
                return response()->json(['success' => true, 'message' => 'No se realizaron cambios']);
            }
            
            
            $data = [
                'estado' => $nuevoEstado,
                'updated_at' => now()
            ];
            
            
            if ($request->has('motivo_cierre')) {
                $data['motivo_cierre'] = $request->motivo_cierre;
            }
            if ($request->has('descripcion')) {
                $data['descripcion'] = $request->descripcion;
            }
            if ($request->has('observacion')) {
                $data['observacion'] = $request->observacion;
            }
            
            // ==============================================
            // CUANDO CAMBIA A "EN ATENCIÓN"
            // ==============================================
            if ($nuevoEstado === 'EN_ATENCION') {
                // Quién asumió la alerta
                $data['asumida_por'] = $request->asumida_por ?? $alertaActual->asumida_por ?? 1;
                
                // Fecha y hora de asunción
                $data['fecha_asuncion'] = now();
                
                // Nombre del monitoreador que asumió
                if ($request->has('atendido_por_nombre')) {
                    $data['atendido_por_nombre'] = $request->atendido_por_nombre;
                }
                
                // Institución que atiende
                if ($request->has('institucion_atencion')) {
                    $data['institucion_atencion'] = $request->institucion_atencion;
                }
                
                // Comisaría asignada
                if ($request->has('comisaria_asignada_id')) {
                    $data['comisaria_asignada_id'] = $request->comisaria_asignada_id;
                }
                
                // Calcular distancia a la comisaría asignada
                if (isset($data['comisaria_asignada_id']) && $data['comisaria_asignada_id']) {
                    $comisaria = DB::table('instituciones')
                        ->where('id', $data['comisaria_asignada_id'])
                        ->first();
                    
                    if ($comisaria && $alertaActual->latitud_actual && $alertaActual->longitud_actual) {
                        $distancia = DB::selectOne("
                            SELECT calcular_distancia_metros(?, ?, ?, ?) as distancia
                        ", [
                            $alertaActual->latitud_actual,
                            $alertaActual->longitud_actual,
                            $comisaria->latitud,
                            $comisaria->longitud
                        ]);
                        $data['distancia_comisaria_metros'] = $distancia->distancia ?? null;
                    }
                }
                
                // Calcular tiempo de respuesta
                $createdAt = new DateTime($alertaActual->created_at);
                $now = new DateTime();
                $data['tiempo_respuesta_segundos'] = $now->getTimestamp() - $createdAt->getTimestamp();
            }
            
            // ==============================================
            // CUANDO CAMBIA A "ATENDIDA"
            // ==============================================
            if ($nuevoEstado === 'ATENDIDA') {
                // Quién atendió la alerta
                if ($request->has('atendido_por')) {
                    $data['atendido_por'] = $request->atendido_por;
                } else {
                    $data['atendido_por'] = $alertaActual->asumida_por ?? $request->asumida_por ?? 1;
                }
                
                // Nombre de quien atendió
                if ($request->has('atendido_por_nombre')) {
                    $data['atendido_por_nombre'] = $request->atendido_por_nombre;
                }
                
                // Si no se calculó tiempo respuesta antes
                if (!$alertaActual->tiempo_respuesta_segundos) {
                    $createdAt = new DateTime($alertaActual->created_at);
                    $now = new DateTime();
                    $data['tiempo_respuesta_segundos'] = $now->getTimestamp() - $createdAt->getTimestamp();
                }
            }
            
            // ==============================================
            // ACTUALIZAR LA ALERTA
            // ==============================================
            DB::table('alertas')->where('id', $id)->update($data);
            
            // Obtener la alerta actualizada
            $alertaActualizada = DB::table('alertas')->where('id', $id)->first();
            
            // ID del usuario responsable
            $usuarioId = $request->asumida_por ?? $alertaActual->asumida_por ?? 1;
            
            // Nombre del responsable
            $responsableNombre = $request->atendido_por_nombre ?? 
                                 $alertaActual->atendido_por_nombre ?? 
                                 'Sistema';
            
            // Calcular tiempo transcurrido
            $createdAt = new DateTime($alertaActual->created_at);
            $now = new DateTime();
            $tiempoTranscurrido = $now->getTimestamp() - $createdAt->getTimestamp();
            
            // ==============================================
            // 1. GUARDAR EN HISTORIAL_ESTADOS_ALERTA
            // ==============================================
            DB::table('historial_estados_alerta')->insert([
                'alerta_id' => $id,
                'estado_anterior' => $estadoAnterior,
                'estado_nuevo' => $nuevoEstado,
                'motivo_cambio' => $request->motivo_cierre,
                'observacion' => $request->observacion,
                'usuario_id' => $usuarioId,
                'tiempo_transcurrido_segundos' => $tiempoTranscurrido,
                'created_at' => now()
            ]);
            
            // ==============================================
            // 2. GUARDAR EN REPORTES SEGÚN EL CAMBIO
            // ==============================================
            
            // CASO: PENDIENTE → EN_ATENCION
            if ($nuevoEstado === 'EN_ATENCION' && $estadoAnterior === 'PENDIENTE') {
                DB::table('reportes')->insert([
                    'victima_id' => $alertaActual->victima_id,
                    'alerta_id' => $id,
                    'tipo_reporte' => 'ASUNCION_ALERTA',
                    'numero_oficio' => 'ASU-' . date('Y') . '-' . str_pad($id, 6, '0', STR_PAD_LEFT),
                    'descripcion' => $request->descripcion ?? 'Alerta asumida por monitoreador',
                    'accion_tomada' => $request->motivo_cierre ?? 'Se inició seguimiento de la alerta',
                    'responsable_nombre' => $responsableNombre,
                    'fecha_reporte' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            // CASO: EN_ATENCION → ATENDIDA
            if ($nuevoEstado === 'ATENDIDA') {
                DB::table('reportes')->insert([
                    'victima_id' => $alertaActual->victima_id,
                    'alerta_id' => $id,
                    'tipo_reporte' => 'ATENCION_ALERTA',
                    'numero_oficio' => 'ATN-' . date('Y') . '-' . str_pad($id, 6, '0', STR_PAD_LEFT),
                    'descripcion' => $request->descripcion ?? 'Alerta atendida',
                    'accion_tomada' => $request->motivo_cierre ?? 'Alerta finalizada',
                    'responsable_nombre' => $responsableNombre,
                    'fecha_reporte' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Alerta actualizada correctamente',
                'alerta' => $alertaActualizada
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error en update alerta: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    // ==============================================
    // CONTAR ALERTAS PENDIENTES
    // ==============================================
    public function pendientesCount()
    {
        $count = Alerta::where('estado', 'PENDIENTE')->count();
        return response()->json(['count' => $count]);
    }
}