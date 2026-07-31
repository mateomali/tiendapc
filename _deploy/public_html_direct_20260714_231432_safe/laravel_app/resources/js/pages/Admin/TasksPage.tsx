import { Link } from '@inertiajs/react';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass } from '../../components/RepairTicketPanel';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass } from '../../repairUi';
import type { RepairTicketView } from '../../types';
import { cn } from '../../utils';

interface ServiceCategoryOption {
    value: number;
    label: string;
}

interface ServiceTemplateOption {
    value: string;
    label: string;
    description: string;
    repuesto: string;
}

interface RepairPartInventoryOption {
    id: number;
    quantity: number;
    model: string;
    box: string;
}

interface TasksPageProps {
    todayLabel: string;
    items: RepairTicketView[];
    completedItems?: RepairTicketView[];
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    partInventory: RepairPartInventoryOption[];
    urls: {
        consultations: string;
    };
    debugError?: {
        exception: string;
        message: string;
        file: string;
        line: number;
        database: string;
        checks: Record<string, unknown>;
    } | null;
}

const desktopHeaderLabels = ['ID', 'Cliente', 'DNI', 'Contacto', 'Ingreso', 'Imagen', 'Modelo', 'Falla', 'Estimada', 'Saldo', 'Estado', 'Acciones'];

function repairCount(tickets: RepairTicketView[]): number {
    return tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);
}

export default function TasksPage({
    todayLabel,
    items,
    completedItems = [],
    states,
    serviceCategories,
    serviceTemplates,
    partInventory,
    urls,
    debugError = null,
}: TasksPageProps): JSX.Element {
    const totalItems = repairCount(items) + repairCount(completedItems);

    const renderDesktopRows = (tickets: RepairTicketView[]): JSX.Element[] => tickets.flatMap((ticket) => (
        ticket.repairs.map((repair, repairIndex) => (
            <RepairDesktopRow
                key={`task-desktop-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                ticket={ticket}
                repair={repair}
                serviceCategories={serviceCategories}
                serviceTemplates={serviceTemplates}
                partInventory={partInventory}
                rowIndex={repairIndex}
                rowTotal={ticket.repairs.length}
                desktopGroupExpanded
            />
        ))
    ));

    const renderMobileRows = (tickets: RepairTicketView[]): JSX.Element[] => tickets.map((ticket) => (
        <RepairTicketPanel
            key={`task-mobile-${ticket.id}`}
            ticket={ticket}
            states={states}
            serviceCategories={serviceCategories}
            serviceTemplates={serviceTemplates}
            partInventory={partInventory}
            allowAddRepair
        />
    ));

    const renderSection = (title: string, tickets: RepairTicketView[], emptyText: string, tone: 'pending' | 'done'): JSX.Element => {
        const count = repairCount(tickets);

        return (
            <section className={cn('grid gap-2 rounded-lg border p-2', tone === 'pending' ? 'border-[#cbd5e1] bg-[#f8fafc]' : 'border-[#cbd5e1] bg-white')}>
                <div className="flex items-center justify-between gap-2 border-b border-[#cbd5e1] px-1 pb-2 text-sm font-black text-[#0f172a]">
                    <span>{title}</span>
                    <span className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-bold text-[#475569]">{count}</span>
                </div>

                <div className="hidden w-full overflow-x-auto rounded-lg border border-[#cbd5e1] bg-white xl:block">
                    <div className="w-full min-w-0">
                        <div className={cn('grid w-full items-stretch divide-x divide-[#cbd5e1] border-b border-[#cbd5e1] bg-[#eef4fb] text-[0.68rem] font-black text-[#475569] [&>*]:min-w-0 [&>*]:px-1.5 [&>*]:py-2', repairDesktopTableGridClass)}>
                            {desktopHeaderLabels.map((label) => (
                                <span key={label} className="grid place-items-center text-center">{label}</span>
                            ))}
                        </div>
                        <div className="grid bg-white">
                            {tickets.length > 0 ? renderDesktopRows(tickets) : (
                                <div className="px-4 py-6 text-center text-sm font-bold text-[#64748b]">{emptyText}</div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 xl:hidden">
                    {tickets.length > 0 ? renderMobileRows(tickets) : (
                        <div className="rounded-lg border border-dashed border-[#94a3b8] bg-white p-5 text-center text-sm font-semibold text-[#475569]">
                            {emptyText}
                        </div>
                    )}
                </div>
            </section>
        );
    };

    return (
        <RepairLayout title="Lista de tareas">
            {debugError ? (
                <section className="grid gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-left shadow-sm">
                    <div>
                        <h1 className="text-lg font-black text-[#991b1b]">Error al cargar tareas</h1>
                        <p className="mt-1 text-sm font-semibold text-[#7f1d1d]">
                            Esta informacion es temporal para diagnosticar el error 500 en Hostinger.
                        </p>
                    </div>
                    <div className="grid gap-2 text-sm text-[#450a0a]">
                        <DebugLine label="Excepcion" value={debugError.exception} />
                        <DebugLine label="Mensaje" value={debugError.message} />
                        <DebugLine label="Archivo" value={`${debugError.file}:${debugError.line}`} />
                        <DebugLine label="Conexion" value={debugError.database} />
                    </div>
                    <pre className="max-h-72 overflow-auto rounded-md border border-[#fecaca] bg-white p-3 text-xs font-semibold normal-case text-[#111827]">
                        {JSON.stringify(debugError.checks, null, 2)}
                    </pre>
                </section>
            ) : null}

            <section className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-black text-[#0f172a]">Lista de tareas</h1>
                        <p className="text-sm font-semibold text-[#475569]">
                            {totalItems} reparacion{totalItems === 1 ? '' : 'es'} en tareas.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-sm font-black text-[#1d4ed8]">
                            {todayLabel}
                        </span>
                        <Link href={urls.consultations} className={buttonClass('soft', 'sm')}>
                            Volver a consultas
                        </Link>
                    </div>
                </div>
            </section>

            {totalItems === 0 ? (
                <section className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#94a3b8] bg-white p-6 text-center shadow-sm">
                    <div className="grid gap-2">
                        <p className="text-lg font-black text-[#0f172a]">No hay trabajos en tareas</p>
                        <p className="max-w-xl text-sm font-semibold leading-6 text-[#475569]">
                            Desde Consultas, usa el boton de tareas en la fila del trabajo para mandarlo al final de la cola.
                        </p>
                        <Link href={urls.consultations} className={buttonClass('primary', 'sm', 'justify-self-center')}>
                            Ir a consultas
                        </Link>
                    </div>
                </section>
            ) : (
                <section className="grid gap-4">
                    {renderSection('Tareas para hoy', items, 'No quedan tareas pendientes para hoy.', 'pending')}

                    <div className="py-3">
                        <div className="flex min-h-14 items-center justify-between gap-3 rounded-md bg-[#0f172a] px-4 py-4 text-white">
                            <span className="text-base font-black">Completadas</span>
                            <span className="text-sm font-bold text-[#cbd5e1]">{repairCount(completedItems)}</span>
                        </div>
                    </div>

                    {renderSection('Terminadas del dia', completedItems, 'Todavia no hay tareas listas o canceladas.', 'done')}
                </section>
            )}
        </RepairLayout>
    );
}

function DebugLine({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
            <span className="font-black">{label}</span>
            <code className="break-words rounded-md bg-white px-2 py-1 text-xs font-semibold">{value}</code>
        </div>
    );
}
