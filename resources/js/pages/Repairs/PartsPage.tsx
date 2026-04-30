import { Link, router } from '@inertiajs/react';
import { FaTimes, FaTools } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface PartRow {
    registro_id: number;
    tipo_repuesto: string;
    repuesto: string;
    pedido: string;
    cliente: string;
    fecha?: string | null;
    ticket_url: string;
    remove_url: string;
}

interface PartsPageProps {
    period: 'week' | 'month' | 'all';
    rows: PartRow[];
    filters: {
        week: string;
        month: string;
        all: string;
    };
}

const periodLabels = {
    week: 'Semana',
    month: 'Mes',
    all: 'Todos',
} as const;

export default function PartsPage({ period, rows, filters }: PartsPageProps): JSX.Element {
    const removeRow = (row: PartRow): void => {
        router.post(row.remove_url, {}, { preserveScroll: true });
    };

    return (
        <RepairLayout title="Repuestos">
            <section className="overflow-hidden rounded-[18px] border border-[#bfdbfe] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
                <div className="grid gap-3 border-b border-[#dbeafe] bg-[linear-gradient(135deg,#173b7d,#2563eb)] px-4 py-3 text-white md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                        <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-blue-100">Pedidos de repuestos</p>
                        <h1 className="flex items-center gap-2 text-xl font-black md:text-2xl">
                            <FaTools aria-hidden="true" />
                            Repuestos pendientes
                        </h1>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {(['week', 'month', 'all'] as const).map((key) => (
                            <Link
                                key={key}
                                href={filters[key]}
                                className={cn(
                                    buttonClass('soft', 'sm'),
                                    period === key && 'border-white bg-white text-[#17408b]',
                                )}
                            >
                                {periodLabels[key]}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-10 items-center overflow-hidden border-b border-[#dbeafe] bg-[#eff6ff] text-sm font-black text-[#1d4ed8]">
                    <div className="animate-[marquee_28s_linear_infinite] whitespace-nowrap px-4">
                        {rows.length} repuesto{rows.length === 1 ? '' : 's'} en filtro {periodLabels[period].toLowerCase()} - pedidos cargados desde ingreso, editar o agregar reparacion.
                    </div>
                </div>

                <div className="grid gap-2 p-3">
                    <div className="hidden grid-cols-[1fr_1.4fr_1fr_2rem] gap-2 rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white md:grid">
                        <span>Tipo de repuesto</span>
                        <span>Repuesto</span>
                        <span>Pedido</span>
                        <span />
                    </div>

                    {rows.map((row) => (
                        <article key={row.registro_id} className="grid gap-2 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 shadow-sm md:grid-cols-[1fr_1.4fr_1fr_2rem] md:items-center">
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Tipo de repuesto</span>
                                <strong className="text-sm text-[#0f172a]">{row.tipo_repuesto}</strong>
                            </div>
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Repuesto</span>
                                <span className="text-sm font-bold text-[#334155]">{row.repuesto}</span>
                            </div>
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Pedido</span>
                                <Link href={row.ticket_url} className="text-sm font-black text-[#1d4ed8] underline-offset-2 hover:underline">
                                    {row.pedido}
                                </Link>
                                <span className="text-xs font-semibold text-slate-500">{row.cliente}{row.fecha ? ` - ${row.fecha}` : ''}</span>
                            </div>
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffe4e6] text-[#be123c] shadow-sm md:justify-self-end" onClick={() => removeRow(row)} title="Quitar de la lista">
                                <FaTimes aria-hidden="true" />
                            </button>
                        </article>
                    ))}

                    {rows.length === 0 ? (
                        <div className={ui.repairCard}>
                            <h2 className={ui.cardTitle}>No hay repuestos pedidos para este filtro.</h2>
                            <p className={ui.inlineCaption}>Los pedidos aparecen cuando se marca la tilde Mandar a pedidos en ingreso, editar o agregar reparacion.</p>
                        </div>
                    ) : null}
                </div>
            </section>
        </RepairLayout>
    );
}
