import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WorkbenchPage from '../../resources/js/pages/Repairs/WorkbenchPage';

export function usePage() { return { props: { auth: { user: { id: 7 } }, flash: {} } }; }
export const router = { on: () => () => {}, get() {}, post() {}, visit() {} };
export function Link({ children, ...props }: any) { return <a {...props}>{children}</a>; }
export function useForm(initial: any) {
    const defaults = useRef(initial);
    const [data, setData] = useState(initial);
    const [errors, setErrors] = useState({});
    const transformer = useRef((value: any) => value);
    if (data.jobs) (window as any).__intakeData = data;
    return {
        data, errors, processing: false, progress: null,
        setData(key: any, value: any) { setData((current: any) => typeof key === 'function' ? key(current) : typeof key === 'string' ? { ...current, [key]: value } : key); },
        reset(...keys: string[]) { setData((current: any) => keys.length ? { ...current, ...Object.fromEntries(keys.map((key) => [key, defaults.current[key]])) } : defaults.current); },
        setError(key: string, message: string) { setErrors((current) => ({ ...current, [key]: message })); },
        clearErrors() { setErrors({}); },
        transform(callback: any) { transformer.current = callback; },
        post(_url: string, options: any) {
            (window as any).__submitted = transformer.current(data);
            if ((window as any).__saveSucceeds) options.onSuccess?.();
            else options.onError?.();
            options.onFinish?.();
        },
    };
}
export function RepairLayout({ children }: any) {
    return <main style={{ '--repair-header-offset': '80px' } as React.CSSProperties}>
        <header style={{ position: 'sticky', top: 0, height: 72, zIndex: 30, background: '#174ea6' }}>Reparaciones</header>
        {children}
    </main>;
}

const props: any = {
    filters: {}, tickets: [], deliveredSearchTickets: [],
    summary: {}, deliveredSearchMatches: 0, archivedSearchMatches: 0,
    pagination: { page: 1, totalPages: 1, total: 0, perPage: 24 },
    states: ['PENDIENTE'], serviceCategories: [{ value: 4, label: 'Otros' }],
    serviceTemplates: [{ value: 'pantalla', label: 'Cambio de pantalla', description: 'Pantalla rota', repuesto: '' }],
    failureTemplates: [], serviceOptionUsage: {}, partInventory: [], deviceModels: [],
    nextOrderId: Number(new URLSearchParams(location.search).get('order') || 2308), pageMode: 'ingreso',
};
(window as any).route = (name: string) => `/${name}`;
createRoot(document.getElementById('root')!).render(<WorkbenchPage {...props} />);
