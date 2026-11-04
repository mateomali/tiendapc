const fs=require('fs');const p='resources/js/layouts/SiteLayout.tsx';let s=fs.readFileSync(p,'utf8');
s=s.replace('interface SiteLayoutProps extends PropsWithChildren {','interface SiteLayoutProps extends PropsWithChildren {\n    onOpenCategories?: () => void;');
s=s.replace("announcementMode = 'default' }: SiteLayoutProps", "announcementMode = 'default', onOpenCategories }: SiteLayoutProps");
s=s.replace("    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);","    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);\n    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);");
s=s.replace('                    <header className={site.header}>\n                        <div className={site.headerInner}>',`                    <header className={site.header}>
                        <div className="mobile-store-bar">
                            <button type="button" aria-label={onOpenCategories ? 'Abrir categor\u00edas' : 'Abrir men\u00fa'} aria-haspopup={onOpenCategories ? 'dialog' : undefined} aria-controls={onOpenCategories ? 'catalog-mobile-panel' : 'site-mobile-nav'} onClick={() => onOpenCategories ? onOpenCategories() : setMobileMenuOpen((open) => !open)}>
                                <MenuNavIcon open={mobileMenuOpen} />
                            </button>
                            <Link href={layout.brandUrl} className="mobile-store-logo"><img src={layout.logoUrl} alt="Sudoku" onError={(event) => { event.currentTarget.src = layout.logoFallbackUrl; }} /></Link>
                            {headerSearch ? <button type="button" aria-label={mobileSearchOpen ? 'Cerrar b\u00fasqueda' : 'Abrir b\u00fasqueda'} aria-expanded={mobileSearchOpen} aria-controls="mobile-store-search" onClick={() => { setMobileSearchOpen((open) => !open); if (!mobileSearchOpen) window.setTimeout(() => document.querySelector<HTMLInputElement>('#mobile-store-search input')?.focus(), 0); }}><SearchNavIcon /></button> : <span />}
                            <Link href={layout.cartUrl} className="mobile-store-cart" aria-label={\`Ir al carrito, \${cart.count} productos\`}><CartNavIcon />{cart.count > 0 ? <span data-cart-badge>{cart.count}</span> : null}</Link>
                        </div>
                        <div id="mobile-store-search" className={\`\${site.headerInner} mobile-store-search \${mobileSearchOpen ? 'is-open' : ''}\`}>`);
s=s.replace('className={site.mobileBrandTop}', 'className={\`\${site.mobileBrandTop} legacy-mobile-brand\`}');
fs.writeFileSync(p,s,'utf8');
