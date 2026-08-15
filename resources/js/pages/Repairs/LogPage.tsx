import { Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { FaHistory, FaSearch } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface LogEventView {
    id: number;
    time?: string | null;
    createdAt?: string | null;
    event: string;
    label: string;
    tone: string;
    orderId: number;
    repairNumber: number;
    customerName?: string | null;
    model?: string | null;
    description?: string | null;
    previousState?: string | null;
    nextState?: string | null;
    user?: string | null;
    ticketUrl: string;
}

interface LogPageProps {
    date: string;
    events: LogEventView[];
    summary: {
        total: number;
        delivered: number;
        cancelled: number;
        updated: number;
    };
}

function formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return year && month && day ? `${day}/${month}/${year}` : value;
}

function logSearchText(event: LogEventView): string {
    return [
        event.label,
        event.event,
        event.orderId,
        event.repairNumber,
        event.customerName ?? '',
        event.model ?? '',
        event.description ?? '',
        event.previousState ?? '',
        event.nextState ?? '',
        event.user ?? '',
    ].join(' ').toLowerCase();
}

function toneClass(tone: string): string {
    if (tone === 'success') return 'border-[#198754] bg-[#ecfdf3] text-[#0f5132]';
    if (tone === 'danger') return 'border-[#dc3545] bg-[#fff1f2] text-[#842029]';
    if (tone === 'money') return 'border-[#d97706] bg-[#fff7ed] text-[#7c2d12]';
    if (tone === 'update') return 'border-[#2563eb] bg-[#eff6ff] text-[#1e3a8a]';

    return 'border-[#cbd5e1] bg-[#f8fafc] text-[#334155]';
}

function LogRow({ event }: { event: LogEventView }): JSX.Element {
    const hasStateChange = (event.previousState ?? '') !== '' || (event.nextState ?? '') !== '';
    const stateLabel = hasStateChange
        ? `${event.previousState || '-'} -> ${event.nextState || '-'}`
        : null;

    return (
        <article className="grid gap-2 border-b border-[#e2e8f0] bg-white px-3 py-3 last:border-b-0 md:grid-cols-[4.5rem_minmax(0,1fr)_auto] md:items-start">
            <time className="text-sm font-black text-[#0f172a]">{event.time ?? '--:--'}</time>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-md border px-2 py-0.5 text-xs font-black', toneClass(event.tone))}>{event.label}</span>
                    <strong className="text-sm text-[#0f172a]">Orden #{event.orderId}</strong>
                    <span className="text-xs font-bold text-[#64748b]">Trabajo {event.repairNumber}</span>
                    {stateLabel ? <span className="text-xs font-bold text-[#475569]">{stateLabel}</span> : null}
                </div>
                <div className="mt-1 grid gap-0.5 text-sm font-semibold text-[#334155]">
                    <span className="truncate">{event.customerName || 'Sin cliente'}{event.model ? ` - ${event.model}` : ''}</span>
                    {event.description ? <span className="truncate text-xs text-[#64748b]">{event.description}</span> : null}
                    {event.user ? <span className="text-xs text-[#64748b]">Usuario: {event.user}</span> : null}
                </div>
            </div>
            <Link href={event.ticketUrl} className={buttonClass('soft', 'sm', 'justify-self-start md:justify-self-end')}>
                Ticket
            </Link>
        </article>
    );
}

export default function LogPage({ date, events, summary }: LogPageProps): JSX.Element {
    const [search, setSearch] = useState('');
    const normalizedSearch = search.trim().toLowerCase();
    const visibleEvents = useMemo(
        () => normalizedSearch === '' ? events : events.filter((event) => logSearchText(event).includes(normalizedSearch)),
        [events, normalizedSearch],
    );

    const changeDate = (nextDate: string): void => {
        router.get(route('repairs.log'), { date: nextDate }, { preserveState: true, preserveScroll: false });
    };

    return (
        <RepairLayout title="Log">
            <section className="grid gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-black text-[#0f172a]">Log del dia</h1>
                        <p className="text-sm font-semibold text-[#64748b]">Salidas, cancelaciones, pagos y cambios registrados el {formatDate(date)}.</p>
                    </div>
                    <label className="grid gap-1 text-sm font-black text-[#334155]">
                        Fecha
                        <input className={cn(ui.input, 'min-h-10')} type="date" value={date} onChange={(event) => changeDate(event.target.value)} />
                    </label>
                </div>

                <div className="grid gap-2 md:grid-cols-4">
                    <SummaryBox label="Acciones" value={summary.total} />
                    <SummaryBox label="Entregadas" value={summary.delivered} />
                    <SummaryBox label="Canceladas" value={summary.cancelled} />
                    <SummaryBox label="Actualizaciones" value={summary.updated} />
                </div>

                <div className="grid gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 md:grid-cols-[auto_minmax(14rem,28rem)_auto] md:items-center">
                    <strong className="inline-flex items-center gap-2 text-sm text-[#0f172a]">
                        <FaHistory aria-hidden="true" />
                        Bitacora
                    </strong>
                    <label className="relative">
                        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
                        <input
                            className={cn(ui.input, 'min-h-9 pl-9')}
                            placeholder="Buscar por orden, cliente, evento o modelo"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </label>
                    <span className="text-xs font-bold text-[#475569]">
                        {visibleEvents.length} de {events.length}
                    </span>
                </div>

                <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white">
                    {visibleEvents.length > 0 ? (
                        visibleEvents.map((event) => <LogRow key={event.id} event={event} />)
                    ) : (
                        <div className="px-4 py-8 text-center text-sm font-semibold text-[#64748b]">
                            {events.length === 0 ? 'No hay acciones registradas para esta fecha.' : 'No hay acciones que coincidan con la busqueda.'}
                        </div>
                    )}
                </div>
            </section>
        </RepairLayout>
    );
}

function SummaryBox({ label, value }: { label: string; value: number }): JSX.Element {
    return (
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <span className="text-xs font-bold text-[#64748b]">{label}</span>
            <strong className="block text-lg font-black text-[#0f172a]">{value}</strong>
        </div>
    );
}
