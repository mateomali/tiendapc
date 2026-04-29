import { router } from '@inertiajs/react';
import { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface MissingImageItem {
    id: number;
    name: string;
    categoryName: string;
    sku: string;
    isActive: boolean;
    imageStatus: string;
    currentImageUrl?: string | null;
    imagePreviewUrl?: string | null;
    googleQuery: string;
    googleImagesUrl: string;
    notes: string;
    saveAction: string;
    editUrl: string;
    payload: {
        category_id: number | null;
        name: string;
        slug: string;
        sku?: string | null;
        short_description?: string | null;
        description?: string | null;
        price: number;
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
    };
}

interface ProductMissingImagesPageProps {
    items: MissingImageItem[];
    urls: {
        products: string;
    };
}

export default function ProductMissingImagesPage({ items, urls }: ProductMissingImagesPageProps): JSX.Element {
    const [values, setValues] = useState<Record<number, string>>(
        Object.fromEntries(items.map((item) => [item.id, item.currentImageUrl ?? ''])),
    );

    async function save(item: MissingImageItem): Promise<void> {
        const payload = new FormData();
        payload.append('category_id', String(item.payload.category_id ?? 0));
        payload.append('name', item.payload.name);
        payload.append('slug', item.payload.slug);
        payload.append('sku', item.payload.sku ?? '');
        payload.append('short_description', item.payload.short_description ?? '');
        payload.append('description', item.payload.description ?? '');
        payload.append('price', String(item.payload.price ?? 0));
        payload.append('offer_price', item.payload.offer_price === null || item.payload.offer_price === undefined ? '' : String(item.payload.offer_price));
        payload.append('offer_start_at', item.payload.offer_start_at ?? '');
        payload.append('offer_end_at', item.payload.offer_end_at ?? '');
        payload.append('stock', String(item.payload.stock ?? 0));
        payload.append('stock_status', item.payload.stock_status ?? 'instock');
        payload.append('image_url', values[item.id] ?? '');
        payload.append('image_url_2', item.payload.image_url_2 ?? '');
        payload.append('image_url_3', item.payload.image_url_3 ?? '');
        payload.append('is_featured', item.payload.is_featured ? '1' : '0');
        payload.append('is_active', item.payload.is_active ? '1' : '0');

        await window.fetch(item.saveAction, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                Accept: 'application/json',
            },
            body: payload,
        });

        router.reload();
    }

    return (
        <AdminLayout title="Imagenes faltantes">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Catalogo</p>
                    <h2 className={ui.heroTitle}>Productos con imagen faltante</h2>
                    <p className={ui.heroText}>Recupera fotos del catalogo sin salir del flujo de gestion. Puedes pegar URL, revisar Google o abrir la edicion completa.</p>
                </div>
                <div className={ui.heroActions}>
                    <a href={urls.products} className={buttonClass('soft')}>
                        Volver a productos
                    </a>
                </div>
            </section>

            <section className={ui.sectionCard}>
                <div className="grid gap-4">
                    {items.map((item) => (
                        <article key={item.id} className={ui.backupRow}>
                            <div className="grid flex-1 gap-2">
                                <strong>{item.name}</strong>
                                <span>{item.categoryName} | SKU: {item.sku || 'sin sku'}</span>
                                <span>{item.notes || 'Sin notas adicionales'}</span>
                                <div className={ui.mediaActions}>
                                    {item.imagePreviewUrl ? <img src={item.imagePreviewUrl} alt={item.name} className="h-[74px] w-[74px] rounded-2xl object-cover" /> : null}
                                    <input
                                        className={`${ui.input} min-w-[280px] flex-1`}
                                        value={values[item.id] ?? ''}
                                        placeholder="Pegar URL de imagen principal"
                                        onChange={(event) => setValues((current) => ({ ...current, [item.id]: event.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className={ui.inlineActions}>
                                <a href={item.googleImagesUrl} target="_blank" rel="noreferrer" className={buttonClass('soft', 'sm')}>
                                    Buscar imagen
                                </a>
                                <a href={item.editUrl} className={buttonClass('soft', 'sm')}>
                                    Editar completo
                                </a>
                                <button type="button" className={buttonClass('primary', 'sm')} onClick={() => void save(item)}>
                                    Guardar
                                </button>
                            </div>
                        </article>
                    ))}
                    {items.length === 0 ? (
                        <article className={ui.emptyCard}>
                            <h3 className={ui.emptyTitle}>No hay productos sin imagen</h3>
                            <p className={ui.emptyText}>El catalogo visible ya tiene foto principal en todas sus fichas.</p>
                        </article>
                    ) : null}
                </div>
            </section>
        </AdminLayout>
    );
}
