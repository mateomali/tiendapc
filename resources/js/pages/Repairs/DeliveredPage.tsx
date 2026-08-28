import { useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';
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
        archived: number;
        pending: number;
        inRepair: number;
        waitingParts: number;
        ready: number;
    };
    states: string[];
    pageKind?: 'delivered' | 'archived';
    pageTitle?: string;
    indexRoute?: string;
    pagination: {
        page: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
}

interface DeliveredDateGroup {
    key: string;
    label: string;
    count: number;
    repairCount: number;
    tickets: RepairTicketView[];
}

function localDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

const weekdayLabels = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const monthLabels = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
] as const;

function dateGroupLabel(value?: string | null): string {
    if (!value) {
        return 'Sin fecha';
    }

    const key = value.slice(0, 10);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (key === localDateKey(today)) {
        return 'Hoy';
    }

    if (key === localDateKey(yesterday)) {
        return 'Ayer';
    }

    const [year, month, day] = key.split('-');

    if (!year || !month || !day) {
        return 'Sin fecha';
    }

    const parsedYear = Number(year);
    const parsedMonth = Number(month);
    const parsedDay = Number(day);

    if (
        !Number.isInteger(parsedYear) ||
        !Number.isInteger(parsedMonth) ||
        !Number.isInteger(parsedDay) ||
        parsedMonth < 1 ||
        parsedMonth > 12 ||
        parsedDay < 1 ||
        parsedDay > 31
    ) {
        return 'Sin fecha';
    }

    const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

    if (date.getFullYear() !== parsedYear || date.getMonth() !== parsedMonth - 1 || date.getDate() !== parsedDay) {
        return 'Sin fecha';
    }

    return `${weekdayLabels[date.getDay()]} ${parsedDay} de ${monthLabels[parsedMonth - 1]} del ${parsedYear}`;
}

function deliveredGroupDate(ticket: RepairTicketView): string | null {
    return ticket.repairs[0]?.fecha_entregado ?? ticket.fecha ?? null;
}

function groupTicketsByDeliveredDate(tickets: RepairTicketView[]): DeliveredDateGroup[] {
    const groups = new Map<string, DeliveredDateGroup>();

    tickets.forEach((ticket) => {
        const value = deliveredGroupDate(ticket);
        const key = value?.slice(0, 10) || 'sin-fecha';
        const group = groups.get(key);

        if (group) {
            group.tickets.push(ticket);
            group.count += 1;
            group.repairCount += ticket.repairs.length;
            return;
        }

        groups.set(key, {
            key,
            label: dateGroupLabel(value),
            count: 1,
            repairCount: ticket.repairs.length,
            tickets: [ticket],
        });
    });

    return Array.from(groups.values());
}

export default function DeliveredPage({ filters, tickets, summary, states, pagination, pageKind = 'delivered', pageTitle = 'Entregados', indexRoute = 'repairs.delivered' }: DeliveredPageProps): JSX.Element {
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
    const [expandedDesktopTickets, setExpandedDesktopTickets] = useState<Record<number, boolean>>({});
    const visibleRepairs = tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);
    const isArchived = pageKind === 'archived';
    const listLabel = isArchived ? 'archivadas' : 'entregadas';
    const emptyLabel = isArchived ? 'No hay tickets archivados para los filtros actuales.' : 'No hay tickets entregados para los filtros actuales.';
    const archivedCancelledTickets = isArchived ? filterTicketsByRepairState(tickets, true) : [];
    const archivedPendingPickupTickets = isArchived ? filterTicketsByRepairState(tickets, false) : [];

    const toggleDesktopTicket = (ticketId: number): void => {
        setExpandedDesktopTickets((current) => ({
            ...current,
            [ticketId]: !current[ticketId],
        }));
    };

    const goToPage = (page: number): void => {
        form.transform((data) => ({
            ...data,
            page,
        }));
        form.get(route(indexRoute), {
            preserveScroll: true,
            preserveState: true,
        });
    };
    const paginationBlock = (
        <div className={ui.pagination}>
            <span>
                Mostrando {visibleRepairs} reparacion{visibleRepairs === 1 ? '' : 'es'} en {tickets.length} ticket{tickets.length === 1 ? '' : 's'}. Pagina {pagination.page} de {pagination.totalPages}. Total {listLabel}: {pagination.total}.
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
    );

    return (
        <RepairLayout title={pageTitle}>
            <section className={ui.statsGrid}>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Entregadas</p>
                    <p className={ui.statValue}>{summary.delivered}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Archivadas</p>
                    <p className={ui.statValue}>{summary.archived}</p>
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
                        form.get(route(indexRoute));
                    }}
                >
                    <div className={ui.repairCardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Detalle</p>
                            <h2 className={ui.cardTitle}>Filtrar {listLabel}</h2>
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
                            <option value="desc">Detalle: {isArchived ? 'archivo' : 'entrega'} mas reciente</option>
                            <option value="asc">Detalle: {isArchived ? 'archivo' : 'entrega'} mas antigua</option>
                        </select>
                        <button className={buttonClass('primary', 'default', 'lg:min-w-[132px]')} type="submit">
                            Buscar
                        </button>
                    </div>
                </form>

                {paginationBlock}

                {isArchived ? (
                    <>
                        <ArchivedSection
                            title="Sin retirar"
                            tickets={archivedPendingPickupTickets}
                            states={states}
                            serviceCategories={deliveredCategories}
                            expandedDesktopTickets={expandedDesktopTickets}
                            onToggleDesktopTicket={toggleDesktopTicket}
                            emptyLabel="No hay archivadas sin retirar para los filtros actuales."
                        />
                        <ArchivedSection
                            title="Canceladas"
                            tickets={archivedCancelledTickets}
                            states={states}
                            serviceCategories={deliveredCategories}
                            expandedDesktopTickets={expandedDesktopTickets}
                            onToggleDesktopTicket={toggleDesktopTicket}
                            emptyLabel="No hay archivadas canceladas para los filtros actuales."
                        />
                    </>
                ) : (
                    <DeliveredTicketList
                        tickets={tickets}
                        states={states}
                        serviceCategories={deliveredCategories}
                        expandedDesktopTickets={expandedDesktopTickets}
                        onToggleDesktopTicket={toggleDesktopTicket}
                        emptyLabel={emptyLabel}
                    />
                )}
                {paginationBlock}
            </section>
        </RepairLayout>
    );
}

function filterTicketsByRepairState(tickets: RepairTicketView[], cancelled: boolean): RepairTicketView[] {
    return tickets
        .map((ticket) => {
            const repairs = ticket.repairs.filter((repair) => cancelled ? repair.estado === 'CANCELADA' : repair.estado !== 'CANCELADA');

            return {
                ...ticket,
                repairs,
                repairsCount: repairs.length,
                totalMonto: repairs.reduce((total, repair) => total + Number(repair.monto ?? 0), 0),
                totalSenia: repairs.reduce((total, repair) => total + Number(repair.senia ?? 0), 0),
            };
        })
        .filter((ticket) => ticket.repairs.length > 0);
}

function ArchivedSection({
    title,
    tickets,
    states,
    serviceCategories,
    expandedDesktopTickets,
    onToggleDesktopTicket,
    emptyLabel,
}: {
    title: string;
    tickets: RepairTicketView[];
    states: string[];
    serviceCategories: { value: number; label: string }[];
    expandedDesktopTickets: Record<number, boolean>;
    onToggleDesktopTicket: (ticketId: number) => void;
    emptyLabel: string;
}): JSX.Element {
    return (
        <section className="grid gap-3">
            <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-2">
                <h3 className="text-base font-black text-[#0f172a]">{title}</h3>
                <span className="text-sm font-bold text-[#475569]">{tickets.reduce((total, ticket) => total + ticket.repairs.length, 0)}</span>
            </div>
            <DeliveredTicketList
                tickets={tickets}
                states={states}
                serviceCategories={serviceCategories}
                expandedDesktopTickets={expandedDesktopTickets}
                onToggleDesktopTicket={onToggleDesktopTicket}
                emptyLabel={emptyLabel}
                archived
            />
        </section>
    );
}

function DeliveredTicketList({
    tickets,
    states,
    serviceCategories,
    expandedDesktopTickets,
    onToggleDesktopTicket,
    emptyLabel,
    archived = false,
}: {
    tickets: RepairTicketView[];
    states: string[];
    serviceCategories: { value: number; label: string }[];
    expandedDesktopTickets: Record<number, boolean>;
    onToggleDesktopTicket: (ticketId: number) => void;
    emptyLabel: string;
    archived?: boolean;
}): JSX.Element {
    const ticketDateGroups = groupTicketsByDeliveredDate(tickets);

    return (
        <>
            <div className="hidden overflow-x-auto rounded-[16px] border border-[#dbe7f6] bg-white shadow-[0_14px_32px_rgba(15,23,42,0.09)] ring-1 ring-white/70 xl:block">
                <div className="w-full min-w-0">
                    <div className={cn('grid w-full items-stretch divide-x divide-emerald-300/45 bg-[linear-gradient(180deg,#047857,#065f46)] text-[0.62rem] font-extrabold uppercase tracking-[0.015em] text-white [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2', repairDesktopTableGridClass)}>
                        <span className="text-center">ID</span>
                        <span>Cliente</span>
                        <span>DNI</span>
                        <span>Contacto</span>
                        <span>Ingreso</span>
                        <span className="text-center">Imagen</span>
                        <span>Modelo</span>
                        <span>Falla</span>
                        <span>Estimada</span>
                        <span>Saldo</span>
                        <span className="text-center">Estado</span>
                        <span className="text-center">Detalle</span>
                    </div>
                    <div className="grid bg-white">
                        {tickets.length > 0 ? (
                            ticketDateGroups.map((group) => (
                                <Fragment key={`delivered-desktop-group-${group.key}`}>
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-l-4 border-b-[#0f2f63] border-l-[#38bdf8] bg-[#123f91] px-3 py-2 text-xs font-black text-white">
                                        <span>{group.label}</span>
                                        <span>
                                            {group.repairCount} reparacion{group.repairCount === 1 ? '' : 'es'}
                                        </span>
                                    </div>
                                    {group.tickets.flatMap((ticket) => {
                                        const expanded = expandedDesktopTickets[ticket.id] ?? false;
                                        const desktopRepairs = expanded ? ticket.repairs : ticket.repairs.slice(0, 1);

                                        return desktopRepairs.map((repair, repairIndex) => (
                                            <RepairDesktopRow
                                                key={`delivered-desktop-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                                                ticket={ticket}
                                                repair={repair}
                                                serviceCategories={serviceCategories}
                                                rowIndex={repairIndex}
                                                rowTotal={ticket.repairs.length}
                                                desktopGroupExpanded={expanded}
                                                onToggleDesktopGroup={repairIndex === 0 && ticket.repairs.length > 1 ? () => onToggleDesktopTicket(ticket.id) : undefined}
                                                readOnly={!archived}
                                                archived={archived}
                                            />
                                        ));
                                    })}
                                </Fragment>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm font-bold text-[#64748b]">{emptyLabel}</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="grid gap-3 xl:hidden">
                {ticketDateGroups.map((group) => (
                    <Fragment key={`delivered-mobile-group-${group.key}`}>
                        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#123f91] bg-[#123f91] px-3 py-2 text-sm font-black text-white">
                            <span>{group.label}</span>
                            <span>
                                {group.repairCount} reparacion{group.repairCount === 1 ? '' : 'es'}
                            </span>
                        </div>
                        {group.tickets.map((ticket) => (
                            <RepairTicketPanel
                                key={ticket.id}
                                ticket={ticket}
                                states={states}
                                serviceCategories={serviceCategories}
                                readOnly={!archived}
                                archived={archived}
                            />
                        ))}
                    </Fragment>
                ))}
                {tickets.length === 0 ? <div className="rounded-lg border border-white/70 bg-white/90 p-6 text-center font-semibold text-[#475569] shadow-sm">{emptyLabel}</div> : null}
            </div>
        </>
    );
}
