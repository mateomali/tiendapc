const fs=require('fs');
const write=(p,s)=>fs.writeFileSync(p,s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),'utf8');
let p='resources/js/ui.ts',s=fs.readFileSync(p,'utf8');
s=s.replace('max-w-[1160px]','max-w-[1752px]');
s=s.replace('relative isolate w-full aspect-[8.4/1]', 'relative isolate h-[clamp(100px,8vw,150px)] w-full');
s=s.replace('max-[860px]:aspect-[4.1/1]', 'max-[860px]:h-[88px]').replace('max-[560px]:aspect-[5.1/1]', 'max-[560px]:h-[72px]');
s=s.replace('object-cover saturate-[1.04]', 'object-contain saturate-[1.04]');
s=s.replace("grid: 'grid grid-cols-1 gap-2.5'", "grid: 'catalog-product-grid grid grid-cols-1 gap-2.5'");
write(p,s);
p='resources/js/pages/Store/CatalogPage.tsx';s=fs.readFileSync(p,'utf8');
s=s.replace("filters.order !== 'fecha_ingreso';", "filters.order !== 'fecha_ingreso' || filters.query.trim() !== '';");
const anchor='    const ProductCard = previewCardGrid ? CatalogProductPreviewCard : CatalogProductCard;';
s=s.replace(anchor,anchor+`
    const activeFilters: { label: string; clear: () => void }[] = [];
    if (filters.query.trim()) activeFilters.push({ label: \`Buscar: \${filters.query}\`, clear: () => goToCatalogFilters({ query: '' }) });
    if (activeGroupKey) activeFilters.push({ label: groups.find((group) => group.key === activeGroupKey)?.name ?? activeGroupKey, clear: () => goToCatalogFilters({ selectedGroup: '', selectedCategory: '', selectedCategories: [] }) });
    const categorySlugs = [...new Set([filters.selectedCategory, ...filters.selectedCategories].filter(Boolean))];
    categorySlugs.forEach((slug) => activeFilters.push({
        label: categories.find((category) => category.slug === slug)?.name ?? slug,
        clear: () => goToCatalogFilters({ selectedCategory: filters.selectedCategory === slug ? '' : filters.selectedCategory, selectedCategories: filters.selectedCategories.filter((value) => value !== slug) }),
    }));
    if (filters.onlyOffers) activeFilters.push({ label: 'Ofertas', clear: () => goToCatalogFilters({ onlyOffers: false }) });
    if (filters.onlyNew) activeFilters.push({ label: 'Novedades', clear: () => goToCatalogFilters({ onlyNew: false }) });
    if (filters.onlyFeatured) activeFilters.push({ label: 'Destacados', clear: () => goToCatalogFilters({ onlyFeatured: false }) });
`);
s=s.replace('                        <div className={catalog.marquee}>',`
                        {activeFilters.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2 text-sm" aria-label="Filtros activos">
                                <span className="font-semibold text-slate-700">Filtros:</span>
                                {activeFilters.map((filter) => (
                                    <button key={filter.label} type="button" onClick={filter.clear} aria-label={\`Quitar filtro: \${filter.label}\`} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-[#17376f] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2">
                                        {filter.label}<span aria-hidden="true">\u00d7</span>
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        <div className={catalog.marquee}>`);
s=s.replaceAll('Oferta en efectivo','En efectivo');
s=s.replaceAll('<span>Agregar</span>', "<span>{showAddedFeedback ? 'Agregado' : 'Agregar'}</span>");
s=s.replaceAll('event.currentTarget.src = product.imageFallbackUrl;', "if (event.currentTarget.dataset.fallback) { event.currentTarget.style.visibility = 'hidden'; return; }\n                        event.currentTarget.dataset.fallback = 'true';\n                        event.currentTarget.src = product.imageFallbackUrl;");
s=s.replaceAll('href={product.detailUrl} className=', 'href={product.detailUrl} title={product.name} className=');
write(p,s);
p='resources/js/layouts/SiteLayout.tsx';s=fs.readFileSync(p,'utf8');
s=s.replace('    const [announcementIndex, setAnnouncementIndex] = useState(0);', '    const [announcementIndex, setAnnouncementIndex] = useState(0);\n    const [failedAnnouncementImages, setFailedAnnouncementImages] = useState<string[]>([]);');
s=s.replace("if (item.displayType === 'image' && item.imageUrl) {", "if (item.displayType === 'image' && item.imageUrl && !failedAnnouncementImages.includes(item.imageUrl)) {");
s=s.replace('<img src={item.imageUrl} alt=', '<img onError={() => setFailedAnnouncementImages((current) => [...current, item.imageUrl!])} src={item.imageUrl} alt=');
s=s.replace('                    <footer', `
                    {announcementMode === 'catalogLegacy' && cart.count > 0 ? (
                        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] min-[861px]:hidden">
                            <Link href={layout.cartUrl} className="flex min-h-11 items-center justify-between rounded-lg bg-[#2456b4] px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2">
                                <span>Ver carrito</span><span>{cart.count} {cart.count === 1 ? 'producto' : 'productos'} \u2192</span>
                            </Link>
                        </div>
                    ) : null}
                    <footer`);
s=s.replace('className={site.shell}', "className={\`\${site.shell} \${announcementMode === 'catalogLegacy' && cart.count > 0 ? 'max-[860px]:pb-24' : ''}\`}");
write(p,s);
