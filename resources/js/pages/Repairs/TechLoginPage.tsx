import { Link, usePage } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { FaArrowLeft, FaTools } from 'react-icons/fa';
import type { SharedPageProps } from '../../types';
import { repairButtonClass, repairSurfaceClass } from '../../repairUi';

export default function TechLoginPage(): JSX.Element {
    const [password, setPassword] = useState('');
    const { flash } = usePage<SharedPageProps>().props;
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
        if (password.trim() === '') {
            event.preventDefault();
        }
    };

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#eef4fb] px-4 py-10 font-sans text-[#0f172a]">
            <main className="w-full max-w-sm">
                <div className="mb-5 grid justify-items-center gap-3 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-xl border border-[#bfdbfe] bg-[#174ea6] text-[1.35rem] text-white shadow-[0_8px_20px_-10px_rgba(23,78,166,0.55)]">
                        <FaTools aria-hidden="true" />
                    </span>
                    <div className="grid gap-1">
                        <h1 className="text-2xl font-black leading-tight tracking-tight text-[#102146]">Acceso técnico</h1>
                        <p className="text-sm font-semibold text-[#4b5d78]">Panel de reparaciones</p>
                    </div>
                </div>

                <form className={`${repairSurfaceClass} grid w-full gap-4 p-6`} method="post" action={route('repairs.login.submit')} onSubmit={handleSubmit}>
                    <input type="hidden" name="_token" value={csrfToken} />
                    {flash.error ? <div className="rounded-lg border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-sm font-bold text-[#be123c]">{flash.error}</div> : null}
                    {flash.success ? <div className="rounded-lg border border-[#bbf7d0] bg-[#ecfdf5] px-3 py-2 text-sm font-bold text-[#166534]">{flash.success}</div> : null}
                    <label htmlFor="clave" className="grid gap-1.5 text-sm font-bold text-[#334155]">
                        Clave de acceso
                        <input
                            id="clave"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            autoFocus
                            required
                            className="h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-base font-semibold text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20] disabled:bg-slate-100 disabled:text-slate-500 sm:text-[0.95rem]"
                            placeholder="Ingresá la clave"
                        />
                    </label>
                    <button className={repairButtonClass('primary', 'default', 'h-12 w-full')} type="submit">
                        Ingresar
                    </button>
                    <p className="text-center text-xs font-medium leading-5 text-[#64748b]">
                        Panel privado para gestionar consultas, órdenes y estados de reparación.
                    </p>
                </form>

                <div className="mt-5 text-center">
                    <Link
                        href={route('repairs.tracking')}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-[#1d4ed8] no-underline transition hover:bg-[#dbeafe] hover:underline underline-offset-2"
                    >
                        <FaArrowLeft aria-hidden="true" />
                        Volver al seguimiento de reparación
                    </Link>
                </div>
            </main>
        </div>
    );
}
