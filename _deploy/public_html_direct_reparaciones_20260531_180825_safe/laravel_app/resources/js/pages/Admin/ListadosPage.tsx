import { router } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, tagChipClass, ui } from '../../ui';
import { formatCurrency } from '../../utils';

interface ListingCategory {
    id: number;
    name: string;
    productCount: number;
}

interface ListingRow {
    id: number;
    categoryId: number;
    name: string;
    categoryName: string;
    imageUrl?: string | null;
    price: number;
    priceLabel: string;
    hasOffer: boolean;
    isFeatured: boolean;
}

interface ListadosPageProps {
    filters: {
        query: string;
        includeAllCategories: boolean;
        selectedCategoryIds: number[];
        excludedProductIds: number[];
        onlyOffers: boolean;
        onlyFeatured: boolean;
    };
    categories: ListingCategory[];
    rows: ListingRow[];
    urls: {
        index: string;
        print: string;
        thumbBase: string;
    };
}

export default function ListadosPage({ filters, categories, rows, urls }: ListadosPageProps): JSX.Element {
    const [query, setQuery] = useState(filters.query);
    const [includeAllCategories, setIncludeAllCategories] = useState(filters.includeAllCategories);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(filters.selectedCategoryIds);
    const [excludedProductIds, setExcludedProductIds] = useState<number[]>(filters.excludedProductIds);
    const [onlyOffers, setOnlyOffers] = useState(filters.onlyOffers);
    const [onlyFeatured, setOnlyFeatured] = useState(filters.onlyFeatured);

    const visibleRows = useMemo(() => rows.filter((row) => !excludedProductIds.includes(row.id)), [excludedProductIds, rows]);

    function submit(event?: FormEvent<HTMLFormElement>): void {
        event?.preventDefault();
        router.get(urls.index, {
            q: query || undefined,
            todas: includeAllCategories ? 1 : undefined,
            categorias: selectedCategoryIds,
            excluir: excludedProductIds,
            ofertas: onlyOffers ? 1 : undefined,
            destacados: onlyFeatured ? 1 : undefined,
        });
    }

    return (
        <AdminLayout title="Listados">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Impresion</p>
                    <h2 className={ui.heroTitle}>Listados de catalogo</h2>
                    <p className={ui.heroText}>Selecciona categorias, ofertas, destacados y exclusiones para preparar la salida imprimible del catalogo.</p>
                </div>
                <div className={ui.heroActions}>
                    <a
                        href={`${urls.print}?${new URLSearchParams({
                            q: query,
                            todas: includeAllCategories ? '1' : '',
                            ofertas: onlyOffers ? '1' : '',
                            destacados: onlyFeatured ? '1' : '',
                            ...selectedCategoryIds.reduce<Record<string, string>>((carry, id, index) => ({ ...carry, [`categorias[${index}]`]: String(id) }), {}),
                            ...excludedProductIds.reduce<Record<string, string>>((carry, id, index) => ({ ...carry, [`excluir[${index}]`]: String(id) }), {}),
                        }).toString()}`}
                        className={buttonClass('primary')}
                    >
                        Version imprimir
                    </a>
                </div>
            </section>

            <section className={ui.sectionCard}>
                <form className={ui.dashboardGrid} onSubmit={submit}>
                    <div className={ui.field}>
                        <label className={ui.fieldLabel}>Buscar</label>
                        <input className={ui.input} value={query} onChange={(event) => setQuery(event.target.value)} />
                    </div>
                    <div className={ui.mediaActions}>
                        <label className={ui.checkboxLine}>
                            <input type="checkbox" checked={includeAllCategories} onChange={(event) => setIncludeAllCategories(event.target.checked)} />
                            <span>Todas las categorias</span>
                        </label>
                        <label className={ui.checkboxLine}>
                            <input type="checkbox" checked={onlyOffers} onChange={(event) => setOnlyOffers(event.target.checked)} />
                            <span>Solo ofertas</span>
                        </label>
                        <label className={ui.checkboxLine}>
                            <input type="checkbox" checked={onlyFeatured} onChange={(event) => setOnlyFeatured(event.target.checked)} />
                            <span>Solo destacados</span>
                        </label>
                        <button className={buttonClass('soft')}>Aplicar filtros</button>
                    </div>
                    <div className={ui.fieldWide}>
                        <label className={ui.fieldLabel}>Categorias incluidas</label>
                        <div className={ui.tagCloud}>
                            {categories.map((category) => {
                                const selected = selectedCategoryIds.includes(category.id);

                                return (
                                    <button
                                        key={category.id}
                                        type="button"
                                        className={tagChipClass(selected)}
                                        onClick={() =>
                                            setSelectedCategoryIds((current) =>
                                                current.includes(category.id)
                                                    ? current.filter((value) => value !== category.id)
                                                    : [...current, category.id],
                                            )
                                        }
                                    >
                                        {category.name} ({category.productCount})
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </form>
            </section>

            <section className={ui.sectionCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Vista previa</p>
                        <h3 className={ui.cardTitle}>{visibleRows.length} productos visibles</h3>
                    </div>
                </div>
                <div className={ui.mediaGrid}>
                    {visibleRows.map((row) => (
                        <article key={row.id} className={ui.mediaItem}>
                            <div className={ui.mediaThumbWrap}>
                                {row.imageUrl ? <img src={`${urls.thumbBase}?src=${encodeURIComponent(row.imageUrl)}`} alt={row.name} className="h-full w-full object-cover" /> : <div className={ui.mediaThumbFallback}>Sin foto</div>}
                            </div>
                            <div className={ui.mediaBody}>
                                <h3>{row.name}</h3>
                                <p className={ui.inlineCaption}>{row.categoryName}</p>
                                <p className={ui.inlineCaption}>
                                    {row.hasOffer ? 'Oferta activa' : 'Precio regular'} | {row.isFeatured ? 'Destacado' : 'Comun'}
                                </p>
                                <div className={ui.mediaActions}>
                                    <strong>{formatCurrency(row.price)}</strong>
                                    <button
                                        type="button"
                                        className={buttonClass('danger', 'sm')}
                                        onClick={() =>
                                            setExcludedProductIds((current) =>
                                                current.includes(row.id) ? current.filter((value) => value !== row.id) : [...current, row.id],
                                            )
                                        }
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </AdminLayout>
    );
}
