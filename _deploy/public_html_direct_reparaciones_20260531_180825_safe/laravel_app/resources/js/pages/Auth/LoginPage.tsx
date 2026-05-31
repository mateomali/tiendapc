import { useForm } from '@inertiajs/react';
import { SiteLayout } from '../../layouts/SiteLayout';
import { buttonClass, surfaceClass } from '../../ui';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
}

export default function LoginPage(): JSX.Element {
    const form = useForm<LoginForm>({
        email: 'admin@tienda.local',
        password: 'admin12345',
        remember: true,
    });

    return (
        <SiteLayout title="Ingreso">
            <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                <section className={`${surfaceClass} p-8`}>
                    <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-700">Admin</p>
                    <h2 className="mt-3 text-4xl font-black text-ink-900">Panel de gestion unificado</h2>
                    <p className="mt-4 max-w-xl text-base leading-7 text-ink-700">
                        Accede a catalogo, ventas, configuracion del sitio y modulo de reparaciones desde el nuevo stack.
                    </p>
                    <p className="mt-3 text-sm font-semibold text-ink-700/80">
                        El acceso se bloquea temporalmente despues de varios intentos fallidos, igual que en el flujo legacy.
                    </p>
                </section>
                <form
                    className={`${surfaceClass} space-y-4 p-8`}
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('login.submit'));
                    }}
                >
                    <div>
                        <label htmlFor="login_email" className="mb-2 block text-sm font-semibold text-ink-700">
                            Email
                        </label>
                        <input
                            id="login_email"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                            value={form.data.email}
                            onChange={(event) => form.setData('email', event.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="login_password" className="mb-2 block text-sm font-semibold text-ink-700">
                            Password
                        </label>
                        <input
                            id="login_password"
                            type="password"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                            value={form.data.password}
                            onChange={(event) => form.setData('password', event.target.value)}
                        />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                        <input
                            type="checkbox"
                            checked={form.data.remember}
                            onChange={(event) => form.setData('remember', event.target.checked)}
                        />
                        Mantener sesion
                    </label>
                    <button className={buttonClass('primary', 'default', 'w-full')} disabled={form.processing}>
                        Ingresar
                    </button>
                </form>
            </div>
        </SiteLayout>
    );
}
