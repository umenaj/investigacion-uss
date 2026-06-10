<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperadorTelefonico extends Model
{
    use HasFactory;
    
    protected $table = 'operadores_telefonicos';
    protected $fillable = ['nombre', 'codigo', 'activo'];
    
    // Si tu tabla no tiene timestamps, agrega:
    public $timestamps = false;
}