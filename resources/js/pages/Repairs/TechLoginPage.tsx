import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import type { SharedPageProps } from '../../types';
import { repairButtonClass, repairSurfaceClass, repairUi } from '../../repairUi';

export default function TechLoginPage(): JSX.Element {
    const [password, setPassword] = useState('');
    const { flash } = usePage<SharedPageProps>().props;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    return (
        <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#edf5ff_0%,#f8fbff_48%,#e4efff_100%)] px-4 py-10 font-sans text-[#0f172a]">
            <form className={`${repairSurfaceClass} grid w-full max-w-sm gap-4 p-6`} method="post" action={route('repairs.login.submit')}>
                <input type="hidden" name="_token" value={csrfToken} />
                <div className="grid gap-1 text-center">
                    <p className={repairUi.eyebrow}>Reparaciones</p>
                    <h1 className="text-2xl font-black leading-tight tracking-tight text-[#0f172a]">Acceso técnico</h1>
                </div>
                {flash.error ? <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-sm font-bold text-[#be123c]">{flash.error}</div> : null}
                {flash.success ? <div className="rounded-xl border border-[#bbf7d0] bg-[#ecfdf5] px-3 py-2 text-sm font-bold text-[#166534]">{flash.success}</div> : null}
                <label htmlFor="clave" className="grid gap-1.5 text-sm font-black text-[#334155]">
                    Clave de acceso
                    <input
                        id="clave"
                        type="password"
                        className={repairUi.input}
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>
                <button className={repairButtonClass('primary', 'default', 'w-full')} type="submit">
                    Ingresar
                </button>
                <p className="text-center text-xs font-semibold leading-5 text-[#64748b]">
                    Panel privado para gestionar consultas, órdenes y estados de reparación.
                </p>
            </form>
        </div>
    );
}
