export interface TicketDateGroup<T extends { repairs: unknown[] }> {
    key: string;
    label: string;
    count: number;
    repairCount: number;
    tickets: T[];
}

export function localDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

const weekdayLabels = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'] as const;
const monthLabels = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
] as const;

export function dateGroupLabel(value?: string | null): string {
    if (!value) {
        return 'Sin fecha';
    }

    const key = value.slice(0, 10);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (key === localDateKey(today)) {
        return 'Hoy';
    }

    if (key === localDateKey(yesterday)) {
        return 'Ayer';
    }

    const [year, month, day] = key.split('-');

    if (!year || !month || !day) {
        return 'Sin fecha';
    }

    const parsedYear = Number(year);
    const parsedMonth = Number(month);
    const parsedDay = Number(day);

    if (
        !Number.isInteger(parsedYear) ||
        !Number.isInteger(parsedMonth) ||
        !Number.isInteger(parsedDay) ||
        parsedMonth < 1 ||
        parsedMonth > 12 ||
        parsedDay < 1 ||
        parsedDay > 31
    ) {
        return 'Sin fecha';
    }

    const date = new Date(parsedYear, parsedMonth - 1, parsedDay);

    if (date.getFullYear() !== parsedYear || date.getMonth() !== parsedMonth - 1 || date.getDate() !== parsedDay) {
        return 'Sin fecha';
    }

    return `${weekdayLabels[date.getDay()]} ${parsedDay} de ${monthLabels[parsedMonth - 1]} del ${parsedYear}`;
}

/**
 * Agrupa tickets por el valor de la fecha provista por `dateFor(ticket)`.
 * La clave `'sin-fecha'` se usa cuando no hay fecha.
 */
export function groupTicketsByDate<T extends { repairs: unknown[] }>(
    tickets: T[],
    dateFor: (ticket: T) => string | null | undefined,
): TicketDateGroup<T>[] {
    const groups = new Map<string, TicketDateGroup<T>>();

    tickets.forEach((ticket) => {
        const value = dateFor(ticket);
        const key = value?.slice(0, 10) || 'sin-fecha';
        const group = groups.get(key);

        if (group) {
            group.tickets.push(ticket);
            group.count += 1;
            group.repairCount += ticket.repairs.length;
            return;
        }

        groups.set(key, {
            key,
            label: dateGroupLabel(value),
            count: 1,
            repairCount: ticket.repairs.length,
            tickets: [ticket],
        });
    });

    return Array.from(groups.values());
}
