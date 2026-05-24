import { Link, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { SiteLayout } from '../../layouts/SiteLayout';
import type { AnnouncementItem, HeaderSearchState, ProductDetail, RelatedProduct, SharedPageProps } from '../../types';
import {
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
    catalogImageClass,
    catalogImageBadgesClass,
    catalogImageDetailsPillClass,
    catalogImageLinkClass,
    catalogImageNewBadgeClass,
    catalogImageToneClass,
    catalogNewChipClass,
    catalogOfferRibbonClass,
    catalogPriceBeforeClass,
    catalogPriceBeforeValueClass,
    catalogPriceBoxClass,
    catalogPriceBoxToneClass,
    catalogPriceClass,
    catalogTitleClass,
    productActionsClass,
    productGalleryCardClass,
    productMainImageClass,
    productMainImageNavClass,
    productMainImageNavIconClass,
    productMainImageShellClass,
    productDescriptionBodyClass,
    productDescriptionClass,
    productDescriptionHeaderClass,
    productDetailBadgesClass,
    productDetailCategoryClass,
    productDetailImageNewChipClass,
    productFeaturedFlagClass,
    productInfoCardClass,
    productMoreButtonClass,
    productPriceBoxClass,
    productPriceClass,
    productSurfaceClass,
    productThumbClass,
    productThumbImageClass,
    productThumbRowClass,
    productTitleClass,
    related,
    storeBackLinkClass,
    type StoreTone,
} from '../../ui';

interface ProductPageProps extends SharedPageProps {
    kind: 'product-detail';
    headerSearch: HeaderSearchState;
    announcements: {
        rotationMs: number;
        items: AnnouncementItem[];
    };
    product: ProductDetail;
    relatedProducts: RelatedProduct[];
    relatedImageRotationMs: number;
}

interface RelatedProductCardProps {
    product: RelatedProduct;
    cartUrl: string;
    imageRotationMs: number;
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className={productMainImageNavIconClass}>
            {direction === 'left' ? <path d="m15 5-7 7 7 7" /> : <path d="m9 5 7 7-7 7" />}
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

function WhatsAppIcon({ size = 16 }: { size?: number }): JSX.Element {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="currentColor" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
        </svg>
    );
}

function RelatedProductCard({ product, cartUrl, imageRotationMs }: RelatedProductCardProps): JSX.Element {
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        if (product.images.length <= 1) {
            return;
        }

        const interval = window.setInterval(() => {
            setImageIndex((current) => (current + 1) % product.images.length);
        }, imageRotationMs);

        return () => window.clearInterval(interval);
    }, [imageRotationMs, product.images]);

    const activeImage = product.images[imageIndex] ?? product.imageUrl;
    const cardTone: StoreTone = product.hasOffer ? 'offer' : product.isFeatured ? 'featured' : product.isNew ? 'new' : 'regular';

    return (
        <article className={catalogCardClass(cardTone, 'min-h-full')}>
            {product.hasOffer ? (
                <div className={catalogOfferRibbonClass} aria-label={`Descuento del ${product.discountPercentage}%`}>
                    {'\u{1F525}'}Oferta -{product.discountPercentage}%
                </div>
            ) : null}

            <div className="hidden">
                {product.isFeatured ? <span className={catalogFeaturedChipClass} aria-label="Mas vendido">★</span> : null}
                {product.isNew && !product.hasOffer ? <span className={catalogNewChipClass}>NOVEDAD!</span> : null}
            </div>

            <Link href={product.detailUrl} className={`${catalogImageLinkClass} ${catalogImageToneClass(cardTone)}`} prefetch={['hover', 'click']} cacheFor="30s">
                <img
                    src={activeImage}
                    alt={product.name}
                    className={catalogImageClass}
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onError={(event) => {
                        event.currentTarget.src = product.imageFallbackUrl;
                    }}
                />
                {product.isNew ? <span className={`${catalogNewChipClass} ${catalogImageNewBadgeClass}`}>NOVEDAD!</span> : null}
                {product.isFeatured ? (
                    <div className={catalogImageBadgesClass}>
                        <span />
                        {
                            <span className={catalogFeaturedChipClass} aria-label="Mas vendido">
                                <span aria-hidden="true">★</span>MAS VENDIDO!
                            </span>
                        }
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

                <div className="hidden">
                    {product.isNew ? <span className={catalogNewChipClass}>NOVEDAD!</span> : <span />}
                    {product.isFeatured ? (
                        <span className={catalogFeaturedChipClass} aria-label="Mas vendido">
                            <span aria-hidden="true">★</span>MAS VENDIDO!
                        </span>
                    ) : null}
                </div>

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

export default function ProductPage({ headerSearch, product, relatedProducts, relatedImageRotationMs, layout }: ProductPageProps): JSX.Element {
    const [activeImage, setActiveImage] = useState(product.imageUrl);
    const [zoomOpen, setZoomOpen] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const relatedTrackRef = useRef<HTMLDivElement | null>(null);
    const activeIndex = Math.max(0, product.images.indexOf(activeImage));
    const hasGallery = product.images.length > 1;
    const toneClass: StoreTone = product.hasOffer ? 'offer' : product.isFeatured ? 'featured' : product.isNew ? 'new' : 'regular';

    const scrollRelatedProducts = (direction: 'left' | 'right'): void => {
        const track = relatedTrackRef.current;

        if (!track) {
            return;
        }

        const firstSlide = track.querySelector<HTMLElement>('[data-related-product-slide]');
        const trackStyles = window.getComputedStyle(track);
        const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap || '0') || 0;
        const slideWidth = firstSlide?.getBoundingClientRect().width ?? Math.min(track.clientWidth, 320);
        const step = slideWidth + gap;
        const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
        const currentIndex = Math.round(track.scrollLeft / step);
        const nextIndex = direction === 'left' ? Math.max(0, currentIndex - 1) : currentIndex + 1;
        const targetLeft = Math.min(maxScrollLeft, Math.max(0, nextIndex * step));

        track.scrollTo({
            left: targetLeft,
            behavior: 'smooth',
        });
    };

    const showImageAt = (index: number): void => {
        setActiveImage(product.images[(index + product.images.length) % product.images.length] ?? product.imageUrl);
    };

    useEffect(() => {
        if (!zoomOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                setZoomOpen(false);
            }

            if (event.key === 'ArrowLeft' && hasGallery) {
                showImageAt(activeIndex - 1);
            }

            if (event.key === 'ArrowRight' && hasGallery) {
                showImageAt(activeIndex + 1);
            }
        };

        document.body.classList.add('overflow-hidden');
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.classList.remove('overflow-hidden');
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeIndex, hasGallery, product.imageUrl, product.images, zoomOpen]);

    return (
        <SiteLayout title={product.name} headerSearch={headerSearch}>
            <section className="mx-auto grid w-[min(980px,100%)] grid-cols-1 gap-[0.85rem]">
                <div className={productSurfaceClass(toneClass)}>
                    <div className={productGalleryCardClass}>
                        <Link href={route('store.catalog')} className={storeBackLinkClass} prefetch={['hover', 'click']} cacheFor="30s">
                            <span aria-hidden="true">&lt;</span>
                            <span>Volver al catalogo</span>
                        </Link>
                        {product.hasOffer && product.discountPercentage > 0 ? (
                            <div className={catalogOfferRibbonClass} aria-label={`Descuento del ${product.discountPercentage}%`}>
                                {'\u{1F525}'}Oferta -{product.discountPercentage}%
                            </div>
                        ) : null}
                        <div className={productDetailBadgesClass}>
                            {product.isFeatured ? <span className={productFeaturedFlagClass}>★MAS VENDIDO!</span> : null}
                        </div>
                        <div className={productThumbRowClass}>
                            {product.images.map((image) => (
                                <button key={image} type="button" className={productThumbClass(activeImage === image)} onClick={() => setActiveImage(image)}>
                                    <img
                                        src={image}
                                        alt={product.name}
                                        className={productThumbImageClass}
                                        loading="lazy"
                                        decoding="async"
                                        onError={(event) => {
                                            event.currentTarget.src = product.imageFallbackUrl;
                                        }}
                                    />
                                </button>
                            ))}
                        </div>
                        <div className={productMainImageShellClass}>
                            {product.isNew && !product.hasOffer ? <span className={productDetailImageNewChipClass}>NOVEDAD!</span> : null}
                            <button type="button" className="grid h-full w-full cursor-zoom-in place-items-center" onClick={() => setZoomOpen(true)} aria-label="Ampliar imagen">
                                <img
                                    src={activeImage}
                                    alt={product.name}
                                    className={productMainImageClass}
                                    loading="eager"
                                    decoding="async"
                                    fetchPriority="high"
                                    onError={(event) => {
                                        event.currentTarget.src = product.imageFallbackUrl;
                                    }}
                                />
                            </button>
                            {hasGallery ? (
                                <>
                                    <button
                                        type="button"
                                        className={productMainImageNavClass('left')}
                                        aria-label="Imagen anterior"
                                        onClick={() => showImageAt(activeIndex - 1)}
                                    >
                                        <ChevronIcon direction="left" />
                                    </button>
                                    <button
                                        type="button"
                                        className={productMainImageNavClass('right')}
                                        aria-label="Imagen siguiente"
                                        onClick={() => showImageAt(activeIndex + 1)}
                                    >
                                        <ChevronIcon direction="right" />
                                    </button>
                                </>
                            ) : null}
                        </div>
                    </div>

                    <div className={productInfoCardClass}>
                        <p className={productDetailCategoryClass}>{product.categoryName}</p>
                        <h1 className={productTitleClass}>{product.name}</h1>
                        <div className={`${productPriceBoxClass} ${catalogPriceBoxToneClass(toneClass)}`}>
                            {product.hasOffer && product.offerPriceLabel !== '' ? (
                                <span className={catalogPriceBeforeClass}>
                                    ANTES <span className={catalogPriceBeforeValueClass}>${product.priceLabel}</span>
                                </span>
                            ) : null}
                            <strong className={productPriceClass}>${product.displayPriceLabel}</strong>
                        </div>

                        <div className={productActionsClass}>
                            <button
                                type="button"
                                className={catalogActionClass('primary', 'min-h-12 px-[1.3rem]')}
                                onClick={() => router.post(product.addToCartAction, { product_id: product.id, quantity: 1 }, { preserveScroll: true })}
                            >
                                <span>Agregar al carrito</span>
                                <span className={catalogActionIconClass} aria-hidden="true">
                                    <CartIcon size={14} />
                                </span>
                            </button>
                            <a href={product.whatsappUrl} className={catalogActionClass('success', 'min-h-12 px-[1.3rem]')}>
                                <span>Consultar por WhatsApp</span>
                                <span className={catalogActionIconClass} aria-hidden="true">
                                    <WhatsAppIcon size={16} />
                                </span>
                            </a>
                        </div>

                        <div className={productDescriptionClass}>
                            <div className={productDescriptionHeaderClass}>Descripcion del producto:</div>
                            <div className={productDescriptionBodyClass} dangerouslySetInnerHTML={{ __html: showFullDescription || !product.hasLongDescription ? product.description : product.descriptionShort }} />
                            {product.hasLongDescription ? (
                                <button type="button" className={productMoreButtonClass} onClick={() => setShowFullDescription((current) => !current)}>
                                    {showFullDescription ? 'Ver menos' : 'Leer descripcion completa'}
                                </button>
                            ) : null}
                        </div>

                        {product.cartQty > 0 ? <p className={catalogCartQtyClass}>Este producto ya tiene {product.cartQty} unidad(es) en el carrito.</p> : null}
                    </div>
                </div>
            </section>

            {relatedProducts.length > 0 ? (
                <section className={related.shell}>
                    <div className={related.header}>
                        <h2 className={related.title}>PRODUCTOS RELACIONADOS</h2>
                        <div className={related.nav}>
                            <button type="button" className={related.arrow} aria-label="Desplazar productos relacionados hacia la izquierda" onClick={() => scrollRelatedProducts('left')}>
                                <ChevronIcon direction="left" />
                            </button>
                            <button type="button" className={related.arrow} aria-label="Desplazar productos relacionados hacia la derecha" onClick={() => scrollRelatedProducts('right')}>
                                <ChevronIcon direction="right" />
                            </button>
                        </div>
                    </div>
                    <div ref={relatedTrackRef} className={related.carousel}>
                        {relatedProducts.map((relatedProduct) => (
                            <div key={relatedProduct.id} className={related.slide} data-related-product-slide>
                                <RelatedProductCard product={relatedProduct} cartUrl={layout.cartUrl} imageRotationMs={relatedImageRotationMs} />
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {zoomOpen ? (
                <div className="fixed inset-0 z-[120] grid bg-white/98 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Imagen ampliada" onClick={() => setZoomOpen(false)}>
                    <button
                        type="button"
                        className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-md bg-[#dc2626] text-2xl font-black leading-none text-white shadow-[0_12px_28px_rgba(220,38,38,0.35)] transition hover:bg-[#b91c1c] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#dc2626] sm:right-5 sm:top-5"
                        aria-label="Cerrar zoom"
                        onClick={(event) => {
                            event.stopPropagation();
                            setZoomOpen(false);
                        }}
                    >
                        X
                    </button>

                    <div className="grid min-h-0 place-items-center" onClick={(event) => event.stopPropagation()}>
                        <img
                            src={activeImage}
                            alt={product.name}
                            className="max-h-[calc(100vh-7rem)] max-w-[min(96vw,1200px)] object-contain"
                            onError={(event) => {
                                event.currentTarget.src = product.imageFallbackUrl;
                            }}
                        />
                    </div>

                    {hasGallery ? (
                        <>
                            <button type="button" className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-[#0f172a] shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:bg-slate-50 sm:left-5" aria-label="Imagen anterior" onClick={(event) => { event.stopPropagation(); showImageAt(activeIndex - 1); }}>
                                <ChevronIcon direction="left" />
                            </button>
                            <button type="button" className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-[#0f172a] shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:bg-slate-50 sm:right-5" aria-label="Imagen siguiente" onClick={(event) => { event.stopPropagation(); showImageAt(activeIndex + 1); }}>
                                <ChevronIcon direction="right" />
                            </button>
                            <div className="absolute bottom-3 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white/95 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.14)] sm:bottom-5">
                                {product.images.map((image, index) => (
                                    <button key={image} type="button" className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border bg-white ${activeImage === image ? 'border-[#2563eb] ring-2 ring-[#2563eb33]' : 'border-slate-200'}`} aria-label={`Ver imagen ${index + 1}`} onClick={(event) => { event.stopPropagation(); setActiveImage(image); }}>
                                        <img src={image} alt="" className="h-full w-full object-contain" />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>
            ) : null}
        </SiteLayout>
    );
}
