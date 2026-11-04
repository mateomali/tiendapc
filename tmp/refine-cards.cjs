const fs=require('fs');const p='resources/js/pages/Store/CatalogPage.tsx';let s=fs.readFileSync(p,'utf8');const start=s.indexOf('function CatalogProductPreviewCard('),end=s.indexOf('export default function CatalogPage',start);let c=s.slice(start,end);
c=c.replace('    const [imageIndex, setImageIndex] = useState(0);','    const [imageIndex, setImageIndex] = useState(0);\n    const [failedImages, setFailedImages] = useState<string[]>([]);');
c=c.replace('                <img\n', `                {activeImage === product.imageFallbackUrl || failedImages.includes(activeImage) ? (
                    <span className="catalog-card-placeholder" role="img" aria-label={\`Imagen no disponible: \${product.name}\`}>
                        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><rect x="7" y="8" width="34" height="32" rx="3" /><circle cx="18" cy="19" r="3" /><path d="m8 34 10-10 8 8 6-6 9 9" /></svg>
                        <span>Imagen no disponible</span>
                    </span>
                ) : <img
`);
c=c.replace(/onError=\{\(event\) => \{[\s\S]*?\}\}\s*\/>/,"onError={() => setFailedImages((current) => current.includes(activeImage) ? current : [...current, activeImage])}\n                />}");
s=s.slice(0,start)+c+s.slice(end);fs.writeFileSync(p,s,'utf8');
const q='resources/css/app.css';s=fs.readFileSync(q,'utf8');
s=s.replace('.catalog-card-photo { width:', '.catalog-card-placeholder { display: grid; justify-items: center; gap: 8px; color: #64748b; font-size: 12px; text-align: center; }\n.catalog-card-placeholder svg { width: 42px; height: 42px; stroke: #94a3b8; stroke-width: 1.5; }\n.catalog-card-photo { width:');
s=s.replace('height: auto; min-height: 190px;', 'height: auto; min-height: 160px;');
s=s.replace('    .catalog-card-amount { font-size: 25px; }', '    .catalog-card-price { grid-template-rows: 16px 28px auto; }\n    .catalog-card-price-secondary:empty { display: none; }\n    .catalog-card-amount { font-size: 25px; }\n    .catalog-card-placeholder { font-size: 11px; }');
fs.writeFileSync(q,s,'utf8');
