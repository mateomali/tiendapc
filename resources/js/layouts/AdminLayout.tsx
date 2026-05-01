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

interface AdminLinkGroup {
    label: string;
    links: AdminLink[];
}

const linkGroups: AdminLinkGroup[] = [
    {
        label: 'Operacion',
        links: [
            { href: route('admin.dashboard'), label: 'Dashboard', match: '/admin/panel' },
            { href: route('admin.sales.index'), label: 'Ventas', match: '/admin/ventas' },
            { href: route('admin.products.index'), label: 'Productos', match: '/admin/productos' },
            { href: route('admin.categories.index'), label: 'Categorias', match: '/admin/categorias' },
        ],
    },
    {
        label: 'Sitio',
        links: [
            { href: route('admin.media.index'), label: 'Media', match: '/admin/media' },
            { href: route('admin.services.index'), label: 'Servicios', match: '/admin/servicios' },
            { href: route('admin.announcements.index'), label: 'Anuncios', match: '/admin/anuncios' },
            { href: route('admin.contact.index'), label: 'Contacto', match: '/admin/contacto' },
        ],
    },
    {
        label: 'Sistema',
        links: [
            { href: route('admin.settings.index'), label: 'Configuracion', match: '/admin/configuracion' },
            { href: route('admin.backups.index'), label: 'Backups', match: '/admin/backups' },
            { href: route('admin.trash.index'), label: 'Papelera', match: '/admin/papelera' },
        ],
    },
];

const adminNavLinkClasses =
    'inline-flex min-h-8 items-center justify-center rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-[0.72rem] font-black leading-none tracking-[0.02em] text-slate-50 no-underline backdrop-blur-sm transition duration-150 hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/30';

const adminNavLinkActiveClasses =
    'border-white/85 bg-[linear-gradient(135deg,#f4f8ff,#d8e7ff)] text-[#164596] shadow-[0_6px_12px_rgba(10,36,88,0.16)]';

const adminMobileMenuButtonClasses =
    'flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 rounded-md border border-white/25 bg-white/12 px-2.5 py-1.5 text-[0.72rem] font-black leading-none tracking-[0.02em] text-slate-50 backdrop-blur-sm [&::-webkit-details-marker]:hidden';

function isAdminLinkActive(link: AdminLink, currentUrl: string): boolean {
    return currentUrl === link.match || currentUrl.startsWith(`${link.match}/`);
}

export function AdminLayout({ children, title }: AdminLayoutProps): JSX.Element {
    const { auth, app } = usePage<SharedPageProps>().props;
    const page = usePage();
    const currentUrl = page.url;

    return (
        <>
            <Head title={title} />
            <div className="admin-density min-h-screen bg-[#e8f1ff] p-2 text-[#0f172a] md:p-2.5">
                <header className="mx-auto mb-2 grid w-full max-w-[1680px] gap-2 rounded-lg border border-[rgba(88,136,210,0.45)] bg-[linear-gradient(160deg,#12357d_0%,#1b4eab_52%,#2467d7_100%)] p-2 text-slate-50 shadow-[0_10px_22px_rgba(14,45,104,0.18)] md:gap-2.5 md:p-3">
                    <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:border-b lg:border-white/15 lg:pb-2">
                        <div className="grid min-w-0 gap-1">
                            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                <p className="text-[0.58rem] font-black uppercase tracking-[0.08em] text-[rgba(225,240,255,0.78)] md:text-[0.68rem]">Panel de control</p>
                                <h1 className="text-[1.05rem] font-black leading-none md:text-[1.45rem]">Tienda Abril</h1>
                            </div>
                            <p className="flex min-w-0 flex-wrap gap-x-2 text-[0.68rem] font-semibold text-[rgba(230,239,255,0.9)] md:text-[0.78rem]">
                                <span className="truncate">{auth.user?.name ?? 'Administrador'}</span>
                                <span className="hidden truncate sm:inline">{auth.user?.email ?? app.name}</span>
                            </p>
                        </div>
                        <div className="hidden flex-wrap items-center gap-1.5 lg:flex lg:justify-end">
                            <Link href={route('store.catalog')} className={adminNavLinkClasses}>
                                Ver tienda
                            </Link>
                            <Link href={route('admin.app')} className={adminNavLinkClasses}>
                                Sudoku App
                            </Link>
                            <Link href={route('repairs.workbench')} className={adminNavLinkClasses}>
                                Reparaciones
                            </Link>
                            <Link href={route('logout')} method="post" as="button" className={buttonClass('primary', 'sm', 'min-h-8 rounded-md px-2.5 py-1.5 text-[0.72rem] tracking-[0.02em] sm:w-auto')}>
                                Cerrar sesion
                            </Link>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 lg:hidden">
                        <details className="relative">
                            <summary className={adminMobileMenuButtonClasses}>
                                Navegacion
                                <span aria-hidden="true">▾</span>
                            </summary>
                            <nav className="absolute left-0 z-40 mt-1 grid max-h-[70vh] w-[min(92vw,24rem)] gap-2 overflow-y-auto rounded-lg border border-white/20 bg-[#12357d] p-2 shadow-[0_18px_34px_rgba(8,24,60,0.28)]" aria-label="Navegacion administrativa movil">
                                <Link
                                    href={route('admin.app')}
                                    className={cn(adminNavLinkClasses, 'justify-start', currentUrl === '/admin' && adminNavLinkActiveClasses)}
                                >
                                    Sudoku App
                                </Link>
                                {linkGroups.map((group) => (
                                    <div key={group.label} className="grid gap-1.5 rounded-md border border-white/10 bg-white/5 p-1.5">
                                        <span className="px-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[rgba(225,240,255,0.68)]">{group.label}</span>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {group.links.map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    className={cn(adminNavLinkClasses, isAdminLinkActive(link, currentUrl) && adminNavLinkActiveClasses)}
                                                >
                                                    {link.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </details>
                        <details className="relative">
                            <summary className={adminMobileMenuButtonClasses}>
                                Accesos
                                <span aria-hidden="true">▾</span>
                            </summary>
                            <div className="absolute right-0 z-40 mt-1 grid w-[min(88vw,17rem)] gap-1.5 rounded-lg border border-white/20 bg-[#12357d] p-2 shadow-[0_18px_34px_rgba(8,24,60,0.28)]">
                                <Link href={route('store.catalog')} className={cn(adminNavLinkClasses, 'justify-start')}>
                                    Ver tienda
                                </Link>
                                <Link href={route('admin.app')} className={cn(adminNavLinkClasses, 'justify-start')}>
                                    Sudoku App
                                </Link>
                                <Link href={route('repairs.workbench')} className={cn(adminNavLinkClasses, 'justify-start')}>
                                    Reparaciones
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className={buttonClass('primary', 'sm', 'min-h-8 justify-start rounded-md px-2.5 py-1.5 text-[0.72rem] tracking-[0.02em]')}>
                                    Cerrar sesion
                                </Link>
                            </div>
                        </details>
                    </div>
                    <nav className="hidden gap-2 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto]" aria-label="Navegacion administrativa">
                        <Link
                            href={route('admin.app')}
                            className={cn(adminNavLinkClasses, 'justify-self-start', currentUrl === '/admin' && adminNavLinkActiveClasses)}
                        >
                            Sudoku App
                        </Link>
                        <div className="grid gap-2 sm:grid-cols-3">
                            {linkGroups.map((group) => (
                                <div key={group.label} className="grid gap-1.5 rounded-md border border-white/10 bg-black/5 p-1.5">
                                    <span className="px-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[rgba(225,240,255,0.68)]">{group.label}</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {group.links.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={cn(adminNavLinkClasses, isAdminLinkActive(link, currentUrl) && adminNavLinkActiveClasses)}
                                            >
                                                {link.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
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
