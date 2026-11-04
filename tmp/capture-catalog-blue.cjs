const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
    const round = process.argv[2] || '1';
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto('http://127.0.0.1:8090/productos');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    if (round !== 'final') await page.addStyleTag({ content: fs.readFileSync('tmp/catalog-blue-design.css', 'utf8') });
    await page.evaluate(() => document.querySelector('[aria-label="Filtros activos"]')?.classList.add('catalog-active-filters'));
    await page.screenshot({ path: `tmp/catalog-blue-${round}-toolbar.png` });
    for (const [name, id] of [['Categorías', 'desktop-categories'], ['Filtros', 'desktop-filters'], ['Vista', 'desktop-view']]) {
        await page.locator('.desktop-catalog-toolbar').getByRole('button', { name, exact: true }).click();
        await page.screenshot({ path: `tmp/catalog-blue-${round}-${id}.png` });
        if (id === 'desktop-categories') console.log(await page.locator('#'+id).evaluate(e => ({ top: e.style.top, rect: e.getBoundingClientRect().toJSON(), alignSelf: getComputedStyle(e).alignSelf, positionArea: getComputedStyle(e).positionArea })));
        await page.keyboard.press('Escape');
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.locator('.desktop-catalog-toolbar').getByRole('button', { name: 'Categorías', exact: true }).click();
    await page.screenshot({ path: `tmp/catalog-blue-${round}-1920.png` });
    await page.locator('.desktop-category-groups button').nth(1).click();
    await page.screenshot({ path: `tmp/catalog-blue-${round}-selected-group.png` });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('.desktop-catalog-toolbar').getByRole('button', { name: 'Categorías', exact: true }).click();
    await page.screenshot({ path: `tmp/catalog-blue-${round}-1024.png` });
    if (round === 'final') {
        await page.goto('http://127.0.0.1:8090/productos?ofertas=1');
        await page.setViewportSize({ width: 1366, height: 900 });
        await page.waitForTimeout(800);
        await page.screenshot({ path: 'tmp/catalog-blue-final-active-filters.png' });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: 'tmp/catalog-blue-final-mobile.png' });
    }
    await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
