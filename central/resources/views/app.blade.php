<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        
    {{-- ✅ AGREGAR ESTA LÍNEA - Define la URL base automática --}}
    <base href="{{ url('/') }}/">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <style>
            #loader {
                position: fixed;
                inset: 0;
                background: #dfe5ee;
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                transition: opacity .5s ease;
            }

            #loader img {
                width: 150px;
                animation: spinLoader 2s linear infinite;
            }

            @keyframes spinLoader {
                0% {
                    transform: rotate(0deg) scale(1);
                }

                50% {
                    transform: rotate(180deg) scale(1.08);
                }

                100% {
                    transform: rotate(360deg) scale(1);
                }
            }
        </style>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>

    <body class="font-sans antialiased">

        <!-- PANTALLA DE CARGA -->
        <div id="loader">
            <!-- <img src="/images/banner.png" alt="Cargando"> -->
             <img src="{{ asset('images/banner.png') }}" alt="Cargando">
        </div>

        <!-- APP -->
        @inertia

        <!-- SCRIPT -->
        <script>
            window.addEventListener('load', () => {
                const loader = document.getElementById('loader');

                loader.style.opacity = '0';

                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            });
        </script>

    </body>
</html>