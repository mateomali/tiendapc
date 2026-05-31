import { RepairLayout } from '../../layouts/RepairLayout';
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
}

export default function MetricsPage({ metrics }: MetricsPageProps): JSX.Element {
    const maxMonthly = Math.max(...metrics.monthlyBilled.map((item) => item.total), 1);

    return (
        <RepairLayout title="Metricas">
            <section className="grid gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-[#0f172a]">Metricas de reparaciones</h1>
                        <p className="text-sm font-semibold text-[#64748b]">Facturacion, cobros y demanda del taller.</p>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                    <MetricBox label="Facturado este ano" value={formatCurrency(metrics.totals.yearBilled)} />
                    <MetricBox label="Facturado trimestre" value={formatCurrency(metrics.totals.quarterBilled)} />
                    <MetricBox label="Facturado mes" value={formatCurrency(metrics.totals.monthBilled)} />
                    <MetricBox label="Cobrado este ano" value={formatCurrency(metrics.totals.yearPaid)} />
                    <MetricBox label="Saldo pendiente abierto" value={formatCurrency(metrics.totals.openBalance)} />
                    <MetricBox label="Ticket promedio" value={formatCurrency(metrics.totals.averageTicket)} />
                    <MetricBox label="Ordenes activas" value={String(metrics.counts.active)} />
                    <MetricBox label="Listas para retirar" value={String(metrics.counts.ready)} />
                    <MetricBox label="Cobrado / facturado" value={`${metrics.totals.collectionRate}%`} />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                    <RankedList title="Modelos mas pedidos" items={metrics.topModels} />
                    <RankedList title="Tipos de trabajo" items={metrics.topWorkTypes} />
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
                    <section className="grid gap-3 rounded-lg border border-[#e2e8f0] p-3">
                        <h2 className="text-sm font-black text-[#0f172a]">Facturado por mes</h2>
                        <div className="grid gap-2">
                            {metrics.monthlyBilled.map((item) => (
                                <div key={item.label} className="grid grid-cols-[3rem_1fr_7rem] items-center gap-2 text-sm">
                                    <span className="font-bold uppercase text-[#64748b]">{item.label}</span>
                                    <span className="h-4 rounded-sm bg-[#e2e8f0]">
                                        <span className="block h-4 rounded-sm bg-[#2563eb]" style={{ width: `${Math.max(2, (item.total / maxMonthly) * 100)}%` }} />
                                    </span>
                                    <strong className="text-right text-[#0f172a]">{formatCurrency(item.total)}</strong>
                                </div>
                            ))}
                        </div>
                    </section>
                    <RankedList title="Estados" items={metrics.statusBreakdown} showTotal={false} />
                </div>
            </section>
        </RepairLayout>
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
