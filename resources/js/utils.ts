export function formatCurrency(value: number | string): string {
    const amount = typeof value === 'string' ? Number(value) : value;

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatAmountInput(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    const raw = String(value);
    const amount = Number(raw);

    if (!Number.isFinite(amount)) {
        return raw;
    }

    return Number.isInteger(amount) ? String(amount) : raw.replace(/0+$/, '').replace(/\.$/, '');
}

export function cn(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(' ');
}
