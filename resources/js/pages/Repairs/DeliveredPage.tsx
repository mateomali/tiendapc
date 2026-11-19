import { useForm } from '@inertiajs/react';
import { Fragment, useState } from 'react';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass, repairDeliveredTableGridClass } from '../../components/RepairTicketPanel';
import { RepairLayout } from '../../layouts/RepairLayout';
import { groupTicketsByDate, type TicketDateGroup } from '../../repairDateGroups';
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
            onFinish: () => form.transform((data) => data),
        });
    };
    const paginationBlock = (
        <div className={ui.pagination}>
            <span>
                {pagination.total} {pagination.total === 1 ? 'orden' : 'órdenes'} · {visibleRepairs} {visibleRepairs === 1 ? 'trabajo' : 'trabajos'} en esta página · Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className={ui.inlineActions}>
                <button type="button" className={buttonClass('soft', 'sm')} disabled={form.processing || pagination.page <= 1} onClick={() => goToPage(Math.max(1, pagination.page - 1))}>
                    Anterior
                </button>
                <button type="button" className={buttonClass('soft', 'sm')} disabled={form.processing || pagination.page >= pagination.totalPages} onClick={() => goToPage(Math.min(pagination.totalPages, pagination.page + 1))}>
                    Siguiente
                </button>
            </div>
        </div>
    );

    return (
        <RepairLayout title={pageTitle}>
            <section className="flex flex-wrap gap-x-6 gap-y-2 border-b border-slate-200 pb-3 text-sm text-slate-600" aria-label="Resumen de reparaciones">
                <span>Entregadas <strong className="ml-1 text-slate-900">{summary.delivered}</strong></span>
                <span>Archivadas <strong className="ml-1 text-slate-900">{summary.archived}</strong></span>
                <span>Activas <strong className="ml-1 text-slate-900">{summary.active}</strong></span>
                <span>Listas <strong className="ml-1 text-slate-900">{summary.ready}</strong></span>
            </section>

            <section className={ui.repairGridSingle}>
                <form
                    className="grid gap-3 rounded-md border border-slate-200 bg-white p-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        goToPage(1);
                    }}
                >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_210px_auto] xl:items-end [&>*]:min-w-0">
                        <label className="grid gap-1 text-xs font-semibold text-slate-600">Buscar orden o teléfono
                        <input className={cn(ui.repairDenseInput, 'h-10 text-sm')} placeholder="Orden, cliente, modelo o DNI" value={form.data.q} onChange={(event) => form.setData('q', event.target.value)} />
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-slate-600">Estado
                        <select className={cn(ui.repairDenseInput, 'h-10 text-sm')} value={form.data.estado} onChange={(event) => form.setData('estado', event.target.value)}>
                            <option value="">Todos los estados</option>
                            {states.map((state) => (
                                <option key={state} value={state}>
                                    {state}
                                </option>
                            ))}
                        </select>
                        </label>
                        <label className="grid gap-1 text-xs font-semibold text-slate-600">Ordenar por retiro
                        <select className={cn(ui.repairDenseInput, 'h-10 text-sm')} value={form.data.orden} onChange={(event) => form.setData('orden', event.target.value)}>
                            <option value="desc">{isArchived ? 'Archivo' : 'Retiro'} más reciente</option>
                            <option value="asc">{isArchived ? 'Archivo' : 'Retiro'} más antiguo</option>
                        </select>
                        </label>
                        <div className="flex items-center gap-2">
                        <button disabled={form.processing} className={cn(buttonClass('primary', 'default'), 'h-10')} type="submit">
                            Buscar
                        </button>
                        <button type="button" className={cn(buttonClass('soft', 'sm'), 'h-10')} disabled={form.processing} onClick={() => {
                            form.setData({ q: '', estado: '', orden: 'desc', page: 1 });
                            form.transform(() => ({ q: '', estado: '', orden: 'desc', page: 1 }));
                            form.get(route(indexRoute), { preserveState: true, onFinish: () => form.transform((data) => data) });
                        }}>Limpiar</button>
                        </div>
                    </div>
                </form>

                {paginationBlock}

                {isArchived ? (
                    <>
                        <ArchivedSection
                            title="Sin retirar"
                            tickets={archivedPendingPickupTickets}
                            serviceCategories={deliveredCategories}
                            expandedDesktopTickets={expandedDesktopTickets}
                            onToggleDesktopTicket={toggleDesktopTicket}
                            emptyLabel="No hay archivadas sin retirar para los filtros actuales."
                        />
                        <ArchivedSection
                            title="Canceladas"
                            tickets={archivedCancelledTickets}
                            serviceCategories={deliveredCategories}
                            expandedDesktopTickets={expandedDesktopTickets}
                            onToggleDesktopTicket={toggleDesktopTicket}
                            emptyLabel="No hay archivadas canceladas para los filtros actuales."
                        />
                    </>
                ) : (
                    <DeliveredTicketList
                        tickets={tickets}
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
    serviceCategories,
    expandedDesktopTickets,
    onToggleDesktopTicket,
    emptyLabel,
}: {
    title: string;
    tickets: RepairTicketView[];
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
    serviceCategories,
    expandedDesktopTickets,
    onToggleDesktopTicket,
    emptyLabel,
    archived = false,
}: {
    tickets: RepairTicketView[];
    serviceCategories: { value: number; label: string }[];
    expandedDesktopTickets: Record<number, boolean>;
    onToggleDesktopTicket: (ticketId: number) => void;
    emptyLabel: string;
    archived?: boolean;
}): JSX.Element {
    const ticketDateGroups = groupTicketsByDate(tickets, (ticket) => ticket.repairs[0]?.fecha_entregado ?? ticket.fecha ?? null);

    return (
        <>
            <div className="hidden overflow-x-auto rounded-md border border-slate-200 bg-white xl:block">
                <div className="w-full min-w-0">
                    <div className={cn('grid w-full items-stretch border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 [&>*]:min-w-0 [&>*]:px-2.5 [&>*]:py-3', archived ? repairDesktopTableGridClass : repairDeliveredTableGridClass)}>
                        <span className="text-center">ID</span>
                        <span>Cliente</span>
                        {archived ? <><span>DNI</span><span>Contacto</span></> : null}
                        <span>Ingreso</span>
                        {archived ? <span className="text-center">Imagen</span> : null}
                        <span>Modelo</span>
                        <span>Falla</span>
                        {archived ? <span>Estimada</span> : null}
                        <span>{archived ? 'Saldo' : 'Pago'}</span>
                        <span className="text-center">{archived ? 'Estado' : 'Retiro'}</span>
                        <span className="text-center">Acciones</span>
                    </div>
                    <div className="grid bg-white">
                        {tickets.length > 0 ? (
                            ticketDateGroups.map((group) => (
                                <Fragment key={`delivered-desktop-group-${group.key}`}>
                                    <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
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
            <div className="grid gap-3 xl:hidden [&>*]:min-w-0">
                {ticketDateGroups.map((group) => (
                    <Fragment key={`delivered-mobile-group-${group.key}`}>
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-1 py-2 text-sm font-semibold text-slate-600">
                            <span>{group.label}</span>
                            <span>
                                {group.repairCount} reparacion{group.repairCount === 1 ? '' : 'es'}
                            </span>
                        </div>
                        {group.tickets.map((ticket) => (
                            <RepairTicketPanel
                                key={ticket.id}
                                ticket={ticket}
                                serviceCategories={serviceCategories}
                                readOnly={!archived}
                                archived={archived}
                            />
                        ))}
                    </Fragment>
                ))}
                {tickets.length === 0 ? <div className="rounded-md border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">{emptyLabel}</div> : null}
            </div>
        </>
    );
}
