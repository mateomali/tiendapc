import { Link, router } from '@inertiajs/react';
import type { FocusEvent } from 'react';
import { useState } from 'react';
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
    catalogFeaturedChipClass,
    catalogGridClass,
    catalogImageClass,
    catalogImageBadgesClass,
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
    headerSearch: HeaderSearchState;
    filters: {
        query: string;
        selectedCategory: string;
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

function StarIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3z" />
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
    overrides: Partial<Pick<CatalogPageProps['filters'], 'selectedCategory' | 'selectedGroup' | 'query' | 'order' | 'onlyNew' | 'onlyOffers' | 'onlyFeatured'>>,
): Record<string, string | number> {
    const nextFilters = {
        selectedCategory: filters.selectedCategory,
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

    const activeImage = product.images[imageIndex] ?? product.imageUrl;
    const cardTone: StoreTone = product.hasOffer
        ? 'offer'
        : product.isFeatured
          ? 'featured'
          : product.isNew
            ? 'new'
            : 'regular';

    return (
        <article
            className={catalogCardClass(cardTone, product.cartQty > 0 ? 'max-[860px]:h-[218px] max-[560px]:h-[198px] max-[860px]:[contain-intrinsic-size:218px] max-[560px]:[contain-intrinsic-size:198px]' : undefined)}
            data-testid="catalog-product-card"
            onMouseEnter={showNextImage}
            onMouseLeave={showFirstImage}
            onFocus={handleCardFocus}
            onBlur={handleCardBlur}
        >
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
                {product.isFeatured ? (
                    <div className={catalogImageBadgesClass}>
                        <span />
                        <span className={catalogFeaturedChipClass} aria-label="Mas vendido">
                            <span aria-hidden="true">★</span>MAS VENDIDO!
                        </span>
                    </div>
                ) : null}
                <span className={catalogImageDetailsPillClass}>Más detalles</span>
            </Link>

            <div className={catalogBodyClass}>
                <div className={catalogCategoryRowClass}>
                    <p className={catalogCategoryClass}>{product.categoryName}</p>
                </div>
                <Link href={product.detailUrl} className={catalogTitleClass} prefetch={['hover', 'click']} cacheFor="30s">
                    {product.name}
                </Link>

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

                <div className={catalogActionsClass}>
                    <button
                        type="button"
                        className={catalogActionClass('primary', 'min-w-0 w-full')}
                        onClick={() => router.post(product.addToCartAction, { product_id: product.id, quantity: 1 }, { preserveScroll: true })}
                    >
                        <span>Agregar</span>
                        <span className={catalogActionIconClass} aria-hidden="true">
                            <CartIcon size={13} />
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

export default function CatalogPage({
    headerSearch,
    filters,
    announcements,
    groups,
    categories,
    products,
    summary,
    layout,
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
    const isFiltered = activeGroupKey !== '' || filters.selectedCategory !== '' || filters.onlyNew || filters.onlyOffers || filters.onlyFeatured || filters.order !== 'fecha_ingreso';

    const updateGridColumns = (columns: CatalogGridColumns): void => {
        setGridColumns(columns);
        window.localStorage.setItem(catalogGridColumnsStorageKey, String(columns));
    };

    const goToCatalogFilters = (
        overrides: Partial<Pick<CatalogPageProps['filters'], 'selectedCategory' | 'selectedGroup' | 'query' | 'order' | 'onlyNew' | 'onlyOffers' | 'onlyFeatured'>>,
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

    const applyMobileProductFilter = (filter: 'offers' | 'featured' | 'all'): void => {
        if (filter === 'all') {
            router.get(filters.clearUrl, {}, { preserveScroll: true, preserveState: false });
            setMobilePanel(null);
            return;
        }

        router.get(filters.clearUrl, buildCatalogQuery(filters, {
            selectedGroup: '',
            selectedCategory: '',
            onlyNew: false,
            onlyOffers: filter === 'offers',
            onlyFeatured: filter === 'featured',
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
                                            <button type="button" className={catalog.mobileSheetOptionButton(filters.onlyFeatured)} onClick={() => applyMobileProductFilter('featured')}>
                                                <span className={catalogOrderIconClass}>
                                                    <StarIcon />
                                                </span>
                                                Destacados
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
                            <section className={catalogGridClass(gridColumns)}>
                                {products.map((product, index) => (
                                    <CatalogProductCard key={product.id} product={product} cartUrl={layout.cartUrl} eagerImage={index < 8} />
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
