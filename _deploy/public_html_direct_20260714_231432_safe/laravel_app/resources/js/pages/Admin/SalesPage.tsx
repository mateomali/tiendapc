import { Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { formatCurrency } from '../../utils';

interface SaleRow {
    id: number;
    ticket_number: number;
    ticket_number_display: string;
    customer_label: string;
    subtotal: number;
    total: number;
    issued_at: string | null;
    items_count: number;
}

interface SaleMetric {
    total: number;
    tickets: number;
    products: number;
    average_ticket: number;
}

interface SalesPageProps {
    query: string;
    period: PeriodKey;
    customRange: {
        from: string;
        to: string;
    };
    metrics: {
        today: SaleMetric;
        week: SaleMetric;
        month: SaleMetric;
        active: SaleMetric;
    };
    sales: SaleRow[];
    pagination: {
        page: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

type PeriodKey = 'today' | 'week' | 'month' | 'custom' | 'all';

const periodLabels: Record<PeriodKey, string> = {
    today: 'Hoy',
    week: 'Semana',
    month: 'Mes',
    custom: 'Personalizado',
    all: 'Todo',
};

export default function SalesPage({ query, period, customRange, metrics, sales, pagination }: SalesPageProps): JSX.Element {
    const [search, setSearch] = useState(query);
    const [from, setFrom] = useState(customRange.from);
    const [to, setTo] = useState(customRange.to);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setSearch(query);
    }, [query]);

    useEffect(() => {
        if (search === query) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            router.get(
                route('admin.sales.index'),
                { q: search || undefined, ...activePeriodParams() },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onStart: () => setSearching(true),
                    onFinish: () => setSearching(false),
                },
            );
        }, 450);

        return () => window.clearTimeout(timeout);
    }, [search, query, period, customRange.from, customRange.to]);

    function goToPeriod(nextPeriod: PeriodKey): void {
        router.get(
            route('admin.sales.index'),
            {
                q: query || undefined,
                period: nextPeriod === 'all' ? undefined : nextPeriod,
                from: nextPeriod === 'custom' ? from || undefined : undefined,
                to: nextPeriod === 'custom' ? to || undefined : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    function activePeriodParams(): Record<string, string | undefined> {
        return {
            period: period === 'all' ? undefined : period,
            from: period === 'custom' ? customRange.from || undefined : undefined,
            to: period === 'custom' ? customRange.to || undefined : undefined,
        };
    }

    async function deleteSale(sale: SaleRow): Promise<void> {
        if (!window.confirm(`Se eliminará el ticket ${sale.ticket_number_display}.`)) {
            return;
        }

        await window.fetch(route('admin.api.sales.delete', sale.id), {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                Accept: 'application/json',
            },
        });

        router.reload({ only: ['sales', 'pagination'] });
    }

    return (
        <AdminLayout title="Ventas">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Caja y tickets</p>
                    <h2 className={ui.heroTitle}>Ventas registradas</h2>
                    <p className={ui.heroText}>Búsqueda por ticket o cliente, paginación, acceso al comprobante y borrado operativo desde el panel.</p>
                </div>
                <div className={ui.heroActions}>
                    <Link href={route('admin.sales.create')} className={buttonClass('primary')}>
                        Nueva venta
                    </Link>
                </div>
            </section>

            <section className={`${ui.sectionCardTight} grid gap-3`}>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <button type="button" className="rounded-xl border border-sky-100 bg-white p-3 text-left shadow-[0_8px_20px_rgba(18,58,132,0.06)] transition hover:border-brand-300 hover:bg-brand-50/40" onClick={() => goToPeriod('today')}>
                        <span className={ui.eyebrow}>Hoy</span>
                        <strong className="mt-1 block text-2xl font-black text-ink-950">{formatCurrency(metrics.today.total)}</strong>
                        <span className="text-xs font-bold text-ink-700">{metrics.today.tickets} tickets | {metrics.today.products} productos</span>
                    </button>
                    <button type="button" className="rounded-xl border border-sky-100 bg-white p-3 text-left shadow-[0_8px_20px_rgba(18,58,132,0.06)] transition hover:border-brand-300 hover:bg-brand-50/40" onClick={() => goToPeriod('week')}>
                        <span className={ui.eyebrow}>Semana</span>
                        <strong className="mt-1 block text-2xl font-black text-ink-950">{formatCurrency(metrics.week.total)}</strong>
                        <span className="text-xs font-bold text-ink-700">{metrics.week.tickets} tickets | prom. {formatCurrency(metrics.week.average_ticket)}</span>
                    </button>
                    <button type="button" className="rounded-xl border border-sky-100 bg-white p-3 text-left shadow-[0_8px_20px_rgba(18,58,132,0.06)] transition hover:border-brand-300 hover:bg-brand-50/40" onClick={() => goToPeriod('month')}>
                        <span className={ui.eyebrow}>Mes</span>
                        <strong className="mt-1 block text-2xl font-black text-ink-950">{formatCurrency(metrics.month.total)}</strong>
                        <span className="text-xs font-bold text-ink-700">{metrics.month.tickets} tickets | {metrics.month.products} productos</span>
                    </button>
                    <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 shadow-[0_8px_20px_rgba(18,58,132,0.06)]">
                        <span className={ui.eyebrow}>Balance visible</span>
                        <strong className="mt-1 block text-2xl font-black text-ink-950">{formatCurrency(metrics.active.total)}</strong>
                        <span className="text-xs font-bold text-ink-700">{periodLabels[period]} | prom. {formatCurrency(metrics.active.average_ticket)}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {(Object.keys(periodLabels) as PeriodKey[]).map((periodKey) => (
                        <button
                            key={periodKey}
                            type="button"
                            className={period === periodKey ? buttonClass('primary', 'sm') : buttonClass('soft', 'sm')}
                            onClick={() => goToPeriod(periodKey)}
                        >
                            {periodLabels[periodKey]}
                        </button>
                    ))}
                </div>
                <form
                    className="grid gap-2 rounded-xl border border-sky-100 bg-white p-3 sm:grid-cols-[minmax(0,160px)_minmax(0,160px)_auto] sm:items-end"
                    onSubmit={(event) => {
                        event.preventDefault();
                        goToPeriod('custom');
                    }}
                >
                    <label className="grid gap-1">
                        <span className={ui.fieldLabel}>Desde</span>
                        <input className={ui.input} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </label>
                    <label className="grid gap-1">
                        <span className={ui.fieldLabel}>Hasta</span>
                        <input className={ui.input} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </label>
                    <button type="submit" className={buttonClass('primary')}>
                        Ver periodo
                    </button>
                </form>
            </section>

            <section className={ui.sectionCard}>
                <form
                    className={ui.filtersRow}
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            route('admin.sales.index'),
                            { q: search || undefined, ...activePeriodParams() },
                            { preserveState: true, preserveScroll: true },
                        );
                    }}
                >
                    <input className={`${ui.input} lg:max-w-sm`} placeholder="Buscar por ticket o cliente" value={search} onChange={(event) => setSearch(event.target.value)} aria-busy={searching ? 'true' : 'false'} />
                    <button className={buttonClass('primary')} disabled={searching}>
                        {searching ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>
            </section>

            <section className={ui.sectionCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Histórico</p>
                        <h3 className={ui.cardTitle}>{pagination.total} ventas encontradas</h3>
                    </div>
                    <div className={ui.mediaActions}>
                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => router.get(route('admin.sales.index'), { q: query || undefined, ...activePeriodParams(), page: Math.max(1, pagination.page - 1) })} disabled={pagination.page <= 1}>
                            Anterior
                        </button>
                        <span className={ui.inlineCaption}>
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => router.get(route('admin.sales.index'), { q: query || undefined, ...activePeriodParams(), page: pagination.page + 1 })} disabled={pagination.page >= pagination.totalPages}>
                            Siguiente
                        </button>
                    </div>
                </div>
                <div className="grid gap-2 md:hidden">
                    {sales.map((sale) => (
                        <article key={sale.id} className="grid gap-3 rounded-xl border border-sky-100 bg-white/95 p-3 shadow-[0_8px_18px_rgba(18,58,132,0.07)]">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[0.62rem] font-black uppercase tracking-[0.16em] text-brand-700/70">Ticket</p>
                                    <h4 className="truncate text-lg font-black text-ink-950">#{sale.ticket_number_display}</h4>
                                </div>
                                <strong className="shrink-0 rounded-lg border border-brand-100 bg-brand-50 px-2.5 py-1 text-sm font-black text-brand-800">{formatCurrency(sale.total)}</strong>
                            </div>
                            <dl className="grid grid-cols-2 gap-2 text-sm">
                                <div className="rounded-lg bg-sky-50/70 p-2">
                                    <dt className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-brand-700/65">Cliente</dt>
                                    <dd className="mt-1 break-words font-bold text-ink-900">{sale.customer_label}</dd>
                                </div>
                                <div className="rounded-lg bg-sky-50/70 p-2">
                                    <dt className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-brand-700/65">Fecha</dt>
                                    <dd className="mt-1 font-bold text-ink-900">{sale.issued_at ?? 'Sin fecha'}</dd>
                                </div>
                                <div className="rounded-lg bg-sky-50/70 p-2">
                                    <dt className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-brand-700/65">Items</dt>
                                    <dd className="mt-1 font-bold text-ink-900">{sale.items_count}</dd>
                                </div>
                                <div className="rounded-lg bg-sky-50/70 p-2">
                                    <dt className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-brand-700/65">Total</dt>
                                    <dd className="mt-1 font-bold text-ink-900">{formatCurrency(sale.total)}</dd>
                                </div>
                            </dl>
                            <div className="grid grid-cols-2 gap-2">
                                <Link href={route('admin.sales.ticket', sale.id)} className={buttonClass('soft', 'sm', 'min-h-10')}>
                                    Ticket
                                </Link>
                                <button type="button" className={buttonClass('danger', 'sm', 'min-h-10')} onClick={() => void deleteSale(sale)}>
                                    Eliminar
                                </button>
                            </div>
                        </article>
                    ))}
                    {sales.length === 0 ? (
                        <article className={ui.emptyCard}>
                            <h3 className={ui.emptyTitle}>No hay ventas</h3>
                            <p className={ui.emptyText}>No hay ventas para la búsqueda actual.</p>
                        </article>
                    ) : null}
                </div>
                <div className={`${ui.tableWrap} hidden md:block`}>
                    <table className={ui.table}>
                        <thead>
                            <tr>
                                <th className={ui.tableHeadCell}>Ticket</th>
                                <th className={ui.tableHeadCell}>Cliente</th>
                                <th className={ui.tableHeadCell}>Fecha</th>
                                <th className={ui.tableHeadCell}>Items</th>
                                <th className={ui.tableHeadCell}>Total</th>
                                <th className={ui.tableHeadCell}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.map((sale) => (
                                <tr key={sale.id}>
                                    <td className={ui.tableCell}>
                                        <strong>#{sale.ticket_number_display}</strong>
                                    </td>
                                    <td className={ui.tableCell}>{sale.customer_label}</td>
                                    <td className={ui.tableCell}>{sale.issued_at ?? 'Sin fecha'}</td>
                                    <td className={ui.tableCell}>{sale.items_count}</td>
                                    <td className={ui.tableCell}>
                                        <strong>{formatCurrency(sale.total)}</strong>
                                    </td>
                                    <td className={ui.tableCell}>
                                        <div className={ui.inlineActions}>
                                            <Link href={route('admin.sales.ticket', sale.id)} className={buttonClass('soft', 'sm')}>
                                                Ticket
                                            </Link>
                                            <button
                                                type="button"
                                                className={buttonClass('danger', 'sm')}
                                                onClick={() => void deleteSale(sale)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={ui.tableEmptyCell}>No hay ventas para la búsqueda actual.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}
