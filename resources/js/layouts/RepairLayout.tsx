import { Head, Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { FaExternalLinkAlt, FaHome, FaInbox, FaPowerOff, FaSearch, FaTools } from 'react-icons/fa';
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

export function RepairLayout({ children, title }: RepairLayoutProps): JSX.Element {
    const page = usePage<SharedPageProps>();
    const currentUrl = page.url;
    const { auth } = page.props;

    const navItems: NavItem[] = [
        { href: route('admin.app'), label: 'Sudoku App', shortLabel: 'App', match: '/admin', icon: <FaHome aria-hidden="true" /> },
        { href: route('admin.products.index'), label: 'Productos y ventas', shortLabel: 'Prod.', match: '/admin/productos', icon: <FaExternalLinkAlt aria-hidden="true" /> },
        { href: route('repairs.workbench'), label: 'Consultas', shortLabel: 'Cons.', match: '/consulta', icon: <FaSearch aria-hidden="true" /> },
        { href: route('repairs.ingress'), label: 'Nueva Orden', shortLabel: 'Ingreso', match: '/ingreso', icon: <FaInbox aria-hidden="true" /> },
        { href: route('repairs.delivered'), label: 'Entregados', shortLabel: 'Entreg.', match: '/entregados', icon: <FaTools aria-hidden="true" /> },
        { href: route('repairs.tracking'), label: 'Consulta publica', shortLabel: 'Publica', match: '/reparacion', icon: <FaSearch aria-hidden="true" /> },
    ];

    const navLinkClasses =
        'inline-flex min-h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-[0.68rem] font-black uppercase tracking-[0.02em] text-[#dbeafe] no-underline transition duration-150 hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white/35 xl:min-h-10 xl:rounded-xl xl:px-3.5 xl:py-2 xl:text-[0.86rem] xl:tracking-[0.03em]';
    const navLinkActiveClasses = 'bg-white text-[#17408b] shadow-[0_10px_22px_rgba(6,24,64,0.18)]';

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-[linear-gradient(135deg,#e8f3ff_0%,#f8fbff_38%,#eef4ff_72%,#e5f7ff_100%)] bg-fixed px-2 py-2 text-[#0f172a] md:px-4 md:py-3">
                <header className="sticky top-1 z-30 mx-auto mb-1.5 w-[min(100%,1920px)] rounded-[12px] border border-white/70 bg-[linear-gradient(135deg,#173b7d_0%,#235ac4_55%,#1e40af_100%)] px-2 py-1.5 text-white shadow-[0_8px_22px_rgba(15,23,42,0.14)] backdrop-blur xl:top-2 xl:mb-3 xl:rounded-[22px] xl:px-4 xl:py-3">
                    <nav className="grid gap-1 xl:flex xl:flex-wrap xl:items-center xl:gap-2">
                        <div className="flex min-w-0 items-center gap-1.5 xl:contents">
                            <Link href={route('repairs.workbench')} className="mr-auto inline-flex min-h-7 min-w-0 items-center gap-1.5 rounded-lg px-1 text-[0.8rem] font-black text-white no-underline xl:mr-3 xl:min-h-10 xl:rounded-xl xl:px-2 xl:text-[1rem]">
                                <FaTools className="shrink-0" aria-hidden="true" />
                                <span className="truncate xl:hidden">{title}</span>
                                <span className="hidden xl:inline">Gestion de Ordenes</span>
                            </Link>
                            <div className="xl:hidden">
                                {auth.user ? (
                                    <Link href={route('logout')} method="post" as="button" className={cn(navLinkClasses, 'bg-white/10')} aria-label="Salir" title="Salir">
                                        <FaPowerOff aria-hidden="true" />
                                        <span>Salir</span>
                                    </Link>
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
                        <div className="-mx-0.5 flex gap-1 overflow-x-auto pb-0.5 xl:mx-0 xl:contents xl:overflow-visible xl:pb-0">
                            {navItems.map((item) => {
                                const isActive = currentUrl === item.match || currentUrl.startsWith(`${item.match}/`);

                                return (
                                    <Link key={item.href} href={item.href} className={cn(navLinkClasses, isActive && navLinkActiveClasses)} aria-label={item.label} title={item.label}>
                                        {item.icon}
                                        <span className="xl:hidden">{item.shortLabel}</span>
                                        <span className="hidden xl:inline">{item.label}</span>
                                    </Link>
                                );
                            })}
                            <Link href={route('store.catalog')} className={navLinkClasses} aria-label="Tienda" title="Tienda">
                                <FaHome aria-hidden="true" />
                                <span>Tienda</span>
                            </Link>
                        </div>
                        {auth.user ? (
                            <Link href={route('logout')} method="post" as="button" className={cn(navLinkClasses, 'ml-auto !hidden xl:!inline-flex')}>
                                <FaPowerOff aria-hidden="true" />
                                <span>Salir</span>
                            </Link>
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
                <main className="mx-auto grid w-[min(100%,1920px)] gap-3">
                    <FlashMessages />
                    {children}
                </main>
            </div>
        </>
    );
}
