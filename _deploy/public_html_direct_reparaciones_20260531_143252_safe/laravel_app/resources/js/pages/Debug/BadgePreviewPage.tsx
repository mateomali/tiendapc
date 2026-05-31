import { Link } from '@inertiajs/react';
import { SiteLayout } from '../../layouts/SiteLayout';
import type { SharedPageProps } from '../../types';
import {
    catalogBodyClass,
    catalogCardClass,
    catalogCategoryRowClass,
    catalogCategoryClass,
    catalogFeaturedChipClass,
    catalogImageClass,
    catalogImageBadgesClass,
    catalogImageDetailsPillClass,
    catalogImageLinkClass,
    catalogImageToneClass,
    catalogNewChipClass,
    catalogOfferRibbonClass,
    catalogOfferRibbonIconClass,
    catalogOfferRibbonTextClass,
    catalogPriceBeforeClass,
    catalogPriceBeforeValueClass,
    catalogPriceBoxClass,
    catalogPriceBoxToneClass,
    catalogPriceClass,
    catalogTitleClass,
} from '../../ui';

interface BadgePreviewProduct {
    id: number;
    name: string;
    categoryName: string;
    detailUrl: string;
    imageUrl: string;
    imageFallbackUrl: string;
    priceLabel: string;
    displayPriceLabel: string;
    discountPercentage: number;
    isNew: boolean;
    isFeatured: boolean;
    hasOffer: boolean;
}

interface BadgePreviewPageProps extends SharedPageProps {
    product: BadgePreviewProduct;
}

type VariantKey = 'balanced' | 'priceLead' | 'imageLead' | 'tinyDense' | 'trebuchetBase' | 'arialTight' | 'monoLabel' | 'serifSoft';
type CardStateKey = 'offer' | 'new' | 'featured' | 'regular' | 'offerNew' | 'offerFeatured' | 'newFeatured' | 'allBadges';
type LayoutMode = 'stacked' | 'dense' | 'split';

interface Variant {
    key: VariantKey;
    title: string;
    note: string;
    cardClass: string;
    imagePanelClass: string;
    bodyClass: string;
    categoryClass: string;
    titleClass: string;
    ribbonClass: string;
    priceBoxClass: string;
    priceClass: string;
    layout: LayoutMode;
    gridClass: string;
}

interface CardState {
    key: CardStateKey;
    title: string;
    note: string;
    hasOffer: boolean;
    isNew: boolean;
    isFeatured: boolean;
    toneClass: string;
    imageToneClass: string;
    imageClass: string;
}

interface FontOption {
    name: string;
    className: string;
}

const neonShellClass =
    'relative min-h-full overflow-hidden rounded-xl border-[3px] border-[var(--preview-border)] bg-white transition hover:-translate-y-1';
const neonRibbonClass =
    'absolute left-[-2.35rem] top-[1rem] z-[4] flex h-7 min-w-36 -rotate-45 items-center justify-center bg-red-600 px-9 text-[0.64rem] font-black uppercase tracking-[0.12em] text-white shadow-[0_10px_24px_rgba(220,38,38,0.34)]';
const neonCardClass =
    `${neonShellClass} shadow-[0_14px_24px_rgba(15,23,42,0.10),0_0_22px_var(--preview-glow)] hover:shadow-[0_18px_30px_rgba(15,23,42,0.12),0_0_28px_var(--preview-glow-strong)]`;
const neonPriceBoxBaseClass = 'grid gap-0.5 rounded-lg px-3 py-2 text-center ring-1';
const compactPriceClass = 'text-[1.85rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]';

const fontOptions: FontOption[] = [
    { name: 'Tailwind Sans', className: 'font-sans' },
    { name: 'System UI', className: '[font-family:system-ui,sans-serif]' },
    { name: 'Segoe UI', className: '[font-family:Segoe_UI,system-ui,sans-serif]' },
    { name: 'Inter', className: '[font-family:Inter,system-ui,sans-serif]' },
    { name: 'Roboto', className: '[font-family:Roboto,Arial,sans-serif]' },
    { name: 'Arial', className: '[font-family:Arial,sans-serif]' },
    { name: 'Helvetica', className: '[font-family:Helvetica,Arial,sans-serif]' },
    { name: 'Trebuchet', className: '[font-family:Trebuchet_MS,Verdana,sans-serif]' },
    { name: 'Verdana', className: '[font-family:Verdana,Geneva,sans-serif]' },
    { name: 'Poppins', className: '[font-family:Poppins,system-ui,sans-serif]' },
    { name: 'Montserrat', className: '[font-family:Montserrat,system-ui,sans-serif]' },
    { name: 'Nunito', className: '[font-family:Nunito,system-ui,sans-serif]' },
    { name: 'Lato', className: '[font-family:Lato,system-ui,sans-serif]' },
    { name: 'Open Sans', className: '[font-family:Open_Sans,system-ui,sans-serif]' },
    { name: 'Source Sans', className: '[font-family:Source_Sans_3,system-ui,sans-serif]' },
    { name: 'Rubik', className: '[font-family:Rubik,system-ui,sans-serif]' },
    { name: 'Manrope', className: '[font-family:Manrope,system-ui,sans-serif]' },
    { name: 'Work Sans', className: '[font-family:Work_Sans,system-ui,sans-serif]' },
    { name: 'DM Sans', className: '[font-family:DM_Sans,system-ui,sans-serif]' },
    { name: 'Ubuntu', className: '[font-family:Ubuntu,system-ui,sans-serif]' },
];

const variants: Variant[] = [
    {
        key: 'balanced',
        title: 'Balanced',
        note: 'Split info equilibrado: foto, nombre y precio con peso parejo.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[156px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 font-sans',
        categoryClass: 'text-[0.56rem] font-black uppercase tracking-[0.13em] text-blue-700',
        titleClass: 'min-h-0 text-[0.78rem] font-black leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.45rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'priceLead',
        title: 'Price lead',
        note: 'Mismo split, precio mas protagonista para escaneo comercial.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[150px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 font-sans',
        categoryClass: 'text-[0.54rem] font-black uppercase tracking-[0.13em] text-blue-700',
        titleClass: 'min-h-0 text-[0.74rem] font-black leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: 'grid gap-0.5 rounded-lg bg-slate-50 px-2.5 py-2.5 text-center ring-1 ring-slate-100',
        priceClass: 'text-[1.72rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'imageLead',
        title: 'Image lead',
        note: 'Foto mas grande, texto reducido y precio medio.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[170px] items-center justify-center rounded-lg p-2.5 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2 py-2 font-sans',
        categoryClass: 'text-[0.52rem] font-black uppercase tracking-[0.12em] text-blue-700',
        titleClass: 'min-h-0 text-[0.72rem] font-black leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.36rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'tinyDense',
        title: 'Tiny dense',
        note: 'La opcion mas compacta, precio contenido y mucha capacidad.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-1.5 flex min-h-[136px] items-center justify-center rounded-lg p-1.5 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1 px-2 py-2 [font-family:Arial,sans-serif]',
        categoryClass: 'text-[0.5rem] font-black uppercase tracking-[0.1em] text-blue-700',
        titleClass: 'min-h-0 text-[0.68rem] font-bold leading-tight text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: 'grid gap-0 rounded-md bg-slate-50 px-2 py-1.5 text-center ring-1 ring-slate-100',
        priceClass: 'text-[1.22rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'trebuchetBase',
        title: 'Trebuchet base',
        note: 'La personalidad actual del sitio, ajustada al split.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[156px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 [font-family:Trebuchet_MS,Verdana,sans-serif]',
        categoryClass: 'text-[0.56rem] font-black uppercase tracking-[0.12em] text-blue-700',
        titleClass: 'min-h-0 text-[0.78rem] font-black leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.45rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'arialTight',
        title: 'Arial tight',
        note: 'Neutral, compacta y probablemente la mas segura.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[150px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 [font-family:Arial,sans-serif]',
        categoryClass: 'text-[0.54rem] font-black uppercase tracking-[0.12em] text-blue-700',
        titleClass: 'min-h-0 text-[0.76rem] font-bold leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.48rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'monoLabel',
        title: 'Mono label',
        note: 'Mas tecnica y ordenada; menor emocion, mucha claridad.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[148px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 font-mono',
        categoryClass: 'text-[0.52rem] font-bold uppercase tracking-[0.1em] text-blue-700',
        titleClass: 'min-h-0 text-[0.68rem] font-bold leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.32rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
    {
        key: 'serifSoft',
        title: 'Serif soft',
        note: 'Mas editorial; util si queres una card menos tecnica.',
        cardClass: neonCardClass,
        imagePanelClass: 'm-2 flex min-h-[152px] items-center justify-center rounded-lg p-2 shadow-inner ring-1',
        bodyClass: 'grid content-center gap-1.5 px-2.5 py-2.5 font-serif',
        categoryClass: 'text-[0.54rem] font-bold uppercase tracking-[0.12em] text-blue-700',
        titleClass: 'min-h-0 text-[0.76rem] font-bold leading-snug text-slate-950',
        ribbonClass: neonRibbonClass,
        priceBoxClass: `${neonPriceBoxBaseClass} bg-slate-50 ring-slate-100`,
        priceClass: 'text-[1.42rem] font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]',
        layout: 'split',
        gridClass: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    },
];

const cardStates: CardState[] = [
    {
        key: 'offer',
        title: 'Oferta',
        note: 'Ribbon + precio tachado',
        hasOffer: true,
        isNew: false,
        isFeatured: false,
        toneClass: '[--preview-border:#fca5a5] [--preview-glow:rgba(248,113,113,0.42)] [--preview-glow-strong:rgba(248,113,113,0.52)]',
        imageToneClass: 'bg-rose-50/85 ring-rose-100',
        imageClass: 'opacity-90 saturate-[0.94]',
    },
    {
        key: 'new',
        title: 'Nuevo',
        note: 'Chip de ingreso',
        hasOffer: false,
        isNew: true,
        isFeatured: false,
        toneClass: '[--preview-border:#7dd3fc] [--preview-glow:rgba(56,189,248,0.38)] [--preview-glow-strong:rgba(56,189,248,0.48)]',
        imageToneClass: 'bg-sky-50/90 ring-sky-100',
        imageClass: 'opacity-92 saturate-[0.96]',
    },
    {
        key: 'featured',
        title: 'Mas vendido',
        note: 'Icono premium',
        hasOffer: false,
        isNew: false,
        isFeatured: true,
        toneClass: '[--preview-border:#fcd34d] [--preview-glow:rgba(251,191,36,0.36)] [--preview-glow-strong:rgba(251,191,36,0.46)]',
        imageToneClass: 'bg-amber-50/85 ring-amber-100',
        imageClass: 'opacity-92 saturate-[1.02]',
    },
    {
        key: 'regular',
        title: 'Regular',
        note: 'Sin badges',
        hasOffer: false,
        isNew: false,
        isFeatured: false,
        toneClass: '[--preview-border:#cbd5e1] [--preview-glow:rgba(148,163,184,0.28)] [--preview-glow-strong:rgba(148,163,184,0.36)]',
        imageToneClass: 'bg-slate-50/85 ring-slate-100',
        imageClass: 'opacity-95 saturate-[0.94]',
    },
    {
        key: 'offerNew',
        title: 'Oferta + nuevo',
        note: 'Ribbon + chip',
        hasOffer: true,
        isNew: true,
        isFeatured: false,
        toneClass: '[--preview-border:#fb7185] [--preview-glow:rgba(244,63,94,0.38)] [--preview-glow-strong:rgba(244,63,94,0.48)]',
        imageToneClass: 'bg-gradient-to-br from-rose-50/90 via-white to-sky-50/90 ring-rose-100',
        imageClass: 'opacity-88 saturate-[0.96]',
    },
    {
        key: 'offerFeatured',
        title: 'Oferta + destacado',
        note: 'Ribbon + premium',
        hasOffer: true,
        isNew: false,
        isFeatured: true,
        toneClass: '[--preview-border:#fb923c] [--preview-glow:rgba(251,146,60,0.38)] [--preview-glow-strong:rgba(251,146,60,0.5)]',
        imageToneClass: 'bg-gradient-to-br from-rose-50/90 via-white to-amber-50/90 ring-orange-100',
        imageClass: 'opacity-88 saturate-[1]',
    },
    {
        key: 'newFeatured',
        title: 'Nuevo + destacado',
        note: 'Chip + premium',
        hasOffer: false,
        isNew: true,
        isFeatured: true,
        toneClass: '[--preview-border:#38bdf8] [--preview-glow:rgba(56,189,248,0.34)] [--preview-glow-strong:rgba(56,189,248,0.44)]',
        imageToneClass: 'bg-gradient-to-br from-sky-50/90 via-white to-amber-50/90 ring-sky-100',
        imageClass: 'opacity-90 saturate-[0.98]',
    },
    {
        key: 'allBadges',
        title: 'Todos',
        note: 'Ribbon + chip + premium',
        hasOffer: true,
        isNew: true,
        isFeatured: true,
        toneClass: '[--preview-border:#f43f5e] [--preview-glow:rgba(244,63,94,0.42)] [--preview-glow-strong:rgba(244,63,94,0.54)]',
        imageToneClass: 'bg-gradient-to-br from-rose-50/90 via-sky-50/80 to-amber-50/90 ring-rose-100',
        imageClass: 'opacity-85 saturate-[0.98]',
    },
];

function cardTone(product: BadgePreviewProduct): 'offer' | 'featured' | 'new' | 'regular' {
    if (product.hasOffer) {
        return 'offer';
    }

    if (product.isFeatured) {
        return 'featured';
    }

    if (product.isNew) {
        return 'new';
    }

    return 'regular';
}

function productForState(product: BadgePreviewProduct, state: CardState): BadgePreviewProduct {
    return {
        ...product,
        hasOffer: state.hasOffer,
        isNew: state.isNew,
        isFeatured: state.isFeatured,
        displayPriceLabel: state.hasOffer ? product.displayPriceLabel : product.priceLabel,
    };
}

function ActualCard({ product }: { product: BadgePreviewProduct }): JSX.Element {
    return (
        <article className="grid gap-3">
            <div className="rounded-[1.35rem] border border-[#9bc2f2] bg-white/88 p-4 shadow-[0_12px_24px_rgba(33,74,154,0.10)]">
                <p className="text-[0.76rem] font-black uppercase tracking-[0.14em] text-[#1f4e9c]">Actual</p>
                <p className="mt-2 min-h-10 text-sm leading-6 text-[#17376f]">Referencia actual del catalogo.</p>
            </div>

            <article className={catalogCardClass(cardTone(product), 'min-h-full')} data-badge-variant="actual">
                {product.hasOffer ? (
                    <div className={catalogOfferRibbonClass} aria-label={`Descuento del ${product.discountPercentage}%`}>
                        <span className={catalogOfferRibbonTextClass}>-{product.discountPercentage}%</span>
                        <span className={catalogOfferRibbonIconClass}>{'\u{1F525}'}</span>
                    </div>
                ) : null}

                <Link href={product.detailUrl} className={`${catalogImageLinkClass} ${catalogImageToneClass(cardTone(product))}`}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={catalogImageClass}
                        loading="eager"
                        decoding="async"
                        onError={(event) => {
                            event.currentTarget.src = product.imageFallbackUrl;
                        }}
                    />
                    {product.isNew || product.isFeatured ? (
                        <div className={catalogImageBadgesClass}>
                            {product.isNew ? <span className={catalogNewChipClass}>NUEVO INGRESO</span> : <span />}
                            {product.isFeatured ? (
                                <span className={catalogFeaturedChipClass} aria-label="Producto mas vendido">
                                    <span aria-hidden="true">{'\u2605'}</span> MAS VENDIDO!
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                    <span className={catalogImageDetailsPillClass}>MAS DETALLES</span>
                </Link>

                <div className={catalogBodyClass}>
                    <p className={catalogCategoryClass}>{product.categoryName}</p>
                    <Link href={product.detailUrl} className={catalogTitleClass}>
                        {product.name}
                    </Link>
                    <PriceBlock product={product} modern={false} />
                </div>
            </article>
        </article>
    );
}

function CornerRibbon({ product, variant }: { product: BadgePreviewProduct; variant: Variant }): JSX.Element | null {
    if (!product.hasOffer) {
        return null;
    }

    return <div className={variant.ribbonClass}>Oferta -{product.discountPercentage}%{'\u{1F525}'}</div>;
}

function ProductMeta({ product }: { product: BadgePreviewProduct }): JSX.Element {
    if (!product.isNew && !product.isFeatured) {
        return <div className="min-h-6" />;
    }

    return (
        <div className="flex min-h-6 items-center justify-between gap-2">
            {product.isNew ? (
                <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[0.56rem] font-black uppercase tracking-[0.1em] text-cyan-700 ring-1 ring-cyan-200">
                    Nuevo ingreso
                </span>
            ) : null}
            {product.isFeatured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[0.56rem] font-black uppercase tracking-[0.08em] text-amber-950 shadow-sm">
                    <span className="text-[0.68rem] leading-none">{'\u2605'}</span> MAS VENDIDO!
                </span>
            ) : null}
        </div>
    );
}

function PriceBlock({
    product,
    modern,
    priceBoxClass: customPriceBoxClass,
    priceClass: customPriceClass,
}: {
    product: BadgePreviewProduct;
    modern: boolean;
    priceBoxClass?: string;
    priceClass?: string;
}): JSX.Element {
    const resolvedPriceBoxClass = modern
        ? customPriceBoxClass ?? 'grid gap-1 rounded-xl bg-slate-50 px-4 py-3 text-center ring-1 ring-slate-100'
        : `${catalogPriceBoxClass} ${catalogPriceBoxToneClass(cardTone(product))}`;
    const priceClass = modern ? customPriceClass ?? 'text-4xl font-black leading-none text-[#111827] [font-variant-numeric:tabular-nums]' : catalogPriceClass;

    return (
        <div className={resolvedPriceBoxClass}>
            {product.hasOffer ? (
                <>
                    <span className={modern ? 'text-xs font-semibold uppercase tracking-[0.14em] text-slate-400' : catalogPriceBeforeClass}>
                        ANTES <span className={modern ? 'line-through' : catalogPriceBeforeValueClass}>${product.priceLabel}</span>
                    </span>
                    <strong className={priceClass}>${product.displayPriceLabel}</strong>
                </>
            ) : (
                <strong className={priceClass}>${product.displayPriceLabel}</strong>
            )}
        </div>
    );
}

function TypographyPreviewCard({ product, font, titleClass }: { product: BadgePreviewProduct; font: FontOption; titleClass?: string }): JSX.Element {
    const stateProduct: BadgePreviewProduct = {
        ...product,
        hasOffer: true,
        isNew: true,
        isFeatured: true,
        displayPriceLabel: product.displayPriceLabel,
    };

    return (
        <article className="grid gap-2">
            <div className="rounded-[1rem] border border-[#9bc2f2] bg-white/88 px-3 py-2 shadow-[0_10px_18px_rgba(33,74,154,0.10)]">
                <p className="text-[0.72rem] font-black uppercase tracking-[0.14em] text-[#1f4e9c]">{font.name}</p>
            </div>

            <article className={catalogCardClass('offer', `${font.className} min-h-full`)} data-badge-variant={`font-${font.name}`}>
                <div className={catalogOfferRibbonClass} aria-label={`Descuento del ${stateProduct.discountPercentage}%`}>
                    Oferta -{stateProduct.discountPercentage}%{'\u{1F525}'}
                </div>

                <Link href={stateProduct.detailUrl} className={`${catalogImageLinkClass} ${catalogImageToneClass(cardTone(stateProduct))}`}>
                    <img
                        src={stateProduct.imageUrl}
                        alt={stateProduct.name}
                        className={catalogImageClass}
                        loading="eager"
                        decoding="async"
                        onError={(event) => {
                            event.currentTarget.src = stateProduct.imageFallbackUrl;
                        }}
                    />
                    <div className={catalogImageBadgesClass}>
                        <span className={catalogNewChipClass}>NUEVO INGRESO</span>
                        <span className={catalogFeaturedChipClass} aria-label="Producto mas vendido">
                            <span aria-hidden="true">{'\u2605'}</span> MAS VENDIDO!
                        </span>
                    </div>
                    <span className={catalogImageDetailsPillClass}>MAS DETALLES</span>
                </Link>

                <div className={catalogBodyClass}>
                    <div className={catalogCategoryRowClass}>
                        <p className={catalogCategoryClass}>{stateProduct.categoryName}</p>
                    </div>

                    <Link href={stateProduct.detailUrl} className={titleClass ?? catalogTitleClass}>
                        {stateProduct.name}
                    </Link>

                    <div className="hidden">
                        <span className={catalogNewChipClass}>NUEVO INGRESO</span>
                        <span className={catalogFeaturedChipClass} aria-label="Producto mas vendido">
                            <span aria-hidden="true">{'\u2605'}</span> MAS VENDIDO!
                        </span>
                    </div>

                    <PriceBlock product={stateProduct} modern={false} />
                </div>
            </article>
        </article>
    );
}

function ModernPreviewCard({ product, variant, state }: { product: BadgePreviewProduct; variant: Variant; state: CardState }): JSX.Element {
    const stateProduct = productForState(product, state);

    if (variant.layout === 'split') {
        return (
            <article className={`${variant.cardClass} ${state.toneClass}`} data-badge-variant={`${variant.key}-${state.key}`}>
                <div className="absolute right-2 top-2 z-[3] max-w-[7rem] rounded-full bg-white/92 px-2 py-0.5 text-center text-[0.52rem] font-black uppercase leading-tight tracking-[0.08em] text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                    {state.title}
                </div>
                <CornerRibbon product={stateProduct} variant={variant} />

                <div className="grid min-h-[178px] grid-cols-[45%_minmax(0,1fr)]">
                    <Link href={product.detailUrl} className={`${variant.imagePanelClass} ${state.imageToneClass}`}>
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className={`h-full w-full object-contain ${state.imageClass}`}
                            loading="eager"
                            decoding="async"
                            onError={(event) => {
                                event.currentTarget.src = product.imageFallbackUrl;
                            }}
                        />
                    </Link>

                    <div className={variant.bodyClass}>
                        <div className="flex items-center justify-between gap-2">
                            <p className={variant.categoryClass}>{product.categoryName}</p>
                        </div>
                        <Link href={product.detailUrl} className={variant.titleClass}>
                            {product.name}
                        </Link>
                        <ProductMeta product={stateProduct} />
                        <PriceBlock product={stateProduct} modern priceBoxClass={variant.priceBoxClass} priceClass={variant.priceClass} />
                    </div>
                </div>
            </article>
        );
    }

    return (
            <article className={`${variant.cardClass} ${state.toneClass}`} data-badge-variant={`${variant.key}-${state.key}`}>
                <div className="absolute right-3 top-3 z-[3] max-w-[8.8rem] rounded-full bg-white/92 px-2.5 py-1 text-center text-[0.58rem] font-black uppercase leading-tight tracking-[0.1em] text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                    {state.title}
                </div>
                <CornerRibbon product={stateProduct} variant={variant} />

                <Link href={product.detailUrl} className={`${variant.imagePanelClass} ${state.imageToneClass}`}>
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className={`h-full w-full object-contain ${state.imageClass}`}
                        loading="eager"
                        decoding="async"
                        onError={(event) => {
                            event.currentTarget.src = product.imageFallbackUrl;
                        }}
                    />
                </Link>

                <div className={variant.bodyClass}>
                    <div className="flex items-center justify-between gap-3">
                        <p className={variant.categoryClass}>{product.categoryName}</p>
                    </div>

                    <Link href={product.detailUrl} className={variant.titleClass}>
                        {product.name}
                    </Link>

                    <ProductMeta product={stateProduct} />
                    <PriceBlock product={stateProduct} modern priceBoxClass={variant.priceBoxClass} priceClass={variant.priceClass} />
                </div>
            </article>
    );
}

export default function BadgePreviewPage({ product }: BadgePreviewPageProps): JSX.Element {
    return (
        <SiteLayout title="Preview badges">
            <section className="grid gap-4">
                <header className="rounded-[1.35rem] border border-[#9bc2f2] bg-white/82 p-4 shadow-[0_14px_28px_rgba(33,74,154,0.12)]">
                    <p className="text-[0.78rem] font-black uppercase tracking-[0.16em] text-[#1f4e9c]">Preview badges</p>
                    <h1 className="mt-2 text-2xl font-black leading-tight text-[#102146]">Clean white compacto: fuentes y disposicion</h1>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-[#17376f]">
                        Todas las opciones conservan Clean white, borde neon por estado y la cinta de oferta con fuego al final. Varian fuente, altura de imagen y disposicion para aprovechar mejor la pantalla.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <ActualCard product={product} />
                </section>

                <section className="grid gap-4">
                    <div className="rounded-[1.35rem] border border-[#9bc2f2] bg-white/88 p-4 shadow-[0_12px_24px_rgba(33,74,154,0.10)]">
                        <p className="text-[0.76rem] font-black uppercase tracking-[0.14em] text-[#1f4e9c]">Tipografias titulo actual</p>
                        <p className="mt-2 text-sm leading-6 text-[#17376f]">
                            Misma tarjeta actual con todos los badges activos: oferta, nuevo ingreso y destacado. Solo cambia la familia tipografica.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {fontOptions.map((font) => (
                            <TypographyPreviewCard key={font.name} product={product} font={font} />
                        ))}
                    </div>
                </section>

                <section className="grid gap-4">
                    <div className="rounded-[1.35rem] border border-[#9bc2f2] bg-white/88 p-4 shadow-[0_12px_24px_rgba(33,74,154,0.10)]">
                        <p className="text-[0.76rem] font-black uppercase tracking-[0.14em] text-[#1f4e9c]">Tipografias titulo grande</p>
                        <p className="mt-2 text-sm leading-6 text-[#17376f]">
                            La misma comparativa, pero con el titulo de producto mas protagonista para evaluar legibilidad y presencia.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {fontOptions.map((font) => (
                            <TypographyPreviewCard
                                key={`large-${font.name}`}
                                product={product}
                                font={font}
                                titleClass="line-clamp-2 min-h-0 text-[1.08rem] font-black leading-snug text-slate-950 min-[861px]:min-h-[3.05rem]"
                            />
                        ))}
                    </div>
                </section>

                {variants.map((variant) => (
                    <section key={variant.key} className="grid gap-4">
                        <div className="rounded-[1.35rem] border border-[#9bc2f2] bg-white/88 p-4 shadow-[0_12px_24px_rgba(33,74,154,0.10)]">
                            <p className="text-[0.76rem] font-black uppercase tracking-[0.14em] text-[#1f4e9c]">{variant.title}</p>
                            <p className="mt-2 text-sm leading-6 text-[#17376f]">{variant.note}</p>
                        </div>

                        <div className={variant.gridClass}>
                            {cardStates.map((state) => (
                                <ModernPreviewCard key={`${variant.key}-${state.key}`} product={product} variant={variant} state={state} />
                            ))}
                        </div>
                    </section>
                ))}
            </section>
        </SiteLayout>
    );
}
