<?php

namespace App\Http\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request)
    {
        $user = $request->user();
        $institucion = null;
        
        if ($user && $user->institucion_id) {
            $institucion = DB::table('instituciones')
                ->where('id', $user->institucion_id)
                ->select('id', 'nombre', 'direccion', 'latitud', 'longitud', 'radio_alerta_metros', 'tipo')
                ->first();
        }
        
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'nombre' => $user->nombres,
                    'primer_apellido' => $user->primer_apellido,
                    'segundo_apellido' => $user->segundo_apellido,
                    'email' => $user->email,
                    'perfil' => $user->perfil,
                    'documento' => $user->documento,
                    'institucion_id' => $user->institucion_id,
                ] : null,
                'institucion' => $institucion,
            ],
        ]);
    }
}
