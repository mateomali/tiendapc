const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const audit = async name => {
        const result = await page.evaluate(() => {
            const parse = color => color.match(/[\d.]+/g).map(Number);
            const luminance = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
            const roots = document.querySelectorAll('.desktop-catalog-toolbar, .desktop-catalog-popover, .catalog-active-filters, .mobile-catalog-controls, .mobile-catalog-dialog, .mobile-store-bar');
            const failures = [];
            let checked = 0;
            for (const root of roots) {
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
                let node;
                while ((node = walker.nextNode())) {
                    const element = node.parentElement;
                    if (!node.textContent.trim() || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || element.tagName === 'OPTION') continue;
                    const ancestors = [];
                    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) ancestors.unshift(ancestor);
                    let bg = [255, 255, 255];
                    for (const ancestor of ancestors) {
                        const ancestorStyle = getComputedStyle(ancestor);
                        const color = parse(ancestorStyle.backgroundColor);
                        const alpha = color[3] ?? 1;
                        bg = bg.map((v, i) => color[i] * alpha + v * (1 - alpha));
                        for (const layer of ancestorStyle.backgroundImage.split(/,\s*(?=(?:radial|linear)-gradient)/).reverse()) {
                            const stops = layer.match(/rgba?\([^)]+\)/g)?.map(parse);
                            if (!stops) continue;
                            const stop = stops.sort((a, b) => luminance(b) - luminance(a))[0];
                            const opacity = stop[3] ?? 1;
                            bg = bg.map((v, i) => stop[i] * opacity + v * (1 - opacity));
                        }
                    }
                    const style = getComputedStyle(element);
                    const fg = parse(style.color);
                    const light = luminance(fg), dark = luminance(bg);
                    const ratio = (Math.max(light, dark) + .05) / (Math.min(light, dark) + .05);
                    const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight) >= 700);
                    checked++;
                    if (ratio < (large ? 3 : 4.5)) failures.push({ text: node.textContent.trim(), ratio: ratio.toFixed(2), color: style.color, bg });
                }
            }
            return { checked, failures };
        });
        assert(result.checked > 0);
        assert.deepEqual(result.failures, [], name + ': low contrast');
        await page.screenshot({ path: `tmp/color-audit-${name}.png` });
        console.log(name + ': ' + result.checked + ' text colors pass');
    };
    await page.goto('http://127.0.0.1:8090/productos?ofertas=1');
    await page.locator('.desktop-catalog-toolbar').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await audit('desktop');
    for (const [name, id] of [['Categorías', 'desktop-categories'], ['Filtros (1)', 'desktop-filters'], ['Vista', 'desktop-view']]) {
        await page.locator('.desktop-catalog-actions').getByRole('button', { name, exact: true }).click();
        await audit(id);
        if (id === 'desktop-categories') {
            await page.locator('.desktop-category-links button').first().hover();
            await audit('desktop-category-hover');
        }
        await page.keyboard.press('Escape');
    }
    for (const select of ['#desktop-catalog-order', '#desktop-grid-columns']) {
        const options = await page.locator(select + ' option').evaluateAll(elements => elements.map(e => ({ text: e.textContent, color: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })));
        for (const option of options) { assert.equal(option.color, 'rgb(255, 255, 255)'); assert.equal(option.bg, 'rgb(16, 38, 76)'); }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await audit('mobile');
    await page.getByRole('button', { name: 'Abrir categorías', exact: true }).click();
    await page.locator('.mobile-catalog-dialog summary').first().click();
    await audit('mobile-categories');
    await page.keyboard.press('Escape');
    await page.locator('.mobile-catalog-buttons').getByRole('button', { name: 'Filtros (1)', exact: true }).click();
    await audit('mobile-filters');
    await page.keyboard.press('Escape');
    await page.locator('#mobile-catalog-order').click();
    await page.screenshot({ path: 'tmp/color-audit-mobile-order.png' });
    const colors = await page.locator('#mobile-catalog-order option').evaluateAll(es => es.map(e => [getComputedStyle(e).color, getComputedStyle(e).backgroundColor]));
    for (const [color, bg] of colors) { assert.equal(color, 'rgb(255, 255, 255)'); assert.equal(bg, 'rgb(16, 38, 76)'); }
    assert.deepEqual(errors, []);
    await browser.close();
    console.log('PASS: contrast, desktop/mobile panels, hover, selected categories, native options, JavaScript');
})().catch(error => { console.error(error); process.exit(1); });
