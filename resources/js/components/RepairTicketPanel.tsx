import { Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import {
    FaCamera,
    FaCheckCircle,
    FaChevronDown,
    FaDollyFlatbed,
    FaEdit,
    FaImage,
    FaImages,
    FaPlus,
    FaReceipt,
    FaSave,
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

export const repairDesktopTableGridClass =
    'grid-cols-[3.4rem_minmax(8rem,0.65fr)_4.8rem_5.8rem_5.4rem_3.7rem_4.4rem_minmax(12rem,0.7fr)_minmax(12rem,0.7fr)_5.8rem_5rem_7.4rem_17.5rem]';

interface RepairTicketPanelProps {
    ticket: RepairTicketView;
    states: string[];
    serviceCategories: ServiceCategoryOption[];
    partInventory?: RepairPartInventoryOption[];
    allowAddRepair?: boolean;
    readOnly?: boolean;
}

interface RepairUpdateFormData {
    id_nuevo: string;
    fecha: string;
    nombre_cliente: string;
    dni: string;
    contacto: string;
    modelo: string;
    descripcion: string;
    observaciones: string;
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
    modelo: string;
    descripcion: string;
    observaciones: string;
    monto: string;
    senia: string;
    fecha_estimada: string;
    repuesto: string;
    repuesto_pedido: boolean;
    categorias_reparacion: string;
    images: File[] | null;
}

type DeliveryVia = 'dni' | 'ticket' | 'persona' | 'otra';

function normalizeStatus(status: string): string {
    return status.toUpperCase();
}

function compactStatus(status: string): string {
    return status === 'EN REPARACION / ESPERA REPUESTO' ? 'EN REPARACION' : status;
}

function repairStatusHeaderClass(status: string): string {
    const normalized = normalizeStatus(status);

    if (normalized === 'LISTA') return 'bg-[linear-gradient(135deg,#34d399_0%,#22c55e_55%,#16a34a_100%)] text-white';
    if (normalized === 'CANCELADA') return 'bg-[linear-gradient(135deg,#fb7185_0%,#ef4444_55%,#dc2626_100%)] text-white';
    if (normalized === 'EN REPARACION' || normalized === 'EN REPARACION / ESPERA REPUESTO') return 'bg-[linear-gradient(135deg,#a78bfa_0%,#8b5cf6_52%,#6d28d9_100%)] text-white';
    if (normalized === 'PENDIENTE') return 'bg-[linear-gradient(135deg,#ffd54a_0%,#fbbf24_55%,#f59e0b_100%)] text-[#111827]';

    return 'bg-[linear-gradient(135deg,#94a3b8_0%,#64748b_55%,#475569_100%)] text-white';
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
            <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.32)]">
                <header
                    className={cn(
                        'flex items-center justify-between gap-3 border-b px-4 py-3',
                        tone === 'primary' && 'border-[#0b5ed7] bg-[#0d6efd] text-white',
                        tone === 'warning' && 'border-[#e0a800] bg-[#ffc107] text-[#111827]',
                        tone === 'default' && 'border-slate-200 bg-[linear-gradient(180deg,#f8fbff,#eef4ff)] text-[#0f172a]',
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
                'grid min-w-0 gap-0.5 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-left shadow-[0_6px_14px_rgba(15,23,42,0.04)]',
                onClick && 'cursor-pointer transition hover:border-[#0d6efd] hover:bg-[#eff6ff]',
            )}
            onClick={onClick}
        >
            <span className="text-[0.72rem] font-bold uppercase tracking-[0.04em] text-slate-500">{label}</span>
            <span className={cn('text-sm text-[#0f172a]', strong && 'font-black')}>{value}</span>
        </Wrapper>
    );
}

function PaymentStatus({ monto, senia }: { monto: number; senia: number }): JSX.Element {
    if (monto > 0 && senia >= monto) {
        return (
            <span className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-[0.68rem] font-black uppercase text-emerald-800 shadow-sm">
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
        <div className={cn('grid gap-3 rounded-xl border border-dashed border-[#7cc7ff] bg-[#f2f9ff] p-3', disabled && 'opacity-60')}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-[#0f172a]">{title}</strong>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{previews.length}/2</span>
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
                                <button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-[#ef4444] text-xs font-black text-white shadow-md" onClick={() => onRemove(index)} aria-label={`Quitar imagen ${index + 1}`}>
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
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{images.length}/2</span>
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
    onClose,
}: {
    ticket: RepairTicketView;
    serviceCategories: ServiceCategoryOption[];
    onClose: () => void;
}): JSX.Element {
    const form = useForm<AddRepairFormData>({
        modelo: '',
        descripcion: '',
        observaciones: '',
        monto: '',
        senia: '',
        fecha_estimada: '',
        repuesto: '',
        repuesto_pedido: false,
        categorias_reparacion: '4',
        images: null,
    });
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const action = ticket.repairs[0] ? route('repairs.orders.add_repair', ticket.repairs[0].registro_id) : '';

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

    return (
        <ModalShell title={`Agregar reparacion al ticket #${ticket.id}`} onClose={onClose}>
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
                <input className={ui.input} placeholder="Modelo" value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} />
                <input className={ui.input} placeholder="Fecha estimada" type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} />
                <textarea className={`${ui.textarea} sm:col-span-2`} placeholder="Descripcion" value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} />
                <textarea className={`${ui.textarea} sm:col-span-2`} placeholder="Observaciones" value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} />
                <input className={ui.input} placeholder="Monto" value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} />
                <input className={ui.input} placeholder="Senia" value={form.data.senia} onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} />
                <input className={ui.input} placeholder="Repuesto" value={form.data.repuesto} onChange={(event) => form.setData('repuesto', event.target.value)} />
                <label className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#f59e0b33] bg-[#fff8ed] px-3 py-2 text-sm font-black text-[#92400e]">
                    <input type="checkbox" checked={form.data.repuesto_pedido} onChange={(event) => form.setData('repuesto_pedido', event.target.checked)} />
                    Mandar a pedidos
                </label>
                <select className={ui.input} value={form.data.categorias_reparacion} onChange={(event) => form.setData('categorias_reparacion', event.target.value)}>
                    {serviceCategories.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                    ))}
                </select>
                <div className="sm:col-span-2">
                    <ImageUploadPicker
                        title="Fotos de ingreso"
                        help="Podés sacar foto o elegir de galería. Se guardan hasta 2 imágenes iniciales."
                        previews={imagePreviews}
                        onSelect={selectImages}
                        onRemove={removeImage}
                    />
                </div>
                <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
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
}): JSX.Element {
    const form = useForm<RepairUpdateFormData>({
        id_nuevo: String(repair.id),
        fecha: repair.fecha ?? '',
        nombre_cliente: repair.nombre_cliente,
        dni: String(repair.dni ?? ''),
        contacto: repair.contacto ?? '',
        modelo: repair.modelo ?? '',
        descripcion: repair.descripcion ?? '',
        observaciones: repair.observaciones ?? '',
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
    const [editOpen, setEditOpen] = useState(false);
    const [inlineOpen, setInlineOpen] = useState(false);
    const [deliveryOpen, setDeliveryOpen] = useState(false);
    const [deliveryVia, setDeliveryVia] = useState<DeliveryVia>('dni');
    const [deliveryDetail, setDeliveryDetail] = useState('');
    const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [finalImagePreviews, setFinalImagePreviews] = useState<string[]>([]);
    const [partSearch, setPartSearch] = useState(repair.repuesto ?? '');
    const monto = Number(repair.monto ?? 0);
    const senia = Number(repair.senia ?? 0);
    const galleryImages = [...repair.imagenes, ...repair.imagenes_finales];
    const firstImage = galleryImages[0];
    const canMarkReady = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO'].includes(repair.estado);
    const canDeliver = repair.estado === 'LISTA' && repair.entregado !== 'si';
    const canCancel = repair.estado !== 'CANCELADA' && repair.entregado !== 'si';
    const canCycleStatus = ['PENDIENTE', 'EN REPARACION', 'EN REPARACION / ESPERA REPUESTO', 'LISTA'].includes(repair.estado);
    const nextStatus = nextQuickStatus(repair.estado);
    const showMore = Boolean(repair.descripcion || repair.repuesto || repair.observaciones || repair.contacto || repair.dni);
    const isGroupedDesktopRow = variant === 'desktop' && rowTotal > 1;
    const isFirstGroupedDesktopRow = isGroupedDesktopRow && rowIndex === 0;
    const isLastGroupedDesktopRow = isGroupedDesktopRow && rowIndex === rowTotal - 1;
    const showDesktopTicketData = variant !== 'desktop' || rowIndex === 0;
    const overdueText = overdueLabel(repair);
    const currentInventoryLabel = repair.inventory_part_box && repair.inventory_part_model
        ? `${repair.inventory_part_model} - caja ${repair.inventory_part_box.toUpperCase()}`
        : '';
    const partMatches = partSearch.trim().length >= 2
        ? partInventory
            .filter((part) => part.quantity > 0 && part.model.toLowerCase().includes(partSearch.trim().toLowerCase()))
            .slice(0, 8)
        : [];

    const appendObservation = (current: string, addition: string): string => {
        const trimmed = current.trim();

        if (trimmed === '' || ['sin observaciones', 'sin observacion'].includes(trimmed.toLowerCase())) {
            return addition;
        }

        if (trimmed.toLowerCase().includes(addition.toLowerCase())) {
            return current;
        }

        return `${trimmed}\n${addition}`;
    };

    const selectInventoryPart = (part: RepairPartInventoryOption): void => {
        form.setData((current) => ({
            ...current,
            repuesto: part.model,
            repuesto_pedido: false,
            inventory_part_id: String(part.id),
            observaciones: appendObservation(current.observaciones, `Repuesto en caja ${part.box.toUpperCase()}`),
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

    const cycleDesktopStatus = (): void => {
        if (readOnly || !canCycleStatus || !repair.actions?.update || form.processing) return;

        router.post(
            repair.actions.update,
            {
                ...form.data,
                estado: nextStatus,
                images: null,
                final_images: null,
            },
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

    const deliverRepair = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        if (!repair.actions?.deliver) return;

        router.post(
            repair.actions.deliver,
            {
                fecha_entregado: form.data.fecha_entregado || undefined,
                entrega_via: deliveryVia,
                entrega_detalle: deliveryVia === 'otra' ? deliveryDetail : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeliveryOpen(false);
                    setDeliveryDetail('');
                    setDeliveryVia('dni');
                },
            },
        );
    };

    const InlineEditor = ({ mobile = false }: { mobile?: boolean }): JSX.Element => (
        <form
            className={cn(
                'grid gap-2 rounded-[16px] border border-[#bfdbfe] bg-[linear-gradient(180deg,#eff6ff,#f8fbff)] p-3 shadow-inner',
                mobile ? 'grid-cols-2' : 'grid-cols-[76px_minmax(170px,1fr)_96px_128px_136px_minmax(180px,1.2fr)_138px_112px_142px]',
            )}
            onSubmit={submitEdit}
        >
            <input className={ui.repairDenseInput} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} />
            <input className={ui.repairDenseInput} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} placeholder="Cliente" />
            <input className={ui.repairDenseInput} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} placeholder="DNI" />
            <input className={ui.repairDenseInput} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} placeholder="Contacto" />
            <input className={ui.repairDenseInput} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} />
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
                    {galleryImages.length > 1 ? <span className="absolute right-1 top-1 rounded-full bg-slate-950/75 px-1.5 py-0.5 text-[0.68rem] font-bold text-white">+{galleryImages.length - 1}</span> : null}
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
            : 'grid h-8 w-8 place-items-center rounded-lg text-[0.78rem] no-underline shadow-sm transition hover:-translate-y-0.5';

        return (
            <div className={cn(mobile ? 'flex flex-wrap justify-end gap-1.5' : 'flex items-center justify-end gap-1')}>
                {canMarkReady ? (
                    <button type="button" className={cn(base, 'border border-[#198754] bg-[#198754] text-white')} onClick={markReady} title="Listo">
                        <FaCheckCircle aria-hidden="true" />{iconOnly ? null : 'Listo'}
                    </button>
                ) : null}
                <button type="button" className={cn(base, 'border border-[#0d6efd] bg-[#0d6efd] text-white')} onClick={() => setEditOpen(true)} title="Editar">
                    <FaEdit aria-hidden="true" />{iconOnly ? null : 'Editar'}
                </button>
                {showGeneralTicketActions ? (
                    <>
                        <button type="button" className={cn(base, 'border border-[#8b5cf6] bg-[#8b5cf6] text-white')} onClick={onAddRepair} title="Agregar reparacion">
                            <FaPlus aria-hidden="true" />{iconOnly ? null : 'Agregar reparacion'}
                        </button>
                        <Link href={ticket.ticketUrl} className={cn(base, 'border border-[#111827] bg-[#111827] text-white')} title="Ticket">
                            <FaReceipt aria-hidden="true" />{iconOnly ? null : 'Ticket'}
                        </Link>
                    </>
                ) : null}
                {canDeliver ? (
                    <button type="button" className={cn(base, 'border border-[#ffc107] bg-[#ffc107] text-[#111827]')} onClick={openDeliveryModal} title="Entregar">
                        <FaDollyFlatbed aria-hidden="true" />{iconOnly ? null : 'Entregar'}
                    </button>
                ) : null}
                {canCancel ? (
                    <button type="button" className={cn(base, 'border border-[#f59e0b] bg-[#f59e0b] text-white')} onClick={cancelRepair} title="Cancelar">
                        <FaTimes aria-hidden="true" />{iconOnly ? null : 'Cancelar'}
                    </button>
                ) : null}
                {showGeneralTicketActions ? (
                    ticket.whatsappUrl ? (
                        <a href={ticket.whatsappUrl} target="_blank" rel="noreferrer" className={cn(base, 'border border-[#25D366] bg-[#25D366] text-white')} title="WhatsApp">
                            <FaWhatsapp aria-hidden="true" />{iconOnly ? null : 'WhatsApp'}
                        </a>
                    ) : (
                        <span className={cn(base, 'cursor-not-allowed border border-slate-300 bg-slate-200 text-slate-500')} title="Sin WhatsApp">
                            <FaWhatsapp aria-hidden="true" />{iconOnly ? null : 'WhatsApp'}
                        </span>
                    )
                ) : null}
                <button type="button" className={cn(base, 'border border-[#dc3545] bg-[#dc3545] text-white')} onClick={deleteRepair} title="Eliminar">
                    <FaTrashAlt aria-hidden="true" />{iconOnly ? null : 'Eliminar'}
                </button>
            </div>
        );
    };

    const modals = (
        <>
            {editOpen ? (
                <ModalShell title={`Edición rápida de orden #${repair.id}`} onClose={() => setEditOpen(false)} tone="primary">
                    <form className="grid gap-4" onSubmit={submitEdit}>
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                            <EditSection title="Datos Editables">
                                <EditField label="ID de la orden" note="Si lo cambias, se renumeran todos los trabajos de esta orden.">
                                    <input className={ui.repairDenseInput} type="number" min="1" value={form.data.id_nuevo} onChange={(event) => form.setData('id_nuevo', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <EditField label="Cliente">
                                    <input className={ui.repairDenseInput} value={form.data.nombre_cliente} onChange={(event) => form.setData('nombre_cliente', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="DNI">
                                        <input className={ui.repairDenseInput} value={form.data.dni} onChange={(event) => form.setData('dni', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Contacto">
                                        <input className={ui.repairDenseInput} value={form.data.contacto} onChange={(event) => form.setData('contacto', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <EditField label="Modelo">
                                    <input className={ui.repairDenseInput} value={form.data.modelo} onChange={(event) => form.setData('modelo', event.target.value)} disabled={readOnly} />
                                </EditField>
                                <EditField label="Categoria">
                                    <select className={ui.repairDenseInput} value={form.data.categorias_reparacion} onChange={(event) => form.setData('categorias_reparacion', event.target.value)} disabled={readOnly}>
                                        {serviceCategories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}
                                    </select>
                                </EditField>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="Monto ($)">
                                        <input className={ui.repairDenseInput} value={form.data.monto} onFocus={() => clearAmountForTyping('monto')} onChange={(event) => form.setData('monto', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Senia ($)">
                                        <input className={ui.repairDenseInput} value={form.data.senia} onFocus={() => clearAmountForTyping('senia')} onChange={(event) => form.setData('senia', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <EditField label="Fecha de ingreso">
                                        <input className={ui.repairDenseInput} type="date" value={form.data.fecha} onChange={(event) => form.setData('fecha', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                    <EditField label="Fecha estimada">
                                        <input className={ui.repairDenseInput} type="date" value={form.data.fecha_estimada} onChange={(event) => form.setData('fecha_estimada', event.target.value)} disabled={readOnly} />
                                    </EditField>
                                </div>
                                <EditField label="Estado">
                                    <select className={cn(ui.repairDenseInput, 'font-extrabold', repairStatusSelectClass(form.data.estado))} value={form.data.estado} onChange={(event) => form.setData('estado', event.target.value)} disabled={readOnly}>
                                        {(repair.availableStates ?? []).map((state) => <option key={state} value={state}>{state}</option>)}
                                    </select>
                                </EditField>
                            </EditSection>

                            <EditSection title="Descripción y Contexto">
                                <EditField label="Descripción">
                                    <textarea className={ui.repairDenseTextarea} value={form.data.descripcion} onChange={(event) => form.setData('descripcion', event.target.value)} rows={3} disabled={readOnly} />
                                </EditField>
                                <EditField label="Observaciones del Técnico">
                                    <textarea className={ui.repairDenseTextarea} value={form.data.observaciones} onChange={(event) => form.setData('observaciones', event.target.value)} rows={3} disabled={readOnly} />
                                </EditField>
                                <EditField label="Repuesto a usar / pedir">
                                    <div className="grid gap-2">
                                        {currentInventoryLabel !== '' ? (
                                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-sm font-bold text-[#166534]">
                                                <span>Asignado: {currentInventoryLabel}</span>
                                                {!readOnly ? (
                                                    <button type="button" className="text-xs font-black uppercase tracking-[0.05em] underline-offset-2 hover:underline" onClick={returnCurrentInventoryPart}>
                                                        Devolver a caja
                                                    </button>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        <input
                                            className={ui.repairDenseInput}
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
                                        <textarea className={ui.repairDenseTextarea} value={form.data.repuesto} onChange={(event) => form.setData((current) => ({ ...current, repuesto: event.target.value, inventory_part_id: '' }))} rows={2} disabled={readOnly} />
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
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setDeliveryOpen(false)}>Cancelar</button>
                            <button type="submit" className={buttonClass('primary', 'sm')}>Confirmar entrega</button>
                        </div>
                    </form>
                </ModalShell>
            ) : null}
            {galleryIndex !== null && galleryImages[galleryIndex] ? (
                <ModalShell title={`Orden #${repair.id} - Trabajo ${repair.reparacion} - ${repair.modelo || ''}`} onClose={() => setGalleryIndex(null)}>
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
                <div className={cn('grid min-h-[58px] w-full min-w-[1320px] items-stretch divide-x divide-slate-200 border-b border-slate-200 bg-white text-[0.74rem] leading-tight transition hover:bg-[#f8fbff] [&>*]:min-w-0 [&>*]:px-2 [&>*]:py-2', repairDesktopTableGridClass, isGroupedDesktopRow && 'border-x-2 border-x-[#bfdbfe]', isFirstGroupedDesktopRow && 'border-t-2 border-t-[#bfdbfe]', isLastGroupedDesktopRow && 'border-b-2 border-b-[#bfdbfe]', isGroupedDesktopRow && !isFirstGroupedDesktopRow && 'bg-[#f8fbff]', isOverdue(repair) && 'bg-rose-50', isToday(repair.fecha_estimada) && 'bg-amber-50')}>
                    <div className="grid content-center gap-1 text-center">
                        {showDesktopTicketData ? <strong className="text-base leading-none text-[#0f172a]">#{repair.id}</strong> : <span className="text-slate-300">—</span>}
                    </div>
                    <button type="button" className="flex items-center text-left font-black uppercase text-[#0f172a]" onClick={openInlineEditor} title={repair.nombre_cliente}>{showDesktopTicketData ? repair.nombre_cliente : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor}>{showDesktopTicketData ? (repair.dni === 12345678 ? 'SIN DNI' : repair.dni) : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor} title={repair.contacto || '-'}>{showDesktopTicketData ? (repair.contacto || '-') : ''}</button>
                    <button type="button" className="flex items-center whitespace-nowrap text-left font-semibold text-[#334155]" onClick={openInlineEditor}>{showDesktopTicketData ? formatLegacyDate(repair.fecha) : ''}</button>
                    <div className="flex items-center justify-center"><span className="rounded-full bg-[#eef2ff] px-2 py-1 text-xs font-black text-[#1d4ed8]">{rowTotal > 1 ? `${rowIndex + 1}/${rowTotal}` : `#${repair.reparacion}`}</span></div>
                    <div className="flex items-center justify-center"><Thumb large /></div>
                    <button type="button" className="flex items-center text-left font-bold text-[#0f172a]" onClick={openInlineEditor} title={repair.modelo || '-'}>{repair.modelo || '-'}</button>
                    <button type="button" className="flex items-center text-left font-semibold text-[#334155]" onClick={openInlineEditor} title={repair.descripcion || '-'}>
                        <span className="line-clamp-2">{repair.descripcion || '-'}</span>
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
                            className={cn('rounded-full px-2.5 py-1 text-[0.68rem] font-black uppercase shadow-sm transition', repairStatusBadgeClass(repair.estado), !readOnly && canCycleStatus && 'hover:-translate-y-0.5 hover:shadow-md', (readOnly || !canCycleStatus) && 'cursor-default')}
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
                                        Cambiar
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
            <details className="overflow-hidden rounded-[14px] border border-white/80 bg-white/95 shadow-[0_8px_22px_rgba(15,23,42,0.09)]">
                <summary className={cn('cursor-pointer list-none px-2.5 py-2', repairStatusHeaderClass(repair.estado))}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-1.5">
                                <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[0.66rem] font-black text-[#0f172a]">#{repair.id}</span>
                                <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[0.66rem] font-black text-[#1d4ed8]">{rowIndex + 1}/{rowTotal}</span>
                                <span className="rounded-full bg-white/90 px-1.5 py-0.5 text-[0.62rem] font-black uppercase text-[#0f172a]">{compactStatus(repair.estado)}</span>
                            </div>
                            <h4 className="truncate text-[0.92rem] font-black uppercase leading-tight">{repair.nombre_cliente}</h4>
                            <p className="truncate text-[0.78rem] font-bold opacity-90">{repair.modelo ? `${repair.modelo} - ` : ''}{repair.descripcion || 'Sin descripcion'}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.72rem] font-black">
                                <span className="rounded-full bg-white/85 px-1.5 py-0.5 text-[#0f172a]">{formatLegacyDate(repair.fecha_estimada)}</span>
                                {isToday(repair.fecha_estimada) ? <span className="rounded-full bg-[#ffc107] px-1.5 py-0.5 text-[#111827]">Hoy</span> : null}
                                {overdueText ? <span className="rounded-full bg-[#dc3545] px-1.5 py-0.5 text-white">{overdueText}</span> : null}
                                <PaymentStatus monto={monto} senia={senia} />
                            </div>
                        </div>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/25 ring-1 ring-white/35">
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
                        <FieldSummary label="ID orden" value={`#${repair.id}`} strong onClick={openInlineEditor} />
                        <FieldSummary label="Cliente" value={repair.nombre_cliente} strong onClick={openInlineEditor} />
                        {repair.dni !== 12345678 ? <FieldSummary label="DNI" value={repair.dni} onClick={openInlineEditor} /> : null}
                        {repair.contacto ? <FieldSummary label="Contacto" value={repair.contacto} onClick={openInlineEditor} /> : null}
                        {repair.modelo ? <FieldSummary label="Modelo" value={repair.modelo} strong onClick={openInlineEditor} /> : null}
                        <FieldSummary label="Saldo" value={<PaymentStatus monto={monto} senia={senia} />} strong onClick={openInlineEditor} />
                        <FieldSummary label="F. estimada" value={<>{formatLegacyDate(repair.fecha_estimada)}{isToday(repair.fecha_estimada) ? <span className="ml-1 rounded bg-[#ffc107] px-1 text-[0.65rem] font-black text-[#111827]">Hoy</span> : null}{overdueText ? <span className="ml-1 rounded bg-[#dc3545] px-1 text-[0.65rem] font-black text-white">{overdueText}</span> : null}</>} onClick={openInlineEditor} />
                        <FieldSummary label="Estado" value={compactStatus(repair.estado)} onClick={openInlineEditor} />
                        {readOnly ? <FieldSummary label="Detalle" value={deliveredDetailLabel(repair.fecha_entregado)} /> : null}
                        {senia > 0 ? <FieldSummary label="Senia" value={formatCurrency(senia)} onClick={openInlineEditor} /> : null}
                    </div>
                    {readOnly && repair.actions?.deliver ? (
                        <button type="button" className={buttonClass('soft', 'sm', 'w-full')} onClick={openDeliveryModal}>
                            Cambiar forma de entrega
                        </button>
                    ) : null}
                    {showMore ? (
                        <details className="rounded-xl border border-slate-200 bg-slate-50">
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
                    {!readOnly && !inlineOpen ? <ActionButtons mobile /> : null}
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
    partInventory = [],
    readOnly = false,
    rowIndex = 0,
    rowTotal = ticket.repairs.length,
}: {
    ticket: RepairTicketView;
    repair: RepairOrderView;
    serviceCategories: ServiceCategoryOption[];
    partInventory?: RepairPartInventoryOption[];
    readOnly?: boolean;
    rowIndex?: number;
    rowTotal?: number;
}): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);

    return (
        <>
            <RepairEditCard repair={repair} serviceCategories={serviceCategories} partInventory={partInventory} readOnly={readOnly} ticket={ticket} variant="desktop" rowIndex={rowIndex} rowTotal={rowTotal} onAddRepair={() => setAddOpen(true)} />
            {addOpen ? <AddRepairModal ticket={ticket} serviceCategories={serviceCategories} onClose={() => setAddOpen(false)} /> : null}
        </>
    );
}

export function RepairTicketPanel({
    ticket,
    states,
    serviceCategories,
    partInventory = [],
    allowAddRepair = false,
    readOnly = false,
}: RepairTicketPanelProps): JSX.Element {
    const [addOpen, setAddOpen] = useState(false);

    return (
        <section className={ui.repairTicketPanel}>
            <header className="flex flex-col gap-2 rounded-[16px] border border-[#dbeafe] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(241,247,255,0.95))] px-3 py-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-[#1d4ed8] md:text-xs">Ticket #{ticket.id}</p>
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
                </div>
            </header>

            <div className="hidden overflow-x-auto rounded-[16px] border border-[#dbe4f0] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)] xl:block">
                <div className="w-full min-w-[1680px]">
                    <div className="grid grid-cols-[76px_minmax(190px,1.15fr)_96px_128px_106px_78px_86px_minmax(170px,1fr)_122px_112px_142px_216px] items-center gap-2 bg-[linear-gradient(180deg,#1774f5,#0d56c8)] px-3 py-3 text-[0.7rem] font-extrabold uppercase tracking-[0.035em] text-white">
                        <span className="text-center">ID</span>
                        <span>Cliente</span>
                        <span>DNI</span>
                        <span>Contacto</span>
                        <span>Ingreso</span>
                        <span className="text-center">Trabajo</span>
                        <span className="text-center">Imagen</span>
                        <span>Modelo</span>
                        <span>Estimada</span>
                        <span>Saldo</span>
                        <span className="text-center">Estado</span>
                        <span className="text-center">Acciones</span>
                    </div>
                    <div className="grid bg-white">
                        {ticket.repairs.map((repair) => (
                            <RepairEditCard
                                key={`desktop-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                                repair={repair}
                                serviceCategories={serviceCategories}
                                partInventory={partInventory}
                                readOnly={readOnly}
                                ticket={ticket}
                                variant="desktop"
                                onAddRepair={() => setAddOpen(true)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-3 xl:hidden">
                {ticket.repairs.map((repair) => (
                    <RepairEditCard
                        key={`mobile-${repair.id}-${repair.reparacion}-${repair.registro_id}`}
                        repair={repair}
                        serviceCategories={serviceCategories}
                        partInventory={partInventory}
                        readOnly={readOnly}
                        ticket={ticket}
                        variant="mobile"
                        onAddRepair={() => setAddOpen(true)}
                    />
                ))}
            </div>

            {allowAddRepair && !readOnly ? (
                <button type="button" className="rounded-[16px] border border-sky-100 bg-white px-4 py-3 text-left text-sm font-black uppercase tracking-[0.16em] text-[#4f6fae] shadow-sm" onClick={() => setAddOpen(true)}>
                    <FaPlus className="mr-1 inline" aria-hidden="true" />Agregar reparacion al ticket #{ticket.id}
                </button>
            ) : null}

            {addOpen ? <AddRepairModal ticket={ticket} serviceCategories={serviceCategories} onClose={() => setAddOpen(false)} /> : null}
            <span className="hidden">{states.length}</span>
        </section>
    );
}
