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
    FaEllipsisH,
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
import { RepairColorCombobox, normalizeRepairKey as normalizeRepairText, phoneBrandOptions, repairColorSwatchClass } from './RepairColorCombobox';
import { PhoneUnlockFields, phoneUnlockLabel } from './PhoneUnlockFields';
import { RepairPartAccessoriesFields, normalizePartAccessories, partAccessoriesLabel, type RepairPartAccessory } from './RepairPartAccessoriesFields';
import { WebcamCaptureButton } from './WebcamCaptureButton';
import type { RepairImageView, RepairOrderView, RepairTicketView } from '../types';
import { repairButtonClass as buttonClass, repairUi as ui } from '../repairUi';
import {
    compactStatus,
    compactStatusLabel,
    repairStatusBadgeClass,
    repairStatusDotClass,
    repairStatusHeaderClass,
    repairStatusRailFillClass,
    repairStatusSelectClass,
    repairStatusTextClass,
} from '../repairStatus';
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
    'grid-cols-[6.8rem_7.6rem_4.6rem_5.6rem_5.2rem_4.1rem_minmax(9.9rem,1.03fr)_minmax(9rem,0.92fr)_6rem_4.6rem_6rem_minmax(12.4rem,0.82fr)]';

interface RepairTicketPanelProps {
    ticket: RepairTicketView;
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates?: ServiceTemplateOption[];
    partInventory?: RepairPartInventoryOption[];
    allowAddRepair?: boolean;
    readOnly?: boolean;
    archived?: boolean;
    statusLabel?: (repair: RepairOrderView) => string;
    highlightTerm?: string;
}

interface RepairUpdateFormData {
    id_nuevo: string;
    fecha: string;
    nombre_cliente: string;
    dni: string;
    contacto: string;
    marca: string;
    modelo: string;
    color: string;
    descripcion: string;
    observaciones: string;
    info: string;
    monto: string;
    senia: string;
    fecha_estimada: string;
    estado: string;
    cancelado_motivo: string;
    garantia_motivo: string;
    fecha_entregado: string;
    repuesto: string;
    repuesto_pedido: boolean;
    inventory_part_id: string;
    repuesto_agregados: RepairPartAccessory[];
    repuesto_agregado_otro: string;
    categorias_reparacion: string;
    unlock_type: string;
    unlock_value: string;
    images: File[] | null;
    final_images: File[] | null;
}

interface AddRepairFormData {
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
    repuesto: string;
    repuesto_pedido: boolean;
    inventory_part_id: string;
    repuesto_agregados: RepairPartAccessory[];
    repuesto_agregado_otro: string;
    categorias_reparacion: string;
    unlock_type: string;
    unlock_value: string;
    images: File[] | null;
}

interface PaymentFormData {
    amount: string;
    payment_type: string;
    method: string;
    notes: string;
    paid_at: string;
}

interface IncrementFormData {
    amount: string;
    payment_type: string;
    notes: string;
    paid_at: string;
}

type DeliveryVia = 'dni' | 'ticket' | 'persona' | 'otra';

function isPhoneCategoryValue(serviceCategories: ServiceCategoryOption[], value: string | number | null | undefined): boolean {
    const category = serviceCategories.find((item) => String(item.value) === String(value));

    return category?.label.toLowerCase().includes('celular') ?? false;
}


function desktopGroupedRepairClass(index: number): string {
    const tones = [
        'border-l-[#1d4ed8] bg-white',
        'border-l-[#2563eb] bg-[#f8fbff]',
        'border-l-[#2563eb] bg-white',
        'border-l-[#2563eb] bg-[#f8fbff]',
    ];

    return tones[index % tones.length];
}

function nextQuickStatus(status: string): string {
    if (status === 'PENDIENTE') return 'EN REPARACION';
    if (status === 'EN REPARACION' || status === 'EN REPARACION / ESPERA REPUESTO') return 'LISTA';
    if (status === 'GARANTIA') return 'LISTA';
    if (status === 'LISTA') return 'PENDIENTE';

    return status;
}

function formatLegacyDate(value?: string | null): string {
    if (!value) return '-';
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
}

function transferPriceLabel(value: string | number | null | undefined): string {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
        return 'Transferencia: sin monto';
    }

    return amount > 30000
        ? `Transferencia: ${formatCurrency(Math.round(amount * 1.1))}`
        : 'Transferencia: mismo importe';
}

function seniaBadgeLabel(monto: number, senia: number): string | null {
    if (senia <= 0) return null;
    if (monto > 0 && senia >= monto) return null;

    return `Seña ${formatCurrency(senia)}`;
}

function SeniaBadge({ label }: { label: string | null }): JSX.Element | null {
    if (!label) return null;

    return (
        <span className="inline-flex w-fit items-center rounded-full border border-orange-300 bg-orange-50 px-2 py-0.5 text-[0.65rem] font-black text-orange-900">
            {label}
        </span>
    );
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

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ value, term }: { value: string | number | null | undefined; term?: string }): JSX.Element {
    const text = value === null || value === undefined ? '' : String(value);
    const query = (term ?? '').trim();

    if (text === '' || query === '') {
        return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));

    return (
        <>
            {parts.map((part, index) => (
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={`${part}-${index}`} className="rounded-sm bg-[#fde047] px-0.5 font-black text-[#111827]">{part}</mark>
                    : <span key={`${part}-${index}`}>{part}</span>
            ))}
        </>
    );
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

function repairModelGroupKey(repair: RepairOrderView): string {
    return normalizeRepairText(displayRepairModel(repair));
}

function repairSameModelPosition(ticket: RepairTicketView, repair: RepairOrderView): { index: number; total: number } {
    const modelKey = repairModelGroupKey(repair);

    if (modelKey === '' || modelKey === '-') {
        return { index: 1, total: 1 };
    }

    const sameModelRepairs = ticket.repairs.filter((ticketRepair) => repairModelGroupKey(ticketRepair) === modelKey);
    const currentIndex = sameModelRepairs.findIndex((ticketRepair) => ticketRepair.registro_id === repair.registro_id);

    return {
        index: currentIndex >= 0 ? currentIndex + 1 : 1,
        total: sameModelRepairs.length,
    };
}

function repairSameModelAdjacency(ticket: RepairTicketView, repair: RepairOrderView): { previous: boolean; next: boolean } {
    const modelKey = repairModelGroupKey(repair);
    const currentIndex = ticket.repairs.findIndex((ticketRepair) => ticketRepair.registro_id === repair.registro_id);

    if (modelKey === '' || modelKey === '-' || currentIndex < 0) {
        return { previous: false, next: false };
    }

    return {
        previous: currentIndex > 0 && repairModelGroupKey(ticket.repairs[currentIndex - 1]) === modelKey,
        next: currentIndex < ticket.repairs.length - 1 && repairModelGroupKey(ticket.repairs[currentIndex + 1]) === modelKey,
    };
}

function desktopSameModelAccentClass(modelKey: string): string {
    const tones = [
        'border-l-[#475569]',
        'border-l-[#0f766e]',
        'border-l-[#7c3aed]',
        'border-l-[#b45309]',
    ];
    const hash = Array.from(modelKey).reduce((total, char) => total + char.charCodeAt(0), 0);

    return tones[hash % tones.length];
}

function RepairColorSwatch({ color }: { color?: string | null }): JSX.Element | null {
    const label = (color ?? '').trim();

    if (label === '') {
        return null;
    }

    return (
        <span
            className={cn('inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-[#64748b]', repairColorSwatchClass(label))}
            title={label}
            aria-label={`Color ${label}`}
        />
    );
}

function RepairModelLabel({ repair, term }: { repair: RepairOrderView; term?: string }): JSX.Element {
    const model = displayRepairModel(repair);

    return (
        <span className="inline-flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate"><HighlightText value={model || '-'} term={term} /></span>
            {(repair.color ?? '').trim() !== '' ? <span className="shrink-0 text-[#64748b]">-</span> : null}
            <RepairColorSwatch color={repair.color} />
        </span>
    );
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
    labelClassName,
    valueClassName,
    className,
    onClick,
}: {
    label: string;
    value: ReactNode;
    strong?: boolean;
    labelClassName?: string;
    valueClassName?: string;
    className?: string;
    onClick?: () => void;
}): JSX.Element {
    const Wrapper = onClick ? 'button' : 'div';

    return (
        <Wrapper
            type={onClick ? 'button' : undefined}
            className={cn(
                'grid min-w-0 gap-0.5 rounded-md px-3 py-2 text-left',
                className ? 'border' : 'border border-slate-200 bg-white',
                onClick && (className ? 'cursor-pointer transition hover:border-[#94a3b8]' : 'cursor-pointer transition hover:border-[#94a3b8] hover:bg-[#f8fafc]'),
                className,
            )}
            onClick={onClick}
        >
            <span className={cn('text-[0.72rem] font-semibold', labelClassName ?? 'text-slate-500')}>{label}</span>
            <span className={cn('text-sm', valueClassName ?? 'text-[#0f172a]', strong && 'font-black')}>{value}</span>
        </Wrapper>
    );
}

function PaymentStatus({ monto, senia }: { monto: number; senia: number }): JSX.Element {
    if (monto <= 0 && senia <= 0) {
        return (
            <span className="inline-flex w-fit items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[0.68rem] font-bold text-sky-800">
                COTIZAR
            </span>
        );
    }

    if (monto > 0 && senia >= monto) {
        return (
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-bold text-emerald-800">
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
        <label className="grid min-w-0 content-start gap-1.5">
            <span className="text-[0.83rem] font-black leading-tight text-[#0f172a]">{label}</span>
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
    onCapture,
    onRemove,
}: {
    title: string;
    help: string;
    disabled?: boolean;
    previews: string[];
    onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    onCapture?: (file: File) => void;
    onRemove?: (index: number) => void;
}): JSX.Element {
    return (
        <div className={cn('grid gap-3 rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] p-3', disabled && 'opacity-60')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-[#0f172a]">{title}</strong>
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{previews.length}/2</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
                <label className={cn(buttonClass('primary', 'sm'), disabled && 'pointer-events-none')}>
                    <FaCamera aria-hidden="true" />
                    Sacar foto
                    <input className="sr-only" type="file" accept="image/*" capture="environment" disabled={disabled} onChange={onSelect} />
                </label>
                {onCapture ? (
                    <WebcamCaptureButton
                        className={buttonClass('soft', 'sm')}
                        disabled={disabled}
                        onCapture={onCapture}
                    />
                ) : null}
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
    baseRepair,
    serviceCategories,
    serviceTemplates,
    partInventory,
    onClose,
}: {
    ticket: RepairTicketView;
    baseRepair?: RepairOrderView | null;
    serviceCategories: ServiceCategoryOption[];
    serviceTemplates: ServiceTemplateOption[];
    partInventory: RepairPartInventoryOption[];
    onClose: () => void;
}): JSX.Element {
    const today = new Date().toISOString().slice(0, 10);
    const baseBrand = baseRepair ? inferredRepairBrand(baseRepair) : '';
    const form = useForm<AddRepairFormData>({
        marca: baseBrand,
        modelo: baseRepair?.modelo ?? '',
        color: baseRepair?.color ?? '',
        tipo_servicio: '',
        descripcion: '',
        observaciones: 'sin observaciones',
        monto: '0',
        senia: '0',
        senia_method: 'efectivo',
        fecha_estimada: today,
        repuesto: '',
        repuesto_pedido: false,
        inventory_part_id: '',
        repuesto_agregados: [],
        repuesto_agregado_otro: '',
        categorias_reparacion: String(baseRepair?.categorias_reparacion ?? 4),
        unlock_type: baseRepair?.unlock_type ?? '',
        unlock_value: baseRepair?.unlock_value ?? '',
        images: null,
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [partSearch, setPartSearch] = useState('');
    const baseUpdateAction = ticket.repairs[0]?.actions?.update ?? '';
    const action = ticket.addRepairAction ?? (baseUpdateAction !== '' ? `${baseUpdateAction.replace(/\/$/, '')}/add-repair` : '');

    const selectImageFiles = (files: File[]): void => {
        const currentFiles = form.data.images ?? [];
        const selected = [...currentFiles, ...files].slice(0, 2);

        form.setData('images', selected.length > 0 ? selected : null);
        setImagePreviews(selected.map((file) => URL.createObjectURL(file)));
    };

    const selectImages = (event: ChangeEvent<HTMLInputElement>): void => {
        selectImageFiles(Array.from(event.target.files ?? []));
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
        const phoneCategory = isPhoneCategoryValue(serviceCategories, value);

        form.setData((current) => ({
            ...current,
            categorias_reparacion: value,
            marca: phoneCategory ? current.marca : '',
            unlock_type: phoneCategory ? current.unlock_type : '',
            unlock_value: phoneCategory ? current.unlock_value : '',
            repuesto_agregados: phoneCategory ? current.repuesto_agregados : [],
            repuesto_agregado_otro: phoneCategory ? current.repuesto_agregado_otro : '',
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
                            <div className="text-xs font-semibold text-[#475569]">
                                Ticket #{ticket.id} - trabajo #{ticket.repairsCount + 1}
                                {baseRepair ? ` - mismo modelo que trabajo #${baseRepair.reparacion}` : ''}
                            </div>
                        </div>
                        <span className="rounded-md border border-[#93c5fd] bg-white px-2.5 py-1 text-xs font-black text-[#1d4ed8]">
                            {baseRepair ? 'Mismo equipo' : 'Nueva reparacion'}
                        </span>
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
                        <EditField label="Color">
                            <RepairColorCombobox className={ui.input} value={form.data.color} onChange={(value) => form.setData('color', value)} />
                        </EditField>
                        {isPhoneCategoryValue(serviceCategories, form.data.categorias_reparacion) ? (
                            <>
                                <EditField label="Desbloqueo">
                                    <PhoneUnlockFields
                                        unlockType={form.data.unlock_type}
                                        unlockValue={form.data.unlock_value}
                                        onChange={(unlockType, unlockValue) => form.setData((current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                        selectClassName={ui.input}
                                        inputClassName={ui.input}
                                    />
                                </EditField>
                                <RepairPartAccessoriesFields
                                    selected={form.data.repuesto_agregados}
                                    other={form.data.repuesto_agregado_otro}
                                    inputClassName={ui.input}
                                    className="sm:col-span-2"
                                    onChange={(selected, other) => form.setData((current) => ({ ...current, repuesto_agregados: normalizePartAccessories(selected), repuesto_agregado_otro: other }))}
                                    onOtherChange={(value) => form.setData('repuesto_agregado_otro', value)}
                                />
                            </>
                        ) : null}
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
                    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
                        <EditField label="Fecha estimada">
                            <input className={ui.input} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
                        </EditField>
                        <EditField label="Monto">
                            <input className={ui.input} inputMode="decimal" placeholder="0" value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} />
                        </EditField>
                        <EditField label="Seña">
                            <input className={ui.input} inputMode="decimal" placeholder="0" value={form.data.senia} onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} />
                        </EditField>
                        <EditField label="Medio de seña">
                            <select className={ui.input} value={form.data.senia_method} onChange={(event) => form.setData('senia_method', event.target.value)}>
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                            </select>
                        </EditField>
                        <div className="min-h-5 text-xs font-semibold leading-5 text-[#64748b] sm:col-span-2 lg:col-span-full">
                            {transferPriceLabel(form.data.monto)}
                        </div>
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
                        onCapture={(file) => selectImageFiles([file])}
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
    statusLabel,
    highlightTerm,
}: {
    repair: RepairOrderView;
    serviceCategories: ServiceCategoryOption[];
    readOnly?: boolean;
    ticket: RepairTicketView;
    partInventory: RepairPartInventoryOption[];
    variant?: 'mobile' | 'desktop';
    rowIndex?: number;
    rowTotal?: number;
    onAddRepair: (baseRepair?: RepairOrderView) => void;
    desktopGroupExpanded?: boolean;
    onToggleDesktopGroup?: () => void;
    archived?: boolean;
    statusLabel?: (repair: RepairOrderView) => string;
    highlightTerm?: string;
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
        color: repair.color ?? '',
        descripcion: repair.descripcion ?? '',
        observaciones: repair.observaciones ?? '',
        info: ticket.info ?? '',
        monto: formatAmountInput(repair.monto),
        senia: formatAmountInput(repair.senia),
        fecha_estimada: repair.fecha_estimada ?? '',
        estado: repair.estado,
        cancelado_motivo: repair.cancelado_motivo ?? '',
        garantia_motivo: repair.garantia_motivo ?? '',
        fecha_entregado: repair.fecha_entregado ?? '',
        repuesto: repair.repuesto ?? '',
        repuesto_pedido: Boolean(repair.repuesto_pedido),
        inventory_part_id: repair.inventory_part_id ? String(repair.inventory_part_id) : '',
        repuesto_agregados: normalizePartAccessories(repair.repuesto_agregados),
        repuesto_agregado_otro: repair.repuesto_agregado_otro ?? '',
        categorias_reparacion: String(repair.categorias_reparacion ?? 4),
        unlock_type: repair.unlock_type ?? '',
        unlock_value: repair.unlock_value ?? '',
        images: null,
        final_images: null,
    });
    const paymentForm = useForm<PaymentFormData>({
        amount: '',
        payment_type: 'senia',
        method: 'efectivo',
        notes: '',
        paid_at: todayInputValue(),
    });
    const incrementForm = useForm<IncrementFormData>({
        amount: '',
        payment_type: 'incremento',
        notes: '',
        paid_at: todayInputValue(),
    });
    const [editOpen, setEditOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [quickOpen, setQuickOpen] = useState(false);
    const [inlineOpen, setInlineOpen] = useState(false);
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [deliveryVia, setDeliveryVia] = useState<DeliveryVia>('dni');
    const [deliveryDetail, setDeliveryDetail] = useState('');
    const [deliveryArchive, setDeliveryArchive] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState(repair.cancelado_motivo ?? '');
    const [warrantyOpen, setWarrantyOpen] = useState(false);
    const [warrantyReason, setWarrantyReason] = useState(repair.garantia_motivo ?? '');
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [finalImagePreviews, setFinalImagePreviews] = useState<string[]>([]);
    const [partSearch, setPartSearch] = useState(repair.repuesto ?? '');
    const monto = Number(repair.monto ?? 0);
    const senia = Number(repair.senia ?? 0);
    const seniaLabel = seniaBadgeLabel(monto, senia);
    const galleryImages = [...repair.imagenes, ...repair.imagenes_finales];
    const firstImage = galleryImages[0];
    const canMarkReady = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'GARANTIA'].includes(repair.estado);
    const canDeliver = ['LISTA', 'CANCELADA'].includes(repair.estado) && repair.entregado !== 'si';
    const canCancel = repair.estado !== 'CANCELADA' && repair.entregado !== 'si';
    const canCycleStatus = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'GARANTIA', 'LISTA'].includes(repair.estado);
    const canAddToTasks = !['LISTA', 'CANCELADA'].includes(repair.estado);
    const nextStatus = nextQuickStatus(repair.estado);
    const displayStatus = statusLabel?.(repair) ?? compactStatus(repair.estado);
    const unlockLabel = phoneUnlockLabel(repair.unlock_type, repair.unlock_value);
    const accessoriesLabel = partAccessoriesLabel(repair.repuesto_agregados, repair.repuesto_agregado_otro);
    const showMore = Boolean(repair.descripcion || repair.repuesto || accessoriesLabel || repair.observaciones || repair.cancelado_motivo || repair.garantia_motivo || repair.contacto || repair.dni || unlockLabel);
    const hasInfo = (ticket.info ?? '').trim() !== '';
    const isGroupedDesktopRow = variant === 'desktop' && rowTotal > 1;
    const isFirstGroupedDesktopRow = isGroupedDesktopRow && rowIndex === 0;
    const isLastGroupedDesktopRow = isGroupedDesktopRow && (rowIndex === rowTotal - 1 || (rowIndex === 0 && !desktopGroupExpanded));
    const showDesktopTicketData = variant !== 'desktop' || rowIndex === 0;
    const overdueText = overdueLabel(repair);
    const desktopWorkLabel = rowTotal > 1 ? `Trabajo ${rowIndex + 1} de ${rowTotal}` : `Trabajo ${repair.reparacion}`;
    const repairBrand = inferredRepairBrand(repair);
    const repairDisplayModel = displayRepairModel(repair);
    const repairDisplayModelKey = repairModelGroupKey(repair);
    const sameModelPosition = repairSameModelPosition(ticket, repair);
    const sameModelAdjacency = repairSameModelAdjacency(ticket, repair);
    const hasRepeatedModelInTicket = sameModelPosition.total > 1;
    const showSameModelContinuity = desktopGroupExpanded && hasRepeatedModelInTicket;
    const sameModelLabel = `Mismo modelo ${sameModelPosition.index}/${sameModelPosition.total}`;
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
    const incrementAmountText = incrementForm.data.amount.trim();
    const incrementConceptText = incrementForm.data.notes.trim();
    const incrementAmount = Number(incrementAmountText || 0);
    const hasPendingIncrementInput = incrementAmountText !== '' || incrementConceptText !== '';
    const hasCompletePendingIncrement = incrementAmountText !== '' && incrementConceptText !== '' && Number.isFinite(incrementAmount) && incrementAmount > 0;
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

    const postEdit = (overrideMonto?: number): void => {
        if (!repair.actions?.update) return;

        form.transform((data) => overrideMonto === undefined
            ? data
            : ({
                ...data,
                monto: formatAmountInput(overrideMonto),
            }));

        form.post(repair.actions.update, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (overrideMonto !== undefined) {
                    form.setData('monto', formatAmountInput(overrideMonto));
                }
                form.reset('images', 'final_images');
                setImagePreviews([]);
                setFinalImagePreviews([]);
                setEditOpen(false);
                setInlineOpen(false);
            },
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    };

    const submitEdit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.update) return;

        if (hasPendingIncrementInput) {
            if (!hasCompletePendingIncrement) {
                window.alert('Para guardar el incremento, completa concepto e importe mayor a 0.');
                return;
            }

            if (!repair.actions?.addPayment) {
                window.alert('No se encontro la accion para registrar incrementos.');
                return;
            }

            const nextAmount = monto + incrementAmount;

            incrementForm.post(repair.actions.addPayment, {
                preserveScroll: true,
                onSuccess: () => {
                    incrementForm.reset('amount', 'notes');
                    postEdit(nextAmount);
                },
            });

            return;
        }

        postEdit();
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

    const submitIncrement = (): void => {
        if (!repair.actions?.addPayment) return;

        const nextAmount = Number.isFinite(incrementAmount) ? monto + incrementAmount : monto;

        incrementForm.post(repair.actions.addPayment, {
            preserveScroll: true,
            onSuccess: () => {
                incrementForm.reset('amount', 'notes');
                form.setData('monto', formatAmountInput(nextAmount));
            },
        });
    };

    const deletePayment = (action?: string): void => {
        if (!action) return;
        if (window.confirm('Eliminar este movimiento del historial?')) {
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

    const selectImageFiles = (key: 'images' | 'final_images', incomingFiles: File[]): void => {
        const currentFiles = form.data[key] ?? [];
        const files = [...currentFiles, ...incomingFiles].slice(0, 2);
        form.setData(key, files.length > 0 ? files : null);
        const previews = files.map((file) => URL.createObjectURL(file));

        if (key === 'images') {
            setImagePreviews(previews);
        } else {
            setFinalImagePreviews(previews);
        }
    };

    const selectImages = (key: 'images' | 'final_images', event: ChangeEvent<HTMLInputElement>): void => {
        selectImageFiles(key, Array.from(event.target.files ?? []));
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

    const openQuickView = (): void => {
        setQuickOpen(true);
    };

    const openAddRepairForSameModel = (): void => {
        setEditOpen(false);
        setQuickOpen(false);
        onAddRepair(repair);
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
        const phoneCategory = isPhoneCategoryValue(serviceCategories, value);

        form.setData((current) => ({
            ...current,
            categorias_reparacion: value,
            marca: phoneCategory ? current.marca : '',
            unlock_type: phoneCategory ? current.unlock_type : '',
            unlock_value: phoneCategory ? current.unlock_value : '',
            repuesto_agregados: phoneCategory ? current.repuesto_agregados : [],
            repuesto_agregado_otro: phoneCategory ? current.repuesto_agregado_otro : '',
        }));
    };

    const changeInlineBrand = (value: string): void => {
        form.setData((current) => ({
            ...current,
            marca: value,
            modelo: modelWithoutKnownBrand(current.modelo),
        }));
    };

    const changeInlineState = (value: string): void => {
        form.setData((current) => ({
            ...current,
            estado: value,
            cancelado_motivo: value === 'CANCELADA' ? current.cancelado_motivo : '',
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
        setCancelReason(repair.cancelado_motivo ?? '');
        setCancelOpen(true);
    };

    const submitCancelRepair = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.cancel) return;

        const reason = cancelReason.trim();
        if (reason === '') {
            window.alert('Indica el motivo de cancelacion.');
            return;
        }

        router.post(
            repair.actions.cancel,
            { cancelado_motivo: reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.setData((current) => ({
                        ...current,
                        estado: 'CANCELADA',
                        cancelado_motivo: reason,
                    }));
                    setCancelOpen(false);
                },
            },
        );
    };

    const deleteRepair = (): void => {
        if (!repair.actions?.delete) return;
        if (window.confirm(`Eliminar orden #${repair.id} trabajo #${repair.reparacion}?`)) {
            router.post(repair.actions.delete, {}, { preserveScroll: true });
        }
    };

    const moveBackToConsultas = (): void => {
        if (!repair.actions?.moveBack) return;

        if (repair.entregado === 'si') {
            setWarrantyReason(repair.garantia_motivo ?? '');
            setWarrantyOpen(true);
            return;
        }

        if (window.confirm(`Devolver orden #${repair.id} trabajo #${repair.reparacion} a consultas?`)) {
            router.post(repair.actions.moveBack, {}, { preserveScroll: true });
        }
    };

    const submitWarrantyReentry = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.moveBack) return;

        const reason = warrantyReason.trim();
        if (reason === '') {
            window.alert('Indica el motivo de garantia.');
            return;
        }

        router.post(
            repair.actions.moveBack,
            { garantia_motivo: reason },
            {
                preserveScroll: true,
                onSuccess: () => {
                    form.setData((current) => ({
                        ...current,
                        estado: 'GARANTIA',
                        garantia_motivo: reason,
                        fecha_entregado: '',
                    }));
                    setWarrantyOpen(false);
                },
            },
        );
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

    const InlineEditor = ({ mobile = false }: { mobile?: boolean }): JSX.Element => {
        if (mobile) {
            return (
                <form className="grid gap-3 rounded-md border border-[#cbd5e1] bg-white p-3 shadow-sm" onSubmit={submitEdit}>
                    <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2">
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Cliente">
                                <input className={ui.repairDenseInput} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} />
                            </EditField>
                            <EditField label="Contacto">
                                <input className={ui.repairDenseInput} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} />
                            </EditField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Orden">
                                <input className={ui.repairDenseInput} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} />
                            </EditField>
                            <EditField label="Ingreso">
                                <input className={ui.repairDenseInput} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} />
                            </EditField>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <EditField label="DNI">
                                <input className={ui.repairDenseInput} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} />
                            </EditField>
                        </div>
                    </div>

                    <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-white p-2">
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Categoría">
                                <select className={ui.repairDenseInput} value={form.data.categorias_reparacion} onChange={(event) => changeInlineCategory(event.target.value)}>
                                    {serviceCategories.map((category) => (
                                        <option key={category.value} value={category.value}>{category.label}</option>
                                    ))}
                                </select>
                            </EditField>
                            <EditField label="Color">
                                <RepairColorCombobox className={ui.repairDenseInput} value={form.data.color} onChange={(value) => form.setData('color', value)} />
                            </EditField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Marca">
                                {inlinePhoneCategory ? (
                                    <select className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => changeInlineBrand(event.target.value)}>
                                        <option value="">Marca...</option>
                                        {phoneBrandOptions.map((brand) => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => form.setData('marca', event.target.value.toUpperCase())} />
                                )}
                            </EditField>
                            <EditField label="Modelo">
                                <input className={ui.repairDenseInput} value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} />
                            </EditField>
                        </div>
                        {inlinePhoneCategory ? (
                            <>
                                <EditField label="Desbloqueo">
                                    <PhoneUnlockFields
                                        unlockType={form.data.unlock_type}
                                        unlockValue={form.data.unlock_value}
                                        onChange={(unlockType, unlockValue) => form.setData((current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                        selectClassName={ui.repairDenseInput}
                                        inputClassName={ui.repairDenseInput}
                                    />
                                </EditField>
                                <RepairPartAccessoriesFields
                                    selected={form.data.repuesto_agregados}
                                    other={form.data.repuesto_agregado_otro}
                                    inputClassName={ui.repairDenseInput}
                                    onChange={(selected, other) => form.setData((current) => ({ ...current, repuesto_agregados: normalizePartAccessories(selected), repuesto_agregado_otro: other }))}
                                    onOtherChange={(value) => form.setData('repuesto_agregado_otro', value)}
                                    disabled={readOnly}
                                />
                            </>
                        ) : null}
                    </div>

                    <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-white p-2">
                        <EditField label="Falla / trabajo">
                            <textarea className={cn(ui.repairDenseTextarea, 'min-h-[5.5rem]')} value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} />
                        </EditField>
                        <EditField label="Observaciones">
                            <textarea className={cn(ui.repairDenseTextarea, 'min-h-[4.5rem]')} value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} />
                        </EditField>
                    </div>

                    <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2">
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Monto">
                                <input className={ui.repairDenseInput} value={form.data.monto} inputMode="decimal" onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} />
                            </EditField>
                            <EditField label="Pagado">
                                <input className={ui.repairDenseInput} value={form.data.senia} inputMode="decimal" onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} />
                            </EditField>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Fecha estimada">
                                <input className={ui.repairDenseInput} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
                            </EditField>
                            <EditField label="Estado">
                                <select className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado))} value={form.data.estado} onChange={(event) => changeInlineState(event.target.value)}>
                                    {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
                                </select>
                            </EditField>
                        </div>
                        {form.data.estado === 'GARANTIA' ? (
                            <EditField label="Motivo de garantia">
                                <textarea
                                    className={ui.repairDenseTextarea}
                                    value={form.data.garantia_motivo}
                                    onChange={(event) => form.setData('garantia_motivo', event.target.value)}
                                    rows={3}
                                    required
                                    placeholder="Ej: volvio por falla intermitente, pantalla sin imagen, bateria no carga..."
                                />
                            </EditField>
                        ) : null}
                        <span className="text-xs font-semibold text-[#64748b]">{transferPriceLabel(form.data.monto)}</span>
                    </div>

                    <div className="grid gap-2 rounded-md border border-[#fed7aa] bg-[#fff7ed] p-2">
                        <div className="grid grid-cols-2 gap-2">
                            <EditField label="Incremento">
                                <input
                                    className={ui.repairDenseInput}
                                    inputMode="decimal"
                                    value={incrementForm.data.amount}
                                    onFocus={() => incrementForm.data.amount.trim() === '0' ? incrementForm.setData('amount', '') : undefined}
                                    onChange={(event) => incrementForm.setData('amount', event.target.value)}
                                />
                            </EditField>
                            <EditField label="Fecha">
                                <input className={ui.repairDenseInput} type="date" value={incrementForm.data.paid_at} onChange={(event) => incrementForm.setData('paid_at', event.target.value)} />
                            </EditField>
                        </div>
                        <EditField label="Concepto">
                            <input className={ui.repairDenseInput} value={incrementForm.data.notes} onChange={(event) => incrementForm.setData('notes', event.target.value)} />
                        </EditField>
                        <button
                            type="button"
                            className={buttonClass('soft', 'sm', 'w-full border-[#f59e0b] bg-[#f59e0b] text-white hover:bg-[#d97706]')}
                            disabled={incrementForm.processing || incrementForm.data.amount.trim() === '' || incrementForm.data.notes.trim() === ''}
                            onClick={submitIncrement}
                        >
                            Registrar incremento
                        </button>
                    </div>

                    <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-white p-2">
                        <EditField label="Repuesto">
                            <textarea className={cn(ui.repairDenseTextarea, 'min-h-[4rem]')} value={form.data.repuesto} onChange={(event) => form.setData((current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))} />
                        </EditField>
                        <label className="flex items-center gap-2 text-sm font-bold text-[#334155]">
                            <input type="checkbox" checked={form.data.repuesto_pedido} onChange={(event) => form.setData('repuesto_pedido', event.target.checked)} disabled={form.data.inventory_part_id !== ''} />
                            Repuesto pedido
                        </label>
                        {assignedInventoryModel ? <span className="text-xs font-semibold text-[#64748b]">Caja: {assignedInventoryBox ?? '-'} · {assignedInventoryModel}</span> : null}
                    </div>

                    <div className="sticky bottom-2 z-10 grid grid-cols-2 gap-2 rounded-md border border-[#cbd5e1] bg-white p-2 shadow-sm">
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={cancelInlineEdit}>Cancelar</button>
                        <button type="submit" className={buttonClass('primary', 'sm', 'w-full')} disabled={form.processing || incrementForm.processing}>
                            <FaSave aria-hidden="true" /> Guardar
                        </button>
                    </div>
                </form>
            );
        }

        return (
        <form
            className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-white p-3 shadow-sm"
            onSubmit={submitEdit}
        >
            <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 xl:grid-cols-[5rem_minmax(12rem,1fr)_7rem_9rem_8.5rem]">
                <EditField label="Orden">
                    <input className={ui.repairDenseInput} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} />
                </EditField>
                <EditField label="Cliente">
                    <input className={ui.repairDenseInput} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} />
                </EditField>
                <EditField label="DNI">
                    <input className={ui.repairDenseInput} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} />
                </EditField>
                <EditField label="Contacto">
                    <input className={ui.repairDenseInput} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} />
                </EditField>
                <EditField label="Ingreso">
                    <input className={ui.repairDenseInput} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} />
                </EditField>
            </div>

            <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-white p-2 xl:grid-cols-[8.5rem_8.5rem_minmax(10rem,1fr)_7rem_8.5rem]">
                <EditField label="Categoria">
                    <select className={ui.repairDenseInput} value={form.data.categorias_reparacion} onChange={(event) => changeInlineCategory(event.target.value)}>
                        {serviceCategories.map((category) => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                    </select>
                </EditField>
                <EditField label="Marca">
                    {inlinePhoneCategory ? (
                        <select className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => changeInlineBrand(event.target.value)}>
                            <option value="">Marca...</option>
                            {phoneBrandOptions.map((brand) => (
                                <option key={brand} value={brand}>{brand}</option>
                            ))}
                        </select>
                    ) : (
                        <input className={ui.repairDenseInput} value={form.data.marca} onChange={(event) => form.setData('marca', event.target.value.toUpperCase())} />
                    )}
                </EditField>
                <EditField label="Modelo">
                    <input className={ui.repairDenseInput} value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} />
                </EditField>
                <EditField label="Color">
                    <RepairColorCombobox className={ui.repairDenseInput} value={form.data.color} onChange={(value) => form.setData('color', value)} />
                </EditField>
                <EditField label="Estimada">
                    <input className={ui.repairDenseInput} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
                </EditField>
            </div>

            <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 xl:grid-cols-[8rem_8rem_11rem_minmax(11rem,1fr)]">
                <EditField label="Monto">
                    <input className={ui.repairDenseInput} value={form.data.monto} inputMode="decimal" onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} />
                </EditField>
                <EditField label="Pagado">
                    <input className={ui.repairDenseInput} value={form.data.senia} inputMode="decimal" onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} />
                </EditField>
                <EditField label="Estado">
                    <select className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado))} value={form.data.estado} onChange={(event) => changeInlineState(event.target.value)}>
                        {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                </EditField>
                <div className="grid content-end gap-1 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-xs font-semibold text-[#64748b]">
                    <span>{transferPriceLabel(form.data.monto)}</span>
                    <strong className="text-sm text-[#0f172a]">Saldo {formatCurrency(Math.max(0, Number(form.data.monto || 0) - Number(form.data.senia || 0)))}</strong>
                </div>
            </div>
            {form.data.estado === 'GARANTIA' ? (
                <EditField label="Motivo de garantia">
                    <textarea
                        className={ui.repairDenseTextarea}
                        value={form.data.garantia_motivo}
                        onChange={(event) => form.setData('garantia_motivo', event.target.value)}
                        rows={3}
                        required
                        placeholder="Ej: volvio por falla intermitente, pantalla sin imagen, bateria no carga..."
                    />
                </EditField>
            ) : null}

            <div className="grid gap-2 rounded-md border border-[#fed7aa] bg-[#fff7ed] p-2 xl:grid-cols-[minmax(180px,1fr)_120px_140px_auto] xl:items-end">
                <input
                    className={ui.repairDenseInput}
                    placeholder="Concepto de incremento"
                    value={incrementForm.data.notes}
                    onChange={(event) => incrementForm.setData('notes', event.target.value)}
                />
                <input
                    className={ui.repairDenseInput}
                    inputMode="decimal"
                    placeholder="Importe"
                    value={incrementForm.data.amount}
                    onFocus={() => incrementForm.data.amount.trim() === '0' ? incrementForm.setData('amount', '') : undefined}
                    onChange={(event) => incrementForm.setData('amount', event.target.value)}
                />
                <input
                    className={ui.repairDenseInput}
                    type="date"
                    value={incrementForm.data.paid_at}
                    onChange={(event) => incrementForm.setData('paid_at', event.target.value)}
                />
                <button
                    type="button"
                    className={buttonClass('soft', 'sm', 'min-h-9 whitespace-nowrap border-[#f59e0b] bg-[#f59e0b] px-3 text-white hover:bg-[#d97706]')}
                    disabled={incrementForm.processing || incrementForm.data.amount.trim() === '' || incrementForm.data.notes.trim() === ''}
                    onClick={submitIncrement}
                >
                    Registrar incremento
                </button>
            </div>

            <div className="grid gap-2 rounded-md border border-[#cbd5e1] bg-[#f8fafc] p-2 md:grid-cols-[2rem_minmax(0,1fr)_12rem] md:items-start">
                <span className="pt-2 text-sm font-black text-[#475569]">#1</span>
                <textarea className={cn(ui.repairDenseTextarea, 'min-h-[4.25rem]')} value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} placeholder="Descripcion de la falla" />
                <div className="grid gap-1 rounded-md border border-[#e2e8f0] bg-white p-2 text-xs font-semibold text-[#475569]">
                    <span>Monto actual</span>
                    <strong className="text-base text-[#0f172a]">{formatCurrency(Number(form.data.monto || 0))}</strong>
                    <span>{transferPriceLabel(form.data.monto)}</span>
                </div>
            </div>
            <textarea className={ui.repairDenseTextarea} value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} placeholder="Observaciones" />

            <div className="flex justify-end gap-2 border-t border-[#e2e8f0] pt-2">
                <button type="button" className={buttonClass('soft', 'sm')} onClick={cancelInlineEdit}>Cancelar</button>
                <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing || incrementForm.processing}>
                    <FaSave aria-hidden="true" /> Guardar
                </button>
            </div>
        </form>
        );
    };

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
                    {galleryImages.length > 1 ? <span className="absolute right-1 top-1 rounded-full bg-slate-950/75 px-1.5 py-0.5 text-[0.68rem] font-bold text-white">+{galleryImages.length - 1}</span> : null}
                </>
            ) : (
                <FaImage aria-hidden="true" />
            )}
        </button>
    );

    const ActionButtons = ({ mobile = false, showGeneralTicketActions = true, showOrderActions = showGeneralTicketActions }: { mobile?: boolean; showGeneralTicketActions?: boolean; showOrderActions?: boolean }): JSX.Element => {
        const iconOnly = true;
        const base = mobile
            ? 'grid h-9 w-9 place-items-center rounded-md text-[0.78rem] no-underline'
            : 'grid h-7 w-7 place-items-center rounded-md text-[0.72rem] no-underline shadow-sm transition hover:brightness-95';
        const menuItem = 'flex min-h-8 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-left text-[0.72rem] font-black text-[#334155] no-underline transition hover:bg-[#f8fafc]';
        const groupClass = mobile
            ? 'flex items-center gap-1.5'
            : 'flex items-center gap-1 border-l border-[#cbd5e1] pl-1.5 first:border-l-0 first:pl-0';
        const showWorkflowActions = (!readOnly && canAddToTasks && Boolean(repair.actions?.addToTasks)) || canMarkReady || canDeliver;
        const hasSecondaryDesktopActions = !mobile && (
            showGeneralTicketActions
            || showOrderActions
            || canCancel
            || Boolean(repair.actions?.archive && !repair.archivado_at)
            || Boolean(repair.actions?.delete)
        );

        if (!mobile) {
            return (
                <div className="flex flex-wrap items-center justify-end gap-1">
                    {showWorkflowActions ? (
                        <span className={groupClass}>
                            {!readOnly && canAddToTasks && repair.actions?.addToTasks ? (
                                <button
                                    type="button"
                                    className={cn(base, 'relative border border-[#d6b48c] bg-[#d6b48c] text-[#3f2a16]')}
                                    onClick={addToTasks}
                                    title={repair.taskQueuePosition ? `Quitar de tareas: posicion ${repair.taskQueuePosition}` : 'Agregar a tareas'}
                                >
                                    <FaClipboardCheck aria-hidden="true" />
                                    {repair.taskQueuePosition ? (
                                        <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full border border-white bg-[#3f2a16] px-1 text-[0.58rem] font-black leading-none text-white">
                                            {repair.taskQueuePosition}
                                        </span>
                                    ) : null}
                                </button>
                            ) : null}
                            {canMarkReady ? (
                                <button type="button" className={cn(base, 'border border-[#198754] bg-[#198754] text-white')} onClick={markReady} title="Listo">
                                    <FaCheckCircle aria-hidden="true" />
                                </button>
                            ) : null}
                            {canDeliver ? (
                                <button type="button" className={cn(base, 'border border-[#ffc107] bg-[#ffc107] text-[#111827]')} onClick={openDeliveryModal} title="Entregar">
                                    <FaDollyFlatbed aria-hidden="true" />
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
                                <FaInfoCircle aria-hidden="true" />
                            </button>
                        ) : null}
                        <button type="button" className={cn(base, 'border border-[#0d6efd] bg-[#0d6efd] text-white')} onClick={() => setEditOpen(true)} title="Editar">
                            <FaEdit aria-hidden="true" />
                        </button>
                        {showOrderActions ? (
                            <>
                                <button type="button" className={cn(base, 'border border-[#8b5cf6] bg-[#8b5cf6] text-white')} onClick={() => onAddRepair(repair)} title="Agregar reparación">
                                    <FaPlus aria-hidden="true" />
                                </button>
                                <Link href={ticket.ticketUrl} className={cn(base, 'border border-[#111827] bg-[#111827] text-white')} title="Ticket">
                                    <FaReceipt aria-hidden="true" />
                                </Link>
                                {ticket.whatsappUrl ? (
                                    <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className={cn(base, 'border border-[#25D366] bg-[#25D366] text-white')} title="WhatsApp">
                                        <FaWhatsapp aria-hidden="true" />
                                    </a>
                                ) : (
                                    <span className={cn(base, 'cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500')} title="Sin WhatsApp">
                                        <FaWhatsapp aria-hidden="true" />
                                    </span>
                                )}
                            </>
                        ) : null}
                    </span>
                    {hasSecondaryDesktopActions ? (
                        <details className="relative">
                            <summary className={cn(base, 'cursor-pointer list-none border border-[#cbd5e1] bg-white text-[#334155] [&::-webkit-details-marker]:hidden')} title="Mas acciones">
                                <FaEllipsisH aria-hidden="true" />
                            </summary>
                            <div className="absolute right-0 top-8 z-40 grid w-[11.5rem] gap-1 rounded-md border border-[#cbd5e1] bg-white p-1.5 shadow-lg">
                                {showOrderActions ? (
                                    <>
                                        <a href={ticket.trackingUrl} className={menuItem}>
                                            <FaArrowRight aria-hidden="true" /> Seguimiento
                                        </a>
                                    </>
                                ) : null}
                                {canCancel ? (
                                    <button type="button" className={cn(menuItem, 'border-[#fed7aa] bg-[#fff7ed] text-[#92400e]')} onClick={cancelRepair}>
                                        <FaTimes aria-hidden="true" /> Cancelar
                                    </button>
                                ) : null}
                                {!readOnly && repair.actions?.archive && !repair.archivado_at ? (
                                    <button type="button" className={cn(menuItem, 'border-[#cbd5e1] bg-[#f8fafc] text-[#475569]')} onClick={() => router.post(repair.actions?.archive ?? '', {}, { preserveScroll: true })}>
                                        <FaArchive aria-hidden="true" /> Archivar
                                    </button>
                                ) : null}
                                {repair.actions?.delete ? (
                                    <button type="button" className={cn(menuItem, 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c]')} onClick={deleteRepair}>
                                        <FaTrashAlt aria-hidden="true" /> Eliminar
                                    </button>
                                ) : null}
                            </div>
                        </details>
                    ) : null}
                </div>
            );
        }

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
                    {showOrderActions ? (
                        <button type="button" className={cn(base, 'border border-[#8b5cf6] bg-[#8b5cf6] text-white')} onClick={() => onAddRepair(repair)} title="Agregar reparacion">
                            <FaPlus aria-hidden="true" />{iconOnly ? null : 'Agregar reparacion'}
                        </button>
                    ) : null}
                </span>
                {showOrderActions ? (
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
            {quickOpen ? (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45" role="dialog" aria-modal="true">
                    <button type="button" className="min-w-0 flex-1 cursor-default" aria-label="Cerrar vista rápida" onClick={() => setQuickOpen(false)} />
                    <aside className="h-full w-full max-w-[520px] overflow-y-auto border-l border-[#cbd5e1] bg-white shadow-lg">
                        <header className="sticky top-0 z-10 border-b border-[#cbd5e1] bg-white px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-xs font-black uppercase text-[#2563eb]">Ticket #{repair.id} · Trabajo {repair.reparacion}</div>
                                    <h3 className="mt-1 truncate text-xl font-black text-[#0f172a]">{repair.nombre_cliente}</h3>
                                    <p className="text-sm font-bold text-[#475569]">{repairDisplayModel || 'Sin modelo'} · {displayStatus}</p>
                                </div>
                                <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-[#cbd5e1] bg-white text-[#334155]" onClick={() => setQuickOpen(false)} title="Cerrar">
                                    <FaTimes aria-hidden="true" />
                                </button>
                            </div>
                        </header>
                        <div className="grid gap-3 p-4 text-sm">
                            <section className="grid grid-cols-2 gap-2">
                                <FieldSummary label="DNI" value={<HighlightText value={repair.dni === 12345678 ? 'SIN DNI' : repair.dni} term={highlightTerm} />} />
                                <FieldSummary label="Contacto" value={<HighlightText value={repair.contacto || '-'} term={highlightTerm} />} />
                                <FieldSummary label="Ingreso" value={<HighlightText value={formatLegacyDate(repair.fecha)} term={highlightTerm} />} />
                                <FieldSummary label="Estimada" value={<><HighlightText value={formatLegacyDate(repair.fecha_estimada)} term={highlightTerm} />{isToday(repair.fecha_estimada) ? <span className="ml-1 rounded-full border border-[#fde68a] bg-[#fef3c7] px-1.5 text-[0.65rem] font-black text-[#92400e]">Hoy</span> : null}{overdueText ? <span className="ml-1 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-1.5 text-[0.65rem] font-black text-[#be123c]">{overdueText}</span> : null}</>} />
                                <FieldSummary label="Monto" value={formatCurrency(monto)} strong />
                                <FieldSummary label="Seña" value={senia > 0 ? formatCurrency(senia) : '-'} />
                            </section>
                            <section className="grid gap-2 rounded-md border border-[#cbd5e1] bg-[#f8fafc] p-3">
                                <div className="text-xs font-black uppercase text-[#475569]">Falla</div>
                                <p className="whitespace-pre-wrap font-semibold text-[#0f172a]"><HighlightText value={displayDescription} term={highlightTerm} /></p>
                            </section>
                            {repair.repuesto ? (
                                <section className="grid gap-2 rounded-md border border-[#fed7aa] bg-[#fff7ed] p-3">
                                    <div className="text-xs font-black uppercase text-[#92400e]">Repuesto</div>
                                    <p className="whitespace-pre-wrap font-semibold text-[#7c2d12]"><HighlightText value={repair.repuesto} term={highlightTerm} /></p>
                                </section>
                            ) : null}
                            {accessoriesLabel ? (
                                <section className="grid gap-2 rounded-md border border-[#cbd5e1] bg-white p-3">
                                    <div className="text-xs font-black uppercase text-[#475569]">Incluye</div>
                                    <p className="whitespace-pre-wrap font-semibold text-[#0f172a]"><HighlightText value={accessoriesLabel} term={highlightTerm} /></p>
                                </section>
                            ) : null}
                            {ticket.info ? (
                                <section className="grid gap-2 rounded-md border border-[#99f6e4] bg-[#f0fdfa] p-3">
                                    <div className="text-xs font-black uppercase text-[#0f766e]">Info interna</div>
                                    <p className="whitespace-pre-wrap font-semibold text-[#134e4a]">{ticket.info}</p>
                                </section>
                            ) : null}
                            {payments.length > 0 ? (
                                <section className="grid gap-2 rounded-md border border-[#cbd5e1] bg-white p-3">
                                    <div className="text-xs font-black uppercase text-[#475569]">Movimientos</div>
                                    {payments.slice(0, 5).map((payment) => (
                                        <div key={payment.id} className="flex items-center justify-between gap-2 border-t border-[#e2e8f0] pt-2 first:border-t-0 first:pt-0">
                                            <span className="font-bold text-[#334155]">{payment.payment_type} · {payment.method}</span>
                                            <span className="font-black text-[#0f172a]">{formatCurrency(payment.amount)}</span>
                                        </div>
                                    ))}
                                </section>
                            ) : null}
                            {galleryImages.length > 0 ? (
                                <section className="grid gap-2">
                                    <div className="text-xs font-black uppercase text-[#475569]">Imágenes</div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {galleryImages.slice(0, 6).map((image, imageIndex) => (
                                            <button key={`${image.filename}-${imageIndex}`} type="button" className="aspect-square overflow-hidden rounded-md border border-[#cbd5e1] bg-[#f1f5f9]" onClick={() => setGalleryIndex(imageIndex)}>
                                                <img src={image.thumbnailUrl || image.url} alt={image.filename} className="h-full w-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            ) : null}
                            {!readOnly ? (
                                <div className="sticky bottom-0 -mx-4 -mb-4 grid grid-cols-2 gap-2 border-t border-[#cbd5e1] bg-white p-4">
                                    <button type="button" className={buttonClass('primary', 'sm')} onClick={() => { setQuickOpen(false); setEditOpen(true); }}>
                                        Editar
                                    </button>
                                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => { setQuickOpen(false); setInfoOpen(true); }}>
                                        Info
                                    </button>
                                    {ticket.ticketUrl ? <Link href={ticket.ticketUrl} className={buttonClass('soft', 'sm')}>Ticket</Link> : null}
                                    {ticket.trackingUrl ? <a href={ticket.trackingUrl} className={buttonClass('soft', 'sm')}>Seguimiento</a> : null}
                                    {ticket.whatsappUrl ? <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className={buttonClass('soft', 'sm')}>WhatsApp</a> : null}
                                    <button type="button" className={buttonClass('soft', 'sm')} onClick={openAddRepairForSameModel}>Agregar reparación</button>
                                </div>
                            ) : null}
                        </div>
                    </aside>
                </div>
            ) : null}
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
                    <form className="repair-quick-edit grid gap-4" onSubmit={submitEdit}>
                        <div className="quick-edit-columns grid gap-4 md:grid-cols-2">
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
                                <EditField label="Color">
                                    <RepairColorCombobox className={changedInputClass(form.data.color, repair.color ?? '')} value={form.data.color} onChange={(value) => form.setData('color', value)} disabled={readOnly} />
                                </EditField>
                                <EditField label="Categoria">
                                    <select className={changedInputClass(form.data.categorias_reparacion, String(repair.categorias_reparacion ?? 4))} value={form.data.categorias_reparacion} onChange={(event) => changeInlineCategory(event.target.value)} disabled={readOnly}>
                                        {serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                                    </select>
                                </EditField>
                                {isPhoneCategoryValue(serviceCategories, form.data.categorias_reparacion) ? (
                                    <>
                                        <EditField label="Desbloqueo">
                                            <PhoneUnlockFields
                                                unlockType={form.data.unlock_type}
                                                unlockValue={form.data.unlock_value}
                                                onChange={(unlockType, unlockValue) => form.setData((current) => ({ ...current, unlock_type: unlockType, unlock_value: unlockValue }))}
                                                selectClassName={changedInputClass(form.data.unlock_type, repair.unlock_type ?? '')}
                                                inputClassName={changedInputClass(form.data.unlock_value, repair.unlock_value ?? '')}
                                                disabled={readOnly}
                                            />
                                        </EditField>
                                        <RepairPartAccessoriesFields
                                            selected={form.data.repuesto_agregados}
                                            other={form.data.repuesto_agregado_otro}
                                            inputClassName={ui.repairDenseInput}
                                            onChange={(selected, other) => form.setData((current) => ({ ...current, repuesto_agregados: normalizePartAccessories(selected), repuesto_agregado_otro: other }))}
                                            onOtherChange={(value) => form.setData('repuesto_agregado_otro', value)}
                                            disabled={readOnly}
                                        />
                                    </>
                                ) : null}
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="Monto ($)">
                                        <input className={changedInputClass(form.data.monto, formatAmountInput(repair.monto))} value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Pagado ($)">
                                        <input className={ui.repairDenseInput} value={formatCurrency(senia)} disabled />
                                    </EditField>
                                    <div className="min-h-5 text-xs font-semibold leading-5 text-[#64748b] sm:col-span-2">
                                        {transferPriceLabel(form.data.monto)}
                                    </div>
                                </div>
                                {!readOnly ? (
                                    <div className="grid gap-3 rounded-md border border-[#ddd6fe] bg-[#faf5ff] px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                                        <div className="min-w-0">
                                            <div className="text-sm font-black text-[#0f172a]">Agregar trabajo al mismo modelo</div>
                                            <div className="truncate text-xs font-semibold text-[#64748b]">{repairDisplayModel || 'Modelo sin cargar'}</div>
                                        </div>
                                        <button type="button" className={buttonClass('primary', 'sm', 'w-full whitespace-nowrap sm:w-auto')} onClick={openAddRepairForSameModel}>
                                            <FaPlus aria-hidden="true" /> Nuevo trabajo
                                        </button>
                                    </div>
                                ) : null}
                                {!readOnly ? (
                                    <div className="grid gap-2 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-3">
                                        <div className="grid items-end gap-2 [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]">
                                            <EditField label="Importe de seña">
                                                <input className={changedInputClass(paymentForm.data.amount, '', undefined, false)} inputMode="decimal" placeholder="Importe" value={paymentForm.data.amount} onChange={(event) => paymentForm.setData('amount', event.target.value)} />
                                            </EditField>
                                            <EditField label="Medio">
                                                <select className={changedInputClass(paymentForm.data.method, 'efectivo', undefined, false)} value={paymentForm.data.method || 'efectivo'} onChange={(event) => paymentForm.setData('method', event.target.value)}>
                                                    <option value="efectivo">Efectivo</option>
                                                    <option value="transferencia">Transferencia</option>
                                                </select>
                                            </EditField>
                                            <EditField label="Fecha de seña">
                                                <input className={changedInputClass(paymentForm.data.paid_at, todayInputValue(), undefined, false)} type="date" value={paymentForm.data.paid_at} onChange={(event) => paymentForm.setData('paid_at', event.target.value)} />
                                            </EditField>
                                            <button type="button" className={buttonClass('primary', 'sm', 'min-h-9 w-full whitespace-nowrap px-4')} disabled={paymentForm.processing || paymentForm.data.amount.trim() === ''} onClick={submitPayment}>
                                                Registrar seña
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                                {!readOnly ? (
                                    <div className="grid gap-2 rounded-lg border border-[#fed7aa] bg-[#fff7ed] p-3">
                                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1.35fr)_minmax(7.5rem,0.7fr)]">
                                            <EditField label="Concepto de incremento">
                                                <input className={changedInputClass(incrementForm.data.notes, '', undefined, false)} placeholder="Ej: pin de carga" value={incrementForm.data.notes} onChange={(event) => incrementForm.setData('notes', event.target.value)} />
                                            </EditField>
                                            <EditField label="Importe ($)">
                                                <input className={changedInputClass(incrementForm.data.amount, '', undefined, false)} inputMode="decimal" placeholder="0" value={incrementForm.data.amount} onFocus={() => incrementForm.data.amount.trim() === '0' ? incrementForm.setData('amount', '') : undefined} onChange={(event) => incrementForm.setData('amount', event.target.value)} />
                                            </EditField>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-[minmax(9rem,0.65fr)_minmax(11rem,auto)] sm:items-end">
                                            <EditField label="Fecha de incremento">
                                                <input className={changedInputClass(incrementForm.data.paid_at, todayInputValue(), undefined, false)} type="date" value={incrementForm.data.paid_at} onChange={(event) => incrementForm.setData('paid_at', event.target.value)} />
                                            </EditField>
                                            <button type="button" className={buttonClass('soft', 'sm', 'min-h-9 whitespace-nowrap border-[#f59e0b] bg-[#f59e0b] px-3 text-white hover:bg-[#d97706]')} disabled={incrementForm.processing || incrementForm.data.amount.trim() === '' || incrementForm.data.notes.trim() === ''} onClick={submitIncrement}>
                                                Registrar incremento
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                                <details className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc]">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm [&::-webkit-details-marker]:hidden">
                                        <span className="font-black text-[#0f172a]">Historial de pagos e incrementos ({payments.length})</span>
                                        <span className="flex items-center gap-2 font-black text-[#0f172a]">
                                            {formatCurrency(senia)}
                                            <FaChevronDown className="text-xs text-[#64748b]" aria-hidden="true" />
                                        </span>
                                    </summary>
                                    <div className="grid gap-3 border-t border-[#e2e8f0] p-3">
                                        {payments.length > 0 ? (
                                            <div className="grid gap-1">
                                                {payments.map((payment) => {
                                                    const isIncrement = payment.payment_type === 'incremento';
                                                    const detail = isIncrement ? payment.notes || 'Sin concepto' : 'Seña registrada';

                                                    return (
                                                        <div key={payment.id} className="relative grid grid-cols-[1fr_auto] gap-2 rounded-md border border-[#e2e8f0] bg-white px-3 py-2 pr-8 text-sm">
                                                        <div className="min-w-0">
                                                            <strong className="block text-[#0f172a]">{formatLegacyDate(payment.paid_at)} - {isIncrement ? 'incremento' : 'seña'}</strong>
                                                            <span className="block truncate text-xs font-semibold text-[#64748b]">{detail}</span>
                                                        </div>
                                                        <span className={cn('font-black', isIncrement ? 'text-[#b45309]' : 'text-[#0f172a]')}>{isIncrement ? '+' : ''}{formatCurrency(payment.amount)}</span>
                                                        {!readOnly ? (
                                                            <button
                                                                type="button"
                                                                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-md text-xs font-black text-[#dc2626] transition hover:bg-[#fee2e2]"
                                                                onClick={() => deletePayment(payment.deleteAction)}
                                                                title="Eliminar movimiento"
                                                                aria-label="Eliminar movimiento"
                                                            >
                                                                <FaTimes aria-hidden="true" />
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <span className="rounded-md border border-dashed border-[#cbd5e1] bg-white px-3 py-3 text-center text-sm font-semibold text-[#64748b]">Sin pagos registrados.</span>
                                        )}
                                    </div>
                                </details>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="Fecha de ingreso">
                                        <input className={changedInputClass(form.data.fecha, repair.fecha ?? '')} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Fecha estimada">
                                        <input className={changedInputClass(form.data.fecha_estimada, repair.fecha_estimada ?? '')} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <EditField label="Estado">
                                    <select
                                        className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado), hasChangedValue(form.data.estado, repair.estado) && 'ring-2 ring-[#2563eb]')}
                                        value={form.data.estado}
                                        onChange={(event) => changeInlineState(event.target.value)}
                                        disabled={readOnly}
                                    >
                                        {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                </EditField>
                                {form.data.estado === 'CANCELADA' ? (
                                    <EditField label="Motivo de cancelacion">
                                        <textarea
                                            className={changedTextareaClass(form.data.cancelado_motivo, repair.cancelado_motivo ?? '')}
                                            value={form.data.cancelado_motivo}
                                            onChange={(event) => form.setData('cancelado_motivo', event.target.value)}
                                            rows={3}
                                            disabled={readOnly}
                                            required
                                            placeholder="Ej: el cliente no autoriza el presupuesto, no se consigue repuesto, equipo sin solucion..."
                                        />
                                    </EditField>
                                ) : null}
                                {form.data.estado === 'GARANTIA' ? (
                                    <EditField label="Motivo de garantia">
                                        <textarea
                                            className={changedTextareaClass(form.data.garantia_motivo, repair.garantia_motivo ?? '')}
                                            value={form.data.garantia_motivo}
                                            onChange={(event) => form.setData('garantia_motivo', event.target.value)}
                                            rows={3}
                                            disabled={readOnly}
                                            required
                                            placeholder="Ej: volvio por falla intermitente, pantalla sin imagen, bateria no carga..."
                                        />
                                    </EditField>
                                ) : null}
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
                                        onCapture={(file) => selectImageFiles('images', [file])}
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
                                        onCapture={(file) => selectImageFiles('final_images', [file])}
                                        onRemove={(index) => removeSelectedImage('final_images', index)}
                                    />
                                ) : null}
                            </EditSection>
                        </div>
                        {repair.events && repair.events.length > 0 ? (
                            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <strong className="text-sm text-[#0f172a]">Historial</strong>
                                {repair.events.map((event) => (
                                    <div key={event.id} className="grid gap-1 rounded-lg bg-white px-3 py-2 text-xs">
                                        <div className="flex justify-between gap-3">
                                            <strong>{event.evento}</strong>
                                            <span>{event.created_at || event.estado_nuevo || 'Actualizado'}</span>
                                        </div>
                                        {event.detalle ? (
                                            <span className="font-semibold text-[#475569]">{event.detalle}</span>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setEditOpen(false)}>Cerrar</button>
                            <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing || incrementForm.processing}>
                                <FaSave aria-hidden="true" /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {cancelOpen ? (
                <ModalShell title={`Cancelar orden #${repair.id} trabajo #${repair.reparacion}`} onClose={() => setCancelOpen(false)}>
                    <form className="grid gap-3" onSubmit={submitCancelRepair}>
                        <p className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#92400e]">
                            La reparacion queda cancelada, pero sigue en consultas hasta que el cliente retire el equipo.
                        </p>
                        <label className="grid gap-1.5 text-sm font-black text-[#334155]">
                            Motivo de cancelacion
                            <textarea
                                className={ui.textarea}
                                value={cancelReason}
                                onChange={(event) => setCancelReason(event.target.value)}
                                rows={4}
                                required
                                autoFocus
                                placeholder="Ej: el cliente no autoriza el presupuesto, no se consigue repuesto, equipo sin solucion..."
                            />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setCancelOpen(false)}>Volver</button>
                            <button type="submit" className={buttonClass('danger', 'sm')}>Confirmar cancelacion</button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {warrantyOpen ? (
                <ModalShell title={`Reingreso por garantia #${repair.id} trabajo #${repair.reparacion}`} onClose={() => setWarrantyOpen(false)}>
                    <form className="grid gap-3" onSubmit={submitWarrantyReentry}>
                        <p className="rounded-lg border border-[#5eead4] bg-[#ccfbf1] px-3 py-2 text-sm font-bold text-[#115e59]">
                            La orden vuelve a consultas con estado GARANTIA y queda disponible para corregirla.
                        </p>
                        <label className="grid gap-1.5 text-sm font-black text-[#334155]">
                            Motivo de garantia
                            <textarea
                                className={ui.textarea}
                                value={warrantyReason}
                                onChange={(event) => setWarrantyReason(event.target.value)}
                                rows={4}
                                required
                                autoFocus
                                placeholder="Ej: volvio por falla intermitente, pantalla sin imagen, bateria no carga..."
                            />
                        </label>
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setWarrantyOpen(false)}>Volver</button>
                            <button type="submit" className={buttonClass('primary', 'sm')}>Reingresar por garantia</button>
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
                <div className={cn('group/repair-row grid min-h-[72px] w-full items-stretch divide-x divide-slate-200 border-b border-l-4 border-slate-200 bg-white text-[0.78rem] leading-snug transition hover:bg-[#f4f8fe] focus-within:bg-[#f4f8fe] [&>*]:min-w-0 [&>*]:px-2.5 [&>*]:py-2.5', repairDesktopTableGridClass, isGroupedDesktopRow && 'border-r-2 border-r-[#cbd5e1]', isFirstGroupedDesktopRow && 'border-t-2 border-t-[#cbd5e1]', isLastGroupedDesktopRow && 'border-b-2 border-b-[#cbd5e1]', isGroupedDesktopRow && desktopGroupedRepairClass(rowIndex), hasRepeatedModelInTicket && desktopSameModelAccentClass(repairDisplayModelKey), showSameModelContinuity && sameModelAdjacency.next && 'border-b-transparent', showSameModelContinuity && sameModelAdjacency.previous && 'shadow-[inset_0_1px_0_#f8fafc]', isOverdue(repair) && 'bg-[#fff8f8]', isToday(repair.fecha_estimada) && 'bg-[#fffbeb]')}>
                    <div className="sticky left-0 z-[2] grid grid-cols-[minmax(0,1fr)_2.6rem] items-center gap-1 bg-inherit text-center shadow-[1px_0_0_#cbd5e1]">
                        {showDesktopTicketData ? (
                            <button type="button" className="text-base font-black leading-none text-[#0f172a]" onClick={openQuickView}>#<HighlightText value={repair.id} term={highlightTerm} /></button>
                        ) : (
                            <button type="button" className="grid gap-0.5 text-left" onClick={openQuickView}>
                                <span className="text-[0.58rem] font-black uppercase text-[#2563eb]">Trabajo</span>
                                <span className="text-sm font-black text-[#0f172a]">{rowIndex + 1}/{rowTotal}</span>
                            </button>
                        )}
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
                    <button type="button" className="sticky left-[6.8rem] z-[2] flex items-center bg-inherit text-left font-black uppercase text-[#0f172a] shadow-[1px_0_0_#cbd5e1]" onClick={openQuickView} title={repair.nombre_cliente}>{showDesktopTicketData ? <HighlightText value={repair.nombre_cliente} term={highlightTerm} /> : <span className="text-[0.68rem] text-[#64748b]">Mismo ticket</span>}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openQuickView}>{showDesktopTicketData ? <HighlightText value={repair.dni === 12345678 ? 'SIN DNI' : repair.dni} term={highlightTerm} /> : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openQuickView} title={repair.contacto || '-'}>{showDesktopTicketData ? <HighlightText value={repair.contacto || '-'} term={highlightTerm} /> : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openQuickView}>{showDesktopTicketData ? <HighlightText value={formatLegacyDate(repair.fecha)} term={highlightTerm} /> : ''}</button>
                    <div className="flex items-center justify-center"><Thumb large /></div>
                    <div className={cn('grid content-center gap-1 text-left', hasRepeatedModelInTicket && 'bg-[#f8fafc]')}>
                        {rowTotal > 1 ? (
                            <div className="flex min-w-0 items-center gap-2">
                                <button type="button" className="min-w-0 text-left text-[0.62rem] font-black text-[#2563eb]" onClick={openQuickView} title={desktopWorkLabel}>
                                    {desktopWorkLabel}
                                </button>
                            </div>
                        ) : null}
                        <button type="button" className="min-w-0 text-left font-bold text-[#0f172a]" onClick={openQuickView} title={repairDisplayModel || '-'}>
                            <RepairModelLabel repair={repair} term={highlightTerm} />
                        </button>
                        {hasRepeatedModelInTicket ? (
                            <span className="w-fit rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-1.5 py-0.5 text-[0.58rem] font-black uppercase text-[#1d4ed8]">
                                {sameModelLabel}
                            </span>
                        ) : null}
                    </div>
                    <button type="button" className="flex items-center text-left font-semibold text-[#334155]" onClick={openQuickView} title={displayDescription}>
                        <span className="line-clamp-2"><HighlightText value={displayDescription} term={highlightTerm} /></span>
                    </button>
                    <button type="button" className="grid content-center gap-1 text-left font-semibold text-[#334155]" onClick={openQuickView}>
                        <span className="whitespace-nowrap"><HighlightText value={formatLegacyDate(repair.fecha_estimada)} term={highlightTerm} /></span>
                        {isToday(repair.fecha_estimada) ? <span className="w-fit rounded-full border border-[#fde68a] bg-[#fef3c7] px-1.5 text-[0.65rem] font-black leading-tight text-[#92400e]">Hoy</span> : null}
                        {overdueText ? <span className="w-fit rounded-full border border-[#fecdd3] bg-[#fff1f2] px-1.5 text-[0.65rem] font-black leading-tight text-[#be123c]">{overdueText}</span> : null}
                    </button>
                    <button type="button" className="grid content-center gap-1 text-left font-black text-[#0f172a]" onClick={openQuickView}>
                        <PaymentStatus monto={monto} senia={senia} />
                        <SeniaBadge label={seniaLabel} />
                    </button>
                    <div className={cn('relative flex items-center justify-center pl-2 before:absolute before:bottom-2 before:left-0 before:top-2 before:w-1 before:rounded-full', repairStatusRailFillClass(repair.estado))}>
                        <button
                            type="button"
                            className={cn('inline-flex min-w-[5.8rem] items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[0.64rem] font-black uppercase leading-none', repairStatusBadgeClass(repair.estado), !readOnly && canCycleStatus && 'hover:brightness-95', (readOnly || !canCycleStatus) && 'cursor-default')}
                            onClick={cycleDesktopStatus}
                            disabled={readOnly || !canCycleStatus || form.processing}
                            title={!readOnly && canCycleStatus ? `${displayStatus}. Cambiar a ${compactStatusLabel(nextStatus)}` : displayStatus}
                        >
                            <span className={cn('h-2 w-2 rounded-full', repairStatusDotClass(repair.estado))} aria-hidden="true" />
                            <HighlightText value={compactStatusLabel(displayStatus)} term={highlightTerm} />
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
                                        Garantia
                                    </button>
                                ) : null}
                                {rowIndex === 0 && ticket.newOrderUrl ? (
                                    <Link href={ticket.newOrderUrl} className="rounded-md border border-[#111827] bg-[#111827] px-2 py-1 text-[0.66rem] font-black uppercase text-white no-underline transition hover:bg-[#0b1220]">
                                        Nueva orden
                                    </Link>
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
            <details className="overflow-hidden rounded-md border border-[#cbd5e1] bg-white">
                <summary className={cn('cursor-pointer list-none border-b border-[#e2e8f0] px-2.5 py-2', repairStatusHeaderClass(repair.estado))}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="text-[0.68rem] font-bold text-[#0f172a]">#{repair.id}</span>
                                <span className="text-[0.68rem] font-bold text-[#64748b]">{rowIndex + 1}/{rowTotal}</span>
                                <span className={cn('rounded-full border px-1.5 py-0.5 text-[0.62rem] font-bold', repairStatusSelectClass(repair.estado))}>{displayStatus}</span>
                            </div>
                            <h4 className="truncate text-[0.96rem] font-black leading-tight"><RepairModelLabel repair={repair} term={highlightTerm} /></h4>
                            {hasRepeatedModelInTicket ? (
                                <div className="mt-1">
                                    <span className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-1.5 py-0.5 text-[0.62rem] font-black uppercase text-[#1d4ed8]">
                                        {sameModelLabel}
                                    </span>
                                </div>
                            ) : null}
                            <p className="truncate text-[0.78rem] font-bold opacity-90"><HighlightText value={displayDescription === '-' ? 'SIN DESCRIPCION' : displayDescription} term={highlightTerm} /></p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.72rem] font-black">
                                <span className="text-[#475569]">{formatLegacyDate(repair.fecha_estimada)}</span>
                                {isToday(repair.fecha_estimada) ? <span className="rounded-full border border-[#fde68a] bg-[#fef3c7] px-1.5 py-0.5 text-[#92400e]">Hoy</span> : null}
                                {overdueText ? <span className="rounded-full border border-[#fecdd3] bg-[#fff1f2] px-1.5 py-0.5 text-[#be123c]">{overdueText}</span> : null}
                                <span className="rounded-full border border-[#cbd5e1] bg-white px-2 py-1 text-[0.78rem] font-black text-[#111827]">
                                    Saldo: <PaymentStatus monto={monto} senia={senia} />
                                </span>
                                <SeniaBadge label={seniaLabel} />
                            </div>
                        </div>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#cbd5e1] bg-white text-[#334155]">
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
                        {repair.dni !== 12345678 ? <FieldSummary label="DNI" value={<HighlightText value={repair.dni} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                        {repair.contacto ? <FieldSummary label="Contacto" value={<HighlightText value={repair.contacto} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                        <FieldSummary label="Saldo" value={<PaymentStatus monto={monto} senia={senia} />} strong onClick={openInlineEditor} />
                        <FieldSummary label="F. estimada" value={<><HighlightText value={formatLegacyDate(repair.fecha_estimada)} term={highlightTerm} />{isToday(repair.fecha_estimada) ? <span className="ml-1 rounded-full border border-[#fde68a] bg-[#fef3c7] px-1.5 text-[0.65rem] font-black text-[#92400e]">Hoy</span> : null}{overdueText ? <span className="ml-1 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-1.5 text-[0.65rem] font-black text-[#be123c]">{overdueText}</span> : null}</>} onClick={openInlineEditor} />
                        <FieldSummary
                            label="Estado"
                            value={<HighlightText value={displayStatus} term={highlightTerm} />}
                            labelClassName={repairStatusTextClass(repair.estado)}
                            valueClassName={repairStatusTextClass(repair.estado)}
                            className={repairStatusSelectClass(repair.estado)}
                            onClick={!readOnly && canCycleStatus && !form.processing ? cycleDesktopStatus : undefined}
                        />
                        {repair.estado === 'CANCELADA' && repair.cancelado_motivo ? <FieldSummary label="Motivo" value={<HighlightText value={repair.cancelado_motivo} term={highlightTerm} />} className="col-span-2 border border-slate-200 bg-white" onClick={openInlineEditor} /> : null}
                        {repair.estado === 'GARANTIA' && repair.garantia_motivo ? <FieldSummary label="Garantia" value={<HighlightText value={repair.garantia_motivo} term={highlightTerm} />} className="col-span-2 border border-teal-200 bg-teal-50" onClick={openInlineEditor} /> : null}
                        {readOnly ? <FieldSummary label="Detalle" value={deliveredDetailLabel(repair.fecha_entregado)} /> : null}
                        {seniaLabel ? <FieldSummary label="Seña" value={formatCurrency(senia)} onClick={openInlineEditor} /> : null}
                        {unlockLabel ? <FieldSummary label="Desbloqueo" value={unlockLabel} onClick={openInlineEditor} /> : null}
                        {accessoriesLabel ? <FieldSummary label="Incluye" value={<HighlightText value={accessoriesLabel} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                    </div>
                    {readOnly && repair.actions?.deliver ? (
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={openDeliveryModal}>
                            {archived ? 'Entregar' : 'Cambiar forma de entrega'}
                        </button>
                    ) : null}
                    {readOnly && repair.actions?.moveBack ? (
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={moveBackToConsultas}>
                            Reingresar por garantia
                        </button>
                    ) : null}
                    {readOnly && rowIndex === 0 && ticket.newOrderUrl ? (
                        <Link href={ticket.newOrderUrl} className={buttonClass('primary', 'sm', 'w-full')}>
                            <FaPlus aria-hidden="true" /> Agregar a nueva orden
                        </Link>
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
                                <FieldSummary label="F. ingreso" value={<HighlightText value={formatLegacyDate(repair.fecha)} term={highlightTerm} />} onClick={openInlineEditor} />
                                {repair.descripcion ? <FieldSummary label="Descripcion" value={<HighlightText value={repair.descripcion} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                                {repair.cancelado_motivo ? <FieldSummary label="Motivo cancelacion" value={<HighlightText value={repair.cancelado_motivo} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                                {repair.garantia_motivo ? <FieldSummary label="Motivo garantia" value={<HighlightText value={repair.garantia_motivo} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                                {repair.repuesto ? <FieldSummary label="Repuesto" value={repair.repuesto} onClick={openInlineEditor} /> : null}
                                {accessoriesLabel ? <FieldSummary label="Incluye" value={<HighlightText value={accessoriesLabel} term={highlightTerm} />} onClick={openInlineEditor} /> : null}
                                {unlockLabel ? <FieldSummary label="Desbloqueo" value={unlockLabel} onClick={openInlineEditor} /> : null}
                                {repair.observaciones ? <FieldSummary label="Observaciones" value={repair.observaciones} onClick={openInlineEditor} /> : null}
                            </div>
                        </details>
                    ) : null}
                    {!readOnly && inlineOpen ? <InlineEditor mobile /> : null}
                    {!readOnly && !inlineOpen ? <ActionButtons mobile showGeneralTicketActions={rowIndex === 0} showOrderActions={false} /> : null}
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
    statusLabel,
    highlightTerm,
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
    statusLabel?: (repair: RepairOrderView) => string;
    highlightTerm?: string;
}): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);
    const [addBaseRepair, setAddBaseRepair] = useState<RepairOrderView | null>(null);

    const openAddRepair = (baseRepair?: RepairOrderView): void => {
        setAddBaseRepair(baseRepair ?? repair);
        setAddOpen(true);
    };

    const closeAddRepair = (): void => {
        setAddOpen(false);
        setAddBaseRepair(null);
    };

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
                statusLabel={statusLabel}
                highlightTerm={highlightTerm}
                onAddRepair={openAddRepair}
            />
            {addOpen ? <AddRepairModal ticket={ticket} baseRepair={addBaseRepair} serviceCategories={serviceCategories} serviceTemplates={serviceTemplates} partInventory={partInventory} onClose={closeAddRepair} /> : null}
        </>
    );
}

export function RepairTicketPanel({
    ticket,
    serviceCategories,
    serviceTemplates = [],
    partInventory = [],
    allowAddRepair = false,
    readOnly = false,
    archived = false,
    statusLabel,
    highlightTerm,
}: RepairTicketPanelProps): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);
    const [addBaseRepair, setAddBaseRepair] = useState<RepairOrderView | null>(null);
    const [desktopGroupExpanded, setDesktopGroupExpanded] = useState(false);
    const desktopRepairs = desktopGroupExpanded ? ticket.repairs : ticket.repairs.slice(0, 1);

    const openAddRepair = (baseRepair?: RepairOrderView): void => {
        setAddBaseRepair(baseRepair ?? null);
        setAddOpen(true);
    };

    const closeAddRepair = (): void => {
        setAddOpen(false);
        setAddBaseRepair(null);
    };

    return (
        <section className={cn(ui.repairTicketPanel, 'max-xl:rounded-lg max-xl:border max-xl:border-[#64748b] max-xl:bg-white max-xl:p-2 max-xl:shadow-[0_2px_6px_rgba(15,23,42,0.10)]')}>
            <header className="flex flex-col gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-3 md:flex-row md:items-start md:justify-between max-xl:border-0 max-xl:border-b max-xl:border-[#e2e8f0] max-xl:bg-white max-xl:p-0 max-xl:pb-2">
                <div className="min-w-0 max-xl:grid max-xl:grid-cols-[minmax(0,1fr)] max-xl:gap-2">
                    <div className="max-xl:rounded-lg max-xl:border max-xl:border-[#111827] max-xl:bg-[#111827] max-xl:px-3 max-xl:py-2">
                        <p className="text-[0.78rem] font-semibold text-[#475569] md:text-xs max-xl:text-[0.68rem] max-xl:font-black max-xl:uppercase max-xl:text-[#cbd5e1]">Ticket #{ticket.id}</p>
                        <h3 className="truncate text-[1rem] font-extrabold tracking-tight text-[#0f172a] md:text-2xl max-xl:text-[1.22rem] max-xl:font-black max-xl:uppercase max-xl:leading-tight max-xl:text-white">{ticket.nombre_cliente}</h3>
                    </div>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[0.78rem] font-semibold text-[#475569] md:gap-2 md:text-sm max-xl:gap-1.5 max-xl:text-[0.73rem]">
                        <span>DNI: {ticket.dni}</span>
                        {ticket.contacto ? <span>Contacto: {ticket.contacto}</span> : null}
                        <span>Fecha: {formatLegacyDate(ticket.fecha)}</span>
                        {ticket.repairsCount > 1 ? <span>Reparaciones: {ticket.repairsCount}</span> : null}
                        <span>Total: {ticket.totalMonto > 0 ? formatCurrency(ticket.totalMonto) : 'Cotizar'}</span>
                    </div>
                </div>
                <div className="hidden flex-wrap items-center gap-1.5 md:gap-2 xl:flex">
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
                        <button type="button" className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-[9px] border border-[#7c3aed] bg-[#7c3aed] px-2.5 py-1 text-[0.78rem] font-bold text-white transition hover:bg-[#6d28d9] md:min-h-[34px] md:px-3 md:py-1.5 md:text-sm xl:hidden" onClick={() => openAddRepair()}>
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
                                statusLabel={statusLabel}
                                highlightTerm={highlightTerm}
                                onAddRepair={openAddRepair}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 xl:hidden">
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
                        statusLabel={statusLabel}
                        highlightTerm={highlightTerm}
                        onAddRepair={openAddRepair}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 xl:hidden">
                <Link href={ticket.ticketUrl} className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#111827] bg-[#111827] px-2.5 py-1.5 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#0b1220]">
                    Ticket tecnico
                </Link>
                <a href={ticket.trackingUrl} className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#0d6efd] bg-[#0d6efd] px-2.5 py-1.5 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#0b5ed7]">
                    Seguimiento
                </a>
                {ticket.whatsappUrl ? (
                    <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center justify-center rounded-md border border-[#25D366] bg-[#25D366] px-2.5 py-1.5 text-[0.78rem] font-bold text-white no-underline transition hover:bg-[#128C7E]">
                        WhatsApp cliente
                    </a>
                ) : null}
                {allowAddRepair && !readOnly ? (
                    <button type="button" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#8b5cf6] bg-[#8b5cf6] px-2.5 py-1.5 text-[0.78rem] font-bold text-white transition hover:bg-[#7c3aed]" onClick={() => openAddRepair()}>
                        <FaPlus aria-hidden="true" />Agregar reparacion
                    </button>
                ) : null}
            </div>

            {addOpen ? <AddRepairModal ticket={ticket} baseRepair={addBaseRepair} serviceCategories={serviceCategories} serviceTemplates={serviceTemplates} partInventory={partInventory} onClose={closeAddRepair} /> : null}
        </section>
    );
}
