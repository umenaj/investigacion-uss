<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class VictimaController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('users')
            ->leftJoin('victimas', 'users.id', '=', 'victimas.user_id')
            ->where('users.perfil', 'VICTIMA')
            ->select(
                'users.id',
                'users.documento',
                'users.nombres',
                'users.primer_apellido',
                'users.segundo_apellido',
                'users.email',
                'users.email_personal',
                'users.operador',
                'users.telefono',
                'users.fecha_nacimiento',
                'users.activo',
                'victimas.nivel_riesgo',
                'victimas.id as idvictima'
            );
        
        if ($request->documento) {
            $query->where('users.documento', 'like', '%' . $request->documento . '%');
        }
        if ($request->primer_apellido) {
            $query->where('users.primer_apellido', 'like', '%' . $request->primer_apellido . '%');
        }
        if ($request->segundo_apellido) {
            $query->where('users.segundo_apellido', 'like', '%' . $request->segundo_apellido . '%');
        }
        if ($request->operador) {
            $query->where('users.operador', $request->operador);
        }
        
        $victimas = $query->get();
        
        return response()->json($victimas);
    }

    public function show($id)
    {
        $victima = DB::table('users')
            ->leftJoin('victimas', 'users.id', '=', 'victimas.user_id')
            ->where('victimas.id', $id)
            ->select(
                'users.*',
                'victimas.nivel_riesgo',
                'victimas.tipo_violencia'
            )
            ->first();
        
        return response()->json($victima);
    }

    public function getExpedientes($id)
    {
        $expedientes = DB::table('expedientes')
            ->where('victima_id', $id)
            ->select('id', 'numero_expediente', 'anio', 'estado')
            ->get();
        
        return response()->json($expedientes);
    }

    public function addExpediente(Request $request, $id)
    {
        $expediente = DB::table('expedientes')->insert([
            'victima_id' => $id,
            'numero_expediente' => $request->numero_expediente,
            'anio' => date('Y'),
            'estado' => 'ABIERTO',
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        return response()->json(['success' => true]);
    }

    public function store(Request $request)
{
    try {
        // 1. Crear el usuario
        $userId = DB::table('users')->insertGetId([
            'documento' => $request->documento,
            'nombres' => $request->nombres,
            'primer_apellido' => $request->primer_apellido,
            'segundo_apellido' => $request->segundo_apellido,
            'email_personal' => $request->email_personal,
            'telefono' => $request->telefono,
            'operador' => $request->operador,
            'fecha_nacimiento' => $request->fecha_nacimiento,
            'direccion_completa' => $request->direccion,
            'departamento' => $request->departamento,
            'provincia' => $request->provincia,
            'distrito' => $request->distrito,
            'sexo' => $request->sexo,
            'pais_nacionalidad' => $request->pais,
            'perfil' => 'VICTIMA',
            'activo' => 1,
            'password' => bcrypt($request->documento),
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        // 2. víctima y obtener su ID
        $nivelesPermitidos = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO', 'SIN DETERMINAR'];
        $nivelRiesgo = in_array($request->nivel_riesgo, $nivelesPermitidos) ? $request->nivel_riesgo : 'SIN DETERMINAR';
        
        $victimaId = DB::table('victimas')->insertGetId([
            'user_id' => $userId,
            'nivel_riesgo' => $nivelRiesgo,
            'created_at' => now(),
            'updated_at' => now()
        ]);
        
        // 3. expediente usando el ID de la víctima recién creada
        if ($request->expediente_completo) {
            DB::table('expedientes')->insert([
                'victima_id' => $victimaId,  
                'numero_expediente' => $request->expediente_completo,
                'anio' => date('Y'),
                'estado' => 'ABIERTO',
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }
        
        return response()->json([
            'success' => true, 
            'message' => 'Víctima registrada correctamente', 
            'id' => $userId
        ]);
        
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
   public function update(Request $request, $id)
{
    $data = [
        'nombres' => $request->nombres,
        'primer_apellido' => $request->primer_apellido,
        'segundo_apellido' => $request->segundo_apellido,
        'sexo' => $request->sexo,
        'fecha_nacimiento' => $request->fecha_nacimiento,
        'pais_nacionalidad' => $request->pais,
        'email_personal' => $request->email_personal,
        'telefono' => $request->telefono,
        'operador' => $request->operador,
        'departamento' => $request->departamento,
        'provincia' => $request->provincia,
        'distrito' => $request->distrito,
        'direccion_completa' => $request->direccion_completa,
        'updated_at' => now()
    ];
    
    // actualizar la contraseña si se proporcionó un valor nuevo y no está vacío
    if ($request->filled('contrasena') && $request->contrasena != '') {
        $data['password'] = bcrypt($request->contrasena);
    }
    
    DB::table('users')->where('id', $id)->update($data);
    
    DB::table('victimas')
        ->where('user_id', $id)
        ->update([
            'nivel_riesgo' => $request->nivel_riesgo,
            'updated_at' => now()
        ]);
    
    return response()->json(['success' => true]);
}

    public function validarDocumentoExpediente(Request $request)
    {
        try {
            $documento = $request->input('documento');
            $expediente = $request->input('expediente');
            
            $user = DB::table('users')
                ->where('documento', $documento)
                ->where('perfil', 'VICTIMA')
                ->first();
            
            if (!$user) {
                return response()->json([
                    'exists' => false,
                    'asociado' => false,
                    'message' => 'Usuario no encontrado'
                ]);
            }
            
            $victima = DB::table('victimas')
                ->where('user_id', $user->id)
                ->first();
            
            if (!$victima) {
                return response()->json([
                    'exists' => false,
                    'asociado' => false,
                    'message' => 'Víctima no encontrada'
                ]);
            }
            
            $expedienteAsociado = DB::table('expedientes')
                ->where('victima_id', $victima->id)
                ->where('numero_expediente', $expediente)
                ->exists();
            
            return response()->json([
                'exists' => true,
                'asociado' => $expedienteAsociado,
                'victima' => [
                    'id' => $user->id,
                    'documento' => $user->documento,
                    'nombres' => $user->nombres,
                    'primer_apellido' => $user->primer_apellido,
                    'segundo_apellido' => $user->segundo_apellido,
                    'sexo' => $user->sexo,
                    'fecha_nacimiento' => $user->fecha_nacimiento,
                    'pais_nacionalidad' => $user->pais_nacionalidad ?? 'PERU',
                    'email_personal' => $user->email_personal,
                    'telefono' => $user->telefono,
                    'operador' => $user->operador,
                    'departamento' => $user->departamento,
                    'provincia' => $user->provincia,
                    'distrito' => $user->distrito,
                    'direccion_completa' => $user->direccion_completa,
                    'nivel_riesgo' => $victima->nivel_riesgo,
                    'expediente' => $expediente
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'exists' => false,
                'asociado' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}