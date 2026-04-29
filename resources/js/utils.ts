export function formatCurrency(value: number | string): string {
    const amount = typeof value === 'string' ? Number(value) : value;

    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
}

export function cn(...values: Array<string | false | null | undefined>): string {
    return values.filter(Boolean).join(' ');
}
