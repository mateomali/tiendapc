const { chromium } = require('playwright');
const { expect } = require('@playwright/test');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const base = 'http://127.0.0.1:8090/productos';
    const seed = '?q=cable&ofertas=1&novedades=1&destacados=1&orden=precio_desc';
    for (const width of [1366, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const action of ['category', 'group', 'all']) {
            await page.goto(base + seed);
            if (width > 860) {
                await page.locator('.desktop-catalog-actions').getByRole('button', { name: 'Categorías', exact: true }).click();
                const selectors = { category: '.desktop-category-links button', group: '.desktop-category-heading', all: '.desktop-all-categories' };
                await page.locator(selectors[action]).first().click();
            } else {
                await page.getByRole('button', { name: 'Abrir categorías', exact: true }).click();
                const dialog = page.locator('.mobile-catalog-dialog');
                if (action === 'all') await dialog.locator('.mobile-category-all').click();
                else {
                    await dialog.locator('summary').first().click();
                    await dialog.locator('.mobile-category-links button').nth(action === 'group' ? 0 : 1).click();
                }
            }
            await expect(page).not.toHaveURL(/q=cable/);
            const params = new URL(page.url()).searchParams;
            for (const key of params.keys()) assert(['grupo', 'categoria'].includes(key), key);
            assert.equal(params.has('categoria'), action === 'category');
            assert.equal(params.has('grupo'), action !== 'all');
            console.log(width + ' category reset: ' + action);
        }
        await page.goto(base);
        await page.locator('.mobile-catalog-controls, .desktop-catalog-toolbar').first().waitFor({ state: 'attached' });
        const { props } = JSON.parse(await page.locator('script[type="application/json"]').textContent());
        const categories = props.categories.slice(0, 2);
        for (const multi of [false, true]) {
            const params = new URLSearchParams(seed.slice(1));
            params.set('grupo', categories[0].groupKey);
            if (multi) categories.forEach((category, i) => params.set(`categorias[${i}]`, category.slug));
            else params.set('categoria', categories[0].slug);
            await page.goto(base + '?' + params);
            if (width <= 860) await page.getByRole('button', { name: 'Abrir búsqueda' }).click();
            const input = page.locator('#mobile-store-search input');
            await input.fill('parlante');
            await input.press('Enter');
            await expect(page).toHaveURL(base + '?q=parlante');
            await input.fill('');
            await input.press('Enter');
            await expect(page).toHaveURL(base);
            console.log(width + ' global search reset: ' + (multi ? 'multiple categories' : 'single category'));
        }
    }
    assert.deepEqual(errors, []);
    await browser.close();
    console.log('PASS: category/group/all and searches clear active filters on desktop and mobile');
})().catch(e => { console.error(e); process.exit(1); });
