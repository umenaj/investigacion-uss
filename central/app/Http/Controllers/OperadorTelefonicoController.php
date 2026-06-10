<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OperadorTelefonico;

class OperadorTelefonicoController extends Controller
{
    public function index()
    {
        $operadores = OperadorTelefonico::where('activo', 1)->get();
        return response()->json($operadores);
    }
}