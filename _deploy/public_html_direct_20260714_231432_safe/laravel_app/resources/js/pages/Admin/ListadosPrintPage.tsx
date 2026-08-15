import { Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { buttonClass, ui } from '../../ui';

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

interface ListadosPrintPageProps {
    filters: {
        query: string;
        includeAllCategories: boolean;
        selectedCategoryIds: number[];
        excludedProductIds: number[];
        onlyOffers: boolean;
        onlyFeatured: boolean;
    };
    rows: ListingRow[];
    urls: {
        index: string;
        thumbBase: string;
    };
    autoPrint: boolean;
}

export default function ListadosPrintPage({ filters, rows, urls, autoPrint }: ListadosPrintPageProps): JSX.Element {
    useEffect(() => {
        if (!autoPrint) {
            return;
        }

        const timeoutId = window.setTimeout(() => window.print(), 450);
        return () => window.clearTimeout(timeoutId);
    }, [autoPrint]);

    const queryParams = new URLSearchParams();
    if (filters.query) {
        queryParams.set('q', filters.query);
    }
    if (filters.includeAllCategories) {
        queryParams.set('todas', '1');
    }
    if (filters.onlyOffers) {
        queryParams.set('ofertas', '1');
    }
    if (filters.onlyFeatured) {
        queryParams.set('destacados', '1');
    }
    filters.selectedCategoryIds.forEach((id) => queryParams.append('categorias[]', String(id)));
    filters.excludedProductIds.forEach((id) => queryParams.append('excluir[]', String(id)));

    return (
        <>
            <Head title="Listado imprimible" />
            <div className={ui.printPage}>
                <header className={ui.printToolbar}>
                    <div>
                        <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-700/70">Listado imprimible</p>
                        <strong className="text-lg font-black text-slate-900">{rows.length} producto(s)</strong>
                    </div>
                    <div className={ui.inlineActions}>
                        <Link href={`${urls.index}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`} className={buttonClass('soft', 'sm')}>
                            Volver al panel
                        </Link>
                        <button type="button" className={buttonClass('primary', 'sm')} onClick={() => window.print()}>
                            Imprimir ahora
                        </button>
                    </div>
                </header>

                <section className={ui.printSheet}>
                    <div className={ui.printSheetHeader}>
                        <h1 className="text-3xl font-black tracking-tight text-slate-950">Tienda Abril</h1>
                        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Listado de productos</p>
                    </div>
                    <div className={ui.printGrid}>
                        {rows.map((row) => (
                            <article key={row.id} className={ui.printCard}>
                                <div className={ui.printCardThumb}>
                                    <img
                                        src={
                                            row.imageUrl
                                                ? `${urls.thumbBase}?src=${encodeURIComponent(row.imageUrl)}`
                                                : '/assets/img/logo-placeholder.svg'
                                        }
                                        alt={row.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className={ui.printCardBody}>
                                    <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{row.categoryName}</span>
                                    <strong className="text-lg font-black text-slate-950">{row.name}</strong>
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{row.hasOffer ? 'OFERTA' : row.isFeatured ? 'DESTACADO' : 'PRODUCTO'}</p>
                                    <em className="text-xl font-black not-italic text-slate-900">${row.priceLabel}</em>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
