import { Link } from '@inertiajs/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { formatCurrency } from '../../utils';

interface DashboardPageProps {
    stats: Record<string, number>;
    recentSales: Array<{
        id: number;
        ticket_number_display: string;
        customer_label: string;
        total: number;
        issued_at: string;
    }>;
    contact: {
        whatsapp_number?: string | null;
    };
    urls: Record<string, string>;
}

const statLabels: Record<string, string> = {
    products: 'Productos',
    categories: 'Categorias',
    sales: 'Ventas',
    repair_active: 'Reparaciones activas',
    media: 'Biblioteca media',
    announcements: 'Anuncios',
    services: 'Servicios',
    backups: 'Backups',
};

export default function DashboardPage({ stats, recentSales, contact, urls }: DashboardPageProps): JSX.Element {
    return (
        <AdminLayout title="Dashboard">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Vista general</p>
                    <h2 className={ui.heroTitle}>Centro de operaciones del negocio</h2>
                    <p className={ui.heroText}>
                        El tablero vuelve a concentrar catalogo, ventas, configuracion, media y reparaciones con accesos
                        directos a los subflujos criticos del legacy.
                    </p>
                </div>
                <div className={ui.heroActions}>
                    <Link href={urls.products} className={buttonClass('primary')}>
                        Ver catalogo admin
                    </Link>
                    <Link href={urls.repairs} className={buttonClass('soft')}>
                        Ir a reparaciones
                    </Link>
                </div>
            </section>

            <section className={ui.statsGrid}>
                {Object.entries(stats).map(([key, value]) => (
                    <article key={key} className={ui.statCard}>
                        <p className={ui.statLabel}>{statLabels[key] ?? key}</p>
                        <p className={ui.statValue}>{value}</p>
                    </article>
                ))}
            </section>

            <section className={ui.dashboardGrid}>
                <article className={ui.sectionCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Atajos</p>
                            <h3 className={ui.cardTitle}>Accesos frecuentes</h3>
                        </div>
                    </div>
                    <div className={ui.shortcutsGrid}>
                        <Link href={urls.products} className={ui.shortcut}>
                            <strong>Productos</strong>
                            <span className={ui.inlineCaption}>Tabla general del catalogo.</span>
                        </Link>
                        <Link href={urls.missingImages} className={ui.shortcut}>
                            <strong>Imagenes faltantes</strong>
                            <span className={ui.inlineCaption}>Correccion rapida de fichas sin foto.</span>
                        </Link>
                        <Link href={urls.missingSku} className={ui.shortcut}>
                            <strong>SKUs faltantes</strong>
                            <span className={ui.inlineCaption}>Completar identificadores pendientes.</span>
                        </Link>
                        <Link href={urls.categories} className={ui.shortcut}>
                            <strong>Categorias</strong>
                            <span className={ui.inlineCaption}>Orden, grupos, visibilidad y merge.</span>
                        </Link>
                        <Link href={urls.sales} className={ui.shortcut}>
                            <strong>Ventas</strong>
                            <span className={ui.inlineCaption}>Tickets, caja y alta rapida.</span>
                        </Link>
                        <Link href={urls.media} className={ui.shortcut}>
                            <strong>Media</strong>
                            <span className={ui.inlineCaption}>Biblioteca de imagenes y URLs.</span>
                        </Link>
                        <Link href={urls.announcements} className={ui.shortcut}>
                            <strong>Anuncios</strong>
                            <span className={ui.inlineCaption}>Barra promocional y programacion.</span>
                        </Link>
                        <Link href={urls.services} className={ui.shortcut}>
                            <strong>Servicios</strong>
                            <span className={ui.inlineCaption}>Landing y bloques tecnicos.</span>
                        </Link>
                        <Link href={urls.contact} className={ui.shortcut}>
                            <strong>Contacto</strong>
                            <span className={ui.inlineCaption}>WhatsApp y bloque publico.</span>
                        </Link>
                        <Link href={urls.settings} className={ui.shortcut}>
                            <strong>Configuracion</strong>
                            <span className={ui.inlineCaption}>Footer, rotacion y textos globales.</span>
                        </Link>
                        <Link href={urls.backups} className={ui.shortcut}>
                            <strong>Backups</strong>
                            <span className={ui.inlineCaption}>Crear, subir y restaurar ZIP.</span>
                        </Link>
                    </div>
                </article>

                <article className={ui.sectionCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Caja</p>
                            <h3 className={ui.cardTitle}>Ventas recientes</h3>
                        </div>
                        <Link href={urls.sales} className={buttonClass('soft', 'sm')}>
                            Ver todas
                        </Link>
                    </div>
                    <div className={ui.salesList}>
                        {recentSales.map((sale) => (
                            <div key={sale.id} className={ui.salesListItem}>
                                <div className="grid gap-1">
                                    <strong>Ticket #{sale.ticket_number_display}</strong>
                                    <span className={ui.inlineCaption}>{sale.customer_label}</span>
                                </div>
                                <div className={ui.salesListMeta}>
                                    <strong>{formatCurrency(sale.total)}</strong>
                                    <span>{sale.issued_at}</span>
                                </div>
                            </div>
                        ))}
                        {recentSales.length === 0 ? (
                            <div className={ui.emptyCard}>
                                <h3 className={ui.emptyTitle}>No hay ventas recientes</h3>
                                <p className={ui.emptyText}>La caja todavia no registra tickets en este entorno.</p>
                            </div>
                        ) : null}
                    </div>
                    <div className={ui.mediaActions}>
                        <span className={ui.inlineCaption}>WhatsApp configurado: {contact.whatsapp_number || 'sin definir'}</span>
                    </div>
                </article>
            </section>
        </AdminLayout>
    );
}
