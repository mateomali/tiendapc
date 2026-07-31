import { Link, router } from '@inertiajs/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface TrashProductItem {
    id: number;
    name: string;
    categoryName: string;
    deletedAt: string;
    restoreAction: string;
    deleteAction: string;
}

interface TrashCategoryItem {
    id: number;
    name: string;
    productCount: number;
    deletedAt: string;
    restoreAction: string;
    deleteAction: string;
}

interface TrashPageProps {
    products: {
        total: number;
        page: number;
        totalPages: number;
        items: TrashProductItem[];
    };
    categories: TrashCategoryItem[];
}

export default function TrashPage({ products, categories }: TrashPageProps): JSX.Element {
    return (
        <AdminLayout title="Papelera">
            <div className={ui.pageStack}>
                <section className={ui.heroCard}>
                    <div className={ui.heroTitleWrap}>
                        <p className={ui.eyebrow}>Recuperacion operativa</p>
                        <h2 className={ui.heroTitle}>Papelera de productos y categorias</h2>
                        <p className={ui.heroText}>
                            Esta vista agrega metadatos, acciones dedicadas y paginacion para no perder control cuando
                            el volumen de eliminados crece.
                        </p>
                    </div>
                    <div className={ui.heroActions}>
                        <div className={ui.previewPill}>
                            <span>Productos</span>
                            <strong className="ml-2 block text-lg font-black text-ink-950">{products.total}</strong>
                        </div>
                        <div className={ui.previewPill}>
                            <span>Categorias</span>
                            <strong className="ml-2 block text-lg font-black text-ink-950">{categories.length}</strong>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
                    <article className={ui.sectionCard}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Productos</p>
                                <h3 className={ui.cardTitle}>Eliminados recientemente</h3>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {products.items.map((product) => (
                                <article key={product.id} className={ui.backupRow}>
                                    <div className="grid gap-1">
                                        <strong>{product.name}</strong>
                                        <p className={ui.inlineCaption}>{product.categoryName}</p>
                                        <p className={ui.inlineCaption}>Eliminado: {product.deletedAt}</p>
                                    </div>
                                    <div className={ui.inlineActions}>
                                        <Link href={product.restoreAction} method="post" as="button" className={buttonClass('soft', 'sm')}>
                                            Restaurar
                                        </Link>
                                        <Link href={product.deleteAction} method="post" as="button" className={buttonClass('danger', 'sm')}>
                                            Borrar definitivo
                                        </Link>
                                    </div>
                                </article>
                            ))}
                            {products.items.length === 0 ? (
                                <article className={ui.emptyCard}>
                                    <h3 className={ui.emptyTitle}>No hay productos en papelera</h3>
                                    <p className={ui.emptyText}>Cuando elimines productos apareceran aca con opciones de restauracion.</p>
                                </article>
                            ) : null}
                        </div>
                        {products.totalPages > 1 ? (
                            <div className={ui.pagination}>
                                <button
                                    type="button"
                                    className={buttonClass('soft', 'sm')}
                                    disabled={products.page <= 1}
                                    onClick={() =>
                                        router.get(route('admin.trash.index'), { page: products.page - 1 }, { preserveScroll: true })
                                    }
                                >
                                    Anterior
                                </button>
                                <span>
                                    Pagina {products.page} de {products.totalPages}
                                </span>
                                <button
                                    type="button"
                                    className={buttonClass('soft', 'sm')}
                                    disabled={products.page >= products.totalPages}
                                    onClick={() =>
                                        router.get(route('admin.trash.index'), { page: products.page + 1 }, { preserveScroll: true })
                                    }
                                >
                                    Siguiente
                                </button>
                            </div>
                        ) : null}
                    </article>

                    <article className={ui.sectionCard}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Categorias</p>
                                <h3 className={ui.cardTitle}>Elementos borrados</h3>
                            </div>
                        </div>
                        <div className="grid gap-4">
                            {categories.map((category) => (
                                <article key={category.id} className={ui.backupRow}>
                                    <div className="grid gap-1">
                                        <strong>{category.name}</strong>
                                        <p className={ui.inlineCaption}>{category.productCount} producto(s) historicos</p>
                                        <p className={ui.inlineCaption}>Eliminada: {category.deletedAt}</p>
                                    </div>
                                    <div className={ui.inlineActions}>
                                        <Link href={category.restoreAction} method="post" as="button" className={buttonClass('soft', 'sm')}>
                                            Restaurar
                                        </Link>
                                        <Link href={category.deleteAction} method="post" as="button" className={buttonClass('danger', 'sm')}>
                                            Borrar definitivo
                                        </Link>
                                    </div>
                                </article>
                            ))}
                            {categories.length === 0 ? (
                                <article className={ui.emptyCard}>
                                    <h3 className={ui.emptyTitle}>No hay categorias eliminadas</h3>
                                    <p className={ui.emptyText}>Las categorias enviadas a papelera apareceran aca con su metadata asociada.</p>
                                </article>
                            ) : null}
                        </div>
                    </article>
                </section>
            </div>
        </AdminLayout>
    );
}
