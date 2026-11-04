const fs=require('fs');const p='resources/js/pages/Store/CatalogPage.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace("import { useEffect, useState } from 'react';","import { useEffect, useRef, useState } from 'react';");
s=s.replace("type MobileCatalogPanel = 'filters' | 'sort' | null;","type MobileCatalogPanel = 'categories' | 'filters' | null;");
s=s.replace("    const [mobilePanel, setMobilePanel] = useState<MobileCatalogPanel>(null);",`    const [mobilePanel, setMobilePanel] = useState<MobileCatalogPanel>(null);
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
`);
s=s.replace('            title="Productos"','            title="Productos"\n            onOpenCategories={() => setMobilePanel(\'categories\')}');
const a=s.indexOf('                    <section className={catalog.mobileControls}'),b=s.indexOf('                    <section className={catalog.results}>',a);
s=s.slice(0,a)+`                    <section className="mobile-catalog-controls" aria-label="Controles del cat\u00e1logo">
                        <p>{summary.productCount} {summary.productCount === 1 ? 'PRODUCTO' : 'PRODUCTOS'} EN CAT\u00c1LOGO</p>
                        <div className="mobile-catalog-buttons">
                            <button type="button" onClick={() => setMobilePanel('categories')} aria-haspopup="dialog" aria-controls="catalog-mobile-panel">
                                <GridColumnsIcon /><span>Categor\u00edas</span>
                            </button>
                            <button type="button" onClick={() => setMobilePanel('filters')} aria-haspopup="dialog" aria-controls="catalog-mobile-panel">
                                <FilterIcon /><span>Filtros{[filters.onlyNew, filters.onlyOffers, filters.onlyFeatured].filter(Boolean).length > 0 ? \` (\${[filters.onlyNew, filters.onlyOffers, filters.onlyFeatured].filter(Boolean).length})\` : ''}</span>
                            </button>
                        </div>
                        <div className="mobile-catalog-order">
                            <SortIcon /><label htmlFor="mobile-catalog-order">Ordenar por</label>
                            <select id="mobile-catalog-order" value={filters.order} onChange={(event) => goToCatalogFilters({ order: event.currentTarget.value })}>
                                <option value="fecha_ingreso">M\u00e1s recientes</option>
                                <option value="precio_asc">Menor precio</option>
                                <option value="precio_desc">Mayor precio</option>
                            </select>
                        </div>
                    </section>
                    <dialog ref={mobileDialogRef} id="catalog-mobile-panel" className={\`mobile-catalog-dialog \${mobilePanel === 'categories' ? 'is-categories' : ''}\`} aria-labelledby="catalog-mobile-panel-title" onCancel={() => setMobilePanel(null)} onClose={() => setMobilePanel(null)} onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setMobilePanel(null); } }}>
                        <div className="mobile-catalog-dialog-header">
                            <h2 id="catalog-mobile-panel-title">{mobilePanel === 'categories' ? 'Categor\u00edas' : 'Filtros'}</h2>
                            <button type="button" onClick={() => setMobilePanel(null)} aria-label="Cerrar panel">\u00d7</button>
                        </div>
                        <div className="mobile-catalog-dialog-body">
                            {mobilePanel === 'categories' ? (
                                <>
                                    <button type="button" className="mobile-category-all" onClick={() => { goToCatalogFilters({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }); setMobilePanel(null); }}>Todas las categor\u00edas</button>
                                    {groups.map((group) => (
                                        <details key={group.key} open={activeGroupKey === group.key ? true : undefined}>
                                            <summary>{group.label}<span>{group.productCount}</span></summary>
                                            <div className="mobile-category-links">
                                                <button type="button" aria-pressed={activeGroupKey === group.key && !filters.selectedCategory} onClick={() => { goToCatalogFilters({ selectedGroup: group.key, selectedCategory: '', selectedCategories: [] }); setMobilePanel(null); }}>Ver todo en {group.label}</button>
                                                {categories.filter((category) => category.groupKey === group.key).map((category) => (
                                                    <button type="button" key={category.id} aria-pressed={filters.selectedCategory === category.slug || filters.selectedCategories.includes(category.slug)} onClick={() => { goToCatalogFilters({ selectedGroup: group.key, selectedCategory: category.slug, selectedCategories: [] }); setMobilePanel(null); }}>
                                                        <span>{category.name}</span><span>{category.productCount}</span>
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
                                    <label><input type="checkbox" checked={filters.onlyOffers} onChange={(event) => goToCatalogFilters({ onlyOffers: event.currentTarget.checked })} />Ofertas</label>
                                    <label><input type="checkbox" checked={filters.onlyNew} onChange={(event) => goToCatalogFilters({ onlyNew: event.currentTarget.checked })} />Novedades</label>
                                    <label><input type="checkbox" checked={filters.onlyFeatured} onChange={(event) => goToCatalogFilters({ onlyFeatured: event.currentTarget.checked })} />Destacados</label>
                                    <button type="button" className="mobile-filters-reset" onClick={() => goToCatalogFilters({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}>Quitar filtros de productos</button>
                                </div>
                            )}
                        </div>
                        <button type="button" className="mobile-catalog-dialog-done" onClick={() => setMobilePanel(null)}>Ver {summary.productCount} productos</button>
                    </dialog>

`+s.slice(b);
fs.writeFileSync(p,s,'utf8');
