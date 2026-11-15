import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import ts from 'typescript';
import { build } from 'rolldown';
import { chromium } from 'playwright';

let browser, server, baseURL;
before(async () => {
    const fixture = path.resolve('tests/fixtures/intake-browser.tsx');
    const result = await build({
        input: fixture,
        plugins: [{
            name: 'intake-test-adapter',
            resolveId(source) {
                if (source === '@inertiajs/react' || source.endsWith('/layouts/RepairLayout')) return '\0intake-adapter';
            },
            load(id) {
                if (id === '\0intake-adapter') return `export { usePage, useForm, Link, router, RepairLayout } from ${JSON.stringify(fixture.replaceAll('\\', '/'))};`;
            },
            transform(code, id) {
                if (/\.tsx?$/.test(id)) return ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
            },
        }],
        output: { format: 'iife', name: 'IntakePreview' }, write: false,
    });
    const bundle = 'window.process={env:{NODE_ENV:"production"}};' + result.output.find((file) => file.type === 'chunk').code;
    const cssFile = fs.readdirSync('public/build/assets').find((file) => file.startsWith('app-') && file.endsWith('.css'));
    const css = fs.readFileSync(`public/build/assets/${cssFile}`, 'utf8');
    server = http.createServer((request, response) => {
        if (request.url === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript; charset=utf-8'); response.end(bundle); }
        else if (request.url === '/style.css') { response.setHeader('Content-Type', 'text/css'); response.end(css); }
        else { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end('<html><head><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>'); }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); await new Promise((resolve) => server?.close(resolve)); });

async function openMobile() {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.on('pageerror', (error) => console.error('Browser error:', error.message));
    await page.route('**/repairs.lookup?*', (route) => route.fulfill({ json: null }));
    await page.goto(baseURL);
    await page.waitForFunction(() => document.activeElement?.getAttribute('placeholder') === 'Ej: Juan P\u00e9rez', { timeout:5000 });
    return { page, context };
}

test('mobile starts at customer, compact ID stays editable, Enter advances fields', async () => {
    const { page, context } = await openMobile();
    try {
        const name = page.getByPlaceholder('Ej: Juan Pérez');
        assert.equal(await page.locator('[data-intake-field="order-id"]').count(), 0);
        await page.getByRole('button', { name: 'Editar ID' }).click();
        await page.locator('[data-intake-field="order-id"]').fill('3000');
        await page.getByRole('button', { name: 'Listo', exact: true }).click();
        await name.fill('Cliente móvil');
        if (process.env.INTAKE_VISUAL_CHECK) {
            const bounds = await page.getByRole('button', { name: 'Siguiente', exact: true }).boundingBox();
            assert.ok(bounds.y + bounds.height <= 844);
            assert.ok(bounds.height >= 44);
            assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
            fs.mkdirSync('dist/qa', { recursive: true });
            await page.screenshot({ path: 'dist/qa/repair-intake-mobile.png' });
        }
        await name.press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('inputmode')), 'numeric');
        await page.getByPlaceholder('00000000').press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('type')), 'tel');
        await page.getByPlaceholder('Ej: 11 5555 5555').press('Enter');
        await page.waitForFunction(() => document.activeElement?.getAttribute('data-intake-field') === 'job-0-model');
        assert.equal(await page.evaluate(() => window.__submitted), undefined);
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
        assert.equal(await page.locator('[data-intake-field="job-0-model"]').getAttribute('aria-invalid'), 'true');
        await page.locator('[role="status"]').filter({ hasText: 'Borrador guardado en este dispositivo.' }).waitFor({ state: 'attached' });
        await page.reload();
        await page.waitForFunction(() => !document.querySelector('#intake-flow-form')?.inert);
        assert.equal(await page.evaluate(() => window.__intakeData.id_orden), '3000');
    } finally { await context.close(); }
});

test('desktop keeps continuous intake and does not force focus or scroll', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
        const page = await context.newPage();
        await page.goto(baseURL);
        await page.waitForFunction(() => !document.querySelector('#intake-flow-form')?.inert);
        assert.equal(await page.evaluate(() => document.activeElement.tagName), 'BODY');
        assert.equal(await page.evaluate(() => scrollY), 0);
        assert.equal(await page.getByRole('button', { name: 'Siguiente', exact: true }).count(), 0);
    } finally { await context.close(); }
});

test('draft restores data and actual photo files; automatic ID uses current server suggestion', async () => {
    const { page, context } = await openMobile();
    try {
        await page.getByPlaceholder('Ej: Juan Pérez').fill('Borrador con foto');
        await page.locator('input[type="file"]').first().setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('test photo') });
        await page.waitForFunction(() => window.__intakeData.jobs[0].images?.length === 1);
        await page.locator('[role="status"]').filter({ hasText: 'Borrador guardado en este dispositivo.' }).waitFor();
        await page.goto(baseURL + '/?order=2400');
        await page.waitForFunction(() => window.__intakeData?.nombre_cliente === 'Borrador con foto');
        assert.equal(await page.evaluate(() => window.__intakeData.id_orden), '2400');
        assert.deepEqual(await page.evaluate(async () => {
            const file = window.__intakeData.jobs[0].images[0];
            return { isFile: file instanceof File, name: file.name, content: await file.text() };
        }), { isFile: true, name: 'photo.jpg', content: 'test photo' });
        await page.getByRole('button', { name: 'Descartar borrador' }).click();
        await page.waitForFunction(() => window.__intakeData.nombre_cliente === '');
        await page.reload();
        await page.waitForFunction(() => !document.querySelector('#intake-flow-form')?.inert);
        assert.equal(await page.getByPlaceholder('Ej: Juan Pérez').inputValue(), '');
    } finally { await context.close(); }
});

test('DNI autofills blanks, preserves corrections and ignores obsolete requests', async () => {
    const { page, context } = await openMobile();
    try {
        await page.unroute('**/repairs.lookup?*');
        await page.route('**/repairs.lookup?*', async (route) => {
            const dni = new URL(route.request().url()).searchParams.get('dni');
            await new Promise((resolve) => setTimeout(resolve, dni === '11111111' ? 700 : 30));
            await route.fulfill({ json: { dni: Number(dni), nombre_cliente: 'Cliente ' + dni, contacto: '1155555555', ultima_orden: 12 } }).catch(() => {});
        });
        const dni = page.getByPlaceholder('00000000');
        await dni.fill('11111111');
        await page.waitForRequest('**/repairs.lookup?dni=11111111');
        await dni.fill('22222222');
        await page.waitForFunction(() => window.__intakeData.nombre_cliente === 'Cliente 22222222');
        await page.getByPlaceholder('Ej: Juan Pérez').fill('Nombre corregido');
        await page.getByRole('button', { name: 'Buscar por DNI', exact: true }).click();
        await page.getByRole('button', { name: 'Siguiente', exact: true }).waitFor({ state: 'visible' });
        assert.equal(await page.getByPlaceholder('Ej: Juan Pérez').inputValue(), 'Nombre corregido');
        assert.equal(await page.getByPlaceholder('Ej: 11 5555 5555').inputValue(), '1155555555');
    } finally { await context.close(); }
});

test('valid steps focus pending fields and successful submit clears the draft', async () => {
    const { page, context } = await openMobile();
    try {
        await page.getByPlaceholder('Ej: Juan Pérez').fill('Orden completa');
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
        await page.getByPlaceholder('Ej: Samsung A54').fill('Equipo de prueba');
        await page.getByRole('combobox', { name: 'Elegir falla o servicio', exact: true }).selectOption('service:pantalla');
        await page.getByRole('textbox', { name: 'Monto', exact: true }).fill('1234,50');
        await page.getByRole('textbox', { name: 'Seña', exact: true }).fill('100,25');
        assert.equal(await page.getByRole('textbox', { name: 'Monto', exact: true }).inputValue(), '1234.50');
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('[data-intake-section="extras"]')?.contains(document.activeElement));
        await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.getAttribute('data-intake-section') === 'summary');
        await page.evaluate(() => { window.__saveSucceeds = true; });
        await page.getByRole('button', { name: 'Guardar orden', exact: true }).click();
        await page.waitForFunction(() => window.__intakeData.nombre_cliente === '');
        assert.equal(await page.evaluate(() => window.__submitted.jobs[0].monto), '1234.50');
        await page.reload();
        await page.waitForFunction(() => !document.querySelector('#intake-flow-form')?.inert);
        assert.equal(await page.getByPlaceholder('Ej: Juan Pérez').inputValue(), '');
    } finally { await context.close(); }
});
