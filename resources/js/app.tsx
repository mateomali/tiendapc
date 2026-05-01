import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import type { ComponentType, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

type LayoutComponent = ComponentType<{ children: ReactNode }>;
type LayoutFunction = (page: ReactNode) => ReactNode;
type ReactComponent = ComponentType<any> & {
    layout?: LayoutComponent | LayoutComponent[] | LayoutFunction | ((props: any) => any);
};

const pages = import.meta.glob<{ default: ReactComponent }>('./pages/**/*.tsx');

function renderBootError(error: unknown): void {
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const target = document.getElementById('app') ?? document.body;

    target.replaceChildren();

    const panel = document.createElement('div');
    panel.className = 'mx-auto my-8 max-w-[960px] rounded-2xl border border-[#f3b4b4] bg-[#fff4f4] px-5 py-4 font-sans text-sm leading-6 text-[#7f1d1d]';

    const title = document.createElement('strong');
    title.className = 'mb-2 block';
    title.textContent = 'Error de frontend';

    const details = document.createElement('pre');
    details.className = 'm-0 whitespace-pre-wrap';
    details.textContent = message;

    panel.append(title, details);
    target.append(panel);
}

window.addEventListener('error', (event) => {
    renderBootError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
    renderBootError(event.reason);
});

createInertiaApp({
    resolve: async (name) => {
        const page = await resolvePageComponent<{ default: ReactComponent }>(
            `./pages/${name}.tsx`,
            pages,
        );

        return page.default;
    },
    setup({ el, App, props }) {
        try {
            createRoot(el).render(<App {...props} />);
        } catch (error) {
            renderBootError(error);
        }
    },
    progress: {
        color: '#f97316',
    },
});
