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
    match: string;
    icon: ReactNode;
}

export function RepairLayout({ children, title }: RepairLayoutProps): JSX.Element {
    const page = usePage<SharedPageProps>();
    const currentUrl = page.url;
    const { auth } = page.props;

    const navItems: NavItem[] = [
        { href: route('admin.app'), label: 'Sudoku App', match: '/admin', icon: <FaHome aria-hidden="true" /> },
        { href: route('admin.products.index'), label: 'Productos y ventas', match: '/admin/productos', icon: <FaExternalLinkAlt aria-hidden="true" /> },
        { href: route('repairs.workbench'), label: 'Consultas', match: '/consulta', icon: <FaSearch aria-hidden="true" /> },
        { href: route('repairs.ingress'), label: 'Nueva Orden', match: '/ingreso', icon: <FaInbox aria-hidden="true" /> },
        { href: route('repairs.delivered'), label: 'Entregados', match: '/entregados', icon: <FaTools aria-hidden="true" /> },
        { href: route('repairs.tracking'), label: 'Consulta publica', match: '/reparacion', icon: <FaSearch aria-hidden="true" /> },
    ];

    const navLinkClasses =
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[0.86rem] font-black uppercase tracking-[0.03em] text-[#dbeafe] no-underline transition duration-150 hover:bg-white/12 hover:text-white focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white/35';
    const navLinkActiveClasses = 'bg-white text-[#17408b] shadow-[0_10px_22px_rgba(6,24,64,0.18)]';

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-[linear-gradient(135deg,#e8f3ff_0%,#f8fbff_38%,#eef4ff_72%,#e5f7ff_100%)] bg-fixed px-2 py-2 text-[#0f172a] md:px-4 md:py-3">
                <header className="sticky top-2 z-30 mx-auto mb-3 w-[min(100%,1920px)] rounded-[22px] border border-white/70 bg-[radial-gradient(circle_at_12%_8%,rgba(125,211,252,0.25),transparent_32%),linear-gradient(135deg,#173b7d_0%,#235ac4_52%,#1e40af_100%)] px-3 py-3 text-white shadow-[0_18px_46px_rgba(15,23,42,0.18)] backdrop-blur md:px-4">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link href={route('repairs.workbench')} className="mr-1 inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-[1rem] font-black text-white no-underline md:mr-3">
                            <FaTools aria-hidden="true" />
                            <span>Gestion de Ordenes</span>
                        </Link>
                        {navItems.map((item) => {
                            const isActive = currentUrl === item.match || currentUrl.startsWith(`${item.match}/`);

                            return (
                                <Link key={item.href} href={item.href} className={cn(navLinkClasses, isActive && navLinkActiveClasses)}>
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                        <Link href={route('store.catalog')} className={navLinkClasses}>
                            <FaHome aria-hidden="true" />
                            <span>Tienda</span>
                        </Link>
                        {auth.user ? (
                            <Link href={route('logout')} method="post" as="button" className={cn(navLinkClasses, 'ml-auto')}>
                                <FaPowerOff aria-hidden="true" />
                                <span>Salir</span>
                            </Link>
                        ) : auth.isRepairTech ? (
                            <Link href={route('repairs.logout')} className={cn(navLinkClasses, 'ml-auto')}>
                                <FaPowerOff aria-hidden="true" />
                                <span>Salir</span>
                            </Link>
                        ) : (
                            <Link href={route('repairs.workbench')} className={cn(navLinkClasses, 'ml-auto')}>
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
