import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    // URL base donde se servirán los assets
    base: '/boton-panico/public/build/',
    server: {
        host: '0.0.0.0',  // Permite conexiones externas
        port: 5173,
        hmr: {
            host: '167.99.235.231',  // Cambia por la IP de tu servidor
            port: 5173,
        },
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    },
    // ✅ Opcional: Optimizar dependencias grandes
    optimizeDeps: {
        include: ['react', 'react-dom', 'axios', 'leaflet'],
    },
});