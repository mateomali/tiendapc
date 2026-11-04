const { chromium } = require('playwright');
const { expect } = require('@playwright/test');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8090/productos');
    const { props } = JSON.parse(await page.locator('script[type="application/json"]').textContent());
    assert(props.categories.length >= 2);
    const selected = props.categories.slice(0, 2);
    for (const width of [320, 390, 430, 768]) {
        await page.setViewportSize({ width, height: 844 });
        await expect(page.locator('.mobile-store-button-label', { hasText: 'Carrito' })).toBeVisible();
        assert(await page.evaluate(() => {
            const logo = document.querySelector('.mobile-store-logo img').getBoundingClientRect();
            const controls = [...document.querySelectorAll('.mobile-store-bar > button, .mobile-store-cart')];
            return logo.width <= 132 && logo.height <= 36 && controls.every(control => {
                const rect = control.getBoundingClientRect();
                return rect.width >= 44 && rect.height >= 44;
            }) && document.documentElement.scrollWidth <= innerWidth;
        }));
        await page.screenshot({ path: `tmp/mobile-header-clear-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const multiple of [false, true]) {
        const params = new URLSearchParams();
        if (multiple) selected.forEach((category, index) => params.set(`categorias[${index}]`, category.slug));
        else { params.set('categoria', selected[0].slug); params.set('grupo', selected[0].groupKey); }
        await page.goto('http://127.0.0.1:8090/productos?' + params);
        await page.getByRole('button', { name: 'Abrir búsqueda' }).click();
        const input = page.locator('#mobile-store-search input');
        for (const query of ['cable', '']) {
            await input.fill(query);
            await input.press('Enter');
            await expect(page).toHaveURL(url => url.searchParams.get('q') === (query || null));
            const url = new URL(page.url());
            if (multiple) selected.forEach((category, index) => assert.equal(url.searchParams.get(`categorias[${index}]`), category.slug));
            else { assert.equal(url.searchParams.get('categoria'), selected[0].slug); assert.equal(url.searchParams.get('grupo'), selected[0].groupKey); }
        }
    }
    assert.deepEqual(errors, []);
    await browser.close();
    console.log('PASS: compact logo, labeled touch controls, responsive widths, single/multiple category search and clearing query');
})().catch(error => { console.error(error); process.exit(1); });
