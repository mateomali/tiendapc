const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname.startsWith('/build/')) {
            const file = path.resolve('public', '.' + pathname);
            return route.fulfill({ body: fs.readFileSync(file), contentType: file.endsWith('.css') ? 'text/css' : 'application/javascript' });
        }
        if (pathname === '/entregados') return route.fulfill({ body: fs.readFileSync('tmp/delivered-preview.html'), contentType: 'text/html' });
        return route.fulfill({ status: 204, body: '' });
    });
    await page.goto('http://localhost/entregados');
    await page.getByRole('button', { name: 'Historial del teléfono', exact: true }).first().waitFor();
    await page.screenshot({ path: 'tmp/delivered-verified-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Historial del teléfono', exact: true }).first().click();
    const remove = page.getByRole('button', { name: /Eliminar trabajo completo/ });
    if (await remove.count() === 0) throw new Error('Missing history delete actions');
    await page.getByText('Seña previa', { exact: true }).first().waitFor();
    if (await page.getByText(/Cambio de estado:/).count()) throw new Error('Redundant state changes in history');
    await page.screenshot({ path: 'tmp/delivered-verified-history.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'tmp/delivered-verified-mobile.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Mobile horizontal overflow');
    if (errors.length) throw new Error(errors.join('\n'));
    console.log('Desktop, mobile and history delete controls verified.');
    await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
