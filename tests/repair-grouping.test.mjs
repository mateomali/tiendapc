import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../resources/js/components/RepairTicketPanel.tsx', import.meta.url), 'utf8');
const helpers = source.slice(source.indexOf('function isSameRepair('), source.indexOf('function desktopSameModelAccentClass('));
const js = ts.transpileModule(helpers, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { repairSameModelPosition, repairDeviceGroupPosition, repairSameModelAdjacency } = await import(
    'data:text/javascript;base64,' + Buffer.from(
        'const repairModelGroupKey = repair => repair.modelo;\n' + js
        + '\nexport { repairSameModelPosition, repairDeviceGroupPosition, repairSameModelAdjacency };'
    ).toString('base64')
);

for (const legacy of [true, false]) {
    test('numbers each failure and device with ' + (legacy ? 'legacy' : 'modern') + ' IDs', () => {
        const repairs = ['SAMSUNG A07', 'SAMSUNG A07', 'SAMSUNG A07', 'MOTOROLA E14', 'MOTOROLA E14']
            .map((modelo, index) => ({ id: 2765, reparacion: index + 1, registro_id: legacy ? null : index + 100, modelo }));
        const ticket = { repairs };
        assert.deepEqual(repairs.map(repair => repairSameModelPosition(ticket, { ...repair })), [
            { index: 1, total: 3 }, { index: 2, total: 3 }, { index: 3, total: 3 },
            { index: 1, total: 2 }, { index: 2, total: 2 },
        ]);
        assert.deepEqual(repairs.map(repair => repairDeviceGroupPosition(ticket, repair).index), [1, 1, 1, 2, 2]);
        assert.deepEqual(repairs.map(repair => repairSameModelAdjacency(ticket, repair)), [
            { previous: false, next: true }, { previous: true, next: true }, { previous: true, next: false },
            { previous: false, next: true }, { previous: true, next: false },
        ]);
    });
}
