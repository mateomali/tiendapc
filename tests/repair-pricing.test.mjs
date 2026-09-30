import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync(new URL('../resources/js/repairPricing.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { repairFinancialSummary, ticketFinancialSummary } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const pricing = { cashDiscountEnabled: true, cashDiscountThreshold: 30000, cashDiscountPercentage: 10 };
const repair = (enabled, amount = 50000, method = 'transferencia') => ({ monto: amount, cash_discount_enabled: enabled, payments: [{ payment_type: 'senia', amount: 11000, method }] });

test('disabled discount keeps both balances equal regardless of deposit method', () => {
    const result = repairFinancialSummary(repair(false), pricing);
    assert.equal(result.listTotal, 50000);
    assert.equal(result.cashDue, 39000);
    assert.equal(result.listDue, 39000);
    assert.equal(result.discountApplies, false);
});
test('threshold is strict and payment method has no effect below or at it', () => {
    for (const amount of [20000, 30000]) {
        assert.deepEqual(repairFinancialSummary(repair(true, amount), pricing), repairFinancialSummary(repair(true, amount, 'efectivo'), pricing));
    }
});
test('transfer deposit reduces eligible regular balance by its actual value', () => {
    const result = repairFinancialSummary(repair(true), pricing);
    assert.equal(result.listTotal, 55000);
    assert.equal(result.listDue, 44000);
    assert.equal(Math.round(result.cashDue), 40000);
});
test('mixed order sums each work without applying discount to ineligible work', () => {
    const result = ticketFinancialSummary([repair(true), repair(false)], pricing);
    assert.equal(result.listTotal, 105000);
    assert.equal(result.listDue, 83000);
    assert.equal(Math.round(result.cashDue), 79000);
});
test('two small jobs do not become eligible just because their sum exceeds threshold', () => {
    const result = ticketFinancialSummary([repair(true, 20000), repair(true, 20000)], pricing);
    assert.equal(result.listTotal, 40000);
    assert.equal(result.discountApplies, false);
});
test('global setting disables all discounts', () => {
    assert.equal(repairFinancialSummary(repair(true), { ...pricing, cashDiscountEnabled: false }).listTotal, 50000);
});
