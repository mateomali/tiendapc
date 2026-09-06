import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaChartBar, FaPercent, FaSave } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn, formatCurrency } from '../../utils';

type PeriodKey = 'year' | 'quarter' | 'month' | 'all' | 'custom';

interface PreviousTotals {
    billed: number;
    collected: number;
    collectionRate: number;
    realProfit: number;
    margin: number;
    orderCount: number;
}

interface MetricTotals {
    billed: number;
    collected: number;
    collectionRate: number;
    realProfit: number;
    margin: number;
    profitPercentage: number;
    openBalance: number;
    averageTicket: number;
    orderCount: number;
    previous: PreviousTotals | null;
}

interface RankedMetric {
    label: string;
    count: number;
    total?: number;
}

interface MonthlyMetric {
    label: string;
    total: number;
}

interface MetricsPageProps {
    metrics: {
        period: PeriodKey;
        window: { start: string | null; end: string | null };
        totals: MetricTotals;
        counts: {
            active: number;
            delivered: number;
            cancelled: number;
            ready: number;
        };
        topModels: RankedMetric[];
        topWorkTypes: RankedMetric[];
        statusBreakdown: RankedMetric[];
        monthlyBilled: MonthlyMetric[];
        monthlyCollected: MonthlyMetric[];
    };
    actions: {
        saveSettings: string;
    };
}

type ChartMode = 'billing' | 'collection' | 'models' | 'workTypes' | 'states';

interface MetricsSettingsForm {
    profit_percentage: string;
}

const PERIODS: Array<{ key: PeriodKey; label: string }> = [
    { key: 'year', label: 'Año actual' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'month', label: 'Mes' },
    { key: 'all', label: 'Todo' },
];

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDay(value: string): string {
    const [year, month, day] = value.split('-').map(Number);

    return `${day} ${MONTHS[month - 1]} ${year}`;
}

function deltaText(current: number, previous: number | null | undefined): string | null {
    if (previous === null || previous === undefined || previous === 0) {
        return null;
    }

    const delta = ((current - previous) / previous) * 100;
    const sign = delta > 0 ? '+' : '';

    return `${sign}${delta.toFixed(1)}%`;
}

export default function MetricsPage({ metrics, actions }: MetricsPageProps): JSX.Element {
    const [chartMode, setChartMode] = useState<ChartMode>('billing');
    const [desde, setDesde] = useState(metrics.window.start ?? '');
    const [hasta, setHasta] = useState(metrics.window.end ?? '');
    const settingsForm = useForm<MetricsSettingsForm>({
        profit_percentage: String(metrics.totals.profitPercentage ?? 20),
    });
    const profitPercentage = Number.parseFloat(settingsForm.data.profit_percentage || '0');
    const normalizedProfitPercentage = Number.isFinite(profitPercentage) ? Math.min(1000, Math.max(0, profitPercentage)) : 0;
    const realProfitSharePercent = normalizedProfitPercentage > 0 ? (normalizedProfitPercentage / (100 + normalizedProfitPercentage)) * 100 : 0;

    const effectiveProfitShare = metrics.totals.billed > 0
        ? metrics.totals.realProfit / metrics.totals.billed
        : 0;
    const windowLabel = metrics.window.start && metrics.window.end
        ? `${formatDay(metrics.window.start)} – ${formatDay(metrics.window.end)}`
        : 'Todo el historial';

    useEffect(() => {
        setDesde(metrics.window.start ?? '');
        setHasta(metrics.window.end ?? '');
    }, [metrics.window.start, metrics.window.end]);

    const chartButtons: Array<{ key: ChartMode; label: string }> = [
        { key: 'billing', label: 'Ingresos' },
        { key: 'collection', label: 'Cobrado' },
        { key: 'models', label: 'Modelos' },
        { key: 'workTypes', label: 'Trabajos' },
        { key: 'states', label: 'Estados' },
    ];

    const changePeriod = (period: PeriodKey): void => {
        router.get(
            route('repairs.metrics', period === 'year' ? {} : { periodo: period }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const changeCustomRange = (): void => {
        router.get(
            route('repairs.metrics', { periodo: 'custom', desde: desde || undefined, hasta: hasta || undefined }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const saveSettings = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        settingsForm.post(actions.saveSettings, { preserveScroll: true });
    };

    const billedDelta = deltaText(metrics.totals.billed, metrics.totals.previous?.billed as number | null);
    const collectedDelta = deltaText(metrics.totals.collected, metrics.totals.previous?.collected as number | null);
    const profitDelta = deltaText(metrics.totals.realProfit, metrics.totals.previous?.realProfit as number | null);
    const previousLabel = metrics.totals.previous ? 'vs. período anterior' : null;

    return (
        <RepairLayout title="Métricas">
            <div className="grid gap-4">
                <header className="flex flex-col gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl font-black text-[#0f172a]">Métricas de reparaciones</h1>
                        <p className="mt-1 text-sm font-semibold text-[#64748b]">Ingresos, cobro real y ganancia del taller.</p>
                    </div>
                    <form onSubmit={saveSettings} className="grid w-full gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3 sm:grid-cols-[10rem_auto] sm:items-end md:w-auto">
                        <label className="grid gap-1 text-xs font-black text-[#334155]">
                            Margen sobre costo (%)
                            <span className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    step="0.01"
                                    className={ui.repairDenseInput}
                                    value={settingsForm.data.profit_percentage}
                                    onChange={(event) => settingsForm.setData('profit_percentage', event.target.value)}
                                    required
                                />
                                <FaPercent className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
                            </span>
                        </label>
                        <button type="submit" className={buttonClass('primary', 'sm')} disabled={settingsForm.processing}>
                            <FaSave aria-hidden="true" />
                            Guardar
                        </button>
                        <p className="text-xs font-semibold text-[#64748b] sm:col-span-2">
                            Sobre el costo: {normalizedProfitPercentage}% · Ganancia real: {realProfitSharePercent.toFixed(1)}% · Costo/gastos: {Math.max(0, 100 - realProfitSharePercent).toFixed(1)}%
                        </p>
                    </form>
                </header>

                <div className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wide text-[#64748b]">Período</span>
                        {PERIODS.map((period) => (
                            <button
                                key={period.key}
                                type="button"
                                onClick={() => changePeriod(period.key)}
                                disabled={period.key === metrics.period}
                                className={period.key === metrics.period
                                    ? 'inline-flex min-h-9 items-center rounded-md border border-[#0f172a] bg-[#0f172a] px-3 py-1.5 text-sm font-black text-white'
                                    : 'inline-flex min-h-9 items-center rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-bold text-[#334155] hover:border-[#94a3b8]'}
                            >
                                {period.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => changeCustomRange()}
                            className={metrics.period === 'custom'
                                ? 'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#0f172a] bg-[#0f172a] px-3 py-1.5 text-sm font-black text-white'
                                : 'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-bold text-[#334155] hover:border-[#94a3b8]'}
                        >
                            <FaCalendarAlt aria-hidden="true" />
                            Rango
                        </button>
                    </div>
                    {metrics.period === 'custom' ? (
                        <div className="flex flex-wrap items-end gap-2">
                            <label className="grid gap-1 text-xs font-black text-[#334155]">
                                Desde
                                <input
                                    type="date"
                                    value={desde}
                                    onChange={(event) => setDesde(event.target.value)}
                                    className={ui.repairDenseInput}
                                />
                            </label>
                            <label className="grid gap-1 text-xs font-black text-[#334155]">
                                Hasta
                                <input
                                    type="date"
                                    value={hasta}
                                    onChange={(event) => setHasta(event.target.value)}
                                    className={ui.repairDenseInput}
                                />
                            </label>
                            <button type="button" className={buttonClass('primary', 'sm')} onClick={changeCustomRange}>Aplicar</button>
                        </div>
                    ) : null}
                    <span className="text-sm font-semibold text-[#64748b]">{windowLabel}</span>
                </div>

                <PeriodSummary
                    billed={metrics.totals.billed}
                    billedDelta={billedDelta}
                    realProfit={metrics.totals.realProfit}
                    profitDelta={profitDelta}
                    collected={metrics.totals.collected}
                    collectedDelta={collectedDelta}
                    collectionRate={metrics.totals.collectionRate}
                    previousLabel={previousLabel}
                />

                <ActivitySummary
                    active={metrics.counts.active}
                    ready={metrics.counts.ready}
                    delivered={metrics.counts.delivered}
                    cancelled={metrics.counts.cancelled}
                    openBalance={metrics.totals.openBalance}
                    averageTicket={metrics.totals.averageTicket}
                />

                <section className="grid gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2">
                        {chartButtons.map((button) => (
                            <button
                                key={button.key}
                                type="button"
                                className={chartMode === button.key
                                    ? 'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#0f172a] bg-[#0f172a] px-3 py-1.5 text-sm font-black text-white'
                                    : 'inline-flex min-h-9 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-sm font-black text-[#334155] hover:border-[#94a3b8]'}
                                onClick={() => setChartMode(button.key)}
                            >
                                <FaChartBar aria-hidden="true" />
                                {button.label}
                            </button>
                        ))}
                    </div>

                    <ChartPanel
                        mode={chartMode}
                        monthlyBilled={metrics.monthlyBilled}
                        monthlyCollected={metrics.monthlyCollected}
                        profitShare={effectiveProfitShare}
                        topModels={metrics.topModels}
                        topWorkTypes={metrics.topWorkTypes}
                        statusBreakdown={metrics.statusBreakdown}
                        billed={metrics.totals.billed}
                        orderCount={metrics.totals.orderCount}
                    />
                </section>

                <div className="grid gap-4 xl:grid-cols-2">
                    <RankedCard title="Modelos más pedidos" items={metrics.topModels} billed={metrics.totals.billed} orderCount={metrics.totals.orderCount} />
                    <RankedCard title="Tipos de trabajo" items={metrics.topWorkTypes} billed={metrics.totals.billed} orderCount={metrics.totals.orderCount} />
                </div>
            </div>
        </RepairLayout>
    );
}

function PeriodSummary({
    billed,
    billedDelta,
    realProfit,
    profitDelta,
    collected,
    collectedDelta,
    collectionRate,
    previousLabel,
}: {
    billed: number;
    billedDelta: string | null;
    realProfit: number;
    profitDelta: string | null;
    collected: number;
    collectedDelta: string | null;
    collectionRate: number;
    previousLabel: string | null;
}): JSX.Element {
    return (
        <section className="rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
            <div className="grid gap-px overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#e2e8f0] sm:grid-cols-2 lg:grid-cols-4">
                <StatBlock label="Ingresos" value={formatCurrency(billed)} delta={billedDelta} previousLabel={previousLabel} accent />
                <StatBlock label="Ganancia real" value={formatCurrency(realProfit)} delta={profitDelta} previousLabel={previousLabel} />
                <StatBlock label="Cobrado" value={formatCurrency(collected)} delta={collectedDelta} previousLabel={previousLabel} />
                <StatBlock label="Cobro del período" value={`${collectionRate.toFixed(1)}%`} />
            </div>
            <p className="mt-3 text-xs font-semibold text-[#64748b]">
                {previousLabel ? `${previousLabel}: ${billedDelta ?? 'sin datos'}` : 'Sin comparación con el período anterior (ver todo el historial).'}
            </p>
        </section>
    );
}

function StatBlock({ label, value, delta, previousLabel, accent = false }: { label: string; value: string; delta?: string | null; previousLabel?: string | null; accent?: boolean }): JSX.Element {
    return (
        <div className="bg-[#f8fafc] px-4 py-3">
            <span className="text-xs font-bold text-[#64748b]">{label}</span>
            <strong className={cn('mt-1 block text-lg font-black text-[#0f172a]', accent && 'text-[#1d4ed8]')}>{value}</strong>
            {delta && previousLabel ? (
                <span className="mt-1 block text-xs font-bold text-[#475569]">{delta}</span>
            ) : null}
        </div>
    );
}

function ActivitySummary({
    active,
    ready,
    delivered,
    cancelled,
    openBalance,
    averageTicket,
}: {
    active: number;
    ready: number;
    delivered: number;
    cancelled: number;
    openBalance: number;
    averageTicket: number;
}): JSX.Element {
    const items: Array<{ label: string; value: string; strong?: boolean }> = [
        { label: 'Órdenes activas', value: String(active) },
        { label: 'Listas para retirar', value: String(ready) },
        { label: 'Entregadas', value: String(delivered) },
        { label: 'Canceladas', value: String(cancelled) },
        { label: 'Por cobrar (listas)', value: formatCurrency(openBalance), strong: true },
        { label: 'Ticket promedio', value: formatCurrency(averageTicket), strong: true },
    ];

    return (
        <section className="grid gap-px overflow-hidden rounded-lg border border-[#e2e8f0] bg-[#e2e8f0] sm:grid-cols-3">
            {items.map((item) => (
                <div key={item.label} className="bg-[#f8fafc] px-4 py-3">
                    <span className="text-xs font-bold text-[#64748b]">{item.label}</span>
                    <strong className={cn('mt-1 block text-lg font-black text-[#0f172a]', item.strong && 'text-[#1d4ed8]')}>{item.value}</strong>
                </div>
            ))}
        </section>
    );
}

function ChartPanel({
    mode,
    monthlyBilled,
    monthlyCollected,
    profitShare,
    topModels,
    topWorkTypes,
    statusBreakdown,
    billed,
    orderCount,
}: {
    mode: ChartMode;
    monthlyBilled: MonthlyMetric[];
    monthlyCollected: MonthlyMetric[];
    profitShare: number;
    topModels: RankedMetric[];
    topWorkTypes: RankedMetric[];
    statusBreakdown: RankedMetric[];
    billed: number;
    orderCount: number;
}): JSX.Element {
    if (mode === 'billing') {
        return <MonthlyBillingChart items={monthlyBilled} profitShare={profitShare} />;
    }

    if (mode === 'collection') {
        return <MonthlyCollectionChart billed={monthlyBilled} collected={monthlyCollected} />;
    }

    if (mode === 'models') {
        return <RankedChart title="Modelos más pedidos" items={topModels} billed={billed} orderCount={orderCount} />;
    }

    if (mode === 'workTypes') {
        return <RankedChart title="Tipos de trabajo" items={topWorkTypes} billed={billed} orderCount={orderCount} />;
    }

    return <RankedChart title="Estados" items={statusBreakdown} billed={billed} orderCount={orderCount} showRevenue={false} />;
}

function MonthlyBillingChart({ items, profitShare }: { items: MonthlyMetric[]; profitShare: number }): JSX.Element {
    const maxTotal = Math.max(...items.map((item) => item.total), 1);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-[#0f172a]">Ingresos por mes</h2>
                <div className="flex flex-wrap gap-3 text-xs font-bold text-[#64748b]">
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />Ganancia</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#cbd5e1]" />Costo / gastos</span>
                </div>
            </div>

            <div className="flex items-end gap-1.5" style={{ height: '160px' }}>
                {items.map((item) => {
                    const barPx = Math.max(2, (item.total / maxTotal) * 160);
                    const profitPx = barPx * profitShare;

                    return (
                        <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                            <div
                                className="flex w-full max-w-[1.75rem] flex-col-reverse justify-start overflow-hidden rounded-t-sm bg-[#cbd5e1]"
                                style={{ height: `${barPx}px` }}
                                title={`${item.label}: ${formatCurrency(item.total)} · Ganancia ${formatCurrency(item.total * profitShare)}`}
                            >
                                <div className="w-full bg-[#2563eb]" style={{ height: `${profitPx}px` }} />
                            </div>
                            <span className="text-[0.68rem] font-bold uppercase text-[#64748b]">{item.label}</span>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs font-semibold text-[#64748b]">
                Total del período: {formatCurrency(total)} · Ganancia estimada: {formatCurrency(total * profitShare)}
            </p>
        </section>
    );
}

function MonthlyCollectionChart({ billed, collected }: { billed: MonthlyMetric[]; collected: MonthlyMetric[] }): JSX.Element {
    const rows = useMemo(() => billed.map((item, index) => ({
        label: item.label,
        billed: item.total,
        collected: collected[index]?.total ?? 0,
    })), [billed, collected]);
    const maxTotal = Math.max(...rows.flatMap((row) => [row.billed, row.collected]), 1);
    const totalBilled = rows.reduce((sum, row) => sum + row.billed, 0);
    const totalCollected = rows.reduce((sum, row) => sum + row.collected, 0);

    return (
        <section className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-black text-[#0f172a]">Cobrado vs. facturado por mes</h2>
                <div className="flex flex-wrap gap-3 text-xs font-bold text-[#64748b]">
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />Facturado</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#059669]" />Cobrado</span>
                </div>
            </div>

            <div className="flex items-end gap-1.5" style={{ height: '160px' }}>
                {rows.map((row) => {
                    const billedPx = Math.max(2, (row.billed / maxTotal) * 160);
                    const collectedPx = Math.max(2, (row.collected / maxTotal) * 160);

                    return (
                        <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                            <div className="flex h-full w-full items-end justify-center gap-1" style={{ flexBasis: 0 }}>
                                <div
                                    className="flex w-1/2 max-w-[0.7rem] justify-start overflow-hidden rounded-t-sm bg-[#2563eb]"
                                    style={{ height: `${billedPx}px` }}
                                    title={`${row.label} · Facturado ${formatCurrency(row.billed)}`}
                                />
                                <div
                                    className="flex w-1/2 max-w-[0.7rem] justify-start overflow-hidden rounded-t-sm bg-[#059669]"
                                    style={{ height: `${collectedPx}px` }}
                                    title={`${row.label} · Cobrado ${formatCurrency(row.collected)}`}
                                />
                            </div>
                            <span className="text-[0.68rem] font-bold uppercase text-[#64748b]">{row.label}</span>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs font-semibold text-[#64748b]">
                Facturado: {formatCurrency(totalBilled)} · Cobrado: {formatCurrency(totalCollected)} · {totalBilled > 0 ? `${((totalCollected / totalBilled) * 100).toFixed(1)}% del facturado` : '—'}
            </p>
        </section>
    );
}

function RankedChart({
    title,
    items,
    billed,
    orderCount,
    showRevenue = true,
}: {
    title: string;
    items: RankedMetric[];
    billed: number;
    orderCount: number;
    showRevenue?: boolean;
}): JSX.Element {
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return (
        <section className="grid gap-3">
            <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
            <div className="grid gap-2.5">
                {items.length > 0 ? items.map((item) => {
                    const width = Math.max(2, (item.count / maxCount) * 100);
                    const countShare = orderCount > 0 ? (item.count / orderCount) * 100 : 0;
                    const revenueShare = billed > 0 ? ((item.total ?? 0) / billed) * 100 : 0;

                    return (
                        <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_3.5rem] items-center gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="truncate text-sm font-bold text-[#334155]" title={item.label}>{item.label}</span>
                                    <span className="text-sm font-black text-[#0f172a]">{item.count}</span>
                                </div>
                                <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-sm bg-[#e2e8f0]">
                                    <span className="block h-2 rounded-sm bg-[#2563eb]" style={{ width: `${width}%` }} />
                                </span>
                                {showRevenue ? (
                                    <span className="mt-1 block text-xs font-semibold text-[#64748b]">
                                        {formatCurrency(item.total ?? 0)} · {revenueShare.toFixed(1)}% del ingreso
                                    </span>
                                ) : null}
                            </div>
                            <span className="text-right text-xs font-black text-[#64748b]">{countShare.toFixed(0)}%</span>
                        </div>
                    );
                }) : (
                    <span className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-center text-sm font-semibold text-[#64748b]">Sin datos.</span>
                )}
            </div>
        </section>
    );
}

function RankedCard({ title, items, billed, orderCount }: { title: string; items: RankedMetric[]; billed: number; orderCount: number }): JSX.Element {
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return (
        <section className="grid gap-3 rounded-lg border border-[#e2e8f0] bg-white p-4 shadow-sm">
            <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
            <div className="grid gap-2.5">
                {items.length > 0 ? items.map((item) => {
                    const width = Math.max(2, (item.count / maxCount) * 100);
                    const revenueShare = billed > 0 ? ((item.total ?? 0) / billed) * 100 : 0;

                    return (
                        <div key={item.label} className="grid grid-cols-[1fr_3.5rem] items-center gap-3 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm">
                            <div className="min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <strong className="truncate text-[#0f172a]" title={item.label}>{item.label}</strong>
                                    <span className="text-sm font-black text-[#2563eb]">{item.count}</span>
                                </div>
                                <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-sm bg-[#e2e8f0]">
                                    <span className="block h-1.5 rounded-sm bg-[#2563eb]" style={{ width: `${width}%` }} />
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-[#64748b]">
                                    {formatCurrency(item.total ?? 0)} · {revenueShare.toFixed(1)}% del ingreso
                                </span>
                            </div>
                            <span className="text-right text-xs font-black text-[#64748b]">{revenueShare.toFixed(0)}%</span>
                        </div>
                    );
                }) : (
                    <span className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-center text-sm font-semibold text-[#64748b]">Sin datos.</span>
                )}
            </div>
        </section>
    );
}
