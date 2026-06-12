import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    FaArrowRight,
    FaArchive,
    FaCamera,
    FaCheckCircle,
    FaClipboardCheck,
    FaChevronDown,
    FaDollyFlatbed,
    FaEdit,
    FaImage,
    FaImages,
    FaInfoCircle,
    FaPlus,
    FaReceipt,
    FaSave,
    FaSearch,
    FaTimes,
    FaTrashAlt,
    FaWhatsapp,
} from 'react-icons/fa';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import type { RepairImageView, RepairOrderView, RepairTicketView } from '../types';
import { repairButtonClass as buttonClass, repairUi as ui } from '../repairUi';
import { cn, formatAmountInput, formatCurrency } from '../utils';

interface ServiceCategoryOption {
    value: number;
    label: string;
}

interface RepairPartInventoryOption {
    id: number;
    quantity: number;
    model: string;
    box: string;
}

interface ServiceTemplateOption {
    value: string;
    label: string;
    description: string;
    repuesto: string;
}

export const repairDesktopTableGridClass =
    'grid-cols-[6.8rem_minmax(5.5rem,0.44fr)_4.6rem_5.6rem_5.2rem_4.1rem_minmax(9.9rem,1.03fr)_minmax(9rem,0.92fr)_5.5rem_4.6rem_6.5rem_minmax(20.1rem,1.29fr)]';

interface RepairTicketPanelProps {
    ticket: RepairTicketView;
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates?: ServiceTemplateOption[];
    partInventory?: RepairPartInventoryOption[];
    allowAddRepair?: boolean;
    readOnly?: boolean;
    archived?: boolean;
}

interface RepairUpdateFormData {
    id_nuevo: string;
    fecha: string;
    nombre_cliente: string;
    dni: string;
    contacto: string;
    marca: string;
    modelo: string;
    descripcion: string;
    observaciones: string;
    info: string;
    monto: string;
    senia: string;
    fecha_estimada: string;
    estado: string;
    fecha_entregado: string;
    repuesto: string;
    repuesto_pedido: boolean;
    inventory_part_id: string;
    categorias_reparacion: string;
    images: File[] | null;
    final_images: File[] | null;
}

interface AddRepairFormData {
    marca: string;
    modelo: string;
    tipo_servicio: string;
    descripcion: string;
    observaciones: string;
    monto: string;
    senia: string;
    fecha_estimada: string;
    repuesto: string;
    repuesto_pedido: boolean;
    inventory_part_id: string;
    categorias_reparacion: string;
    images: File[] | null;
}

interface PaymentFormData {
    amount: string;
    method: string;
    notes: string;
    paid_at: string;
}

type DeliveryVia = 'dni' | 'ticket' | 'persona' | 'otra';

const phoneBrandOptions = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG', 'OTRAS'] as const;

function isPhoneCategoryValue(serviceCategories: ServiceCategoryOption[], value: string | number | null | undefined): boolean {
    const category = serviceCategories.find((item) => String(item.value) === String(value));

    return category?.label.toLowerCase().includes('celular') ?? false;
}

function normalizeStatus(status: string): string {
    return status.toUpperCase();
}

function compactStatus(status: string): string {
    return status === 'EN REPARACION / ESPERA REPUESTO' ? 'EN REPARACION' : status;
}

function repairStatusHeaderClass(status: string): string {
    const normalized = normalizeStatus(status);

    if (normalized === 'LISTA') return 'bg-[#16a34a] text-white';
    if (normalized === 'CANCELADA') return 'bg-[#dc2626] text-white';
    if (normalized === 'EN REPARACION' || normalized === 'EN REPARACION / ESPERA REPUESTO') return 'bg-[#6d28d9] text-white';
    if (normalized === 'PENDIENTE') return 'bg-[#facc15] text-[#111827]';

    return 'bg-[#64748b] text-white';
}

function repairStatusBadgeClass(status: string): string {
    const normalized = normalizeStatus(status);

    if (normalized === 'LISTA') return 'bg-[#198754] text-white';
    if (normalized === 'CANCELADA') return 'bg-[#dc3545] text-white';
    if (normalized === 'EN REPARACION' || normalized === 'EN REPARACION / ESPERA REPUESTO') return 'bg-[#6d28d9] text-white';
    if (normalized === 'PENDIENTE') return 'bg-[#ffc107] text-[#111827]';

    return 'bg-[#6c757d] text-white';
}

function repairStatusSelectClass(status: string): string {
    const normalized = normalizeStatus(status);

    if (normalized === 'LISTA') return 'border-[#198754] bg-[#eaf7ef] text-[#0f5132]';
    if (normalized === 'CANCELADA') return 'border-[#dc3545] bg-[#fdecef] text-[#842029]';
    if (normalized === 'EN REPARACION' || normalized === 'EN REPARACION / ESPERA REPUESTO') return 'border-[#6d28d9] bg-[#f0eaff] text-[#4c1d95]';
    if (normalized === 'PENDIENTE') return 'border-[#ffc107] bg-[#fff8db] text-[#664d03]';

    return 'border-[#6c757d] bg-slate-100 text-slate-800';
}

function desktopGroupedRepairClass(index: number): string {
    const tones = [
        'border-l-[#1d4ed8] bg-white',
        'border-l-[#7c3aed] bg-[#fbfaff]',
        'border-l-[#0f766e] bg-[#f8fffd]',
        'border-l-[#b45309] bg-[#fffdf8]',
    ];

    return tones[index % tones.length];
}

function nextQuickStatus(status: string): string {
    if (status === 'PENDIENTE') return 'EN REPARACION';
    if (status === 'EN REPARACION' || status === 'EN REPARACION / ESPERA REPUESTO') return 'LISTA';
    if (status === 'LISTA') return 'PENDIENTE';

    return status;
}

function formatLegacyDate(value?: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
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

function deliveredDetailLabel(value?: string | null): string {
    const days = daysSinceDate(value);

    if (days === null) return 'Sin fecha';
    if (days === 0) return 'Entregada hoy';
    if (days === 1) return 'Entregada hace 1 dia';

    return `Entregada hace ${days} dias`;
}

function isToday(value?: string | null): boolean {
    if (!value) return false;
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return value === today;
}

function todayInputValue(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function isOverdue(repair: RepairOrderView): boolean {
    if (!repair.fecha_estimada || repair.entregado === 'si') return false;
    if (!['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'].includes(repair.estado)) return false;

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return repair.fecha_estimada < today;
}

function overdueDays(repair: RepairOrderView): number | null {
    if (!isOverdue(repair) || !repair.fecha_estimada) return null;

    const [year, month, day] = repair.fecha_estimada.split('-').map(Number);
    if (!year || !month || !day) return null;

    const estimatedDate = new Date(year, month - 1, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.floor((today.getTime() - estimatedDate.getTime()) / 86400000);

    return days > 0 ? days : null;
}

function overdueLabel(repair: RepairOrderView): string | null {
    const days = overdueDays(repair);

    if (days === null) return null;

    return `Vencida hace ${days} ${days === 1 ? 'dia' : 'dias'}`;
}

function normalizeRepairText(value?: string | null): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const knownDeviceBrands = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'];

function inferredRepairBrand(repair: RepairOrderView): string {
    const storedBrand = normalizeRepairText(repair.marca);
    if (storedBrand !== '') return storedBrand;

    const normalizedDescription = normalizeRepairText(repair.descripcion);
    const normalizedModel = normalizeRepairText(repair.modelo);

    const modelBrand = knownDeviceBrands.find((brand) => normalizedModel === brand || normalizedModel.startsWith(`${brand} `));
    if (modelBrand !== undefined) return modelBrand;

    return knownDeviceBrands.find((brand) => {
        if (normalizedDescription === brand || normalizedDescription.endsWith(` ${brand}`)) return true;
        return normalizedModel !== '' && normalizedDescription.endsWith(` ${brand} ${normalizedModel}`);
    }) ?? '';
}

function modelWithoutKnownBrand(model: string): string {
    const trimmedModel = model.trim();
    const normalizedModel = normalizeRepairText(trimmedModel);
    const brand = knownDeviceBrands.find((knownBrand) => normalizedModel.startsWith(`${knownBrand} `));

    return brand ? trimmedModel.slice(brand.length).trimStart() : trimmedModel;
}

function displayRepairModel(repair: RepairOrderView): string {
    const model = (repair.modelo ?? '').trim();
    const brand = inferredRepairBrand(repair);

    if (model === '') return brand || '-';

    const normalizedModel = normalizeRepairText(model);
    if (brand === '' || normalizedModel === brand || normalizedModel.startsWith(`${brand} `)) {
        return model;
    }

    return `${brand} ${model}`.trim();
}

function descriptionWithoutRepeatedModel(description?: string | null, model?: string | null, brand?: string | null): string {
    const rawDescription = (description ?? '').trim();
    const rawModel = (model ?? '').trim();
    const rawBrand = (brand ?? '').trim();
    const trailingTokens = [rawBrand && rawModel ? `${rawBrand} ${rawModel}` : '', rawModel, rawBrand]
        .map((token) => token.trim())
        .filter((token, index, tokens) => token !== '' && tokens.indexOf(token) === index);

    if (rawDescription === '' || trailingTokens.length === 0) {
        return rawDescription;
    }

    return rawDescription
        .split('\n')
        .map((line) => {
            let trimmedLine = line.trim();

            trailingTokens.forEach((token) => {
                const normalizedToken = normalizeRepairText(token);
                const normalizedLine = normalizeRepairText(trimmedLine);

                if (normalizedLine === normalizedToken) {
                    trimmedLine = '';
                    return;
                }

                if (normalizedLine.endsWith(` ${normalizedToken}`)) {
                    trimmedLine = trimmedLine.slice(0, Math.max(0, trimmedLine.length - token.length)).trim();
                }
            });

            return trimmedLine;
        })
        .filter(Boolean)
        .join('\n')
        .trim();
}

function ModalShell({
    title,
    children,
    onClose,
    tone = 'default',
}: {
    title: string;
    children: ReactNode;
    onClose: () => void;
    tone?: 'default' | 'primary' | 'warning';
}): JSX.Element {
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 px-3 py-6" role="dialog" aria-modal="true">
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg border border-[#cbd5e1] bg-white shadow-lg">
                <header
                    className={cn(
                        'flex items-center justify-between gap-3 border-b px-4 py-3',
                        tone === 'primary' && 'border-[#0b5ed7] bg-[#0d6efd] text-white',
                        tone === 'warning' && 'border-[#e0a800] bg-[#ffc107] text-[#111827]',
                        tone === 'default' && 'border-slate-200 bg-[#f8fafc] text-[#0f172a]',
                    )}
                >
                    <h3 className="flex items-center gap-2 text-base font-black">
                        {tone === 'primary' ? <FaEdit aria-hidden="true" /> : null}
                        {tone === 'warning' ? <FaDollyFlatbed aria-hidden="true" /> : null}
                        {title}
                    </h3>
                    <button type="button" className={cn('grid h-9 w-9 place-items-center rounded-lg border bg-white', tone === 'primary' ? 'border-white/40 text-[#0d6efd]' : 'border-slate-300 text-slate-700')} onClick={onClose} title="Cerrar">
                        <FaTimes aria-hidden="true" />
                    </button>
                </header>
                <div className="max-h-[calc(92vh-60px)] overflow-y-auto p-4">{children}</div>
            </div>
        </div>
    );
}

function FieldSummary({
    label,
    value,
    strong = false,
    onClick,
}: {
    label: string;
    value: ReactNode;
    strong?: boolean;
    onClick?: () => void;
}): JSX.Element {
    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            className={cn(
                'grid min-w-0 gap-0.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-left',
                onClick && 'cursor-pointer transition hover:border-[#94a3b8] hover:bg-[#f8fafc]',
            )}
            onClick={onClick}
        >
            <span className="text-[0.72rem] font-semibold text-slate-500">{label}</span>
            <span className={cn('text-sm text-[#0f172a]', strong && 'font-black')}>{value}</span>
        </Wrapper>
    );
}

function PaymentStatus({ monto, senia }: { monto: number; senia: number }): JSX.Element {
    if (monto <= 0 && senia <= 0) {
        return (
            <span className="inline-flex w-fit items-center rounded-md border border-amber-200 bg-amber-100 px-2.5 py-1 text-[0.68rem] font-bold text-amber-900">
                COTIZAR
            </span>
        );
    }

    if (monto > 0 && senia >= monto) {
        return (
            <span className="inline-flex w-fit items-center rounded-md border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-800">
                PAGADO
            </span>
        );
    }

    return <>{formatCurrency(Math.max(0, monto - senia))}</>;
}

function EditField({
    label,
    children,
    note,
}: {
    label: string;
    children: ReactNode;
    note?: string;
}): JSX.Element {
    return (
        <label className="grid min-w-0 gap-1.5">
            <span className="text-[0.83rem] font-black text-[#0f172a]">{label}</span>
            {children}
            {note ? <span className="text-[0.75rem] font-semibold text-slate-500">{note}</span> : null}
        </label>
    );
}

function EditSection({ title, children }: { title: string; children: ReactNode }): JSX.Element {
    return (
        <section className="grid content-start gap-3">
            <h4 className="border-b border-[#bfdbfe] pb-2 text-sm font-black text-[#0d6efd]">{title}</h4>
            {children}
        </section>
    );
}

function normalizeFieldValue(value: unknown): string {
    return String(value ?? '').trim();
}

function hasRegisteredValue(value: unknown): boolean {
    const normalized = normalizeFieldValue(value);

    return normalized !== '' && normalized !== '0' && normalized !== '$ 0';
}

function hasChangedValue(current: unknown, original: unknown): boolean {
    return normalizeFieldValue(current) !== normalizeFieldValue(original);
}

function changedInputClass(current: unknown, original: unknown, extra?: string, markRegistered = true): string {
    const changed = hasChangedValue(current, original);
    const registered = markRegistered && hasRegisteredValue(current);

    return cn(
        ui.repairDenseInput,
        registered && !changed && 'border-2 border-[#0ea5e9] bg-[#f0f9ff]',
        changed && 'border-2 border-[#2563eb] bg-[#dbeafe] ring-2 ring-[#60a5fa]',
        extra,
    );
}

function changedTextareaClass(current: unknown, original: unknown, extra?: string, markRegistered = true): string {
    const changed = hasChangedValue(current, original);
    const registered = markRegistered && hasRegisteredValue(current);

    return cn(
        ui.repairDenseTextarea,
        registered && !changed && 'border-2 border-[#0ea5e9] bg-[#f0f9ff]',
        changed && 'border-2 border-[#2563eb] bg-[#dbeafe] ring-2 ring-[#60a5fa]',
        extra,
    );
}

function InventoryAssignmentPanel({
    model,
    box,
    readOnly,
    onClear,
}: {
    model?: string | null;
    box?: string | null;
    readOnly?: boolean;
    onClear?: () => void;
}): JSX.Element | null {
    if (!model || !box) {
        return null;
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm text-[#166534]">
            <div className="grid gap-0.5">
                <strong className="font-black text-[#14532d]">Repuesto asignado</strong>
                <span className="font-bold">{model} - Caja {box.toUpperCase()}</span>
            </div>
            {!readOnly && onClear ? (
                <button type="button" className="rounded-md border border-[#86efac] bg-white px-2.5 py-1 text-xs font-bold text-[#166534] hover:bg-[#dcfce7]" onClick={onClear}>
                    Devolver a caja
                </button>
            ) : null}
        </div>
    );
}

function ImageUploadPicker({
    title,
    help,
    disabled,
    previews,
    onSelect,
    onRemove,
}: {
    title: string;
    help: string;
    disabled?: boolean;
    previews: string[];
    onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    onRemove?: (index: number) => void;
}): JSX.Element {
    return (
        <div className={cn('grid gap-3 rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] p-3', disabled && 'opacity-60')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-[#0f172a]">{title}</strong>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{previews.length}/2</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                <label className={cn(buttonClass('primary', 'sm'), disabled && 'pointer-events-none')}>
                    <FaCamera aria-hidden="true" />
                    Sacar foto
                    <input className="sr-only" type="file" accept="image/*" capture="environment" disabled={disabled} onChange={onSelect} />
                </label>
                <label className={cn(buttonClass('soft', 'sm'), disabled && 'pointer-events-none')}>
                    <FaImages aria-hidden="true" />
                    Elegir de galería
                    <input className="sr-only" type="file" accept="image/*" multiple disabled={disabled} onChange={onSelect} />
                </label>
            </div>
            <span className="text-[0.75rem] font-semibold text-slate-500">{help}</span>
            {previews.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {previews.map((preview, index) => (
                        <div key={`${preview}-${index}`} className="relative overflow-hidden rounded-lg border border-[#bfdbfe] bg-white">
                            <img src={preview} alt={`Vista previa ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
                            <span className="absolute bottom-1 left-1 rounded bg-slate-950/70 px-1.5 py-0.5 text-[0.65rem] font-bold text-white">Nueva {index + 1}</span>
                            {onRemove ? (
                                <button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-[#ef4444] text-xs font-bold text-white" onClick={() => onRemove(index)} aria-label={`Quitar imagen ${index + 1}`}>
                                    <FaTimes aria-hidden="true" />
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <span className="rounded-lg border border-dashed border-[#bfdbfe] bg-white px-3 py-4 text-center text-sm font-semibold text-slate-500">
                    No hay imágenes seleccionadas.
                </span>
            )}
        </div>
    );
}

function RepairImagesBlock({
    title,
    images,
    onOpen,
    onRemove,
    readOnly,
}: {
    title: string;
    images: RepairImageView[];
    onOpen: (index: number) => void;
    onRemove: (image: RepairImageView) => void;
    readOnly?: boolean;
}): JSX.Element {
    return (
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
                <strong className="text-sm text-[#0f172a]">{title}</strong>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{images.length}/2</span>
            </div>
            {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {images.map((image, index) => (
                        <div key={image.filename} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white">
                            <button type="button" className="block aspect-[4/3] w-full" onClick={() => onOpen(index)}>
                                <FaImage className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" aria-hidden="true" />
                                <img src={image.thumbnailUrl || image.url} alt={image.filename} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.classList.add('opacity-0'); }} />
                            </button>
                            {!readOnly ? (
                                <button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-md bg-[#dc3545] text-xs text-white" onClick={() => onRemove(image)} title="Quitar imagen">
                                    <FaTrashAlt aria-hidden="true" />
                                </button>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <span className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-500">No hay imagenes cargadas.</span>
            )}
        </div>
    );
}

function AddRepairModal({
    ticket,
    serviceCategories,
    serviceTemplates,
    partInventory,
    onClose,
}: {
    ticket: RepairTicketView;
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    partInventory: RepairPartInventoryOption[];
    onClose: () => void;
}): JSX.Element {
    const today = new Date().toISOString().slice(0, 10);
    const form = useForm<AddRepairFormData>({
        marca: '',
        modelo: '',
        tipo_servicio: '',
        descripcion: '',
        observaciones: 'sin observaciones',
        monto: '0',
        senia: '0',
        fecha_estimada: today,
        repuesto: '',
        repuesto_pedido: false,
        inventory_part_id: '',
        categorias_reparacion: '4',
        images: null,
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [partSearch, setPartSearch] = useState('');
    const baseUpdateAction = ticket.repairs[0]?.actions?.update ?? '';
    const action = ticket.addRepairAction ?? (baseUpdateAction !== '' ? `${baseUpdateAction.replace(/\/$/, '')}/add-repair` : '');

    const selectImages = (event: ChangeEvent<HTMLInputElement>): void => {
        const currentFiles = form.data.images ?? [];
        const selected = [...currentFiles, ...Array.from(event.target.files ?? [])].slice(0, 2);

        form.setData('images', selected.length > 0 ? selected : null);
        setImagePreviews(selected.map((file) => URL.createObjectURL(file)));
        event.target.value = '';
    };

    const removeImage = (index: number): void => {
        const selected = (form.data.images ?? []).filter((_, fileIndex) => fileIndex !== index);

        form.setData('images', selected.length > 0 ? selected : null);
        setImagePreviews(selected.map((file) => URL.createObjectURL(file)));
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (action === '') return;

        form.post(action, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setImagePreviews([]);
                onClose();
            },
        });
    };

    const clearAmountForTyping = (field: 'monto' | 'senia'): void => {
        const value = form.data[field] ?? '';

        if (value.trim() === '' || Number(value) === 0) {
            form.setData(field, '');
        }
    };

    const changeCategory = (value: string): void => {
        form.setData((current) => ({
            ...current,
            categorias_reparacion: value,
            marca: isPhoneCategoryValue(serviceCategories, value) ? current.marca : '',
        }));
    };

    const changeBrand = (value: string): void => {
        form.setData((current) => {
            return {
                ...current,
                marca: value,
                modelo: modelWithoutKnownBrand(current.modelo),
            };
        });
    };

    const applyDescriptionOption = (optionKey: string): void => {
        if (optionKey === '') return;

        const option = serviceTemplates.find((item) => item.value === optionKey);
        if (!option) return;

        form.setData((current) => {
            const description = option.description.trim();
            const nextDescription = [current.descripcion.trim(), description]
                .filter(Boolean)
                .join('\n');

            return {
                ...current,
                tipo_servicio: option.value,
                descripcion: nextDescription,
                repuesto: current.repuesto.trim() !== '' ? current.repuesto : option.repuesto,
            };
        });

        if (partSearch.trim() === '' && option.repuesto.trim() !== '') {
            setPartSearch(option.repuesto);
        }
    };

    const matchingInventoryParts = (): RepairPartInventoryOption[] => {
        const query = (partSearch || form.data.repuesto).trim().toLowerCase();

        if (query.length < 2) {
            return [];
        }

        return partInventory
            .filter((part) => part.quantity > 0 && part.model.toLowerCase().includes(query))
            .slice(0, 6);
    };

    const selectInventoryPart = (part: RepairPartInventoryOption): void => {
        form.setData((current) => ({
            ...current,
            repuesto: part.model,
            repuesto_pedido: false,
            inventory_part_id: String(part.id),
        }));
        setPartSearch(part.model);
    };

    const clearInventoryPart = (): void => {
        form.setData((current) => ({
            ...current,
            inventory_part_id: '',
        }));
    };

    return (
        <ModalShell title={`Agregar reparacion al ticket #${ticket.id}`} onClose={onClose} tone="primary">
            <form className="grid gap-4" onSubmit={submit}>
                <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                            <div className="text-sm font-black text-[#0f172a]">{ticket.nombre_cliente}</div>
                            <div className="text-xs font-semibold text-[#475569]">Ticket #{ticket.id} - trabajo #{ticket.repairsCount + 1}</div>
                        </div>
                        <span className="rounded-md border border-[#93c5fd] bg-white px-2.5 py-1 text-xs font-black text-[#1d4ed8]">Nueva reparacion</span>
                    </div>
                </div>
                <EditSection title="Trabajo">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <EditField label="Categoria">
                            <select className={ui.input} value={form.data.categorias_reparacion} onChange={(event) => changeCategory(event.target.value)}>
                                {serviceCategories.map((category) => (
                                    <option key={category.value} value={category.value}>{category.label}</option>
                                ))}
                            </select>
                        </EditField>
                        {isPhoneCategoryValue(serviceCategories, form.data.categorias_reparacion) ? (
                            <EditField label="Marca">
                                <select className={ui.input} value={form.data.marca} onChange={(event) => changeBrand(event.target.value)}>
                                    <option value="">Elegir marca...</option>
                                    {phoneBrandOptions.map((brand) => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                </select>
                            </EditField>
                        ) : null}
                        <EditField label="Modelo">
                            <input className={ui.input} placeholder="Ej: SAMSUNG A51" value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} />
                        </EditField>
                        <EditField label="Tipo de servicio">
                            <select className={ui.input} value="" onChange={(event) => applyDescriptionOption(event.target.value)}>
                                <option value="">Agregar tipo o falla...</option>
                                {serviceTemplates.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </EditField>
                        <EditField label="Descripcion de la falla">
                            <textarea className={ui.textarea} placeholder="Descripcion de la reparacion" value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} required />
                        </EditField>
                    </div>
                </EditSection>

                <EditSection title="Agenda e importes">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <EditField label="Fecha estimada">
                            <input className={ui.input} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
                        </EditField>
                        <EditField label="Monto">
                            <input className={ui.input} inputMode="decimal" placeholder="0" value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} />
                        </EditField>
                        <EditField label="Senia">
                            <input className={ui.input} inputMode="decimal" placeholder="0" value={form.data.senia} onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} />
                        </EditField>
                    </div>
                </EditSection>

                <EditSection title="Repuesto">
                    <div className="grid gap-3">
                        <EditField label="Buscar en cajas">
                            <div className="relative">
                                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#92400e]" aria-hidden="true" />
                                <input
                                    className={cn(ui.input, 'pl-9')}
                                    placeholder="Buscar modulo, bateria, modelo..."
                                    value={partSearch || form.data.repuesto}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setPartSearch(value);
                                        form.setData((current) => ({ ...current, repuesto: value, inventory_part_id: '' }));
                                    }}
                                />
                            </div>
                        </EditField>
                        {matchingInventoryParts().length > 0 ? (
                            <div className="grid gap-1">
                                {matchingInventoryParts().map((part) => (
                                    <button
                                        key={part.id}
                                        type="button"
                                        className={cn(
                                            'grid gap-1 rounded-lg border px-3 py-2 text-left text-sm transition hover:bg-[#f8fafc]',
                                            form.data.inventory_part_id === String(part.id)
                                                ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d]'
                                                : 'border-[#fed7aa] bg-white text-[#334155] hover:bg-[#fff7ed]',
                                        )}
                                        onClick={() => selectInventoryPart(part)}
                                    >
                                        <span className="font-black">{part.model}</span>
                                        <span className="text-xs font-bold text-slate-500">Caja {part.box.toUpperCase()} - {part.quantity} disponible{part.quantity === 1 ? '' : 's'}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (partSearch || form.data.repuesto).trim().length >= 2 ? (
                            <div className="rounded-lg border border-dashed border-[#fed7aa] bg-white px-3 py-2 text-sm font-bold text-[#92400e]">
                                No hay coincidencias en cajas. Si hace falta pedirlo, marca Mandar a pedidos.
                            </div>
                        ) : null}
                        {form.data.inventory_part_id !== '' ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm font-bold text-[#166534]">
                                <span>Asignado desde caja. Al guardar se descuenta del inventario.</span>
                                <button type="button" className="text-xs font-bold text-[#15803d] underline-offset-2 hover:underline" onClick={clearInventoryPart}>
                                    Quitar seleccion
                                </button>
                            </div>
                        ) : null}
                        <textarea
                            className={ui.textarea}
                            rows={2}
                            placeholder="Detalle del repuesto. Ej: modulo Samsung A54 negro"
                            value={form.data.repuesto}
                            onChange={(event) => form.setData((current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))}
                        />
                        <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#f59e0b55] bg-[#fff7ed] px-3 py-2 text-sm font-black text-[#92400e]">
                            <input type="checkbox" checked={form.data.repuesto_pedido} onChange={(event) => form.setData('repuesto_pedido', event.target.checked)} disabled={form.data.inventory_part_id !== ''} />
                            Mandar a pedidos
                        </label>
                    </div>
                </EditSection>
                <EditSection title="Observaciones">
                    <textarea
                        className={ui.textarea}
                        rows={3}
                        placeholder="Estado, accesorios, claves o detalles internos"
                        value={form.data.observaciones}
                        onFocus={() => {
                            if (form.data.observaciones.trim().toLowerCase() === 'sin observaciones') {
                                form.setData('observaciones', '');
                            }
                        }}
                        onChange={(event) => form.setData('observaciones', event.target.value)}
                    />
                </EditSection>
                <EditSection title="Fotos de ingreso">
                    <ImageUploadPicker
                        title="Fotos de ingreso"
                        help="Podes sacar foto o elegir de galeria. Se guardan hasta 2 imagenes iniciales."
                        previews={imagePreviews}
                        onSelect={selectImages}
                        onRemove={removeImage}
                    />
                </EditSection>
                <div className="sticky bottom-0 -mx-4 -mb-4 flex flex-wrap justify-end gap-2 border-t border-[#bfdbfe] bg-white px-4 py-3">
                    <button type="button" className={buttonClass('soft', 'sm')} onClick={onClose}>Cancelar</button>
                    <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing}>Agregar reparacion</button>
                </div>
            </form>
        </ModalShell>
    );
}

function RepairEditCard({
    repair,
    serviceCategories,
    readOnly,
    ticket,
    variant = 'mobile',
    rowIndex = 0,
    rowTotal = 1,
    onAddRepair,
    partInventory,
    desktopGroupExpanded = true,
    onToggleDesktopGroup,
    archived = false,
}: {
    repair: RepairOrderView;
    serviceCategories: ServiceCategoryOption[];
    readOnly?: boolean;
    ticket: RepairTicketView;
    partInventory: RepairPartInventoryOption[];
    variant?: 'mobile' | 'desktop';
    rowIndex?: number;
    rowTotal?: number;
    onAddRepair: () => void;
    desktopGroupExpanded?: boolean;
    onToggleDesktopGroup?: () => void;
    archived?: boolean;
}): JSX.Element {
    const initialBrand = inferredRepairBrand(repair);
    const form = useForm<RepairUpdateFormData>({
        id_nuevo: String(repair.id),
        fecha: repair.fecha ?? '',
        nombre_cliente: repair.nombre_cliente,
        dni: String(repair.dni ?? ''),
        contacto: repair.contacto ?? '',
        marca: initialBrand,
        modelo: repair.modelo ?? '',
        descripcion: repair.descripcion ?? '',
        observaciones: repair.observaciones ?? '',
        info: ticket.info ?? '',
        monto: formatAmountInput(repair.monto),
        senia: formatAmountInput(repair.senia),
        fecha_estimada: repair.fecha_estimada ?? '',
        estado: repair.estado,
        fecha_entregado: repair.fecha_entregado ?? '',
        repuesto: repair.repuesto ?? '',
        repuesto_pedido: Boolean(repair.repuesto_pedido),
        inventory_part_id: repair.inventory_part_id ? String(repair.inventory_part_id) : '',
        categorias_reparacion: String(repair.categorias_reparacion ?? 4),
        images: null,
        final_images: null,
    });
    const paymentForm = useForm<PaymentFormData>({
        amount: '',
        method: '',
        notes: '',
        paid_at: todayInputValue(),
    });
    const [editOpen, setEditOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [inlineOpen, setInlineOpen] = useState(false);
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [deliveryVia, setDeliveryVia] = useState<DeliveryVia>('dni');
    const [deliveryDetail, setDeliveryDetail] = useState('');
    const [deliveryArchive, setDeliveryArchive] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [finalImagePreviews, setFinalImagePreviews] = useState<string[]>([]);
    const [partSearch, setPartSearch] = useState(repair.repuesto ?? '');
    const monto = Number(repair.monto ?? 0);
    const senia = Number(repair.senia ?? 0);
    const galleryImages = [...repair.imagenes, ...repair.imagenes_finales];
    const firstImage = galleryImages[0];
    const canMarkReady = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'].includes(repair.estado);
    const canDeliver = ['LISTA', 'CANCELADA'].includes(repair.estado) && repair.entregado !== 'si';
    const canCancel = repair.estado !== 'CANCELADA' && repair.entregado !== 'si';
    const canCycleStatus = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'LISTA'].includes(repair.estado);
    const canAddToTasks = !['LISTA', 'CANCELADA'].includes(repair.estado);
    const nextStatus = nextQuickStatus(repair.estado);
    const showMore = Boolean(repair.descripcion || repair.repuesto || repair.observaciones || repair.contacto || repair.dni);
    const hasInfo = (ticket.info ?? '').trim() !== '';
    const isGroupedDesktopRow = variant === 'desktop' && rowTotal > 1;
    const isFirstGroupedDesktopRow = isGroupedDesktopRow && rowIndex === 0;
    const isLastGroupedDesktopRow = isGroupedDesktopRow && (rowIndex === rowTotal - 1 || (rowIndex === 0 && !desktopGroupExpanded));
    const showDesktopTicketData = variant !== 'desktop' || rowIndex === 0;
    const overdueText = overdueLabel(repair);
    const desktopWorkLabel = rowTotal > 1 ? `Trabajo ${rowIndex + 1} de ${rowTotal}` : `Trabajo ${repair.reparacion}`;
    const repairBrand = inferredRepairBrand(repair);
    const repairDisplayModel = displayRepairModel(repair);
    const cleanDescription = descriptionWithoutRepeatedModel(repair.descripcion, repair.modelo, repairBrand);
    const displayDescription = (cleanDescription || repair.descripcion || '-').toUpperCase();
    const partMatches = partSearch.trim().length >= 2
        ? partInventory
            .filter((part) => part.quantity > 0 && part.model.toLowerCase().includes(partSearch.trim().toLowerCase()))
            .slice(0, 8)
        : [];
    const selectedInventoryPart = form.data.inventory_part_id !== ''
        ? partInventory.find((part) => String(part.id) === form.data.inventory_part_id) ?? null
        : null;
    const payments = repair.payments ?? [];
    const assignedInventoryModel = form.data.inventory_part_id !== ''
        ? selectedInventoryPart?.model ?? repair.inventory_part_model ?? null
        : null;
    const assignedInventoryBox = form.data.inventory_part_id !== ''
        ? selectedInventoryPart?.box ?? repair.inventory_part_box ?? null
        : null;
    const inlinePhoneCategory = isPhoneCategoryValue(serviceCategories, form.data.categorias_reparacion);

    const selectInventoryPart = (part: RepairPartInventoryOption): void => {
        form.setData((current) => ({
            ...current,
            repuesto: part.model,
            repuesto_pedido: false,
            inventory_part_id: String(part.id),
        }));
        setPartSearch(part.model);
    };

    const returnCurrentInventoryPart = (): void => {
        form.setData((current) => ({
            ...current,
            inventory_part_id: '',
            repuesto: '',
        }));
        setPartSearch('');
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.update) return;

        form.post(repair.actions.update, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset('images', 'final_images');
                setImagePreviews([]);
                setFinalImagePreviews([]);
                setEditOpen(false);
                setInlineOpen(false);
            },
        });
    };

    const submitInfo = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const action = repair.actions?.info ?? repair.actions?.update;
        if (!action) return;

        router.post(action, { info: form.data.info }, {
            preserveScroll: true,
            onSuccess: () => setInfoOpen(false),
        });
    };

    const submitPayment = (): void => {
        if (!repair.actions?.addPayment) return;

        paymentForm.post(repair.actions.addPayment, {
            preserveScroll: true,
            onSuccess: () => paymentForm.reset('amount', 'method', 'notes'),
        });
    };

    const deletePayment = (action?: string): void => {
        if (!action) return;
        if (window.confirm('Eliminar esta seña del historial?')) {
            router.post(action, {}, { preserveScroll: true });
        }
    };

    const cycleDesktopStatus = (): void => {
        const action = repair.actions?.state ?? repair.actions?.update;
        if (readOnly || !canCycleStatus || !action || form.processing) return;

        router.post(
            action,
            { estado: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => form.setData('estado', nextStatus),
            },
        );
    };

    const selectImages = (key: 'images' | 'final_images', event: ChangeEvent<HTMLInputElement>): void => {
        const currentFiles = form.data[key] ?? [];
        const files = [...currentFiles, ...Array.from(event.target.files ?? [])].slice(0, 2);
        form.setData(key, files.length > 0 ? files : null);
        const previews = files.map((file) => URL.createObjectURL(file));

        if (key === 'images') {
            setImagePreviews(previews);
        } else {
            setFinalImagePreviews(previews);
        }

        event.target.value = '';
    };

    const removeSelectedImage = (key: 'images' | 'final_images', index: number): void => {
        const files = (form.data[key] ?? []).filter((_, fileIndex) => fileIndex !== index);
        form.setData(key, files.length > 0 ? files : null);
        const previews = files.map((file) => URL.createObjectURL(file));

        if (key === 'images') {
            setImagePreviews(previews);
        } else {
            setFinalImagePreviews(previews);
        }
    };

    const openInlineEditor = (): void => {
        if (!readOnly) {
            setInlineOpen(true);
        }
    };

    const openDeliveryModal = (): void => {
        form.setData('fecha_entregado', form.data.fecha_entregado || todayInputValue());
        setDeliveryOpen(true);
    };

    const cancelInlineEdit = (): void => {
        form.reset();
        setInlineOpen(false);
    };

    const changeInlineCategory = (value: string): void => {
        form.setData((current) => ({
            ...current,
            categorias_reparacion: value,
            marca: isPhoneCategoryValue(serviceCategories, value) ? current.marca : '',
        }));
    };

    const changeInlineBrand = (value: string): void => {
        form.setData((current) => ({
            ...current,
            marca: value,
            modelo: modelWithoutKnownBrand(current.modelo),
        }));
    };

    const clearAmountForTyping = (field: 'monto' | 'senia'): void => {
        const value = form.data[field] ?? '';

        if (!readOnly && (value.trim() === '' || Number(value) === 0)) {
            form.setData(field, '');
        }
    };

    const removeImage = (image: RepairImageView, finalImage: boolean): void => {
        const action = finalImage ? repair.actions?.removeFinalImage : repair.actions?.removeOriginalImage;
        if (!action) return;
        router.post(action, { filename: image.filename }, { preserveScroll: true });
    };

    const markReady = (): void => {
        if (!repair.actions?.markReady) return;
        if (window.confirm(`Marcar orden #${repair.id} trabajo #${repair.reparacion} como LISTA?`)) {
            router.post(repair.actions.markReady, {}, { preserveScroll: true });
        }
    };

    const addToTasks = (): void => {
        if (!repair.actions?.addToTasks) return;
        router.post(repair.actions.addToTasks, {}, { preserveScroll: true });
    };

    const cancelRepair = (): void => {
        if (!repair.actions?.cancel) return;
        if (window.confirm(`Cancelar orden #${repair.id} trabajo #${repair.reparacion}?`)) {
            router.post(repair.actions.cancel, {}, { preserveScroll: true });
        }
    };

    const deleteRepair = (): void => {
        if (!repair.actions?.delete) return;
        if (window.confirm(`Eliminar orden #${repair.id} trabajo #${repair.reparacion}?`)) {
            router.post(repair.actions.delete, {}, { preserveScroll: true });
        }
    };

    const moveBackToConsultas = (): void => {
        if (!repair.actions?.moveBack) return;
        if (window.confirm(`Devolver orden #${repair.id} trabajo #${repair.reparacion} a consultas?`)) {
            router.post(repair.actions.moveBack, {}, { preserveScroll: true });
        }
    };

    const deliverRepair = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.deliver) return;

        router.post(
            repair.actions.deliver,
            {
                fecha_entregado: form.data.fecha_entregado || undefined,
                entrega_via: deliveryVia,
                entrega_detalle: deliveryVia === 'otra' ? deliveryDetail : undefined,
                enviar_archivados: deliveryArchive,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeliveryOpen(false);
                    setDeliveryDetail('');
                    setDeliveryVia('dni');
                    setDeliveryArchive(false);
                },
            },
        );
    };

    const InlineEditor = ({ mobile = false }: { mobile?: boolean }): JSX.Element => (
        <form
            className={cn(
                'grid gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] p-3',
                mobile ? 'grid-cols-2' : 'grid-cols-[76px_minmax(150px,1fr)_96px_128px_126px_124px_124px_minmax(160px,1.05fr)_138px_112px_142px]',
            )}
            onSubmit={submitEdit}
        >
            <input className={ui.repairDenseInput} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} />
            <input className={ui.repairDenseInput} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} placeholder="Cliente" />
            <input className={ui.repairDenseInput} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} placeholder="DNI" />
            <input className={ui.repairDenseInput} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} placeholder="Contacto" />
            <input className={ui.repairDenseInput} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} />
            <select className={ui.repairDenseInput} value={form.data.categorias_reparacion} onChange={(event) => changeInlineCategory(event.target.value)} aria-label="Categoria">
                {serviceCategories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                ))}
            </select>
            {inlinePhoneCategory ? (
                <select className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => changeInlineBrand(event.target.value)} aria-label="Marca">
                    <option value="">Marca...</option>
                    {phoneBrandOptions.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
            ) : (
                <input className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => form.setData('marca', event.target.value.toUpperCase())} placeholder="Marca" />
            )}
            <input className={ui.repairDenseInput} value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} placeholder="Modelo" />
            <input className={ui.repairDenseInput} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
            <input className={ui.repairDenseInput} value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} placeholder="Monto" />
            <select className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado))} value={form.data.estado} onChange={(event) => form.setData('estado', event.target.value)}>
                {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
            </select>
            <div className={cn('flex gap-2', mobile ? 'col-span-2' : 'col-span-full justify-end')}>
                <button type="button" className={buttonClass('soft', 'sm')} onClick={cancelInlineEdit}>Cancelar</button>
                <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing}>
                    <FaSave aria-hidden="true" /> Guardar
                </button>
            </div>
            <textarea className={cn(ui.repairDenseTextarea, mobile ? 'col-span-2' : 'col-span-full')} value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} placeholder="Descripcion" />
            <textarea className={cn(ui.repairDenseTextarea, mobile ? 'col-span-2' : 'col-span-full')} value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} placeholder="Observaciones" />
        </form>
    );

    const Thumb = ({ large = false }: { large?: boolean }): JSX.Element => (
        <button
            type="button"
            className={cn(
                'relative grid place-items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-slate-400',
                large ? 'h-12 w-14' : 'h-12 w-12',
                galleryImages.length === 0 && 'cursor-default',
            )}
            onClick={() => galleryImages.length > 0 ? setGalleryIndex(0) : undefined}
            title={galleryImages.length > 0 ? 'Ver imagenes' : 'Sin imagen'}
        >
            {firstImage ? (
                <>
                    <FaImage className="absolute text-slate-400" aria-hidden="true" />
                    <img src={firstImage.thumbnailUrl || firstImage.url} alt={firstImage.filename} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.classList.add('opacity-0'); }} />
                    {galleryImages.length > 1 ? <span className="absolute right-1 top-1 rounded-md bg-slate-950/75 px-1.5 py-0.5 text-[0.68rem] font-bold text-white">+{galleryImages.length - 1}</span> : null}
                </>
            ) : (
                <FaImage aria-hidden="true" />
            )}
        </button>
    );

    const ActionButtons = ({ mobile = false, showGeneralTicketActions = true }: { mobile?: boolean; showGeneralTicketActions?: boolean }): JSX.Element => {
        const iconOnly = true;
        const base = mobile
            ? 'grid h-9 w-9 place-items-center rounded-xl text-[0.78rem] no-underline shadow-sm'
            : 'grid h-7 w-7 place-items-center rounded-md text-[0.72rem] no-underline shadow-sm transition hover:brightness-95';
        const groupClass = mobile
            ? 'flex items-center gap-1.5'
            : 'flex items-center gap-1 border-l border-[#cbd5e1] pl-1.5 first:border-l-0 first:pl-0';
        const showWorkflowActions = (!readOnly && canAddToTasks && Boolean(repair.actions?.addToTasks)) || canMarkReady || canDeliver;

        return (
            <div className={cn(mobile ? 'flex flex-wrap justify-end gap-1.5' : 'flex flex-wrap items-center justify-end gap-1')}>
                {showWorkflowActions ? (
                    <span className={groupClass}>
                        {!readOnly && canAddToTasks && repair.actions?.addToTasks ? (
                            <button
                                type="button"
                                className={cn(base, 'relative border border-[#d6b48c] bg-[#d6b48c] text-[#3f2a16]')}
                                onClick={addToTasks}
                                title={repair.taskQueuePosition ? `Quitar de tareas: posicion ${repair.taskQueuePosition}` : 'Agregar a tareas'}
                            >
                                <FaClipboardCheck aria-hidden="true" />{iconOnly ? null : 'Agregar a tareas'}
                                {repair.taskQueuePosition ? (
                                    <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-white bg-[#3f2a16] px-1 text-[0.58rem] font-black leading-none text-white">
                                        {repair.taskQueuePosition}
                                    </span>
                                ) : null}
                            </button>
                        ) : null}
                        {canMarkReady ? (
                            <button type="button" className={cn(base, 'border border-[#198754] bg-[#198754] text-white')} onClick={markReady} title="Listo">
                                <FaCheckCircle aria-hidden="true" />{iconOnly ? null : 'Listo'}
                            </button>
                        ) : null}
                        {canDeliver ? (
                            <button type="button" className={cn(base, 'border border-[#ffc107] bg-[#ffc107] text-[#111827]')} onClick={openDeliveryModal} title="Entregar">
                                <FaDollyFlatbed aria-hidden="true" />{iconOnly ? null : 'Entregar'}
                            </button>
                        ) : null}
                    </span>
                ) : null}
                <span className={groupClass}>
                    {showGeneralTicketActions ? (
                        <button
                            type="button"
                            className={cn(base, hasInfo ? 'border border-[#0f766e] bg-[#0f766e] text-white' : 'border border-[#cbd5e1] bg-white text-[#334155]')}
                            onClick={() => setInfoOpen(true)}
                            title={hasInfo ? 'Info cargada' : 'Agregar info'}
                        >
                            <FaInfoCircle aria-hidden="true" />{iconOnly ? null : 'Info'}
                        </button>
                    ) : null}
                    <button type="button" className={cn(base, 'border border-[#0d6efd] bg-[#0d6efd] text-white')} onClick={() => setEditOpen(true)} title="Editar">
                        <FaEdit aria-hidden="true" />{iconOnly ? null : 'Editar'}
                    </button>
                    {showGeneralTicketActions ? (
                        <button type="button" className={cn(base, 'border border-[#8b5cf6] bg-[#8b5cf6] text-white')} onClick={onAddRepair} title="Agregar reparacion">
                            <FaPlus aria-hidden="true" />{iconOnly ? null : 'Agregar reparacion'}
                        </button>
                    ) : null}
                </span>
                {showGeneralTicketActions ? (
                    <span className={groupClass}>
                        <Link href={ticket.ticketUrl} className={cn(base, 'border border-[#111827] bg-[#111827] text-white')} title="Ticket">
                            <FaReceipt aria-hidden="true" />{iconOnly ? null : 'Ticket'}
                        </Link>
                        <a href={ticket.trackingUrl} className={cn(base, 'border border-[#0d6efd] bg-[#0d6efd] text-white')} title="Seguimiento">
                            <FaArrowRight aria-hidden="true" />{iconOnly ? null : 'Seguimiento'}
                        </a>
                        {ticket.whatsappUrl ? (
                            <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className={cn(base, 'border border-[#25D366] bg-[#25D366] text-white')} title="WhatsApp">
                                <FaWhatsapp aria-hidden="true" />{iconOnly ? null : 'WhatsApp'}
                            </a>
                        ) : (
                            <span className={cn(base, 'cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500')} title="Sin WhatsApp">
                                <FaWhatsapp aria-hidden="true" />{iconOnly ? null : 'WhatsApp'}
                            </span>
                        )}
                    </span>
                ) : null}
                {canCancel || repair.actions?.delete ? (
                    <span className={groupClass}>
                        {canCancel ? (
                            <button type="button" className={cn(base, 'border border-[#f59e0b] bg-[#f59e0b] text-white')} onClick={cancelRepair} title="Cancelar">
                                <FaTimes aria-hidden="true" />{iconOnly ? null : 'Cancelar'}
                            </button>
                        ) : null}
                        {!readOnly && repair.actions?.archive && !repair.archivado_at ? (
                            <button type="button" className={cn(base, 'border border-[#64748b] bg-[#64748b] text-white')} onClick={() => router.post(repair.actions?.archive ?? '', {}, { preserveScroll: true })} title="Archivar">
                                <FaArchive aria-hidden="true" />{iconOnly ? null : 'Archivar'}
                            </button>
                        ) : null}
                        <button type="button" className={cn(base, 'border border-[#dc3545] bg-[#dc3545] text-white')} onClick={deleteRepair} title="Eliminar">
                            <FaTrashAlt aria-hidden="true" />{iconOnly ? null : 'Eliminar'}
                        </button>
                    </span>
                ) : null}
            </div>
        );
    };

    const modals = (
        <>
            {infoOpen ? (
                <ModalShell title={`Info interna orden #${ticket.id}`} onClose={() => setInfoOpen(false)}>
                    <form className="grid gap-3" onSubmit={submitInfo}>
                        <label className="grid gap-1.5 text-sm font-black text-[#334155]">
                            Anotacion interna
                            <textarea
                                className={changedTextareaClass(form.data.info, ticket.info ?? '')}
                                value={form.data.info}
                                onChange={(event) => form.setData('info', event.target.value)}
                                rows={6}
                                placeholder="Mensaje, recordatorio o nota personal sobre esta orden"
                                disabled={readOnly}
                            />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setInfoOpen(false)}>Cerrar</button>
                            {!readOnly ? (
                                <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing}>
                                    <FaSave aria-hidden="true" /> Guardar info
                                </button>
                            ) : null}
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {editOpen ? (
                <ModalShell title={`Edición rápida de orden #${repair.id}`} onClose={() => setEditOpen(false)} tone="primary">
                    <form className="grid gap-4" onSubmit={submitEdit}>
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                            <EditSection title="Datos Editables">
                                <EditField label="ID de la orden" note="Si lo cambias, se renumeran todos los trabajos de esta orden.">
                                    <input className={changedInputClass(form.data.id_nuevo, String(repair.id))} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <EditField label="Cliente">
                                    <input className={changedInputClass(form.data.nombre_cliente, repair.nombre_cliente)} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="DNI">
                                        <input className={changedInputClass(form.data.dni, String(repair.dni ?? ''))} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Contacto">
                                        <input className={changedInputClass(form.data.contacto, repair.contacto ?? '')} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <EditField label="Marca">
                                    <input className={changedInputClass(form.data.marca, repair.marca ?? '')} value={form.data.marca} onChange={(event) => form.setData('marca', event.target.value.toUpperCase())} disabled={readOnly} />
                                </EditField>
                                <EditField label="Modelo">
                                    <input className={changedInputClass(form.data.modelo, repair.modelo ?? '')} value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <EditField label="Categoria">
                                    <select className={changedInputClass(form.data.categorias_reparacion, String(repair.categorias_reparacion ?? 4))} value={form.data.categorias_reparacion} onChange={(event) => form.setData('categorias_reparacion', event.target.value)} disabled={readOnly}>
                                        {serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                                    </select>
                                </EditField>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <EditField label="Monto ($)">
                                            <input className={changedInputClass(form.data.monto, formatAmountInput(repair.monto))} value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} disabled={readOnly} />
                                        </EditField>
                                        {!readOnly ? (
                                            <EditField label="Importe de seña">
                                                <input className={changedInputClass(paymentForm.data.amount, '', undefined, false)} inputMode="decimal" placeholder="Importe" value={paymentForm.data.amount} onChange={(event) => paymentForm.setData('amount', event.target.value)} />
                                            </EditField>
                                        ) : null}
                                    </div>
                                    <div className="grid gap-2">
                                        <EditField label="Pagado ($)">
                                            <input className={ui.repairDenseInput} value={formatCurrency(senia)} disabled />
                                        </EditField>
                                        {!readOnly ? (
                                            <EditField label="Fecha de seña">
                                                <input className={changedInputClass(paymentForm.data.paid_at, todayInputValue(), undefined, false)} type="date" value={paymentForm.data.paid_at} onChange={(event) => paymentForm.setData('paid_at', event.target.value)} />
                                            </EditField>
                                        ) : null}
                                    </div>
                                </div>
                                <details className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                        <span className="font-black text-[#0f172a]">Historial de pagos ({payments.length})</span>
                                        <span className="flex items-center gap-2 font-black text-[#0f172a]">
                                            {formatCurrency(senia)}
                                            <FaChevronDown className="text-xs text-[#64748b]" aria-hidden="true" />
                                        </span>
                                    </summary>
                                    <div className="grid gap-3 border-t border-[#e2e8f0] p-3">
                                        {payments.length > 0 ? (
                                            <div className="grid gap-1">
                                                {payments.map((payment) => (
                                                    <div key={payment.id} className="relative grid grid-cols-[1fr_auto] gap-2 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm">
                                                        <div className="min-w-0">
                                                            <strong className="block text-[#0f172a]">{formatLegacyDate(payment.paid_at)} - seña</strong>
                                                            <span className="block truncate text-xs font-semibold text-[#64748b]">{[payment.method, payment.notes].filter(Boolean).join(' - ') || 'Sin detalle'}</span>
                                                        </div>
                                                        <span className="font-black text-[#0f172a]">{formatCurrency(payment.amount)}</span>
                                                        {!readOnly ? (
                                                            <button
                                                                type="button"
                                                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md text-xs font-black text-[#dc2626] transition hover:bg-[#fee2e2]"
                                                                onClick={() => deletePayment(payment.deleteAction)}
                                                                title="Eliminar seña"
                                                                aria-label="Eliminar seña"
                                                            >
                                                                <FaTimes aria-hidden="true" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="rounded-md border border-dashed border-[#cbd5e1] bg-white px-3 py-3 text-center text-sm font-semibold text-[#64748b]">Sin pagos registrados.</span>
                                        )}
                                    </div>
                                </details>
                                {!readOnly ? (
                                    <div className="grid gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                                        <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                                            <input className={changedInputClass(paymentForm.data.method, '', undefined, false)} placeholder="Metodo" value={paymentForm.data.method} onChange={(event) => paymentForm.setData('method', event.target.value)} />
                                            <input className={changedInputClass(paymentForm.data.notes, '', undefined, false)} placeholder="Nota" value={paymentForm.data.notes} onChange={(event) => paymentForm.setData('notes', event.target.value)} />
                                            <button type="button" className={buttonClass('primary', 'sm')} disabled={paymentForm.processing || paymentForm.data.amount.trim() === ''} onClick={submitPayment}>
                                                Registrar seña
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="Fecha de ingreso">
                                        <input className={changedInputClass(form.data.fecha, repair.fecha ?? '')} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Fecha estimada">
                                        <input className={changedInputClass(form.data.fecha_estimada, repair.fecha_estimada ?? '')} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <EditField label="Estado">
                                    <select className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado), hasChangedValue(form.data.estado, repair.estado) && 'ring-2 ring-[#2563eb]')} value={form.data.estado} onChange={(event) => form.setData('estado', event.target.value)} disabled={readOnly}>
                                        {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                </EditField>
                            </EditSection>

                            <EditSection title="Descripción y Contexto">
                                <EditField label="Descripción">
                                    <textarea className={changedTextareaClass(form.data.descripcion, repair.descripcion ?? '')} value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} rows={3} disabled={readOnly} />
                                </EditField>
                                <EditField label="Observaciones del Técnico">
                                    <textarea className={changedTextareaClass(form.data.observaciones, repair.observaciones ?? '')} value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} rows={3} disabled={readOnly} />
                                </EditField>
                                <EditField label="Repuesto a usar / pedir">
                                    <div className="grid gap-2">
                                        <InventoryAssignmentPanel
                                            model={assignedInventoryModel}
                                            box={assignedInventoryBox}
                                            readOnly={readOnly}
                                            onClear={returnCurrentInventoryPart}
                                        />
                                        <input
                                            className={changedInputClass(partSearch, repair.repuesto ?? '')}
                                            value={partSearch}
                                            onChange={(event) => {
                                                setPartSearch(event.target.value);
                                                form.setData((current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }));
                                            }}
                                            placeholder="Buscar en cajas o escribir repuesto a pedir"
                                            disabled={readOnly}
                                        />
                                        {partMatches.length > 0 ? (
                                            <div className="grid gap-1">
                                                {partMatches.map((part) => (
                                                    <button
                                                        key={part.id}
                                                        type="button"
                                                        className={cn(
                                                            'grid gap-1 rounded-xl border px-3 py-2 text-left text-sm transition hover:-translate-y-px',
                                                            form.data.inventory_part_id === String(part.id)
                                                                ? 'border-[#16a34a] bg-[#dcfce7] text-[#14532d]'
                                                                : 'border-[#fed7aa] bg-white text-[#334155] hover:bg-[#fff7ed]',
                                                        )}
                                                        onClick={() => selectInventoryPart(part)}
                                                        disabled={readOnly}
                                                    >
                                                        <span className="font-black">{part.model}</span>
                                                        <span className="text-xs font-bold text-slate-500">Caja {part.box.toUpperCase()} - {part.quantity} disponible{part.quantity === 1 ? '' : 's'}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : null}
                                        <textarea className={changedTextareaClass(form.data.repuesto, repair.repuesto ?? '')} value={form.data.repuesto} onChange={(event) => form.setData((current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))} rows={2} disabled={readOnly} />
                                    </div>
                                </EditField>
                                <label className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#f59e0b33] bg-[#fff8ed] px-3 py-2 text-sm font-black text-[#92400e]">
                                    <input
                                        type="checkbox"
                                        checked={form.data.repuesto_pedido}
                                        onChange={(event) => form.setData((current) => ({
                                            ...current,
                                            repuesto_pedido: event.target.checked,
                                            inventory_part_id: event.target.checked ? '' : current.inventory_part_id,
                                        }))}
                                        disabled={readOnly}
                                    />
                                    Mandar a pedidos
                                </label>
                                <h4 className="mt-2 border-b border-[#bfdbfe] pb-2 text-sm font-black text-[#0d6efd]">Imágenes Actuales</h4>
                                <RepairImagesBlock title="Imágenes iniciales" images={repair.imagenes} onOpen={setGalleryIndex} onRemove={(image) => removeImage(image, false)} readOnly={readOnly} />
                                {!readOnly ? (
                                    <ImageUploadPicker
                                        title="Agregar nuevas imágenes"
                                        help="Podés sacar foto o elegir de galería. Se guardan hasta 2 imágenes iniciales."
                                        previews={imagePreviews}
                                        onSelect={(event) => selectImages('images', event)}
                                        onRemove={(index) => removeSelectedImage('images', index)}
                                    />
                                ) : null}
                                <h4 className="mt-2 border-b border-[#86efac] pb-2 text-sm font-black text-[#198754]">Imágenes del resultado final</h4>
                                <RepairImagesBlock title="Imágenes finales" images={repair.imagenes_finales} onOpen={(index) => setGalleryIndex(repair.imagenes.length + index)} onRemove={(image) => removeImage(image, true)} readOnly={readOnly} />
                                {!readOnly ? (
                                    <ImageUploadPicker
                                        title="Agregar imágenes finales"
                                        help="Estas imágenes se habilitan cuando el estado está en LISTA. Se guardan como foto 3 y foto 4."
                                        disabled={repair.estado !== 'LISTA' && repair.entregado !== 'si'}
                                        previews={finalImagePreviews}
                                        onSelect={(event) => selectImages('final_images', event)}
                                        onRemove={(index) => removeSelectedImage('final_images', index)}
                                    />
                                ) : null}
                            </EditSection>
                        </div>
                        {repair.events && repair.events.length > 0 ? (
                            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <strong className="text-sm text-[#0f172a]">Historial</strong>
                                {repair.events.map((event) => (
                                    <div key={event.id} className="flex justify-between gap-3 rounded-lg bg-white px-3 py-2 text-xs">
                                        <strong>{event.evento}</strong>
                                        <span>{event.created_at || event.estado_nuevo || 'Actualizado'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setEditOpen(false)}>Cerrar</button>
                            <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing}>
                                <FaSave aria-hidden="true" /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {deliveryOpen ? (
                <ModalShell title={`Entregar orden #${repair.id} trabajo #${repair.reparacion}`} onClose={() => setDeliveryOpen(false)}>
                    <form className="grid gap-3" onSubmit={deliverRepair}>
                        <input className={ui.input} type="date" value={form.data.fecha_entregado} onChange={(event) => form.setData('fecha_entregado', event.target.value)} />
                        <select className={ui.input} value={deliveryVia} onChange={(event) => setDeliveryVia(event.target.value as DeliveryVia)}>
                            <option value="dni">ENTREGADO CON DNI</option>
                            <option value="ticket">ENTREGADO CON TICKET</option>
                            <option value="persona">ENTREGADO AL TITULAR EN PERSONA</option>
                            <option value="otra">ENTREGADO DE OTRA MANERA</option>
                        </select>
                        {deliveryVia === 'otra' ? (
                            <label className="grid gap-1.5 text-sm font-black text-[#334155]">
                                Como se valido la entrega
                                <textarea
                                    className={ui.textarea}
                                    value={deliveryDetail}
                                    onChange={(event) => setDeliveryDetail(event.target.value)}
                                    rows={3}
                                    required
                                    placeholder="Ej: retiro familiar, autorizacion por WhatsApp, validacion por llamada..."
                                />
                            </label>
                        ) : null}
                        {!repair.archivado_at ? (
                            <label className="flex items-center gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 text-sm font-bold text-[#334155]">
                                <input
                                    type="checkbox"
                                    checked={deliveryArchive}
                                    onChange={(event) => setDeliveryArchive(event.target.checked)}
                                />
                                Enviar a archivados
                            </label>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setDeliveryOpen(false)}>Cancelar</button>
                            <button type="submit" className={buttonClass('primary', 'sm')}>{deliveryArchive ? 'Enviar a archivados' : 'Confirmar entrega'}</button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {galleryIndex !== null && galleryImages[galleryIndex] ? (
                <ModalShell title={`Orden #${repair.id} - Trabajo ${repair.reparacion} - ${repairDisplayModel || ''}`} onClose={() => setGalleryIndex(null)}>
                    <div className="grid gap-3">
                        <img src={galleryImages[galleryIndex].url} alt={galleryImages[galleryIndex].filename} className="max-h-[70vh] w-full rounded-xl object-contain" />
                        <div className="flex items-center justify-between gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setGalleryIndex((galleryIndex - 1 + galleryImages.length) % galleryImages.length)}>Anterior</button>
                            <span className="text-sm font-bold text-slate-600">{galleryIndex + 1} / {galleryImages.length}</span>
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setGalleryIndex((galleryIndex + 1) % galleryImages.length)}>Siguiente</button>
                        </div>
                    </div>
                </ModalShell>
            ) : null}
        </>
    );

    if (variant === 'desktop') {
        return (
            <>
                <div className={cn('grid min-h-[64px] w-full items-stretch divide-x divide-slate-200 border-b border-l-4 border-slate-200 bg-white text-[0.74rem] leading-tight transition hover:bg-[#f8fafc] [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2', repairDesktopTableGridClass, isGroupedDesktopRow && 'border-r-2 border-r-[#cbd5e1]', isFirstGroupedDesktopRow && 'border-t-2 border-t-[#cbd5e1]', isLastGroupedDesktopRow && 'border-b-2 border-b-[#cbd5e1]', isGroupedDesktopRow && desktopGroupedRepairClass(rowIndex), isOverdue(repair) && 'bg-rose-50', isToday(repair.fecha_estimada) && 'bg-amber-50')}>
                    <div className="grid grid-cols-[minmax(0,1fr)_2.6rem] items-center gap-1 text-center">
                        {showDesktopTicketData ? <strong className="text-base leading-none text-[#0f172a]">#{repair.id}</strong> : <span className="text-slate-300">-</span>}
                        {showDesktopTicketData && rowTotal > 1 && onToggleDesktopGroup ? (
                            <button
                                type="button"
                                className="inline-flex h-6 w-[2.35rem] shrink-0 items-center justify-center gap-1 rounded-md border border-[#bfdbfe] bg-[#eff6ff] text-[0.58rem] font-black text-[#1d4ed8] transition hover:border-[#93c5fd] hover:bg-[#dbeafe]"
                                onClick={onToggleDesktopGroup}
                                title={desktopGroupExpanded ? 'Ocultar trabajos de esta orden' : 'Mostrar todos los trabajos de esta orden'}
                            >
                                <FaChevronDown className={cn('text-[0.52rem] transition', desktopGroupExpanded && 'rotate-180')} aria-hidden="true" />
                                {desktopGroupExpanded ? 'Ocultar' : rowTotal}
                            </button>
                        ) : <span className="block h-6 w-[2.35rem]" aria-hidden="true" />}
                    </div>
                    <button type="button" className="flex items-center text-left font-black uppercase text-[#0f172a]" onClick={openInlineEditor} title={repair.nombre_cliente}>{showDesktopTicketData ? repair.nombre_cliente : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor}>{showDesktopTicketData ? (repair.dni === 12345678 ? 'SIN DNI' : repair.dni) : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor} title={repair.contacto || '-'}>{showDesktopTicketData ? (repair.contacto || '-') : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor}>{showDesktopTicketData ? formatLegacyDate(repair.fecha) : ''}</button>
                    <div className="flex items-center justify-center"><Thumb large /></div>
                    <div className="grid content-center gap-1 text-left">
                        {rowTotal > 1 ? (
                            <div className="flex min-w-0 items-center gap-2">
                                <button type="button" className="min-w-0 text-left text-[0.62rem] font-black text-[#2563eb]" onClick={openInlineEditor} title={desktopWorkLabel}>
                                    {desktopWorkLabel}
                                </button>
                            </div>
                        ) : null}
                        <button type="button" className="min-w-0 text-left font-bold text-[#0f172a]" onClick={openInlineEditor} title={repairDisplayModel || '-'}>
                            {repairDisplayModel || '-'}
                        </button>
                    </div>
                    <button type="button" className="flex items-center text-left font-semibold text-[#334155]" onClick={openInlineEditor} title={displayDescription}>
                        <span className="line-clamp-2">{displayDescription}</span>
                    </button>
                    <button type="button" className="grid content-center gap-1 text-left font-semibold text-[#334155]" onClick={openInlineEditor}>
                        <span className="whitespace-nowrap">{formatLegacyDate(repair.fecha_estimada)}</span>
                        {isToday(repair.fecha_estimada) ? <span className="w-fit rounded bg-[#ffc107] px-1 text-[0.65rem] font-black leading-tight text-[#111827]">Hoy</span> : null}
                        {overdueText ? <span className="w-fit rounded bg-[#dc3545] px-1 text-[0.65rem] font-black leading-tight text-white">{overdueText}</span> : null}
                    </button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-black text-[#0f172a]" onClick={openInlineEditor}>
                        <PaymentStatus monto={monto} senia={senia} />
                    </button>
                    <div className="flex items-center justify-center">
                        <button
                            type="button"
                            className={cn('rounded-md px-2.5 py-1 text-[0.68rem] font-bold', repairStatusBadgeClass(repair.estado), !readOnly && canCycleStatus && 'hover:brightness-95', (readOnly || !canCycleStatus) && 'cursor-default')}
                            onClick={cycleDesktopStatus}
                            disabled={readOnly || !canCycleStatus || form.processing}
                            title={!readOnly && canCycleStatus ? `Cambiar a ${compactStatus(nextStatus)}` : compactStatus(repair.estado)}
                        >
                            {compactStatus(repair.estado)}
                        </button>
                    </div>
                    <div className="flex items-center justify-end">
                        {readOnly ? (
                            <div className="grid justify-items-end gap-1 text-right">
                                <span className="text-[0.7rem] font-black text-[#0f172a]">{deliveredDetailLabel(repair.fecha_entregado)}</span>
                                <span className="text-[0.66rem] font-bold text-[#64748b]">{formatLegacyDate(repair.fecha_entregado)}</span>
                                {repair.actions?.deliver ? (
                                    <button type="button" className="rounded-md border border-[#bfdbfe] bg-white px-2 py-1 text-[0.66rem] font-black uppercase text-[#1d4ed8] transition hover:bg-[#eff6ff]" onClick={openDeliveryModal}>
                                        {archived ? 'Entregar' : 'Cambiar'}
                                    </button>
                                ) : null}
                                {repair.actions?.moveBack ? (
                                    <button type="button" className="rounded-md border border-[#f59e0b] bg-[#fff7ed] px-2 py-1 text-[0.66rem] font-black uppercase text-[#92400e] transition hover:bg-[#ffedd5]" onClick={moveBackToConsultas}>
                                        A consultas
                                    </button>
                                ) : null}
                                {archived && repair.actions?.delete ? (
                                    <button type="button" className="rounded-md border border-[#fecdd3] bg-[#fff1f2] px-2 py-1 text-[0.66rem] font-black uppercase text-[#be123c] transition hover:bg-[#ffe4e6]" onClick={deleteRepair}>
                                        Eliminar
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                        {!readOnly && !inlineOpen ? <ActionButtons showGeneralTicketActions={rowIndex === 0} /> : null}
                        {!readOnly && inlineOpen ? <span className="text-center text-xs font-bold uppercase text-[#1d4ed8]">Editando</span> : null}
                    </div>
                </div>
                {!readOnly && inlineOpen ? (
                    <div id={`inline-wrap-${repair.registro_id}`} className="border-b border-slate-200 bg-[#f8fbff] p-3">
                        <InlineEditor />
                    </div>
                ) : null}
                {modals}
            </>
        );
    }

    return (
        <>
            <details className="overflow-hidden rounded-lg border border-[#cbd5e1] bg-white shadow-sm">
                <summary className={cn('cursor-pointer list-none px-2.5 py-2', repairStatusHeaderClass(repair.estado))}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[0.66rem] font-bold text-[#0f172a]">#{repair.id}</span>
                                <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-[0.66rem] font-bold text-[#1d4ed8]">{rowIndex + 1}/{rowTotal}</span>
                                <span className="rounded-md bg-white/90 px-1.5 py-0.5 text-[0.62rem] font-bold text-[#0f172a]">{compactStatus(repair.estado)}</span>
                            </div>
                            <h4 className="truncate text-[0.96rem] font-black leading-tight">{repairDisplayModel || 'Sin modelo'}</h4>
                            <p className="truncate text-[0.78rem] font-bold opacity-90">{displayDescription === '-' ? 'SIN DESCRIPCION' : displayDescription}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.72rem] font-black">
                                <span className="rounded-md bg-white/85 px-1.5 py-0.5 text-[#0f172a]">{formatLegacyDate(repair.fecha_estimada)}</span>
                                {isToday(repair.fecha_estimada) ? <span className="rounded-md bg-[#ffc107] px-1.5 py-0.5 text-[#111827]">Hoy</span> : null}
                                {overdueText ? <span className="rounded-md bg-[#dc3545] px-1.5 py-0.5 text-white">{overdueText}</span> : null}
                                <span className="rounded-md border border-[#111827] bg-white px-2 py-1 text-[0.78rem] font-black text-[#111827]">
                                    Saldo: <PaymentStatus monto={monto} senia={senia} />
                                </span>
                            </div>
                        </div>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/25 ring-1 ring-white/35">
                            <FaChevronDown aria-hidden="true" />
                        </span>
                    </div>
                </summary>
                <div className="grid gap-2.5 p-2.5">
                    {galleryImages.length > 0 ? (
                        <div className="grid gap-2 rounded-xl bg-slate-50 p-2">
                            <div className="flex items-center justify-between text-xs font-black uppercase text-slate-600">
                                <span>Fotos del equipo</span>
                                <span>{galleryImages.length}</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto">
                                {galleryImages.map((image, index) => (
                                    <button key={`${image.filename}-${index}`} type="button" className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white" onClick={() => setGalleryIndex(index)}>
                                        <img src={image.thumbnailUrl || image.url} alt={image.filename} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.classList.add('opacity-0'); }} />
                                        <span className="absolute bottom-0 inset-x-0 bg-slate-950/65 py-0.5 text-[0.58rem] font-bold text-white">{index < repair.imagenes.length ? 'Inicial' : 'Final'}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    <div className="grid grid-cols-2 gap-1.5">
                        {repair.dni !== 12345678 ? <FieldSummary label="DNI" value={repair.dni} onClick={openInlineEditor} /> : null}
                        {repair.contacto ? <FieldSummary label="Contacto" value={repair.contacto} onClick={openInlineEditor} /> : null}
                        <FieldSummary label="Saldo" value={<PaymentStatus monto={monto} senia={senia} />} strong onClick={openInlineEditor} />
                        <FieldSummary label="F. estimada" value={<>{formatLegacyDate(repair.fecha_estimada)}{isToday(repair.fecha_estimada) ? <span className="ml-1 rounded bg-[#ffc107] px-1 text-[0.65rem] font-black text-[#111827]">Hoy</span> : null}{overdueText ? <span className="ml-1 rounded bg-[#dc3545] px-1 text-[0.65rem] font-black text-white">{overdueText}</span> : null}</>} onClick={openInlineEditor} />
                        <FieldSummary label="Estado" value={compactStatus(repair.estado)} onClick={openInlineEditor} />
                        {readOnly ? <FieldSummary label="Detalle" value={deliveredDetailLabel(repair.fecha_entregado)} /> : null}
                        {senia > 0 ? <FieldSummary label="Senia" value={formatCurrency(senia)} onClick={openInlineEditor} /> : null}
                    </div>
                    {readOnly && repair.actions?.deliver ? (
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={openDeliveryModal}>
                            {archived ? 'Entregar' : 'Cambiar forma de entrega'}
                        </button>
                    ) : null}
                    {readOnly && repair.actions?.moveBack ? (
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={moveBackToConsultas}>
                            Devolver a consultas
                        </button>
                    ) : null}
                    {readOnly && archived && repair.actions?.delete ? (
                        <button type="button" className={buttonClass('danger', 'sm', 'w-full')} onClick={deleteRepair}>
                            Eliminar
                        </button>
                    ) : null}
                    {showMore ? (
                        <details className="rounded-lg border border-slate-200 bg-slate-50">
                            <summary className="cursor-pointer px-3 py-2 text-sm font-black text-[#1d4ed8]"><FaImages className="mr-1 inline" aria-hidden="true" />Ver mas</summary>
                            <div className="grid gap-2 p-3 text-sm">
                                <FieldSummary label="F. ingreso" value={formatLegacyDate(repair.fecha)} onClick={openInlineEditor} />
                                {repair.descripcion ? <FieldSummary label="Descripcion" value={repair.descripcion} onClick={openInlineEditor} /> : null}
                                {repair.repuesto ? <FieldSummary label="Repuesto" value={repair.repuesto} onClick={openInlineEditor} /> : null}
                                {repair.observaciones ? <FieldSummary label="Observaciones" value={repair.observaciones} onClick={openInlineEditor} /> : null}
                            </div>
                        </details>
                    ) : null}
                    {!readOnly && inlineOpen ? <InlineEditor mobile /> : null}
                    {!readOnly && !inlineOpen ? <ActionButtons mobile showGeneralTicketActions={rowIndex === 0} /> : null}
                </div>
            </details>
            {modals}
        </>
    );
}

export function RepairDesktopRow({
    ticket,
    repair,
    serviceCategories,
    serviceTemplates = [],
    partInventory = [],
    readOnly = false,
    rowIndex = 0,
    rowTotal = ticket.repairs.length,
    desktopGroupExpanded = true,
    onToggleDesktopGroup,
    archived = false,
}: {
    ticket: RepairTicketView;
    repair: RepairOrderView;
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates?: ServiceTemplateOption[];
    partInventory?: RepairPartInventoryOption[];
    readOnly?: boolean;
    rowIndex?: number;
    rowTotal?: number;
    desktopGroupExpanded?: boolean;
    onToggleDesktopGroup?: () => void;
    archived?: boolean;
}): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);

    return (
        <>
            <RepairEditCard
                repair={repair}
                serviceCategories={serviceCategories}
                partInventory={partInventory}
                readOnly={readOnly}
                ticket={ticket}
                variant="desktop"
                rowIndex={rowIndex}
                rowTotal={rowTotal}
                desktopGroupExpanded={desktopGroupExpanded}
                onToggleDesktopGroup={onToggleDesktopGroup}
                archived={archived}
                onAddRepair={() => setAddOpen(true)}
            />
            {addOpen ? <AddRepairModal ticket={ticket} serviceCategories={serviceCategories} serviceTemplates={serviceTemplates} partInventory={partInventory} onClose={() => setAddOpen(false)} /> : null}
        </>
    );
}

export function RepairTicketPanel({
    ticket,
    states,
    serviceCategories,
    serviceTemplates = [],
    partInventory = [],
    allowAddRepair = false,
    readOnly = false,
    archived = false,
}: RepairTicketPanelProps): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);
    const [desktopGroupExpanded, setDesktopGroupExpanded] = useState(false);
    const desktopRepairs = desktopGroupExpanded ? ticket.repairs : ticket.repairs.slice(0, 1);

    return (
        <section className={cn(ui.repairTicketPanel, 'max-xl:rounded-xl max-xl:border-2 max-xl:border-[#94a3b8] max-xl:bg-[#eef4fb] max-xl:p-2 max-xl:shadow-[0_2px_8px_rgba(15,23,42,0.12)]')}>
            <header className="flex flex-col gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-3 md:flex-row md:items-start md:justify-between max-xl:border-[#94a3b8] max-xl:bg-white">
                <div className="min-w-0">
                    <p className="text-[0.78rem] font-semibold text-[#475569] md:text-xs">Ticket #{ticket.id}</p>
                    <h3 className="truncate text-[1rem] font-extrabold tracking-tight text-[#0f172a] md:text-2xl">{ticket.nombre_cliente}</h3>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[0.78rem] font-semibold text-[#475569] md:gap-2 md:text-sm">
                        <span>DNI: {ticket.dni}</span>
                        <span>Contacto: {ticket.contacto || 'Sin dato'}</span>
                        <span>Fecha: {formatLegacyDate(ticket.fecha)}</span>
                        <span>Reparaciones: {ticket.repairsCount}</span>
                        <span>Total: {formatCurrency(ticket.totalMonto)}</span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                    <Link href={ticket.ticketUrl} className="inline-flex min-h-8 items-center justify-center rounded-[9px] border border-[#111827] bg-[#111827] px-2.5 py-1 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#0b1220] md:min-h-[34px] md:px-3 md:py-1.5 md:text-sm">
                        Ticket tecnico
                    </Link>
                    <a href={ticket.trackingUrl} className="inline-flex min-h-8 items-center justify-center rounded-[9px] border border-[#0d6efd] bg-[#0d6efd] px-2.5 py-1 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#0b5ed7] md:min-h-[34px] md:px-3 md:py-1.5 md:text-sm">
                        Seguimiento
                    </a>
                    {ticket.whatsappUrl ? (
                        <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-8 items-center justify-center rounded-[9px] border border-[#25D366] bg-[#25D366] px-2.5 py-1 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#128C7E] md:min-h-[34px] md:px-3 md:py-1.5 md:text-sm">
                            WhatsApp cliente
                        </a>
                    ) : (
                        <span className="inline-flex min-h-[34px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-600">Sin WhatsApp</span>
                    )}
                    {allowAddRepair && !readOnly ? (
                        <button type="button" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[9px] border border-[#7c3aed] bg-[#7c3aed] px-2.5 py-1 text-[0.78rem] font-bold text-white transition hover:bg-[#6d28d9] md:min-h-[34px] md:px-3 md:py-1.5 md:text-sm xl:hidden" onClick={() => setAddOpen(true)}>
                            <FaPlus aria-hidden="true" />Agregar reparacion
                        </button>
                    ) : null}
                </div>
            </header>

            <div className="hidden overflow-x-auto rounded-lg border border-[#cbd5e1] bg-white shadow-sm xl:block">
                <div className="w-full min-w-[1680px]">
                    <div className={cn('grid items-center gap-2 border-b border-[#cbd5e1] bg-[#f8fafc] px-3 py-3 text-[0.7rem] font-bold text-[#475569]', repairDesktopTableGridClass)}>
                        <span className="text-center">ID</span>
                        <span>Cliente</span>
                        <span>DNI</span>
                        <span>Contacto</span>
                        <span>Ingreso</span>
                        <span className="text-center">Imagen</span>
                        <span>Modelo</span>
                        <span>Estimada</span>
                        <span>Saldo</span>
                        <span className="text-center">Estado</span>
                        <span className="text-center">Acciones</span>
                    </div>
                    <div className="grid bg-white">
                        {desktopRepairs.map((repair, index) => (
                            <RepairEditCard
                                key={`desktop-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                                repair={repair}
                                serviceCategories={serviceCategories}
                                partInventory={partInventory}
                                readOnly={readOnly}
                                ticket={ticket}
                                variant="desktop"
                                rowIndex={index}
                                rowTotal={ticket.repairs.length}
                                desktopGroupExpanded={desktopGroupExpanded}
                                onToggleDesktopGroup={index === 0 && ticket.repairs.length > 1 ? () => setDesktopGroupExpanded((expanded) => !expanded) : undefined}
                                archived={archived}
                                onAddRepair={() => setAddOpen(true)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-[#dbeafe] p-2 xl:hidden">
                {ticket.repairs.map((repair, index) => (
                    <RepairEditCard
                        key={`mobile-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                        repair={repair}
                        serviceCategories={serviceCategories}
                        partInventory={partInventory}
                        readOnly={readOnly}
                        ticket={ticket}
                        variant="mobile"
                        rowIndex={index}
                        rowTotal={ticket.repairs.length}
                        archived={archived}
                        onAddRepair={() => setAddOpen(true)}
                    />
                ))}
            </div>

            {addOpen ? <AddRepairModal ticket={ticket} serviceCategories={serviceCategories} serviceTemplates={serviceTemplates} partInventory={partInventory} onClose={() => setAddOpen(false)} /> : null}
            <span className="hidden">{states.length}</span>
        </section>
    );
}
