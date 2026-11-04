const fs=require('fs');let p='resources/js/pages/Store/CatalogPage.tsx',s=fs.readFileSync(p,'utf8');s=s.replace('<div className={catalog.marquee}>','<div className={`\${catalog.marquee} catalog-results-count`}>');const a=s.indexOf('    const applyMobileProductFilter ='),b=s.indexOf('    const renderCatalogToolbarLeft',a);if(a!==-1)s=s.slice(0,a)+s.slice(b);fs.writeFileSync(p,s,'utf8');
p='resources/css/app.css';s=fs.readFileSync(p,'utf8');s+=`
/* Mobile store navigation and catalog controls. */
.mobile-store-bar, .mobile-catalog-controls { display: none; }
.mobile-catalog-dialog { padding: 0; border: 1px solid #dbe3ef; border-radius: 12px 12px 0 0; width: min(560px,100%); max-width: 100%; max-height: 85dvh; margin: auto auto 0; background: #fff; color: #102146; }
.mobile-catalog-dialog[open] { display: grid; grid-template-rows: auto minmax(0,1fr) auto; }
.mobile-catalog-dialog::backdrop { background: rgb(4 15 35 / 60%); }
.mobile-catalog-dialog.is-categories { width: min(360px,92vw); height: 100dvh; max-height: 100dvh; margin: 0 auto 0 0; border-radius: 0 12px 12px 0; }
.mobile-catalog-dialog-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #dbe3ef; }
.mobile-catalog-dialog-header h2 { margin: 0; font-size: 20px; font-weight: 700; }
.mobile-catalog-dialog-header button { width: 44px; height: 44px; border-radius: 6px; font-size: 28px; cursor: pointer; }
.mobile-catalog-dialog-body { overflow-y: auto; overscroll-behavior: contain; padding: 8px 16px 16px; }
.mobile-category-all { width: 100%; min-height: 48px; text-align: left; color: #2456b4; font-weight: 700; }
.mobile-catalog-dialog details { border-bottom: 1px solid #dbe3ef; }
.mobile-catalog-dialog summary { min-height: 52px; padding: 14px 0; cursor: pointer; font-size: 14px; font-weight: 700; }
.mobile-catalog-dialog summary > span { float: right; padding-left: 8px; color: #64748b; font-size: 12px; font-weight: 400; }
.mobile-category-links { display: grid; gap: 2px; padding: 0 0 10px 12px; }
.mobile-category-links button { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 48px; padding: 8px; border-radius: 6px; font-size: 14px; text-align: left; }
.mobile-category-links button > span:last-child { color: #64748b; font-size: 12px; }
.mobile-category-links button[aria-pressed="true"] { background: #edf4ff; color: #174a9b; font-weight: 700; }
.mobile-category-links button:hover, .mobile-category-all:hover { background: #f1f5fb; }
.mobile-category-navigation { display: grid; gap: 2px; padding-top: 16px; }
.mobile-category-navigation a { display: flex; align-items: center; min-height: 44px; font-size: 14px; color: #2456b4; }
.mobile-catalog-dialog-done { min-height: 48px; margin: 12px 16px max(16px,env(safe-area-inset-bottom)); border-radius: 8px; background: #2456b4; color: white; font-size: 16px; font-weight: 700; }
.mobile-filter-options { display: grid; gap: 8px; padding-top: 12px; }
.mobile-filter-options p { color: #64748b; font-size: 14px; }
.mobile-filter-options label { display: flex; gap: 12px; align-items: center; min-height: 48px; font-size: 16px; }
.mobile-filter-options input { width: 20px; height: 20px; accent-color: #2456b4; }
.mobile-filters-reset { min-height: 44px; text-align: left; color: #2456b4; font-size: 14px; text-decoration: underline; }
.mobile-catalog-dialog :is(button,a,summary):focus-visible { outline: 2px solid #2456b4; outline-offset: 2px; }
@media (max-width: 860px) {
    .mobile-store-bar { display: grid; grid-template-columns: 44px minmax(0,1fr) 44px 44px; align-items: center; gap: 4px; min-height: 68px; padding: 4px 8px; }
    .mobile-store-bar > :is(button,a:not(.mobile-store-logo)) { position: relative; display: flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; border-radius: 6px; color: #eff6ff; }
    .mobile-store-bar > button:first-child { color: #7bd9fa; }
    .mobile-store-bar svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .mobile-store-logo { display: flex; justify-content: center; min-width: 0; padding: 0 4px; }
    .mobile-store-logo img { width: 100%; max-width: 180px; max-height: 54px; object-fit: contain; }
    .mobile-store-cart > span { position: absolute; top: 1px; right: 0; display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 3px; border-radius: 9px; background: #e63858; color: white; font-size: 11px; font-weight: 700; }
    .mobile-store-search:not(.is-open) { display: none; }
    .mobile-store-search.is-open { padding: 0 8px 8px; }
    .mobile-store-search .legacy-mobile-brand, .mobile-store-search [data-cart-badge], .mobile-store-search .mobileHeaderCart { display: none; }
    .mobile-store-search > div { display: block; }
    .mobile-store-search .legacy-mobile-brand + div { display: block; }
    .mobile-store-search a[aria-label^="Ir al carrito"] { display: none; }
    .mobile-catalog-controls { display: grid; gap: 10px; padding: 16px 12px; background: #10264c; color: #eff6ff; }
    .mobile-catalog-controls > p { margin: 0 0 2px; font-size: 13px; font-weight: 700; letter-spacing: .045em; }
    .mobile-catalog-buttons { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 10px; }
    .mobile-catalog-buttons button { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 8px; border-radius: 12px; background: #f8fafc; color: #102146; font-size: 16px; font-weight: 600; }
    .mobile-catalog-controls svg { flex-shrink: 0; width: 19px; height: 19px; fill: none; stroke: #2456b4; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .mobile-catalog-order { display: grid; grid-template-columns: 20px auto minmax(0,1fr); align-items: center; gap: 8px; min-height: 52px; padding: 0 12px; border-radius: 12px; background: #f8fafc; color: #526580; font-size: 14px; }
    .mobile-catalog-order select { width: 100%; min-width: 0; min-height: 52px; border: 0; background: transparent; color: #102146; font-size: 16px; font-weight: 600; }
    .catalog-results-count { display: none; }
}
`;fs.writeFileSync(p,s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),'utf8');
