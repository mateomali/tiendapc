import { Link, router, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent, ReactNode } from 'react';
import { FaCopy, FaEdit, FaSave, FaSearch, FaTrash, FaUndo } from 'react-icons/fa';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, inlineFeedbackClass, stateChipClass, ui } from '../../ui';
import { cn, formatCurrency } from '../../utils';

interface ProductWarning {
    code: string;
    label: string;
}

interface ProductRow {
    id: number;
    category_id: number | null;
    name: string;
    slug: string;
    sku?: string | null;
    short_description?: string | null;
    description?: string | null;
    price: number;
    effective_price: number;
    offer_price?: number | null;
    offer_start_at?: string | null;
    offer_end_at?: string | null;
    stock?: number | null;
    stock_status?: string | null;
    image_url?: string | null;
    image_url_2?: string | null;
    image_url_3?: string | null;
    is_featured: boolean;
    is_active: boolean;
    offer_is_active: boolean;
    deleted_at?: string | null;
    category?: { id: number; name: string } | null;
    validation: ProductWarning[];
}

interface CategoryOption {
    id: number;
    name: string;
    group_key: string;
    product_count: number;
}

interface ProductsPageProps {
    filters: {
        q?: string;
        category_id?: number;
        estado?: string;
        include_deleted?: boolean;
        missing?: string;
        quick?: string;
        issue?: string;
        sort?: string;
        order?: string;
    };
    products: ProductRow[];
    categories: CategoryOption[];
    validationSummary: Record<string, number>;
    stats: {
        total: number;
        active: number;
        offers: number;
        featured: number;
        trashed: number;
    };
    config: {
        autosaveDefault: boolean;
    };
}

interface BulkFormData {
    ids: number[];
    action: string;
    category_id: string;
    offer_percent: string;
}

interface QuickCreateFormData {
    category_id: string;
    name: string;
    sku: string;
    short_description: string;
    description: string;
    price: string;
    offer_price: string;
    stock: string;
    stock_status: string;
    image_url: string;
    image_url_2: string;
    image_url_3: string;
    is_featured: boolean;
    is_active: boolean;
}

interface InlineProductState {
    category_id: string;
    name: string;
    sku: string;
    price: string;
    offer_price: string;
    is_active: boolean;
    is_featured: boolean;
}

const summaryLabels: Record<string, string> = {
    missing_image: 'Sin imagen',
    missing_sku: 'Sin SKU',
    missing_category: 'Sin categoria',
    invalid_price: 'Precio invalido',
    invalid_offer: 'Oferta invalida',
};

const quickFilterLabels: Record<string, string> = {
    active: 'Activos',
    offers: 'Con oferta',
    featured: 'Destacados',
    trashed: 'Papelera',
};

type DensityMode = 'compact' | 'comfortable';

interface SavedProductFilters {
    search?: string;
    categoryId?: string;
    estado?: string;
    includeDeleted?: boolean;
    missing?: string;
    quick?: string;
    issue?: string;
    sort?: string;
    order?: string;
}

function readSavedProductFilters(): SavedProductFilters | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem('adminProductsFilters');
        return raw ? (JSON.parse(raw) as SavedProductFilters) : null;
    } catch {
        return null;
    }
}

const productGridIconButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-white text-brand-700 shadow-[0_6px_12px_rgba(18,58,132,0.08)] transition hover:-translate-y-px hover:border-brand-500/45 hover:bg-brand-50';
const productGridDangerIconButton =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 shadow-[0_6px_12px_rgba(190,24,93,0.08)] transition hover:-translate-y-px hover:bg-rose-100';

function CompactPanel({
    title,
    eyebrow,
    open,
    onToggle,
    children,
}: {
    title: string;
    eyebrow: string;
    open: boolean;
    onToggle: () => void;
    children: ReactNode;
}): JSX.Element {
    return (
        <section className={`${ui.sectionCardTight} !p-0`}>
            <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-[0.75rem] px-3 py-2 text-left transition hover:bg-brand-50/60"
                onClick={onToggle}
            >
                <span className="min-w-0">
                    <span className="block text-[0.62rem] font-black uppercase tracking-[0.18em] text-brand-700/70">{eyebrow}</span>
                    <span className="block truncate text-base font-black text-ink-950">{title}</span>
                </span>
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-sky-100 bg-white text-lg font-black text-brand-700">
                    {open ? '-' : '+'}
                </span>
            </button>
            {open ? <div className="border-t border-sky-100 p-3">{children}</div> : null}
        </section>
    );
}

function ProductInlineRow({
    product,
    categories,
    isSelected,
    onToggleSelection,
    density,
    onFilter,
    onPendingChange,
    onRegisterSave,
}: {
    product: ProductRow;
    categories: CategoryOption[];
    isSelected: boolean;
    onToggleSelection: () => void;
    density: DensityMode;
    onFilter: (next: { quick?: string; issue?: string; missing?: string; estado?: string; includeDeleted?: boolean }) => void;
    onPendingChange: (productId: number, isPending: boolean) => void;
    onRegisterSave: (productId: number, save: (() => Promise<void>) | null) => void;
}): JSX.Element {
    const initialForm = useMemo<InlineProductState>(() => ({
        category_id: product.category_id ? String(product.category_id) : '',
        name: product.name,
        sku: product.sku ?? '',
        price: String(product.price ?? 0),
        offer_price: product.offer_price ? String(product.offer_price) : '',
        is_active: product.is_active,
        is_featured: product.is_featured,
    }), [product]);
    const [form, setForm] = useState<InlineProductState>(initialForm);
    const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'success' | 'error'>('idle');
    const [feedback, setFeedback] = useState('');
    const skuInputRef = useRef<HTMLInputElement>(null);
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

    useEffect(() => {
        onPendingChange(product.id, isDirty);

        return () => onPendingChange(product.id, false);
    }, [isDirty, onPendingChange, product.id]);

    const handleInlineKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void saveInline();
        }

        if (event.key === 'Escape' && isDirty) {
            event.preventDefault();
            resetInline();
        }
    };

    const markDirty = (): void => {
        if (status !== 'saving') {
            setStatus('dirty');
            setFeedback('Cambios pendientes');
        }
    };

    const resetInline = (): void => {
        setForm(initialForm);
        setStatus('idle');
        setFeedback('');
    };

    const payload = {
        category_id: Number(form.category_id || product.category_id || 0),
        name: form.name,
        slug: product.slug,
        permalink: '',
        sku: form.sku,
        short_description: product.short_description ?? '',
        description: product.description ?? '',
        price: Number(form.price || 0),
        offer_price: form.offer_price === '' ? '' : Number(form.offer_price),
        offer_start_at: product.offer_start_at ?? '',
        offer_end_at: product.offer_end_at ?? '',
        stock: product.stock ?? 0,
        stock_status: product.stock_status ?? 'instock',
        image_url: product.image_url ?? '',
        image_url_2: product.image_url_2 ?? '',
        image_url_3: product.image_url_3 ?? '',
        is_featured: form.is_featured ? 1 : 0,
        is_active: form.is_active ? 1 : 0,
    };

    const saveInline = async (): Promise<void> => {
        if (!isDirty) {
            return;
        }

        setStatus('saving');
        setFeedback('Guardando...');

        const response = await window.fetch(route('admin.products.quick_update', product.id), {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                Accept: 'application/json',
            },
            body: (() => {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, String(value));
                });
                return formData;
            })(),
        });

        if (!response.ok) {
            setStatus('error');
            setFeedback('No se pudo guardar');
            return;
        }

        const data = (await response.json()) as { ok?: boolean; message?: string };

        if (!data.ok) {
            setStatus('error');
            setFeedback(data.message ?? 'No se pudo guardar');
            return;
        }

        setStatus('success');
        setFeedback(data.message ?? 'Producto guardado');
        router.reload({ only: ['products', 'validationSummary', 'stats'] });
    };

    useEffect(() => {
        onRegisterSave(product.id, saveInline);

        return () => onRegisterSave(product.id, null);
    }, [form, initialForm, onRegisterSave, product.id, status]);

    return (
        <tr
            data-admin-product-row
            className={cn(
                'align-top',
                isSelected && ui.tableRowSelected,
                isDirty && ui.tableRowDirty,
                density === 'comfortable' && 'text-[0.95rem]',
            )}
        >
            <td className={`${ui.tableCell} w-[30px] !px-0.5 !py-2 text-center`} data-label="Seleccion">
                <input type="checkbox" checked={isSelected} onChange={onToggleSelection} />
            </td>
            <td className={`${ui.tableCell} w-[58px] !px-1 !py-2 text-xs font-black`} data-label="ID">
                <span className="block">#{product.id}</span>
                {form.is_active ? (
                    <button type="button" className="mt-1 inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.54rem] font-black uppercase tracking-[0.04em] text-emerald-800" onClick={() => onFilter({ quick: 'active', estado: '1' })}>Activo</button>
                ) : (
                    <button type="button" className="mt-1 inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.54rem] font-black uppercase tracking-[0.04em] text-slate-700" onClick={() => onFilter({ estado: '0' })}>Inactivo</button>
                )}
                {form.is_featured ? (
                    <button type="button" className="mt-1 inline-flex rounded-full bg-cyan-100 px-1.5 py-0.5 text-[0.54rem] font-black uppercase tracking-[0.04em] text-cyan-800" onClick={() => onFilter({ quick: 'featured' })}>Dest.</button>
                ) : null}
                {(product.offer_is_active || form.offer_price !== '') ? (
                    <button type="button" className="mt-1 inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[0.54rem] font-black uppercase tracking-[0.04em] text-amber-800" onClick={() => onFilter({ quick: 'offers' })}>Oferta</button>
                ) : null}
            </td>
            <td className={`${ui.tableCell} w-[72px] !px-1.5 !py-2`} data-label="Imagen">
                <div className="flex h-14 w-16 items-center justify-center overflow-hidden rounded-lg border border-sky-100 bg-sky-50 text-center text-[0.58rem] font-bold text-ink-700">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" /> : <span>Sin foto</span>}
                </div>
            </td>
            <td className={`${ui.tableCell} min-w-[330px] !px-2 !py-2`} data-label="Producto">
                <input
                    className={`${ui.input} min-h-9 rounded-lg px-2 py-1 text-xs font-bold`}
                    aria-label="Nombre"
                    value={form.name}
                    onChange={(event) => {
                        setForm((current) => ({ ...current, name: event.target.value }));
                        markDirty();
                    }}
                    onKeyDown={handleInlineKeyDown}
                />
                <div className="mt-1 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1">
                    <input
                        ref={skuInputRef}
                        className={`${ui.input} min-h-8 rounded-lg px-2 py-1 text-xs`}
                        aria-label="SKU"
                        placeholder="Sin SKU - tocar para cargar"
                        value={form.sku}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, sku: event.target.value }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                    {(product.validation ?? []).length > 0 ? (
                        <div className="flex max-w-[150px] flex-wrap justify-end gap-1">
                            {(product.validation ?? []).slice(0, 2).map((warning) => (
                                <button
                                    key={`${product.id}-${warning.code}`}
                                    type="button"
                                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.08em] text-amber-800"
                                    onClick={() => {
                                        if (warning.code === 'missing_sku') {
                                            skuInputRef.current?.focus();
                                            return;
                                        }
                                        onFilter({ issue: warning.code, missing: warning.code === 'missing_image' ? 'images' : warning.code === 'missing_sku' ? 'sku' : '' });
                                    }}
                                >
                                    {warning.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                    {product.deleted_at ? <button type="button" className={stateChipClass('trash')} onClick={() => onFilter({ quick: 'trashed', includeDeleted: true })}>Papelera</button> : null}
                </div>
            </td>
            <td className={`${ui.tableCell} min-w-[190px] !px-2 !py-2`} data-label="Categoria">
                <select
                    className={`${ui.input} min-h-9 rounded-lg px-2 py-1 text-xs`}
                    aria-label="Categoria"
                    value={form.category_id}
                    onChange={(event) => {
                        setForm((current) => ({ ...current, category_id: event.target.value }));
                        markDirty();
                    }}
                    onKeyDown={handleInlineKeyDown}
                >
                    <option value="">Sin categoria</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </td>
            <td className={`${ui.tableCell} w-[88px] !px-1.5 !py-2`} data-label="Precio">
                <input
                    className={`${ui.input} min-h-9 rounded-lg px-2 py-1 text-xs`}
                    aria-label="Precio"
                    data-quick-field="price"
                    value={form.price}
                    onChange={(event) => {
                        setForm((current) => ({ ...current, price: event.target.value }));
                        markDirty();
                    }}
                    onKeyDown={handleInlineKeyDown}
                />
                <span className="mt-1 block text-[0.62rem] font-semibold text-ink-700/80">Ef.: {formatCurrency(Number(form.offer_price || form.price || 0))}</span>
            </td>
            <td className={`${ui.tableCell} w-[88px] !px-1.5 !py-2`} data-label="Oferta">
                <input
                    className={`${ui.input} min-h-9 rounded-lg px-2 py-1 text-xs`}
                    aria-label="Oferta"
                    data-quick-field="offer_price"
                    value={form.offer_price}
                    onChange={(event) => {
                        setForm((current) => ({ ...current, offer_price: event.target.value }));
                        markDirty();
                    }}
                    onKeyDown={handleInlineKeyDown}
                    placeholder="Sin oferta"
                />
                <span
                    className={cn(
                        'mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.04em]',
                        product.offer_is_active ? 'bg-amber-200 text-amber-950 ring-1 ring-amber-300' : 'bg-slate-100 text-ink-700/80',
                    )}
                >
                    {product.offer_is_active ? 'Oferta' : 'Sin oferta'}
                </span>
            </td>
            <td className={`${ui.tableCell} min-w-[120px] !px-2 !py-2`} data-label="Estado">
                <label
                    className={cn(
                        'inline-flex min-h-8 items-center gap-2 rounded-lg border px-2 text-xs font-black transition',
                        form.is_active
                            ? 'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[0_6px_12px_rgba(16,185,129,0.12)]'
                            : 'border-slate-200 bg-white text-ink-700',
                    )}
                >
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, is_active: event.target.checked }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                    <span>Activo</span>
                </label>
                <label
                    className={cn(
                        'mt-1 inline-flex min-h-8 items-center gap-2 rounded-lg border px-2 text-xs font-black transition',
                        form.is_featured
                            ? 'border-cyan-300 bg-cyan-100 text-cyan-950 shadow-[0_6px_12px_rgba(8,145,178,0.12)]'
                            : 'border-sky-100 bg-white text-ink-700',
                    )}
                >
                    <input
                        type="checkbox"
                        checked={form.is_featured}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, is_featured: event.target.checked }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                    <span>Destacado</span>
                </label>
            </td>
            <td className={`${ui.tableCell} w-[76px] !px-1 !py-2`} data-label="Acciones">
                <div className="grid grid-cols-2 gap-1">
                    <button
                        type="button"
                        className={cn(productGridIconButton, isDirty && 'border-amber-300 bg-amber-50 text-amber-800', !isDirty && 'cursor-not-allowed opacity-45')}
                        title="Guardar"
                        aria-label="Guardar"
                        disabled={!isDirty || status === 'saving'}
                        onClick={() => void saveInline()}
                    >
                        <FaSave aria-hidden="true" />
                    </button>
                    <Link href={route('admin.products.edit', product.id)} className={productGridIconButton} title="Editar" aria-label="Editar">
                        <FaEdit aria-hidden="true" />
                    </Link>
                    {isDirty ? (
                        <button type="button" className={productGridIconButton} title="Cancelar cambios" aria-label="Cancelar cambios" onClick={resetInline}>
                            <FaUndo aria-hidden="true" />
                        </button>
                    ) : (
                        <Link href={route('admin.products.duplicate', product.id)} method="post" as="button" className={productGridIconButton} title="Duplicar" aria-label="Duplicar">
                            <FaCopy aria-hidden="true" />
                        </Link>
                    )}
                    <Link
                        href={route('admin.products.destroy', product.id)}
                        method="post"
                        as="button"
                        className={cn(productGridDangerIconButton, isDirty && 'pointer-events-none opacity-45')}
                        title="Papelera"
                        aria-label="Papelera"
                        onClick={(event) => {
                            if (!window.confirm(`Mover "${product.name}" a papelera?`)) {
                                event.preventDefault();
                            }
                        }}
                    >
                        <FaTrash aria-hidden="true" />
                    </Link>
                </div>
                {feedback !== '' ? <p className={`mt-1 text-[0.58rem] ${inlineFeedbackClass(status)}`}>{feedback}</p> : null}
            </td>
        </tr>
    );
}

function ProductMobileCard({
    product,
    categories,
    isSelected,
    onToggleSelection,
    onFilter,
    onPendingChange,
    onRegisterSave,
}: {
    product: ProductRow;
    categories: CategoryOption[];
    isSelected: boolean;
    onToggleSelection: () => void;
    onFilter: (next: { quick?: string; issue?: string; missing?: string; estado?: string; includeDeleted?: boolean }) => void;
    onPendingChange: (productId: number, isPending: boolean) => void;
    onRegisterSave: (productId: number, save: (() => Promise<void>) | null) => void;
}): JSX.Element {
    const initialForm = useMemo<InlineProductState>(() => ({
        category_id: product.category_id ? String(product.category_id) : '',
        name: product.name,
        sku: product.sku ?? '',
        price: String(product.price ?? 0),
        offer_price: product.offer_price ? String(product.offer_price) : '',
        is_active: product.is_active,
        is_featured: product.is_featured,
    }), [product]);
    const [form, setForm] = useState<InlineProductState>(initialForm);
    const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'success' | 'error'>('idle');
    const [feedback, setFeedback] = useState('');
    const skuInputRef = useRef<HTMLInputElement>(null);
    const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

    useEffect(() => {
        onPendingChange(product.id, isDirty);

        return () => onPendingChange(product.id, false);
    }, [isDirty, onPendingChange, product.id]);

    const handleInlineKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            void saveInline();
        }

        if (event.key === 'Escape' && isDirty) {
            event.preventDefault();
            resetInline();
        }
    };

    const markDirty = (): void => {
        if (status !== 'saving') {
            setStatus('dirty');
            setFeedback('Cambios pendientes');
        }
    };

    const resetInline = (): void => {
        setForm(initialForm);
        setStatus('idle');
        setFeedback('');
    };

    const payload = {
        category_id: Number(form.category_id || product.category_id || 0),
        name: form.name,
        slug: product.slug,
        permalink: '',
        sku: form.sku,
        short_description: product.short_description ?? '',
        description: product.description ?? '',
        price: Number(form.price || 0),
        offer_price: form.offer_price === '' ? '' : Number(form.offer_price),
        offer_start_at: product.offer_start_at ?? '',
        offer_end_at: product.offer_end_at ?? '',
        stock: product.stock ?? 0,
        stock_status: product.stock_status ?? 'instock',
        image_url: product.image_url ?? '',
        image_url_2: product.image_url_2 ?? '',
        image_url_3: product.image_url_3 ?? '',
        is_featured: form.is_featured ? 1 : 0,
        is_active: form.is_active ? 1 : 0,
    };

    const saveInline = async (): Promise<void> => {
        if (!isDirty) {
            return;
        }

        setStatus('saving');
        setFeedback('Guardando...');

        const response = await window.fetch(route('admin.products.quick_update', product.id), {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                Accept: 'application/json',
            },
            body: (() => {
                const formData = new FormData();
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, String(value));
                });
                return formData;
            })(),
        });

        if (!response.ok) {
            setStatus('error');
            setFeedback('No se pudo guardar');
            return;
        }

        const data = (await response.json()) as { ok?: boolean; message?: string };

        if (!data.ok) {
            setStatus('error');
            setFeedback(data.message ?? 'No se pudo guardar');
            return;
        }

        setStatus('success');
        setFeedback(data.message ?? 'Producto guardado');
        router.reload({ only: ['products', 'validationSummary', 'stats'] });
    };

    useEffect(() => {
        onRegisterSave(product.id, saveInline);

        return () => onRegisterSave(product.id, null);
    }, [form, initialForm, onRegisterSave, product.id, status]);

    return (
        <article
            className={cn(
                'grid gap-2 rounded-[1.15rem] border border-sky-100 bg-white/95 p-2.5 shadow-[0_14px_30px_rgba(18,58,132,0.08)] sm:gap-3 sm:rounded-[1.35rem] sm:p-3',
                isSelected && 'border-brand-500/50 bg-brand-50/45',
                isDirty && 'border-amber-300 bg-amber-50/70',
            )}
        >
            <div className="grid grid-cols-[4.25rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-3">
                <div className="grid gap-2">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-sky-100 bg-sky-50 text-center text-xs font-black text-ink-700">
                        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" /> : <span>Sin foto</span>}
                    </div>
                    <label className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white px-2 py-2 text-xs font-black text-ink-800">
                        <input type="checkbox" checked={isSelected} onChange={onToggleSelection} />
                        <span>#{product.id}</span>
                    </label>
                </div>
                <div className="grid min-w-0 gap-2">
                    <input
                        className={`${ui.input} min-h-10 rounded-xl px-3 py-2 text-[0.9rem] font-black`}
                        value={form.name}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, name: event.target.value }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <input
                            ref={skuInputRef}
                            className={`${ui.input} min-h-10 min-w-0 rounded-xl px-3 py-2 text-sm`}
                            placeholder="SKU"
                            value={form.sku}
                            onChange={(event) => {
                                setForm((current) => ({ ...current, sku: event.target.value }));
                                markDirty();
                            }}
                            onKeyDown={handleInlineKeyDown}
                        />
                        <select
                            className={`${ui.input} min-h-10 min-w-0 rounded-xl px-3 py-2 text-sm`}
                            value={form.category_id}
                            onChange={(event) => {
                                setForm((current) => ({ ...current, category_id: event.target.value }));
                                markDirty();
                            }}
                            onKeyDown={handleInlineKeyDown}
                        >
                            <option value="">Sin categoria</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {(product.validation ?? []).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {(product.validation ?? []).map((warning) => (
                                <button
                                    key={`${product.id}-${warning.code}`}
                                    type="button"
                                    className={ui.warningChip}
                                    onClick={() => {
                                        if (warning.code === 'missing_sku') {
                                            skuInputRef.current?.focus();
                                            return;
                                        }
                                        onFilter({ issue: warning.code, missing: warning.code === 'missing_image' ? 'images' : warning.code === 'missing_sku' ? 'sku' : '' });
                                    }}
                                >
                                    {warning.label}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-brand-700/75">Precio</span>
                    <input
                        className={`${ui.input} min-h-10 min-w-0 rounded-xl px-3 py-2 text-sm`}
                        value={form.price}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, price: event.target.value }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                </label>
                <label className="grid gap-1">
                    <span className="text-xs font-black uppercase tracking-[0.08em] text-brand-700/75">Oferta</span>
                    <input
                        className={`${ui.input} min-h-10 min-w-0 rounded-xl px-3 py-2 text-sm`}
                        placeholder="Sin oferta"
                        value={form.offer_price}
                        onChange={(event) => {
                            setForm((current) => ({ ...current, offer_price: event.target.value }));
                            markDirty();
                        }}
                        onKeyDown={handleInlineKeyDown}
                    />
                </label>
            </div>

            <div className="grid gap-2 rounded-xl border border-sky-100 bg-sky-50/55 p-2">
                <div className="flex items-center justify-between gap-2 text-sm font-black text-ink-900">
                    <span>Efectivo</span>
                    <span>{formatCurrency(Number(form.offer_price || form.price || 0))}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label
                        className={cn(
                            `${ui.checkboxLine} min-h-10 justify-center rounded-xl px-2 py-2 text-xs`,
                            form.is_active && 'border-emerald-300 bg-emerald-100 text-emerald-900',
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => {
                                setForm((current) => ({ ...current, is_active: event.target.checked }));
                                markDirty();
                            }}
                            onKeyDown={handleInlineKeyDown}
                        />
                        <span>Activo</span>
                    </label>
                    <label
                        className={cn(
                            `${ui.checkboxLine} min-h-10 justify-center rounded-xl px-2 py-2 text-xs`,
                            form.is_featured && 'border-cyan-300 bg-cyan-100 text-cyan-950',
                        )}
                    >
                        <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={(event) => {
                                setForm((current) => ({ ...current, is_featured: event.target.checked }));
                                markDirty();
                            }}
                            onKeyDown={handleInlineKeyDown}
                        />
                        <span>Destacado</span>
                    </label>
                </div>
                {product.deleted_at ? <button type="button" className={stateChipClass('trash')} onClick={() => onFilter({ quick: 'trashed', includeDeleted: true })}>Papelera</button> : null}
            </div>

            <div className="grid grid-cols-4 gap-2">
                <button type="button" className={cn(productGridIconButton, 'h-10 w-full', isDirty && 'border-amber-300 bg-amber-50 text-amber-800', !isDirty && 'cursor-not-allowed opacity-45')} title="Guardar" aria-label="Guardar" disabled={!isDirty || status === 'saving'} onClick={() => void saveInline()}>
                    <FaSave aria-hidden="true" />
                </button>
                <Link href={route('admin.products.edit', product.id)} className={`${productGridIconButton} h-10 w-full`} title="Editar" aria-label="Editar">
                    <FaEdit aria-hidden="true" />
                </Link>
                {isDirty ? (
                    <button type="button" className={`${productGridIconButton} h-10 w-full`} title="Cancelar cambios" aria-label="Cancelar cambios" onClick={resetInline}>
                        <FaUndo aria-hidden="true" />
                    </button>
                ) : (
                    <Link href={route('admin.products.duplicate', product.id)} method="post" as="button" className={`${productGridIconButton} h-10 w-full`} title="Duplicar" aria-label="Duplicar">
                        <FaCopy aria-hidden="true" />
                    </Link>
                )}
                <Link
                    href={route('admin.products.destroy', product.id)}
                    method="post"
                    as="button"
                    className={cn(`${productGridDangerIconButton} h-10 w-full`, isDirty && 'pointer-events-none opacity-45')}
                    title="Papelera"
                    aria-label="Papelera"
                    onClick={(event) => {
                        if (!window.confirm(`Mover "${product.name}" a papelera?`)) {
                            event.preventDefault();
                        }
                    }}
                >
                    <FaTrash aria-hidden="true" />
                </Link>
            </div>
            {feedback !== '' ? <p className={inlineFeedbackClass(status)}>{feedback}</p> : null}
        </article>
    );
}

export default function ProductsPage({
    filters = {},
    products = [],
    categories = [],
    validationSummary = {},
    stats = {
        total: 0,
        active: 0,
        offers: 0,
        featured: 0,
        trashed: 0,
    },
    config = {
        autosaveDefault: false,
    },
}: ProductsPageProps): JSX.Element {
    const safeFilters = Array.isArray(filters) ? {} : (filters ?? {});
    const savedFiltersRef = useRef<SavedProductFilters | null>(readSavedProductFilters());
    const hasIncomingFilters = Boolean(
        safeFilters.q ||
            safeFilters.category_id ||
            safeFilters.estado ||
            safeFilters.include_deleted ||
            safeFilters.missing ||
            safeFilters.quick ||
            safeFilters.issue ||
            safeFilters.sort,
    );
    const savedFilters = hasIncomingFilters ? null : savedFiltersRef.current;
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [pendingProductIds, setPendingProductIds] = useState<number[]>([]);
    const pendingSaveHandlersRef = useRef<Map<number, () => Promise<void>>>(new Map());
    const [search, setSearch] = useState(safeFilters.q ?? savedFilters?.search ?? '');
    const [categoryId, setCategoryId] = useState(safeFilters.category_id ? String(safeFilters.category_id) : savedFilters?.categoryId ?? '');
    const [estado, setEstado] = useState(safeFilters.estado ?? savedFilters?.estado ?? '');
    const [includeDeleted, setIncludeDeleted] = useState(Boolean(safeFilters.include_deleted ?? savedFilters?.includeDeleted ?? false));
    const [missing, setMissing] = useState(safeFilters.missing ?? savedFilters?.missing ?? '');
    const [quick, setQuick] = useState(safeFilters.quick ?? savedFilters?.quick ?? '');
    const [issue, setIssue] = useState(safeFilters.issue ?? savedFilters?.issue ?? '');
    const [sort, setSort] = useState(safeFilters.sort ?? savedFilters?.sort ?? 'created_at');
    const [order, setOrder] = useState(safeFilters.order ?? savedFilters?.order ?? 'desc');
    const [openPanel, setOpenPanel] = useState<'quick' | 'alerts' | 'bulk' | null>(null);
    const [productsPanelOpen, setProductsPanelOpen] = useState(() => {
        if (typeof window === 'undefined') {
            return true;
        }

        return window.localStorage.getItem('adminProductsPanelOpen') !== '0';
    });
    const [density, setDensity] = useState<DensityMode>(() => {
        if (typeof window === 'undefined') {
            return 'compact';
        }

        return window.localStorage.getItem('adminProductsDensity') === 'comfortable' ? 'comfortable' : 'compact';
    });
    const desktopSearchReady = useRef(false);
    const bulkForm = useForm<BulkFormData>({
        ids: [],
        action: '',
        category_id: '',
        offer_percent: '',
    });
    const quickCreateForm = useForm<QuickCreateFormData>({
        category_id: String(categories[0]?.id ?? ''),
        name: '',
        sku: '',
        short_description: '',
        description: '',
        price: '',
        offer_price: '',
        stock: '0',
        stock_status: 'instock',
        image_url: '',
        image_url_2: '',
        image_url_3: '',
        is_featured: false,
        is_active: true,
    });

    const allSelected = useMemo(
        () => products.length > 0 && selectedIds.length === products.length,
        [products.length, selectedIds.length],
    );

    const hasSelection = selectedIds.length > 0;
    const hasPendingChanges = pendingProductIds.length > 0;
    const confirmLosePendingChanges = (): boolean =>
        !hasPendingChanges || window.confirm(`Hay ${pendingProductIds.length} producto(s) con cambios sin guardar. Si continuas, podrias perder esos cambios. Continuar?`);
    const activeFilterSummary = useMemo(() => {
        const parts: string[] = [];

        if (search.trim() !== '') {
            parts.push(`Busqueda: ${search.trim()}`);
        }

        if (categoryId !== '') {
            const categoryName = categories.find((category) => String(category.id) === categoryId)?.name ?? `Categoria ${categoryId}`;
            parts.push(`Categoria: ${categoryName}`);
        }

        if (estado !== '') {
            parts.push(estado === '1' ? 'Activos' : 'Inactivos');
        }

        if (missing !== '') {
            parts.push(missing === 'images' ? 'Sin imagen' : missing === 'sku' ? 'Sin SKU' : missing);
        }

        if (quick !== '') {
            parts.push(quickFilterLabels[quick] ?? quick);
        }

        if (issue !== '') {
            parts.push(summaryLabels[issue] ?? issue);
        }

        if (includeDeleted) {
            parts.push('Incluye papelera');
        }

        if (sort !== 'created_at') {
            parts.push(`Orden: ${sort} ${order === 'asc' ? 'asc' : 'desc'}`);
        }

        return parts;
    }, [categories, categoryId, estado, includeDeleted, issue, missing, order, quick, search, sort]);
    const hasActiveFilters = activeFilterSummary.length > 0;

    const applyFilters = (event?: FormEvent<HTMLFormElement>): void => {
        event?.preventDefault();
        if (!confirmLosePendingChanges()) {
            return;
        }
        router.get(
            route('admin.products.index'),
            {
                q: search || undefined,
                category_id: categoryId || undefined,
                estado: estado || undefined,
                include_deleted: includeDeleted ? 1 : undefined,
                missing: missing || undefined,
                quick: quick || undefined,
                issue: issue || undefined,
                sort: sort !== 'created_at' ? sort : undefined,
                order: sort !== 'created_at' ? order : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const applyQuickFilter = (next: { quick?: string; issue?: string; missing?: string; estado?: string; includeDeleted?: boolean }): void => {
        if (!confirmLosePendingChanges()) {
            return;
        }

        const nextQuick = next.quick ?? '';
        const nextIssue = next.issue ?? '';
        const nextMissing = next.missing ?? '';
        const nextEstado = next.estado ?? '';
        const nextIncludeDeleted = next.includeDeleted ?? false;

        setQuick(nextQuick);
        setIssue(nextIssue);
        setMissing(nextMissing);
        setEstado(nextEstado);
        setIncludeDeleted(nextIncludeDeleted);

        router.get(
            route('admin.products.index'),
            {
                q: search || undefined,
                category_id: categoryId || undefined,
                estado: nextEstado || undefined,
                include_deleted: nextIncludeDeleted ? 1 : undefined,
                missing: nextMissing || undefined,
                quick: nextQuick || undefined,
                issue: nextIssue || undefined,
                sort: sort !== 'created_at' ? sort : undefined,
                order: sort !== 'created_at' ? order : undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearAllFilters = (): void => {
        if (!confirmLosePendingChanges()) {
            return;
        }

        setSearch('');
        setCategoryId('');
        setEstado('');
        setIncludeDeleted(false);
        setMissing('');
        setQuick('');
        setIssue('');
        setSort('created_at');
        setOrder('desc');
        setSelectedIds([]);
        window.localStorage.removeItem('adminProductsFilters');

        router.get(route('admin.products.index'), {}, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        if (!hasPendingChanges) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasPendingChanges]);

    useEffect(() => {
        if (!desktopSearchReady.current) {
            desktopSearchReady.current = true;
            return;
        }

        if (typeof window === 'undefined' || !window.matchMedia('(min-width: 1024px)').matches) {
            return;
        }

        if (hasPendingChanges) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            router.get(
                route('admin.products.index'),
                {
                    q: search || undefined,
                    category_id: categoryId || undefined,
                    estado: estado || undefined,
                    include_deleted: includeDeleted ? 1 : undefined,
                    missing: missing || undefined,
                    quick: quick || undefined,
                    issue: issue || undefined,
                    sort: sort !== 'created_at' ? sort : undefined,
                    order: sort !== 'created_at' ? order : undefined,
                },
                { preserveState: true, preserveScroll: true },
            );
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [categoryId, estado, hasPendingChanges, includeDeleted, issue, missing, order, quick, search, sort]);

    useEffect(() => {
        window.localStorage.setItem('adminProductsPanelOpen', productsPanelOpen ? '1' : '0');
    }, [productsPanelOpen]);

    useEffect(() => {
        window.localStorage.setItem('adminProductsDensity', density);
    }, [density]);

    useEffect(() => {
        window.localStorage.setItem(
            'adminProductsFilters',
            JSON.stringify({
                search,
                categoryId,
                estado,
                includeDeleted,
                missing,
                quick,
                issue,
                sort,
                order,
            }),
        );
    }, [categoryId, estado, includeDeleted, issue, missing, order, quick, search, sort]);

    const applySort = (nextSort: string): void => {
        if (!confirmLosePendingChanges()) {
            return;
        }

        const nextOrder = sort === nextSort && order === 'asc' ? 'desc' : 'asc';
        setSort(nextSort);
        setOrder(nextOrder);

        router.get(
            route('admin.products.index'),
            {
                q: search || undefined,
                category_id: categoryId || undefined,
                estado: estado || undefined,
                include_deleted: includeDeleted ? 1 : undefined,
                missing: missing || undefined,
                quick: quick || undefined,
                issue: issue || undefined,
                sort: nextSort,
                order: nextOrder,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const sortLabel = (key: string): string => (sort === key ? (order === 'asc' ? ' ↑' : ' ↓') : '');
    const sortHeaderClass = (key: string): string =>
        cn(
            'inline-flex min-h-8 items-center rounded-md px-2 py-1 font-inherit text-left transition',
            sort === key ? 'bg-brand-100 text-brand-900 ring-1 ring-brand-200' : 'hover:bg-brand-50',
        );
    const updatePendingProduct = useCallback((productId: number, isPending: boolean): void => {
        setPendingProductIds((current) => {
            const exists = current.includes(productId);

            if (isPending && !exists) {
                return [...current, productId];
            }

            if (!isPending && exists) {
                return current.filter((id) => id !== productId);
            }

            return current;
        });
    }, []);
    const registerPendingSave = useCallback((productId: number, save: (() => Promise<void>) | null): void => {
        if (save === null) {
            pendingSaveHandlersRef.current.delete(productId);
            return;
        }

        pendingSaveHandlersRef.current.set(productId, save);
    }, []);
    const saveAllPending = async (): Promise<void> => {
        const handlers = pendingProductIds
            .map((id) => pendingSaveHandlersRef.current.get(id))
            .filter((handler): handler is () => Promise<void> => Boolean(handler));

        for (const handler of handlers) {
            await handler();
        }
    };

    const submitBulk = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        if (!hasSelection || bulkForm.data.action === '') {
            return;
        }

        if (bulkForm.data.action === 'trash' && !window.confirm('Se moveran los productos seleccionados a la papelera.')) {
            return;
        }

        bulkForm.transform((data) => ({
            ...data,
            ids: selectedIds,
        }));
        bulkForm.post(route('admin.products.bulk'), {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedIds([]);
                bulkForm.reset('ids', 'action', 'category_id', 'offer_percent');
            },
        });
    };

    return (
        <AdminLayout title="Productos">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Gestion de catalogo</p>
                    <h2 className={ui.heroTitle}>Productos y guardado inline</h2>
                    <p className={ui.heroText}>
                        Esta tabla ya permite editar y guardar por fila como en el panel legacy. Autosave sugerido:{' '}
                        <strong>{config.autosaveDefault ? 'activo' : 'inactivo'}</strong>.
                    </p>
                </div>
                <div className={ui.heroActions}>
                    <Link href={route('admin.products.create')} className={buttonClass('primary')}>
                        Nuevo producto
                    </Link>
                    <Link href={route('admin.products.missing_images', { missing: 'images' })} className={buttonClass('soft')}>
                        Revisar imagenes
                    </Link>
                    <Link href={route('admin.products.missing_sku', { missing: 'sku' })} className={buttonClass('soft')}>
                        Revisar SKU
                    </Link>
                </div>
            </section>

            <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2 rounded-[0.75rem] border border-sky-100 bg-white/85 p-2 shadow-[0_8px_18px_rgba(15,45,103,0.08)]">
                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setOpenPanel(openPanel === 'quick' ? null : 'quick')}>
                        Alta
                    </button>
                    <button type="button" className={buttonClass(productsPanelOpen ? 'primary' : 'soft', 'sm')} onClick={() => setProductsPanelOpen(!productsPanelOpen)}>
                        Productos
                    </button>
                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setOpenPanel(openPanel === 'alerts' ? null : 'alerts')}>
                        Alertas
                    </button>
                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setOpenPanel(openPanel === 'bulk' ? null : 'bulk')}>
                        Masivo
                    </button>
                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}>
                        {density === 'compact' ? 'Compacta' : 'Comoda'}
                    </button>
                    <button type="button" className={buttonClass('danger', 'sm')} onClick={clearAllFilters}>
                        Limpiar
                    </button>
                    <span className={ui.inlineCaption}>
                        {quick ? `Filtro: ${quickFilterLabels[quick] ?? quick}` : issue ? `Alerta: ${summaryLabels[issue] ?? issue}` : `Mostrando ${products.length}`}
                    </span>
                    {pendingProductIds.length > 0 ? <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-amber-800">{pendingProductIds.length} pendientes</span> : null}
                    {pendingProductIds.length > 0 ? (
                        <button type="button" className={buttonClass('primary', 'sm')} onClick={() => void saveAllPending()}>
                            Guardar pendientes
                        </button>
                    ) : null}
                </div>
            </div>

            <CompactPanel
                eyebrow="Atajos"
                title="Alta rapida y rotacion"
                open={openPanel === 'quick'}
                onToggle={() => setOpenPanel(openPanel === 'quick' ? null : 'quick')}
            >
                <div className="grid gap-3">
                <form
                    className="grid gap-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        quickCreateForm.post(route('admin.products.quick_store'), {
                            preserveScroll: true,
                            onSuccess: () => quickCreateForm.reset(),
                        });
                    }}
                >
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Alta rapida</p>
                            <h3 className={ui.cardTitle}>Crear producto sin salir del listado</h3>
                        </div>
                    </div>
                    <div className={ui.formGrid}>
                        <input className={ui.input} placeholder="Nombre" value={quickCreateForm.data.name} onChange={(event) => quickCreateForm.setData('name', event.target.value)} />
                        <select className={ui.input} value={quickCreateForm.data.category_id} onChange={(event) => quickCreateForm.setData('category_id', event.target.value)}>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <input className={ui.input} placeholder="SKU" value={quickCreateForm.data.sku} onChange={(event) => quickCreateForm.setData('sku', event.target.value)} />
                        <input className={ui.input} placeholder="Precio" type="number" value={quickCreateForm.data.price} onChange={(event) => quickCreateForm.setData('price', event.target.value)} />
                        <input className={ui.input} placeholder="Imagen principal" value={quickCreateForm.data.image_url} onChange={(event) => quickCreateForm.setData('image_url', event.target.value)} />
                        <label className={ui.checkboxLine}>
                            <input type="checkbox" checked={quickCreateForm.data.is_active} onChange={(event) => quickCreateForm.setData('is_active', event.target.checked)} />
                            <span>Activo</span>
                        </label>
                    </div>
                    <div className={ui.heroActions}>
                        <button className={buttonClass('primary')} type="submit" disabled={quickCreateForm.processing}>
                            Guardar rapido
                        </button>
                    </div>
                </form>

                </div>
            </CompactPanel>

            <CompactPanel
                eyebrow="Validacion"
                title="Alertas del catalogo filtrado"
                open={openPanel === 'alerts'}
                onToggle={() => setOpenPanel(openPanel === 'alerts' ? null : 'alerts')}
            >
                <div className={ui.validationGrid}>
                    {Object.entries(validationSummary ?? {}).map(([key, value]) => (
                        <button
                            key={key}
                            type="button"
                            className={`${ui.validationPill} text-left transition hover:-translate-y-0.5 hover:border-brand-500/45`}
                            onClick={() => applyQuickFilter({ issue: key, missing: key === 'missing_image' ? 'images' : key === 'missing_sku' ? 'sku' : '' })}
                        >
                            <strong>{value}</strong>
                            <span className={ui.inlineCaption}>{summaryLabels[key] ?? key}</span>
                        </button>
                    ))}
                </div>
            </CompactPanel>

            <CompactPanel
                eyebrow="Edicion"
                title="Acciones masivas"
                open={openPanel === 'bulk'}
                onToggle={() => setOpenPanel(openPanel === 'bulk' ? null : 'bulk')}
            >
                <form className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between" onSubmit={submitBulk}>
                    <label className={ui.checkboxLine}>
                        <input type="checkbox" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? products.map((product) => product.id) : [])} />
                        <span>Seleccionar visibles</span>
                    </label>
                    <div className={ui.mediaActions}>
                        <select className={`${ui.input} lg:min-w-[220px]`} value={bulkForm.data.action} onChange={(event) => bulkForm.setData('action', event.target.value)}>
                            <option value="">Accion masiva</option>
                            <option value="activate">Activar</option>
                            <option value="deactivate">Desactivar</option>
                            <option value="set_category">Mover de categoria</option>
                            <option value="apply_offer">Aplicar oferta</option>
                            <option value="clear_offer">Limpiar oferta</option>
                            <option value="trash">Mover a papelera</option>
                        </select>
                        {bulkForm.data.action === 'set_category' ? (
                            <select className={`${ui.input} lg:min-w-[220px]`} value={bulkForm.data.category_id} onChange={(event) => bulkForm.setData('category_id', event.target.value)}>
                                <option value="">Elegir categoria</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        ) : null}
                        {bulkForm.data.action === 'apply_offer' ? (
                            <input className={`${ui.input} lg:w-56`} type="number" min="1" max="99" step="0.1" placeholder="Porcentaje de oferta" value={bulkForm.data.offer_percent} onChange={(event) => bulkForm.setData('offer_percent', event.target.value)} />
                        ) : null}
                        <button className={buttonClass('primary')} type="submit" disabled={!hasSelection || bulkForm.processing}>
                            Aplicar
                        </button>
                    </div>
                    <p className={ui.inlineCaption}>{hasSelection ? `${selectedIds.length} producto(s) seleccionados` : `Mostrando ${products.length} de ${stats.total} productos activos`}</p>
                </form>
            </CompactPanel>

            <section className={`${ui.sectionCardTight} !p-0`}>
                <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-[0.75rem] px-3 py-2 text-left transition hover:bg-brand-50/60"
                    onClick={() => setProductsPanelOpen(!productsPanelOpen)}
                >
                    <span className="min-w-0">
                        <span className="block text-[0.62rem] font-black uppercase tracking-[0.18em] text-brand-700/70">Listado</span>
                        <span className="block truncate text-base font-black text-ink-950">Panel de productos y filtros</span>
                    </span>
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-sky-100 bg-white text-lg font-black text-brand-700">
                        {productsPanelOpen ? '-' : '+'}
                    </span>
                </button>
                {productsPanelOpen ? (
                    <div className="grid gap-2 border-t border-sky-100 p-2 sm:p-3">
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
                            <button
                                type="button"
                                className="min-w-0 rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2 text-left shadow-[0_6px_14px_rgba(16,185,129,0.08)] transition hover:-translate-y-px hover:bg-emerald-100 sm:px-3"
                                onClick={() => applyQuickFilter({ quick: 'active', estado: '1' })}
                            >
                                <span className="block truncate text-[0.62rem] font-black uppercase tracking-[0.08em] text-emerald-700 sm:tracking-[0.16em]">Activos</span>
                                <span className="block text-xl font-black text-emerald-950">{stats.active}</span>
                            </button>
                            <button
                                type="button"
                                className="min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-2 py-2 text-left shadow-[0_6px_14px_rgba(245,158,11,0.08)] transition hover:-translate-y-px hover:bg-amber-100 sm:px-3"
                                onClick={() => applyQuickFilter({ quick: 'offers' })}
                            >
                                <span className="block truncate text-[0.62rem] font-black uppercase tracking-[0.08em] text-amber-700 sm:tracking-[0.16em]">Oferta</span>
                                <span className="block text-xl font-black text-amber-950">{stats.offers}</span>
                            </button>
                            <button
                                type="button"
                                className="min-w-0 rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-2 text-left shadow-[0_6px_14px_rgba(6,182,212,0.08)] transition hover:-translate-y-px hover:bg-cyan-100 sm:px-3"
                                onClick={() => applyQuickFilter({ quick: 'featured' })}
                            >
                                <span className="block truncate text-[0.62rem] font-black uppercase tracking-[0.08em] text-cyan-700 sm:tracking-[0.16em]">Destacados</span>
                                <span className="block text-xl font-black text-cyan-950">{stats.featured}</span>
                            </button>
                            <button
                                type="button"
                                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-left shadow-[0_6px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-px hover:bg-slate-100 sm:px-3"
                                onClick={() => applyQuickFilter({ quick: 'trashed', includeDeleted: true })}
                            >
                                <span className="block truncate text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-600 sm:tracking-[0.16em]">Papelera</span>
                                <span className="block text-xl font-black text-slate-950">{stats.trashed}</span>
                            </button>
                        </div>

                        <form className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_minmax(190px,0.9fr)_150px_180px_auto_auto] lg:items-center" onSubmit={applyFilters}>
                            <div className="relative">
                                <input
                                    className={`${ui.input} pr-20`}
                                    placeholder="Buscar por nombre o SKU"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="absolute right-10 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-50"
                                    aria-label="Buscar productos"
                                    title="Buscar"
                                >
                                    <FaSearch aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        'absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-rose-700 transition hover:bg-rose-50',
                                        !hasActiveFilters && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                                    )}
                                    aria-label="Limpiar busqueda y filtros"
                                    title="Limpiar busqueda y filtros"
                                    disabled={!hasActiveFilters}
                                    onClick={clearAllFilters}
                                >
                                    x
                                </button>
                            </div>
                            <select className={ui.input} value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                                <option value="">Todas las categorias</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name} ({category.product_count})
                                    </option>
                                ))}
                            </select>
                            <select className={ui.input} value={estado} onChange={(event) => setEstado(event.target.value)}>
                                <option value="">Estados</option>
                                <option value="1">Activos</option>
                                <option value="0">Inactivos</option>
                            </select>
                            <select className={ui.input} value={missing} onChange={(event) => setMissing(event.target.value)}>
                                <option value="">Faltantes</option>
                                <option value="images">Sin imagen</option>
                                <option value="sku">Sin SKU</option>
                            </select>
                            <label className={`${ui.checkboxLine} min-h-[2.5rem] justify-center px-3`}>
                                <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
                                <span>Papelera</span>
                            </label>
                            <button className={buttonClass('primary')} type="submit">
                                Filtrar
                            </button>
                        </form>
                    </div>
                ) : null}
            </section>

            <section className={ui.sectionCardTight}>
                <div className="mb-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-xl border border-sky-100 bg-[linear-gradient(90deg,#eff6ff_0%,#ffffff_50%,#eff6ff_100%)] px-3 py-2 shadow-[0_8px_18px_rgba(15,45,103,0.08)] sm:items-center">
                    <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="shrink-0 text-xs font-black uppercase tracking-[0.16em] text-brand-700">Productos filtrados</span>
                            <span className="min-w-0 text-sm font-bold leading-snug text-ink-900">
                                {products.length} visibles de {stats.total}
                                {activeFilterSummary.length > 0 ? ` - ${activeFilterSummary.join(' - ')}` : ' - Sin filtros activos'}
                            </span>
                            {pendingProductIds.length > 0 ? (
                                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-black uppercase tracking-[0.08em] text-amber-800">
                                    {pendingProductIds.length} pendientes
                                </span>
                            ) : null}
                            {pendingProductIds.length > 0 ? (
                                <button type="button" className={`${buttonClass('primary', 'sm')} shrink-0`} onClick={() => void saveAllPending()}>
                                    Guardar pendientes
                                </button>
                            ) : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-white text-lg font-black leading-none text-rose-700 shadow-[0_6px_12px_rgba(190,24,93,0.08)] transition hover:bg-rose-50',
                            !hasActiveFilters && 'cursor-not-allowed opacity-40 hover:bg-white',
                        )}
                        aria-label="Limpiar filtros"
                        title="Limpiar filtros"
                        disabled={!hasActiveFilters}
                        onClick={clearAllFilters}
                    >
                        x
                    </button>
                </div>
                <div className="grid gap-3 md:hidden">
                    {products.map((product) => (
                        <ProductMobileCard
                            key={product.id}
                            product={product}
                            categories={categories}
                            isSelected={selectedIds.includes(product.id)}
                            onFilter={applyQuickFilter}
                            onPendingChange={updatePendingProduct}
                            onRegisterSave={registerPendingSave}
                            onToggleSelection={() =>
                                setSelectedIds((current) => (current.includes(product.id) ? current.filter((item) => item !== product.id) : [...current, product.id]))
                            }
                        />
                    ))}
                    {products.length === 0 ? (
                        <article className={ui.emptyCard}>
                            <h3 className={ui.emptyTitle}>No se encontraron productos</h3>
                            <p className={ui.emptyText}>Ajusta los filtros actuales para volver a ver el catalogo.</p>
                        </article>
                    ) : null}
                </div>

                <div className={`${ui.tableWrap} hidden md:block`}>
                    <table className={ui.table}>
                        <colgroup>
                            <col className="w-[30px]" />
                            <col className="w-[58px]" />
                            <col className="w-[72px]" />
                            <col className="w-[410px]" />
                            <col className="w-[210px]" />
                            <col className="w-[88px]" />
                            <col className="w-[88px]" />
                            <col className="w-[112px]" />
                            <col className="w-[76px]" />
                        </colgroup>
                        <thead>
                            <tr>
                                <th className={ui.tableHeadCell}>Sel.</th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('id')} onClick={() => applySort('id')}>ID{sortLabel('id')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>Img</th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('product')} onClick={() => applySort('product')}>Producto{sortLabel('product')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('category')} onClick={() => applySort('category')}>Categoria{sortLabel('category')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('price')} onClick={() => applySort('price')}>Precio{sortLabel('price')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('offer')} onClick={() => applySort('offer')}>Oferta{sortLabel('offer')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>
                                    <button type="button" className={sortHeaderClass('status')} onClick={() => applySort('status')}>Estado{sortLabel('status')}</button>
                                </th>
                                <th className={ui.tableHeadCell}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <ProductInlineRow
                                    key={product.id}
                                    product={product}
                                    categories={categories}
                                    isSelected={selectedIds.includes(product.id)}
                                    density={density}
                                    onFilter={applyQuickFilter}
                                    onPendingChange={updatePendingProduct}
                                    onRegisterSave={registerPendingSave}
                                    onToggleSelection={() =>
                                        setSelectedIds((current) => (current.includes(product.id) ? current.filter((item) => item !== product.id) : [...current, product.id]))
                                    }
                                />
                            ))}
                            {products.length === 0 ? <tr><td colSpan={9} className={ui.tableEmptyCell}>No se encontraron productos para los filtros actuales.</td></tr> : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}
