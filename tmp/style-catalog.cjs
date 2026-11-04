const fs=require('fs');const write=(p,s)=>fs.writeFileSync(p,s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),'utf8');
let p='resources/js/pages/Store/CatalogPage.tsx',s=fs.readFileSync(p,'utf8').replace("group.key === activeGroupKey)?.name","group.key === activeGroupKey)?.label");write(p,s);
p='resources/js/layouts/SiteLayout.tsx';s=fs.readFileSync(p,'utf8').replace('className={`\${site.shell} catalog-font-scope`}', 'className={`\${site.shell} catalog-font-scope \${announcementMode === \'catalogLegacy\' && cart.count > 0 ? \'max-[860px]:pb-24\' : \'\'}`}');write(p,s);
p='resources/css/app.css';s=fs.readFileSync(p,'utf8');s+=`

/* Catalog cards share stable image, title, price and action rows. */
.catalog-product-grid > article {
    min-width: 0;
}
.catalog-product-grid > article > div:last-child {
    display: flex;
    flex-direction: column;
}
.catalog-product-grid > article > div:last-child > a[href]:not(:last-child) {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    min-height: 3.66em;
    line-height: 1.22;
}
.catalog-product-grid > article > div:last-child > div:last-child {
    margin-top: auto;
}
.catalog-product-grid :is(button, a):focus-visible {
    outline: 2px solid #2456b4;
    outline-offset: 2px;
}
.catalog-product-grid button {
    min-height: 44px;
}
.catalog-product-grid [data-testid="catalog-product-card-preview"] > div:last-child > div:nth-last-child(2) {
    min-height: 108px;
    justify-content: end;
}
.catalog-product-grid [data-testid="catalog-product-card-preview"] > a:first-of-type {
    height: 200px;
    min-height: 0;
}
@media (max-width: 860px) {
    .catalog-product-grid > article {
        height: auto;
        min-height: 224px;
        contain: none;
        content-visibility: visible;
    }
    .catalog-product-grid > article > div:last-child {
        gap: 8px;
    }
    .catalog-product-grid [data-testid="catalog-product-card-preview"] > a:first-of-type {
        height: auto;
        align-self: stretch;
    }
    .catalog-product-grid > article > div:last-child > a[href]:not(:last-child) {
        font-size: 14px;
    }
    .catalog-product-grid [data-testid="catalog-product-card-preview"] > div:last-child > div:nth-last-child(2) {
        min-height: 0;
    }
}
`;
write(p,s);
