import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedPageProps } from '../../types';

export default function TechLoginPage(): JSX.Element {
    const [password, setPassword] = useState('');
    const { flash } = usePage<SharedPageProps>().props;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-4 py-10 font-sans text-[#0f172a]">
            <form className="grid w-[min(90%,400px)] gap-4 rounded-[10px] border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)]" method="post" action={route('repairs.login.submit')}>
                <input type="hidden" name="_token" value={csrfToken} />
                <h1 className="mb-2 text-center text-[1.75rem] font-semibold leading-tight text-[#0d6efd]">Acceso al Sistema</h1>
                {flash.error ? <div className="rounded-md border border-[#f5c2c7] bg-[#f8d7da] px-4 py-3 text-sm text-[#842029]">{flash.error}</div> : null}
                {flash.success ? <div className="rounded-md border border-[#badbcc] bg-[#d1e7dd] px-4 py-3 text-sm text-[#0f5132]">{flash.success}</div> : null}
                <label htmlFor="clave" className="text-base font-bold text-[#212529]">
                    Clave de Acceso
                </label>
                <input
                    id="clave"
                    type="password"
                    className="min-h-[38px] rounded-md border border-[#dee2e6] bg-white px-3 py-2 text-base text-[#212529] outline-none transition focus:border-[#86b7fe] focus:ring-4 focus:ring-[#0d6efd40]"
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                />
                <button className="min-h-[38px] w-full rounded-md border border-[#0d6efd] bg-[#0d6efd] px-3 py-2 text-base font-bold text-white transition hover:bg-[#0b5ed7]" type="submit">
                    Ingresar
                </button>
            </form>
        </div>
    );
}
