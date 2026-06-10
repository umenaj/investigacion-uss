import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { router } from '@inertiajs/react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,

    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),

    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },

    progress: false,
});

/*
|--------------------------------------------------------------------------
| LOADER GLOBAL
|--------------------------------------------------------------------------
*/

const showLoader = () => {
    const loader = document.getElementById('loader');

    if (loader) {
        loader.style.display = 'flex';
        loader.style.opacity = '1';
    }
};

const hideLoader = () => {
    const loader = document.getElementById('loader');

    if (loader) {
        loader.style.opacity = '0';

        setTimeout(() => {
            loader.style.display = 'none';
        }, 400);
    }
};

/* OCULTAR AL CARGAR */
window.addEventListener('load', () => {
    hideLoader();
});

/* MOSTRAR EN NAVEGACIÓN */
router.on('start', () => {
    showLoader();
});

/* OCULTAR AL TERMINAR */
router.on('finish', () => {
    hideLoader();
});

/* OCULTAR SI HAY ERROR */
router.on('error', () => {
    hideLoader();
});