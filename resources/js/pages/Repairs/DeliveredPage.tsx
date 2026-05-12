import { useForm } from '@inertiajs/react';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass } from '../../components/RepairTicketPanel';
import { RepairLayout } from '../../layouts/RepairLayout';
import type { RepairTicketView } from '../../types';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface DeliveredPageProps {
    filters: {
        q?: string;
        estado?: string;
        orden?: string;
        page?: number;
    };
    tickets: RepairTicketView[];
    summary: {
        active: number;
        delivered: number;
        pending: number;
        inRepair: number;
        waitingParts: number;
        ready: number;
    };
    states: string[];
    pagination: {
        page: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

export default function DeliveredPage({ filters, tickets, summary, states, pagination }: DeliveredPageProps): JSX.Element {
    const form = useForm({
        q: filters.q ?? '',
        estado: filters.estado ?? '',
        orden: filters.orden ?? 'desc',
        page: filters.page ?? 1,
    });

    const deliveredCategories = [
        { value: 1, label: 'Celulares' },
        { value: 2, label: 'Consolas' },
        { value: 3, label: 'Accesorios' },
        { value: 4, label: 'Varios' },
    ];
    const visibleRepairs = tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);

    const goToPage = (page: number): void => {
        form.transform((data) => ({
            ...data,
            page,
        }));
        form.get(route('repairs.delivered'), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <RepairLayout title="Entregados">
            <section className={ui.statsGrid}>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Entregadas</p>
                    <p className={ui.statValue}>{summary.delivered}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Activas</p>
                    <p className={ui.statValue}>{summary.active}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Espera repuesto</p>
                    <p className={ui.statValue}>{summary.waitingParts}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Lista</p>
                    <p className={ui.statValue}>{summary.ready}</p>
                </article>
            </section>

            <section className={ui.repairGridSingle}>
                <form
                    className={ui.repairCard}
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.setData('page', 1);
                        form.get(route('repairs.delivered'));
                    }}
                >
                    <div className={ui.repairCardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Archivo</p>
                            <h2 className={ui.cardTitle}>Filtrar entregadas</h2>
                        </div>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-[minmax(320px,1fr)_220px_220px_auto] lg:items-center">
                        <input className={ui.repairDenseInput} placeholder="Buscar por ticket, cliente, modelo, descripcion o DNI" value={form.data.q} onChange={(event) => form.setData('q', event.target.value)} />
                        <select className={ui.repairDenseInput} value={form.data.estado} onChange={(event) => form.setData('estado', event.target.value)}>
                            <option value="">Todos los estados</option>
                            {states.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                        <select className={ui.repairDenseInput} value={form.data.orden} onChange={(event) => form.setData('orden', event.target.value)}>
                            <option value="desc">Mas recientes primero</option>
                            <option value="asc">Mas antiguas primero</option>
                        </select>
                        <button className={buttonClass('primary', 'default', 'lg:min-w-[132px]')} type="submit">
                            Buscar
                        </button>
                    </div>
                </form>

                <div className={ui.pagination}>
                    <span>
                        Mostrando {visibleRepairs} reparacion{visibleRepairs === 1 ? '' : 'es'} en {tickets.length} ticket{tickets.length === 1 ? '' : 's'}. Pagina {pagination.page} de {pagination.totalPages}. Total archivadas: {pagination.total}.
                    </span>
                    <div className={ui.inlineActions}>
                        <button type="button" className={buttonClass('soft', 'sm')} disabled={pagination.page <= 1} onClick={() => goToPage(Math.max(1, pagination.page - 1))}>
                            Anterior
                        </button>
                        <button type="button" className={buttonClass('soft', 'sm')} disabled={pagination.page >= pagination.totalPages} onClick={() => goToPage(Math.min(pagination.totalPages, pagination.page + 1))}>
                            Siguiente
                        </button>
                    </div>
                </div>

                <div className="hidden overflow-x-auto rounded-[16px] border border-[#cbd7e6] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] xl:block">
                    <div className="min-w-[1320px]">
                        <div className={cn('grid min-w-[1320px] items-stretch divide-x divide-emerald-400/60 bg-[linear-gradient(180deg,#059669,#047857)] text-[0.62rem] font-extrabold uppercase tracking-[0.015em] text-white [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2', repairDesktopTableGridClass)}>
                            <span className="text-center">ID</span>
                            <span>Cliente</span>
                            <span>DNI</span>
                            <span>Contacto</span>
                            <span>Ingreso</span>
                            <span className="text-center">Trabajo</span>
                            <span className="text-center">Imagen</span>
                            <span>Modelo</span>
                            <span>Falla</span>
                            <span>Estimada</span>
                            <span>Saldo</span>
                            <span className="text-center">Estado</span>
                            <span className="text-center">Archivo</span>
                        </div>
                        <div className="grid bg-white">
                            {tickets.length > 0 ? (
                                tickets.flatMap((ticket) =>
                                    ticket.repairs.map((repair, repairIndex) => (
                                        <RepairDesktopRow
                                            key={`delivered-desktop-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                                            ticket={ticket}
                                            repair={repair}
                                            serviceCategories={deliveredCategories}
                                            rowIndex={repairIndex}
                                            rowTotal={ticket.repairs.length}
                                            readOnly
                                        />
                                    )),
                                )
                            ) : (
                                <div className="px-4 py-8 text-center text-sm font-bold text-[#64748b]">No hay tickets entregados para los filtros actuales.</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:hidden">
                    {tickets.map((ticket) => (
                        <RepairTicketPanel
                            key={ticket.id}
                            ticket={ticket}
                            states={states}
                            serviceCategories={deliveredCategories}
                            readOnly
                        />
                    ))}
                    {tickets.length === 0 ? <div className="rounded-[22px] border border-white/70 bg-white/90 p-6 text-center font-semibold text-[#475569] shadow-[0_10px_26px_rgba(15,23,42,0.08)]">No hay tickets entregados para los filtros actuales.</div> : null}
                </div>
            </section>
        </RepairLayout>
    );
}
