<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgresorController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('agresores');
        
        if ($request->victima_id) {
            $query->where('victima_id', $request->victima_id);
        }
        
        return response()->json($query->get());
    }
    
    public function show($id)
    {
        return response()->json(DB::table('agresores')->where('id', $id)->first());
    }
}