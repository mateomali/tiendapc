import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../resources/js/repairImageUpload.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { prepareRepairImage, prepareRepairImages } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('small files are preserved and empty selections stay empty', async () => {
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    assert.equal(await prepareRepairImage(file), file);
    assert.equal(await prepareRepairImages(null), null);
});

test('large camera photos are resized, compressed and renamed as JPEG', async () => {
    const previousImage = globalThis.Image;
    const previousDocument = globalThis.document;
    const dimensions = [];
    let attempts = 0;
    globalThis.Image = class {
        naturalWidth = 8000;
        naturalHeight = 6000;
        set src(value) { queueMicrotask(() => this.onload()); }
    };
    const canvas = {
        getContext: () => ({ fillRect() {}, drawImage() {} }),
        toBlob(callback, type) {
            dimensions.push([this.width, this.height]);
            callback(new Blob([new Uint8Array(++attempts === 1 ? 1500000 : 500000)], { type }));
        },
    };
    globalThis.document = { createElement: () => canvas };
    try {
        const original = new File([new Uint8Array(10 * 1024 * 1024)], 'camera.png', { type: 'image/png' });
        const result = await prepareRepairImage(original);
        assert.equal(result.type, 'image/jpeg');
        assert.equal(result.name, 'camera.jpg');
        assert.ok(result.size <= 1024 * 1024);
        assert.deepEqual(dimensions, [[2400, 1800], [1800, 1350]]);
        globalThis.Image = class { set src(value) { queueMicrotask(() => this.onerror()); } };
        await assert.rejects(prepareRepairImage(original), /No se pudo leer/);
    } finally {
        globalThis.Image = previousImage;
        globalThis.document = previousDocument;
    }
});
