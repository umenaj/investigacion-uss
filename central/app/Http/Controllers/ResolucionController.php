<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResolucionController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('resoluciones');
        
        if ($request->expediente_id) {
            $query->where('expediente_id', $request->expediente_id);
        }
        if ($request->victima_id) {
            $query->where('victima_id', $request->victima_id);
        }
        
        return response()->json($query->get());
    }
    
    public function show($id)
    {
        return response()->json(DB::table('resoluciones')->where('id', $id)->first());
    }
}