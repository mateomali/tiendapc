import type { RepairOrderView, RepairPaymentView } from './types';

export interface TicketPricingSettings {
    cashDiscountEnabled: boolean;
    cashDiscountThreshold: number;
    cashDiscountPercentage: number;
    cashDiscountNote: string;
}

export function cashDiscountApplies(cashAmount: number, pricing: TicketPricingSettings): boolean {
    return pricing.cashDiscountEnabled && pricing.cashDiscountPercentage > 0 && cashAmount > pricing.cashDiscountThreshold;
}

export function listAmount(cashAmount: number, discountApplies: boolean, pricing: TicketPricingSettings): number {
    return discountApplies ? Math.round(Math.max(0, cashAmount) * (1 + pricing.cashDiscountPercentage / 100)) : Math.max(0, cashAmount);
}

function paymentMethod(payment: RepairPaymentView): 'efectivo' | 'transferencia' {
    return payment.method === 'transferencia' ? 'transferencia' : 'efectivo';
}

function paymentCashEquivalent(payment: RepairPaymentView, discountApplies: boolean, pricing: TicketPricingSettings): number {
    const amount = Number(payment.amount ?? 0);

    return discountApplies && paymentMethod(payment) === 'transferencia' ? amount / (1 + pricing.cashDiscountPercentage / 100) : amount;
}

export function repairFinancialSummary(repair: RepairOrderView, pricing: TicketPricingSettings): { cashTotal: number; listTotal: number; paidActual: number; cashDue: number; listDue: number; discountApplies: boolean } {
    const isCancelled = repair.estado === 'CANCELADA';
    const cashTotal = isCancelled ? 0 : Math.max(0, Number(repair.monto ?? 0));
    const discountApplies = !isCancelled && (repair.cash_discount_enabled ?? true) && cashDiscountApplies(cashTotal, pricing);
    const deposits = isCancelled ? [] : (repair.payments ?? []).filter((payment) => payment.payment_type === 'senia');
    const paidActual = deposits.reduce((total, payment) => total + Number(payment.amount ?? 0), 0);
    const paidCashEquivalent = deposits.reduce((total, payment) => total + paymentCashEquivalent(payment, discountApplies, pricing), 0);
    const cashDue = Math.max(0, cashTotal - paidCashEquivalent);

    return {
        cashTotal,
        listTotal: listAmount(cashTotal, discountApplies, pricing),
        paidActual,
        cashDue,
        listDue: listAmount(cashDue, discountApplies, pricing),
        discountApplies,
    };
}

export function ticketFinancialSummary(repairs: RepairOrderView[], pricing: TicketPricingSettings): { cashTotal: number; listTotal: number; cashDue: number; listDue: number; paidActual: number; discountApplies: boolean } {
    const items = repairs.map((repair) => repairFinancialSummary(repair, pricing));
    return {
        cashTotal: items.reduce((sum, item) => sum + item.cashTotal, 0),
        listTotal: items.reduce((sum, item) => sum + item.listTotal, 0),
        cashDue: items.reduce((sum, item) => sum + item.cashDue, 0),
        listDue: items.reduce((sum, item) => sum + item.listDue, 0),
        paidActual: items.reduce((sum, item) => sum + item.paidActual, 0),
        discountApplies: items.some((item) => item.discountApplies),
    };
}

