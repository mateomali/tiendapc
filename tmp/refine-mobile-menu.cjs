const fs=require('fs');let p='resources/js/layouts/SiteLayout.tsx',s=fs.readFileSync(p,'utf8');const marker=s.indexOf('<section className={site.mobileSearchDock}'),a=s.lastIndexOf('                    {headerSearch ? (',marker),b=s.indexOf('                    {mobileMenuOpen ? (',marker);if(marker<0||a<0||b<0)throw Error('dock boundary');s=s.slice(0,a)+s.slice(b);fs.writeFileSync(p,s,'utf8');
p='resources/js/pages/Store/CatalogPage.tsx';s=fs.readFileSync(p,'utf8');
s=s.replace('    const mobileDialogRef = useRef<HTMLDialogElement>(null);', `    const [mobileFilterDraft, setMobileFilterDraft] = useState({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    useEffect(() => {
        if (mobilePanel === 'filters') setMobileFilterDraft({ onlyOffers: filters.onlyOffers, onlyNew: filters.onlyNew, onlyFeatured: filters.onlyFeatured });
    }, [mobilePanel, filters.onlyOffers, filters.onlyNew, filters.onlyFeatured]);
    const mobileDialogRef = useRef<HTMLDialogElement>(null);`);
for(const key of ['onlyOffers','onlyNew','onlyFeatured'])s=s.replace('checked={filters.'+key+'} onChange={(event) => goToCatalogFilters({ '+key+': event.currentTarget.checked })}', 'checked={mobileFilterDraft.'+key+'} onChange={(event) => setMobileFilterDraft((current) => ({ ...current, '+key+': event.currentTarget.checked }))}');
s=s.replace('className="mobile-filters-reset" onClick={() => goToCatalogFilters({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}', 'className="mobile-filters-reset" onClick={() => setMobileFilterDraft({ onlyOffers: false, onlyNew: false, onlyFeatured: false })}');
s=s.replace('className="mobile-catalog-dialog-done" onClick={() => setMobilePanel(null)}>Ver {summary.productCount} productos</button>', 'className="mobile-catalog-dialog-done" onClick={() => { if (mobilePanel === \'filters\') goToCatalogFilters(mobileFilterDraft); setMobilePanel(null); }}>{mobilePanel === \'filters\' ? \'Aplicar filtros\' : `Ver \${summary.productCount} productos`}</button>');
fs.writeFileSync(p,s,'utf8');
p='tmp/verify-mobile-menu.cjs';s=fs.readFileSync(p,'utf8').replace("name:/Ver \\d+ productos/","name:'Aplicar filtros',exact:true");fs.writeFileSync(p,s,'utf8');
