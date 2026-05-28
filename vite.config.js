import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const vitePort = Number.parseInt(env.VITE_PORT || '5173', 10);
    const viteHost = env.VITE_HOST || '0.0.0.0';
    const viteHmrHost = env.VITE_HMR_HOST || undefined;
    const viteOriginHost = env.VITE_ORIGIN_HOST || viteHmrHost || '127.0.0.1';

    return {
        publicDir: command === 'serve' ? 'public' : false,
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        server: {
            host: viteHost,
            port: vitePort,
            strictPort: true,
            cors: true,
            origin: `http://${viteOriginHost}:${vitePort}`,
            hmr: viteHmrHost
                ? {
                    host: viteHmrHost,
                    port: vitePort,
                }
                : undefined,
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
