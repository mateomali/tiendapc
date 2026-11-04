const fs=require('fs');const p='resources/js/pages/Store/CatalogPage.tsx';let s=fs.readFileSync(p,'utf8');const start=s.indexOf('function CatalogProductPreviewCard('),end=s.indexOf('export default function CatalogPage',start);let c=s.slice(start,end);
c=c.replace(/className="group relative grid min-h-\[248px\][^"]*"/,'className="catalog-card group"');
c=c.replace(/className="relative flex min-h-\[178px\][^"]*"/,'className="catalog-card-image"');
c=c.replace(/className="h-full max-h-\[220px\][^"]*"/,'className="catalog-card-photo"');
c=c.replace(/className="grid min-w-0 content-start gap-2 p-3[^"]*"/,'className="catalog-card-content"');
c=c.replace(/className="catalog-preview-title-font m-0 min-w-0 truncate[^"]*"/,'className="catalog-card-category catalog-preview-title-font"');
c=c.replace(/className="catalog-preview-title-font line-clamp-2[^"]*"/,'className="catalog-card-title catalog-preview-title-font"');
const a=c.indexOf('                <div className="mt-1 grid'),b=c.indexOf('                <div className="mt-auto',a);
c=c.slice(0,a)+`                <div className={\`catalog-card-price \${product.cashPrice ? 'catalog-card-price-cash' : ''}\`}>
                    <div className="catalog-card-price-caption">
                        {product.cashPrice ? <span>En efectivo</span> : <span>Precio</span>}
                        {product.hasOffer ? <span className="catalog-card-before">Antes <s>\$\${product.priceLabel}</s></span> : null}
                    </div>
                    <strong className="catalog-card-amount catalog-preview-price-font">
                        \$\${product.cashPrice ? product.cashPriceLabel : product.displayPriceLabel}
                    </strong>
                    <div className="catalog-card-price-secondary">
                        {product.cashPrice ? <span>Otros medios <b>\$\${product.displayPriceLabel}</b></span> : null}
                    </div>
                </div>

`+c.slice(b);
c=c.replace('className="mt-auto grid gap-1.5 pt-1"','className="catalog-card-actions"');
c=c.replace("if (event.currentTarget.dataset.fallback) { event.currentTarget.style.visibility = 'hidden'; return; }", "if (event.currentTarget.dataset.fallback) { return; }");
s=s.slice(0,start)+c+s.slice(end);
fs.writeFileSync(p,s.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n'),'utf8');
