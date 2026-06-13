import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { PropsWithChildren, ReactNode } from 'react';
import { FaArchive, FaChartBar, FaClipboardCheck, FaDatabase, FaExternalLinkAlt, FaHome, FaInbox, FaList, FaPowerOff, FaSearch, FaTools } from 'react-icons/fa';
import { FlashMessages } from '../components/FlashMessages';
import type { SharedPageProps } from '../types';
import { cn } from '../utils';

interface RepairLayoutProps extends PropsWithChildren {
    title: string;
}

interface NavItem {
    href: string;
    label: string;
    shortLabel: string;
    match: string;
    icon: ReactNode;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

function hasZiggyRoute(name: string): boolean {
    try {
        const router = route();

        return typeof router.has === 'function' ? router.has(name) : true;
    } catch {
        return false;
    }
}

function isNavMatch(currentUrl: string, match: string): boolean {
    if (match === '/repuestos') {
        return currentUrl === match || currentUrl.startsWith(`${match}?`);
    }

    return currentUrl === match || currentUrl.startsWith(`${match}/`) || currentUrl.startsWith(`${match}?`);
}

export function RepairLayout({ children, title }: RepairLayoutProps): JSX.Element {
    const page = usePage<SharedPageProps>();
    const currentUrl = page.url;
    const { auth } = page.props;
    const [openNavGroup, setOpenNavGroup] = useState<string | null>(null);

    const directNavItems: NavItem[] = [
        { href: route('repairs.workbench'), label: 'Consultas', shortLabel: 'Cons.', match: '/consulta', icon: <FaSearch aria-hidden="true" /> },
        { href: route('repairs.ingress'), label: 'Nueva Orden', shortLabel: 'Ingreso', match: '/ingreso', icon: <FaInbox aria-hidden="true" /> },
        ...(hasZiggyRoute('tasks.index') ? [{ href: route('tasks.index'), label: 'Tareas', shortLabel: 'Tareas', match: '/tareas', icon: <FaClipboardCheck aria-hidden="true" /> }] : []),
    ];

    const navGroups: NavGroup[] = [
        {
            label: 'Repuestos',
            items: [
                { href: route('repairs.parts'), label: 'Repuestos', shortLabel: 'Rep.', match: '/repuestos', icon: <FaTools aria-hidden="true" /> },
                { href: route('repairs.lists'), label: 'Opciones', shortLabel: 'Opc.', match: '/listas-reparacion', icon: <FaList aria-hidden="true" /> },
                { href: route('repairs.parts.settings'), label: 'Base de repuestos', shortLabel: 'Base', match: '/repuestos/base', icon: <FaDatabase aria-hidden="true" /> },
            ],
        },
        {
            label: 'Control',
            items: [
                ...(hasZiggyRoute('repairs.metrics') ? [{ href: route('repairs.metrics'), label: 'Metricas', shortLabel: 'Met.', match: '/metricas', icon: <FaChartBar aria-hidden="true" /> }] : []),
                { href: route('repairs.delivered'), label: 'Entregados', shortLabel: 'Entreg.', match: '/entregados', icon: <FaTools aria-hidden="true" /> },
                ...(hasZiggyRoute('repairs.archived') ? [{ href: route('repairs.archived'), label: 'Archivados', shortLabel: 'Arch.', match: '/archivados', icon: <FaArchive aria-hidden="true" /> }] : []),
            ],
        },
        {
            label: 'Accesos',
            items: [
                { href: route('admin.products.index'), label: 'Productos y ventas', shortLabel: 'Prod.', match: '/admin/productos', icon: <FaExternalLinkAlt aria-hidden="true" /> },
                { href: route('repairs.tracking'), label: 'Consulta publica', shortLabel: 'Publica', match: '/reparacion', icon: <FaSearch aria-hidden="true" /> },
                { href: route('store.catalog'), label: 'Tienda', shortLabel: 'Tienda', match: '/productos', icon: <FaHome aria-hidden="true" /> },
            ],
        },
    ];

    const navLinkClasses =
        'inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-md border border-transparent px-2 text-[0.68rem] font-bold text-[#eaf2ff] no-underline transition duration-150 hover:border-[#7fb4ff] hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#bfdbfe] xl:min-h-9 xl:px-3 xl:py-2 xl:text-[0.82rem]';
    const navLinkActiveClasses = 'border-[#bfdbfe] bg-white !text-[#0b3a83] shadow-sm';
    const newOrderLinkClasses = 'border-[#7dd3fc] bg-[#38bdf8] text-[#082f49] shadow-sm hover:border-[#bae6fd] hover:bg-[#0ea5e9] hover:text-white';
    const newOrderActiveClasses = 'border-[#bae6fd] bg-[#0ea5e9] text-white shadow-sm';
    const navMenuClasses = 'relative shrink-0';
    const navMenuButtonClasses = 'flex min-h-8 cursor-pointer items-center justify-between gap-2 rounded-md border border-white/15 bg-white/10 px-2.5 py-1.5 text-[0.72rem] font-black text-[#eaf2ff] transition hover:border-[#7fb4ff] hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#bfdbfe] xl:min-h-9 xl:px-3 xl:text-[0.82rem]';
    const navMenuPanelClasses = 'absolute left-0 z-40 mt-1 grid min-w-[12rem] gap-1 rounded-md border border-white/20 bg-[#123f91] p-1.5 shadow-[0_12px_24px_rgba(8,24,60,0.24)]';

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-[#eaf2fb] px-2 py-2 text-[#0f172a] md:px-4 md:py-3">
                <header className="sticky top-1 z-30 mx-auto mb-3 w-[min(100%,1920px)] rounded-lg border border-[#123f91] bg-[#174ea6] px-2 py-1.5 text-white shadow-[0_6px_18px_rgba(15,61,145,0.22)] xl:top-2 xl:mb-4 xl:px-3 xl:py-2">
                    <nav className="grid gap-1 xl:flex xl:flex-wrap xl:items-center xl:gap-2">
                        <div className="flex min-w-0 items-center gap-1.5 xl:contents">
                            <Link href={route('repairs.workbench')} className="mr-auto inline-flex min-h-7 min-w-0 items-center gap-1.5 rounded-md px-1 text-[0.8rem] font-bold text-white no-underline transition hover:text-[#dbeafe] xl:mr-3 xl:min-h-9 xl:px-2 xl:text-[0.95rem]">
                                <FaTools className="shrink-0" aria-hidden="true" />
                                <span className="truncate xl:hidden">{title}</span>
                                <span className="hidden xl:inline">Gestion de Ordenes</span>
                            </Link>
                            <div className="xl:hidden">
                                {auth.user ? (
                                    <div className="flex gap-1">
                                        <Link href={route('admin.app')} className={cn(navLinkClasses, 'bg-white/10')} aria-label="Sudoku App" title="Sudoku App">
                                            <FaHome aria-hidden="true" />
                                            <span>App</span>
                                        </Link>
                                        <Link href={route('logout')} method="post" as="button" className={cn(navLinkClasses, 'bg-white/10')} aria-label="Salir" title="Salir">
                                            <FaPowerOff aria-hidden="true" />
                                            <span>Salir</span>
                                        </Link>
                                    </div>
                                ) : auth.isRepairTech ? (
                                    <Link href={route('repairs.logout')} className={cn(navLinkClasses, 'bg-white/10')} aria-label="Salir" title="Salir">
                                        <FaPowerOff aria-hidden="true" />
                                        <span>Salir</span>
                                    </Link>
                                ) : (
                                    <Link href={route('repairs.workbench')} className={cn(navLinkClasses, 'bg-white/10')} aria-label="Acceso tecnico" title="Acceso tecnico">
                                        <FaExternalLinkAlt aria-hidden="true" />
                                        <span>Acceso</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="-mx-0.5 flex gap-1 overflow-x-auto pb-0.5 xl:mx-0 xl:overflow-visible xl:pb-0">
                            {directNavItems.map((item) => {
                                const isActive = isNavMatch(currentUrl, item.match);
                                const isNewOrder = item.match === '/ingreso';

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(navLinkClasses, isNewOrder && newOrderLinkClasses, isActive && (isNewOrder ? newOrderActiveClasses : navLinkActiveClasses))}
                                        onClick={() => setOpenNavGroup(null)}
                                        aria-label={item.label}
                                        title={item.label}
                                    >
                                        {item.icon}
                                        <span className="xl:hidden">{item.shortLabel}</span>
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                            {navGroups.map((group) => {
                                const hasActiveItem = group.items.some((item) => isNavMatch(currentUrl, item.match));
                                const isOpen = openNavGroup === group.label;

                                return (
                                    <div key={group.label} className={navMenuClasses}>
                                        <button
                                            type="button"
                                            className={cn(navMenuButtonClasses, hasActiveItem && navLinkActiveClasses)}
                                            aria-expanded={isOpen}
                                            onClick={() => setOpenNavGroup(isOpen ? null : group.label)}
                                        >
                                            {group.label}
                                            <span aria-hidden="true" className="text-[0.62rem]">{isOpen ? '^' : 'v'}</span>
                                        </button>
                                        {isOpen ? (
                                            <div className={navMenuPanelClasses}>
                                                {group.items.map((item) => {
                                                    const isActive = isNavMatch(currentUrl, item.match);
                                                    const isNewOrder = item.match === '/ingreso';

                                                    return (
                                                        <Link
                                                            key={item.href}
                                                            href={item.href}
                                                            className={cn(navLinkClasses, 'justify-start', isNewOrder && newOrderLinkClasses, isActive && (isNewOrder ? newOrderActiveClasses : navLinkActiveClasses))}
                                                            onClick={() => setOpenNavGroup(null)}
                                                            aria-label={item.label}
                                                            title={item.label}
                                                        >
                                                            {item.icon}
                                                            <span>{item.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                        {auth.user ? (
                            <div className="ml-auto hidden items-center gap-2 xl:flex">
                                <Link href={route('admin.app')} className={navLinkClasses} aria-label="Sudoku App" title="Sudoku App">
                                    <FaHome aria-hidden="true" />
                                    <span>Sudoku App</span>
                                </Link>
                                <Link href={route('logout')} method="post" as="button" className={navLinkClasses}>
                                    <FaPowerOff aria-hidden="true" />
                                    <span>Salir</span>
                                </Link>
                            </div>
                        ) : auth.isRepairTech ? (
                            <Link href={route('repairs.logout')} className={cn(navLinkClasses, 'ml-auto !hidden xl:!inline-flex')}>
                                <FaPowerOff aria-hidden="true" />
                                <span>Salir</span>
                            </Link>
                        ) : (
                            <Link href={route('repairs.workbench')} className={cn(navLinkClasses, 'ml-auto !hidden xl:!inline-flex')}>
                                <FaExternalLinkAlt aria-hidden="true" />
                                <span>Acceso tecnico</span>
                            </Link>
                        )}
                    </nav>
                </header>
                <main className="mx-auto grid w-[min(100%,1920px)] gap-4 pb-6">
                    <FlashMessages />
                    {children}
                </main>
            </div>
        </>
    );
}
