<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UsuarioWebController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = DB::table('users')
                ->where('perfil', 'MONITOREADOR')
                ->orWhere('perfil', 'ADMIN')
                ->orWhere('perfil', 'OPERADOR')
                ->select(
                    'id',
                    'documento',
                    'nombres',
                    'primer_apellido',
                    'segundo_apellido',
                    'email',
                    'email_institucional',
                    'email_personal',
                    'sexo',
                    'fecha_nacimiento',
                    'pais_nacionalidad',
                    'telefono',
                    'telefono_secundario',
                    'operador',
                    'departamento',
                    'provincia',
                    'distrito',
                    'direccion_completa',
                    'direccion_referencia',
                    'institucion_id',
                    'perfil',
                    'activo'
                )
                ->orderBy('created_at', 'desc');
            
            // Aplicar filtros
            if ($request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('documento', 'like', '%' . $request->search . '%')
                      ->orWhere('nombres', 'like', '%' . $request->search . '%')
                      ->orWhere('primer_apellido', 'like', '%' . $request->search . '%')
                      ->orWhere('email_personal', 'like', '%' . $request->search . '%');
                });
            }
            
            $usuarios = $query->get();
            
            return response()->json($usuarios);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $usuario = DB::table('users')
                ->where('id', $id)
                ->first();
            
            return response()->json($usuario);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $userId = DB::table('users')->insertGetId([
                'documento' => $request->documento,
                'nombres' => $request->nombres,
                'primer_apellido' => $request->primer_apellido,
                'segundo_apellido' => $request->segundo_apellido,
                'sexo' => $request->sexo,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'pais_nacionalidad' => $request->pais_nacionalidad ?? 'PERU',
                'email_institucional' => $request->email_institucional,
                'email_personal' => $request->email_personal,
                'telefono' => $request->telefono,
                'telefono_secundario' => $request->telefono_secundario,
                'operador' => $request->operador,
                'departamento' => $request->departamento,
                'provincia' => $request->provincia,
                'distrito' => $request->distrito,
                'direccion_completa' => $request->direccion_completa,
                'direccion_referencia' => $request->direccion_referencia,
                'institucion_id' => $request->institucion_id,
                'perfil' => $request->perfil,
                'activo' => $request->activo ?? 1,
                'password' => bcrypt($request->password ?? $request->documento),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return response()->json(['success' => true, 'message' => 'Usuario registrado correctamente', 'id' => $userId]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $data = [
                'nombres' => $request->nombres,
                'primer_apellido' => $request->primer_apellido,
                'segundo_apellido' => $request->segundo_apellido,
                'sexo' => $request->sexo,
                'fecha_nacimiento' => $request->fecha_nacimiento,
                'pais_nacionalidad' => $request->pais_nacionalidad,
                'email_institucional' => $request->email_institucional,
                'email_personal' => $request->email_personal,
                'telefono' => $request->telefono,
                'telefono_secundario' => $request->telefono_secundario,
                'operador' => $request->operador,
                'departamento' => $request->departamento,
                'provincia' => $request->provincia,
                'distrito' => $request->distrito,
                'direccion_completa' => $request->direccion_completa,
                'direccion_referencia' => $request->direccion_referencia,
                'institucion_id' => $request->institucion_id,
                'perfil' => $request->perfil,
                'activo' => $request->activo,
                'updated_at' => now()
            ];
            
            if ($request->filled('password') && $request->password != '') {
                $data['password'] = bcrypt($request->password);
            }
            
            DB::table('users')->where('id', $id)->update($data);
            
            return response()->json(['success' => true, 'message' => 'Usuario actualizado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::table('users')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Usuario eliminado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}