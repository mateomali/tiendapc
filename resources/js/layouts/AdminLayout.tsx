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

interface HeaderShortcut {
    href: string;
    label: string;
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

const adminDensityClasses = [
    'min-h-screen overflow-x-hidden bg-[#e8f1ff] p-2 text-[#0f172a] [color-scheme:light] print:bg-white print:p-0 max-[430px]:p-1.5 md:p-2.5',
    '[&_:where(main,form,section,article,aside,div,nav)]:min-w-0',
    '[&_:where(section,article,aside,form)]:!rounded-xl',
    '[&_:where(main>section,main>form,main>article,main>aside,main>div>section,main>div>form,main>div>article,main>div>aside)]:!border-[rgba(148,180,226,0.72)]',
    '[&_:where(main>section,main>form,main>article,main>aside,main>div>section,main>div>form,main>div>article,main>div>aside)]:!shadow-[0_8px_18px_rgba(15,45,103,0.08)]',
    '[&_:where(section,article,aside,form):not(:where(header_*))]:!p-3',
    '[&_:where(.space-y-5>:not([hidden])~:not([hidden]),.space-y-4>:not([hidden])~:not([hidden]),.space-y-3>:not([hidden])~:not([hidden]),.space-y-2>:not([hidden])~:not([hidden]))]:!mt-[0.45rem]',
    '[&_:where(.grid)]:gap-[0.55rem] [&_:where(.flex)]:gap-[0.45rem]',
    '[&_:where(h1,h2,h3,p)]:my-0 [&_:where(h2)]:!text-xl [&_:where(h2)]:!leading-[1.15] [&_:where(h3)]:!text-[1.05rem] [&_:where(h3)]:!leading-[1.15]',
    '[&_:where(p,span,label,small)]:leading-tight',
    '[&_:where(input:not([type=checkbox]):not([type=radio]),select)]:!min-h-[2.15rem] [&_:where(input:not([type=checkbox]):not([type=radio]),select)]:!rounded-[0.45rem] [&_:where(input:not([type=checkbox]):not([type=radio]),select)]:!px-[0.55rem] [&_:where(input:not([type=checkbox]):not([type=radio]),select)]:!py-[0.4rem] [&_:where(input:not([type=checkbox]):not([type=radio]),select)]:!text-[0.8rem]',
    '[&_:where(input[type=checkbox],input[type=radio])]:h-4 [&_:where(input[type=checkbox],input[type=radio])]:w-4 [&_:where(label:has(input[type=checkbox]),label:has(input[type=radio]))]:cursor-pointer [&_:where(label:has(input[type=checkbox]),label:has(input[type=radio]))]:select-none',
    '[&_:where(textarea)]:!min-h-[4.75rem] [&_:where(textarea)]:!rounded-[0.45rem] [&_:where(textarea)]:!px-[0.55rem] [&_:where(textarea)]:!py-[0.45rem] [&_:where(textarea)]:!text-[0.8rem]',
    '[&_:where(button,a[role=button],input[type=submit])]:!rounded-[0.45rem]',
    '[&_:where(table)]:w-full [&_:where(table)]:!border-collapse [&_:where(table)]:!border-spacing-0 [&_:where(table)]:!text-[0.78rem]',
    '[&_:where(th)]:!whitespace-nowrap [&_:where(th)]:!border-r [&_:where(th)]:!border-b [&_:where(th)]:!border-r-[rgba(148,180,226,0.74)] [&_:where(th)]:!border-b-[rgba(112,153,214,0.82)] [&_:where(th)]:!px-2 [&_:where(th)]:!py-[0.42rem]',
    '[&_:where(td)]:!border-r [&_:where(td)]:!border-b [&_:where(td)]:!border-[rgba(192,211,238,0.9)] [&_:where(td)]:!px-2 [&_:where(td)]:!py-[0.45rem] [&_:where(td)]:!align-top',
    '[&_:where(th:last-child,td:last-child)]:!border-r-0 [&_:where(tbody_tr:nth-child(even))]:bg-[rgba(248,251,255,0.72)] [&_:where(tbody_tr:hover)]:bg-[rgba(229,241,255,0.82)]',
    '[&_:where(img)]:max-w-full',
    '[&_:where(article_h3,button_h3)]:line-clamp-2 [&_:where(article_p,button_p)]:line-clamp-2 [&_:where(article_p,button_p)]:break-anywhere',
    '[&_:where(article_.inline-flex,article_a,article_button)]:!min-h-[1.85rem] [&_:where(article_.inline-flex,article_a,article_button)]:!py-1',
    '[&_:where(.overflow-x-auto)]:!rounded-[0.6rem]',
    '[&_:where(.rounded-2xl,.rounded-\\[1\\.4rem\\],.rounded-\\[1\\.5rem\\],.rounded-\\[1\\.75rem\\],.rounded-\\[22px\\],.rounded-\\[24px\\])]:!rounded-[0.65rem]',
    '[&_:where(.p-6,.p-5,.p-4)]:!p-3 [&_:where(.px-6,.px-5,.px-4)]:!px-3 [&_:where(.py-8,.py-6,.py-5,.py-4)]:!py-3',
    '[&_:where(.min-h-40,.min-h-48,.min-h-32)]:!min-h-20',
].join(' ');

function isAdminLinkActive(link: AdminLink, currentUrl: string): boolean {
    return currentUrl === link.match || currentUrl.startsWith(`${link.match}/`);
}

function headerShortcuts(): HeaderShortcut[] {
    return [
        { href: route('store.catalog'), label: 'Ver tienda' },
        { href: route('admin.app'), label: 'Sudoku App' },
        { href: route('repairs.workbench'), label: 'Reparaciones' },
    ];
}

function AdminBrand({ userLabel, userEmail }: { userLabel: string; userEmail: string }): JSX.Element {
    return (
        <div className="grid min-w-0 gap-1">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[0.58rem] font-black uppercase tracking-[0.08em] text-[rgba(225,240,255,0.78)] md:text-[0.68rem]">Panel de control</p>
                <h1 className="text-[1.05rem] font-black leading-none md:text-[1.45rem]">Tienda Sudoku</h1>
            </div>
            <p className="flex min-w-0 flex-wrap gap-x-2 text-[0.68rem] font-semibold text-[rgba(230,239,255,0.9)] md:text-[0.78rem]">
                <span className="truncate">{userLabel}</span>
                <span className="hidden truncate sm:inline">{userEmail}</span>
            </p>
        </div>
    );
}

export function AdminLayout({ children, title }: AdminLayoutProps): JSX.Element {
    const { auth, app } = usePage<SharedPageProps>().props;
    const page = usePage();
    const currentUrl = page.url;
    const userLabel = auth.user?.name ?? 'Administrador';
    const userEmail = auth.user?.email ?? app.name;

    return (
        <>
            <Head title={title} />
            <div className={adminDensityClasses}>
                <div className="mx-auto grid w-full max-w-[1800px] content-start gap-2">
                    <header className="grid w-full gap-2 rounded-lg border border-[rgba(88,136,210,0.45)] bg-[linear-gradient(160deg,#12357d_0%,#1b4eab_52%,#2467d7_100%)] p-2 text-slate-50 shadow-[0_10px_22px_rgba(14,45,104,0.18)] print:hidden md:gap-2.5 md:p-3">
                        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:border-b lg:border-white/15 lg:pb-2">
                            <AdminBrand userLabel={userLabel} userEmail={userEmail} />
                            <div className="hidden flex-wrap items-center gap-1.5 lg:flex lg:justify-end">
                                {headerShortcuts().map((shortcut) => (
                                    <Link key={shortcut.href} href={shortcut.href} className={adminNavLinkClasses}>
                                        {shortcut.label}
                                    </Link>
                                ))}
                                <Link href={route('logout')} method="post" as="button" className={buttonClass('primary', 'sm', 'min-h-8 rounded-md px-2.5 py-1.5 text-[0.72rem] tracking-[0.02em] sm:w-auto')}>
                                    Cerrar sesion
                                </Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 lg:hidden">
                                <details className="relative">
                                    <summary className={adminMobileMenuButtonClasses}>
                                        Navegacion
                                        <span aria-hidden="true">v</span>
                                    </summary>
                                    <nav className="absolute left-0 z-40 mt-1 grid max-h-[70vh] w-[min(92vw,24rem)] gap-2 overflow-y-auto rounded-lg border border-white/20 bg-[#12357d] p-2 shadow-[0_18px_34px_rgba(8,24,60,0.28)]" aria-label="Navegacion administrativa movil">
                                        <Link href={route('admin.app')} className={cn(adminNavLinkClasses, 'justify-start', currentUrl === '/admin' && adminNavLinkActiveClasses)}>
                                            Sudoku App
                                        </Link>
                                        {linkGroups.map((group) => (
                                            <div key={group.label} className="grid gap-1.5 rounded-md border border-white/10 bg-white/5 p-1.5">
                                                <span className="px-1 text-[0.58rem] font-black uppercase tracking-[0.12em] text-[rgba(225,240,255,0.68)]">{group.label}</span>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {group.links.map((link) => (
                                                        <Link key={link.href} href={link.href} className={cn(adminNavLinkClasses, isAdminLinkActive(link, currentUrl) && adminNavLinkActiveClasses)}>
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
                                        <span aria-hidden="true">v</span>
                                    </summary>
                                    <div className="absolute right-0 z-40 mt-1 grid w-[min(88vw,17rem)] gap-1.5 rounded-lg border border-white/20 bg-[#12357d] p-2 shadow-[0_18px_34px_rgba(8,24,60,0.28)]">
                                        {headerShortcuts().map((shortcut) => (
                                            <Link key={shortcut.href} href={shortcut.href} className={cn(adminNavLinkClasses, 'justify-start')}>
                                                {shortcut.label}
                                            </Link>
                                        ))}
                                        <Link href={route('logout')} method="post" as="button" className={buttonClass('primary', 'sm', 'min-h-8 justify-start rounded-md px-2.5 py-1.5 text-[0.72rem] tracking-[0.02em]')}>
                                            Cerrar sesion
                                        </Link>
                                    </div>
                                </details>
                        </div>
                        <nav className="hidden gap-2 lg:grid lg:grid-cols-[auto_minmax(0,1fr)]" aria-label="Navegacion administrativa">
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

                    <main className="grid w-full gap-2 print:block print:max-w-none print:p-0">
                        <FlashMessages />
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
