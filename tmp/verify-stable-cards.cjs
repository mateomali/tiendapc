const { chromium }=require('playwright');const {expect}=require('@playwright/test');const assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:8090/productos');await p.waitForLoadState('networkidle');await p.locator('.catalog-card').first().waitFor();
for(const width of [360,390,768,1024,1366,1920,2560]){
await p.setViewportSize({width,height:1000});await p.waitForTimeout(150);
const metrics=await p.evaluate(()=>{const cards=[...document.querySelectorAll('.catalog-card')];const top=cards[0].getBoundingClientRect().top;const row=cards.filter(c=>Math.abs(c.getBoundingClientRect().top-top)<1);const sections=['.catalog-card-category','.catalog-card-title','.catalog-card-price','.catalog-card-amount','.catalog-card-actions'];return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,columns:row.length,spread:sections.map(sel=>{const y=row.map(c=>c.querySelector(sel).getBoundingClientRect().top);return Math.max(...y)-Math.min(...y)}),gap:cards.slice(0,12).map(c=>{const price=c.querySelector('.catalog-card-price'),title=c.querySelector('.catalog-card-title');return Math.round(price.getBoundingClientRect().top-title.getBoundingClientRect().bottom)})}});
assert(!metrics.overflow);if(width>860)assert(metrics.spread.every(v=>v<1),'Unaligned '+JSON.stringify(metrics));console.log(JSON.stringify(metrics));
if([390,1366,1920].includes(width))await p.screenshot({path:'tmp/catalog-stable-'+width+'.png'});
}
await p.setViewportSize({width:1920,height:1080});await p.locator('.catalog-card').nth(6).scrollIntoViewIfNeeded();await p.screenshot({path:'tmp/catalog-stable-real-images.png'});
await p.setViewportSize({width:1366,height:1000});
const density=p.getByRole('combobox',{name:'Cantidad de productos por fila'});
for(const columns of ['2','3','4','5','6','auto']) {await density.selectOption(columns);await p.reload();await expect(density).toHaveValue(columns);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await p.locator('.catalog-card').nth(2).hover();await p.waitForTimeout(400);
assert.equal(await p.locator('.catalog-card img').evaluateAll(imgs=>imgs.filter(i=>i.complete && i.naturalWidth===0).length),0);
await p.setViewportSize({width:1920,height:1080});await p.goto('http://127.0.0.1:8090/productos?q=SOUNDSTREAM');await p.waitForLoadState('networkidle');
assert.equal(await p.locator('.catalog-card').count(),1);
assert(await p.locator('.catalog-card').evaluate(c=>c.offsetWidth<400));
await p.screenshot({path:'tmp/catalog-stable-single-result.png'});
await p.goto('http://127.0.0.1:8090/productos?q=zzzznonexistentzzzz');await p.getByRole('heading',{name:'No encontramos productos para ese filtro.'}).waitFor();
await p.setViewportSize({width:390,height:844});await p.goto('http://127.0.0.1:8090/productos');await p.getByRole('button',{name:'Filtros',exact:true}).click();await p.getByRole('dialog').getByRole('button',{name:'Ofertas',exact:true}).click();const chip=p.getByRole('button',{name:'Quitar filtro: Ofertas',exact:true});await chip.waitFor();await chip.click();await expect(chip).toHaveCount(0);
const c=p.locator('.catalog-card').first();await c.getByRole('button',{name:'Agregar',exact:true}).click();await p.getByRole('link',{name:/Ver carrito/}).waitFor();await p.screenshot({path:'tmp/catalog-stable-cart-mobile.png'});await c.getByRole('button',{name:'Quitar este producto del carrito'}).click();await expect(p.getByRole('link',{name:/Ver carrito/})).toHaveCount(0);assert.deepEqual(errors,[]);await b.close();console.log('PASS: layout, density persistence, image hover, sparse/empty search, filters, cart, JavaScript');})().catch(e=>{console.error(e);process.exit(1)});
