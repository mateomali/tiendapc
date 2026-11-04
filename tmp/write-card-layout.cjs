const fs=require('fs');let p='resources/js/pages/Store/CatalogPage.tsx',s=fs.readFileSync(p,'utf8').replaceAll('$'+'$'+'{','$'+'{');fs.writeFileSync(p,s,'utf8');
p='resources/css/app.css';s=fs.readFileSync(p,'utf8');s=s.slice(0,s.indexOf('/* Keep catalog text'));
s+=`/* Catalog: shared rows keep names, amounts and actions aligned per product row. */
.catalog-card {
    position: relative;
    display: grid;
    grid-template-rows: 180px auto auto auto auto;
    min-width: 0;
    overflow: hidden;
    border: 1px solid #dbe3ef;
    border-radius: 10px;
    background: white;
    color: #102146;
    gap: 8px;
}
.catalog-card-content { display: contents; }
.catalog-card-image {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 180px;
    padding: 16px;
    overflow: hidden;
    background: #f8fafc;
    border-bottom: 1px solid #edf0f5;
}
.catalog-card-photo { width: 100%; height: 100%; object-fit: contain; }
.catalog-card-category {
    margin: 0 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 10px;
    line-height: 14px;
    color: #526580;
    text-transform: uppercase;
}
.catalog-card-title {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    margin: 0 12px;
    font-size: 14px;
    line-height: 18px;
    text-transform: uppercase;
    text-decoration: none;
    color: #102146;
}
.catalog-card-price {
    display: grid;
    grid-template-rows: 16px 28px 18px;
    align-content: start;
    margin: 0 12px;
    padding: 6px 8px;
    border: 1px solid transparent;
    border-radius: 6px;
    text-align: center;
}
.catalog-card-price-cash { background: #effbf4; border-color: #bbebcd; }
.catalog-card-price-caption {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 10px;
    font-weight: 700;
    line-height: 14px;
}
.catalog-card-price-cash .catalog-card-price-caption { color: #096545; }
.catalog-card-before { color: #64748b; font-size: 10px; font-weight: 400; }
.catalog-card-amount { font-size: 27px; line-height: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }
.catalog-card-price-secondary { font-size: 10px; line-height: 16px; color: #526580; }
.catalog-card-price-secondary b { margin-left: 4px; color: #243b58; }
.catalog-card-actions { display: grid; align-content: start; gap: 6px; margin: 0 12px 12px; }
.catalog-card-actions > button { min-height: 44px; }
.catalog-product-grid :is(button,a):focus-visible { outline: 2px solid #2456b4; outline-offset: 2px; }
@media (min-width: 861px) {
    @supports (grid-template-rows: subgrid) {
        .catalog-product-grid:has(.catalog-card) { row-gap: 8px; }
        .catalog-card { grid-row: span 5; grid-template-rows: subgrid; }
    }
}
@media (max-width: 860px) {
    .catalog-card {
        grid-template-columns: 38% minmax(0,1fr);
        grid-template-rows: auto auto auto auto;
        row-gap: 6px;
        column-gap: 0;
        padding-top: 10px;
    }
    .catalog-card-image { grid-column: 1; grid-row: 1 / span 4; height: auto; min-height: 190px; margin-top: -10px; border-bottom: 0; border-right: 1px solid #edf0f5; padding: 10px; }
    .catalog-card-photo { max-height: 180px; }
    .catalog-card-category { grid-column: 2; grid-row: 1; margin: 0 10px; font-size: 9px; }
    .catalog-card-title { grid-column: 2; grid-row: 2; margin: 0 10px; }
    .catalog-card-price { grid-column: 2; grid-row: 3; margin: 0 10px; padding: 4px; }
    .catalog-card-actions { grid-column: 2; grid-row: 4; margin: 0 10px 10px; }
    .catalog-card-amount { font-size: 25px; }
    .catalog-card-before { font-size: 9px; }
}
`;
fs.writeFileSync(p,s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),'utf8');
