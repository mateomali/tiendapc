import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FaBan, FaCalendarDay, FaCamera, FaCheckCircle, FaChevronDown, FaClipboardCheck, FaClipboardList, FaCopy, FaFilter, FaHourglassEnd, FaImages, FaPlusCircle, FaReceipt, FaSave, FaSearch, FaTimes, FaTools, FaTruck, FaWrench } from 'react-icons/fa';
import { PhoneUnlockFields } from '../../components/PhoneUnlockFields';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass } from '../../components/RepairTicketPanel';
import { WebcamCaptureButton } from '../../components/WebcamCaptureButton';
import { RepairLayout } from '../../layouts/RepairLayout';
import type { RepairTicketView } from '../../types';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
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

interface FailureTemplateOption {
    value: string;
    label: string;
    description: string;
}

interface RepairPartInventoryOption {
    id: number;
    quantity: number;
    model: string;
    box: string;
}

interface DeviceModelOption {
    id: number;
    category_id: number;
    brand: string | null;
    model: string;
    normalized_model: string;
    usage_count: number;
}

interface WorkbenchPageProps {
    filters: {
        q?: string;
        estado?: string;
        prioridad?: string;
        summary_range?: string;
        summary_from?: string;
        summary_to?: string;
        categoria_filter?: number | string;
        ordenar_por?: string;
        direccion?: string;
        filter_id?: string;
        filter_cliente?: string;
        filter_dni?: string;
        filter_contacto?: string;
        filter_ingreso?: string;
        filter_trabajo?: string;
        filter_modelo?: string;
        filter_falla?: string;
        filter_estimada?: string;
        filter_saldo?: string;
        filter_estado?: string;
        q_fields?: string[];
    };
    tickets: RepairTicketView[];
    deliveredSearchTickets: RepairTicketView[];
    summary: {
        active: number;
        delivered: number;
        pending: number;
        inRepair: number;
        waitingParts: number;
        ready: number;
        overdue: number;
        today: number;
        tasks: number;
        cancelled: number;
    };
    deliveredSearchMatches: number;
    archivedSearchMatches: number;
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    failureTemplates: FailureTemplateOption[];
    serviceOptionUsage: Record<string, number>;
    partInventory: RepairPartInventoryOption[];
    deviceModels: DeviceModelOption[];
    nextOrderId: number;
    ticketPricing: TicketPricingSettings;
    pageMode?: 'consultas' | 'ingreso';
    intakeMode?: 'continuous' | 'wizard';
    initialCreateClient?: {
        nombre_cliente: string;
        dni: number | string;
        contacto?: string | null;
    } | null;
}

interface TicketPricingSettings {
    cashDiscountEnabled: boolean;
    cashDiscountThreshold: number;
    cashDiscountPercentage: number;
    cashDiscountNote: string;
}

interface RepairJobFormData {
    same_device: boolean;
    marca: string;
    modelo: string;
    color: string;
    tipo_servicio: string;
    descripcion: string;
    observaciones: string;
    monto: string;
    senia: string;
    senia_method: string;
    fecha_estimada: string;
    estado: string;
    repuesto: string;
    pedir_repuesto: boolean;
    inventory_part_id: string;
    categorias_reparacion: string;
    unlock_type: string;
    unlock_value: string;
    images: File[] | null;
}

interface WorkbenchCreateFormData {
    id_orden: string;
    nombre_cliente: string;
    dni: string;
    contacto: string;
    jobs: RepairJobFormData[];
}

type CreateFlowField = 'order-id' | 'customer-name' | `job-${number}-brand` | `job-${number}-model` | `job-${number}-description` | `job-${number}-amount` | `job-${number}-date`;
type IntakeStep = 'client' | 'device' | 'extras' | 'summary';
type DateShortcutValue = 'today' | 'tomorrow' | 'day-after' | 'custom';

interface ClientLookupPreview {
    nombre_cliente?: string;
    dni?: number;
    contacto?: string | null;
    ultima_orden?: number;
}

function localDateWithOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function createEmptyJob(defaultState: string): RepairJobFormData {
    return {
        same_device: false,
        marca: '',
        modelo: '',
        color: '',
        tipo_servicio: '',
        descripcion: '',
        observaciones: 'sin observaciones',
        monto: '0',
        senia: '0',
        senia_method: 'efectivo',
        fecha_estimada: localDateWithOffset(0),
        estado: defaultState,
        repuesto: '',
        pedir_repuesto: false,
        inventory_part_id: '',
        categorias_reparacion: '4',
        unlock_type: '',
        unlock_value: '',
        images: null,
    };
}

const phoneBrandOptions = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG', 'OTRAS'] as const;
const repairColorOptions = [
    { value: '', label: 'Sin color', swatchClass: 'bg-[#f8fafc]' },
    { value: 'NEGRO', label: 'Negro', swatchClass: 'bg-[#111827]' },
    { value: 'BLANCO', label: 'Blanco', swatchClass: 'bg-white' },
    { value: 'GRIS', label: 'Gris', swatchClass: 'bg-[#6b7280]' },
    { value: 'PLATA', label: 'Plata', swatchClass: 'bg-[#c0c0c0]' },
    { value: 'AZUL', label: 'Azul', swatchClass: 'bg-[#2563eb]' },
    { value: 'CELESTE', label: 'Celeste', swatchClass: 'bg-[#38bdf8]' },
    { value: 'ROJO', label: 'Rojo', swatchClass: 'bg-[#dc2626]' },
    { value: 'VERDE', label: 'Verde', swatchClass: 'bg-[#16a34a]' },
    { value: 'AMARILLO', label: 'Amarillo', swatchClass: 'bg-[#facc15]' },
    { value: 'DORADO', label: 'Dorado', swatchClass: 'bg-[#d97706]' },
    { value: 'ROSA', label: 'Rosa', swatchClass: 'bg-[#f472b6]' },
    { value: 'VIOLETA', label: 'Violeta', swatchClass: 'bg-[#7c3aed]' },
    { value: 'NARANJA', label: 'Naranja', swatchClass: 'bg-[#f97316]' },
    { value: 'MARRON', label: 'Marron', swatchClass: 'bg-[#7c2d12]' },
    { value: 'BEIGE', label: 'Beige', swatchClass: 'bg-[#d6b48c]' },
] as const;

function normalizeDeviceSearch(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function removeBrandPrefix(value: string, brand: string): string {
    const normalizedValue = normalizeDeviceSearch(value);
    const normalizedBrand = normalizeDeviceSearch(brand);

    if (normalizedBrand === '' || normalizedValue === '') {
        return normalizedValue;
    }

    return normalizedValue === normalizedBrand
        ? ''
        : normalizedValue.replace(new RegExp(`^${normalizedBrand}\\s+`), '').trim();
}

function repairColorLabel(color?: string | null): string {
    const normalized = normalizeDeviceSearch(color ?? '');
    const option = repairColorOptions.find((item) => item.value === normalized);

    return option?.label ?? (color ?? '');
}

function repairColorSwatchClass(color?: string | null): string {
    const normalized = normalizeDeviceSearch(color ?? '');
    const option = repairColorOptions.find((item) => item.value === normalized);

    return option?.swatchClass ?? 'bg-[#94a3b8]';
}

function RepairColorCombobox({
    className,
    value,
    onChange,
}: {
    className: string;
    value: string;
    onChange: (value: string) => void;
}): JSX.Element {
    const [open, setOpen] = useState(false);
    const [showAllColors, setShowAllColors] = useState(false);
    const [query, setQuery] = useState(repairColorLabel(value));
    const normalizedQuery = normalizeDeviceSearch(query);
    const filteredOptions = showAllColors || normalizedQuery === ''
        ? repairColorOptions
        : repairColorOptions.filter((option) => normalizeDeviceSearch(option.label).includes(normalizedQuery) || option.value.includes(normalizedQuery));

    const selectColor = (nextValue: string): void => {
        onChange(nextValue);
        setQuery(repairColorLabel(nextValue));
        setShowAllColors(false);
        setOpen(false);
    };

    return (
        <div className="relative">
            <span
                className={cn('pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-sm border border-[#64748b]', repairColorSwatchClass(value))}
                aria-hidden="true"
            />
            <input
                className={cn(className, 'pl-9 pr-9')}
                value={open ? query : repairColorLabel(value)}
                placeholder="Color"
                onFocus={() => {
                    setQuery(repairColorLabel(value));
                    setShowAllColors(false);
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAllColors(false);
                    setOpen(true);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' && filteredOptions[0]) {
                        event.preventDefault();
                        selectColor(filteredOptions[0].value);
                    }
                    if (event.key === 'Escape') {
                        setOpen(false);
                        setShowAllColors(false);
                        setQuery(repairColorLabel(value));
                    }
                }}
                onBlur={() => {
                    window.setTimeout(() => {
                        setOpen(false);
                        setShowAllColors(false);
                        setQuery(repairColorLabel(value));
                    }, 120);
                }}
            />
            <button
                type="button"
                className="absolute right-2 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[#475569] hover:bg-[#e2e8f0]"
                aria-label="Mostrar colores"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                    if (open && showAllColors) {
                        setOpen(false);
                        setShowAllColors(false);
                        return;
                    }

                    setQuery(repairColorLabel(value));
                    setShowAllColors(true);
                    setOpen(true);
                }}
            >
                <FaChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>
            {open ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-md border border-[#cbd5e1] bg-white py-1 shadow-[0_8px_18px_rgba(15,23,42,0.14)]">
                    {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                        <button
                            key={option.value || 'empty'}
                            type="button"
                            className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-[#0f172a] hover:bg-[#eff6ff]',
                                normalizeDeviceSearch(value) === option.value && 'bg-[#dbeafe]',
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectColor(option.value)}
                        >
                            <span className={cn('h-3.5 w-3.5 shrink-0 rounded-sm border border-[#64748b]', option.swatchClass)} aria-hidden="true" />
                            <span>{option.label}</span>
                        </button>
                    )) : (
                        <div className="px-3 py-2 text-sm font-semibold text-[#64748b]">Sin coincidencias</div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function SummaryCard({
    label,
    value,
    trend,
    tone,
}: {
    label: string;
    value: number;
    trend: string;
    tone: 'blue' | 'orange' | 'amber' | 'green' | 'red' | 'cyan';
}): JSX.Element {
    const iconTone = {
        blue: 'from-[#2563eb] to-[#22d3ee]',
        orange: 'from-[#f97316] to-[#fb923c]',
        amber: 'from-[#f59e0b] to-[#d97706]',
        green: 'from-[#22c55e] to-[#16a34a]',
        red: 'from-[#ef4444] to-[#b91c1c]',
        cyan: 'from-[#0ea5e9] to-[#0284c7]',
    }[tone];

    return (
        <article className="flex min-h-[86px] min-w-0 flex-col justify-between gap-2 rounded-lg border border-[#b8d3f7] bg-[#f8fbff] px-3 py-2.5 text-left shadow-sm">
            <div className="text-[0.78rem] font-semibold text-[#1d4ed8]">{label}</div>
            <div className="flex items-center justify-between gap-2.5">
                <div className="text-[1.45rem] font-extrabold leading-none text-[#0f172a]">{value}</div>
                <div className={cn('grid h-[28px] w-[28px] place-items-center rounded-md text-[0.72rem] text-transparent', iconTone)}>
                    ●
                </div>
            </div>
            <div className={cn('text-[0.82rem] font-semibold', tone === 'green' ? 'text-[#15803d]' : tone === 'red' ? 'text-[#b91c1c]' : tone === 'cyan' ? 'text-[#0ea5e9]' : 'text-[#d97706]')}>
                {trend}
            </div>
        </article>
    );
}

function SummaryFilterCard({
    label,
    value,
    trend,
    tone,
    href,
    active = false,
    icon,
}: {
    label: string;
    value: number;
    trend: string;
    tone: 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'cyan' | 'yellow' | 'brown';
    href: string;
    active?: boolean;
    icon: JSX.Element;
}): JSX.Element {
    const trendTone = {
        blue: 'text-[#1d4ed8]',
        orange: 'text-[#d97706]',
        purple: 'text-[#6d28d9]',
        green: 'text-[#15803d]',
        red: 'text-[#b91c1c]',
        cyan: 'text-[#0ea5e9]',
        yellow: 'text-[#a16207]',
        brown: 'text-[#854d0e]',
    }[tone];
    const iconShellTone = {
        blue: 'border-[#bfdbfe] bg-white',
        orange: 'border-[#fed7aa] bg-[#fff7ed]',
        purple: 'border-[#ddd6fe] bg-[#faf5ff]',
        green: 'border-[#bbf7d0] bg-[#f0fdf4]',
        red: 'border-[#fecaca] bg-[#fef2f2]',
        cyan: 'border-[#bae6fd] bg-[#f0f9ff]',
        yellow: 'border-[#fde68a] bg-[#fefce8]',
        brown: 'border-[#d6b48c] bg-[#fff7ed]',
    }[tone];

    return (
        <Link
            href={href}
            preserveScroll
            className={cn(
                'grid min-h-[62px] min-w-0 grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 rounded-md border bg-white px-2.5 py-2 text-left no-underline transition hover:border-[#2563eb] hover:bg-[#f8fbff]',
                active ? 'border-[#2563eb] bg-[#eff6ff] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.18)]' : 'border-[#cbd5e1]',
            )}
        >
            <div className="min-w-0">
                <div className="truncate text-[0.72rem] font-bold text-[#475569]">{label}</div>
                <div className="mt-0.5 text-[1.22rem] font-black leading-none text-[#0f172a]">{value}</div>
            </div>
            <div className={cn('grid h-[28px] w-[28px] place-items-center rounded-md border text-[0.8rem]', iconShellTone, trendTone)}>
                {icon}
            </div>
            <div className={cn('col-span-2 truncate text-[0.68rem] font-bold', trendTone)}>{trend}</div>
        </Link>
    );
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }): JSX.Element {
    return (
        <Link
            href={href}
            preserveScroll
            className={cn(
                'min-h-8 rounded-md border px-3 py-1.5 text-center text-[0.76rem] font-bold no-underline transition',
                active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white'
                    : 'border-[#bfdbfe] bg-white text-[#1d4ed8] hover:border-[#2563eb] hover:bg-[#eff6ff]',
            )}
        >
            {label}
        </Link>
    );
}

function ConsultasEmptyState({
    hasFilters,
    isTaskQueueView,
}: {
    hasFilters: boolean;
    isTaskQueueView: boolean;
}): JSX.Element {
    const title = isTaskQueueView ? 'No hay tareas activas en cola' : 'No hay reparaciones para mostrar';
    const message = isTaskQueueView
        ? 'La cola no tiene órdenes activas pendientes. Las tareas cerradas, entregadas o archivadas ya no se muestran en consultas.'
        : hasFilters
            ? 'No encontramos tickets con los filtros actuales. Probá limpiar filtros o buscar en entregados.'
            : 'No hay tickets activos en consultas. Podés crear una nueva orden o revisar entregados.';

    return (
        <div className="grid justify-items-center gap-3 rounded-lg border border-[#cbd5e1] bg-white px-4 py-8 text-center shadow-sm">
            <div className="grid gap-1">
                <h3 className="text-base font-black text-[#0f172a]">{title}</h3>
                <p className="max-w-xl text-sm font-semibold leading-6 text-[#475569]">{message}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                {hasFilters ? (
                    <Link href={route('repairs.workbench')} preserveScroll className={buttonClass('soft', 'sm')}>
                        Limpiar filtros
                    </Link>
                ) : null}
                <Link href={route('repairs.ingress')} className={buttonClass('primary', 'sm')}>
                    Nueva orden
                </Link>
                <Link href={route('repairs.delivered')} className={buttonClass('soft', 'sm')}>
                    Ver entregados
                </Link>
            </div>
        </div>
    );
}

type QueryValue = string | number | string[] | undefined;

function cleanQuery(query: Record<string, QueryValue>): Record<string, string | number | string[]> {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0))) as Record<string, string | number | string[]>;
}

const columnFilterKeys = [
    'filter_id',
    'filter_cliente',
    'filter_dni',
    'filter_contacto',
    'filter_ingreso',
    'filter_trabajo',
    'filter_modelo',
    'filter_falla',
    'filter_estimada',
    'filter_saldo',
    'filter_estado',
] as const;

const searchFieldOptions = [
    { key: 'id', label: 'ID' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'dni', label: 'DNI' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'ingreso', label: 'Fecha ingreso' },
    { key: 'estimada', label: 'Estimada' },
    { key: 'saldo', label: 'Saldo' },
    { key: 'estado', label: 'Estado' },
] as const;

type SearchFieldKey = (typeof searchFieldOptions)[number]['key'];

const defaultSearchFields = searchFieldOptions.map((option) => option.key);

type SortableRepairColumn = 'ticket' | 'cliente' | 'dni' | 'contacto' | 'ingreso' | 'trabajo' | 'modelo' | 'falla' | 'estimada' | 'saldo' | 'estado';

interface TicketDateGroup {
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

function groupTicketsByEntryDate(tickets: RepairTicketView[]): TicketDateGroup[] {
    const groups = new Map<string, TicketDateGroup>();

    tickets.forEach((ticket) => {
        const key = ticket.fecha?.slice(0, 10) || 'sin-fecha';
        const group = groups.get(key);

        if (group) {
            group.tickets.push(ticket);
            group.count += 1;
            group.repairCount += ticket.repairs.length;
            return;
        }

        groups.set(key, {
            key,
            label: dateGroupLabel(ticket.fecha),
            count: 1,
            repairCount: ticket.repairs.length,
            tickets: [ticket],
        });
    });

    return Array.from(groups.values());
}

function splitTaskTickets(tickets: RepairTicketView[]): { pending: RepairTicketView[]; completed: RepairTicketView[] } {
    const pending: RepairTicketView[] = [];
    const completed: RepairTicketView[] = [];

    tickets.forEach((ticket) => {
        const pendingRepairs = ticket.repairs.filter((repair) => !['LISTA', 'CANCELADA'].includes(repair.estado));
        const completedRepairs = ticket.repairs.filter((repair) => ['LISTA', 'CANCELADA'].includes(repair.estado));

        if (pendingRepairs.length > 0) {
            pending.push({ ...ticket, repairs: pendingRepairs });
        }

        if (completedRepairs.length > 0) {
            completed.push({ ...ticket, repairs: completedRepairs });
        }
    });

    return { pending, completed };
}

function daysSinceDate(value?: string | null): number | null {
    if (!value) return null;

    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;

    const delivered = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const difference = today.getTime() - delivered.getTime();

    return Math.max(0, Math.floor(difference / 86_400_000));
}

function deliveredStatusLabel(value?: string | null): string {
    const days = daysSinceDate(value);

    if (days === null) return 'Entregado';
    if (days === 0) return 'Entregado hoy';
    if (days === 1) return 'Entregado hace 1 dia';

    return `Entregado hace ${days} dias`;
}

export default function WorkbenchPage({
    filters,
    tickets,
    deliveredSearchTickets,
    summary,
    deliveredSearchMatches,
    states,
    serviceCategories,
    serviceTemplates,
    failureTemplates,
    serviceOptionUsage,
    partInventory,
    deviceModels,
    nextOrderId,
    ticketPricing = {
        cashDiscountEnabled: true,
        cashDiscountThreshold: 30000,
        cashDiscountPercentage: 10,
        cashDiscountNote: 'Abonando en efectivo tenes 10% de descuento.',
    },
    pageMode = 'consultas',
    intakeMode = 'continuous',
    archivedSearchMatches,
    initialCreateClient = null,
}: WorkbenchPageProps): JSX.Element {
    const isConsultas = pageMode === 'consultas';
    const isIngreso = pageMode === 'ingreso';
    const isWizardIntake = intakeMode === 'wizard';
    const highlightTerm = (filters.q ?? '').trim();
    const filtersForm = useForm({
        q: filters.q ?? '',
        estado: filters.estado ?? '',
        prioridad: filters.prioridad ?? '',
        summary_range: filters.summary_range ?? 'quarter',
        summary_from: filters.summary_from ?? '',
        summary_to: filters.summary_to ?? '',
        categoria_filter: filters.categoria_filter ?? '',
        ordenar_por: filters.ordenar_por ?? 'ticket',
        direccion: filters.direccion ?? 'desc',
        filter_id: filters.filter_id ?? '',
        filter_cliente: filters.filter_cliente ?? '',
        filter_dni: filters.filter_dni ?? '',
        filter_contacto: filters.filter_contacto ?? '',
        filter_ingreso: filters.filter_ingreso ?? '',
        filter_trabajo: filters.filter_trabajo ?? '',
        filter_modelo: filters.filter_modelo ?? '',
        filter_falla: filters.filter_falla ?? '',
        filter_estimada: filters.filter_estimada ?? '',
        filter_saldo: filters.filter_saldo ?? '',
        filter_estado: filters.filter_estado ?? '',
    });
    const createForm = useForm<WorkbenchCreateFormData>({
        id_orden: String(nextOrderId),
        nombre_cliente: initialCreateClient?.nombre_cliente ?? '',
        dni: initialCreateClient ? String(initialCreateClient.dni ?? '') : '',
        contacto: initialCreateClient?.contacto ?? '',
        jobs: [createEmptyJob(states[0] ?? 'PENDIENTE')],
    });
    const [lookupFeedback, setLookupFeedback] = useState<string>('');
    const [lookupBusy, setLookupBusy] = useState(false);
    const [clientPreview, setClientPreview] = useState<ClientLookupPreview | null>(null);
    const [imagePreviews, setImagePreviews] = useState<Record<number, string[]>>({});
    const [duplicateNotice, setDuplicateNotice] = useState('');
    const [pendingFailureOptions, setPendingFailureOptions] = useState<Record<number, string>>({});
    const [customEstimatedDateJobs, setCustomEstimatedDateJobs] = useState<Record<number, boolean>>({});
    const [activeIntakeStep, setActiveIntakeStep] = useState<IntakeStep>('client');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [partSearches, setPartSearches] = useState<Record<number, string>>({});
    const [expandedDesktopTickets, setExpandedDesktopTickets] = useState<Record<number, boolean>>({});
    const [activeSearchFields, setActiveSearchFields] = useState<SearchFieldKey[]>(() => {
        const incoming = filters.q_fields ?? defaultSearchFields;

        return defaultSearchFields.filter((field) => incoming.includes(field));
    });
    const gridFilterSubmitTimeout = useRef<number | null>(null);
    const dniLookupTimeout = useRef<number | null>(null);
    const visibleRepairs = tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);
    const ticketDateGroups = groupTicketsByEntryDate(tickets);
    const isTaskQueueView = filters.prioridad === 'tareas';
    const taskTickets = splitTaskTickets(tickets);

    useEffect(() => () => {
        if (gridFilterSubmitTimeout.current !== null) {
            window.clearTimeout(gridFilterSubmitTimeout.current);
        }
        if (dniLookupTimeout.current !== null) {
            window.clearTimeout(dniLookupTimeout.current);
        }
    }, []);

    const toggleDesktopTicket = (ticketId: number): void => {
        setExpandedDesktopTickets((current) => ({
            ...current,
            [ticketId]: !current[ticketId],
        }));
    };
    const summaryRange = filters.summary_range ?? 'quarter';
    const categoryFilter = String(filters.categoria_filter ?? '');
    const periodOptions = [
        { label: 'Total', value: 'all' },
        { label: 'Anual', value: 'year' },
        { label: 'Trimestral', value: 'quarter' },
        { label: 'Mensual', value: 'month' },
        { label: 'Semanal', value: 'week' },
        { label: 'Personalizada', value: 'custom' },
    ];
    const categoryOptions = [
        { label: 'Todas', value: '' },
        { label: 'Celulares', value: '1' },
        { label: 'Computadoras', value: '2' },
        { label: 'Consolas', value: '3' },
        { label: 'Otros', value: '4' },
    ];
    const activeMobileFilters = [
        filters.q,
        filters.estado,
        filters.prioridad,
        categoryFilter,
        summaryRange !== 'quarter' ? summaryRange : '',
        filters.ordenar_por && filters.ordenar_por !== 'ticket' ? filters.ordenar_por : '',
        filters.direccion && filters.direccion !== 'desc' ? filters.direccion : '',
        activeSearchFields.length !== defaultSearchFields.length ? 'search-fields' : '',
        ...columnFilterKeys.map((key) => filters[key]),
    ].filter((value) => value !== undefined && value !== '').length;
    const hasActiveConsultasFilters = activeMobileFilters > 0;
    const columnFilterQuery = Object.fromEntries(columnFilterKeys.map((key) => [key, filters[key]])) as Record<(typeof columnFilterKeys)[number], string | undefined>;
    const searchFieldsQuery = activeSearchFields.length === defaultSearchFields.length
        ? undefined
        : (activeSearchFields.length === 0 ? ['__none'] : activeSearchFields);
    const filterQuery = (overrides: Record<string, QueryValue> = {}): Record<string, string | number | string[]> =>
        cleanQuery({
            q: filters.q,
            q_fields: filters.q ? searchFieldsQuery : undefined,
            estado: filters.estado,
            prioridad: filters.prioridad,
            summary_range: summaryRange,
            summary_from: filters.summary_from,
            summary_to: filters.summary_to,
            categoria_filter: categoryFilter,
            ordenar_por: filters.ordenar_por,
            direccion: filters.direccion,
            ...columnFilterQuery,
            ...overrides,
        });

    const submitCleanSearch = (preserveScroll = false): void => {
        const query = filtersForm.data.q.trim();

        router.get(
            route('repairs.workbench'),
            query !== '' ? cleanQuery({ q: query, q_fields: searchFieldsQuery }) : {},
            { preserveScroll },
        );
    };
    const submitGridFilters = (): void => {
        router.get(
            route('repairs.workbench'),
            cleanQuery({
                ...filtersForm.data,
                q: filtersForm.data.q.trim(),
                q_fields: filtersForm.data.q.trim() !== '' ? searchFieldsQuery : undefined,
            }),
            { preserveScroll: true },
        );
    };
    const toggleSearchField = (field: SearchFieldKey): void => {
        setActiveSearchFields((current) => (
            current.includes(field)
                ? current.filter((item) => item !== field)
                : defaultSearchFields.filter((item) => item === field || current.includes(item))
        ));
    };
    const applySingleGridFilter = (key: (typeof columnFilterKeys)[number], value: string): void => {
        if (gridFilterSubmitTimeout.current !== null) {
            window.clearTimeout(gridFilterSubmitTimeout.current);
            gridFilterSubmitTimeout.current = null;
        }

        router.get(
            route('repairs.workbench'),
            filterQuery(Object.fromEntries(columnFilterKeys.map((filterKey) => [filterKey, filterKey === key ? value || undefined : undefined])) as Record<string, string | undefined>),
            { preserveScroll: true },
        );
    };
    const setSingleGridFilter = (key: (typeof columnFilterKeys)[number], value: string, apply: 'debounced' | 'immediate' = 'debounced'): void => {
        filtersForm.setData((current) => ({
            ...current,
            ...Object.fromEntries(columnFilterKeys.map((filterKey) => [filterKey, filterKey === key ? value : ''])),
        }));

        if (apply === 'immediate') {
            applySingleGridFilter(key, value);
            return;
        }

        if (gridFilterSubmitTimeout.current !== null) {
            window.clearTimeout(gridFilterSubmitTimeout.current);
        }

        gridFilterSubmitTimeout.current = window.setTimeout(() => {
            applySingleGridFilter(key, value);
        }, 450);
    };
    const gridFilterInputClass = 'h-8 w-full min-w-0 rounded-sm border border-[#cbd5e1] bg-white px-1.5 text-[0.72rem] font-semibold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb33]';
    const clearGridFilterHref = route(
        'repairs.workbench',
        filterQuery(Object.fromEntries(columnFilterKeys.map((key) => [key, undefined])) as Record<string, undefined>),
    );
    const sortHeaderHref = (column: SortableRepairColumn): string => {
        const currentSort = filters.ordenar_por ?? 'ticket';
        const currentDirection = filters.direccion ?? 'desc';
        const nextDirection = currentSort === column && currentDirection === 'asc' ? 'desc' : 'asc';

        return route('repairs.workbench', filterQuery({ ordenar_por: column, direccion: nextDirection }));
    };
    const sortHeaderClass = (column: SortableRepairColumn): string =>
        cn(
            'inline-flex items-center gap-1 text-left text-[0.62rem] font-black uppercase text-[#475569] no-underline hover:text-[#1d4ed8]',
            (filters.ordenar_por ?? 'ticket') === column && 'text-[#1d4ed8]',
        );
    const sortIndicator = (column: SortableRepairColumn): string => {
        if ((filters.ordenar_por ?? 'ticket') !== column) return '';

        return (filters.direccion ?? 'desc') === 'asc' ? '↑' : '↓';
    };

    const updateJob = (index: number, updater: (job: RepairJobFormData) => RepairJobFormData): void => {
        createForm.setData(
            'jobs',
            createForm.data.jobs.map((job, jobIndex) => (jobIndex === index ? updater(job) : job)),
        );
    };

    const normalizedJobsForSubmit = (): RepairJobFormData[] => createForm.data.jobs.reduce<RepairJobFormData[]>((jobs, job) => {
        const previous = jobs[jobs.length - 1];

        if (job.same_device && previous) {
            jobs.push({
                ...job,
                marca: previous.marca,
                modelo: previous.modelo,
                color: previous.color,
                categorias_reparacion: previous.categorias_reparacion,
                unlock_type: previous.unlock_type,
                unlock_value: previous.unlock_value,
            });

            return jobs;
        }

        jobs.push(job);
        return jobs;
    }, []);

    const submitCreateForm = (): void => {
        createForm.transform((data) => ({
            ...data,
            jobs: normalizedJobsForSubmit(),
        }));

        createForm.post(route('repairs.orders.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('id_orden', String(nextOrderId + 1));
                createForm.setData('contacto', '');
                createForm.setData('jobs', [createEmptyJob(states[0] ?? 'PENDIENTE')]);
                setImagePreviews({});
                setLookupFeedback('');
                setClientPreview(null);
                setCustomEstimatedDateJobs({});
                if (dniLookupTimeout.current !== null) {
                    window.clearTimeout(dniLookupTimeout.current);
                    dniLookupTimeout.current = null;
                }
                setPartSearches({});
                setActiveIntakeStep('client');
            },
            onFinish: () => createForm.transform((data) => data),
        });
    };

    const isPhoneCategory = (value: string): boolean => {
        const category = serviceCategories.find((item) => String(item.value) === String(value));

        return category?.label.trim().toLowerCase() === 'celulares';
    };

    const partSearchFromModel = (model: string): string => {
        const trimmedModel = model.trimStart();
        const brandPattern = new RegExp(`^(${phoneBrandOptions.join('|')})\\b\\s*`, 'i');

        return trimmedModel.replace(brandPattern, '').trim();
    };

    const changeJobModel = (index: number, value: string): void => {
        updateJob(index, (current) => ({ ...current, modelo: value }));

        if (isPhoneCategory(createForm.data.jobs[index]?.categorias_reparacion ?? '')) {
            setPartSearches((current) => ({ ...current, [index]: partSearchFromModel(value) }));
        }
    };

    const changeJobCategory = (index: number, value: string): void => {
        const phoneCategory = isPhoneCategory(value);

        updateJob(index, (current) => ({
            ...current,
            categorias_reparacion: value,
            marca: phoneCategory ? current.marca : '',
            unlock_type: phoneCategory ? current.unlock_type : '',
            unlock_value: phoneCategory ? current.unlock_value : '',
        }));
    };

    const changeJobBrand = (index: number, value: string): void => {
        updateJob(index, (current) => ({
            ...current,
            marca: value,
            modelo: partSearchFromModel(current.modelo),
        }));
        setPartSearches((current) => ({ ...current, [index]: partSearchFromModel(createForm.data.jobs[index]?.modelo ?? '') }));
    };

    const matchingDeviceModels = (index: number): DeviceModelOption[] => {
        const job = createForm.data.jobs[index];
        const selectedBrand = job?.marca.trim().toUpperCase() ?? '';
        const categoryId = Number(job?.categorias_reparacion ?? 0);
        const query = selectedBrand !== ''
            ? removeBrandPrefix(job?.modelo ?? '', selectedBrand)
            : normalizeDeviceSearch(job?.modelo ?? '');

        if (query.length < 2) {
            return [];
        }

        return deviceModels
            .filter((deviceModel) => {
                if (categoryId > 0 && Number(deviceModel.category_id) !== categoryId) {
                    return false;
                }

                if (selectedBrand !== '' && selectedBrand !== 'OTRAS' && (deviceModel.brand ?? '').toUpperCase() !== selectedBrand) {
                    return false;
                }

                return true;
            })
            .map((deviceModel) => {
                const modelBody = selectedBrand !== ''
                    ? removeBrandPrefix(deviceModel.model, selectedBrand)
                    : normalizeDeviceSearch(deviceModel.model);
                const tokens = modelBody.split(' ').filter(Boolean);
                let score = 0;

                if (modelBody === query) {
                    score += 120;
                }

                if (modelBody.startsWith(query)) {
                    score += 90;
                } else if (modelBody.includes(query)) {
                    score += 55;
                }

                if (tokens.some((token) => token.startsWith(query))) {
                    score += 35;
                }

                return { deviceModel, score };
            })
            .filter((item) => item.score > 0)
            .sort((left, right) => right.score - left.score || right.deviceModel.usage_count - left.deviceModel.usage_count || left.deviceModel.model.localeCompare(right.deviceModel.model, 'es'))
            .slice(0, 4)
            .map((item) => item.deviceModel);
    };

    const selectDeviceModel = (index: number, deviceModel: DeviceModelOption): void => {
        updateJob(index, (current) => ({
            ...current,
            marca: isPhoneCategory(current.categorias_reparacion) && deviceModel.brand ? deviceModel.brand : current.marca,
            modelo: partSearchFromModel(deviceModel.model),
        }));
        setPartSearches((current) => ({ ...current, [index]: partSearchFromModel(deviceModel.model) }));
    };

    const hasExactDeviceModel = (index: number): boolean => {
        const job = createForm.data.jobs[index];
        const categoryId = Number(job?.categorias_reparacion ?? 0);
        const normalizedModel = normalizeDeviceSearch(job?.modelo ?? '');

        return normalizedModel !== '' && deviceModels.some((deviceModel) => Number(deviceModel.category_id) === categoryId && deviceModel.normalized_model === normalizedModel);
    };

    const renderDeviceModelSuggestions = (index: number): JSX.Element | null => {
        const job = createForm.data.jobs[index];
        const suggestions = matchingDeviceModels(index);
        const typedModel = job?.modelo.trim() ?? '';

        if (suggestions.length === 0) {
            return typedModel.length >= 2 && !hasExactDeviceModel(index)
                ? <span className="text-xs font-semibold text-[#64748b]">Se guardará como nuevo modelo.</span>
                : null;
        }

        return (
            <div className="mt-2 grid gap-1">
                {suggestions.map((deviceModel) => (
                    <button
                        key={deviceModel.id}
                        type="button"
                        className="flex min-h-8 items-center justify-between gap-3 rounded-md border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-left text-sm font-bold text-[#0f172a] transition hover:border-[#2563eb] hover:bg-[#eff6ff]"
                        onClick={() => selectDeviceModel(index, deviceModel)}
                    >
                        <span className="truncate">{deviceModel.model}</span>
                        <span className="shrink-0 text-xs font-semibold text-[#64748b]">{deviceModel.usage_count}</span>
                    </button>
                ))}
            </div>
        );
    };

    const blankJobFromSameDevice = (source?: RepairJobFormData): RepairJobFormData => {
        const base = createEmptyJob(states[0] ?? 'PENDIENTE');

        if (!source) {
            return base;
        }

        return {
            ...base,
            same_device: true,
            marca: source.marca,
            modelo: source.modelo,
            color: source.color,
            categorias_reparacion: source.categorias_reparacion,
            unlock_type: source.unlock_type,
            unlock_value: source.unlock_value,
            fecha_estimada: source.fecha_estimada,
            observaciones: source.observaciones,
        };
    };

    const addJob = (job?: RepairJobFormData): void => {
        createForm.setData('jobs', [...createForm.data.jobs, job ? { ...job, images: null } : createEmptyJob(states[0] ?? 'PENDIENTE')]);
    };

    const addJobForSameDevice = (): void => {
        const source = createForm.data.jobs[createForm.data.jobs.length - 1];
        createForm.setData('jobs', [...createForm.data.jobs, blankJobFromSameDevice(source)]);
    };

    const removeJob = (index: number): void => {
        if (createForm.data.jobs.length <= 1) {
            return;
        }

        createForm.setData(
            'jobs',
            createForm.data.jobs.filter((_, jobIndex) => jobIndex !== index),
        );
        setImagePreviews((current) => {
            const next: Record<number, string[]> = {};
            Object.entries(current).forEach(([key, value]) => {
                const numericKey = Number(key);
                if (numericKey < index) {
                    next[numericKey] = value;
                } else if (numericKey > index) {
                    next[numericKey - 1] = value;
                }
            });
            return next;
        });
    };

    const duplicateJob = (index: number): void => {
        addJob(createForm.data.jobs[index]);
        setDuplicateNotice('Reparacion duplicada');
        window.setTimeout(() => setDuplicateNotice(''), 1800);
    };

    const matchingInventoryParts = (index: number): RepairPartInventoryOption[] => {
        const query = (partSearches[index] ?? createForm.data.jobs[index]?.repuesto ?? '').trim().toLowerCase();

        if (query.length < 2) {
            return [];
        }

        return partInventory
            .filter((part) => part.quantity > 0 && part.model.toLowerCase().includes(query))
            .slice(0, 8);
    };

    const selectInventoryPart = (index: number, part: RepairPartInventoryOption): void => {
        updateJob(index, (job) => ({
            ...job,
            repuesto: part.model,
            pedir_repuesto: false,
            inventory_part_id: String(part.id),
            estado: job.estado === 'EN REPARACION / ESPERA REPUESTO' ? 'PENDIENTE' : job.estado,
        }));
        setPartSearches((current) => ({ ...current, [index]: part.model }));
    };

    const clearInventoryPart = (index: number): void => {
        updateJob(index, (job) => ({
            ...job,
            inventory_part_id: '',
        }));
    };

    const clearAmountForTyping = (index: number, field: 'monto' | 'senia'): void => {
        const value = createForm.data.jobs[index]?.[field] ?? '';

        if (value.trim() === '' || Number(value) === 0) {
            updateJob(index, (current) => ({ ...current, [field]: '' }));
        }
    };

    const preventAmountArrowStep = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
        }
    };

    const totals = createForm.data.jobs.reduce(
        (carry, job) => {
            const monto = Number.parseFloat(job.monto || '0');
            const senia = Number.parseFloat(job.senia || '0');

            return {
                monto: carry.monto + (Number.isFinite(monto) ? monto : 0),
                senia: carry.senia + (Number.isFinite(senia) ? senia : 0),
            };
        },
        { monto: 0, senia: 0 },
    );
    const jobSubtotalRows = createForm.data.jobs.map((job, index) => {
        const amount = Number.parseFloat(job.monto || '0');
        const deposit = Number.parseFloat(job.senia || '0');
        const description = job.descripcion.split('\n').map((line) => line.trim()).filter(Boolean)[0] ?? '';
        const model = [job.marca, job.modelo].map((value) => value.trim()).filter(Boolean).join(' ');

        return {
            index,
            model: model !== '' ? model : 'Sin modelo',
            description: description !== '' ? description : 'Sin falla cargada',
            amount: Number.isFinite(amount) ? amount : 0,
            deposit: Number.isFinite(deposit) ? deposit : 0,
        };
    });
    const groupedJobIndexes = (index: number): number[] => {
        const indexes = [index];
        let nextIndex = index + 1;

        while (createForm.data.jobs[nextIndex]?.same_device) {
            indexes.push(nextIndex);
            nextIndex += 1;
        }

        return indexes;
    };

    const formatMoney = (value: number): string => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const cashDiscountApplies = (cashAmount: number): boolean => {
        return ticketPricing.cashDiscountEnabled
            && ticketPricing.cashDiscountPercentage > 0
            && cashAmount > ticketPricing.cashDiscountThreshold;
    };
    const regularPriceForCashAmount = (cashAmount: number): number => {
        return cashDiscountApplies(cashAmount)
            ? Math.round(Math.max(0, cashAmount) * (1 + ticketPricing.cashDiscountPercentage / 100))
            : Math.max(0, cashAmount);
    };
    const regularPriceLabel = (value: string): string => {
        const amount = Number(value || 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            return 'Regular sin descuento: sin monto';
        }

        return cashDiscountApplies(amount)
            ? `Regular sin descuento: ${formatMoney(regularPriceForCashAmount(amount))}`
            : 'Regular sin descuento: mismo importe';
    };
    const regularPriceIndicator = (value: string, compact = false): JSX.Element => {
        const amount = Number(value || 0);
        const applies = Number.isFinite(amount) && amount > 0 && cashDiscountApplies(amount);

        return (
            <span className={cn(
                'block text-xs font-semibold leading-5',
                compact ? 'text-[#64748b]' : 'text-[#475569]',
                applies && 'font-black text-[#92400e]',
            )}>
                {regularPriceLabel(value)}
            </span>
        );
    };
    const regularTotal = regularPriceForCashAmount(totals.monto);
    const repairLabelClass = 'grid min-w-0 content-start gap-1.5 text-sm font-semibold leading-tight text-[#334155]';
    const compactInputClass = ui.repairDenseInput;
    const guidedFieldClass = 'border-[#2563eb] bg-[#eff6ff] ring-1 ring-[#2563eb33]';
    const guidedLabelClass = 'rounded-md border border-[#2563eb] bg-[#eff6ff] p-2 ring-1 ring-[#2563eb33]';
    const compactTextareaClass = ui.repairDenseTextarea;
    const fieldPanelBase = 'min-w-0 rounded-lg border p-3';
    const fieldPanelBlue = `${fieldPanelBase} border-[#cbd5e1] bg-white`;
    const fieldPanelGreen = `${fieldPanelBase} border-[#bbf7d0] bg-[#f0fdf4]`;
    const fieldPanelAmber = `${fieldPanelBase} border-[#fed7aa] bg-[#fff7ed]`;
    const fieldPanelPurple = `${fieldPanelBase} border-[#ddd6fe] bg-[#f5f3ff]`;

    const nextCreateFlowField = (): CreateFlowField | null => {
        if (createForm.data.id_orden.trim() === '') {
            return 'order-id';
        }

        if (createForm.data.nombre_cliente.trim() === '') {
            return 'customer-name';
        }

        for (const [index, job] of createForm.data.jobs.entries()) {
            if (isPhoneCategory(job.categorias_reparacion) && job.marca.trim() === '') {
                return `job-${index}-brand`;
            }

            if (job.modelo.trim() === '') {
                return `job-${index}-model`;
            }

            if (job.descripcion.trim() === '') {
                return `job-${index}-description`;
            }

            if (job.monto.trim() === '' || Number(job.monto) <= 0) {
                return `job-${index}-amount`;
            }

            if (job.fecha_estimada.trim() === '') {
                return `job-${index}-date`;
            }
        }

        return null;
    };

    const activeCreateFlowField = nextCreateFlowField();
    const isGuidedField = (field: CreateFlowField): boolean => activeCreateFlowField === field;
    const guidedPanelClass = (baseClass: string, field: CreateFlowField): string => cn(baseClass, isGuidedField(field) && guidedFieldClass);
    const guidedInputClass = (field: CreateFlowField, baseClass = compactInputClass): string => cn(baseClass, isGuidedField(field) && 'border-[#2563eb] bg-[#eff6ff] ring-2 ring-[#2563eb24]');
    const guidedInlineLabelClass = (field: CreateFlowField): string => cn(repairLabelClass, isGuidedField(field) && guidedLabelClass);
    const intakeSteps: { key: IntakeStep; label: string }[] = [
        { key: 'client', label: 'Cliente' },
        { key: 'device', label: 'Equipo y fallas' },
        { key: 'extras', label: 'Fotos y repuesto' },
        { key: 'summary', label: 'Resumen' },
    ];
    const activeIntakeStepIndex = Math.max(0, intakeSteps.findIndex((step) => step.key === activeIntakeStep));
    const showIntakeStep = (step: IntakeStep): boolean => !isWizardIntake || activeIntakeStep === step;
    const hasValidAmount = (value: string): boolean => {
        const amount = Number(value || 0);

        return Number.isFinite(amount) && amount > 0;
    };
    const isIntakeStepComplete = (step: IntakeStep): boolean => {
        if (step === 'client') {
            return createForm.data.id_orden.trim() !== '' && createForm.data.nombre_cliente.trim() !== '';
        }

        if (step === 'device') {
            return createForm.data.jobs.every((job) => {
                const hasDeviceData = job.same_device || (
                    job.modelo.trim() !== ''
                    && (!isPhoneCategory(job.categorias_reparacion) || job.marca.trim() !== '')
                );

                return hasDeviceData && job.descripcion.trim() !== '' && hasValidAmount(job.monto);
            });
        }

        if (step === 'extras') {
            return createForm.data.jobs.every((job) => job.fecha_estimada.trim() !== '');
        }

        return true;
    };
    const canGoToNextIntakeStep = isIntakeStepComplete(activeIntakeStep);
    const canSelectIntakeStep = (targetIndex: number): boolean => {
        if (targetIndex <= activeIntakeStepIndex) {
            return true;
        }

        return intakeSteps.slice(0, targetIndex).every((step) => isIntakeStepComplete(step.key));
    };
    const goToPreviousIntakeStep = (): void => {
        setActiveIntakeStep(intakeSteps[Math.max(0, activeIntakeStepIndex - 1)].key);
    };
    const goToNextIntakeStep = (): void => {
        if (!canGoToNextIntakeStep) {
            return;
        }

        setActiveIntakeStep(intakeSteps[Math.min(intakeSteps.length - 1, activeIntakeStepIndex + 1)].key);
    };

    const descriptionOptions = [
        ...serviceTemplates.map((template) => ({
            key: `service:${template.value}`,
            label: template.label,
            type: 'service' as const,
            value: template.value,
            usage: serviceOptionUsage[`service:${template.value}`] ?? 0,
        })),
        ...failureTemplates.map((template) => ({
            key: `failure:${template.value}`,
            label: template.label,
            type: 'failure' as const,
            value: template.description,
            usage: serviceOptionUsage[`failure:${template.value}`] ?? 0,
        })),
    ].sort((left, right) => right.usage - left.usage || left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));

    const applyDescriptionOption = (index: number, optionKey: string): void => {
        const option = descriptionOptions.find((item) => item.key === optionKey);

        if (!option) {
            return;
        }

        if (option.type === 'service') {
            applyTemplate(index, option.value);
            return;
        }

        applyFailureTemplate(index, option.value);
    };

    const addFailureFromSelectedOption = (index: number, selectedOptionKey?: string): void => {
        const optionKey = selectedOptionKey ?? pendingFailureOptions[index] ?? '';
        const option = descriptionOptions.find((item) => item.key === optionKey);

        if (!option) {
            return;
        }

        const source = createForm.data.jobs[index];
        const nextJob = blankJobFromSameDevice(source);
        const description = option.type === 'service'
            ? (serviceTemplates.find((item) => item.value === option.value)?.description ?? '')
            : option.value;
        const repuesto = option.type === 'service'
            ? (serviceTemplates.find((item) => item.value === option.value)?.repuesto ?? '')
            : '';

        if (source.descripcion.trim() === '') {
            updateJob(index, (job) => ({
                ...job,
                tipo_servicio: option.type === 'service' ? option.value : job.tipo_servicio,
                descripcion: description,
                repuesto: job.repuesto.trim() === '' ? repuesto : job.repuesto,
            }));
            setPendingFailureOptions((current) => ({ ...current, [index]: '' }));
            return;
        }

        createForm.setData('jobs', [
            ...createForm.data.jobs.slice(0, index + 1),
            {
                ...nextJob,
                tipo_servicio: option.type === 'service' ? option.value : '',
                descripcion: description,
                repuesto,
            },
            ...createForm.data.jobs.slice(index + 1),
        ]);
        setPendingFailureOptions((current) => ({ ...current, [index]: '' }));
    };

    const applyTemplate = (index: number, serviceType: string): void => {
        const template = serviceTemplates.find((item) => item.value === serviceType);
        const description = template?.description ?? '';

        updateJob(index, (job) => ({
            ...job,
            tipo_servicio: serviceType,
            descripcion: description !== ''
                ? [...job.descripcion.split('\n').map((line) => line.trim()).filter(Boolean), description]
                    .filter((line, lineIndex, lines) => lines.indexOf(line) === lineIndex)
                    .join('\n')
                : job.descripcion,
            repuesto: job.repuesto.trim() === '' ? template?.repuesto ?? '' : job.repuesto,
        }));
    };

    const applyFailureTemplate = (index: number, template: string): void => {
        updateJob(index, (job) => ({
            ...job,
            descripcion: [...job.descripcion.split('\n').map((line) => line.trim()).filter(Boolean), template]
                .filter((line, lineIndex, lines) => lines.indexOf(line) === lineIndex)
                .join('\n'),
        }));
    };

    const togglePartRequest = (index: number, checked: boolean): void => {
        updateJob(index, (job) => ({
            ...job,
            pedir_repuesto: checked,
            inventory_part_id: checked ? '' : job.inventory_part_id,
            estado: checked && job.estado === 'PENDIENTE'
                ? 'EN REPARACION / ESPERA REPUESTO'
                : (!checked && job.estado === 'EN REPARACION / ESPERA REPUESTO' ? 'PENDIENTE' : job.estado),
        }));
    };

    const setJobImageFiles = (index: number, files: File[]): void => {
        const currentFiles = createForm.data.jobs[index]?.images ?? [];
        const selected = [...currentFiles, ...files].slice(0, 2);

        updateJob(index, (job) => ({
            ...job,
            images: selected,
        }));
        setImagePreviews((current) => ({
            ...current,
            [index]: selected.map((file) => URL.createObjectURL(file)),
        }));
    };

    const setJobImages = (index: number, files: FileList | null): void => {
        setJobImageFiles(index, Array.from(files ?? []));
    };

    const removeJobImage = (jobIndex: number, imageIndex: number): void => {
        const currentFiles = createForm.data.jobs[jobIndex]?.images ?? [];
        const selected = currentFiles.filter((_, index) => index !== imageIndex);

        updateJob(jobIndex, (job) => ({
            ...job,
            images: selected,
        }));
        setImagePreviews((current) => ({
            ...current,
            [jobIndex]: (current[jobIndex] ?? []).filter((_, index) => index !== imageIndex),
        }));
    };

    const handleDniChange = (value: string): void => {
        createForm.setData('dni', value);
        setClientPreview(null);
        setLookupFeedback('');

        if (dniLookupTimeout.current !== null) {
            window.clearTimeout(dniLookupTimeout.current);
            dniLookupTimeout.current = null;
        }

        if (value.trim().length >= 7) {
            dniLookupTimeout.current = window.setTimeout(() => {
                void lookupByDni(value, true);
            }, 650);
        }
    };

    const lookupByDni = async (dniValue = createForm.data.dni, automatic = false): Promise<void> => {
        const dni = dniValue.trim();

        if (dni === '') {
            setClientPreview(null);
            if (automatic) {
                return;
            }
            setLookupFeedback('Ingresá un DNI para recuperar datos previos.');
            return;
        }

        setLookupBusy(true);
        setLookupFeedback('');
        setClientPreview(null);

        try {
            const response = await window.fetch(`${route('repairs.lookup')}?dni=${encodeURIComponent(dni)}`, {
                headers: {
                    Accept: 'application/json',
                },
            });

            const payload = (await response.json()) as ClientLookupPreview | null;

            if (!response.ok || !payload) {
                if (automatic) {
                    return;
                }
                setLookupFeedback('No encontramos un cliente previo con ese DNI.');
                return;
            }

            setClientPreview(payload);
        } catch {
            if (automatic) {
                return;
            }
            setLookupFeedback('No se pudo consultar el DNI en este momento.');
        } finally {
            setLookupBusy(false);
        }
    };

    const importClientPreview = (): void => {
        if (!clientPreview) {
            return;
        }

        createForm.setData((current) => ({
            ...current,
            nombre_cliente: clientPreview.nombre_cliente ?? current.nombre_cliente,
            dni: clientPreview.dni ? String(clientPreview.dni) : current.dni,
            contacto: clientPreview.contacto ?? current.contacto,
        }));
        setLookupFeedback(`Datos importados desde la orden #${clientPreview.ultima_orden ?? '-'}.`);
        setClientPreview(null);
    };

    const dateShortcutFor = (value: string): DateShortcutValue => {
        if (value === localDateWithOffset(0)) return 'today';
        if (value === localDateWithOffset(1)) return 'tomorrow';
        if (value === localDateWithOffset(2)) return 'day-after';

        return 'custom';
    };

    const applyEstimatedDateShortcut = (index: number, value: DateShortcutValue): void => {
        if (value === 'custom') {
            setCustomEstimatedDateJobs((current) => ({ ...current, [index]: true }));
            return;
        }

        const offset = value === 'today' ? 0 : value === 'tomorrow' ? 1 : 2;
        setCustomEstimatedDateJobs((current) => ({ ...current, [index]: false }));
        updateJob(index, (current) => ({ ...current, fecha_estimada: localDateWithOffset(offset) }));
    };

    const renderEstimatedDateField = (index: number, job: RepairJobFormData, inputClassName: string): JSX.Element => {
        const shortcut = customEstimatedDateJobs[index] ? 'custom' : dateShortcutFor(job.fecha_estimada);

        return (
            <div className="grid gap-2">
                <select
                    className={inputClassName}
                    value={shortcut}
                    onChange={(event) => applyEstimatedDateShortcut(index, event.target.value as DateShortcutValue)}
                >
                    <option value="today">Hoy</option>
                    <option value="tomorrow">Mañana</option>
                    <option value="day-after">Pasado</option>
                    <option value="custom">Otro</option>
                </select>
                {shortcut === 'custom' ? (
                    <input
                        className={inputClassName}
                        type="date"
                        value={job.fecha_estimada}
                        onChange={(event) => {
                            setCustomEstimatedDateJobs((current) => ({ ...current, [index]: true }));
                            updateJob(index, (current) => ({ ...current, fecha_estimada: event.target.value }));
                        }}
                    />
                ) : null}
            </div>
        );
    };

    const renderClientPreview = (className = ''): JSX.Element | null => clientPreview ? (
        <div className={cn('rounded-md border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-sm text-[#14532d]', className)}>
            <div className="grid gap-1 font-semibold">
                <span>Cliente encontrado en orden #{clientPreview.ultima_orden ?? '-'}</span>
                <span>{clientPreview.nombre_cliente ?? 'Sin nombre'} - DNI {clientPreview.dni ?? '-'}</span>
                <span>Contacto: {clientPreview.contacto && clientPreview.contacto.trim() !== '' ? clientPreview.contacto : 'Sin contacto'}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <button className={buttonClass('success', 'sm')} type="button" onClick={importClientPreview}>
                    <FaCheckCircle aria-hidden="true" /> Importar datos
                </button>
                <button className={buttonClass('soft', 'sm')} type="button" onClick={() => setClientPreview(null)}>
                    Ignorar
                </button>
            </div>
        </div>
    ) : null;

    const renderDesktopDateGroups = (groups: TicketDateGroup[]): JSX.Element[] =>
        groups.flatMap((group) => [
            <div key={`desktop-date-group-${group.key}`} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-l-4 border-b-[#0f2f63] border-l-[#38bdf8] bg-[#123f91] px-3 py-2 text-xs font-black text-white">
                <span>{group.label}</span>
                <span className="text-[#dbeafe]">{group.count} ticket{group.count === 1 ? '' : 's'} - {group.repairCount} reparacion{group.repairCount === 1 ? '' : 'es'}</span>
            </div>,
            ...group.tickets.flatMap((ticket) => {
                const expanded = expandedDesktopTickets[ticket.id] ?? false;
                const desktopRepairs = expanded ? ticket.repairs : ticket.repairs.slice(0, 1);

                return desktopRepairs.map((repair, repairIndex) => (
                    <RepairDesktopRow
                        key={`desktop-table-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                        ticket={ticket}
                        repair={repair}
                        serviceCategories={serviceCategories}
                        serviceTemplates={serviceTemplates}
                        partInventory={partInventory}
                        highlightTerm={highlightTerm}
                        rowIndex={repairIndex}
                        rowTotal={ticket.repairs.length}
                        desktopGroupExpanded={expanded}
                        onToggleDesktopGroup={repairIndex === 0 && ticket.repairs.length > 1 ? () => toggleDesktopTicket(ticket.id) : undefined}
                    />
                ));
            }),
        ]);

    const renderMobileDateGroups = (groups: TicketDateGroup[]): JSX.Element[] =>
        groups.map((group) => (
            <section key={`mobile-date-group-${group.key}`} className="grid gap-2">
                <div className="flex items-center justify-between gap-2 rounded-lg border border-[#123f91] bg-[#123f91] px-3 py-2 text-sm font-black text-white">
                    <span>{group.label}</span>
                    <span className="text-xs text-[#dbeafe]">{group.count} ticket{group.count === 1 ? '' : 's'}</span>
                </div>
                {group.tickets.map((ticket) => (
                    <RepairTicketPanel
                        key={ticket.id}
                        ticket={ticket}
                        states={states}
                        serviceCategories={serviceCategories}
                        serviceTemplates={serviceTemplates}
                        partInventory={partInventory}
                        highlightTerm={highlightTerm}
                        allowAddRepair
                    />
                ))}
            </section>
        ));

    const renderDesktopTaskTickets = (taskTicketsList: RepairTicketView[]): JSX.Element[] =>
        taskTicketsList.flatMap((ticket) => {
            const expanded = expandedDesktopTickets[ticket.id] ?? true;
            const desktopRepairs = expanded ? ticket.repairs : ticket.repairs.slice(0, 1);

            return desktopRepairs.map((repair, repairIndex) => (
                <RepairDesktopRow
                    key={`desktop-task-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                    ticket={ticket}
                    repair={repair}
                    serviceCategories={serviceCategories}
                    serviceTemplates={serviceTemplates}
                    partInventory={partInventory}
                    highlightTerm={highlightTerm}
                    rowIndex={repairIndex}
                    rowTotal={ticket.repairs.length}
                    desktopGroupExpanded={expanded}
                    onToggleDesktopGroup={repairIndex === 0 && ticket.repairs.length > 1 ? () => toggleDesktopTicket(ticket.id) : undefined}
                />
            ));
        });

    const renderMobileTaskTickets = (taskTicketsList: RepairTicketView[]): JSX.Element[] =>
        taskTicketsList.map((ticket) => (
            <RepairTicketPanel
                key={`mobile-task-${ticket.id}`}
                ticket={ticket}
                states={states}
                serviceCategories={serviceCategories}
                serviceTemplates={serviceTemplates}
                partInventory={partInventory}
                highlightTerm={highlightTerm}
                allowAddRepair
            />
        ));

    const renderDesktopDeliveredSearchTickets = (): JSX.Element[] =>
        deliveredSearchTickets.flatMap((ticket) => (
            ticket.repairs.map((repair, repairIndex) => (
                <RepairDesktopRow
                    key={`desktop-delivered-search-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                    ticket={ticket}
                    repair={repair}
                    serviceCategories={serviceCategories}
                    serviceTemplates={serviceTemplates}
                    partInventory={partInventory}
                    readOnly
                    highlightTerm={highlightTerm}
                    rowIndex={repairIndex}
                    rowTotal={ticket.repairs.length}
                    desktopGroupExpanded
                    statusLabel={(item) => deliveredStatusLabel(item.fecha_entregado)}
                />
            ))
        ));

    const renderMobileDeliveredSearchTickets = (): JSX.Element[] =>
        deliveredSearchTickets.map((ticket) => (
            <RepairTicketPanel
                key={`mobile-delivered-search-${ticket.id}`}
                ticket={ticket}
                states={states}
                serviceCategories={serviceCategories}
                serviceTemplates={serviceTemplates}
                partInventory={partInventory}
                readOnly
                highlightTerm={highlightTerm}
                statusLabel={(repair) => deliveredStatusLabel(repair.fecha_entregado)}
            />
        ));

    return (
        <RepairLayout title={isConsultas ? 'Consultas' : 'Ingreso'}>
            {isConsultas ? (
            <section className="sticky top-2 z-20 grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-2 text-[#0f172a] shadow-[0_6px_18px_rgba(15,23,42,0.10)] xl:hidden">
                <form
                    className="grid grid-cols-[minmax(0,1fr)_42px_42px] gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submitCleanSearch(true);
                    }}
                >
                    <input
                        className="min-h-10 min-w-0 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar orden"
                        value={filtersForm.data.q}
                        onChange={(event) => filtersForm.setData('q', event.target.value)}
                    />
                    <button type="submit" className="grid min-h-10 place-items-center rounded-md bg-[#2563eb] text-white" aria-label="Buscar">
                        <FaSearch aria-hidden="true" />
                    </button>
                    <button type="button" className="relative grid min-h-10 min-w-0 place-items-center rounded-md border border-[#cbd5e1] bg-white text-[#334155]" onClick={() => setMobileFiltersOpen(true)} aria-label="Abrir filtros">
                        <FaFilter aria-hidden="true" />
                        {activeMobileFilters > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-[#ef4444] px-1 text-[0.65rem] font-bold text-white">{activeMobileFilters}</span> : null}
                    </button>
                </form>
                <div className="flex flex-wrap gap-1.5">
                    {searchFieldOptions.map((option) => {
                        const active = activeSearchFields.includes(option.key);

                        return (
                            <button
                                key={option.key}
                                type="button"
                                className={cn(
                                    'min-h-8 rounded-md border px-2 text-[0.68rem] font-bold transition',
                                    active
                                        ? 'border-[#2563eb] bg-[#2563eb] text-white'
                                        : 'border-[#bfdbfe] bg-white text-[#1d4ed8] hover:border-[#2563eb] hover:bg-[#eff6ff]',
                                )}
                                onClick={() => toggleSearchField(option.key)}
                                aria-pressed={active}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[0.68rem] font-bold text-[#334155]">
                    <Link
                        href={route('repairs.workbench')}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', !filters.estado && !filters.prioridad ? 'bg-white text-[#1d4ed8] ring-2 ring-[#bfdbfe]' : 'bg-[#eff6ff] text-[#334155]')}
                    >
                        Todas {summary.active}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { estado: 'PENDIENTE' })}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', filters.estado === 'PENDIENTE' ? 'bg-white text-[#d97706] ring-2 ring-[#fed7aa]' : 'bg-[#fff7ed] text-[#334155]')}
                    >
                        Pend. {summary.pending}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { estado: 'LISTA' })}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', filters.estado === 'LISTA' ? 'bg-white text-[#15803d] ring-2 ring-[#bbf7d0]' : 'bg-[#ecfdf5] text-[#334155]')}
                    >
                        Listas {summary.ready}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'tareas' })}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', filters.prioridad === 'tareas' ? 'bg-white text-[#854d0e] ring-2 ring-[#fde68a]' : 'bg-[#fefce8] text-[#334155]')}
                    >
                        Tareas {summary.tasks}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'vencidas' })}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', filters.prioridad === 'vencidas' ? 'bg-white text-[#b91c1c] ring-2 ring-[#fecdd3]' : 'bg-[#fff1f2] text-[#334155]')}
                    >
                        Venc. {summary.overdue}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'hoy' })}
                        preserveScroll
                        className={cn('whitespace-nowrap rounded-md px-2 py-1 no-underline', filters.prioridad === 'hoy' ? 'bg-white text-[#854d0e] ring-2 ring-[#fde68a]' : 'bg-[#fefce8] text-[#334155]')}
                    >
                        Hoy {summary.today}
                    </Link>
                </div>
                <div className="rounded-md border border-[#dbeafe] bg-[#f8fbff] px-2 py-1 text-[0.72rem] font-black text-[#334155]">
                    Activas {summary.active} · Tareas {summary.tasks} · Entregadas {summary.delivered}
                </div>
            </section>
            ) : null}

            {isConsultas ? (
            <section className="hidden rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-[#0f172a] shadow-sm xl:block">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-[0.78rem] font-black text-[#174ea6]">Período</span>
                        {periodOptions.map((option) => (
                            <FilterPill
                                key={option.value}
                                label={option.label}
                                href={route(
                                    'repairs.workbench',
                                    cleanQuery({
                                        summary_range: option.value,
                                        summary_from: option.value === 'custom' ? filters.summary_from : undefined,
                                        summary_to: option.value === 'custom' ? filters.summary_to : undefined,
                                    }),
                                )}
                                active={summaryRange === option.value}
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-[0.78rem] font-black text-[#174ea6]">Categorías</span>
                        {categoryOptions.map((option) => (
                            <FilterPill
                                key={option.value || 'all'}
                                label={option.label}
                                href={option.value === ''
                                    ? route('repairs.workbench')
                                    : route('repairs.workbench', { categoria_filter: option.value })}
                                active={categoryFilter === option.value}
                            />
                        ))}
                    </div>
                </div>
            </section>
            ) : null}

            {isConsultas && summaryRange === 'custom' ? (
                <form
                    className="hidden gap-2 rounded-lg border border-[#b8d3f7] bg-[#f8fbff] p-3 shadow-sm md:grid-cols-[180px_180px_auto] md:items-end xl:grid"
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            route('repairs.workbench'),
                            cleanQuery({
                                ...filtersForm.data,
                                q: filtersForm.data.q.trim(),
                                q_fields: filtersForm.data.q.trim() !== '' ? searchFieldsQuery : undefined,
                            }),
                            { preserveScroll: true },
                        );
                    }}
                >
                    <input type="hidden" name="summary_range" value="custom" />
                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                        Desde
                        <input
                            className="min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-bold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                            type="date"
                            value={filtersForm.data.summary_from}
                            onChange={(event) => filtersForm.setData('summary_from', event.target.value)}
                            required
                        />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                        Hasta
                        <input
                            className="min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-bold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                            type="date"
                            value={filtersForm.data.summary_to}
                            onChange={(event) => filtersForm.setData('summary_to', event.target.value)}
                            required
                        />
                    </label>
                    <button className="min-h-10 rounded-md border border-[#2563eb] bg-[#2563eb] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1d4ed8]" type="submit">
                        Aplicar
                    </button>
                </form>
            ) : null}

            {isConsultas && archivedSearchMatches > 0 ? (
                <div className="rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#334155] shadow-sm">
                    Encontrado en archivados: {archivedSearchMatches} {archivedSearchMatches === 1 ? 'coincidencia' : 'coincidencias'}.{' '}
                    <Link className="underline decoration-2 underline-offset-2" href={route('repairs.archived', cleanQuery({ q: filters.q ?? '', q_fields: filters.q ? searchFieldsQuery : undefined }))}>
                        Ir a archivados.php
                    </Link>
                </div>
            ) : null}

            {isConsultas ? (
            <section className="hidden grid-cols-2 gap-2 md:grid-cols-4 xl:grid xl:grid-cols-9">
                <SummaryFilterCard label="Total órdenes" value={summary.active} trend="En consultas" tone="blue" href={route('repairs.workbench')} active={!filters.estado && !filters.prioridad} icon={<FaClipboardList aria-hidden="true" />} />
                <SummaryFilterCard label="Tareas" value={summary.tasks} trend="Cola FIFO" tone="brown" href={route('repairs.workbench', { prioridad: 'tareas' })} active={filters.prioridad === 'tareas'} icon={<FaClipboardCheck aria-hidden="true" />} />
                <SummaryFilterCard label="Pendientes" value={summary.pending} trend="En trabajo" tone="orange" href={route('repairs.workbench', { estado: 'PENDIENTE' })} active={filters.estado === 'PENDIENTE'} icon={<FaTools aria-hidden="true" />} />
                <SummaryFilterCard label="En reparación" value={summary.inRepair} trend="Espera / repuesto" tone="purple" href={route('repairs.workbench', { estado: 'EN REPARACION / ESPERA REPUESTO' })} active={filters.estado === 'EN REPARACION' || filters.estado === 'EN REPARACION / ESPERA REPUESTO'} icon={<FaWrench aria-hidden="true" />} />
                <SummaryFilterCard label="Listas" value={summary.ready} trend="Para retirar" tone="green" href={route('repairs.workbench', { estado: 'LISTA' })} active={filters.estado === 'LISTA'} icon={<FaCheckCircle aria-hidden="true" />} />
                <SummaryFilterCard label="Vencidas" value={summary.overdue} trend="Prioridad alta" tone="red" href={route('repairs.workbench', { prioridad: 'vencidas' })} active={filters.prioridad === 'vencidas'} icon={<FaHourglassEnd aria-hidden="true" />} />
                <SummaryFilterCard label="Retiran hoy" value={summary.today} trend="Agendadas hoy" tone="yellow" href={route('repairs.workbench', { prioridad: 'hoy' })} active={filters.prioridad === 'hoy'} icon={<FaCalendarDay aria-hidden="true" />} />
                <SummaryFilterCard label="Canceladas" value={summary.cancelled} trend="No continuadas" tone="red" href={route('repairs.workbench', { estado: 'CANCELADA' })} active={filters.estado === 'CANCELADA'} icon={<FaBan aria-hidden="true" />} />
                <SummaryFilterCard label="Entregadas" value={summary.delivered} trend="Registradas" tone="cyan" href={route('repairs.delivered')} icon={<FaTruck aria-hidden="true" />} />
            </section>
            ) : null}

            <section className="hidden">
                <SummaryCard label="Total órdenes" value={summary.active + summary.delivered} trend="En sistema" tone="blue" />
                <SummaryCard label="Pendientes" value={summary.pending} trend="En trabajo" tone="orange" />
                <SummaryCard label="En reparación" value={summary.inRepair + summary.waitingParts} trend="En espera / repuesto" tone="amber" />
                <SummaryCard label="Listas" value={summary.ready} trend="Listas para retirar" tone="green" />
                <SummaryCard label="Activas" value={summary.active} trend="Consultas abiertas" tone="red" />
                <SummaryCard label="Entregadas" value={summary.delivered} trend="Registradas" tone="cyan" />
            </section>

            {isConsultas ? (
            <form
                className="hidden rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 shadow-sm xl:block"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitCleanSearch();
                }}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[360px] flex-[0_1_48%]">
                    <input
                        className="min-h-10 w-full rounded-md border border-[#cbd5e1] bg-white py-2 pl-3 pr-10 text-sm font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar por ID, cliente, DNI, contacto o modelo"
                        value={filtersForm.data.q}
                        onChange={(event) => filtersForm.setData('q', event.target.value)}
                    />
                        <button
                            type="submit"
                            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-[#2563eb] transition hover:bg-[#eff6ff]"
                            aria-label="Buscar"
                        >
                            <FaSearch aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex min-w-[420px] flex-1 flex-wrap items-center gap-1.5">
                        {searchFieldOptions.map((option) => {
                            const active = activeSearchFields.includes(option.key);

                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={cn(
                                        'min-h-8 rounded-md border px-2.5 text-[0.72rem] font-bold transition',
                                        active
                                            ? 'border-[#2563eb] bg-[#2563eb] text-white'
                                            : 'border-[#bfdbfe] bg-white text-[#1d4ed8] hover:border-[#2563eb] hover:bg-[#eff6ff]',
                                    )}
                                    onClick={() => toggleSearchField(option.key)}
                                    aria-pressed={active}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-[0.72rem] font-black text-[#64748b]">
                        <span>{visibleRepairs} reparaciones</span>
                        <span className="h-4 w-px bg-[#cbd5e1]" aria-hidden="true" />
                        <span>{tickets.length} tickets</span>
                    </div>
                </div>
            </form>
            ) : null}

            {isConsultas && mobileFiltersOpen ? (
                <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 xl:hidden" role="dialog" aria-modal="true">
                    <form
                        className="max-h-[86vh] w-full overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg"
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                route('repairs.workbench'),
                                cleanQuery({
                                    ...filtersForm.data,
                                    q: filtersForm.data.q.trim(),
                                    q_fields: filtersForm.data.q.trim() !== '' ? searchFieldsQuery : undefined,
                                }),
                                {
                                    preserveScroll: true,
                                    onFinish: () => setMobileFiltersOpen(false),
                                },
                            );
                        }}
                    >
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <h2 className="text-base font-black text-[#0f172a]">Filtros</h2>
                            <button type="button" className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 text-[#334155]" onClick={() => setMobileFiltersOpen(false)} aria-label="Cerrar filtros">
                                <FaTimes aria-hidden="true" />
                            </button>
                        </div>

                        <div className="grid gap-3">
                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Estado
                                <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.estado} onChange={(event) => { filtersForm.setData('estado', event.target.value); filtersForm.setData('prioridad', ''); }}>
                                    <option value="">Todos menos canceladas</option>
                                    {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </label>

                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Prioridad
                                <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.prioridad} onChange={(event) => { filtersForm.setData('prioridad', event.target.value); filtersForm.setData('estado', ''); }}>
                                    <option value="">Todas</option>
                                    <option value="tareas">Tareas</option>
                                    <option value="vencidas">Vencidas</option>
                                    <option value="hoy">Retiran hoy</option>
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Categoría
                                    <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.categoria_filter} onChange={(event) => filtersForm.setData('categoria_filter', event.target.value)}>
                                        {categoryOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>

                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Periodo
                                    <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.summary_range} onChange={(event) => filtersForm.setData('summary_range', event.target.value)}>
                                        {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            </div>

                            {filtersForm.data.summary_range === 'custom' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                        Desde
                                        <input className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" type="date" value={filtersForm.data.summary_from} onChange={(event) => filtersForm.setData('summary_from', event.target.value)} />
                                    </label>
                                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                        Hasta
                                        <input className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" type="date" value={filtersForm.data.summary_to} onChange={(event) => filtersForm.setData('summary_to', event.target.value)} />
                                    </label>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-3">
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Ordenar
                                    <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.ordenar_por} onChange={(event) => filtersForm.setData('ordenar_por', event.target.value)}>
                                        <option value="ticket">Ticket</option>
                                        <option value="ingreso">Ingreso</option>
                                        <option value="estimada">Estimada</option>
                                        <option value="cliente">Cliente</option>
                                        <option value="modelo">Modelo</option>
                                        <option value="estado">Estado</option>
                                        <option value="saldo">Saldo</option>
                                    </select>
                                </label>
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Dirección
                                    <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.direccion} onChange={(event) => filtersForm.setData('direccion', event.target.value)}>
                                        <option value="desc">DESCENDENTE</option>
                                        <option value="asc">ASCENDENTE</option>
                                    </select>
                                </label>
                            </div>

                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Seña
                                <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.filter_saldo} onChange={(event) => filtersForm.setData('filter_saldo', event.target.value)}>
                                    <option value="">Todas</option>
                                    <option value="con_senia">Con seña</option>
                                    <option value="sin_senia">Sin seña</option>
                                    <option value="pagado">Pagado</option>
                                </select>
                            </label>
                        </div>

                        <div className="sticky bottom-0 mt-4 grid grid-cols-[1fr_1.2fr] gap-2 bg-white pt-3">
                            <Link href={route('repairs.workbench')} className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-bold text-[#334155] no-underline">
                                Limpiar
                            </Link>
                            <button type="submit" className="min-h-11 rounded-md bg-[#2563eb] px-4 text-sm font-bold text-white">
                                Aplicar
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {isIngreso ? (
            <>
            <details className={cn(ui.repairShell, 'group mx-auto w-full max-w-6xl')} open>
                <summary className="cursor-pointer list-none rounded-lg border border-[#cbd5e1] bg-white px-4 py-3 text-sm font-bold text-[#334155] transition hover:bg-[#f8fafc] md:px-5">
                    <span className="inline-flex items-center gap-2">
                        <FaPlusCircle aria-hidden="true" />
                        Nueva orden de reparacion
                    </span>
                </summary>
                <div className="mx-auto grid w-full max-w-5xl gap-3 pt-3 md:gap-4">
                    <section className="rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm">
                        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center lg:gap-4">
                            <div>
                                <div className="mb-1.5 inline-flex items-center gap-2 text-[0.78rem] font-semibold text-[#475569] md:mb-2 md:text-xs">
                                    <FaClipboardList aria-hidden="true" /> Panel de ingreso
                                </div>
                                <h2 className="text-xl font-black tracking-tight text-[#0f172a] md:text-2xl">Nueva orden de reparacion</h2>
                                <p className="mt-1 max-w-3xl text-xs font-semibold text-[#64748b] md:text-sm">Carga al cliente una sola vez y suma una o varias reparaciones dentro de la misma orden.</p>
                            </div>
                            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 sm:justify-start md:px-4 md:py-3">
                                <div>
                                    <div className="text-[0.78rem] font-semibold text-[#64748b] md:text-xs">Orden actual</div>
                                    <div className="text-xl font-black text-[#0f172a] md:text-2xl">#{createForm.data.id_orden || nextOrderId}</div>
                                </div>
                                <FaReceipt className="text-2xl text-[#16a34a] md:text-3xl" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:mt-4">
                            <Link href={route('repairs.workbench')} className={buttonClass('primary', 'sm')}>Ver ordenes</Link>
                            <Link href={route('repairs.delivered')} className={buttonClass('soft', 'sm')}>Entregados</Link>
                        </div>
                    </section>

                    <form
                        className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm md:p-5 xl:p-6"
                        noValidate={isWizardIntake}
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitCreateForm();
                        }}
                    >
                        <div className={ui.repairCardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Datos del cliente</p>
                                <h2 className={ui.cardTitle}>Nueva orden guiada</h2>
                                <p className={ui.inlineCaption}>Cargá el cliente una vez y agregá cada falla como un trabajo separado con su precio.</p>
                            </div>
                        </div>

                        {isWizardIntake ? (
                            <div className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3">
                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                    {intakeSteps.map((step, stepIndex) => (
                                        <button
                                            key={step.key}
                                            type="button"
                                            className={cn(
                                                'min-h-10 rounded-md border px-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-45',
                                                activeIntakeStep === step.key
                                                    ? 'border-[#0f172a] bg-[#0f172a] text-white'
                                                    : stepIndex < activeIntakeStepIndex
                                                        ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]'
                                                        : 'border-[#cbd5e1] bg-white text-[#334155]',
                                            )}
                                            onClick={() => canSelectIntakeStep(stepIndex) ? setActiveIntakeStep(step.key) : undefined}
                                            disabled={!canSelectIntakeStep(stepIndex)}
                                        >
                                            {stepIndex + 1}. {step.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className={cn('grid items-start gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3 md:grid-cols-2 md:p-4 xl:grid-cols-[10rem_minmax(18rem,1fr)_12rem_14rem]', !showIntakeStep('client') && 'hidden')}>
                            <label className={guidedInlineLabelClass('order-id')}>ID de orden *<input className={guidedInputClass('order-id')} type="number" min="1" value={createForm.data.id_orden} onChange={(event) => createForm.setData('id_orden', event.target.value)} required /><span className="text-xs font-semibold text-[#64748b]">Editable si esta libre.</span></label>
                            <label className={guidedInlineLabelClass('customer-name')}>Nombre del cliente *<input className={guidedInputClass('customer-name')} value={createForm.data.nombre_cliente} onChange={(event) => createForm.setData('nombre_cliente', event.target.value)} required /></label>
                            <label className={repairLabelClass}>DNI<div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1"><input className={compactInputClass} type="number" min="1" max="99999999" value={createForm.data.dni} onChange={(event) => handleDniChange(event.target.value)} onBlur={() => void lookupByDni()} /><button className={buttonClass('soft', 'sm')} type="button" onClick={() => void lookupByDni()} disabled={lookupBusy}>{lookupBusy ? 'Buscando...' : 'Buscar DNI'}</button></div></label>
                            <label className={repairLabelClass}>Telefono / contacto<input className={compactInputClass} value={createForm.data.contacto} onChange={(event) => createForm.setData('contacto', event.target.value)} /><span className="text-xs font-semibold text-[#64748b]">Opcional. Si queda vacio se guarda sin contacto.</span></label>
                            {renderClientPreview('md:col-span-4')}
                            {lookupFeedback !== '' ? <p className="md:col-span-4 rounded-md bg-[#eff6ff] px-3 py-2 text-sm font-bold text-[#1d4ed8]">{lookupFeedback}</p> : null}
                        </div>

                        <div className={cn('grid gap-4', !showIntakeStep('device') && !showIntakeStep('extras') && 'hidden')}>
                            {createForm.data.jobs.map((job, index) => {
                                if (job.same_device && index > 0) {
                                    return null;
                                }

                                const groupedIndexes = groupedJobIndexes(index);
                                const hasGroupedFailures = groupedIndexes.length > 1;

                                return (
                                <article key={`job-v2-${index}`} className={cn('rounded-lg border bg-white p-3 shadow-sm md:p-4', Number(job.monto || 0) <= 0 ? 'border-[#fed7aa]' : Number(job.senia || 0) > 0 ? 'border-[#bbf7d0]' : 'border-[#cbd5e1]')}>
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2 md:mb-4 md:gap-3">
                                        <div className={ui.cardTitleWrap}>
                                            <p className={ui.eyebrow}>Trabajo de la orden</p>
                                            <h3 className="text-base font-black tracking-tight text-ink-950 md:text-xl">Trabajo #{index + 1}</h3>
                                            <p className="text-xs font-semibold text-slate-500 md:text-sm">Cada falla se carga por separado y suma al total del ticket.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={ui.repairMiniChip}>{Number(job.monto || 0) <= 0 ? 'A presupuestar' : Number(job.senia || 0) > 0 ? 'Con seña' : 'Presupuestado'}</span>
                                            <span className={ui.repairMiniChip}>{imagePreviews[index]?.length ? `${imagePreviews[index].length} foto(s)` : 'Sin fotos'}</span>
                                            <button className={buttonClass('soft', 'sm')} type="button" onClick={() => duplicateJob(index)} aria-label="Duplicar trabajo"><FaCopy aria-hidden="true" /></button>
                                            {createForm.data.jobs.length > 1 ? <button type="button" className={buttonClass('danger', 'sm')} onClick={() => removeJob(index)} aria-label="Eliminar trabajo"><FaTimes aria-hidden="true" /></button> : null}
                                        </div>
                                    </div>

                                    <div className="grid min-w-0 items-start gap-3 md:grid-cols-2">
                                        {job.same_device && index > 0 ? (
                                            <div className="rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#334155] md:col-span-2">
                                                Misma unidad que el trabajo anterior: {[createForm.data.jobs[index - 1]?.marca, createForm.data.jobs[index - 1]?.modelo].map((value) => value?.trim()).filter(Boolean).join(' ') || 'equipo compartido'}.
                                            </div>
                                        ) : (
                                            <>
                                        <div className={cn(fieldPanelPurple, !showIntakeStep('device') && 'hidden')}>
                                            <label className={repairLabelClass}>Categoría<select className={compactInputClass} value={job.categorias_reparacion} onChange={(event) => changeJobCategory(index, event.target.value)}>{serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
                                        </div>
                                        {isPhoneCategory(job.categorias_reparacion) ? (
                                            <div className={cn(guidedPanelClass(fieldPanelPurple, `job-${index}-brand`), !showIntakeStep('device') && 'hidden')}>
                                                <label className={repairLabelClass}>
                                                    Marca
                                                    <select className={guidedInputClass(`job-${index}-brand`)} value={job.marca} onChange={(event) => changeJobBrand(index, event.target.value)}>
                                                        <option value="">Elegir marca...</option>
                                                        {phoneBrandOptions.map((brand) => (
                                                            <option key={brand} value={brand}>
                                                                {brand}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                        ) : null}
                                        <div className={cn(guidedPanelClass(fieldPanelBlue, `job-${index}-model`), !showIntakeStep('device') && 'hidden')}>
                                            <label className={repairLabelClass}>Modelo / equipo<input className={guidedInputClass(`job-${index}-model`)} value={job.modelo} onChange={(event) => changeJobModel(index, event.target.value)} /></label>
                                            {renderDeviceModelSuggestions(index)}
                                        </div>
                                        <div className={cn(fieldPanelBlue, !showIntakeStep('device') && 'hidden')}>
                                            <label className={repairLabelClass}>
                                                Color
                                                <RepairColorCombobox className={compactInputClass} value={job.color} onChange={(value) => updateJob(index, (current) => ({ ...current, color: value }))} />
                                            </label>
                                        </div>
                                        {isPhoneCategory(job.categorias_reparacion) ? (
                                            <div className={cn(fieldPanelPurple, !showIntakeStep('device') && 'hidden')}>
                                                <label className={repairLabelClass}>
                                                    Desbloqueo
                                                    <PhoneUnlockFields
                                                        unlockType={job.unlock_type}
                                                        unlockValue={job.unlock_value}
                                                        onChange={(unlockType, unlockValue) => updateJob(index, (current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                                        selectClassName={compactInputClass}
                                                        inputClassName={compactInputClass}
                                                    />
                                                </label>
                                            </div>
                                        ) : null}
                                            </>
                                        )}
                                        <div className={cn(guidedPanelClass(fieldPanelBlue, `job-${index}-description`), 'md:col-span-2', !showIntakeStep('device') && 'hidden')}>
                                            <label className={repairLabelClass}>Falla / trabajo a realizar *</label>
                                            <div className="grid gap-2">
                                                <select
                                                    className={guidedInputClass(`job-${index}-description`)}
                                                    value={pendingFailureOptions[index] ?? ''}
                                                    onChange={(event) => {
                                                        const optionKey = event.target.value;
                                                        setPendingFailureOptions((current) => ({ ...current, [index]: optionKey }));
                                                        if (optionKey !== '') {
                                                            addFailureFromSelectedOption(index, optionKey);
                                                        }
                                                    }}
                                                >
                                                    <option value="">Elegir falla...</option>
                                                    {descriptionOptions.map((option) => (
                                                        <option key={option.key} value={option.key}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="grid gap-2 rounded-md border border-[#cbd5e1] bg-white p-2">
                                                {groupedIndexes.map((jobIndex, rowIndex) => {
                                                    const rowJob = createForm.data.jobs[jobIndex];

                                                    return (
                                                        <div
                                                            key={`failure-row-${jobIndex}`}
                                                            className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 sm:grid-cols-[2rem_minmax(0,1fr)_7.5rem_7.5rem] lg:grid-cols-[2rem_minmax(0,1fr)_8rem_8rem_10rem_auto] lg:items-start"
                                                        >
                                                            <span className="pt-2 text-sm font-black text-[#475569]">#{rowIndex + 1}</span>
                                                            <textarea
                                                                className={guidedInputClass(`job-${jobIndex}-description`, cn(compactTextareaClass, 'min-h-[4.25rem]'))}
                                                                rows={2}
                                                                value={rowJob.descripcion}
                                                                onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, descripcion: event.target.value }))}
                                                                required
                                                                placeholder="Detalle de la falla"
                                                            />
                                                            <label className="col-start-2 grid content-start gap-1 text-xs font-bold text-[#475569] sm:col-start-auto">
                                                                Monto
                                                                <input
                                                                    className={guidedInputClass(`job-${jobIndex}-amount`)}
                                                                    inputMode="decimal"
                                                                    value={rowJob.monto}
                                                                    onFocus={() => clearAmountForTyping(jobIndex, 'monto')}
                                                                    onKeyDown={preventAmountArrowStep}
                                                                    onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, monto: event.target.value }))}
                                                                />
                                                                {regularPriceIndicator(rowJob.monto, true)}
                                                            </label>
                                                            <label className="col-start-2 grid content-start gap-1 text-xs font-bold text-[#475569] sm:col-start-auto">
                                                                Seña
                                                                <input
                                                                    className={compactInputClass}
                                                                    inputMode="decimal"
                                                                    value={rowJob.senia}
                                                                    onFocus={() => clearAmountForTyping(jobIndex, 'senia')}
                                                                    onKeyDown={preventAmountArrowStep}
                                                                    onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, senia: event.target.value }))}
                                                                />
                                                                <span className="block min-h-5 text-xs leading-5 text-transparent" aria-hidden="true">.</span>
                                                            </label>
                                                            <label className="col-start-2 grid content-start gap-1 text-xs font-bold text-[#475569] sm:col-start-auto">
                                                                Medio
                                                                <select
                                                                    className={compactInputClass}
                                                                    value={rowJob.senia_method}
                                                                    onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, senia_method: event.target.value }))}
                                                                >
                                                                    <option value="efectivo">Efectivo</option>
                                                                    <option value="transferencia">Transferencia</option>
                                                                </select>
                                                                <span className="block min-h-5 text-xs leading-5 text-transparent" aria-hidden="true">.</span>
                                                            </label>
                                                            {rowIndex > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    className={cn(buttonClass('danger', 'sm'), 'col-start-2 w-full sm:col-start-auto lg:w-auto')}
                                                                    onClick={() => removeJob(jobIndex)}
                                                                    aria-label="Quitar falla"
                                                                >
                                                                    <FaTimes aria-hidden="true" />
                                                                </button>
                                                            ) : (
                                                                <span className="hidden lg:block" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <span className="text-xs font-semibold text-[#64748b]">Elegí una falla y se agrega automáticamente. Si ya hay una cargada, se apila como otro trabajo del mismo equipo.</span>
                                        </div>
                                        {false ? (
                                            <>
                                        <div className={guidedPanelClass(fieldPanelGreen, `job-${index}-amount`)}>
                                            <label className={repairLabelClass}>Monto ($)<input className={guidedInputClass(`job-${index}-amount`)} inputMode="decimal" value={job.monto} onFocus={() => clearAmountForTyping(index, 'monto')} onKeyDown={preventAmountArrowStep} onChange={(event) => updateJob(index, (current) => ({ ...current, monto: event.target.value }))} />{regularPriceIndicator(job.monto)}</label>
                                        </div>
                                        <div className={cn(fieldPanelGreen, 'min-w-[10rem]')}>
                                            <label className={repairLabelClass}>Seña ($)<input className={compactInputClass} inputMode="decimal" value={job.senia} onFocus={() => clearAmountForTyping(index, 'senia')} onKeyDown={preventAmountArrowStep} onChange={(event) => updateJob(index, (current) => ({ ...current, senia: event.target.value }))} /></label>
                                        </div>
                                        <div className={cn(fieldPanelGreen, 'min-w-[10rem]')}>
                                            <label className={repairLabelClass}>Medio de seña<select className={compactInputClass} value={job.senia_method} onChange={(event) => updateJob(index, (current) => ({ ...current, senia_method: event.target.value }))}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></label>
                                        </div>
                                            </>
                                        ) : null}
                                        <div className={cn(guidedPanelClass(fieldPanelAmber, `job-${index}-date`), !showIntakeStep('extras') && 'hidden')}>
                                            <label className={repairLabelClass}>Fecha estimada{renderEstimatedDateField(index, job, guidedInputClass(`job-${index}-date`))}</label>
                                        </div>
                                        <div className={cn(fieldPanelPurple, !showIntakeStep('extras') && 'hidden')}>
                                            <label className={repairLabelClass}>Observaciones<textarea className={compactTextareaClass} rows={4} value={job.observaciones} onFocus={() => { if (job.observaciones.trim().toLowerCase() === 'sin observaciones') updateJob(index, (current) => ({ ...current, observaciones: '' })); }} onChange={(event) => updateJob(index, (current) => ({ ...current, observaciones: event.target.value }))} /></label>
                                        </div>
                                        <div className={cn('grid min-w-0 gap-3 rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] p-3', !showIntakeStep('extras') && 'hidden')}>
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <strong className="text-sm text-[#0f172a]">Imagenes ({imagePreviews[index]?.length ?? 0}/2)</strong>
                                                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{imagePreviews[index]?.length ?? 0}/2</span>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                <label className={buttonClass('primary', 'sm')}><FaCamera aria-hidden="true" /> Sacar foto<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => setJobImages(index, event.target.files)} /></label>
                                                <WebcamCaptureButton className={buttonClass('soft', 'sm')} onCapture={(file) => setJobImageFiles(index, [file])} />
                                                <label className={buttonClass('soft', 'sm')}><FaImages aria-hidden="true" /> Elegir de galeria<input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setJobImages(index, event.target.files)} /></label>
                                            </div>
                                            <span className="text-[0.75rem] font-semibold text-slate-500">Estas imagenes se guardan como fotos iniciales del trabajo. Maximo 2.</span>
                                            {imagePreviews[index]?.length ? (
                                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                    {imagePreviews[index].map((src, previewIndex) => (
                                                        <div key={`${src}-${previewIndex}`} className="relative overflow-hidden rounded-lg border border-[#bfdbfe] bg-white">
                                                            <img className="aspect-[4/3] w-full object-cover" src={src} alt={`Vista previa ${previewIndex + 1}`} />
                                                            <span className="absolute bottom-1 left-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">Nueva {previewIndex + 1}</span>
                                                            <button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-[#ef4444] text-xs font-bold text-white" onClick={() => removeJobImage(index, previewIndex)} aria-label={`Quitar imagen ${previewIndex + 1}`}>
                                                                <FaTimes aria-hidden="true" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="rounded-lg border border-dashed border-[#bfdbfe] bg-white px-3 py-4 text-center text-sm font-semibold text-slate-500">No hay imagenes seleccionadas.</span>
                                            )}
                                        </div>
                                        <div className={cn(fieldPanelAmber, 'md:col-span-2', !showIntakeStep('extras') && 'hidden')}>
                                            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-sm font-black text-[#334155]">Repuesto a pedir</span>
                                                <label className="inline-flex items-center gap-2 rounded-md border border-[#f59e0b33] bg-white px-3 py-1 text-xs font-bold text-[#92400e]">
                                                    <input type="checkbox" checked={job.pedir_repuesto} onChange={(event) => togglePartRequest(index, event.target.checked)} />
                                                    Mandar a pedidos
                                                </label>
                                            </div>
                                            <label className={repairLabelClass}>
                                                Buscar en cajas
                                                <div className="relative">
                                                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#92400e]" aria-hidden="true" />
                                                    <input
                                                        className={cn(compactInputClass, 'pl-9')}
                                                        value={partSearches[index] ?? job.repuesto}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            setPartSearches((current) => ({ ...current, [index]: value }));
                                                            updateJob(index, (current) => ({ ...current, repuesto: value, inventory_part_id: '' }));
                                                        }}
                                                        placeholder="Buscar modulo, bateria, modelo..."
                                                    />
                                                </div>
                                            </label>
                                            {matchingInventoryParts(index).length > 0 ? (
                                                <div className="mt-2 grid gap-1">
                                                    {matchingInventoryParts(index).map((part) => (
                                                        <button
                                                            key={part.id}
                                                            type="button"
                                                            className={cn(
                                                                'grid gap-1 rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-[#f8fafc]',
                                                                job.inventory_part_id === String(part.id)
                                                                    ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d]'
                                                                    : 'border-[#fed7aa] bg-white text-[#334155] hover:bg-[#fff7ed]',
                                                            )}
                                                            onClick={() => selectInventoryPart(index, part)}
                                                        >
                                                            <span className="font-black">{part.model}</span>
                                                            <span className="text-xs font-bold text-slate-500">Caja {part.box.toUpperCase()} - {part.quantity} disponible{part.quantity === 1 ? '' : 's'}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (partSearches[index] ?? job.repuesto).trim().length >= 2 ? (
                                                <div className="mt-2 rounded-lg border border-dashed border-[#fed7aa] bg-white px-3 py-2 text-sm font-bold text-[#92400e]">
                                                    No hay coincidencias en cajas. Si hace falta pedirlo, marca Mandar a pedidos.
                                                </div>
                                            ) : null}
                                            {job.inventory_part_id !== '' ? (
                                                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm font-bold text-[#166534]">
                                                    <span>Asignado desde caja. Al guardar se descuenta del inventario.</span>
                                                    <button type="button" className="text-xs font-bold text-[#15803d] underline-offset-2 hover:underline" onClick={() => clearInventoryPart(index)}>
                                                        Quitar seleccion
                                                    </button>
                                                </div>
                                            ) : null}
                                            <textarea
                                                className={compactTextareaClass}
                                                rows={2}
                                                placeholder="Detalle del repuesto. Ej: modulo Samsung A54 negro"
                                                value={job.repuesto}
                                                onChange={(event) => updateJob(index, (current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))}
                                            />
                                            <span className="mt-1 block text-xs font-semibold text-[#92400e]">Si elegis un repuesto disponible no hace falta mandarlo a pedidos. Si no hay stock, marca Mandar a pedidos.</span>
                                        </div>
                                    </div>
                                </article>
                                );
                            })}
                        </div>

                        <section className={cn('grid gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-4', !showIntakeStep('summary') && 'hidden')}>
                            <div className="grid gap-2">
                                <strong className="text-sm font-black text-[#0f172a]">Resumen de trabajos</strong>
                                <div className="overflow-hidden rounded-lg border border-[#cbd5e1] bg-white">
                                    {jobSubtotalRows.map((row) => (
                                        <div key={`subtotal-${row.index}`} className="grid gap-1 border-b border-[#e2e8f0] px-3 py-2 text-sm last:border-b-0 md:grid-cols-[3rem_minmax(0,1fr)_8rem_8rem] md:items-center">
                                            <span className="font-black text-[#475569]">#{row.index + 1}</span>
                                            <span className="min-w-0">
                                                <strong className="block truncate text-[#0f172a]">{row.description}</strong>
                                                <span className="block truncate text-xs font-semibold text-[#64748b]">{row.model}</span>
                                            </span>
                                            <span className="font-bold text-[#334155]">Seña {formatMoney(row.deposit)}</span>
                                            <strong className="text-[#0f172a] md:text-right">{row.amount > 0 ? formatMoney(row.amount) : 'A presupuestar'}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.1fr)]">
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Reparaciones</span><strong className="block text-xl font-black text-[#0f172a]">{createForm.data.jobs.length}</strong></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Presupuesto total</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.monto)}</strong><span className={cn('block text-xs font-semibold text-[#64748b]', regularTotal > totals.monto && 'font-black text-[#92400e]')}>Regular sin descuento: {regularTotal > 0 ? formatMoney(regularTotal) : 'sin monto'}</span></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Señas</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.senia)}</strong></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Saldo estimado</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(Math.max(0, totals.monto - totals.senia))}</strong></div>
                            </div>
                            <div className={cn('hidden gap-2 border-t border-[#dbeafe] pt-3 lg:grid lg:grid-cols-[auto_auto] lg:justify-end', isWizardIntake && 'lg:hidden')}>
                                <button className={buttonClass('soft')} type="button" onClick={() => addJob()}><FaPlusCircle aria-hidden="true" /> Otro equipo</button>
                                <button className={buttonClass('primary')} type="submit" disabled={createForm.processing}><FaSave aria-hidden="true" /> {createForm.processing ? 'Guardando...' : 'Guardar orden'}</button>
                            </div>
                        </section>

                        {isWizardIntake ? (
                            <div className="grid gap-2 border-t border-[#e2e8f0] pt-3 sm:flex sm:items-center sm:justify-between">
                                <button className={buttonClass('soft')} type="button" onClick={goToPreviousIntakeStep} disabled={activeIntakeStepIndex === 0}>
                                    Anterior
                                </button>
                                {activeIntakeStep === 'summary' ? (
                                    <button className={buttonClass('primary')} type="submit" disabled={createForm.processing}>
                                        <FaSave aria-hidden="true" /> {createForm.processing ? 'Guardando...' : 'Guardar orden'}
                                    </button>
                                ) : (
                                    <button className={buttonClass('primary')} type="button" onClick={goToNextIntakeStep} disabled={!canGoToNextIntakeStep}>
                                        Siguiente
                                    </button>
                                )}
                            </div>
                        ) : null}

                        <div className={cn('grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between lg:hidden', isWizardIntake && 'hidden')}>
                            <button className={buttonClass('soft')} type="button" onClick={() => addJob()}><FaPlusCircle aria-hidden="true" /> Otro equipo</button>
                            <button className={buttonClass('primary')} type="submit" disabled={createForm.processing}><FaSave aria-hidden="true" /> {createForm.processing ? 'Guardando...' : 'Guardar orden'}</button>
                        </div>
                        {duplicateNotice !== '' ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#111827] px-4 py-2 text-sm font-bold text-white shadow-lg">{duplicateNotice}</div> : null}
                    </form>
                </div>
            </details>

            <details className="hidden">
                <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-[#334155]">
                    Nueva orden
                </summary>
                <div className="px-4 pb-4">
                    <form
                        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitCreateForm();
                        }}
                    >
                        <div className={ui.repairCardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Ingreso técnico</p>
                                <h2 className={ui.cardTitle}>Nueva orden multi-trabajo</h2>
                                <p className={ui.inlineCaption}>
                                    Recupera cliente por DNI, arma varios trabajos en un mismo ticket y redirige al ticket técnico al guardar.
                                </p>
                            </div>
                        </div>

                        <div className={ui.repairFormGrid}>
                            <input
                                className={ui.input}
                                placeholder="Cliente"
                                value={createForm.data.nombre_cliente}
                                onChange={(event) => createForm.setData('nombre_cliente', event.target.value)}
                            />
                            <div className="flex gap-3">
                                <input
                                    className={ui.input}
                                    placeholder="DNI"
                                    value={createForm.data.dni}
                                    onChange={(event) => handleDniChange(event.target.value)}
                                    onBlur={() => void lookupByDni()}
                                />
                                <button className={buttonClass('soft', 'sm')} type="button" onClick={() => void lookupByDni()} disabled={lookupBusy}>
                                    {lookupBusy ? 'Buscando...' : 'Buscar DNI'}
                                </button>
                            </div>
                            <input
                                className={`${ui.input} ${ui.repairFull}`}
                                placeholder="Contacto"
                                value={createForm.data.contacto}
                                onChange={(event) => createForm.setData('contacto', event.target.value)}
                            />
                            {renderClientPreview(ui.repairFull)}
                            {lookupFeedback !== '' ? <p className={`${ui.inlineCaption} ${ui.repairFull}`}>{lookupFeedback}</p> : null}
                        </div>

                        <div className="grid gap-4">
                            {createForm.data.jobs.map((job, index) => (
                                <article key={`job-${index}`} className={ui.repairRepairCard}>
                                    <div className={ui.repairRepairHead}>
                                        <div className={ui.cardTitleWrap}>
                                            <p className={ui.eyebrow}>Trabajo #{index + 1}</p>
                                            <h3 className="text-xl font-black tracking-tight text-ink-950">
                                                {job.modelo.trim() !== '' ? job.modelo : 'Nuevo trabajo'}
                                            </h3>
                                        </div>
                                        <div className={ui.inlineActions}>
                                            <span className={ui.repairMiniChip}>{job.estado}</span>
                                            {createForm.data.jobs.length > 1 ? (
                                                <button
                                                    type="button"
                                                    className={buttonClass('danger', 'sm')}
                                                    onClick={() =>
                                                        createForm.setData(
                                                            'jobs',
                                                            createForm.data.jobs.filter((_, jobIndex) => jobIndex !== index),
                                                        )
                                                    }
                                                >
                                                    Quitar trabajo
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className={ui.repairFormGrid}>
                                        <select
                                            className={ui.input}
                                            value={job.categorias_reparacion}
                                            onChange={(event) => changeJobCategory(index, event.target.value)}
                                        >
                                            {serviceCategories.map((category) => (
                                                <option key={category.value} value={category.value}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                        {isPhoneCategory(job.categorias_reparacion) ? (
                                            <select className={ui.input} value={job.marca} onChange={(event) => changeJobBrand(index, event.target.value)}>
                                                <option value="">Marca</option>
                                                {phoneBrandOptions.map((brand) => (
                                                    <option key={brand} value={brand}>
                                                        {brand}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                        <input
                                            className={ui.input}
                                            placeholder="Modelo"
                                            value={job.modelo}
                                            onChange={(event) => changeJobModel(index, event.target.value)}
                                        />
                                        <RepairColorCombobox className={ui.input} value={job.color} onChange={(value) => updateJob(index, (current) => ({ ...current, color: value }))} />
                                        {isPhoneCategory(job.categorias_reparacion) ? (
                                            <PhoneUnlockFields
                                                unlockType={job.unlock_type}
                                                unlockValue={job.unlock_value}
                                                onChange={(unlockType, unlockValue) => updateJob(index, (current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                                selectClassName={ui.input}
                                                inputClassName={ui.input}
                                            />
                                        ) : null}
                                        {renderDeviceModelSuggestions(index)}
                                        <textarea
                                            className={`${ui.textarea} ${ui.repairFull}`}
                                            placeholder="Tipo de servicio / descripcion"
                                            value={job.descripcion}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, descripcion: event.target.value }))}
                                        />
                                        <textarea
                                            className={`${ui.textarea} ${ui.repairFull}`}
                                            placeholder="Observaciones"
                                            value={job.observaciones}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, observaciones: event.target.value }))}
                                        />
                                        <input
                                            className={ui.input}
                                            placeholder="Monto"
                                            value={job.monto}
                                            onFocus={() => clearAmountForTyping(index, 'monto')}
                                            onKeyDown={preventAmountArrowStep}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, monto: event.target.value }))}
                                        />
                                        <div className="rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2">
                                            {regularPriceIndicator(job.monto)}
                                        </div>
                                        <input
                                            className={ui.input}
                                            placeholder="Seña"
                                            value={job.senia}
                                            onFocus={() => clearAmountForTyping(index, 'senia')}
                                            onKeyDown={preventAmountArrowStep}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, senia: event.target.value }))}
                                        />
                                        <select
                                            className={ui.input}
                                            value={job.senia_method}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, senia_method: event.target.value }))}
                                        >
                                            <option value="efectivo">Seña en efectivo</option>
                                            <option value="transferencia">Seña por transferencia</option>
                                        </select>
                                        {renderEstimatedDateField(index, job, ui.input)}
                                        <select
                                            className={ui.input}
                                            value={job.estado}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, estado: event.target.value }))}
                                        >
                                            {states.map((state) => (
                                                <option key={state} value={state}>
                                                    {state}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            className={ui.input}
                                            placeholder="Repuesto"
                                            value={job.repuesto}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, repuesto: event.target.value }))}
                                        />
                                        <label className={`${ui.repairUploadField} ${ui.repairFull}`}>
                                            <span>Fotos iniciales</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                capture="environment"
                                                onChange={(event) =>
                                                    updateJob(index, (current) => ({
                                                        ...current,
                                                        images: event.target.files ? Array.from(event.target.files) : null,
                                                    }))
                                                }
                                            />
                                        </label>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className={ui.inlineActions}>
                            <button
                                className={buttonClass('soft')}
                                type="button"
                                onClick={() =>
                                    createForm.setData('jobs', [
                                        ...createForm.data.jobs,
                                        createEmptyJob(states[0] ?? 'PENDIENTE'),
                                    ])
                                }
                            >
                                Agregar otro trabajo
                            </button>
                            <button className={buttonClass('primary')} type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Guardando...' : 'Crear orden y abrir ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </details>
            </>
            ) : null}

            {isConsultas ? (
            <section className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-[0.84rem] font-bold text-[#475569] xl:hidden">
                    <span>Mostrando {visibleRepairs} reparacion{visibleRepairs === 1 ? '' : 'es'} en {tickets.length} ticket{tickets.length === 1 ? '' : 's'}.</span>
                    <span className="hidden sm:inline">Consulta técnica</span>
                </div>
                <div className="hidden w-full overflow-x-auto rounded-lg border border-[#cbd5e1] bg-white shadow-sm xl:block">
                    <div className="w-full min-w-0">
                        <form onSubmit={(event) => { event.preventDefault(); submitGridFilters(); }}>
                            <div className={cn('sticky top-0 z-10 grid w-full items-stretch divide-x divide-[#cbd5e1] border-b border-[#cbd5e1] bg-[#f1f5f9] shadow-[0_1px_0_rgba(15,23,42,0.04)] [&>*]:min-w-0 [&>*]:px-1.5 [&>*]:py-1.5', repairDesktopTableGridClass)}>
                                <label className="sticky left-0 z-20 grid gap-1 bg-[#f1f5f9] shadow-[1px_0_0_#cbd5e1]">
                                    <Link href={sortHeaderHref('ticket')} preserveScroll className={cn(sortHeaderClass('ticket'), 'justify-center')}>ID {sortIndicator('ticket')}</Link>
                                    <input className={cn(gridFilterInputClass, 'text-center')} inputMode="numeric" placeholder="ID" value={filtersForm.data.filter_id} onChange={(event) => setSingleGridFilter('filter_id', event.target.value)} />
                                </label>
                                <label className="sticky left-[6.8rem] z-20 grid gap-1 bg-[#f1f5f9] shadow-[1px_0_0_#cbd5e1]">
                                    <Link href={sortHeaderHref('cliente')} preserveScroll className={sortHeaderClass('cliente')}>Cliente {sortIndicator('cliente')}</Link>
                                    <input className={gridFilterInputClass} placeholder="Cliente" value={filtersForm.data.filter_cliente} onChange={(event) => setSingleGridFilter('filter_cliente', event.target.value)} />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('dni')} preserveScroll className={sortHeaderClass('dni')}>DNI {sortIndicator('dni')}</Link>
                                    <input className={gridFilterInputClass} placeholder="DNI" value={filtersForm.data.filter_dni} onChange={(event) => setSingleGridFilter('filter_dni', event.target.value)} />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('contacto')} preserveScroll className={sortHeaderClass('contacto')}>Contacto {sortIndicator('contacto')}</Link>
                                    <input className={gridFilterInputClass} placeholder="Contacto" value={filtersForm.data.filter_contacto} onChange={(event) => setSingleGridFilter('filter_contacto', event.target.value)} />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('ingreso')} preserveScroll className={sortHeaderClass('ingreso')}>Ingreso {sortIndicator('ingreso')}</Link>
                                    <input className={gridFilterInputClass} type="date" value={filtersForm.data.filter_ingreso} onChange={(event) => setSingleGridFilter('filter_ingreso', event.target.value, 'immediate')} aria-label="Filtrar por fecha de ingreso" />
                                </label>
                                <span className="grid content-start gap-1 text-center text-[0.62rem] font-bold text-[#475569]">
                                    Imagen
                                </span>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('modelo')} preserveScroll className={sortHeaderClass('modelo')}>Modelo {sortIndicator('modelo')}</Link>
                                    <input className={gridFilterInputClass} placeholder="Modelo" value={filtersForm.data.filter_modelo} onChange={(event) => setSingleGridFilter('filter_modelo', event.target.value)} />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('falla')} preserveScroll className={sortHeaderClass('falla')}>Falla {sortIndicator('falla')}</Link>
                                    <input className={gridFilterInputClass} placeholder="Falla" value={filtersForm.data.filter_falla} onChange={(event) => setSingleGridFilter('filter_falla', event.target.value)} />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('estimada')} preserveScroll className={sortHeaderClass('estimada')}>Estimada {sortIndicator('estimada')}</Link>
                                    <input className={gridFilterInputClass} type="date" value={filtersForm.data.filter_estimada} onChange={(event) => setSingleGridFilter('filter_estimada', event.target.value, 'immediate')} aria-label="Filtrar por fecha estimada" />
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('saldo')} preserveScroll className={sortHeaderClass('saldo')}>Saldo {sortIndicator('saldo')}</Link>
                                    <select className={gridFilterInputClass} value={filtersForm.data.filter_saldo} onChange={(event) => setSingleGridFilter('filter_saldo', event.target.value, 'immediate')} aria-label="Filtrar por saldo o seña">
                                        <option value="">Saldo</option>
                                        <option value="con_senia">Con seña</option>
                                        <option value="sin_senia">Sin seña</option>
                                        <option value="pagado">Pagado</option>
                                    </select>
                                </label>
                                <label className="grid gap-1">
                                    <Link href={sortHeaderHref('estado')} preserveScroll className={cn(sortHeaderClass('estado'), 'justify-center')}>Estado {sortIndicator('estado')}</Link>
                                    <select className={gridFilterInputClass} value={filtersForm.data.filter_estado} onChange={(event) => setSingleGridFilter('filter_estado', event.target.value, 'immediate')} aria-label="Filtrar por estado">
                                        <option value="">Estado</option>
                                        {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                </label>
                                <span className="grid content-start gap-1">
                                    <span className="text-center text-[0.62rem] font-bold text-[#475569]">Acciones</span>
                                    <span className="flex items-center justify-center gap-1">
                                        <button type="submit" className="h-7 rounded-sm border border-[#2563eb] bg-[#2563eb] px-2 text-[0.66rem] font-bold text-white">Aplicar</button>
                                        <Link href={clearGridFilterHref} preserveScroll className="grid h-7 place-items-center rounded-sm border border-[#cbd5e1] bg-white px-2 text-[0.66rem] font-bold text-[#475569] no-underline">Limpiar</Link>
                                    </span>
                                </span>
                            </div>
                        </form>
                        <div className="grid bg-white">
                            {tickets.length > 0 ? (
                                isTaskQueueView ? (
                                    <>
                                        <div className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-[#0f172a] bg-[#f8fafc] px-3 py-2 text-xs font-black text-[#0f172a]">
                                            <span>Tareas para hoy</span>
                                            <span>{taskTickets.pending.reduce((total, ticket) => total + ticket.repairs.length, 0)} pendiente{taskTickets.pending.length === 1 ? '' : 's'}</span>
                                        </div>
                                        {taskTickets.pending.length > 0 ? renderDesktopTaskTickets(taskTickets.pending) : (
                                            <div className="px-4 py-6 text-center text-sm font-bold text-[#64748b]">No quedan tareas pendientes.</div>
                                        )}
                                        <div className="bg-[#f1f5f9] py-3">
                                            <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-[#0f172a] px-4 py-3 text-xs font-black text-white">
                                                <span>Completadas</span>
                                                <span className="text-[#cbd5e1]">{taskTickets.completed.reduce((total, ticket) => total + ticket.repairs.length, 0)} terminada{taskTickets.completed.length === 1 ? '' : 's'}</span>
                                            </div>
                                        </div>
                                        {taskTickets.completed.length > 0 ? renderDesktopTaskTickets(taskTickets.completed) : (
                                            <div className="px-4 py-6 text-center text-sm font-bold text-[#64748b]">Todavía no hay tareas listas o canceladas.</div>
                                        )}
                                    </>
                                ) : renderDesktopDateGroups(ticketDateGroups)
                            ) : (
                                <div className="p-3">
                                    <ConsultasEmptyState hasFilters={hasActiveConsultasFilters} isTaskQueueView={isTaskQueueView} />
                                </div>
                            )}
                            {isConsultas && deliveredSearchTickets.length > 0 ? (
                                <>
                                    <div className="bg-[#f1f5f9] py-3">
                                        <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-[#0f172a] px-4 py-3 text-xs font-black text-white">
                                            <span>Encontrado en entregados</span>
                                            <span className="text-[#cbd5e1]">{deliveredSearchMatches} {deliveredSearchMatches === 1 ? 'coincidencia' : 'coincidencias'}</span>
                                        </div>
                                    </div>
                                    {renderDesktopDeliveredSearchTickets()}
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 xl:hidden">
                    {isTaskQueueView ? (
                        <>
                            <section className="grid gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-2">
                                <div className="flex items-center justify-between gap-2 border-b border-[#cbd5e1] px-1 pb-2 text-sm font-black text-[#0f172a]">
                                    <span>Tareas para hoy</span>
                                    <span>{taskTickets.pending.reduce((total, ticket) => total + ticket.repairs.length, 0)}</span>
                                </div>
                                {taskTickets.pending.length > 0 ? renderMobileTaskTickets(taskTickets.pending) : (
                                    <div className="rounded-lg border border-dashed border-[#94a3b8] bg-white p-4 text-center text-sm font-bold text-[#64748b]">No quedan tareas pendientes.</div>
                                )}
                            </section>
                            <div className="bg-[#f1f5f9] py-3">
                                <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-[#0f172a] px-4 py-3 text-sm font-black text-white">
                                    <span>Completadas</span>
                                    <span className="text-xs text-[#cbd5e1]">{taskTickets.completed.reduce((total, ticket) => total + ticket.repairs.length, 0)}</span>
                                </div>
                            </div>
                            <section className="grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-2">
                                {taskTickets.completed.length > 0 ? renderMobileTaskTickets(taskTickets.completed) : (
                                    <div className="rounded-lg border border-dashed border-[#94a3b8] bg-white p-4 text-center text-sm font-bold text-[#64748b]">Todavía no hay tareas listas o canceladas.</div>
                                )}
                            </section>
                        </>
                    ) : renderMobileDateGroups(ticketDateGroups)}
                    {tickets.length === 0 ? <ConsultasEmptyState hasFilters={hasActiveConsultasFilters} isTaskQueueView={isTaskQueueView} /> : null}
                    {isConsultas && deliveredSearchTickets.length > 0 ? (
                        <>
                            <div className="bg-[#f1f5f9] py-3">
                                <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-[#0f172a] px-4 py-3 text-sm font-black text-white">
                                    <span>Encontrado en entregados</span>
                                    <span className="text-xs text-[#cbd5e1]">{deliveredSearchMatches}</span>
                                </div>
                            </div>
                            <section className="grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-2">
                                {renderMobileDeliveredSearchTickets()}
                            </section>
                        </>
                    ) : null}
                </div>
            </section>
            ) : null}
        </RepairLayout>
    );
}
