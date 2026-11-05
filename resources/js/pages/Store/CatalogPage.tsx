import { StoreAnnouncements } from '../../components/StoreAnnouncements';
import { Link, router } from '@inertiajs/react';
import type { FocusEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { PaymentMethodsLine } from '../../components/PaymentMethodsLine';
import { SiteLayout } from '../../layouts/SiteLayout';
import type { AnnouncementItem, CatalogCategory, CatalogGroup, CatalogProduct, HeaderSearchState, SharedPageProps } from '../../types';
import {
    catalog,
    catalogActionClass,
    catalogActionIconClass,
    catalogActionsClass,
    catalogBodyClass,
    catalogCardClass,
    catalogCartQtyClass,
    catalogCartQtyClearClass,
    catalogCartQtyShellClass,
    catalogCartQtyTextClass,
    catalogCartQtyTrackClass,
    catalogCategoryRowClass,
    catalogCategoryClass,
    catalogGridClass,
    catalogImageClass,
    catalogImageDetailsPillClass,
    catalogImageLinkClass,
    catalogImageNewBadgeClass,
    catalogImageToneClass,
    catalogNewChipClass,
    catalogOfferRibbonClass,
    catalogOrderButtonClass,
    catalogOrderCurrencyClass,
    catalogOrderFireIconClass,
    catalogOrderIconClass,
    catalogPriceBeforeClass,
    catalogPriceBeforeValueClass,
    catalogPriceBoxClass,
    catalogPriceBoxToneClass,
    catalogPriceClass,
    catalogTitleClass,
    type StoreTone,
} from '../../ui';

interface CatalogPageProps extends SharedPageProps {
    kind: 'catalog';
    previewCardGrid?: boolean;
    headerSearch: HeaderSearchState;
    filters: {
        query: string;
        selectedCategory: string;
        selectedCategories: string[];
        selectedGroup: string;
        order: string;
        onlyNew: boolean;
        onlyOffers: boolean;
        onlyFeatured: boolean;
        clearUrl: string;
        emptyText: string;
        imageRotationMs: number;
    };
    announcements: {
        rotationMs: number;
        items: AnnouncementItem[];
    };
    groups: CatalogGroup[];
    categories: CatalogCategory[];
    products: CatalogProduct[];
    summary: {
        productCount: number;
    };
}

type CatalogCardComponentProps = Omit<CatalogProductCardProps, 'eagerImage'> & {
    eagerImage: boolean;
};

interface CatalogProductCardProps {
    product: CatalogProduct;
    cartUrl: string;
    eagerImage: boolean;
}

interface CatalogToolbarButtonProps {
    ariaLabel: string;
    tooltip: string;
    isActive: boolean;
    onClick: () => void;
    children: JSX.Element | JSX.Element[] | string;
}

type CatalogGridColumns = 'auto' | 1 | 2 | 3 | 4 | 5 | 6;
type MobileCatalogPanel = 'categories' | 'filters' | null;

const catalogGridColumnOptions: CatalogGridColumns[] = [2, 3, 4, 5, 6];
const catalogGridColumnsStorageKey = 'sudoku.catalog.gridColumns';

function notifyCartAdded(): void {
    window.dispatchEvent(new CustomEvent('sudoku:cart-added'));
}

function ClockIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
        </svg>
    );
}

function PriceAscIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="m3 8 4-4 4 4" />
            <path d="M7 4v16" />
            <path d="M13 18h8" />
            <path d="M13 13h6" />
            <path d="M13 8h4" />
        </svg>
    );
}

function PriceDescIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="m3 16 4 4 4-4" />
            <path d="M7 20V4" />
            <path d="M13 8h8" />
            <path d="M13 13h6" />
            <path d="M13 18h4" />
        </svg>
    );
}

function GridColumnsIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <rect x="4" y="5" width="4" height="14" rx="1" />
            <rect x="10" y="5" width="4" height="14" rx="1" />
            <rect x="16" y="5" width="4" height="14" rx="1" />
        </svg>
    );
}

function FilterIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
        </svg>
    );
}

function SortIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M7 4v16" />
            <path d="m4 17 3 3 3-3" />
            <path d="M17 20V4" />
            <path d="m14 7 3-3 3 3" />
        </svg>
    );
}

function CloseIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}

function CartIcon({ size = 14 }: { size?: number }): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 4h2l2.2 9.2a1 1 0 0 0 .97.8h8.98a1 1 0 0 0 .97-.76L20 7H7.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="19" r="1.6" fill="currentColor" />
            <circle cx="17" cy="19" r="1.6" fill="currentColor" />
        </svg>
    );
}

function CashIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 9h1" />
            <path d="M17 15h1" />
        </svg>
    );
}

function SolidCartIcon({ size = 14 }: { size?: number }): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M6.2 6h14.1a1 1 0 0 1 .96 1.27l-1.72 6.08A3 3 0 0 1 16.65 15.5H9.12a3 3 0 0 1-2.91-2.27L4.34 5.75H2.75a1.25 1.25 0 0 1 0-2.5h2.57a1.25 1.25 0 0 1 1.21.95L6.2 6Z" />
            <path d="M8.75 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M17.25 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
    );
}

function ClearIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="M6 6l12 12" />
        </svg>
    );
}

function CatalogToolbarButton({ ariaLabel, tooltip, isActive, onClick, children }: CatalogToolbarButtonProps): JSX.Element {
    return (
        <span className={catalog.tooltipWrap} data-tooltip={tooltip}>
            <button type="button" className={catalogOrderButtonClass(isActive)} aria-label={ariaLabel} title={tooltip} onClick={onClick}>
                {children}
            </button>
        </span>
    );
}

function buildCatalogQuery(
    filters: CatalogPageProps['filters'],
    overrides: Partial<Pick<CatalogPageProps['filters'], 'selectedCategory' | 'selectedCategories' | 'selectedGroup' | 'query' | 'order' | 'onlyNew' | 'onlyOffers' | 'onlyFeatured'>>,
): Record<string, string | number> {
    const nextFilters = {
        selectedCategory: filters.selectedCategory,
        selectedCategories: filters.selectedCategories,
        selectedGroup: filters.selectedGroup,
        query: filters.query,
        order: filters.order,
        onlyNew: filters.onlyNew,
        onlyOffers: filters.onlyOffers,
        onlyFeatured: filters.onlyFeatured,
        ...overrides,
    };

    return {
        ...(nextFilters.selectedCategory !== '' ? { categoria: nextFilters.selectedCategory } : {}),
        ...nextFilters.selectedCategories.reduce<Record<string, string>>((carry, slug, index) => ({ ...carry, [`categorias[${index}]`]: slug }), {}),
        ...(nextFilters.selectedGroup !== '' ? { grupo: nextFilters.selectedGroup } : {}),
        ...(nextFilters.query !== '' ? { q: nextFilters.query } : {}),
        ...(nextFilters.order !== 'fecha_ingreso' ? { orden: nextFilters.order } : {}),
        ...(nextFilters.onlyNew ? { novedades: 1 } : {}),
        ...(nextFilters.onlyOffers ? { ofertas: 1 } : {}),
        ...(nextFilters.onlyFeatured ? { destacados: 1 } : {}),
    };
}

function CatalogProductCard({ product, cartUrl, eagerImage }: CatalogProductCardProps): JSX.Element {
    const [imageIndex, setImageIndex] = useState(0);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);

    useEffect(() => {
        if (!showAddedFeedback) {
            return;
        }

        const timeout = window.setTimeout(() => setShowAddedFeedback(false), 1400);

        return () => window.clearTimeout(timeout);
    }, [showAddedFeedback]);

    const showNextImage = (): void => {
        if (product.images.length <= 1) {
            return;
        }

        setImageIndex((current) => (current + 1) % product.images.length);
    };

    const showFirstImage = (): void => {
        setImageIndex(0);
    };

    const handleCardFocus = (event: FocusEvent<HTMLElement>): void => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            showNextImage();
        }
    };

    const handleCardBlur = (event: FocusEvent<HTMLElement>): void => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            showFirstImage();
        }
    };

    const addToCart = (): void => {
        router.post(
            product.addToCartAction,
            { product_id: product.id, quantity: 1, inline_feedback: true },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddedFeedback(true);
                    notifyCartAdded();
                },
            },
        );
    };

    const activeImage = product.images[imageIndex] ?? product.imageUrl;
    const cardTone: StoreTone = product.hasOffer ? 'offer' : product.isNew ? 'new' : 'regular';

    return (
        <article
            className={catalogCardClass(cardTone, product.cartQty > 0 ? 'max-[860px]:h-[218px] max-[560px]:h-[198px] max-[860px]:[contain-intrinsic-size:218px] max-[560px]:[contain-intrinsic-size:198px]' : undefined)}
            data-testid="catalog-product-card"
            onMouseEnter={showNextImage}
            onMouseLeave={showFirstImage}
            onFocus={handleCardFocus}
            onBlur={handleCardBlur}
        >
            {showAddedFeedback ? (
                <div className="pointer-events-none absolute inset-0 z-[8] grid place-items-center bg-white/18">
                    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[0.78rem] font-black uppercase tracking-[0.035em] text-emerald-800 shadow-[0_8px_20px_rgba(6,78,59,0.16)]">
                        Producto agregado
                    </div>
                </div>
            ) : null}

            {product.hasOffer ? (
                <div className={catalogOfferRibbonClass} aria-label={`Descuento del ${product.discountPercentage}%`}>
                    {'\u{1F525}'}Oferta -{product.discountPercentage}%
                </div>
            ) : null}

            <Link href={product.detailUrl} title={product.name} className={`${catalogImageLinkClass} ${catalogImageToneClass(cardTone)}`} prefetch={['hover', 'click']} cacheFor="30s">
                <img
                    src={activeImage}
                    alt={product.name}
                    className={catalogImageClass}
                    loading={eagerImage ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={eagerImage ? 'high' : 'low'}
                    onError={(event) => {
                        if (event.currentTarget.dataset.fallback) { event.currentTarget.style.visibility = 'hidden'; return; }
                        event.currentTarget.dataset.fallback = 'true';
                        event.currentTarget.src = product.imageFallbackUrl;
                    }}
                />
                {product.isNew ? <span className={`${catalogNewChipClass} ${catalogImageNewBadgeClass}`}>NOVEDAD!</span> : null}
                <span className={catalogImageDetailsPillClass}>Más detalles</span>
            </Link>

            <div className={catalogBodyClass}>
                <div className={catalogCategoryRowClass}>
                    <p className={catalogCategoryClass}>{product.categoryName}</p>
                </div>
                <Link href={product.detailUrl} title={product.name} className={catalogTitleClass} prefetch={['hover', 'click']} cacheFor="30s">
                    {product.name}
                </Link>

                {product.cashPrice ? (
                    <div className="grid justify-items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center leading-tight text-emerald-900">
                        <span className="inline-flex items-center gap-1 text-[0.62rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                            En efectivo
                            <CashIcon />
                        </span>
                        <strong className="catalog-preview-price-font text-[1.74rem] font-black leading-none text-emerald-950 [font-variant-numeric:tabular-nums] max-[560px]:text-[1.42rem]">${product.cashPriceLabel}</strong>
                        <PaymentMethodsLine priceLabel={product.displayPriceLabel} />
                    </div>
                ) : (
                    <div className={`${catalogPriceBoxClass} ${catalogPriceBoxToneClass(cardTone)}`}>
                        {product.hasOffer ? (
                            <>
                                <span className={catalogPriceBeforeClass}>
                                    ANTES <span className={catalogPriceBeforeValueClass}>${product.priceLabel}</span>
                                </span>
                                <strong className={catalogPriceClass}>${product.displayPriceLabel}</strong>
                            </>
                        ) : (
                            <strong className={catalogPriceClass}>${product.displayPriceLabel}</strong>
                        )}
                    </div>
                )}

                <div className={catalogActionsClass}>
                    <button
                        type="button"
                        className={catalogActionClass('primary', 'min-w-0 w-full')}
                        onClick={addToCart}
                    >
                        <span>{showAddedFeedback ? 'Agregado' : 'Agregar'}</span>
                        <span className={catalogActionIconClass} aria-hidden="true">
                            <SolidCartIcon size={14} />
                        </span>
                    </button>
                </div>

                {product.cartQty > 0 ? (
                    <div className={catalogCartQtyShellClass}>
                        <Link href={cartUrl} className={catalogCartQtyClass} aria-label={`Ir al carrito, ${product.cartQtyLabel} en carrito`}>
                            <span className={catalogCartQtyTrackClass}>
                                <span className={catalogCartQtyTextClass}>Ya agregaste {product.cartQtyLabel}</span>
                            </span>
                        </Link>
                        <button
                            type="button"
                            className={catalogCartQtyClearClass}
                            aria-label="Quitar este producto del carrito"
                            onClick={() => router.post(product.removeFromCartAction, { product_id: product.id }, { preserveScroll: true })}
                        >
                            X
                        </button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

function CatalogProductPreviewCard({ product, cartUrl, eagerImage }: CatalogCardComponentProps): JSX.Element {
    const [imageIndex, setImageIndex] = useState(0);
    const [failedImages, setFailedImages] = useState<string[]>([]);
    const [showAddedFeedback, setShowAddedFeedback] = useState(false);

    useEffect(() => {
        if (!showAddedFeedback) {
            return;
        }

        const timeout = window.setTimeout(() => setShowAddedFeedback(false), 1400);

        return () => window.clearTimeout(timeout);
    }, [showAddedFeedback]);

    const showNextImage = (): void => {
        if (product.images.length <= 1) {
            return;
        }

        setImageIndex((current) => (current + 1) % product.images.length);
    };

    const showFirstImage = (): void => {
        setImageIndex(0);
    };

    const handleCardFocus = (event: FocusEvent<HTMLElement>): void => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            showNextImage();
        }
    };

    const handleCardBlur = (event: FocusEvent<HTMLElement>): void => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
            showFirstImage();
        }
    };

    const addToCart = (): void => {
        router.post(
            product.addToCartAction,
            { product_id: product.id, quantity: 1, inline_feedback: true },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowAddedFeedback(true);
                    notifyCartAdded();
                },
            },
        );
    };

    const activeImage = product.images[imageIndex] ?? product.imageUrl;

    return (
        <article
            className="catalog-card group"
            data-testid="catalog-product-card-preview"
            onMouseEnter={showNextImage}
            onMouseLeave={showFirstImage}
            onFocus={handleCardFocus}
            onBlur={handleCardBlur}
        >
            {showAddedFeedback ? (
                <div className="pointer-events-none absolute inset-0 z-[8] grid place-items-center bg-white/18">
                    <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-[0.78rem] font-black uppercase tracking-[0.035em] text-emerald-800 shadow-[0_8px_20px_rgba(6,78,59,0.16)]">
                        Producto agregado
                    </div>
                </div>
            ) : null}

            <Link
                href={product.detailUrl}
                className="catalog-card-image"
                prefetch={['hover', 'click']}
                cacheFor="30s"
            >
                {activeImage === product.imageFallbackUrl || failedImages.includes(activeImage) ? (
                    <span className="catalog-card-placeholder" role="img" aria-label={`Imagen no disponible: ${product.name}`}>
                        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="8" width="34" height="32" rx="3" /><circle cx="18" cy="19" r="3" /><path d="m8 34 10-10 8 8 6-6 9 9" /></svg>
                        <span>Imagen no disponible</span>
                    </span>
                ) : <img
                    src={activeImage}
                    alt={product.name}
                    className="catalog-card-photo"
                    loading={eagerImage ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={eagerImage ? 'high' : 'low'}
                    onError={() => setFailedImages((current) => current.includes(activeImage) ? current : [...current, activeImage])}
                />}

                <div className={`absolute left-2 flex flex-wrap gap-1.5 ${product.cashPrice ? 'top-12 min-[861px]:top-9' : 'top-2'}`}>
                    {product.hasOffer ? (
                        <span className="rounded-md bg-[#d71920] px-2.5 py-1.5 text-xs font-black uppercase leading-none text-white">
                            {product.discountPercentage}% OFF
                        </span>
                    ) : null}
                    {product.isNew && !product.hasOffer ? (
                        <span className="rounded-md border border-sky-200 bg-white/95 px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.025em] text-[#0b6f95]">
                            Nuevo
                        </span>
                    ) : null}
                </div>

                {product.cashPrice ? (
                    <span className="catalog-card-cash-badge"><span className="min-[861px]:hidden">DESCUENTO EN EFECTIVO</span><span className="max-[860px]:hidden">DESCUENTO EN EFECTIVO</span></span>
                ) : null}

            </Link>

            <div className="catalog-card-content">
                <p className="catalog-card-category catalog-preview-title-font">
                    {product.categoryName}
                </p>

                <Link href={product.detailUrl} title={product.name} className="catalog-card-title catalog-preview-title-font" prefetch={['hover', 'click']} cacheFor="30s">
                    {product.name}
                </Link>

                <div className={`catalog-card-price ${product.cashPrice ? 'catalog-card-price-cash' : ''}`}>
                    <div className="catalog-card-price-caption">
                        {product.cashPrice ? <span>En efectivo</span> : null}
                        {product.hasOffer ? <span className="catalog-card-before">Antes <s>${product.priceLabel}</s></span> : null}
                    </div>
                    <strong className="catalog-card-amount catalog-preview-price-font">
                        ${product.cashPrice ? product.cashPriceLabel : product.displayPriceLabel}
                    </strong>
                    <div className="catalog-card-price-secondary">
                        {product.cashPrice ? <span>Otros medios <b>${product.displayPriceLabel}</b></span> : null}
                    </div>
                </div>

                <div className="catalog-card-actions">
                    <button
                        type="button"
                        className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#2456b4] bg-[#2456b4] px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.025em] text-white transition-colors duration-150 hover:bg-[#1d417d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2456b4]"
                        onClick={addToCart}
                    >
                        <span>{showAddedFeedback ? 'Agregado' : 'Agregar'}</span>
                        <span className={catalogActionIconClass} aria-hidden="true">
                            <SolidCartIcon size={14} />
                        </span>
                    </button>

                    {product.cartQty > 0 ? (
                        <div className="grid grid-cols-[minmax(0,1fr)_1.75rem] overflow-hidden rounded-lg border border-[#bfd8ff] bg-[#eff6ff]">
                            <Link href={cartUrl} className="truncate px-2 py-1.5 text-center text-[0.66rem] font-bold uppercase tracking-[0.025em] text-[#2456b4]" aria-label={`Ir al carrito, ${product.cartQtyLabel} en carrito`}>
                                Ya agregaste {product.cartQtyLabel}
                            </Link>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center border-l border-[#bfd8ff] bg-white text-[0.72rem] font-black text-[#b42342] transition-colors duration-150 hover:bg-rose-50"
                                aria-label="Quitar este producto del carrito"
                                onClick={() => router.post(product.removeFromCartAction, { product_id: product.id }, { preserveScroll: true })}
                            >
                                X
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export default function CatalogPage({
    headerSearch,
    filters,
    announcements,
    groups,
    categories,
    products,
    summary,
    layout,
    previewCardGrid = false,
}: CatalogPageProps): JSX.Element {
    const [mobilePanel, setMobilePanel] = useState<MobileCatalogPanel>(null);
    const [mobileFilterDraft, setMobileFilterDraft] = useState({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    useEffect(() => {
        if (mobilePanel === 'filters') setMobileFilterDraft({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    }, [mobilePanel, filters.onlyOffers, filters.onlyNew, filters.onlyFeatured]);
    const mobileDialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = mobileDialogRef.current;
        if (!dialog) return;
        if (mobilePanel && !dialog.open) dialog.showModal();
        if (!mobilePanel && dialog.open) dialog.close();
        const previousOverflow = document.body.style.overflow;
        if (mobilePanel) document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [mobilePanel]);

    const [gridColumns, setGridColumns] = useState<CatalogGridColumns>(() => {
        if (typeof window === 'undefined') {
            return 'auto';
        }

        const savedColumns = Number.parseInt(window.localStorage.getItem(catalogGridColumnsStorageKey) ?? '', 10);
        return catalogGridColumnOptions.includes(savedColumns as CatalogGridColumns) ? (savedColumns as CatalogGridColumns) : 'auto';
    });
    const selectedCategoryItem = categories.find((category) => category.slug === filters.selectedCategory);
    const activeGroupKey = filters.selectedGroup !== '' ? filters.selectedGroup : selectedCategoryItem?.groupKey ?? '';
    const ProductCard = previewCardGrid ? CatalogProductPreviewCard : CatalogProductCard;
    const activeFilters: { label: string; clear: () => void }[] = [];
    if (filters.query.trim()) activeFilters.push({ label: `Buscar: ${filters.query}`, clear: () => goToCatalogFilters({ query: '' }) });
    if (activeGroupKey) activeFilters.push({ label: groups.find((group) => group.key === activeGroupKey)?.label ?? activeGroupKey, clear: () => goToCatalogFilters({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }) });
    const categorySlugs = [...new Set([filters.selectedCategory, ...filters.selectedCategories].filter(Boolean))];
    categorySlugs.forEach((slug) => activeFilters.push({
        label: categories.find((category) => category.slug === slug)?.name ?? slug,
        clear: () => goToCatalogFilters({ selectedCategory: filters.selectedCategory === slug ? '' : filters.selectedCategory, selectedCategories: filters.selectedCategories.filter((value) => value !== slug) }),
    }));
    if (filters.onlyOffers) activeFilters.push({ label: 'Ofertas', clear: () => goToCatalogFilters({ onlyOffers: false }) });
    if (filters.onlyNew) activeFilters.push({ label: 'Novedades', clear: () => goToCatalogFilters({ onlyNew: false }) });
    if (filters.onlyFeatured) activeFilters.push({ label: 'Destacados', clear: () => goToCatalogFilters({ onlyFeatured: false }) });


    const updateGridColumns = (columns: CatalogGridColumns): void => {
        setGridColumns(columns);
        window.localStorage.setItem(catalogGridColumnsStorageKey, String(columns));
    };

    const goToCatalogFilters = (
        overrides: Partial<Pick<CatalogPageProps['filters'], 'selectedCategory' | 'selectedCategories' | 'selectedGroup' | 'query' | 'order' | 'onlyNew' | 'onlyOffers' | 'onlyFeatured'>>,
    ): void => {
        router.get(filters.clearUrl, buildCatalogQuery(filters, overrides), { preserveScroll: true, preserveState: true });
    };

    const selectCatalogCategory = (selection: Pick<CatalogPageProps['filters'], 'selectedGroup' | 'selectedCategory' | 'selectedCategories'>): void => {
        goToCatalogFilters({ ...selection, query: '', order: 'fecha_ingreso', onlyNew: false, onlyOffers: false, onlyFeatured: false });
    };

    const [desktopGroup, setDesktopGroup] = useState(activeGroupKey || groups[0]?.key || '');
    const [desktopFilterDraft, setDesktopFilterDraft] = useState({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0, maxHeight: 400 });
    const desktopToolbarRef = useRef<HTMLDivElement>(null);
    const [desktopCategoriesVisible, setDesktopCategoriesVisible] = useState(false);
    useEffect(() => {
        const controls = desktopToolbarRef.current?.querySelector('.desktop-catalog-actions');
        const header = document.querySelector('header');
        if (!controls || !header) return;

        let observer: IntersectionObserver | null = null;
        const syncVisibility = (): void => {
            observer?.disconnect();
            const headerBottom = header.getBoundingClientRect().bottom;
            const desktop = window.matchMedia('(min-width: 861px)').matches;
            setDesktopCategoriesVisible(desktop && controls.getBoundingClientRect().bottom <= headerBottom);
            if (!desktop) return;
            observer = new IntersectionObserver(([entry]) => {
                setDesktopCategoriesVisible(entry.boundingClientRect.bottom <= headerBottom);
            }, { rootMargin: `-${headerBottom}px 0px 0px 0px`, threshold: 0 });
            observer.observe(controls);
        };
        syncVisibility();
        const resizeObserver = new ResizeObserver(syncVisibility);
        resizeObserver.observe(header);
        window.addEventListener('resize', syncVisibility);
        return () => {
            observer?.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener('resize', syncVisibility);
        };
    }, []);
    const positionPopover = (button: HTMLButtonElement, width: number, categoriesMenu = false): void => {
        const rect = button.getBoundingClientRect();
        const left = categoriesMenu ? desktopToolbarRef.current?.getBoundingClientRect().left ?? rect.left : rect.left;
        const top = Math.max(rect.bottom, button.closest('header')?.getBoundingClientRect().bottom ?? rect.bottom) + 8;
        setPopoverPosition({ top, left: Math.max(16, Math.min(left, window.innerWidth - width - 16)), maxHeight: Math.max(0, window.innerHeight - top - 16) });
    };
    const closeDesktopPopover = (id: string): void => { document.getElementById(id)?.hidePopover(); };
    useEffect(() => {
        const dismissPopovers = (): void => {
            for (const id of ['desktop-categories', 'desktop-filters', 'desktop-view']) {
                const panel = document.getElementById(id);
                if (panel?.matches(':popover-open')) panel.hidePopover();
            }
        };
        window.addEventListener('scroll', dismissPopovers, { passive: true });
        window.addEventListener('resize', dismissPopovers);
        return () => { window.removeEventListener('scroll', dismissPopovers); window.removeEventListener('resize', dismissPopovers); };
    }, []);

    return (
        <SiteLayout
            title="Productos"
            onOpenCategories={() => setMobilePanel('categories')}
            onOpenDesktopCategories={(button) => { setDesktopGroup(activeGroupKey || groups[0]?.key || ''); positionPopover(button, 860); }}
            desktopCategoriesVisible={desktopCategoriesVisible}
            headerSearch={headerSearch}
            announcementMode="catalogLegacy"
        >
            <section className={`${catalog.layout} catalog-font-scope`}>
                <div className={catalog.layoutMain}>
                    <section className="mobile-catalog-controls" aria-label="Controles del catálogo">
                        <div className="catalog-toolbar-heading">
                            <h2><span>Explorar productos</span></h2>
                            <p role="status">{summary.productCount} {summary.productCount === 1 ? 'producto' : 'productos'}</p>
                        </div>
                        <div className="mobile-catalog-buttons">
                            <button type="button" onClick={() => setMobilePanel('categories')} aria-haspopup="dialog" aria-controls="catalog-mobile-panel">
                                <GridColumnsIcon /><span>Categorías</span>
                            </button>
                            <button type="button" onClick={() => setMobilePanel('filters')} aria-haspopup="dialog" aria-controls="catalog-mobile-panel">
                                <FilterIcon /><span>Filtros{[filters.onlyNew, filters.onlyOffers, filters.onlyFeatured].filter(Boolean).length > 0 ? ` (${[filters.onlyNew, filters.onlyOffers, filters.onlyFeatured].filter(Boolean).length})` : ''}</span>
                            </button>
                        </div>
                        <div className="mobile-catalog-order">
                            <SortIcon /><label htmlFor="mobile-catalog-order">Ordenar por</label>
                            <select id="mobile-catalog-order" value={filters.order} onChange={(event) => goToCatalogFilters({ order: event.currentTarget.value })}>
                                <option value="fecha_ingreso">Más recientes</option>
                                <option value="precio_asc">Menor precio</option>
                                <option value="precio_desc">Mayor precio</option>
                            </select>
                        </div>
                    </section>
                    <dialog ref={mobileDialogRef} id="catalog-mobile-panel" className={`mobile-catalog-dialog ${mobilePanel === 'categories' ? 'is-categories' : ''}`} aria-labelledby="catalog-mobile-panel-title" onCancel={() => setMobilePanel(null)} onClose={() => setMobilePanel(null)} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setMobilePanel(null); } }}>
                        <div className="mobile-catalog-dialog-header">
                            <h2 id="catalog-mobile-panel-title">{mobilePanel === 'categories' ? 'Categorías' : 'Filtros'}</h2>
                            <button type="button" onClick={() => setMobilePanel(null)} aria-label="Cerrar panel">×</button>
                        </div>
                        <div className="mobile-catalog-dialog-body">
                            {mobilePanel === 'categories' ? (
                                <>
                                    <button type="button" className="mobile-category-all" onClick={() => { selectCatalogCategory({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }); setMobilePanel(null); }}>TODAS LAS CATEGORÍAS</button>
                                    {groups.map((group) => (
                                        <details key={group.key} open={activeGroupKey === group.key ? true : undefined}>
                                            <summary>{group.label.toLocaleUpperCase('es')}<span>{group.productCount}</span></summary>
                                            <div className="mobile-category-links">
                                                <button type="button" aria-pressed={activeGroupKey === group.key && !filters.selectedCategory} onClick={() => { selectCatalogCategory({ selectedGroup: group.key, selectedCategory: '', selectedCategories: [] }); setMobilePanel(null); }}>VER TODO EN {group.label.toLocaleUpperCase('es')}</button>
                                                {categories.filter((category) => category.groupKey === group.key).map((category) => (
                                                    <button type="button" key={category.id} aria-pressed={filters.selectedCategory === category.slug || filters.selectedCategories.includes(category.slug)} onClick={() => { selectCatalogCategory({ selectedGroup: group.key, selectedCategory: category.slug, selectedCategories: [] }); setMobilePanel(null); }}>
                                                        <span>{category.name.toLocaleUpperCase('es')}</span><span>{category.productCount}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </details>
                                    ))}
                                    <nav className="mobile-category-navigation" aria-label="Secciones de la tienda">
                                        {layout.navItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobilePanel(null)}>{item.label}</Link>)}
                                        <a href={layout.repairUrl}>Reparaciones</a>
                                    </nav>
                                </>
                            ) : (
                                <div className="mobile-filter-options">
                                    <p>Mostrar productos</p>
                                    <label><input type="checkbox" checked={mobileFilterDraft.onlyOffers} onChange={(event) => setMobileFilterDraft({ ...mobileFilterDraft, onlyOffers: event.currentTarget.checked })} />Ofertas</label>
                                    <label><input type="checkbox" checked={mobileFilterDraft.onlyNew} onChange={(event) => setMobileFilterDraft({ ...mobileFilterDraft, onlyNew: event.currentTarget.checked })} />Novedades</label>
                                    <label><input type="checkbox" checked={mobileFilterDraft.onlyFeatured} onChange={(event) => setMobileFilterDraft({ ...mobileFilterDraft, onlyFeatured: event.currentTarget.checked })} />Destacados</label>
                                    <button type="button" className="mobile-filters-reset" onClick={() => setMobileFilterDraft({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}>Quitar filtros de productos</button>
                                </div>
                            )}
                        </div>
                        <button type="button" className="mobile-catalog-dialog-done" onClick={() => { if (mobilePanel === 'filters') goToCatalogFilters(mobileFilterDraft); setMobilePanel(null); }}>{mobilePanel === 'filters' ? 'Aplicar filtros' : `Ver ${summary.productCount} productos`}</button>
                    </dialog>

                    <section className={catalog.results}>
                        <div className="desktop-catalog-toolbar" ref={desktopToolbarRef} aria-label="Controles del catálogo en escritorio">
                            <div className="catalog-toolbar-heading">
                                <h2><span>Explorar productos</span></h2>
                                <p className="desktop-catalog-count" role="status"><strong>{summary.productCount}</strong> {summary.productCount === 1 ? 'producto' : 'productos'}</p>
                            </div>
                            <div className="desktop-catalog-actions">
                                <button type="button" popoverTarget="desktop-categories" onClick={(event) => { setDesktopGroup(activeGroupKey || groups[0]?.key || ''); positionPopover(event.currentTarget, 860, true); }}><GridColumnsIcon />Categorías<span aria-hidden="true">⌄</span></button>
                                <button type="button" popoverTarget="desktop-filters" onClick={(event) => { setDesktopFilterDraft({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured }); positionPopover(event.currentTarget, 300); }}><FilterIcon />Filtros{[filters.onlyOffers, filters.onlyNew, filters.onlyFeatured].filter(Boolean).length > 0 ? ` (${[filters.onlyOffers, filters.onlyNew, filters.onlyFeatured].filter(Boolean).length})` : ''}</button>
                                <label className="desktop-catalog-order" htmlFor="desktop-catalog-order"><SortIcon /><span>Ordenar por</span>
                                    <select id="desktop-catalog-order" value={filters.order} onChange={(event) => goToCatalogFilters({ order: event.currentTarget.value })}>
                                        <option value="fecha_ingreso">Más recientes</option>
                                        <option value="precio_asc">Menor precio</option>
                                        <option value="precio_desc">Mayor precio</option>
                                    </select>
                                </label>
                                <button type="button" popoverTarget="desktop-view" onClick={(event) => positionPopover(event.currentTarget, 220)}><GridColumnsIcon />Vista</button>
                            </div>
                        </div>
                        <div id="desktop-categories" popover="auto" className="desktop-catalog-popover desktop-category-menu" style={popoverPosition} role="dialog" aria-label="Categorías del catálogo">
                            <div className="desktop-popover-header"><h2>Categorías</h2><button type="button" popoverTarget="desktop-categories" popoverTargetAction="hide" aria-label="Cerrar categorías">×</button></div>
                            <div className="desktop-category-columns">
                                <div className="desktop-category-groups" role="group" aria-label="Rubros">
                                    {groups.map((group) => <button type="button" key={group.key} aria-pressed={desktopGroup === group.key} onClick={() => setDesktopGroup(group.key)}><span>{group.label.toLocaleUpperCase('es')}</span><span>{group.productCount}</span></button>)}
                                    <button type="button" className="desktop-all-categories" onClick={() => { selectCatalogCategory({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}>TODAS LAS CATEGORÍAS</button>
                                </div>
                                <div className="desktop-category-options">
                                    <button type="button" className="desktop-category-heading" onClick={() => { selectCatalogCategory({ selectedGroup: desktopGroup, selectedCategory: '', selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}>VER TODO EN {groups.find((group) => group.key === desktopGroup)?.label.toLocaleUpperCase('es')}<span aria-hidden="true">→</span></button>
                                    <div className="desktop-category-links">
                                        {categories.filter((category) => category.groupKey === desktopGroup).map((category) => <button type="button" key={category.id} aria-pressed={filters.selectedCategory === category.slug || filters.selectedCategories.includes(category.slug)} onClick={() => { selectCatalogCategory({ selectedGroup: category.groupKey, selectedCategory: category.slug, selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}><span>{category.name.toLocaleUpperCase('es')}</span><span>{category.productCount}</span></button>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="desktop-filters" popover="auto" className="desktop-catalog-popover desktop-filter-menu" style={popoverPosition} role="dialog" aria-label="Filtros del catálogo">
                            <div className="desktop-popover-header"><h2>Filtros</h2><button type="button" popoverTarget="desktop-filters" popoverTargetAction="hide" aria-label="Cerrar filtros">×</button></div>
                            <div className="desktop-filter-options">
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyOffers} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyOffers: event.currentTarget.checked })} />Ofertas</label>
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyNew} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyNew: event.currentTarget.checked })} />Novedades</label>
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyFeatured} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyFeatured: event.currentTarget.checked })} />Destacados</label>
                                <button type="button" className="desktop-filter-reset" onClick={() => setDesktopFilterDraft({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}>Quitar filtros de productos</button>
                                <button type="button" className="desktop-filter-apply" onClick={() => { goToCatalogFilters(desktopFilterDraft); closeDesktopPopover('desktop-filters'); }}>Aplicar filtros</button>
                            </div>
                        </div>
                        <div id="desktop-view" popover="auto" className="desktop-catalog-popover desktop-view-menu" style={popoverPosition} role="dialog" aria-label="Vista del catálogo">
                            <label htmlFor="desktop-grid-columns">Productos por fila</label>
                            <select id="desktop-grid-columns" aria-label="Cantidad de productos por fila" value={gridColumns} onChange={(event) => updateGridColumns(event.currentTarget.value === 'auto' ? 'auto' : Number.parseInt(event.currentTarget.value, 10) as CatalogGridColumns)}>
                                <option value="auto">Automático</option>
                                {catalogGridColumnOptions.map((columns) => <option key={columns} value={columns}>{columns} columnas</option>)}
                            </select>
                        </div>

                        {activeFilters.length > 0 ? (
                            <div className="catalog-active-filters" aria-label="Filtros activos">
                                <span>Filtros activos:</span>
                                {activeFilters.map((filter) => (
                                    <button key={filter.label} type="button" onClick={filter.clear} aria-label={`Quitar filtro: ${filter.label}`}>
                                        <span>{filter.label}</span><span aria-hidden="true">×</span>
                                    </button>
                                ))}
                                <button type="button" className="catalog-clear-all" onClick={() => router.get(filters.clearUrl)}>Limpiar filtros</button>
                            </div>
                        ) : null}
                        <StoreAnnouncements announcements={announcements} announcementMode="catalogLegacy" />
                        {products.length > 0 ? (
                            <section className={catalogGridClass(gridColumns)}>
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} cartUrl={layout.cartUrl} eagerImage={index < 8} />
                                ))}
                            </section>
                        ) : (
                            <section className={`${catalog.empty} catalog-empty-state`}>
                                <h2>No encontramos productos para ese filtro.</h2>
                                <p>{filters.emptyText}</p>
                                <button type="button" className={catalogActionClass('primary')} onClick={() => router.get(filters.clearUrl)}>
                                    Ver todos los productos
                                </button>
                            </section>
                        )}
                    </section>
                </div>
            </section>
        </SiteLayout>
    );
}
