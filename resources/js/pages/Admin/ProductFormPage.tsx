import { Link, useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
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
    price: number;
    offer_price: number | null;
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
}

type ImageSlotKey = 'image_url' | 'image_url_2' | 'image_url_3';

export default function ProductFormPage({ product, categories }: ProductFormPageProps): JSX.Element {
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
    const submitLabel = product ? 'Actualizar producto' : 'Guardar producto';

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
            <form
                className="grid gap-2"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (product) {
                        form.post(route('admin.products.update', product.id));
                        return;
                    }

                    form.post(route('admin.products.store'));
                }}
            >
                <section className={`${ui.sectionCardTight} !space-y-0`}>
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <p className={ui.eyebrow}>{product ? 'Edicion' : 'Alta'}</p>
                            <h2 className={ui.heroTitle}>{product ? 'Editar producto' : 'Nuevo producto'}</h2>
                        </div>
                        <div className={ui.heroActions}>
                            <Link href={route('admin.products.index')} className={buttonClass('soft', 'sm')}>
                                Volver a productos
                            </Link>
                            <label className={ui.checkboxLine}>
                                <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                                <span>Activo</span>
                            </label>
                            <label className={ui.checkboxLine}>
                                <input type="checkbox" checked={form.data.is_featured} onChange={(event) => form.setData('is_featured', event.target.checked)} />
                                <span>Destacado</span>
                            </label>
                            <button className={buttonClass('primary')} disabled={form.processing}>
                                {submitLabel}
                            </button>
                        </div>
                    </div>
                </section>

                <section className={ui.sectionCardTight}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Ficha principal</p>
                            <h3 className={ui.cardTitle}>Datos comerciales</h3>
                        </div>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-[minmax(260px,1.1fr)_minmax(220px,0.9fr)_minmax(120px,0.45fr)_minmax(150px,0.55fr)]">
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
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>SKU</label>
                            <input className={ui.input} value={form.data.sku} onChange={(event) => form.setData('sku', event.target.value)} />
                        </div>
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Estado stock</label>
                            <select className={ui.input} value={form.data.stock_status} onChange={(event) => form.setData('stock_status', event.target.value)}>
                                <option value="instock">En stock</option>
                                <option value="outofstock">Sin stock</option>
                                <option value="onbackorder">A pedido</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3 lg:max-w-3xl">
                        <div className={ui.field}>
                            <label className={ui.fieldLabel}>Precio</label>
                            <input className={ui.input} type="number" value={form.data.price} onChange={(event) => form.setData('price', Number(event.target.value))} />
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
                    <div className="grid gap-2">
                        <div className="grid gap-3 rounded-[1.25rem] border border-sky-100 bg-white/80 p-3 shadow-[0_10px_22px_rgba(18,58,132,0.06)]">
                            <label className={ui.fieldLabel}>Descripcion completa</label>
                            <div className="flex flex-wrap gap-2 rounded-2xl border border-sky-100 bg-white/80 p-2">
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
                                className={`${ui.textarea} !h-[32rem] !min-h-[32rem] resize-y text-[0.96rem] leading-7 lg:!h-[30rem] lg:!min-h-[30rem]`}
                                value={form.data.description}
                                onChange={(event) => form.setData('description', event.target.value)}
                            />
                        </div>
                    </div>
                </section>

                <section className={ui.sectionCardTight}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Galeria</p>
                            <h3 className={ui.cardTitle}>Imagenes</h3>
                        </div>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-3">
                        {imageSlots.map((slot) => (
                            <div key={slot.key} className="grid gap-2 rounded-[1.2rem] border border-sky-100 bg-white/85 p-2.5 shadow-[0_10px_22px_rgba(18,58,132,0.06)]">
                                <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-xl border border-sky-100 bg-sky-50/75">
                                    {form.data[slot.key] ? (
                                        <>
                                            <img src={form.data[slot.key]} alt={slot.label} className="h-full w-full object-contain" />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white/95 text-lg font-black leading-none text-rose-700 shadow-[0_8px_16px_rgba(190,24,93,0.16)]"
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

                <div className="flex justify-end pb-1">
                    <button className={buttonClass('primary')} disabled={form.processing}>
                        {submitLabel}
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}
