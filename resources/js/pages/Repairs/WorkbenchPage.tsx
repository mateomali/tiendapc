import { Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FaBan, FaCalendarDay, FaCamera, FaCheck, FaCheckCircle, FaChevronLeft, FaChevronRight, FaClipboardCheck, FaClipboardList, FaCopy, FaFilter, FaHourglassEnd, FaImages, FaPlusCircle, FaSave, FaSearch, FaTimes, FaTools, FaTruck, FaWrench } from 'react-icons/fa';
import { PhoneUnlockFields } from '../../components/PhoneUnlockFields';
import { RepairPartAccessoriesFields, normalizePartAccessories, type RepairPartAccessory } from '../../components/RepairPartAccessoriesFields';
import { normalizeRepairKey as normalizeDeviceSearch, phoneBrandOptions, RepairColorCombobox } from '../../components/RepairColorCombobox';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass } from '../../components/RepairTicketPanel';
import { WebcamCaptureButton } from '../../components/WebcamCaptureButton';
import { RepairLayout } from '../../layouts/RepairLayout';
import { groupTicketsByDate, type TicketDateGroup } from '../../repairDateGroups';
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

interface SuggestedRepairPrice {
    amount: number;
    date: string | null;
    order_id: number;
    repair_number: number;
    repair_type: string;
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
        page?: number;
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
    pagination: {
        page: number;
        totalPages: number;
        total: number;
        perPage: number;
    };
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    failureTemplates: FailureTemplateOption[];
    serviceOptionUsage: Record<string, number>;
    partInventory: RepairPartInventoryOption[];
    deviceModels: DeviceModelOption[];
    suggestedPricesByPhoneModel: Record<string, Record<string, SuggestedRepairPrice>>;
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
    a_presupuestar: boolean;
    senia: string;
    senia_method: string;
    fecha_estimada: string;
    estado: string;
    repuesto: string;
    pedir_repuesto: boolean;
    inventory_part_id: string;
    repuesto_agregados: RepairPartAccessory[];
    repuesto_agregado_otro: string;
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
        a_presupuestar: false,
        senia: '0',
        senia_method: 'efectivo',
        fecha_estimada: localDateWithOffset(0),
        estado: defaultState,
        repuesto: '',
        pedir_repuesto: false,
        inventory_part_id: '',
        repuesto_agregados: [],
        repuesto_agregado_otro: '',
        categorias_reparacion: '4',
        unlock_type: '',
        unlock_value: '',
        images: null,
    };
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

function normalizeSuggestedPriceModel(value: string, brand = ''): string {
    let normalized = removeBrandPrefix(value, brand);

    for (const knownBrand of phoneBrandOptions) {
        if (knownBrand === 'OTRAS') {
            continue;
        }

        normalized = removeBrandPrefix(normalized, knownBrand);
    }
    normalized = removeBrandPrefix(normalized, 'MOTO');

    return normalized;
}

function normalizeSuggestedRepairType(value: string): string {
    const firstLine = value.split('\n').map((line) => line.trim()).find(Boolean) ?? '';

    return normalizeDeviceSearch(firstLine);
}

function SummaryFilterCard({
    label,
    value,
    tone,
    href,
    active = false,
    icon,
}: {
    label: string;
    value: number;
    tone: 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'cyan' | 'yellow' | 'brown';
    href: string;
    active?: boolean;
    icon: JSX.Element;
}): JSX.Element {
    const toneText = {
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
        blue: 'border-[#bfdbfe] bg-[#eff6ff]',
        orange: 'border-[#fed7aa] bg-[#fff7ed]',
        purple: 'border-[#ddd6fe] bg-[#f5f3ff]',
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
                'grid min-h-[56px] min-w-0 grid-cols-[1fr_auto] items-center gap-x-2 rounded-md border bg-white px-2.5 py-1.5 text-left no-underline transition hover:border-[#2563eb] hover:bg-[#f8fbff]',
                active ? 'border-[#2563eb] bg-[#eff6ff] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.18)]' : 'border-[#cbd5e1]',
            )}
        >
            <div className="min-w-0">
                <div className={cn('truncate text-[0.72rem] font-bold', active ? 'text-[#1d4ed8]' : 'text-[#475569]')}>{label}</div>
                <div className="mt-0.5 text-[1.3rem] font-black leading-none text-[#0f172a]">{value}</div>
            </div>
            <div className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[0.85rem]', iconShellTone, toneText)}>
                {icon}
            </div>
        </Link>
    );
}

function FilterPill({ label, href, active }: { label: string; href: string; active: boolean }): JSX.Element {
    return (
        <Link
            href={href}
            preserveScroll
            className={cn(
                'inline-flex min-h-9 items-center justify-center rounded-md border px-3 py-1.5 text-[0.78rem] font-bold no-underline transition',
                active
                    ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-[0_1px_2px_rgba(37,99,235,0.2)]'
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
    suggestedPricesByPhoneModel = {},
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
    pagination,
    initialCreateClient = null,
}: WorkbenchPageProps): JSX.Element {
    const isConsultas = pageMode === 'consultas';
    const isIngreso = pageMode === 'ingreso';
    const configuredWizardIntake = intakeMode === 'wizard';
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
        page: filters.page ?? 1,
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
    const [mobileWizardIntake, setMobileWizardIntake] = useState<boolean>(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [partSearches, setPartSearches] = useState<Record<number, string>>({});
    const [expandedPartPanels, setExpandedPartPanels] = useState<Record<number, boolean>>({});
    const [selectedDeviceModelKeys, setSelectedDeviceModelKeys] = useState<Record<number, string>>({});
    const [expandedDesktopTickets, setExpandedDesktopTickets] = useState<Record<number, boolean>>({});
    const [activeSearchFields, setActiveSearchFields] = useState<SearchFieldKey[]>(() => {
        const incoming = filters.q_fields ?? defaultSearchFields;

        return defaultSearchFields.filter((field) => incoming.includes(field));
    });
    const gridFilterSubmitTimeout = useRef<number | null>(null);
    const dniLookupTimeout = useRef<number | null>(null);
    const visibleRepairs = tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);
    const ticketDateGroups = groupTicketsByDate(tickets, (ticket) => ticket.fecha);
    const isTaskQueueView = filters.prioridad === 'tareas';
    const taskTickets = splitTaskTickets(tickets);
    const isWizardIntake = configuredWizardIntake || (isIngreso && mobileWizardIntake);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const query = window.matchMedia('(max-width: 767px)');
        const sync = (): void => setMobileWizardIntake(query.matches);

        sync();
        query.addEventListener('change', sync);

        return () => query.removeEventListener('change', sync);
    }, []);

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
    const paginationHref = (page: number): string => route('repairs.workbench', filterQuery({ page }));
    const paginationSummary = `Mostrando ${visibleRepairs} reparacion${visibleRepairs === 1 ? '' : 'es'} en ${tickets.length} orden${tickets.length === 1 ? '' : 'es'}. Pagina ${pagination.page} de ${pagination.totalPages}. Total: ${pagination.total}.`;

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
    const gridFilterInputClass = 'h-9 w-full min-w-0 rounded-md border border-[#cbd5e1] bg-white px-2 text-[0.74rem] font-semibold text-[#0f172a] outline-none transition hover:border-[#93c5fd] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb20]';
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
            'inline-flex items-center gap-1 text-left text-[0.66rem] font-black uppercase text-[#475569] no-underline hover:text-[#1d4ed8]',
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
        setSelectedDeviceModelKeys((current) => {
            const next = { ...current };
            delete next[index];
            return next;
        });

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
            repuesto_agregados: phoneCategory ? current.repuesto_agregados : [],
            repuesto_agregado_otro: phoneCategory ? current.repuesto_agregado_otro : '',
        }));
        setSelectedDeviceModelKeys((current) => {
            const next = { ...current };
            delete next[index];
            return next;
        });
    };

    const changeJobBrand = (index: number, value: string): void => {
        updateJob(index, (current) => ({
            ...current,
            marca: value,
            modelo: partSearchFromModel(current.modelo),
        }));
        setPartSearches((current) => ({ ...current, [index]: partSearchFromModel(createForm.data.jobs[index]?.modelo ?? '') }));
        setSelectedDeviceModelKeys((current) => {
            const next = { ...current };
            delete next[index];
            return next;
        });
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
        const model = partSearchFromModel(deviceModel.model);
        const brand = isPhoneCategory(createForm.data.jobs[index]?.categorias_reparacion ?? '') && deviceModel.brand ? deviceModel.brand : createForm.data.jobs[index]?.marca ?? '';

        updateJob(index, (current) => ({
            ...current,
            marca: brand,
            modelo: model,
        }));
        setPartSearches((current) => ({ ...current, [index]: model }));
        setSelectedDeviceModelKeys((current) => ({
            ...current,
            [index]: `${Number(deviceModel.category_id)}:${normalizeSuggestedPriceModel(model, brand)}`,
        }));
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
        const selectedKey = job
            ? `${Number(job.categorias_reparacion || 0)}:${normalizeSuggestedPriceModel(job.modelo, job.marca)}`
            : '';

        if (selectedKey !== '' && selectedDeviceModelKeys[index] === selectedKey) {
            return null;
        }

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
            repuesto_agregados: source.repuesto_agregados,
            repuesto_agregado_otro: source.repuesto_agregado_otro,
            a_presupuestar: source.a_presupuestar,
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
        setSelectedDeviceModelKeys((current) => {
            const next: Record<number, string> = {};
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

    const deviceOrdinalForJob = (index: number): number =>
        createForm.data.jobs.slice(0, index + 1).filter((job, jobIndex) => !(job.same_device && jobIndex > 0)).length;

    const jobIsUnpriced = (job: RepairJobFormData): boolean => job.a_presupuestar || Number(job.monto || 0) <= 0;
    const jobStatusLabel = (job: RepairJobFormData): string => jobIsUnpriced(job)
        ? 'A presupuestar'
        : Number(job.senia || 0) > 0 ? 'Con seña' : 'Presupuestado';
    const jobStatusChipClass = (job: RepairJobFormData): string => jobIsUnpriced(job)
        ? 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]'
        : Number(job.senia || 0) > 0 ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]' : 'border-[#dbe3ee] bg-[#f6f8fb] text-[#475569]';
    const jobStatusChip = (job: RepairJobFormData): JSX.Element => (
        <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.7rem] font-black leading-5', jobStatusChipClass(job))}>
            {jobIsUnpriced(job) ? <FaHourglassEnd aria-hidden="true" /> : Number(job.senia || 0) > 0 ? <FaCheckCircle aria-hidden="true" /> : <FaCheck aria-hidden="true" />}
            {jobStatusLabel(job)}
        </span>
    );

    const formatMoney = (value: number): string => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const suggestedPriceForJob = (job: RepairJobFormData): SuggestedRepairPrice | null => {
        if (!isPhoneCategory(job.categorias_reparacion)) {
            return null;
        }

        const normalizedModel = normalizeSuggestedPriceModel(job.modelo, job.marca);
        const normalizedRepairType = normalizeSuggestedRepairType(job.descripcion);

        return normalizedModel !== '' && normalizedRepairType !== ''
            ? suggestedPricesByPhoneModel[normalizedModel]?.[normalizedRepairType] ?? null
            : null;
    };
    const suggestedPriceDateLabel = (value: string | null): string => {
        if (!value) {
            return 'fecha sin dato';
        }

        const [year, month, day] = value.split('-');

        return year && month && day ? `${day}/${month}/${year}` : value;
    };
    const suggestedPriceIndicator = (index: number, compact = false): JSX.Element | null => {
        const job = createForm.data.jobs[index];

        if (!job) {
            return null;
        }

        const suggestion = suggestedPriceForJob(job);

        if (suggestion === null) {
            return null;
        }

        return (
            <span className={cn(
                'flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold leading-5 text-[#166534]',
                compact && 'leading-4',
            )}>
                <span>Sugerido: {formatMoney(suggestion.amount)}</span>
                <span className="text-[#64748b]">{suggestedPriceDateLabel(suggestion.date)}</span>
            </span>
        );
    };
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
        const label = compact
            ? regularPriceLabel(value).replace('Regular sin descuento', 'Regular')
            : regularPriceLabel(value);

        return (
            <span className={cn(
                'block text-xs font-semibold leading-5',
                compact ? 'text-[#64748b]' : 'text-[#475569]',
                applies && 'font-black text-[#92400e]',
            )}>
                {label}
            </span>
        );
    };
    const regularTotal = regularPriceForCashAmount(totals.monto);
    const repairLabelClass = 'grid min-w-0 content-start gap-1 text-[0.82rem] font-bold leading-tight text-[#334155]';
    const compactInputClass = ui.repairDenseInput;
    const guidedFieldClass = 'border-[#2563eb] bg-[#eff6ff] ring-1 ring-[#2563eb33]';
    const guidedLabelClass = 'rounded-md border border-[#2563eb] bg-[#eff6ff] p-2 ring-1 ring-[#2563eb33]';
    const compactTextareaClass = ui.repairDenseTextarea;
    const fieldPanelBase = 'intake-field min-w-0 rounded-md border p-2.5';
    const fieldPanelBlue = `${fieldPanelBase} border-[#cbd5e1] bg-white`;
    const fieldPanelAmber = `${fieldPanelBase} border-[#fed7aa] bg-[#fffaf3]`;
    const fieldPanelPurple = `${fieldPanelBase} border-[#cbd5e1] bg-white`;
    const intakeSectionTitleClass = 'intake-section-title flex min-h-7 items-center border-b border-[#cbd5e1] text-sm font-black text-[#0f172a]';
    const intakeSectionSpanClass = 'md:col-span-2 xl:col-span-4';

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

            if (!job.a_presupuestar && (job.monto.trim() === '' || Number(job.monto) <= 0)) {
                return `job-${index}-amount`;
            }

            if (job.fecha_estimada.trim() === '') {
                return `job-${index}-date`;
            }
        }

        return null;
    };

    const activeCreateFlowField = nextCreateFlowField();
    const activeCreateFlowFieldLabel = activeCreateFlowField === 'order-id'
        ? 'ID de orden'
        : activeCreateFlowField === 'customer-name'
            ? 'Nombre del cliente'
            : activeCreateFlowField?.endsWith('-brand')
                ? 'Marca'
                : activeCreateFlowField?.endsWith('-model')
                    ? 'Modelo / equipo'
                    : activeCreateFlowField?.endsWith('-description')
                        ? 'Falla / trabajo'
                        : activeCreateFlowField?.endsWith('-amount')
                            ? 'Monto'
                            : activeCreateFlowField?.endsWith('-date')
                                ? 'Fecha estimada'
                                : '';
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

                return hasDeviceData && job.descripcion.trim() !== '' && (hasValidAmount(job.monto) || job.a_presupuestar);
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

    const renderDesktopDateGroups = (groups: TicketDateGroup<RepairTicketView>[]): JSX.Element[] =>
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

    const renderMobileDateGroups = (groups: TicketDateGroup<RepairTicketView>[]): JSX.Element[] =>
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
                serviceCategories={serviceCategories}
                serviceTemplates={serviceTemplates}
                partInventory={partInventory}
                readOnly
                highlightTerm={highlightTerm}
                statusLabel={(repair) => deliveredStatusLabel(repair.fecha_entregado)}
            />
        ));

    const intakeControl =
        'min-h-11 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.92rem] font-semibold text-[#0f172a] outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/25 disabled:bg-slate-100 disabled:text-slate-500';

    return (
        <RepairLayout title={isConsultas ? 'Consultas' : 'Ingreso'}>
            {isConsultas ? (
            <section className="sticky z-20 grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-2 text-[#0f172a] shadow-[0_6px_18px_rgba(15,23,42,0.10)] xl:hidden" style={{ top: 'var(--repair-header-offset, 5.6rem)' }}>
                <form
                    className="grid grid-cols-[minmax(0,1fr)_44px_44px] gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submitCleanSearch(true);
                    }}
                >
                    <input
                        className="h-11 min-w-0 rounded-md border border-[#cbd5e1] bg-white px-3 text-[1rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar orden"
                        value={filtersForm.data.q}
                        onChange={(event) => filtersForm.setData('q', event.target.value)}
                    />
                    <button type="submit" className="grid h-11 place-items-center rounded-md bg-[#2563eb] text-white" aria-label="Buscar">
                        <FaSearch aria-hidden="true" />
                    </button>
                    <button type="button" className="relative grid h-11 min-w-0 place-items-center rounded-md border border-[#cbd5e1] bg-white text-[#334155]" onClick={() => setMobileFiltersOpen(true)} aria-label="Abrir filtros">
                        <FaFilter aria-hidden="true" />
                        {activeMobileFilters > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-[#ef4444] px-1 text-[0.65rem] font-bold text-white">{activeMobileFilters}</span> : null}
                    </button>
                </form>
                <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5">
                    {searchFieldOptions.map((option) => {
                        const active = activeSearchFields.includes(option.key);

                        return (
                            <button
                                key={option.key}
                                type="button"
                                className={cn(
                                    'inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md border px-2.5 text-[0.72rem] font-bold transition',
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
                <div className="-mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5 text-[0.72rem] font-bold text-[#334155]">
                    <Link
                        href={route('repairs.workbench')}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', !filters.estado && !filters.prioridad ? 'bg-white text-[#1d4ed8] ring-2 ring-[#bfdbfe]' : 'bg-[#eff6ff] text-[#334155]')}
                    >
                        Todas {summary.active}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { estado: 'PENDIENTE' })}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', filters.estado === 'PENDIENTE' ? 'bg-white text-[#d97706] ring-2 ring-[#fed7aa]' : 'bg-[#fff7ed] text-[#334155]')}
                    >
                        Pend. {summary.pending}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { estado: 'LISTA' })}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', filters.estado === 'LISTA' ? 'bg-white text-[#15803d] ring-2 ring-[#bbf7d0]' : 'bg-[#ecfdf5] text-[#334155]')}
                    >
                        Listas {summary.ready}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'tareas' })}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', filters.prioridad === 'tareas' ? 'bg-white text-[#854d0e] ring-2 ring-[#fde68a]' : 'bg-[#fefce8] text-[#334155]')}
                    >
                        Tareas {summary.tasks}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'vencidas' })}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', filters.prioridad === 'vencidas' ? 'bg-white text-[#b91c1c] ring-2 ring-[#fecdd3]' : 'bg-[#fff1f2] text-[#334155]')}
                    >
                        Venc. {summary.overdue}
                    </Link>
                    <Link
                        href={route('repairs.workbench', { prioridad: 'hoy' })}
                        preserveScroll
                        className={cn('inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md px-2.5 no-underline', filters.prioridad === 'hoy' ? 'bg-white text-[#854d0e] ring-2 ring-[#fde68a]' : 'bg-[#fefce8] text-[#334155]')}
                    >
                        Hoy {summary.today}
                    </Link>
                    <Link
                        href={route('repairs.delivered')}
                        preserveScroll
                        className="inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-md bg-[#e0f2fe] px-2.5 text-[#0369a1] no-underline"
                    >
                        Entreg. {summary.delivered}
                    </Link>
                </div>
            </section>
            ) : null}

            {isConsultas ? (
            <form
                className="hidden rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 shadow-sm xl:block"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitCleanSearch();
                }}
            >
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative min-w-[320px] flex-[1_1_320px]">
                    <input
                        className="h-11 w-full rounded-lg border border-[#cbd5e1] bg-white pl-3 pr-12 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar por ID, cliente, DNI, contacto o modelo"
                        value={filtersForm.data.q}
                        onChange={(event) => filtersForm.setData('q', event.target.value)}
                    />
                        <button
                            type="submit"
                            className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md bg-[#2563eb] text-white transition hover:bg-[#1d4ed8]"
                            aria-label="Buscar"
                        >
                            <FaSearch aria-hidden="true" />
                        </button>
                    </div>
                    <div className="flex min-w-[380px] flex-1 flex-wrap items-center gap-1.5">
                        {searchFieldOptions.map((option) => {
                            const active = activeSearchFields.includes(option.key);

                            return (
                                <button
                                    key={option.key}
                                    type="button"
                                    className={cn(
                                        'inline-flex min-h-9 items-center rounded-md border px-2.5 text-[0.74rem] font-bold transition',
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
                    <div className="ml-auto flex items-center gap-2 text-[0.74rem] font-black text-[#64748b]">
                        <span>{visibleRepairs} reparaciones</span>
                        <span className="h-4 w-px bg-[#cbd5e1]" aria-hidden="true" />
                        <span>{tickets.length} tickets</span>
                    </div>
                </div>
            </form>
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
            <section className="hidden grid-cols-2 gap-2 md:grid-cols-3 xl:grid xl:grid-cols-9">
                <SummaryFilterCard label="Total órdenes" value={summary.active} tone="blue" href={route('repairs.workbench')} active={!filters.estado && !filters.prioridad} icon={<FaClipboardList aria-hidden="true" />} />
                <SummaryFilterCard label="Tareas" value={summary.tasks} tone="brown" href={route('repairs.workbench', { prioridad: 'tareas' })} active={filters.prioridad === 'tareas'} icon={<FaClipboardCheck aria-hidden="true" />} />
                <SummaryFilterCard label="Pendientes" value={summary.pending} tone="orange" href={route('repairs.workbench', { estado: 'PENDIENTE' })} active={filters.estado === 'PENDIENTE'} icon={<FaTools aria-hidden="true" />} />
                <SummaryFilterCard label="En reparación" value={summary.inRepair} tone="purple" href={route('repairs.workbench', { estado: 'EN REPARACION / ESPERA REPUESTO' })} active={filters.estado === 'EN REPARACION' || filters.estado === 'EN REPARACION / ESPERA REPUESTO'} icon={<FaWrench aria-hidden="true" />} />
                <SummaryFilterCard label="Listas" value={summary.ready} tone="green" href={route('repairs.workbench', { estado: 'LISTA' })} active={filters.estado === 'LISTA'} icon={<FaCheckCircle aria-hidden="true" />} />
                <SummaryFilterCard label="Vencidas" value={summary.overdue} tone="red" href={route('repairs.workbench', { prioridad: 'vencidas' })} active={filters.prioridad === 'vencidas'} icon={<FaHourglassEnd aria-hidden="true" />} />
                <SummaryFilterCard label="Retiran hoy" value={summary.today} tone="yellow" href={route('repairs.workbench', { prioridad: 'hoy' })} active={filters.prioridad === 'hoy'} icon={<FaCalendarDay aria-hidden="true" />} />
                <SummaryFilterCard label="Canceladas" value={summary.cancelled} tone="red" href={route('repairs.workbench', { estado: 'CANCELADA' })} active={filters.estado === 'CANCELADA'} icon={<FaBan aria-hidden="true" />} />
                <SummaryFilterCard label="Entregadas" value={summary.delivered} tone="cyan" href={route('repairs.delivered')} icon={<FaTruck aria-hidden="true" />} />
            </section>
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
                                <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.estado} onChange={(event) => { filtersForm.setData('estado', event.target.value); filtersForm.setData('prioridad', ''); }}>
                                    <option value="">Todos menos canceladas</option>
                                    {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </label>

                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Prioridad
                                <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.prioridad} onChange={(event) => { filtersForm.setData('prioridad', event.target.value); filtersForm.setData('estado', ''); }}>
                                    <option value="">Todas</option>
                                    <option value="tareas">Tareas</option>
                                    <option value="vencidas">Vencidas</option>
                                    <option value="hoy">Retiran hoy</option>
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Categoría
                                    <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.categoria_filter} onChange={(event) => filtersForm.setData('categoria_filter', event.target.value)}>
                                        {categoryOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>

                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Periodo
                                    <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.summary_range} onChange={(event) => filtersForm.setData('summary_range', event.target.value)}>
                                        {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                    </select>
                                </label>
                            </div>

                            {filtersForm.data.summary_range === 'custom' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                        Desde
                                        <input className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" type="date" value={filtersForm.data.summary_from} onChange={(event) => filtersForm.setData('summary_from', event.target.value)} />
                                    </label>
                                    <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                        Hasta
                                        <input className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" type="date" value={filtersForm.data.summary_to} onChange={(event) => filtersForm.setData('summary_to', event.target.value)} />
                                    </label>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-3">
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Ordenar
                                    <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.ordenar_por} onChange={(event) => filtersForm.setData('ordenar_por', event.target.value)}>
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
                                    <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.direccion} onChange={(event) => filtersForm.setData('direccion', event.target.value)}>
                                        <option value="desc">DESCENDENTE</option>
                                        <option value="asc">ASCENDENTE</option>
                                    </select>
                                </label>
                            </div>

                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Seña
                                <select className="min-h-12 w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[0.95rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb25] disabled:bg-slate-100 disabled:text-slate-500" value={filtersForm.data.filter_saldo} onChange={(event) => filtersForm.setData('filter_saldo', event.target.value)}>
                                    <option value="">Todas</option>
                                    <option value="con_senia">Con seña</option>
                                    <option value="sin_senia">Sin seña</option>
                                    <option value="pagado">Pagado</option>
                                </select>
                            </label>
                        </div>

                        <div className="sticky bottom-0 mt-4 grid grid-cols-[1fr_1.2fr] gap-2 border-t border-[#e2e8f0] bg-white pt-3">
                            <Link href={route('repairs.workbench')} className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#cbd5e1] bg-white px-4 text-sm font-bold text-[#334155] no-underline transition hover:bg-[#f8fafc]">
                                Limpiar
                            </Link>
                            <button type="submit" className="min-h-12 rounded-lg bg-[#2563eb] px-4 text-sm font-bold text-white transition hover:bg-[#1d4ed8]">
                                Aplicar
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {isIngreso ? (
            <div className="ingreso-flow mx-auto grid w-full max-w-6xl gap-4">
                <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-[#dce5f2] bg-white px-4 py-3 shadow-sm md:px-5">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#2563eb] text-white"><FaPlusCircle aria-hidden="true" /></span>
                        <div className="min-w-0">
                            <h2 className="text-lg font-black tracking-tight text-[#0f172a] md:text-xl">Nueva orden de reparación</h2>
                            <p className="text-xs font-semibold text-[#64748b]">Cargá el cliente, el/los equipo(s) y el presupuesto de cada reparación.</p>
                        </div>
                        <span className="rounded-md bg-[#eff6ff] px-2 py-1 text-sm font-black text-[#1d4ed8]">Orden #{createForm.data.id_orden || nextOrderId}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href={route('repairs.workbench')} className={buttonClass('soft', 'sm')}><FaSearch aria-hidden="true" />Ver órdenes</Link>
                        <Link href={route('repairs.delivered')} className={buttonClass('soft', 'sm')}>Entregados</Link>
                    </div>
                </header>

                <form
                    id="intake-flow-form"
                    className="grid gap-5 rounded-xl border border-[#dce5f2] bg-white p-3 shadow-sm md:p-5"
                    noValidate={isWizardIntake}
                    onSubmit={(event) => {
                        event.preventDefault();
                        submitCreateForm();
                    }}
                >
                    {isWizardIntake ? (
                        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-2.5 sm:p-3">
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                {intakeSteps.map((step, stepIndex) => {
                                    const isDone = stepIndex < activeIntakeStepIndex;
                                    const isActive = activeIntakeStep === step.key;

                                    return (
                                        <button
                                            key={step.key}
                                            type="button"
                                            className={cn(
                                                'flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-45',
                                                isActive
                                                    ? 'border-[#2563eb] bg-[#2563eb] text-white shadow-[0_2px_6px_rgba(37,99,235,0.25)]'
                                                    : isDone
                                                        ? 'border-[#86efac] bg-[#f0fdf4] text-[#166534] hover:bg-[#dcfce7]'
                                                        : 'border-[#cbd5e1] bg-white text-[#475569] hover:border-[#93c5fd] hover:bg-[#eff6ff]',
                                            )}
                                            onClick={() => canSelectIntakeStep(stepIndex) ? setActiveIntakeStep(step.key) : undefined}
                                            disabled={!canSelectIntakeStep(stepIndex)}
                                            aria-current={isActive ? 'step' : undefined}
                                        >
                                            <span className={cn(
                                                'grid h-6 w-6 shrink-0 place-items-center rounded-full text-[0.72rem] font-black leading-none',
                                                isActive ? 'bg-white text-[#2563eb]' : isDone ? 'bg-[#bbf7d0] text-[#15803d]' : 'bg-[#eef2f7] text-[#475569]',
                                            )}>
                                                {isDone ? <FaCheck aria-hidden="true" /> : stepIndex + 1}
                                            </span>
                                            <span className="min-w-0 truncate">{step.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {activeCreateFlowFieldLabel !== '' ? (
                                <div className="mt-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-sm font-bold text-[#1d4ed8]">
                                    Falta: {activeCreateFlowFieldLabel}
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    {/* ============ CLIENTE ============ */}
                    <section className={cn('grid gap-4 rounded-xl border border-[#e6edf7] bg-[#fbfdff] p-4', !showIntakeStep('client') && 'hidden')}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><span className="h-4 w-1 rounded-full bg-[#2563eb]" aria-hidden="true" />Cliente</h3>
                            <span className="text-xs font-semibold text-[#64748b]">Campos con <span className="font-black text-[#dc2626]">*</span> obligatorios</span>
                        </div>
                        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-[12rem_minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)]">
                            <label className="grid content-start gap-1.5">
                                <span className="text-[13px] font-bold text-[#334155]">ID de orden <span className="text-[#dc2626]">*</span></span>
                                <input className={intakeControl} type="number" min="1" value={createForm.data.id_orden} onChange={(event) => createForm.setData('id_orden', event.target.value)} required />
                                <span className="text-xs font-semibold text-[#64748b]">Editable si está libre.</span>
                            </label>
                            <label className="grid content-start gap-1.5">
                                <span className="text-[13px] font-bold text-[#334155]">Nombre del cliente <span className="text-[#dc2626]">*</span></span>
                                <input className={intakeControl} value={createForm.data.nombre_cliente} onChange={(event) => createForm.setData('nombre_cliente', event.target.value)} required placeholder="Ej: Juan Pérez" />
                            </label>
                            <label className="grid content-start gap-1.5">
                                <span className="text-[13px] font-bold text-[#334155]">DNI</span>
                                <div className="relative">
                                    <input className={cn(intakeControl, 'pr-11')} type="number" min="1" max="99999999" inputMode="numeric" value={createForm.data.dni} onChange={(event) => handleDniChange(event.target.value)} onBlur={() => void lookupByDni()} placeholder="00000000" />
                                    <button
                                        type="button"
                                        aria-label="Buscar por DNI"
                                        title="Buscar por DNI"
                                        className="absolute inset-y-1.5 right-1.5 grid w-10 place-items-center rounded-md bg-[#eff6ff] text-[#1d4ed8] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-60"
                                        onClick={() => void lookupByDni()}
                                        disabled={lookupBusy}
                                    >
                                        <FaSearch aria-hidden="true" />
                                    </button>
                                </div>
                                <span className="text-xs font-semibold text-[#64748b]">Recupera datos previos del cliente.</span>
                            </label>
                            <label className="grid content-start gap-1.5">
                                <span className="text-[13px] font-bold text-[#334155]">Teléfono / contacto</span>
                                <input className={intakeControl} value={createForm.data.contacto} onChange={(event) => createForm.setData('contacto', event.target.value)} placeholder="Ej: 11 5555 5555" />
                                <span className="text-xs font-semibold text-[#64748b]">Opcional.</span>
                            </label>
                        </div>
                        {clientPreview ? (
                            <div className="grid gap-3 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4 text-sm text-[#14532d]">
                                <div className="grid gap-1 font-semibold">
                                    <span>Cliente encontrado en orden #{clientPreview.ultima_orden ?? '-'}</span>
                                    <span>{clientPreview.nombre_cliente ?? 'Sin nombre'} - DNI {clientPreview.dni ?? '-'}</span>
                                    <span>Contacto: {clientPreview.contacto && clientPreview.contacto.trim() !== '' ? clientPreview.contacto : 'Sin contacto'}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button className={buttonClass('success', 'sm')} type="button" onClick={importClientPreview}><FaCheckCircle aria-hidden="true" />Importar datos</button>
                                    <button className={buttonClass('soft', 'sm')} type="button" onClick={() => setClientPreview(null)}>Ignorar</button>
                                </div>
                            </div>
                        ) : null}
                        {lookupFeedback !== '' ? <p className="rounded-lg bg-[#eff6ff] px-3 py-2 text-sm font-bold text-[#1d4ed8]">{lookupFeedback}</p> : null}
                    </section>

                    {/* ============ EQUIPOS / REPARACIONES ============ */}
                    <div className={cn('grid gap-5', !showIntakeStep('device') && !showIntakeStep('extras') && 'hidden')}>
                        {createForm.data.jobs.map((job, index) => {
                            if (job.same_device && index > 0) {
                                return null;
                            }

                            const groupedIndexes = groupedJobIndexes(index);

                            return (
                            <article key={`job-v2-${index}`} className="overflow-hidden rounded-xl border border-[#dce5f2] bg-white shadow-sm">
                                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e6edf7] bg-[#f8fafc] px-4 py-3">
                                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <h3 className="text-base font-black tracking-tight text-[#0f172a]">Equipo #{deviceOrdinalForJob(index)}</h3>
                                        <span className="text-xs font-bold text-[#64748b]">{groupedIndexes.length > 1 ? `Reparaciones #${groupedIndexes[0] + 1}–#${groupedIndexes[groupedIndexes.length - 1] + 1}` : `Reparación #${groupedIndexes[0] + 1}`}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {jobStatusChip(job)}
                                        <span className="inline-flex items-center gap-1 rounded-md border border-[#dbeafe] bg-[#eff6ff] px-2 py-0.5 text-[0.7rem] font-bold leading-5 text-[#1d4ed8]">{imagePreviews[index]?.length ? `${imagePreviews[index].length} foto(s)` : 'Sin fotos'}</span>
                                        <button className={buttonClass('soft', 'sm')} type="button" onClick={() => duplicateJob(index)} aria-label="Duplicar reparación" title="Duplicar reparación"><FaCopy aria-hidden="true" /></button>
                                        {createForm.data.jobs.length > 1 ? <button type="button" className={buttonClass('danger', 'sm')} onClick={() => removeJob(index)} aria-label="Quitar reparación" title="Quitar reparación"><FaTimes aria-hidden="true" /></button> : null}
                                    </div>
                                </header>

                                <div className="grid gap-5 p-4 md:p-5">
                                    {/* --- Datos del equipo --- */}
                                    <div className={cn('grid gap-4', !showIntakeStep('device') && 'hidden')}>
                                        <h4 className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><span className="h-4 w-1 rounded-full bg-[#0d9488]" aria-hidden="true" />Datos del equipo</h4>
                                        <div className="grid items-start gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-[11rem_10rem_minmax(0,1fr)_10rem]">
                                            <label className="grid content-start gap-1.5">
                                                <span className="text-[13px] font-bold text-[#334155]">Categoría</span>
                                                <select className={intakeControl} value={job.categorias_reparacion} onChange={(event) => changeJobCategory(index, event.target.value)}>
                                                    {serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                                                </select>
                                            </label>
                                            {isPhoneCategory(job.categorias_reparacion) ? (
                                                <label className="grid content-start gap-1.5">
                                                    <span className="text-[13px] font-bold text-[#334155]">Marca</span>
                                                    <select className={intakeControl} value={job.marca} onChange={(event) => changeJobBrand(index, event.target.value)}>
                                                        <option value="">Elegir marca...</option>
                                                        {phoneBrandOptions.map((brand) => (<option key={brand} value={brand}>{brand}</option>))}
                                                    </select>
                                                </label>
                                            ) : null}
                                            <div className={cn('grid content-start gap-1.5', !isPhoneCategory(job.categorias_reparacion) && 'sm:col-span-2 xl:col-span-2')}>
                                                <label className="grid content-start gap-1.5">
                                                    <span className="text-[13px] font-bold text-[#334155]">Modelo / equipo <span className="text-[#dc2626]">*</span></span>
                                                    <input className={intakeControl} value={job.modelo} onChange={(event) => changeJobModel(index, event.target.value)} placeholder="Ej: Samsung A54" />
                                                </label>
                                                {renderDeviceModelSuggestions(index)}
                                            </div>
                                            <label className="grid content-start gap-1.5">
                                                <span className="text-[13px] font-bold text-[#334155]">Color</span>
                                                <RepairColorCombobox className={intakeControl} value={job.color} onChange={(value) => updateJob(index, (current) => ({ ...current, color: value }))} />
                                            </label>
                                            {isPhoneCategory(job.categorias_reparacion) ? (
                                                <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2 xl:col-span-4">
                                                    <PhoneUnlockFields
                                                        unlockType={job.unlock_type}
                                                        unlockValue={job.unlock_value}
                                                        onChange={(unlockType, unlockValue) => updateJob(index, (current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                                        selectClassName={intakeControl}
                                                        inputClassName={intakeControl}
                                                    />
                                                    <RepairPartAccessoriesFields
                                                        selected={job.repuesto_agregados}
                                                        other={job.repuesto_agregado_otro}
                                                        inputClassName={intakeControl}
                                                        onChange={(selected, other) => updateJob(index, (current) => ({ ...current, repuesto_agregados: normalizePartAccessories(selected), repuesto_agregado_otro: other }))}
                                                        onOtherChange={(value) => updateJob(index, (current) => ({ ...current, repuesto_agregado_otro: value }))}
                                                    />
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* --- Falla y presupuesto --- */}
                                    <div className={cn('grid gap-3', !showIntakeStep('device') && 'hidden')}>
                                        <h4 className="flex items-center justify-between gap-2 text-sm font-black text-[#0f172a]">
                                            <span className="flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-[#d97706]" aria-hidden="true" />Falla y presupuesto</span>
                                            <span className="text-xs font-semibold text-[#64748b]">Agregá fallas para el mismo equipo o <button type="button" className="font-bold text-[#2563eb] underline-offset-2 hover:underline" onClick={() => addJobForSameDevice()}>cargá otra reparación</button>.</span>
                                        </h4>
                                        <div className="grid gap-1.5">
                                            <select
                                                className={intakeControl}
                                                value={pendingFailureOptions[index] ?? ''}
                                                onChange={(event) => {
                                                    const optionKey = event.target.value;
                                                    setPendingFailureOptions((current) => ({ ...current, [index]: optionKey }));
                                                    if (optionKey !== '') {
                                                        addFailureFromSelectedOption(index, optionKey);
                                                    }
                                                }}
                                            >
                                                <option value="">Elegir falla o servicio frecuente...</option>
                                                {descriptionOptions.map((option) => (<option key={option.key} value={option.key}>{option.label}</option>))}
                                            </select>
                                            <p className="text-xs font-semibold text-[#64748b]">Elegí una falla y se agrega automáticamente a la lista de abajo.</p>
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="hidden items-center gap-x-3 rounded-lg bg-[#f1f5f9] px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[#64748b] md:grid md:grid-cols-[2rem_minmax(0,1fr)_9.5rem_8rem_8.5rem_2rem]">
                                                <span aria-hidden="true" />
                                                <span className="pl-3">Detalle de la falla <span className="text-[#dc2626]">*</span></span>
                                                <span className="pl-3">Monto</span>
                                                <span className="pl-3">Seña</span>
                                                <span className="pl-3">Medio</span>
                                                <span aria-hidden="true" />
                                            </div>
                                            {groupedIndexes.map((jobIndex, rowIndex) => {
                                                const rowJob = createForm.data.jobs[jobIndex];
                                                const isOnlyRow = groupedIndexes.length === 1;

                                                return (
                                                    <div key={`failure-row-${jobIndex}`} className="grid gap-2 rounded-lg border border-[#e6edf7] bg-[#fbfdff] p-3 md:grid md:grid-cols-[2rem_minmax(0,1fr)_9.5rem_8rem_8.5rem_2rem] md:items-start md:gap-x-3">
                                                        <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e8effc] text-[0.72rem] font-black text-[#1d4ed8]">{jobIndex + 1}</span>
                                                        <label className="grid content-start gap-1.5">
                                                            <span className="text-xs font-bold text-[#475569] md:hidden">Detalle de la falla <span className="text-[#dc2626]">*</span></span>
                                                            <textarea
                                                                rows={2}
                                                                className={cn(intakeControl, 'min-h-11 resize-y')}
                                                                value={rowJob.descripcion}
                                                                onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, descripcion: event.target.value }))}
                                                                required
                                                                aria-label="Detalle de la falla"
                                                                placeholder="Detalle de la falla"
                                                            />
                                                        </label>
                                                        <label className="grid content-start gap-1.5">
                                                            <span className="text-xs font-bold text-[#475569] md:hidden">Monto</span>
                                                            {rowJob.a_presupuestar ? (
                                                                <div className="grid gap-1.5">
                                                                    <span className="inline-flex w-fit items-center gap-1 rounded-md border border-dashed border-[#f59e0b] bg-[#fffbeb] px-2 py-1.5 text-sm font-bold text-[#92400e]"><FaHourglassEnd aria-hidden="true" />A presupuestar</span>
                                                                    <button type="button" className={buttonClass('soft', 'sm', 'justify-self-start whitespace-nowrap')} onClick={() => updateJob(jobIndex, (current) => ({ ...current, a_presupuestar: false }))}>Poner precio</button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="relative">
                                                                        <span className="pointer-events-none absolute inset-y-0 left-2.5 grid place-items-center text-sm font-semibold text-[#64748b]" aria-hidden="true">$</span>
                                                                        <input
                                                                            className={cn(intakeControl, 'pl-7')}
                                                                            style={{ paddingLeft: '1.6rem' }}
                                                                            inputMode="decimal"
                                                                            value={rowJob.monto}
                                                                            onFocus={() => clearAmountForTyping(jobIndex, 'monto')}
                                                                            onKeyDown={preventAmountArrowStep}
                                                                            onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, monto: event.target.value, a_presupuestar: Number(event.target.value) > 0 ? false : current.a_presupuestar }))}
                                                                            aria-label="Monto"
                                                                        />
                                                                    </div>
                                                                    {suggestedPriceIndicator(jobIndex, true)}
                                                                    {regularPriceIndicator(rowJob.monto, true)}
                                                                    <button type="button" className={buttonClass('soft', 'sm', 'justify-self-start whitespace-nowrap text-[#92400e]')} onClick={() => updateJob(jobIndex, (current) => ({ ...current, a_presupuestar: true, monto: '' }))}>A presupuestar</button>
                                                                </>
                                                            )}
                                                        </label>
                                                        <label className="grid content-start gap-1.5">
                                                            <span className="text-xs font-bold text-[#475569] md:hidden">Seña</span>
                                                            <div className="relative">
                                                                <span className="pointer-events-none absolute inset-y-0 left-2.5 grid place-items-center text-sm font-semibold text-[#64748b]" aria-hidden="true">$</span>
                                                                <input
                                                                    className={intakeControl}
                                                                    style={{ paddingLeft: '1.6rem' }}
                                                                    inputMode="decimal"
                                                                    value={rowJob.senia}
                                                                    onFocus={() => clearAmountForTyping(jobIndex, 'senia')}
                                                                    onKeyDown={preventAmountArrowStep}
                                                                    onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, senia: event.target.value }))}
                                                                    aria-label="Seña"
                                                                />
                                                            </div>
                                                        </label>
                                                        <label className="grid content-start gap-1.5">
                                                            <span className="text-xs font-bold text-[#475569] md:hidden">Medio</span>
                                                            <select
                                                                className={intakeControl}
                                                                value={rowJob.senia_method}
                                                                onChange={(event) => updateJob(jobIndex, (current) => ({ ...current, senia_method: event.target.value }))}
                                                                aria-label="Medio de pago de la seña"
                                                            >
                                                                <option value="efectivo">Efectivo</option>
                                                                <option value="transferencia">Transferencia</option>
                                                            </select>
                                                        </label>
                                                        {!isOnlyRow ? (
                                                            <button
                                                                type="button"
                                                                className={cn(buttonClass('danger', 'sm'), 'justify-self-start')}
                                                                onClick={() => removeJob(jobIndex)}
                                                                aria-label={`Quitar falla ${jobIndex + 1}`}
                                                                title="Quitar falla"
                                                            >
                                                                <FaTimes aria-hidden="true" />
                                                            </button>
                                                        ) : <span aria-hidden="true" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* --- Entrega, fotos y repuesto --- */}
                                    <div className={cn('grid gap-5', !showIntakeStep('extras') && 'hidden')}>
                                        <h4 className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><span className="h-4 w-1 rounded-full bg-[#475569]" aria-hidden="true" />Entrega, fotos y repuesto</h4>

                                        <div className="grid items-start gap-x-5 gap-y-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
                                            <label className="grid content-start gap-1.5">
                                                <span className="text-[13px] font-bold text-[#334155]">Fecha estimada</span>
                                                {renderEstimatedDateField(index, job, intakeControl)}
                                            </label>
                                            <label className="grid content-start gap-1.5">
                                                <span className="text-[13px] font-bold text-[#334155]">Observaciones</span>
                                                <textarea
                                                    rows={3}
                                                    className={cn(intakeControl, 'min-h-24 resize-y')}
                                                    value={job.observaciones}
                                                    onFocus={() => { if (job.observaciones.trim().toLowerCase() === 'sin observaciones') updateJob(index, (current) => ({ ...current, observaciones: '' })); }}
                                                    onChange={(event) => updateJob(index, (current) => ({ ...current, observaciones: event.target.value }))}
                                                />
                                            </label>
                                        </div>

                                        <div className="grid items-start gap-x-5 gap-y-4 lg:grid-cols-2">
                                            <div className="grid min-w-0 gap-2.5 rounded-xl border border-dashed border-[#94a3b8] bg-[#fbfdff] p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <strong className="text-sm font-black text-[#0f172a]">Fotos iniciales ({imagePreviews[index]?.length ?? 0}/2)</strong>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <label className={buttonClass('primary', 'sm', 'px-2')}><FaCamera aria-hidden="true" />Foto<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => setJobImages(index, event.target.files)} /></label>
                                                    <WebcamCaptureButton className={buttonClass('soft', 'sm', 'px-2')} label="Webcam" onCapture={(file) => setJobImageFiles(index, [file])} />
                                                    <label className={buttonClass('soft', 'sm', 'px-2')}><FaImages aria-hidden="true" />Galería<input className="sr-only" type="file" accept="image/*" multiple onChange={(event) => setJobImages(index, event.target.files)} /></label>
                                                </div>
                                                <p className="text-xs font-semibold text-[#64748b]">Se guardan como fotos iniciales del trabajo. Máximo 2.</p>
                                                {imagePreviews[index]?.length ? (
                                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                                        {imagePreviews[index].map((src, previewIndex) => (
                                                            <div key={`${src}-${previewIndex}`} className="relative overflow-hidden rounded-lg border border-[#bfdbfe] bg-white">
                                                                <img className="aspect-[4/3] w-full object-cover" src={src} alt={`Vista previa ${previewIndex + 1}`} />
                                                                <button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-[#ef4444] text-xs font-bold text-white" onClick={() => removeJobImage(index, previewIndex)} aria-label={`Quitar imagen ${previewIndex + 1}`}>
                                                                    <FaTimes aria-hidden="true" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="rounded-lg border border-dashed border-[#bfdbfe] bg-white px-3 py-3 text-center text-sm font-semibold text-[#64748b]">Sin fotos seleccionadas.</span>
                                                )}
                                            </div>

                                            <div className="grid min-w-0 gap-2.5 rounded-xl border border-[#fde68a] bg-[#fffaf0] p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <strong className="text-sm font-black text-[#7c2d12]">Repuesto / caja</strong>
                                                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#fcd34d] bg-white px-3 py-1.5 text-xs font-bold text-[#92400e]">
                                                        <input type="checkbox" checked={job.pedir_repuesto} onChange={(event) => togglePartRequest(index, event.target.checked)} />
                                                        Mandar a pedidos
                                                    </label>
                                                </div>
                                                <div className="relative">
                                                    <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#92400e]" aria-hidden="true" />
                                                    <input
                                                        className={cn(intakeControl, 'pl-9')}
                                                        value={partSearches[index] ?? job.repuesto}
                                                        onChange={(event) => {
                                                            const value = event.target.value;
                                                            setPartSearches((current) => ({ ...current, [index]: value }));
                                                            updateJob(index, (current) => ({ ...current, repuesto: value, inventory_part_id: '' }));
                                                        }}
                                                        placeholder="Buscar módulo, batería, modelo..."
                                                    />
                                                </div>
                                                {matchingInventoryParts(index).length > 0 ? (
                                                    <div className="grid max-h-40 gap-1 overflow-y-auto">
                                                        {matchingInventoryParts(index).map((part) => (
                                                            <button
                                                                key={part.id}
                                                                type="button"
                                                                className={cn('grid gap-0.5 rounded-lg border px-3 py-2 text-left text-sm transition',
                                                                    job.inventory_part_id === String(part.id) ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d]' : 'border-[#fed7aa] bg-white text-[#334155] hover:bg-[#fff7ed]')}
                                                                onClick={() => selectInventoryPart(index, part)}
                                                            >
                                                                <span className="font-black">{part.model}</span>
                                                                <span className="text-xs font-bold text-[#64748b]">Caja {part.box.toUpperCase()} - {part.quantity} disponible{part.quantity === 1 ? '' : 's'}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (partSearches[index] ?? job.repuesto).trim().length >= 2 ? (
                                                    <div className="rounded-lg border border-dashed border-[#fed7aa] bg-white px-3 py-2 text-sm font-bold text-[#92400e]">Sin coincidencias en cajas. Si hace falta pedirlo, marcá "Mandar a pedidos".</div>
                                                ) : null}
                                                {job.inventory_part_id !== '' ? (
                                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm font-bold text-[#166534]">
                                                        <span>Asignado desde caja. Al guardar se descuenta del inventario.</span>
                                                        <button type="button" className="text-xs font-bold text-[#15803d] underline-offset-2 hover:underline" onClick={() => clearInventoryPart(index)}>Quitar selección</button>
                                                    </div>
                                                ) : null}
                                                <textarea
                                                    rows={2}
                                                    className={cn(intakeControl, 'min-h-14 resize-y')}
                                                    placeholder="Detalle del repuesto. Ej: módulo Samsung A54 negro"
                                                    value={job.repuesto}
                                                    onChange={(event) => updateJob(index, (current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))}
                                                />
                                                <p className="text-xs font-semibold text-[#92400e]">Si elegís un repuesto disponible no hace falta pedirlo. Sin stock → "Mandar a pedidos".</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </article>
                            );
                        })}
                    </div>

                    {/* ============ RESUMEN ============ */}
                    <section className={cn('grid gap-4 rounded-xl border border-[#e6edf7] bg-[#fbfdff] p-4', !showIntakeStep('summary') && 'hidden')}>
                        <div className="grid gap-3">
                            <h3 className="flex items-center gap-2 text-sm font-black text-[#0f172a]"><span className="h-4 w-1 rounded-full bg-[#2563eb]" aria-hidden="true" />Resumen de trabajos</h3>
                            <div className="overflow-hidden rounded-xl border border-[#e2e9f4] bg-white">
                                {jobSubtotalRows.map((row) => (
                                    <div key={`subtotal-${row.index}`} className="grid gap-1 border-b border-[#eef2f8] px-4 py-2.5 text-sm last:border-b-0 md:grid-cols-[3.5rem_minmax(0,1fr)_8rem_9rem] md:items-center">
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
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-xl border border-[#e2e9f4] bg-white p-3"><span className="block text-xs font-semibold text-[#64748b]">Reparaciones</span><strong className="block text-xl font-black text-[#0f172a]">{createForm.data.jobs.length}</strong></div>
                            <div className="rounded-xl border border-[#e2e9f4] bg-white p-3"><span className="block text-xs font-semibold text-[#64748b]">Presupuesto total</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.monto)}</strong><span className={cn('block text-xs font-semibold text-[#64748b]', regularTotal > totals.monto && 'font-black text-[#92400e]')}>{regularTotal > 0 ? `Regular sin descuento: ${formatMoney(regularTotal)}` : ''}</span></div>
                            <div className="rounded-xl border border-[#e2e9f4] bg-white p-3"><span className="block text-xs font-semibold text-[#64748b]">Señas</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.senia)}</strong></div>
                            <div className="rounded-xl border border-[#e2e9f4] bg-white p-3"><span className="block text-xs font-semibold text-[#64748b]">Saldo estimado</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(Math.max(0, totals.monto - totals.senia))}</strong></div>
                        </div>
                    </section>

                    {isWizardIntake ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e6edf7] pt-4">
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
                </form>

                {!isWizardIntake ? (
                    <div className="sticky bottom-2 z-30 grid gap-2 rounded-xl border border-[#dce5f2] bg-white px-4 py-3 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.25)] md:flex md:flex-wrap md:items-center md:justify-between md:gap-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-bold text-[#334155]">
                            <span>{createForm.data.jobs.length} reparación{createForm.data.jobs.length === 1 ? '' : 'es'}</span>
                            <span>Total <strong className="text-[#0f172a]">{formatMoney(totals.monto)}</strong></span>
                            <span>Señas <strong className="text-[#0f172a]">{formatMoney(totals.senia)}</strong></span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button className={buttonClass('soft')} type="button" onClick={() => addJob()}><FaPlusCircle aria-hidden="true" />Otro equipo</button>
                            <button className={buttonClass('primary')} type="submit" form="intake-flow-form" disabled={createForm.processing}><FaSave aria-hidden="true" />{createForm.processing ? 'Guardando...' : 'Guardar orden'}</button>
                        </div>
                    </div>
                ) : null}
                {duplicateNotice !== '' ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-[#111827] px-4 py-2 text-sm font-bold text-white shadow-lg">{duplicateNotice}</div> : null}
            </div>
            ) : null}
            {isConsultas ? (
            <section className="grid gap-3">
                <div className="flex items-center justify-between gap-2 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[0.8rem] font-bold text-[#475569] xl:hidden">
                    <span>Mostrando {visibleRepairs} reparacion{visibleRepairs === 1 ? '' : 'es'} en {tickets.length} ticket{tickets.length === 1 ? '' : 's'}.</span>
                    {hasActiveConsultasFilters ? (
                        <Link href={route('repairs.workbench')} preserveScroll className="shrink-0 text-[0.72rem] font-black text-[#2563eb] no-underline underline-offset-2 hover:underline">
                            Quitar filtros
                        </Link>
                    ) : null}
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
                                        <button type="submit" className="h-9 rounded-md border border-[#2563eb] bg-[#2563eb] px-2.5 text-[0.72rem] font-bold text-white transition hover:bg-[#1d4ed8]">Aplicar</button>
                                        <Link href={clearGridFilterHref} preserveScroll className="grid h-9 place-items-center rounded-md border border-[#cbd5e1] bg-white px-2.5 text-[0.72rem] font-bold text-[#475569] no-underline transition hover:bg-[#f8fafc]">Limpiar</Link>
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
                                            <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-[#123f91] px-4 py-3 text-xs font-black text-white">
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
                                        <div className="grid min-h-12 grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-[#123f91] px-4 py-3 text-xs font-black text-white">
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
                                <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-[#123f91] px-4 py-3 text-sm font-black text-white">
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
                                <div className="flex min-h-12 items-center justify-between gap-3 rounded-md bg-[#123f91] px-4 py-3 text-sm font-black text-white">
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

                {isConsultas ? (
                    <div className={ui.pagination}>
                        <span>{paginationSummary}</span>
                        <div className={ui.inlineActions}>
                            {pagination.page > 1 ? (
                                <Link href={paginationHref(Math.max(1, pagination.page - 1))} preserveScroll className={buttonClass('soft', 'sm')}>
                                    <FaChevronLeft aria-hidden="true" /> Anterior
                                </Link>
                            ) : (
                                <button type="button" className={buttonClass('soft', 'sm')} disabled>
                                    <FaChevronLeft aria-hidden="true" /> Anterior
                                </button>
                            )}
                            {pagination.page < pagination.totalPages ? (
                                <Link href={paginationHref(Math.min(pagination.totalPages, pagination.page + 1))} preserveScroll className={buttonClass('soft', 'sm')}>
                                    Siguiente <FaChevronRight aria-hidden="true" />
                                </Link>
                            ) : (
                                <button type="button" className={buttonClass('soft', 'sm')} disabled>
                                    Siguiente <FaChevronRight aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                ) : null}
            </section>
            ) : null}
        </RepairLayout>
    );
}
