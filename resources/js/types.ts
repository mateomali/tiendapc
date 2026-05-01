export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: string;
}

export interface LayoutNavItem {
    label: string;
    href: string;
    isActive: boolean;
}

export interface LayoutFooter {
    address: string;
    hours: string;
    mapUrl: string;
    ctaTitle: string;
    ctaText: string;
    whatsappDisplay: string;
    whatsappUrl: string;
    copyrightYear: number;
}

export interface SiteLayoutData {
    brandUrl: string;
    logoUrl: string;
    logoFallbackUrl: string;
    navItems: LayoutNavItem[];
    cartUrl: string;
    repairUrl: string;
    footer: LayoutFooter;
}

export interface SharedPageProps {
    [key: string]: unknown;
    auth: {
        user: AuthUser | null;
        isRepairTech: boolean;
        canManageRepairs: boolean;
    };
    app: {
        name: string;
        url: string;
        whatsappNumber: string;
    };
    layout: SiteLayoutData;
    cart: {
        count: number;
    };
    flash: {
        success?: string | null;
        error?: string | null;
    };
}

export interface AnnouncementItem {
    id: number;
    message: string;
    linkUrl: string;
    displayType: string;
    imageUrl?: string | null;
    mobileImageUrl?: string | null;
}

export interface HeaderSearchState {
    query: string;
    group: string;
    order: string;
    onlyNew: boolean;
    onlyOffers: boolean;
    onlyFeatured?: boolean;
    showDesktop: boolean;
    showMobileSticky: boolean;
}

export interface CatalogGroup {
    key: string;
    label: string;
    productCount: number;
    url: string;
    isSelected: boolean;
    isOpenByDefault?: boolean;
    categories?: CatalogCategory[];
}

export interface CatalogCategory {
    id: number;
    name: string;
    slug: string;
    groupKey: string;
    productCount: number;
    url: string;
    isSelected: boolean;
}

export interface CatalogProduct {
    id: number;
    slug: string;
    name: string;
    categoryName: string;
    categorySlug: string;
    categoryGroupKey: string;
    detailUrl: string;
    images: string[];
    imageUrl: string;
    imageFallbackUrl: string;
    price: number;
    priceLabel: string;
    offerPrice?: number | null;
    offerPriceLabel: string;
    displayPrice: number;
    displayPriceLabel: string;
    hasOffer: boolean;
    discountPercentage: number;
    isNew: boolean;
    isFeatured: boolean;
    cartQty: number;
    cartQtyLabel: string;
    searchText: string;
    shortDescription?: string | null;
    addToCartAction: string;
    removeFromCartAction: string;
    buyWhatsappUrl: string;
}

export interface ProductDetail {
    id: number;
    name: string;
    categoryName: string;
    images: string[];
    imageUrl: string;
    imageFallbackUrl: string;
    priceLabel: string;
    offerPriceLabel: string;
    displayPriceLabel: string;
    hasOffer: boolean;
    discountPercentage: number;
    isNew: boolean;
    isFeatured: boolean;
    description: string;
    descriptionShort: string;
    hasLongDescription: boolean;
    cartQty: number;
    addToCartAction: string;
    whatsappUrl: string;
}

export interface RelatedProduct extends CatalogProduct {}

export interface CartLine {
    productId: number;
    name: string;
    slug: string;
    imageUrl: string;
    imageFallbackUrl: string;
    qty: number;
    basePrice: number;
    basePriceLabel: string;
    unitPrice: number;
    unitPriceLabel: string;
    subtotal: number;
    subtotalLabel: string;
    hasOffer: boolean;
    updateAction: string;
    removeAction: string;
}

export interface ServiceCard {
    indexLabel: string;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    points: string[];
    imageUrl: string;
    imageFallbackUrl: string;
}

export interface RepairOrderView {
    registro_id: number;
    id: number;
    reparacion: number;
    fecha?: string | null;
    nombre_cliente: string;
    dni: number;
    contacto?: string | null;
    modelo?: string | null;
    descripcion?: string | null;
    observaciones?: string | null;
    monto: number | string;
    senia: number | string;
    fecha_estimada?: string | null;
    estado: string;
    entregado: string;
    fecha_entregado?: string | null;
    repuesto?: string | null;
    repuesto_pedido?: boolean;
    repuesto_pedido_at?: string | null;
    categorias_reparacion: number;
    imagenes: RepairImageView[];
    imagenes_finales: RepairImageView[];
    events?: RepairEventView[];
    actions?: {
        update: string;
        deliver: string;
        markReady: string;
        cancel: string;
        moveBack: string;
        delete: string;
        addOriginalImages: string;
        removeOriginalImage: string;
        addFinalImages: string;
        removeFinalImage: string;
    };
    availableStates?: string[];
}

export interface RepairImageView {
    filename: string;
    url: string;
    thumbnailUrl: string;
    deleteAction: string;
}

export interface RepairEventView {
    id: number;
    evento: string;
    estado_anterior?: string | null;
    estado_nuevo?: string | null;
    created_at?: string | null;
    usuario?: string | null;
}

export interface RepairTicketView {
    id: number;
    nombre_cliente: string;
    dni: number;
    contacto?: string | null;
    fecha?: string | null;
    repairsCount: number;
    totalMonto: number;
    totalSenia: number;
    trackingUrl: string;
    ticketUrl: string;
    whatsappUrl?: string | null;
    repairs: RepairOrderView[];
}

export interface PublicRepairFeedback {
    variant: string;
    message: string;
}

export interface PublicRepairViewConfig {
    brandUrl: string;
    bannerUrl: string;
    bannerFallbackUrl: string;
    title: string;
    subtitle: string;
    orderLabel: string;
    orderPlaceholder: string;
    dniLabel: string;
    dniPlaceholder: string;
    submitLabel: string;
    resetLabel: string;
    resetUrl: string;
    whatsappUrl: string;
    whatsappLabel: string;
    addressTitle: string;
    hoursLabel: string;
    mapUrl: string;
}

export interface PublicRepairImageView {
    label: string;
    title: string;
    url: string;
    thumbnailUrl: string;
}

export interface PublicRepairFieldView {
    label: string;
    value: string;
    tone: 'default' | 'accent' | 'total';
}

export interface PublicRepairStatusView {
    variant: string;
    message: string;
    announcedAt?: string | null;
    pickup?: {
        title: string;
        address: string;
        hours: string;
    } | null;
}

export interface PublicRepairObservationView {
    title: string;
    text: string;
    announcedAt?: string | null;
}

export interface PublicRepairResultView {
    id: number;
    repairNumber: number;
    registroId: number;
    headline: string;
    subheadline: string;
    model: string;
    status: PublicRepairStatusView;
    entryImages: PublicRepairImageView[];
    finalImages: PublicRepairImageView[];
    fields: PublicRepairFieldView[];
    observation?: PublicRepairObservationView | null;
    highlight: boolean;
}

export interface PublicRepairTicketResultView {
    id: number;
    headline: string;
    clusterVariant: string;
    summaryLabel: string;
    repairs: PublicRepairResultView[];
}
