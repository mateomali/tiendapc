import { Link, router } from '@inertiajs/react';
import { FaCheck, FaExternalLinkAlt, FaTimes } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn, formatCurrency } from '../../utils';

interface RepairTaskRow {
    id: number;
    registroId: number;
    ticketId: number;
    repairNumber: number;
    clientName: string;
    dni: number;
    contact?: string | null;
    date?: string | null;
    estimatedDate?: string | null;
    model?: string | null;
    description?: string | null;
    observations?: string | null;
    status: string;
    balance: number;
    ticketUrl: string;
    completeAction: string;
    removeAction: string;
}

interface TasksPageProps {
    todayLabel: string;
    items: RepairTaskRow[];
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

function formatDate(value?: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
}

function statusClass(status: string): string {
    if (status === 'LISTA') return 'bg-[#dcfce7] text-[#166534] border-[#86efac]';
    if (status === 'CANCELADA') return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
    if (status.startsWith('EN REPARACION')) return 'bg-[#ede9fe] text-[#5b21b6] border-[#c4b5fd]';

    return 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]';
}

function post(action: string): void {
    router.post(action, {}, { preserveScroll: true });
}

export default function TasksPage({ todayLabel, items, urls, debugError = null }: TasksPageProps): JSX.Element {
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
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#1d4ed8]">Cola activa</p>
                        <h1 className="text-2xl font-black text-[#0f172a]">Lista de tareas</h1>
                        <p className="text-sm font-semibold text-[#475569]">
                            Los trabajos se agregan desde la grilla de consultas y quedan en cola hasta terminarlos o quitarlos.
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

            <section className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[#475569]">
                    <span>{items.length} trabajo{items.length === 1 ? '' : 's'} en cola.</span>
                </div>

                {items.length === 0 ? (
                    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#94a3b8] bg-white p-6 text-center shadow-sm">
                        <div className="grid gap-2">
                            <p className="text-lg font-black text-[#0f172a]">No hay trabajos en tareas</p>
                            <p className="max-w-xl text-sm font-semibold leading-6 text-[#475569]">
                                Desde Consultas, usa el icono de tareas en la fila del trabajo para mandarlo al final de la cola.
                            </p>
                            <Link href={urls.consultations} className={buttonClass('primary', 'sm', 'justify-self-center')}>
                                Ir a consultas
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {items.map((item, index) => (
                            <article key={item.id} className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-white p-3 shadow-sm xl:grid-cols-[4.5rem_minmax(8rem,0.7fr)_minmax(7rem,0.45fr)_minmax(12rem,1fr)_minmax(14rem,1.15fr)_7rem_6rem_9rem] xl:items-center">
                                <div className="flex items-center gap-2 xl:block">
                                    <span className="grid h-8 w-8 place-items-center rounded-md bg-[#0f172a] text-sm font-black text-white">{index + 1}</span>
                                    <div className="xl:mt-1">
                                        <p className="text-xs font-black text-[#1d4ed8]">#{item.ticketId}</p>
                                        <p className="text-[0.68rem] font-bold text-[#64748b]">Trabajo {item.repairNumber}</p>
                                    </div>
                                </div>

                                <div className="min-w-0">
                                    <p className="truncate text-sm font-black text-[#0f172a]">{item.clientName}</p>
                                    <p className="text-xs font-semibold text-[#64748b]">DNI {item.dni}</p>
                                </div>

                                <div className="min-w-0 text-sm font-semibold text-[#475569]">
                                    <p>{item.contact || 'Sin contacto'}</p>
                                    <p className="text-xs text-[#64748b]">Ingreso {formatDate(item.date)}</p>
                                </div>

                                <div className="min-w-0">
                                    <p className="break-words text-sm font-black uppercase text-[#0f172a]">{item.model || 'Sin modelo'}</p>
                                    <p className="text-xs font-semibold text-[#64748b]">Estimada {formatDate(item.estimatedDate)}</p>
                                </div>

                                <div className="min-w-0">
                                    <p className="line-clamp-2 break-words text-sm font-semibold text-[#334155]">{item.description || '-'}</p>
                                    {item.observations ? <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#64748b]">{item.observations}</p> : null}
                                </div>

                                <span className={cn('inline-flex w-fit items-center justify-center rounded-md border px-2 py-1 text-xs font-black', statusClass(item.status))}>
                                    {item.status}
                                </span>

                                <div className="text-sm font-black text-[#0f172a]">{formatCurrency(item.balance)}</div>

                                <div className="flex flex-wrap justify-end gap-1.5">
                                    <button type="button" className={buttonClass('success', 'sm')} onClick={() => post(item.completeAction)} title="Terminado">
                                        <FaCheck aria-hidden="true" />
                                        TERMINADO
                                    </button>
                                    <Link href={item.ticketUrl} className={buttonClass('soft', 'sm')} title="Abrir ticket">
                                        <FaExternalLinkAlt aria-hidden="true" />
                                    </Link>
                                    <button type="button" className={buttonClass('danger', 'sm')} onClick={() => post(item.removeAction)} title="Quitar">
                                        <FaTimes aria-hidden="true" />
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
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
