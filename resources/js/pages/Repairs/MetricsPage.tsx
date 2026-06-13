import { useForm } from '@inertiajs/react';
import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';
import { FaChartBar, FaPercent, FaSave } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { formatCurrency } from '../../utils';

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
        totals: {
            yearBilled: number;
            quarterBilled: number;
            monthBilled: number;
            yearPaid: number;
            quarterPaid: number;
            monthPaid: number;
            profitPercentage: number;
            yearRealProfit: number;
            quarterRealProfit: number;
            monthRealProfit: number;
            openBalance: number;
            averageTicket: number;
            collectionRate: number;
        };
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
    };
    actions: {
        saveSettings: string;
    };
}

type ChartMode = 'billing' | 'collection' | 'models' | 'workTypes' | 'states';

interface MetricsSettingsForm {
    profit_percentage: string;
}

export default function MetricsPage({ metrics, actions }: MetricsPageProps): JSX.Element {
    const [chartMode, setChartMode] = useState<ChartMode>('billing');
    const settingsForm = useForm<MetricsSettingsForm>({
        profit_percentage: String(metrics.totals.profitPercentage ?? 20),
    });
    const profitPercentage = Number.parseFloat(settingsForm.data.profit_percentage || '0');
    const normalizedProfitPercentage = Number.isFinite(profitPercentage) ? Math.min(1000, Math.max(0, profitPercentage)) : 0;
    const realProfitShare = normalizedProfitPercentage > 0 ? (normalizedProfitPercentage / (100 + normalizedProfitPercentage)) * 100 : 0;
    const expensePercentage = Math.max(0, 100 - realProfitShare);
    const collectionData = useMemo(() => [
        { label: 'Ano', billed: metrics.totals.yearBilled, paid: metrics.totals.yearPaid },
        { label: 'Trimestre', billed: metrics.totals.quarterBilled, paid: metrics.totals.quarterPaid },
        { label: 'Mes', billed: metrics.totals.monthBilled, paid: metrics.totals.monthPaid },
    ], [metrics.totals.monthBilled, metrics.totals.monthPaid, metrics.totals.quarterBilled, metrics.totals.quarterPaid, metrics.totals.yearBilled, metrics.totals.yearPaid]);

    const chartButtons: Array<{ key: ChartMode; label: string }> = [
        { key: 'billing', label: 'Ganancia' },
        { key: 'collection', label: 'Cobrado' },
        { key: 'models', label: 'Modelos' },
        { key: 'workTypes', label: 'Trabajos' },
        { key: 'states', label: 'Estados' },
    ];

    const saveSettings = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        settingsForm.post(actions.saveSettings, { preserveScroll: true });
    };

    return (
        <RepairLayout title="Metricas">
            <section className="grid gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-[#0f172a]">Metricas de reparaciones</h1>
                        <p className="text-sm font-semibold text-[#64748b]">Ganancias reconocidas, cobros y demanda del taller.</p>
                    </div>
                    <form onSubmit={saveSettings} className="grid gap-1 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-2 sm:grid-cols-[10rem_auto] sm:items-end">
                        <label className="grid gap-1 text-xs font-black text-[#334155]">
                            Ganancia estimada
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
                            Margen sobre costo: {normalizedProfitPercentage}%. Sobre lo cobrado: {realProfitShare.toFixed(1)}% ganancia real, {expensePercentage.toFixed(1)}% costo/gastos.
                        </p>
                    </form>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <MetricBox label="Ganancia este ano" value={formatCurrency(metrics.totals.yearBilled)} />
                    <MetricBox label="Ganancia trimestre" value={formatCurrency(metrics.totals.quarterBilled)} />
                    <MetricBox label="Ganancia mes" value={formatCurrency(metrics.totals.monthBilled)} />
                    <MetricBox label="Ganancia real ano" value={formatCurrency(metrics.totals.yearRealProfit)} />
                    <MetricBox label="Ganancia real trimestre" value={formatCurrency(metrics.totals.quarterRealProfit)} />
                    <MetricBox label="Ganancia real mes" value={formatCurrency(metrics.totals.monthRealProfit)} />
                    <MetricBox label="Cobrado este ano" value={formatCurrency(metrics.totals.yearPaid)} />
                    <MetricBox label="Pendiente de pago listas" value={formatCurrency(metrics.totals.openBalance)} />
                    <MetricBox label="Ticket promedio" value={formatCurrency(metrics.totals.averageTicket)} />
                    <MetricBox label="Ordenes activas" value={String(metrics.counts.active)} />
                    <MetricBox label="Listas para retirar" value={String(metrics.counts.ready)} />
                    <MetricBox label="Cobrado / ganancia" value={`${metrics.totals.collectionRate}%`} />
                </div>

                <div className="flex flex-wrap gap-2 border-y border-[#e2e8f0] py-3">
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

                <ChartPanel mode={chartMode} monthlyBilled={metrics.monthlyBilled} collectionData={collectionData} topModels={metrics.topModels} topWorkTypes={metrics.topWorkTypes} statusBreakdown={metrics.statusBreakdown} />

                <div className="grid gap-4 xl:grid-cols-2">
                    <RankedList title="Modelos mas pedidos" items={metrics.topModels} />
                    <RankedList title="Tipos de trabajo" items={metrics.topWorkTypes} />
                </div>
            </section>
        </RepairLayout>
    );
}

function ChartPanel({
    mode,
    monthlyBilled,
    collectionData,
    topModels,
    topWorkTypes,
    statusBreakdown,
}: {
    mode: ChartMode;
    monthlyBilled: MonthlyMetric[];
    collectionData: Array<{ label: string; billed: number; paid: number }>;
    topModels: RankedMetric[];
    topWorkTypes: RankedMetric[];
    statusBreakdown: RankedMetric[];
}): JSX.Element {
    if (mode === 'billing') {
        return <MonthlyBillingChart items={monthlyBilled} />;
    }

    if (mode === 'collection') {
        return <CollectionChart items={collectionData} />;
    }

    if (mode === 'models') {
        return <PieChart title="Modelos mas pedidos" items={topModels} />;
    }

    if (mode === 'workTypes') {
        return <HorizontalChart title="Tipos de trabajo" items={topWorkTypes} valueType="count" />;
    }

    return <HorizontalChart title="Estados" items={statusBreakdown} valueType="count" showTotal={false} />;
}

function MonthlyBillingChart({ items }: { items: MonthlyMetric[] }): JSX.Element {
    const maxTotal = Math.max(...items.map((item) => item.total), 1);

    return (
        <section className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3">
            <h2 className="text-sm font-black text-[#0f172a]">Ganancia por mes</h2>
            <div className="grid gap-2">
                {items.map((item) => (
                    <div key={item.label} className="grid grid-cols-[3rem_1fr_7rem] items-center gap-2 text-sm">
                        <span className="font-bold uppercase text-[#64748b]">{item.label}</span>
                        <span className="h-4 rounded-sm bg-[#e2e8f0]">
                            <span className="block h-4 rounded-sm bg-[#2563eb]" style={{ width: `${Math.max(2, (item.total / maxTotal) * 100)}%` }} />
                        </span>
                        <strong className="text-right text-[#0f172a]">{formatCurrency(item.total)}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}

function CollectionChart({ items }: { items: Array<{ label: string; billed: number; paid: number }> }): JSX.Element {
    const maxTotal = Math.max(...items.flatMap((item) => [item.billed, item.paid]), 1);

    return (
        <section className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3">
            <h2 className="text-sm font-black text-[#0f172a]">Cobrado vs ganancia</h2>
            <div className="grid gap-3">
                {items.map((item) => (
                    <div key={item.label} className="grid gap-1.5 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <strong className="text-[#0f172a]">{item.label}</strong>
                            <span className="font-bold text-[#64748b]">{formatCurrency(item.paid)} / {formatCurrency(item.billed)}</span>
                        </div>
                        <span className="h-4 rounded-sm bg-[#e2e8f0]">
                            <span className="block h-4 rounded-sm bg-[#2563eb]" style={{ width: `${Math.max(2, (item.billed / maxTotal) * 100)}%` }} />
                        </span>
                        <span className="h-4 rounded-sm bg-[#ecfdf5]">
                            <span className="block h-4 rounded-sm bg-[#059669]" style={{ width: `${Math.max(2, (item.paid / maxTotal) * 100)}%` }} />
                        </span>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-bold text-[#64748b]">
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#2563eb]" />Ganancia</span>
                <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-[#059669]" />Cobrado</span>
            </div>
        </section>
    );
}

const pieColors = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2', '#334155', '#db2777'];

function PieChart({ title, items }: { title: string; items: RankedMetric[] }): JSX.Element {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    let cursor = 0;
    const slices = items.map((item, index) => {
        const start = cursor;
        const end = total > 0 ? cursor + (item.count / total) * 100 : cursor;
        cursor = end;

        return {
            ...item,
            color: pieColors[index % pieColors.length],
            percent: total > 0 ? (item.count / total) * 100 : 0,
            start,
            end,
        };
    });
    const background = slices.length > 0
        ? `conic-gradient(${slices.map((slice) => `${slice.color} ${slice.start}% ${slice.end}%`).join(', ')})`
        : '#e2e8f0';

    return (
        <section className="grid gap-4 rounded-lg border border-[#e2e8f0] p-3">
            <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
            {slices.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-[18rem_1fr] lg:items-center">
                    <div className="grid justify-items-center gap-2">
                        <div
                            className="h-56 w-56 rounded-full border border-[#cbd5e1]"
                            style={{ background } as CSSProperties}
                            role="img"
                            aria-label={`Distribucion de ${title.toLowerCase()}`}
                        />
                        <strong className="text-sm text-[#0f172a]">{total} ordenes</strong>
                    </div>
                    <div className="grid gap-2">
                        {slices.map((slice) => (
                            <div key={slice.label} className="grid grid-cols-[1rem_minmax(0,1fr)_4rem_3rem] items-center gap-2 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm">
                                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: slice.color }} />
                                <strong className="truncate text-[#0f172a]" title={slice.label}>{slice.label}</strong>
                                <span className="text-right font-black text-[#334155]">{slice.count}</span>
                                <span className="text-right font-bold text-[#64748b]">{slice.percent.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <span className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-center text-sm font-semibold text-[#64748b]">Sin datos.</span>
            )}
        </section>
    );
}

function HorizontalChart({ title, items, valueType, showTotal = true }: { title: string; items: RankedMetric[]; valueType: 'count'; showTotal?: boolean }): JSX.Element {
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return (
        <section className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3">
            <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
            <div className="grid gap-2">
                {items.length > 0 ? items.map((item) => (
                    <div key={item.label} className="grid grid-cols-[minmax(5rem,12rem)_1fr_3rem] items-center gap-2 text-sm">
                        <span className="truncate font-bold text-[#334155]" title={item.label}>{item.label}</span>
                        <span className="h-4 rounded-sm bg-[#e2e8f0]">
                            <span className="block h-4 rounded-sm bg-[#2563eb]" style={{ width: `${Math.max(2, (item.count / maxCount) * 100)}%` }} />
                        </span>
                        <strong className="text-right text-[#0f172a]">{valueType === 'count' ? item.count : showTotal ? formatCurrency(item.total ?? 0) : item.count}</strong>
                        {showTotal ? <span className="col-span-3 text-xs font-semibold text-[#64748b]">{formatCurrency(item.total ?? 0)}</span> : null}
                    </div>
                )) : (
                    <span className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-center text-sm font-semibold text-[#64748b]">Sin datos.</span>
                )}
            </div>
        </section>
    );
}

function MetricBox({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <span className="text-xs font-bold text-[#64748b]">{label}</span>
            <strong className="block text-lg font-black text-[#0f172a]">{value}</strong>
        </div>
    );
}

function RankedList({ title, items, showTotal = true }: { title: string; items: RankedMetric[]; showTotal?: boolean }): JSX.Element {
    return (
        <section className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3">
            <h2 className="text-sm font-black text-[#0f172a]">{title}</h2>
            <div className="grid gap-2">
                {items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.label} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm">
                            <div className="min-w-0">
                                <strong className="block truncate text-[#0f172a]">{item.label}</strong>
                                {showTotal ? <span className="text-xs font-semibold text-[#64748b]">{formatCurrency(item.total ?? 0)}</span> : null}
                            </div>
                            <span className="font-black text-[#2563eb]">{item.count}</span>
                        </div>
                    ))
                ) : (
                    <span className="rounded-md border border-dashed border-[#cbd5e1] px-3 py-4 text-center text-sm font-semibold text-[#64748b]">Sin datos.</span>
                )}
            </div>
        </section>
    );
}
