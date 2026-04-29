import { Head, Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { FlashMessages } from '../components/FlashMessages';
import type { SharedPageProps } from '../types';
import { buttonClass } from '../ui';
import { cn } from '../utils';

interface AdminLayoutProps extends PropsWithChildren {
    title: string;
}

interface AdminLink {
    href: string;
    label: string;
    match: string;
}

const links: AdminLink[] = [
    { href: route('admin.app'), label: 'Sudoku App', match: '/admin' },
    { href: route('admin.dashboard'), label: 'Dashboard', match: '/admin/panel' },
    { href: route('admin.products.index'), label: 'Productos', match: '/admin/productos' },
    { href: route('admin.categories.index'), label: 'Categorias', match: '/admin/categorias' },
    { href: route('admin.sales.index'), label: 'Ventas', match: '/admin/ventas' },
    { href: route('admin.media.index'), label: 'Media', match: '/admin/media' },
    { href: route('admin.services.index'), label: 'Servicios', match: '/admin/servicios' },
    { href: route('admin.announcements.index'), label: 'Anuncios', match: '/admin/anuncios' },
    { href: route('admin.contact.index'), label: 'Contacto', match: '/admin/contacto' },
    { href: route('admin.settings.index'), label: 'Configuracion', match: '/admin/configuracion' },
    { href: route('admin.backups.index'), label: 'Backups', match: '/admin/backups' },
    { href: route('admin.trash.index'), label: 'Papelera', match: '/admin/papelera' },
];

const adminNavLinkClasses =
    'inline-flex min-h-8 items-center justify-center rounded-md border border-white/25 bg-white/12 px-2.5 py-1.5 text-[0.72rem] font-black leading-none tracking-[0.02em] text-slate-50 no-underline backdrop-blur-sm transition duration-150 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/30';

const adminNavLinkActiveClasses =
    'border-white/85 bg-[linear-gradient(135deg,#f4f8ff,#d8e7ff)] text-[#164596] shadow-[0_6px_12px_rgba(10,36,88,0.16)]';

export function AdminLayout({ children, title }: AdminLayoutProps): JSX.Element {
    const { auth, app } = usePage<SharedPageProps>().props;
    const page = usePage();
    const currentUrl = page.url;

    return (
        <>
            <Head title={title} />
            <div className="admin-density min-h-screen bg-[#e8f1ff] p-2 text-[#0f172a] md:p-2.5">
                <header className="mx-auto mb-2 grid w-full max-w-[1680px] gap-2 rounded-lg border border-[rgba(88,136,210,0.45)] bg-[linear-gradient(160deg,#12357d_0%,#1b4eab_52%,#2467d7_100%)] p-2.5 text-slate-50 shadow-[0_10px_22px_rgba(14,45,104,0.18)] md:p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[rgba(225,240,255,0.78)]">Panel de control</p>
                            <h1 className="text-[1.25rem] font-black leading-none md:text-[1.45rem]">Tienda Abril</h1>
                            <p className="flex min-w-0 flex-wrap gap-x-2 text-[0.78rem] font-semibold text-[rgba(230,239,255,0.9)]">
                                <span className="truncate">{auth.user?.name ?? 'Administrador'}</span>
                                <span className="truncate">{auth.user?.email ?? app.name}</span>
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Link href={route('store.catalog')} className={adminNavLinkClasses}>
                                Ver tienda
                            </Link>
                            <Link href={route('admin.app')} className={adminNavLinkClasses}>
                                Sudoku App
                            </Link>
                            <Link href={route('repairs.workbench')} className={adminNavLinkClasses}>
                                Reparaciones
                            </Link>
                            <Link href={route('logout')} method="post" as="button" className={buttonClass('primary', 'sm', 'min-h-8 rounded-md px-2.5 py-1.5 text-[0.72rem] tracking-[0.02em]')}>
                                Cerrar sesion
                            </Link>
                        </div>
                    </div>
                    <nav className="flex flex-wrap gap-1.5 border-t border-white/15 pt-2" aria-label="Navegacion administrativa">
                        {links.map((link) => {
                            const isActive = link.href === route('admin.app')
                                ? currentUrl === '/admin'
                                : currentUrl === link.match || currentUrl.startsWith(`${link.match}/`);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(adminNavLinkClasses, isActive && adminNavLinkActiveClasses)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>
                </header>
                <main className="mx-auto grid w-full max-w-[1680px] gap-2">
                    <FlashMessages />
                    {children}
                </main>
            </div>
        </>
    );
}
