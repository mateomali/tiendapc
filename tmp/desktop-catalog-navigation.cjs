const fs=require('fs');const p='resources/js/pages/Store/CatalogPage.tsx';let s=fs.readFileSync(p,'utf8');
const a=s.indexOf('    const toggleCatalogFlag ='),b=s.indexOf('    return (\n        <SiteLayout',a);if(a<0||b<0)throw Error('toolbar boundaries');
s=s.slice(0,a)+`    const [desktopGroup, setDesktopGroup] = useState(activeGroupKey || groups[0]?.key || '');
    const [desktopFilterDraft, setDesktopFilterDraft] = useState({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const desktopToolbarRef = useRef<HTMLDivElement>(null);
    const positionPopover = (button: HTMLButtonElement, width: number, categoriesMenu = false): void => {
        const rect = button.getBoundingClientRect();
        const left = categoriesMenu ? desktopToolbarRef.current?.getBoundingClientRect().left ?? rect.left : rect.left;
        setPopoverPosition({ top: rect.bottom + 8, left: Math.max(16, Math.min(left, window.innerWidth - width - 16)) });
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

`+s.slice(b);
s=s.replace("    const visibleCategories = activeGroupKey === '' ? categories : categories.filter((category) => category.groupKey === activeGroupKey);\n",'');
const toolbarStart=s.indexOf('                        <div className={catalog.productToolbar}>'),toolbarEnd=s.indexOf('                        {activeFilters.length > 0',toolbarStart);
s=s.slice(0,toolbarStart)+`                        <div className="desktop-catalog-toolbar" ref={desktopToolbarRef} aria-label="Controles del cat\u00e1logo en escritorio">
                            <p className="desktop-catalog-count"><strong>{summary.productCount}</strong> {summary.productCount === 1 ? 'producto' : 'productos'} en cat\u00e1logo</p>
                            <div className="desktop-catalog-actions">
                                <button type="button" popoverTarget="desktop-categories" onClick={(event) => { setDesktopGroup(activeGroupKey || groups[0]?.key || ''); positionPopover(event.currentTarget, 860, true); }}><GridColumnsIcon />Categor\u00edas<span aria-hidden="true">\u2304</span></button>
                                <button type="button" popoverTarget="desktop-filters" onClick={(event) => { setDesktopFilterDraft({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured }); positionPopover(event.currentTarget, 300); }}><FilterIcon />Filtros{[filters.onlyOffers, filters.onlyNew, filters.onlyFeatured].filter(Boolean).length > 0 ? \` (\${[filters.onlyOffers, filters.onlyNew, filters.onlyFeatured].filter(Boolean).length})\` : ''}</button>
                                <label className="desktop-catalog-order" htmlFor="desktop-catalog-order">Ordenar por
                                    <select id="desktop-catalog-order" value={filters.order} onChange={(event) => goToCatalogFilters({ order: event.currentTarget.value })}>
                                        <option value="fecha_ingreso">M\u00e1s recientes</option>
                                        <option value="precio_asc">Menor precio</option>
                                        <option value="precio_desc">Mayor precio</option>
                                    </select>
                                </label>
                                <button type="button" popoverTarget="desktop-view" onClick={(event) => positionPopover(event.currentTarget, 220)}><GridColumnsIcon />Vista</button>
                            </div>
                        </div>
                        <div id="desktop-categories" popover="auto" className="desktop-catalog-popover desktop-category-menu" style={popoverPosition} role="dialog" aria-label="Categor\u00edas del cat\u00e1logo">
                            <div className="desktop-popover-header"><h2>Categor\u00edas</h2><button type="button" popoverTarget="desktop-categories" popoverTargetAction="hide" aria-label="Cerrar categor\u00edas">\u00d7</button></div>
                            <div className="desktop-category-columns">
                                <div className="desktop-category-groups" role="group" aria-label="Rubros">
                                    {groups.map((group) => <button type="button" key={group.key} aria-pressed={desktopGroup === group.key} onClick={() => setDesktopGroup(group.key)}><span>{group.label}</span><span>{group.productCount}</span></button>)}
                                    <button type="button" className="desktop-all-categories" onClick={() => { goToCatalogFilters({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}>Todas las categor\u00edas</button>
                                </div>
                                <div className="desktop-category-options">
                                    <button type="button" className="desktop-category-heading" onClick={() => { goToCatalogFilters({ selectedGroup: desktopGroup, selectedCategory: '', selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}>Ver todo en {groups.find((group) => group.key === desktopGroup)?.label}<span aria-hidden="true">\u2192</span></button>
                                    <div className="desktop-category-links">
                                        {categories.filter((category) => category.groupKey === desktopGroup).map((category) => <button type="button" key={category.id} aria-pressed={filters.selectedCategory === category.slug || filters.selectedCategories.includes(category.slug)} onClick={() => { goToCatalogFilters({ selectedGroup: category.groupKey, selectedCategory: category.slug, selectedCategories: [] }); closeDesktopPopover('desktop-categories'); }}><span>{category.name}</span><span>{category.productCount}</span></button>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="desktop-filters" popover="auto" className="desktop-catalog-popover desktop-filter-menu" style={popoverPosition} role="dialog" aria-label="Filtros del cat\u00e1logo">
                            <div className="desktop-popover-header"><h2>Filtros</h2><button type="button" popoverTarget="desktop-filters" popoverTargetAction="hide" aria-label="Cerrar filtros">\u00d7</button></div>
                            <div className="desktop-filter-options">
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyOffers} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyOffers: event.currentTarget.checked })} />Ofertas</label>
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyNew} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyNew: event.currentTarget.checked })} />Novedades</label>
                                <label><input type="checkbox" checked={desktopFilterDraft.onlyFeatured} onChange={(event) => setDesktopFilterDraft({ ...desktopFilterDraft, onlyFeatured: event.currentTarget.checked })} />Destacados</label>
                                <button type="button" className="desktop-filter-reset" onClick={() => setDesktopFilterDraft({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}>Quitar filtros de productos</button>
                                <button type="button" className="desktop-filter-apply" onClick={() => { goToCatalogFilters(desktopFilterDraft); closeDesktopPopover('desktop-filters'); }}>Aplicar filtros</button>
                            </div>
                        </div>
                        <div id="desktop-view" popover="auto" className="desktop-catalog-popover desktop-view-menu" style={popoverPosition} role="dialog" aria-label="Vista del cat\u00e1logo">
                            <label htmlFor="desktop-grid-columns">Productos por fila</label>
                            <select id="desktop-grid-columns" aria-label="Cantidad de productos por fila" value={gridColumns} onChange={(event) => updateGridColumns(event.currentTarget.value === 'auto' ? 'auto' : Number.parseInt(event.currentTarget.value, 10) as CatalogGridColumns)}>
                                <option value="auto">Autom\u00e1tico</option>
                                {catalogGridColumnOptions.map((columns) => <option key={columns} value={columns}>{columns} columnas</option>)}
                            </select>
                        </div>

`+s.slice(toolbarEnd);
s=s.replace('                                <span className="font-semibold text-slate-700">Filtros:</span>','                                <span className="font-semibold text-slate-700">Filtros:</span>\n                                <button type="button" className="catalog-clear-all" onClick={() => router.get(filters.clearUrl)}>Limpiar todo</button>');
const ma=s.indexOf('                        <div className={`\${catalog.marquee} catalog-results-count`}>'),mb=s.indexOf('                        {products.length > 0',ma);if(ma<0||mb<0)throw Error('count marker');s=s.slice(0,ma)+s.slice(mb);
s=s.replace(/    const isFiltered =[^\n]*\n/,'');
fs.writeFileSync(p,s,'utf8');
