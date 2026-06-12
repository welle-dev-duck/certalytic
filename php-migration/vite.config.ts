import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        watch: {
            // The mock/ folder is a standalone Next.js reference app. Keep Vite
            // from watching it so its tsconfig/file changes don't clear the dep
            // optimizer cache and break in-flight page chunk loads.
            ignored: ['**/mock/**'],
        },
    },
    optimizeDeps: {
        // Pre-bundle recharts at startup instead of lazily on first chart page,
        // which otherwise forces a reload that can strand page imports.
        include: ['recharts'],
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
            fonts: [
                bunny('Hanken Grotesk', {
                    weights: [400, 500, 600, 700],
                }),
                bunny('Newsreader', {
                    weights: [400, 600, 700],
                }),
                bunny('Fira Code', {
                    weights: [400, 500],
                }),
            ],
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
