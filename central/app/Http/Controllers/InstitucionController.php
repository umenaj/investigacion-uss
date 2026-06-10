<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InstitucionController extends Controller
{
    public function index()
    {
        try {
            $instituciones = DB::table('instituciones')
                ->select('id', 'nombre', 'direccion', 'distrito_judicial')
                ->orderBy('nombre', 'asc')
                ->get();
            
            return response()->json($instituciones);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        try {
            $institucion = DB::table('instituciones')
                ->where('id', $id)
                ->first();
            
            return response()->json($institucion);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $id = DB::table('instituciones')->insertGetId([
                'tipo' => $request->tipo,
                'nombre' => $request->nombre,
                'distrito_judicial' => $request->distrito_judicial,
                'departamento' => $request->departamento,
                'provincia' => $request->provincia,
                'distrito' => $request->distrito,
                'direccion' => $request->direccion,
                'telefono' => $request->telefono,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'radio_alerta_metros' => $request->radio_alerta_metros ?? 1300,
                'nivel_respuesta' => $request->nivel_respuesta ?? 'NORMAL',
                'capacidad_operadores' => $request->capacidad_operadores ?? 5,
                'activo' => $request->activo ?? 1,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            return response()->json(['success' => true, 'message' => 'Institución creada correctamente', 'id' => $id]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            DB::table('instituciones')
                ->where('id', $id)
                ->update([
                    'tipo' => $request->tipo,
                    'nombre' => $request->nombre,
                    'distrito_judicial' => $request->distrito_judicial,
                    'departamento' => $request->departamento,
                    'provincia' => $request->provincia,
                    'distrito' => $request->distrito,
                    'direccion' => $request->direccion,
                    'telefono' => $request->telefono,
                    'latitud' => $request->latitud,
                    'longitud' => $request->longitud,
                    'radio_alerta_metros' => $request->radio_alerta_metros,
                    'nivel_respuesta' => $request->nivel_respuesta,
                    'capacidad_operadores' => $request->capacidad_operadores,
                    'activo' => $request->activo,
                    'updated_at' => now()
                ]);
            
            return response()->json(['success' => true, 'message' => 'Institución actualizada correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::table('instituciones')->where('id', $id)->delete();
            return response()->json(['success' => true, 'message' => 'Institución eliminada correctamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}