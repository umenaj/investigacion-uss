<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Victima extends Model
{
   public function user()
{
    return $this->belongsTo(User::class);
}

public function agresores()
{
    return $this->hasMany(Agresor::class);
}

public function alertas()
{
    return $this->hasMany(Alerta::class);
}
}
