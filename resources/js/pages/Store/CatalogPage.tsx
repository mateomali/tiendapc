import { Link, router } from '@inertiajs/react';
import type { FocusEvent } from 'react';
import { useEffect, useState } from 'react';
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

type CatalogGridColumns = 1 | 2 | 3 | 4 | 5 | 6;
type MobileCatalogPanel = 'filters' | 'sort' | null;

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

            <Link href={product.detailUrl} className={`${catalogImageLinkClass} ${catalogImageToneClass(cardTone)}`} prefetch={['hover', 'click']} cacheFor="30s">
                <img
                    src={activeImage}
                    alt={product.name}
                    className={catalogImageClass}
                    loading={eagerImage ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={eagerImage ? 'high' : 'low'}
                    onError={(event) => {
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
                <Link href={product.detailUrl} className={catalogTitleClass} prefetch={['hover', 'click']} cacheFor="30s">
                    {product.name}
                </Link>

                {product.cashPrice ? (
                    <div className="grid justify-items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-center leading-tight text-emerald-900">
                        <span className="inline-flex items-center gap-1 text-[0.62rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                            Oferta en efectivo
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
                        <span>Agregar</span>
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
            className="group relative grid min-h-[248px] overflow-hidden rounded-[0.75rem] border border-slate-200 bg-white text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-colors duration-150 hover:border-[#2456b4]/45 max-[860px]:min-h-[176px] max-[860px]:grid-cols-[42%_minmax(0,1fr)]"
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
                className="relative flex min-h-[178px] items-center justify-center overflow-hidden bg-[#f8fafc] p-3 ring-1 ring-slate-100 max-[860px]:min-h-0 max-[860px]:p-2"
                prefetch={['hover', 'click']}
                cacheFor="30s"
            >
                <img
                    src={activeImage}
                    alt={product.name}
                    className="h-full max-h-[220px] w-full object-contain transition duration-150 group-hover:scale-[1.015] max-[860px]:max-h-[160px]"
                    loading={eagerImage ? 'eager' : 'lazy'}
                    decoding="async"
                    fetchPriority={eagerImage ? 'high' : 'low'}
                    onError={(event) => {
                        event.currentTarget.src = product.imageFallbackUrl;
                    }}
                />

                <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                    {product.hasOffer ? (
                        <span className="rounded-md bg-[#d71920] px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.025em] text-white">
                            -{product.discountPercentage}% 🔥
                        </span>
                    ) : null}
                    {product.isNew ? (
                        <span className="rounded-md border border-sky-200 bg-white/95 px-2 py-1 text-[0.64rem] font-black uppercase tracking-[0.025em] text-[#0b6f95]">
                            Nuevo
                        </span>
                    ) : null}
                </div>

                <span className={catalogImageDetailsPillClass}>Más detalles</span>
            </Link>

            <div className="grid min-w-0 content-start gap-2 p-3 max-[860px]:gap-1.5 max-[860px]:p-2.5">
                <p className="catalog-preview-title-font m-0 min-w-0 truncate text-[0.68rem] font-[500] uppercase tracking-[0.04em] text-slate-500 max-[560px]:text-[0.6rem]">
                    {product.categoryName}
                </p>

                <Link href={product.detailUrl} className="catalog-preview-title-font line-clamp-2 min-h-[2.4rem] text-[0.96rem] font-[400] uppercase leading-[1.22] text-slate-950 no-underline max-[560px]:min-h-[2.05rem] max-[560px]:text-[0.84rem]" prefetch={['hover', 'click']} cacheFor="30s">
                    {product.name}
                </Link>

                <div className="mt-1 grid justify-items-center gap-0.5 text-center">
                    {product.hasOffer ? (
                        <span className="catalog-preview-price-font text-[0.72rem] font-bold uppercase tracking-[0.025em] text-slate-400">
                            Antes <span className="line-through">${product.priceLabel}</span>
                        </span>
                    ) : null}
                    {product.cashPrice ? (
                        <div className="grid w-full justify-items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 leading-tight text-emerald-900">
                            <span className="inline-flex items-center gap-1 text-[0.58rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                                Oferta en efectivo
                                <CashIcon />
                            </span>
                            <strong className="catalog-preview-price-font text-[1.62rem] font-black leading-none text-emerald-950 [font-variant-numeric:tabular-nums] max-[560px]:text-[1.34rem]">${product.cashPriceLabel}</strong>
                            <PaymentMethodsLine priceLabel={product.displayPriceLabel} />
                        </div>
                    ) : (
                        <strong className="catalog-preview-price-font text-[1.78rem] font-extrabold leading-none text-black [font-variant-numeric:tabular-nums] max-[860px]:text-[1.55rem] max-[560px]:text-[1.34rem]">
                            ${product.displayPriceLabel}
                        </strong>
                    )}
                </div>

                <div className="mt-auto grid gap-1.5 pt-1">
                    <button
                        type="button"
                        className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#2456b4] bg-[#2456b4] px-3 py-2 text-[0.72rem] font-black uppercase tracking-[0.025em] text-white transition-colors duration-150 hover:bg-[#1d417d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2456b4]"
                        onClick={addToCart}
                    >
                        <span>Agregar</span>
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
    const [gridColumns, setGridColumns] = useState<CatalogGridColumns>(() => {
        if (typeof window === 'undefined') {
            return 4;
        }

        const savedColumns = Number.parseInt(window.localStorage.getItem(catalogGridColumnsStorageKey) ?? '', 10);
        return catalogGridColumnOptions.includes(savedColumns as CatalogGridColumns) ? (savedColumns as CatalogGridColumns) : 4;
    });
    const selectedCategoryItem = categories.find((category) => category.slug === filters.selectedCategory);
    const activeGroupKey = filters.selectedGroup !== '' ? filters.selectedGroup : selectedCategoryItem?.groupKey ?? '';
    const visibleCategories = activeGroupKey === '' ? categories : categories.filter((category) => category.groupKey === activeGroupKey);
    const isFiltered = activeGroupKey !== '' || filters.selectedCategory !== '' || filters.selectedCategories.length > 0 || filters.onlyNew || filters.onlyOffers || filters.onlyFeatured || filters.order !== 'fecha_ingreso';
    const ProductCard = previewCardGrid ? CatalogProductPreviewCard : CatalogProductCard;

    const updateGridColumns = (columns: CatalogGridColumns): void => {
        setGridColumns(columns);
        window.localStorage.setItem(catalogGridColumnsStorageKey, String(columns));
    };

    const goToCatalogFilters = (
        overrides: Partial<Pick<CatalogPageProps['filters'], 'selectedCategory' | 'selectedCategories' | 'selectedGroup' | 'query' | 'order' | 'onlyNew' | 'onlyOffers' | 'onlyFeatured'>>,
    ): void => {
        router.get(filters.clearUrl, buildCatalogQuery(filters, overrides), { preserveScroll: true, preserveState: true });
    };

    const toggleCatalogFlag = (flag: 'onlyNew' | 'onlyOffers'): void => {
        if (flag === 'onlyNew') {
            const nextOnlyNew = !filters.onlyNew;
            goToCatalogFilters({
                onlyNew: nextOnlyNew,
                onlyOffers: false,
                onlyFeatured: false,
            });
            return;
        }

        const nextOnlyOffers = !filters.onlyOffers;
        goToCatalogFilters({
            onlyOffers: nextOnlyOffers,
            onlyNew: false,
            onlyFeatured: false,
        });
    };

    const applyMobileProductFilter = (filter: 'offers' | 'all'): void => {
        if (filter === 'all') {
            router.get(filters.clearUrl, {}, { preserveScroll: true, preserveState: false });
            setMobilePanel(null);
            return;
        }

        router.get(filters.clearUrl, buildCatalogQuery(filters, {
            selectedGroup: '',
            selectedCategory: '',
            selectedCategories: [],
            onlyNew: false,
            onlyOffers: filter === 'offers',
            onlyFeatured: false,
        }), { preserveScroll: true, preserveState: false });
        setMobilePanel(null);
    };

    const renderCatalogToolbarLeft = (idPrefix: string): JSX.Element => (
        <div className={catalog.toolbarLeft}>
            <div className={catalog.toolbarSegment}>
                <label htmlFor={`${idPrefix}-catalog-group`} className="sr-only">
                    CATEGORIA
                </label>
                <select
                    id={`${idPrefix}-catalog-group`}
                    data-testid="catalog-group-select"
                    className={catalog.select}
                    title="Filtra productos por rubro principal"
                    value={activeGroupKey}
                    onChange={(event) => {
                        const nextGroupKey = event.currentTarget.value;
                        goToCatalogFilters({
                            selectedGroup: nextGroupKey,
                            selectedCategory: '',
                            selectedCategories: [],
                        });
                    }}
                >
                    <option value="">TODAS</option>
                    {groups.map((group) => (
                        <option key={group.key} value={group.key}>
                            {group.label}
                        </option>
                    ))}
                </select>
            </div>

            {activeGroupKey !== '' ? (
                <div className={catalog.toolbarSubcategory}>
                    <label htmlFor={`${idPrefix}-catalog-category`} className="sr-only">
                        SUBCATEGORIA
                    </label>
                    <select
                        id={`${idPrefix}-catalog-category`}
                        data-testid="catalog-subcategory-select"
                        className={catalog.select}
                        title="Afina el listado dentro de la categoria elegida"
                        value={filters.selectedCategory}
                        onChange={(event) => {
                            const selectedSlug = event.currentTarget.value;
                            const selected = categories.find((category) => category.slug === selectedSlug);

                            goToCatalogFilters({
                                selectedGroup: selected?.groupKey ?? activeGroupKey,
                                selectedCategory: selectedSlug,
                                selectedCategories: [],
                            });
                        }}
                    >
                        <option value="">TODAS</option>
                        {visibleCategories.map((category) => (
                            <option key={category.id} value={category.slug}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : null}
        </div>
    );

    const renderCatalogToolbarRight = (idPrefix: string): JSX.Element => (
        <div className={catalog.toolbarRight}>
            <form className={catalog.orderForm} onSubmit={(event) => event.preventDefault()}>
                <label htmlFor={`${idPrefix}-catalog-order-buttons`} className={catalog.orderLabel}>ORDEN</label>
                <div id={`${idPrefix}-catalog-order-buttons`} className={catalog.orderToggle} role="group" aria-label="Filtros y orden del catálogo">
                    <CatalogToolbarButton
                        ariaLabel="Mostrar novedades"
                        tooltip="Mostrar productos nuevos"
                        isActive={filters.onlyNew}
                        onClick={() => toggleCatalogFlag('onlyNew')}
                    >
                        <span className={catalogOrderIconClass}>
                            <ClockIcon />
                        </span>
                        <span>Novedades</span>
                    </CatalogToolbarButton>

                    <CatalogToolbarButton
                        ariaLabel="Mostrar ofertas"
                        tooltip="Mostrar productos en oferta"
                        isActive={filters.onlyOffers}
                        onClick={() => toggleCatalogFlag('onlyOffers')}
                    >
                        <span className={catalogOrderFireIconClass} aria-hidden="true">
                            {'\u{1F525}'}
                        </span>
                        <span>Ofertas</span>
                    </CatalogToolbarButton>

                    <CatalogToolbarButton
                        ariaLabel="Ordenar por precio ascendente"
                        tooltip="Ordenar de menor a mayor precio"
                        isActive={filters.order === 'precio_asc'}
                        onClick={() => goToCatalogFilters({ order: filters.order === 'precio_asc' ? 'fecha_ingreso' : 'precio_asc' })}
                    >
                        <span className={catalogOrderCurrencyClass}>$</span>
                        <span className={catalogOrderIconClass}>
                            <PriceAscIcon />
                        </span>
                        <span>Menor precio</span>
                    </CatalogToolbarButton>

                    <CatalogToolbarButton
                        ariaLabel="Ordenar por precio descendente"
                        tooltip="Ordenar de mayor a menor precio"
                        isActive={filters.order === 'precio_desc'}
                        onClick={() => goToCatalogFilters({ order: filters.order === 'precio_desc' ? 'fecha_ingreso' : 'precio_desc' })}
                    >
                        <span className={catalogOrderCurrencyClass}>$</span>
                        <span className={catalogOrderIconClass}>
                            <PriceDescIcon />
                        </span>
                        <span>Mayor precio</span>
                    </CatalogToolbarButton>
                </div>
            </form>

            <form className={catalog.densityForm} onSubmit={(event) => event.preventDefault()}>
                <label htmlFor={`${idPrefix}-catalog-grid-columns`} className={catalog.densityLabel} aria-label="Columnas">
                    <span className={catalog.densityIcon}>
                        <GridColumnsIcon />
                    </span>
                </label>
                <select
                    id={`${idPrefix}-catalog-grid-columns`}
                    className={catalog.densitySelect}
                    value={gridColumns}
                    aria-label="Cantidad de productos por fila"
                    title="Cantidad de productos por fila"
                    onChange={(event) => updateGridColumns(Number.parseInt(event.currentTarget.value, 10) as CatalogGridColumns)}
                >
                    {catalogGridColumnOptions.map((columns) => (
                        <option key={columns} value={columns}>
                            COLUMNAS {columns}
                        </option>
                    ))}
                </select>
            </form>

            <button
                type="button"
                className={catalog.clearButton}
                aria-label="Limpiar filtros"
                title="Limpiar todos los filtros"
                onClick={() => router.get(filters.clearUrl)}
            >
                <span className={catalog.clearIcon}>
                    <ClearIcon />
                </span>
                <span>Limpiar</span>
            </button>
        </div>
    );

    return (
        <SiteLayout
            title="Productos"
            headerSearch={headerSearch}
            announcements={announcements}
            announcementMode="catalogLegacy"
        >
            <section className={`${catalog.layout} catalog-font-scope`}>
                <div className={catalog.layoutMain}>
                    <section className={catalog.mobileControls} aria-label="Controles del catálogo">
                        <div className={catalog.mobileControlsBar}>
                            <div className={catalog.mobileControlsFilters}>
                                {renderCatalogToolbarLeft('mobile-inline')}
                            </div>
                            <div className={catalog.mobileControlsActions}>
                                <button type="button" className={catalog.mobileControlsButton} onClick={() => setMobilePanel('filters')} aria-label="Filtros">
                                    <span className={catalog.mobileControlsIcon}>
                                        <FilterIcon />
                                    </span>
                                </button>
                                <button type="button" className={catalog.mobileControlsButton} onClick={() => setMobilePanel('sort')} aria-label="Ordenar">
                                    <span className={catalog.mobileControlsIcon}>
                                        <SortIcon />
                                    </span>
                                </button>
                            </div>
                        </div>

                        {mobilePanel ? (
                            <div className={catalog.mobileSheetOverlay} role="presentation" onClick={() => setMobilePanel(null)}>
                                <section className={catalog.mobileSheet} role="dialog" aria-modal="true" aria-label={mobilePanel === 'filters' ? 'Filtros del catálogo' : 'Ordenar productos'} onClick={(event) => event.stopPropagation()}>
                                    <div className={catalog.mobileSheetHeader}>
                                        <strong>{mobilePanel === 'filters' ? 'Filtros' : 'Ordenar'}</strong>
                                        <button type="button" className={catalog.mobileSheetClose} onClick={() => setMobilePanel(null)} aria-label="Cerrar">
                                            ×
                                        </button>
                                    </div>

                                    {mobilePanel === 'filters' ? (
                                        <div className={catalog.mobileSheetBody}>
                                            <button type="button" className={catalog.mobileSheetOptionButton(filters.onlyOffers)} onClick={() => applyMobileProductFilter('offers')}>
                                                <span aria-hidden="true">🔥</span>
                                                Ofertas
                                            </button>
                                            <button type="button" className={catalog.mobileSheetOptionButton(!filters.onlyOffers && !filters.onlyFeatured)} onClick={() => applyMobileProductFilter('all')}>
                                                <span className={catalogOrderIconClass}>
                                                    <GridColumnsIcon />
                                                </span>
                                                Todos
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={catalog.mobileSheetBody}>
                                            <button type="button" className={catalog.mobileSheetOptionButton(filters.order === 'fecha_ingreso')} onClick={() => { goToCatalogFilters({ order: 'fecha_ingreso' }); setMobilePanel(null); }}>
                                                Recientes
                                            </button>
                                            <button type="button" className={catalog.mobileSheetOptionButton(filters.order === 'precio_asc')} onClick={() => { goToCatalogFilters({ order: 'precio_asc' }); setMobilePanel(null); }}>
                                                Menor precio
                                            </button>
                                            <button type="button" className={catalog.mobileSheetOptionButton(filters.order === 'precio_desc')} onClick={() => { goToCatalogFilters({ order: 'precio_desc' }); setMobilePanel(null); }}>
                                                Mayor precio
                                            </button>
                                        </div>
                                    )}
                                </section>
                            </div>
                        ) : null}
                    </section>

                    <section className={catalog.results}>
                        <div className={catalog.productToolbar}>
                            <div className={catalog.productToolbarFilters}>
                                {renderCatalogToolbarLeft('desktop')}
                            </div>
                            <div className={catalog.productToolbarActions}>
                                {renderCatalogToolbarRight('desktop')}
                            </div>
                        </div>

                        <div className={catalog.marquee}>
                            <div className={catalog.marqueeTrack}>
                                <span className={catalog.marqueeText}>PRODUCTOS DISPONIBLES: {summary.productCount}</span>
                            </div>
                            {isFiltered ? (
                                <button type="button" className={catalog.marqueeClearButton} onClick={() => router.get(filters.clearUrl)} aria-label="Quitar filtros">
                                    <CloseIcon />
                                </button>
                            ) : null}
                        </div>

                        {products.length > 0 ? (
                            <section className={previewCardGrid ? `${catalogGridClass(gridColumns)} !gap-1.5 max-[560px]:!gap-1` : catalogGridClass(gridColumns)}>
                                {products.map((product, index) => (
                                    <ProductCard key={product.id} product={product} cartUrl={layout.cartUrl} eagerImage={index < 8} />
                                ))}
                            </section>
                        ) : (
                            <section className={catalog.empty}>
                                <h2>No encontramos productos para ese filtro.</h2>
                                <p>{filters.emptyText}</p>
                                <button type="button" className={catalogActionClass('primary')} onClick={() => router.get(filters.clearUrl)}>
                                    VER TODO EL CATALOGO
                                </button>
                            </section>
                        )}
                    </section>
                </div>
            </section>
        </SiteLayout>
    );
}
