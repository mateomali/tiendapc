/**
 * Tokens semánticos únicos por estado de reparación.
 * Todo componente (badge, dot, select, rail, header, texto) deriva de este mapa
 * para que un mismo estado tenga exactamente el mismo color en toda la UI.
 */

type StatusToken = {
    /** Etiqueta base: el color vivo del estado (dot, borde, énfasis). */
    strong: string;
    /** Fondo suave para badges/pills. */
    softBg: string;
    /** Borde suave para badges/pills. */
    softBorder: string;
    /** Texto sobre fondo suave. */
    softText: string;
    /** Color de texto plano (sin fondo). */
    text: string;
};

const STATUS_TOKENS: Record<string, StatusToken> = {
    LISTA: {
        strong: '#16a34a',
        softBg: '#dcfce7',
        softBorder: '#86efac',
        softText: '#14532d',
        text: '#15803d',
    },
    CANCELADA: {
        strong: '#dc2626',
        softBg: '#fee2e2',
        softBorder: '#fecaca',
        softText: '#7f1d1d',
        text: '#b91c1c',
    },
    GARANTIA: {
        strong: '#0f766e',
        softBg: '#ccfbf1',
        softBorder: '#5eead4',
        softText: '#134e4a',
        text: '#0f766e',
    },
    'EN REPARACION': {
        strong: '#7c3aed',
        softBg: '#f3e8ff',
        softBorder: '#d8b4fe',
        softText: '#581c87',
        text: '#6d28d9',
    },
    'EN REPARACION / ESPERA REPUESTO': {
        strong: '#7c3aed',
        softBg: '#f3e8ff',
        softBorder: '#d8b4fe',
        softText: '#581c87',
        text: '#6d28d9',
    },
    PENDIENTE: {
        strong: '#d97706',
        softBg: '#fef3c7',
        softBorder: '#fde68a',
        softText: '#713f12',
        text: '#b45309',
    },
    DEFAULT: {
        strong: '#64748b',
        softBg: '#f1f5f9',
        softBorder: '#cbd5e1',
        softText: '#334155',
        text: '#64748b',
    },
};

const NORMALIZE_REPLACEMENTS: Array<[RegExp, string]> = [
    [/^EN REPARACION \/ ESPERA REPUESTO$/, 'EN REPARACION / ESPERA REPUESTO'],
    [/^EN REPARACION$/, 'EN REPARACION'],
];

export function normalizeStatusKey(status: string): string {
    const upper = status.trim().toUpperCase();

    for (const [pattern, label] of NORMALIZE_REPLACEMENTS) {
        if (pattern.test(upper)) {
            return label;
        }
    }

    return upper;
}

function tokenFor(status: string): StatusToken {
    return STATUS_TOKENS[normalizeStatusKey(status)] ?? STATUS_TOKENS.DEFAULT;
}

/** Badge pill con borde y fondo suave (estado → texto visible). */
export function repairStatusBadgeClass(status: string): string {
    const token = tokenFor(status);

    return `rounded-full border border-[${token.softBorder}] bg-[${token.softBg}] text-[${token.softText}]`;
}

/** Dot pequeño de estado (estado → color vivo). */
export function repairStatusDotClass(status: string): string {
    return `bg-[${tokenFor(status).strong}]`;
}

/** Borde-izquierda de fila/panel desktop. */
export function repairStatusRailClass(status: string): string {
    return `border-l-[${tokenFor(status).strong}]`;
}

/** Fill (::before) del rail. */
export function repairStatusRailFillClass(status: string): string {
    return `before:bg-[${tokenFor(status).strong}]`;
}

/** Header de tarjeta con borde izquierdo semántico. */
export function repairStatusHeaderClass(status: string): string {
    return `border-l-4 ${repairStatusRailClass(status)} bg-[#f8fafc] text-[#0f172a]`;
}

/** Select con estado pintado (borde + fondo suave + texto). */
export function repairStatusSelectClass(status: string): string {
    const token = tokenFor(status);

    return `border-[${token.strong}] bg-[${token.softBg}] text-[${token.softText}]`;
}

/** Texto plano de estado (sin fondo). */
export function repairStatusTextClass(status: string): string {
    return `text-[${tokenFor(status).text}]`;
}

/** Compacta el estado a una etiqueta corta legible. */
export function compactStatus(status: string): string {
    const normalized = normalizeStatusKey(status);

    return normalized === 'EN REPARACION / ESPERA REPUESTO' ? 'EN REPARACION' : normalized;
}

/** Estado en formato píldora compacta (solo texto). */
export function compactStatusLabel(status: string): string {
    const normalized = normalizeStatusKey(status);

    if (normalized === 'EN REPARACION' || normalized === 'EN REPARACION / ESPERA REPUESTO') {
        return 'REPARACIÓN';
    }

    return normalized;
}
