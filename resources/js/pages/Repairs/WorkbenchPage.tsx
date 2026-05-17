import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { FaBan, FaCalendarDay, FaCamera, FaCheckCircle, FaClipboardList, FaCopy, FaFilter, FaHourglassEnd, FaImages, FaPlusCircle, FaReceipt, FaSave, FaSearch, FaTimes, FaTools, FaTruck, FaWrench } from 'react-icons/fa';
import { RepairDesktopRow, RepairTicketPanel, repairDesktopTableGridClass } from '../../components/RepairTicketPanel';
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

interface RepairPartInventoryOption {
    id: number;
    quantity: number;
    model: string;
    box: string;
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
    };
    tickets: RepairTicketView[];
    summary: {
        active: number;
        delivered: number;
        pending: number;
        inRepair: number;
        waitingParts: number;
        ready: number;
        overdue: number;
        today: number;
        cancelled: number;
    };
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    partInventory: RepairPartInventoryOption[];
    nextOrderId: number;
    pageMode?: 'consultas' | 'ingreso';
}

interface RepairJobFormData {
    marca: string;
    modelo: string;
    tipo_servicio: string;
    descripcion: string;
    observaciones: string;
    monto: string;
    senia: string;
    fecha_estimada: string;
    estado: string;
    repuesto: string;
    pedir_repuesto: boolean;
    inventory_part_id: string;
    categorias_reparacion: string;
    images: File[] | null;
}

interface WorkbenchCreateFormData {
    id_orden: string;
    nombre_cliente: string;
    dni: string;
    contacto: string;
    jobs: RepairJobFormData[];
}

function createEmptyJob(defaultState: string): RepairJobFormData {
    const today = new Date().toISOString().slice(0, 10);

    return {
        marca: '',
        modelo: '',
        tipo_servicio: '',
        descripcion: '',
        observaciones: 'sin observaciones',
        monto: '0',
        senia: '0',
        fecha_estimada: today,
        estado: defaultState,
        repuesto: '',
        pedir_repuesto: false,
        inventory_part_id: '',
        categorias_reparacion: '4',
        images: null,
    };
}

const phoneBrandOptions = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'TCL', 'LG', 'OTRAS'] as const;

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
        <article className="flex min-h-[86px] min-w-0 flex-col justify-between gap-2 rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-left shadow-sm">
            <div className="text-[0.78rem] font-semibold text-[#475569]">{label}</div>
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
    tone: 'blue' | 'orange' | 'purple' | 'green' | 'red' | 'cyan' | 'yellow';
    href: string;
    active?: boolean;
    icon: JSX.Element;
}): JSX.Element {
    const iconTone = {
        blue: 'from-[#2563eb] to-[#22d3ee]',
        orange: 'from-[#f97316] to-[#fb923c]',
        purple: 'from-[#a78bfa] via-[#8b5cf6] to-[#6d28d9]',
        green: 'from-[#22c55e] to-[#16a34a]',
        red: 'from-[#ef4444] to-[#b91c1c]',
        cyan: 'from-[#0ea5e9] to-[#0284c7]',
        yellow: 'from-[#eab308] to-[#facc15]',
    }[tone];
    const trendTone = {
        blue: 'text-[#1d4ed8]',
        orange: 'text-[#d97706]',
        purple: 'text-[#6d28d9]',
        green: 'text-[#15803d]',
        red: 'text-[#b91c1c]',
        cyan: 'text-[#0ea5e9]',
        yellow: 'text-[#854d0e]',
    }[tone];

    return (
        <Link
            href={href}
            preserveScroll
            className={cn(
                'flex min-h-[86px] min-w-0 flex-col justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left no-underline shadow-sm transition hover:border-[#94a3b8]',
                active ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#cbd5e1]',
            )}
        >
            <div className="text-[0.78rem] font-semibold text-[#475569]">{label}</div>
            <div className="flex items-center justify-between gap-2.5">
                <div className="text-[1.45rem] font-extrabold leading-none text-[#0f172a]">{value}</div>
                <div className={cn('grid h-[28px] w-[28px] place-items-center rounded-md border border-[#cbd5e1] bg-[#f8fafc] text-[0.86rem]', trendTone)}>
                    {icon}
                </div>
            </div>
            <div className={cn('text-[0.82rem] font-semibold', trendTone)}>{trend}</div>
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
                    : 'border-[#cbd5e1] bg-white text-[#334155] hover:border-[#94a3b8] hover:bg-[#f8fafc]',
            )}
        >
            {label}
        </Link>
    );
}

function cleanQuery(query: Record<string, string | number | undefined>): Record<string, string | number> {
    return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== '')) as Record<string, string | number>;
}

export default function WorkbenchPage({
    filters,
    tickets,
    summary,
    states,
    serviceCategories,
    serviceTemplates,
    partInventory,
    nextOrderId,
    pageMode = 'consultas',
}: WorkbenchPageProps): JSX.Element {
    const isConsultas = pageMode === 'consultas';
    const isIngreso = pageMode === 'ingreso';
    const filtersForm = useForm({
        q: filters.q ?? '',
        estado: filters.estado ?? '',
        prioridad: filters.prioridad ?? '',
        summary_range: filters.summary_range ?? 'month',
        summary_from: filters.summary_from ?? '',
        summary_to: filters.summary_to ?? '',
        categoria_filter: filters.categoria_filter ?? '',
        ordenar_por: filters.ordenar_por ?? 'ticket',
        direccion: filters.direccion ?? 'desc',
    });
    const createForm = useForm<WorkbenchCreateFormData>({
        id_orden: String(nextOrderId),
        nombre_cliente: '',
        dni: '',
        contacto: '',
        jobs: [createEmptyJob(states[0] ?? 'PENDIENTE')],
    });
    const [lookupFeedback, setLookupFeedback] = useState<string>('');
    const [lookupBusy, setLookupBusy] = useState(false);
    const [imagePreviews, setImagePreviews] = useState<Record<number, string[]>>({});
    const [duplicateNotice, setDuplicateNotice] = useState('');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [partSearches, setPartSearches] = useState<Record<number, string>>({});
    const visibleRepairs = tickets.reduce((total, ticket) => total + ticket.repairs.length, 0);
    const summaryRange = filters.summary_range ?? 'month';
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
        summaryRange !== 'month' ? summaryRange : '',
        filters.ordenar_por && filters.ordenar_por !== 'ticket' ? filters.ordenar_por : '',
        filters.direccion && filters.direccion !== 'desc' ? filters.direccion : '',
    ].filter((value) => value !== undefined && value !== '').length;
    const filterQuery = (overrides: Record<string, string | number | undefined> = {}): Record<string, string | number> =>
        cleanQuery({
            q: filters.q,
            estado: filters.estado,
            prioridad: filters.prioridad,
            summary_range: summaryRange,
            summary_from: filters.summary_from,
            summary_to: filters.summary_to,
            categoria_filter: categoryFilter,
            ordenar_por: filters.ordenar_por,
            direccion: filters.direccion,
            ...overrides,
        });

    const submitCleanSearch = (preserveScroll = false): void => {
        const query = filtersForm.data.q.trim();

        router.get(
            route('repairs.workbench'),
            query !== '' ? { q: query } : {},
            { preserveScroll },
        );
    };

    const updateJob = (index: number, updater: (job: RepairJobFormData) => RepairJobFormData): void => {
        createForm.setData(
            'jobs',
            createForm.data.jobs.map((job, jobIndex) => (jobIndex === index ? updater(job) : job)),
        );
    };

    const isPhoneCategory = (value: string): boolean => {
        const category = serviceCategories.find((item) => String(item.value) === String(value));

        return category?.label.trim().toLowerCase() === 'celulares';
    };

    const modelWithBrand = (brand: string, currentModel: string): string => {
        const trimmedBrand = brand.trim().toUpperCase();
        const trimmedModel = currentModel.trimStart();

        if (trimmedBrand === '') {
            return currentModel;
        }

        const brandPattern = new RegExp(`^(${phoneBrandOptions.join('|')})\\b\\s*`, 'i');
        const modelWithoutBrand = trimmedModel.replace(brandPattern, '');

        return modelWithoutBrand === '' ? `${trimmedBrand} ` : `${trimmedBrand} ${modelWithoutBrand}`;
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
        updateJob(index, (current) => ({
            ...current,
            categorias_reparacion: value,
            marca: isPhoneCategory(value) ? current.marca : '',
        }));
    };

    const changeJobBrand = (index: number, value: string): void => {
        updateJob(index, (current) => ({
            ...current,
            marca: value,
            modelo: modelWithBrand(value, current.modelo),
        }));
        setPartSearches((current) => ({ ...current, [index]: partSearchFromModel(modelWithBrand(value, createForm.data.jobs[index]?.modelo ?? '')) }));
    };

    const addJob = (job?: RepairJobFormData): void => {
        createForm.setData('jobs', [...createForm.data.jobs, job ? { ...job, images: null } : createEmptyJob(states[0] ?? 'PENDIENTE')]);
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

    const appendJobObservation = (current: string, addition: string): string => {
        const trimmed = current.trim();

        if (trimmed === '' || ['sin observaciones', 'sin observacion'].includes(trimmed.toLowerCase())) {
            return addition;
        }

        if (trimmed.toLowerCase().includes(addition.toLowerCase())) {
            return current;
        }

        return `${trimmed}\n${addition}`;
    };

    const selectInventoryPart = (index: number, part: RepairPartInventoryOption): void => {
        updateJob(index, (job) => ({
            ...job,
            repuesto: part.model,
            pedir_repuesto: false,
            inventory_part_id: String(part.id),
            estado: job.estado === 'EN REPARACION / ESPERA REPUESTO' ? 'PENDIENTE' : job.estado,
            observaciones: appendJobObservation(job.observaciones, `Repuesto en caja ${part.box.toUpperCase()}`),
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

    const formatMoney = (value: number): string => `$${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
    const repairLabelClass = 'grid min-w-0 content-start gap-1.5 text-sm font-semibold text-[#334155]';
    const compactInputClass = ui.repairDenseInput;
    const compactTextareaClass = ui.repairDenseTextarea;
    const fieldPanelBase = 'min-w-0 rounded-lg border p-3';
    const fieldPanelBlue = `${fieldPanelBase} border-[#cbd5e1] bg-white`;
    const fieldPanelGreen = `${fieldPanelBase} border-[#bbf7d0] bg-[#f0fdf4]`;
    const fieldPanelAmber = `${fieldPanelBase} border-[#fed7aa] bg-[#fff7ed]`;
    const fieldPanelPurple = `${fieldPanelBase} border-[#ddd6fe] bg-[#f5f3ff]`;

    const failureTemplates = [
        { label: 'No enciende', value: 'No enciende.' },
        { label: 'Modulo', value: 'Cambio de modulo.' },
        { label: 'Pin de carga', value: 'Falla en pin de carga.' },
        { label: 'Bateria', value: 'Cambio de bateria.' },
        { label: 'Software', value: 'Revision de software.' },
        { label: 'Humedad', value: 'Equipo con posible dano por humedad.' },
    ];
    const descriptionOptions = [
        ...serviceTemplates.map((template) => ({
            key: `service:${template.value}`,
            label: template.label,
            type: 'service' as const,
            value: template.value,
        })),
        ...failureTemplates.map((template) => ({
            key: `failure:${template.label}`,
            label: template.label,
            type: 'failure' as const,
            value: template.value,
        })),
    ].sort((left, right) => left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }));

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

    const applyTemplate = (index: number, serviceType: string): void => {
        const template = serviceTemplates.find((item) => item.value === serviceType);
        const description = template?.description ?? '';

        updateJob(index, (job) => ({
            ...job,
            tipo_servicio: serviceType,
            descripcion: description !== ''
                ? [...job.descripcion.split('\n').map((line) => line.trim()).filter(Boolean), job.modelo.trim() !== '' ? `${description} ${job.modelo}`.trim() : description]
                    .filter((line, lineIndex, lines) => lines.indexOf(line) === lineIndex)
                    .join('\n')
                : job.descripcion,
            repuesto: job.repuesto.trim() === '' ? template?.repuesto ?? '' : job.repuesto,
        }));
    };

    const applyFailureTemplate = (index: number, template: string): void => {
        updateJob(index, (job) => ({
            ...job,
            descripcion: [...job.descripcion.split('\n').map((line) => line.trim()).filter(Boolean), job.modelo.trim() !== '' ? `${template} ${job.modelo}`.trim() : template]
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

    const setJobImages = (index: number, files: FileList | null): void => {
        const currentFiles = createForm.data.jobs[index]?.images ?? [];
        const selected = [...currentFiles, ...Array.from(files ?? [])].slice(0, 2);

        updateJob(index, (job) => ({
            ...job,
            images: selected,
        }));
        setImagePreviews((current) => ({
            ...current,
            [index]: selected.map((file) => URL.createObjectURL(file)),
        }));
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

    const lookupByDni = async (): Promise<void> => {
        if (createForm.data.dni.trim() === '') {
            setLookupFeedback('Ingresá un DNI para recuperar datos previos.');
            return;
        }

        setLookupBusy(true);
        setLookupFeedback('');

        try {
            const response = await window.fetch(`${route('repairs.lookup')}?dni=${encodeURIComponent(createForm.data.dni.trim())}`, {
                headers: {
                    Accept: 'application/json',
                },
            });

            const payload = (await response.json()) as {
                nombre_cliente?: string;
                dni?: number;
                contacto?: string | null;
                ultima_orden?: number;
            } | null;

            if (!response.ok || !payload) {
                setLookupFeedback('No encontramos un cliente previo con ese DNI.');
                return;
            }

            createForm.setData((current) => ({
                ...current,
                nombre_cliente: payload.nombre_cliente ?? current.nombre_cliente,
                dni: payload.dni ? String(payload.dni) : current.dni,
                contacto: payload.contacto ?? current.contacto,
            }));
            setLookupFeedback(`Cliente recuperado. Ultima orden: #${payload.ultima_orden ?? '-'}.`);
        } catch {
            setLookupFeedback('No se pudo consultar el DNI en este momento.');
        } finally {
            setLookupBusy(false);
        }
    };

    return (
        <RepairLayout title={isConsultas ? 'Consultas' : 'Ingreso'}>
            {isConsultas ? (
            <section className="sticky top-2 z-20 grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-2 shadow-sm xl:hidden">
                <form
                    className="grid grid-cols-[minmax(0,1fr)_44px_44px] gap-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        submitCleanSearch(true);
                    }}
                >
                    <input
                        className="min-h-10 min-w-0 rounded-md border border-[#cbd5e1] bg-white px-3 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar"
                        value={filtersForm.data.q}
                        onChange={(event) => filtersForm.setData('q', event.target.value)}
                    />
                    <button type="submit" className="grid min-h-10 place-items-center rounded-md bg-[#2563eb] text-white" aria-label="Buscar">
                        <FaSearch aria-hidden="true" />
                    </button>
                    <button type="button" className="relative grid min-h-10 place-items-center rounded-md border border-[#cbd5e1] bg-white text-[#334155]" onClick={() => setMobileFiltersOpen(true)} aria-label="Abrir filtros">
                        <FaFilter aria-hidden="true" />
                        {activeMobileFilters > 0 ? <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-md bg-[#ef4444] px-1 text-[0.65rem] font-bold text-white">{activeMobileFilters}</span> : null}
                    </button>
                </form>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 text-[0.68rem] font-bold text-[#334155]">
                    <span className="rounded-md bg-[#eff6ff] px-2 py-1">Todas {summary.active}</span>
                    <span className="rounded-md bg-[#fff7ed] px-2 py-1">Pend. {summary.pending}</span>
                    <span className="rounded-md bg-[#ecfdf5] px-2 py-1">Listas {summary.ready}</span>
                    <span className="rounded-md bg-[#fff1f2] px-2 py-1">Venc. {summary.overdue}</span>
                    <span className="rounded-md bg-[#fefce8] px-2 py-1">Hoy {summary.today}</span>
                </div>
            </section>
            ) : null}

            {isConsultas ? (
            <section className="hidden rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 shadow-sm xl:block">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="mr-1 text-[0.78rem] font-semibold text-[#475569]">Periodo</span>
                        {periodOptions.map((option) => (
                            <FilterPill
                                key={option.value}
                                label={option.label}
                                href={route(
                                    'repairs.workbench',
                                    filterQuery({
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
                        <span className="mr-1 text-[0.78rem] font-semibold text-[#475569]">Categorias</span>
                        {categoryOptions.map((option) => (
                            <FilterPill
                                key={option.value || 'all'}
                                label={option.label}
                                href={route('repairs.workbench', filterQuery({ categoria_filter: option.value || undefined }))}
                                active={categoryFilter === option.value}
                            />
                        ))}
                    </div>
                </div>
            </section>
            ) : null}

            {isConsultas && summaryRange === 'custom' ? (
                <form
                    className="hidden gap-2 rounded-lg border border-[#cbd5e1] bg-white p-3 shadow-sm md:grid-cols-[180px_180px_auto] md:items-end xl:grid"
                    onSubmit={(event) => {
                        event.preventDefault();
                        filtersForm.get(route('repairs.workbench'), { preserveScroll: true });
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

            {isConsultas ? (
            <section className="hidden grid-cols-2 gap-2 md:grid-cols-4 xl:grid xl:grid-cols-8">
                <SummaryFilterCard label="Total órdenes" value={summary.active} trend="En consultas" tone="blue" href={route('repairs.workbench', filterQuery({ q: undefined, estado: undefined, prioridad: undefined }))} active={!filters.estado && !filters.prioridad} icon={<FaClipboardList aria-hidden="true" />} />
                <SummaryFilterCard label="Pendientes" value={summary.pending} trend="En trabajo" tone="orange" href={route('repairs.workbench', filterQuery({ q: undefined, estado: 'PENDIENTE', prioridad: undefined }))} active={filters.estado === 'PENDIENTE'} icon={<FaTools aria-hidden="true" />} />
                <SummaryFilterCard label="En reparación" value={summary.inRepair} trend="Espera / repuesto" tone="purple" href={route('repairs.workbench', filterQuery({ q: undefined, estado: 'EN REPARACION / ESPERA REPUESTO', prioridad: undefined }))} active={filters.estado === 'EN REPARACION' || filters.estado === 'EN REPARACION / ESPERA REPUESTO'} icon={<FaWrench aria-hidden="true" />} />
                <SummaryFilterCard label="Listas" value={summary.ready} trend="Para retirar" tone="green" href={route('repairs.workbench', filterQuery({ q: undefined, estado: 'LISTA', prioridad: undefined }))} active={filters.estado === 'LISTA'} icon={<FaCheckCircle aria-hidden="true" />} />
                <SummaryFilterCard label="Vencidas" value={summary.overdue} trend="Prioridad alta" tone="red" href={route('repairs.workbench', filterQuery({ q: undefined, estado: undefined, prioridad: 'vencidas' }))} active={filters.prioridad === 'vencidas'} icon={<FaHourglassEnd aria-hidden="true" />} />
                <SummaryFilterCard label="Retiran hoy" value={summary.today} trend="Agendadas hoy" tone="yellow" href={route('repairs.workbench', filterQuery({ q: undefined, estado: undefined, prioridad: 'hoy' }))} active={filters.prioridad === 'hoy'} icon={<FaCalendarDay aria-hidden="true" />} />
                <SummaryFilterCard label="Canceladas" value={summary.cancelled} trend="No continuadas" tone="red" href={route('repairs.workbench', filterQuery({ q: undefined, estado: 'CANCELADA', prioridad: undefined }))} active={filters.estado === 'CANCELADA'} icon={<FaBan aria-hidden="true" />} />
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
                className="hidden rounded-lg border border-[#cbd5e1] bg-white px-3 py-3 shadow-sm xl:block"
                onSubmit={(event) => {
                    event.preventDefault();
                    submitCleanSearch();
                }}
            >
                <div className="grid gap-2 md:grid-cols-[minmax(16rem,0.85fr)_200px_180px_160px_auto] md:items-center">
                    <div className="relative min-w-0">
                    <input
                        className="min-h-10 w-full rounded-md border border-[#cbd5e1] bg-white py-2 pl-3 pr-10 text-sm font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        placeholder="Buscar por cliente, ticket, modelo, descripción, contacto o DNI"
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
                    <select
                        className="min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        value={filtersForm.data.estado}
                        onChange={(event) => {
                            filtersForm.setData('estado', event.target.value);
                            filtersForm.setData('prioridad', '');
                        }}
                    >
                        <option value="">Todos los estados</option>
                        {states.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                    <select
                        className="min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        value={filtersForm.data.ordenar_por}
                        onChange={(event) => filtersForm.setData('ordenar_por', event.target.value)}
                        aria-label="Ordenar por"
                    >
                        <option value="ticket">Ordenar: ticket</option>
                        <option value="ingreso">Ordenar: ingreso</option>
                        <option value="estimada">Ordenar: estimada</option>
                        <option value="cliente">Ordenar: cliente</option>
                        <option value="modelo">Ordenar: modelo</option>
                        <option value="estado">Ordenar: estado</option>
                        <option value="saldo">Ordenar: saldo</option>
                    </select>
                    <select
                        className="min-h-10 rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20]"
                        value={filtersForm.data.direccion}
                        onChange={(event) => filtersForm.setData('direccion', event.target.value)}
                        aria-label="Direccion del orden"
                    >
                        <option value="desc">DESCENDENTE</option>
                        <option value="asc">ASCENDENTE</option>
                    </select>
                    <button className="min-h-10 rounded-md border border-[#2563eb] bg-[#2563eb] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1d4ed8]" type="submit">
                        Buscar
                    </button>
                </div>
            </form>
            ) : null}

            {isConsultas && mobileFiltersOpen ? (
                <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 xl:hidden" role="dialog" aria-modal="true">
                    <form
                        className="max-h-[86vh] w-full overflow-y-auto rounded-t-lg bg-white p-4 shadow-lg"
                        onSubmit={(event) => {
                            event.preventDefault();
                            filtersForm.get(route('repairs.workbench'), {
                                preserveScroll: true,
                                onFinish: () => setMobileFiltersOpen(false),
                            });
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
                                    <option value="">Todos los estados</option>
                                    {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </label>

                            <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                Prioridad
                                <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.prioridad} onChange={(event) => { filtersForm.setData('prioridad', event.target.value); filtersForm.setData('estado', ''); }}>
                                    <option value="">Todas</option>
                                    <option value="vencidas">Vencidas</option>
                                    <option value="hoy">Retiran hoy</option>
                                </select>
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                <label className="grid gap-1 text-xs font-semibold text-[#475569]">
                                    Categoria
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
                                    Direccion
                                    <select className="min-h-11 rounded-xl border border-[#bfdbfe] bg-white px-3 text-sm font-bold text-[#0f172a]" value={filtersForm.data.direccion} onChange={(event) => filtersForm.setData('direccion', event.target.value)}>
                                        <option value="desc">DESCENDENTE</option>
                                        <option value="asc">ASCENDENTE</option>
                                    </select>
                                </label>
                            </div>
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
                        onSubmit={(event) => {
                            event.preventDefault();
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
                                    setPartSearches({});
                                },
                            });
                        }}
                    >
                        <div className={ui.repairCardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Datos del cliente</p>
                                <h2 className={ui.cardTitle}>Informacion general</h2>
                                <p className={ui.inlineCaption}>Estos datos se comparten entre todos los trabajos de la orden.</p>
                            </div>
                        </div>

                        <div className="grid items-start gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3 md:grid-cols-2 md:p-4 xl:grid-cols-[10rem_minmax(18rem,1fr)_12rem_14rem]">
                            <label className={repairLabelClass}>ID de orden *<input className={compactInputClass} type="number" min="1" value={createForm.data.id_orden} onChange={(event) => createForm.setData('id_orden', event.target.value)} required /><span className="text-xs font-semibold text-[#64748b]">Editable si esta libre.</span></label>
                            <label className={repairLabelClass}>Nombre del cliente *<input className={compactInputClass} value={createForm.data.nombre_cliente} onChange={(event) => createForm.setData('nombre_cliente', event.target.value)} required /></label>
                            <label className={repairLabelClass}>DNI<div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:grid-cols-1"><input className={compactInputClass} type="number" min="1" max="99999999" value={createForm.data.dni} onChange={(event) => createForm.setData('dni', event.target.value)} onBlur={() => void lookupByDni()} /><button className={buttonClass('soft', 'sm')} type="button" onClick={() => void lookupByDni()} disabled={lookupBusy}>{lookupBusy ? 'Buscando...' : 'Buscar DNI'}</button></div></label>
                            <label className={repairLabelClass}>Telefono / contacto<input className={compactInputClass} value={createForm.data.contacto} onChange={(event) => createForm.setData('contacto', event.target.value)} /><span className="text-xs font-semibold text-[#64748b]">Opcional. Si queda vacio se guarda sin contacto.</span></label>
                            {lookupFeedback !== '' ? <p className="md:col-span-4 rounded-md bg-[#eff6ff] px-3 py-2 text-sm font-bold text-[#1d4ed8]">{lookupFeedback}</p> : null}
                        </div>

                        <div className="grid gap-4">
                            {createForm.data.jobs.map((job, index) => (
                                <article key={`job-v2-${index}`} className={cn('rounded-lg border bg-white p-3 shadow-sm md:p-4', Number(job.monto || 0) <= 0 ? 'border-[#fed7aa]' : Number(job.senia || 0) > 0 ? 'border-[#bbf7d0]' : 'border-[#cbd5e1]')}>
                                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2 md:mb-4 md:gap-3">
                                        <div className={ui.cardTitleWrap}>
                                            <p className={ui.eyebrow}>Reparacion activa</p>
                                            <h3 className="text-base font-black tracking-tight text-ink-950 md:text-xl">Orden #{createForm.data.id_orden || nextOrderId} - Reparacion #{index + 1}</h3>
                                            <p className="text-xs font-semibold text-slate-500 md:text-sm">Completa equipo, falla, presupuesto, repuesto y fotos.</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={ui.repairMiniChip}>{Number(job.monto || 0) <= 0 ? 'A presupuestar' : Number(job.senia || 0) > 0 ? 'Con sena' : 'Presupuestado'}</span>
                                            <span className={ui.repairMiniChip}>{imagePreviews[index]?.length ? `${imagePreviews[index].length} foto(s)` : 'Sin fotos'}</span>
                                            <button className={buttonClass('soft', 'sm')} type="button" onClick={() => duplicateJob(index)} aria-label="Duplicar trabajo"><FaCopy aria-hidden="true" /></button>
                                            {createForm.data.jobs.length > 1 ? <button type="button" className={buttonClass('danger', 'sm')} onClick={() => removeJob(index)} aria-label="Eliminar trabajo"><FaTimes aria-hidden="true" /></button> : null}
                                        </div>
                                    </div>

                                    <div className="grid min-w-0 items-start gap-3 md:grid-cols-2">
                                        <div className={fieldPanelPurple}>
                                            <label className={repairLabelClass}>Categoria<select className={compactInputClass} value={job.categorias_reparacion} onChange={(event) => changeJobCategory(index, event.target.value)}>{serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
                                        </div>
                                        {isPhoneCategory(job.categorias_reparacion) ? (
                                            <div className={fieldPanelPurple}>
                                                <label className={repairLabelClass}>
                                                    Marca
                                                    <select className={compactInputClass} value={job.marca} onChange={(event) => changeJobBrand(index, event.target.value)}>
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
                                        <div className={fieldPanelBlue}>
                                            <label className={repairLabelClass}>Modelo / equipo<input className={compactInputClass} value={job.modelo} onChange={(event) => changeJobModel(index, event.target.value)} /></label>
                                        </div>
                                        <div className={cn(fieldPanelBlue, 'md:col-span-2')}>
                                            <label className={repairLabelClass}>Tipo de servicio / descripcion de la falla *</label>
                                            <select className={compactInputClass} value="" onChange={(event) => applyDescriptionOption(index, event.target.value)}>
                                                <option value="">Agregar tipo o falla...</option>
                                                {descriptionOptions.map((option) => (
                                                    <option key={option.key} value={option.key}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <textarea className={compactTextareaClass} rows={4} value={job.descripcion} onChange={(event) => updateJob(index, (current) => ({ ...current, descripcion: event.target.value }))} required />
                                            <span className="text-xs font-semibold text-[#64748b]">El menu esta ordenado alfabeticamente y agrega cada seleccion en la descripcion.</span>
                                        </div>
                                        <div className={fieldPanelGreen}>
                                            <label className={repairLabelClass}>Monto ($)<input className={compactInputClass} type="number" step="100" min="0" value={job.monto} onFocus={() => clearAmountForTyping(index, 'monto')} onChange={(event) => updateJob(index, (current) => ({ ...current, monto: event.target.value }))} /><span className="text-xs font-semibold text-[#64748b]">Opcional. Vacio queda en 0.</span></label>
                                        </div>
                                        <div className={fieldPanelGreen}>
                                            <label className={repairLabelClass}>Sena ($)<input className={compactInputClass} type="number" step="100" min="0" value={job.senia} onFocus={() => clearAmountForTyping(index, 'senia')} onChange={(event) => updateJob(index, (current) => ({ ...current, senia: event.target.value }))} /></label>
                                        </div>
                                        <div className={fieldPanelAmber}>
                                            <label className={repairLabelClass}>Fecha estimada<input className={compactInputClass} type="date" value={job.fecha_estimada} onChange={(event) => updateJob(index, (current) => ({ ...current, fecha_estimada: event.target.value }))} /></label>
                                        </div>
                                        <div className={fieldPanelPurple}>
                                            <label className={repairLabelClass}>Observaciones<textarea className={compactTextareaClass} rows={4} value={job.observaciones} onFocus={() => { if (job.observaciones.trim().toLowerCase() === 'sin observaciones') updateJob(index, (current) => ({ ...current, observaciones: '' })); }} onChange={(event) => updateJob(index, (current) => ({ ...current, observaciones: event.target.value }))} /></label>
                                        </div>
                                        <div className="grid min-w-0 gap-3 rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <strong className="text-sm text-[#0f172a]">Imagenes ({imagePreviews[index]?.length ?? 0}/2)</strong>
                                                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{imagePreviews[index]?.length ?? 0}/2</span>
                                            </div>
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <label className={buttonClass('primary', 'sm')}><FaCamera aria-hidden="true" /> Sacar foto<input className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => setJobImages(index, event.target.files)} /></label>
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
                                        <div className={cn(fieldPanelAmber, 'md:col-span-2')}>
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
                            ))}
                        </div>

                        <section className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-4 md:grid-cols-[repeat(4,minmax(0,1fr))]">
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Reparaciones</span><strong className="block text-xl font-black text-[#0f172a]">{createForm.data.jobs.length}</strong></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Presupuesto total</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.monto)}</strong></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Senas</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(totals.senia)}</strong></div>
                            <div className="rounded-lg border border-[#cbd5e1] bg-white p-3"><span className="text-xs font-semibold text-[#64748b]">Saldo estimado</span><strong className="block text-xl font-black text-[#0f172a]">{formatMoney(Math.max(0, totals.monto - totals.senia))}</strong></div>
                            <div className="hidden gap-2 border-t border-[#dbeafe] pt-3 md:col-span-4 lg:grid lg:grid-cols-[auto_auto] lg:justify-end">
                                <button className={buttonClass('soft')} type="button" onClick={() => addJob()}><FaPlusCircle aria-hidden="true" /> Agregar reparacion</button>
                                <button className={buttonClass('primary')} type="submit" disabled={createForm.processing}><FaSave aria-hidden="true" /> {createForm.processing ? 'Guardando...' : 'Guardar orden'}</button>
                            </div>
                        </section>

                        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between lg:hidden">
                            <button className={buttonClass('soft')} type="button" onClick={() => addJob()}><FaPlusCircle aria-hidden="true" /> Agregar reparacion</button>
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
                            createForm.post(route('repairs.orders.store'), {
                                preserveScroll: true,
                                forceFormData: true,
                                onSuccess: () => {
                                    createForm.reset();
                                    createForm.setData('jobs', [createEmptyJob(states[0] ?? 'PENDIENTE')]);
                                    setLookupFeedback('');
                                },
                            });
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
                                    onChange={(event) => createForm.setData('dni', event.target.value)}
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
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, monto: event.target.value }))}
                                        />
                                        <input
                                            className={ui.input}
                                            placeholder="Senia"
                                            value={job.senia}
                                            onFocus={() => clearAmountForTyping(index, 'senia')}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, senia: event.target.value }))}
                                        />
                                        <input
                                            className={ui.input}
                                            type="date"
                                            value={job.fecha_estimada}
                                            onChange={(event) => updateJob(index, (current) => ({ ...current, fecha_estimada: event.target.value }))}
                                        />
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
                <div className="flex flex-wrap items-center justify-between gap-2 text-[0.92rem] font-semibold text-[#475569]">
                    <span>Mostrando {visibleRepairs} reparacion{visibleRepairs === 1 ? '' : 'es'} en {tickets.length} ticket{tickets.length === 1 ? '' : 's'}.</span>
                    <span>Consulta técnica</span>
                </div>
                <div className="hidden overflow-x-auto rounded-lg border border-[#cbd5e1] bg-white shadow-sm xl:block">
                    <div className="min-w-[1320px]">
                        <div className={cn('grid min-w-[1320px] items-stretch divide-x divide-[#cbd5e1] border-b border-[#cbd5e1] bg-[#f8fafc] text-[0.62rem] font-bold text-[#475569] [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2', repairDesktopTableGridClass)}>
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
                            <span className="text-center">Acciones</span>
                        </div>
                        <div className="grid bg-white">
                            {tickets.length > 0 ? (
                                tickets.flatMap((ticket) =>
                                    ticket.repairs.map((repair, repairIndex) => (
                                        <RepairDesktopRow
                                            key={`desktop-table-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                                            ticket={ticket}
                                            repair={repair}
                                            serviceCategories={serviceCategories}
                                            partInventory={partInventory}
                                            rowIndex={repairIndex}
                                            rowTotal={ticket.repairs.length}
                                        />
                                    )),
                                )
                            ) : (
                                <div className="px-4 py-8 text-center text-sm font-bold text-[#64748b]">No hay tickets activos para los filtros actuales.</div>
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
                            serviceCategories={serviceCategories}
                            partInventory={partInventory}
                            allowAddRepair
                        />
                    ))}
                    {tickets.length === 0 ? <div className="rounded-lg border border-[#cbd5e1] bg-white p-6 text-center font-semibold text-[#475569] shadow-sm">No hay tickets activos para los filtros actuales.</div> : null}
                </div>
            </section>
            ) : null}
        </RepairLayout>
    );
}
