import { Link, useForm } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface ProductFormData {
    category_id: number;
    name: string;
    slug: string;
    sku: string;
    short_description: string;
    description: string;
    price: number | '';
    offer_price: number | null;
    cash_discount_mode: string;
    cash_discount_percentage: number | null;
    cash_price: number | null;
    stock: number;
    stock_status: string;
    image_url: string;
    image_url_2: string;
    image_url_3: string;
    is_featured: boolean;
    is_active: boolean;
}

interface MediaItem {
    id: number;
    title: string;
    tags?: string | null;
    fileUrl: string;
}

interface ProductFormPageProps {
    product: (ProductFormData & { id: number }) | null;
    categories: Array<{ id: number; name: string }>;
    mediaItems: MediaItem[];
    config: {
        skuEnabled: boolean;
    };
}

type ImageSlotKey = 'image_url' | 'image_url_2' | 'image_url_3';

export default function ProductFormPage({ product, categories, config }: ProductFormPageProps): JSX.Element {
    const [activeSlot, setActiveSlot] = useState<ImageSlotKey>('image_url');
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadingSlot, setUploadingSlot] = useState<ImageSlotKey | null>(null);
    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const form = useForm<ProductFormData>({
        category_id: product?.category_id ?? categories[0]?.id ?? 0,
        name: product?.name ?? '',
        slug: product?.slug ?? '',
        sku: product?.sku ?? '',
        short_description: product?.short_description ?? '',
        description: product?.description ?? '',
        price: product?.price ?? 0,
        offer_price: product?.offer_price ?? null,
        cash_discount_mode: product?.cash_discount_mode ?? 'global',
        cash_discount_percentage: product?.cash_discount_percentage ?? null,
        cash_price: product?.cash_price ?? null,
        stock: product?.stock ?? 0,
        stock_status: product?.stock_status ?? 'instock',
        image_url: product?.image_url ?? '',
        image_url_2: product?.image_url_2 ?? '',
        image_url_3: product?.image_url_3 ?? '',
        is_featured: product?.is_featured ?? false,
        is_active: product?.is_active ?? true,
    });

    const imageSlots = [
        { key: 'image_url' as const, label: 'Principal' },
        { key: 'image_url_2' as const, label: 'Galeria 2' },
        { key: 'image_url_3' as const, label: 'Galeria 3' },
    ];
    const sectionLinks = [
        { href: '#datos-basicos', label: 'Datos' },
        { href: '#precio-stock', label: 'Precio' },
        { href: '#descripcion', label: 'Descripcion' },
        { href: '#imagenes', label: 'Imagenes' },
    ];
    const submitLabel = product ? 'Actualizar producto' : 'Guardar producto';

    function submitForm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            price: data.price === '' ? 0 : data.price,
        }));

        form.post(product ? route('admin.products.update', product.id) : route('admin.products.store'), {
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    }

    function applyDescriptionFormat(tag: 'strong' | 'em' | 'u'): void {
        const textarea = descriptionRef.current;
        const value = form.data.description ?? '';

        if (!textarea) {
            form.setData('description', `${value}<${tag}></${tag}>`);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.slice(start, end);
        const fallbackText = tag === 'strong' ? 'texto en negrita' : tag === 'em' ? 'texto en cursiva' : 'texto subrayado';
        const wrappedText = `<${tag}>${selectedText || fallbackText}</${tag}>`;
        const nextValue = `${value.slice(0, start)}${wrappedText}${value.slice(end)}`;

        form.setData('description', nextValue);

        window.requestAnimationFrame(() => {
            textarea.focus();
            const selectionStart = start + tag.length + 2;
            const selectionEnd = selectionStart + (selectedText || fallbackText).length;
            textarea.setSelectionRange(selectionStart, selectionEnd);
        });
    }

    function clearImageSlot(slot: ImageSlotKey): void {
        form.setData(slot, '');
        if (activeSlot === slot) {
            setUploadError(null);
            setUploadFeedback(null);
        }
    }

    function handleDirectFileChange(slot: ImageSlotKey, event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0] ?? null;

        if (!file) {
            return;
        }

        void uploadImageToSlot(slot, file, event.currentTarget);
    }

    async function uploadImageToSlot(slot: ImageSlotKey, file: File, input: HTMLInputElement): Promise<void> {
        const title = form.data.name.trim() || file.name;
        const payload = new FormData();
        payload.append('file', file);
        payload.append('title', title);
        payload.append('tags', 'producto');

        setActiveSlot(slot);
        setUploadingSlot(slot);
        setUploadError(null);
        setUploadFeedback(null);

        try {
            const response = await fetch(route('admin.media.upload'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: payload,
            });
            const data = (await response.json().catch(() => null)) as { media?: MediaItem; message?: string; errors?: Record<string, string[]> } | null;

            if (!response.ok || !data?.media) {
                const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null;
                throw new Error(firstError || data?.message || 'No se pudo subir la imagen.');
            }

            const uploaded = data.media;
            const slotLabel = imageSlots.find((item) => item.key === slot)?.label ?? 'imagen';
            form.setData(slot, uploaded.fileUrl);
            setUploadFeedback(`Imagen subida y asignada a ${slotLabel}.`);
            input.value = '';
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
        } finally {
            setUploadingSlot(null);
        }
    }

    return (
        <AdminLayout title={product ? 'Editar producto' : 'Nuevo producto'}>
            <form className="grid gap-2" onSubmit={submitForm}>
                <div className="flex flex-col gap-2 rounded-lg border border-sky-100 bg-white px-3 py-3 shadow-[0_2px_8px_rgba(15,45,103,0.06)] lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-xl font-black leading-tight text-ink-950">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
                    </div>
                    <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
                        <Link href={route('admin.products.index')} className={buttonClass('soft', 'sm', 'w-full sm:w-auto')}>
                            Volver
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                            <label className={`${ui.checkboxLine} justify-center`}>
                                <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                                <span>Activo</span>
                            </label>
                            <label className={`${ui.checkboxLine} justify-center`}>
                                <input type="checkbox" checked={form.data.is_featured} onChange={(event) => form.setData('is_featured', event.target.checked)} />
                                <span>Destacado</span>
                            </label>
                        </div>
                        <button className={buttonClass('primary', 'default', 'w-full sm:w-auto')} disabled={form.processing}>
                            {submitLabel}
                        </button>
                    </div>
                </div>

                <nav className="sticky top-0 z-20 -mx-1 flex gap-1 overflow-x-auto border-y border-sky-100 bg-[#e8f1ff]/95 px-1 py-1.5 backdrop-blur lg:static lg:mx-0 lg:rounded-lg lg:border lg:bg-white lg:px-2" aria-label="Secciones del producto">
                    {sectionLinks.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-md border border-sky-100 bg-white px-3 text-[0.78rem] font-black text-ink-800 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500/40"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <section id="datos-basicos" className={`${ui.sectionCardTight} scroll-mt-20`}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <h3 className={ui.cardTitle}>Datos basicos</h3>
                        </div>
                    </div>
                    <div className={config.skuEnabled ? 'grid gap-2 lg:grid-cols-[minmax(260px,1.1fr)_minmax(220px,0.9fr)_minmax(120px,0.45fr)_minmax(150px,0.55fr)]' : 'grid gap-2 lg:grid-cols-[minmax(260px,1.1fr)_minmax(220px,0.9fr)_minmax(150px,0.55fr)]'}>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Nombre</label>
                            <input className={ui.input} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Categoria</label>
                            <select className={ui.input} value={form.data.category_id} onChange={(event) => form.setData('category_id', Number(event.target.value))}>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {config.skuEnabled ? (
                            <div className={ui.field}>
                                <label className={ui.fieldLabel}>SKU</label>
                                <input className={ui.input} value={form.data.sku} onChange={(event) => form.setData('sku', event.target.value)} />
                            </div>
                        ) : null}
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Estado stock</label>
                            <select className={ui.input} value={form.data.stock_status} onChange={(event) => form.setData('stock_status', event.target.value)}>
                                <option value="instock">En stock</option>
                                <option value="outofstock">Sin stock</option>
                                <option value="onbackorder">A pedido</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section id="precio-stock" className={`${ui.sectionCardTight} scroll-mt-20`}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <h3 className={ui.cardTitle}>Precio y stock</h3>
                        </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:max-w-3xl">
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Precio</label>
                            <input
                                className={ui.input}
                                type="number"
                                min={0}
                                value={form.data.price}
                                onFocus={() => {
                                    if (form.data.price === 0) {
                                        form.setData('price', '');
                                    }
                                }}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    form.setData('price', value === '' ? '' : Math.max(0, Number(value)));
                                }}
                            />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Oferta</label>
                            <input className={ui.input} type="number" value={form.data.offer_price ?? ''} onChange={(event) => form.setData('offer_price', event.target.value === '' ? null : Number(event.target.value))} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Stock</label>
                            <input className={ui.input} type="number" value={form.data.stock} onChange={(event) => form.setData('stock', Number(event.target.value))} />
                        </div>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[minmax(180px,220px)_minmax(160px,200px)_minmax(160px,200px)_minmax(0,1fr)]">
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Precio efectivo</label>
                            <select
                                className={ui.input}
                                value={form.data.cash_discount_mode}
                                onChange={(event) => form.setData('cash_discount_mode', event.target.value)}
                            >
                                <option value="global">Usar ajuste global</option>
                                <option value="percentage">Porcentaje propio</option>
                                <option value="manual">Precio manual</option>
                                <option value="disabled">Sin precio efectivo</option>
                            </select>
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Porcentaje</label>
                            <input
                                className={ui.input}
                                type="number"
                                min={0}
                                max={100}
                                step="0.1"
                                disabled={form.data.cash_discount_mode !== 'percentage'}
                                value={form.data.cash_discount_percentage ?? ''}
                                onChange={(event) => form.setData('cash_discount_percentage', event.target.value === '' ? null : Number(event.target.value))}
                            />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Precio manual</label>
                            <input
                                className={ui.input}
                                type="number"
                                min={0}
                                disabled={form.data.cash_discount_mode !== 'manual'}
                                value={form.data.cash_price ?? ''}
                                onChange={(event) => form.setData('cash_price', event.target.value === '' ? null : Number(event.target.value))}
                            />
                        </div>
                        <p className="self-end rounded-md border border-sky-100 bg-white px-3 py-2 text-xs font-semibold leading-5 text-ink-700">
                            Elegi porcentaje o precio manual. Si usas global, toma el porcentaje de Ajustes. Si elegis manual, el precio debe ser menor al precio visible.
                        </p>
                    </div>
                </section>

                <section id="descripcion" className={`${ui.sectionCardTight} scroll-mt-20`}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <h3 className={ui.cardTitle}>Descripcion</h3>
                        </div>
                    </div>
                    <div className="grid gap-2 rounded-lg border border-sky-100 bg-white p-3">
                        <label className={ui.fieldLabel}>Descripcion completa</label>
                        <div className="flex flex-wrap gap-2 rounded-md border border-sky-100 bg-white p-2">
                            <button type="button" className={buttonClass('soft', 'sm', 'min-w-10 px-3 text-base font-black')} onClick={() => applyDescriptionFormat('strong')}>
                                B
                            </button>
                            <button type="button" className={buttonClass('soft', 'sm', 'min-w-10 px-3 text-base font-black italic')} onClick={() => applyDescriptionFormat('em')}>
                                I
                            </button>
                            <button type="button" className={buttonClass('soft', 'sm', 'min-w-10 px-3 text-base font-black underline')} onClick={() => applyDescriptionFormat('u')}>
                                U
                            </button>
                        </div>
                        <textarea
                            ref={descriptionRef}
                            className={`${ui.textarea} !h-[18rem] !min-h-[18rem] resize-y text-[0.96rem] leading-7 sm:!h-[24rem] sm:!min-h-[24rem] lg:!h-[30rem] lg:!min-h-[30rem]`}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                        />
                    </div>
                </section>

                <section id="imagenes" className={`${ui.sectionCardTight} scroll-mt-20`}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <h3 className={ui.cardTitle}>Imagenes</h3>
                        </div>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-3">
                        {imageSlots.map((slot) => (
                            <div key={slot.key} className="grid gap-2 rounded-lg border border-sky-100 bg-white p-2.5">
                                <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-md border border-sky-100 bg-sky-50/75">
                                    {form.data[slot.key] ? (
                                        <>
                                            <img src={form.data[slot.key]} alt={slot.label} className="h-full w-full object-contain" />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-white text-lg font-black leading-none text-rose-700"
                                                aria-label={`Quitar imagen ${slot.label}`}
                                                onClick={() => clearImageSlot(slot.key)}
                                            >
                                                x
                                            </button>
                                        </>
                                    ) : (
                                        <span className="text-sm font-black text-ink-700/75">Sin imagen</span>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <label className={buttonClass('soft', 'sm', 'w-full cursor-pointer')}>
                                        <span>{uploadingSlot === slot.key ? 'Subiendo...' : slot.label}</span>
                                        <input
                                            className="sr-only"
                                            type="file"
                                            accept="image/*"
                                            disabled={uploadingSlot !== null}
                                            onChange={(event) => handleDirectFileChange(slot.key, event)}
                                        />
                                    </label>
                                    {uploadFeedback && activeSlot === slot.key ? <p className="text-xs font-bold text-emerald-700">{uploadFeedback}</p> : null}
                                    {uploadError && activeSlot === slot.key ? <p className="text-xs font-bold text-rose-700">{uploadError}</p> : null}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="sticky bottom-0 z-10 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2 border-t border-sky-100 bg-[#e8f1ff]/95 px-1 py-2 backdrop-blur sm:flex sm:justify-end print:static">
                    <Link href={route('admin.products.index')} className={buttonClass('soft', 'default', 'w-full sm:w-auto')}>
                        Cancelar
                    </Link>
                    <button className={buttonClass('primary', 'default', 'w-full sm:w-auto')} disabled={form.processing}>
                        {submitLabel}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
