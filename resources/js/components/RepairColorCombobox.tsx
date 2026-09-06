import { useMemo, useState, type KeyboardEvent } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { cn } from '../utils';

export const phoneBrandOptions = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG', 'OTRAS'] as const;

export const repairColorOptions = [
    { value: '', label: 'Sin color', swatchClass: 'bg-[#f8fafc]' },
    { value: 'NEGRO', label: 'Negro', swatchClass: 'bg-[#111827]' },
    { value: 'BLANCO', label: 'Blanco', swatchClass: 'bg-white' },
    { value: 'GRIS', label: 'Gris', swatchClass: 'bg-[#6b7280]' },
    { value: 'PLATA', label: 'Plata', swatchClass: 'bg-[#c0c0c0]' },
    { value: 'AZUL', label: 'Azul', swatchClass: 'bg-[#2563eb]' },
    { value: 'CELESTE', label: 'Celeste', swatchClass: 'bg-[#38bdf8]' },
    { value: 'ROJO', label: 'Rojo', swatchClass: 'bg-[#dc2626]' },
    { value: 'VERDE', label: 'Verde', swatchClass: 'bg-[#16a34a]' },
    { value: 'AMARILLO', label: 'Amarillo', swatchClass: 'bg-[#facc15]' },
    { value: 'DORADO', label: 'Dorado', swatchClass: 'bg-[#d97706]' },
    { value: 'ROSA', label: 'Rosa', swatchClass: 'bg-[#f472b6]' },
    { value: 'VIOLETA', label: 'Violeta', swatchClass: 'bg-[#7c3aed]' },
    { value: 'NARANJA', label: 'Naranja', swatchClass: 'bg-[#f97316]' },
    { value: 'MARRON', label: 'Marron', swatchClass: 'bg-[#7c2d12]' },
    { value: 'BEIGE', label: 'Beige', swatchClass: 'bg-[#d6b48c]' },
] as const;

export type RepairColorValue = (typeof repairColorOptions)[number]['value'];

export function normalizeRepairKey(value?: string | null): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function repairColorLabel(color?: string | null): string {
    const normalized = normalizeRepairKey(color ?? '');
    const option = repairColorOptions.find((item) => item.value === normalized);

    return option?.label ?? (color ?? '');
}

export function repairColorSwatchClass(color?: string | null): string {
    const normalized = normalizeRepairKey(color ?? '');
    const option = repairColorOptions.find((item) => item.value === normalized);

    return option?.swatchClass ?? 'bg-[#94a3b8]';
}

interface RepairColorComboboxProps {
    className: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function RepairColorCombobox({ className, value, onChange, disabled }: RepairColorComboboxProps): JSX.Element {
    const [open, setOpen] = useState(false);
    const [showAllColors, setShowAllColors] = useState(false);
    const [query, setQuery] = useState(repairColorLabel(value));
    const normalizedQuery = useMemo(() => normalizeRepairKey(query), [query]);
    const filteredOptions = useMemo(() => {
        if (showAllColors || normalizedQuery === '') {
            return repairColorOptions;
        }

        return repairColorOptions.filter((option) =>
            normalizeRepairKey(option.label).includes(normalizedQuery) || option.value.includes(normalizedQuery),
        );
    }, [normalizedQuery, showAllColors]);

    const selectColor = (nextValue: string): void => {
        onChange(nextValue);
        setQuery(repairColorLabel(nextValue));
        setShowAllColors(false);
        setOpen(false);
    };

    return (
        <div className="relative">
            <span
                className={cn('pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-sm border border-[#64748b]', repairColorSwatchClass(value))}
                aria-hidden="true"
            />
            <input
                className={cn(className, 'pl-9 pr-9')}
                value={open ? query : repairColorLabel(value)}
                placeholder="Color"
                disabled={disabled}
                onFocus={() => {
                    setQuery(repairColorLabel(value));
                    setShowAllColors(false);
                }}
                onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAllColors(false);
                    setOpen(true);
                }}
                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter' && filteredOptions[0]) {
                        event.preventDefault();
                        selectColor(filteredOptions[0].value);
                    }
                    if (event.key === 'Escape') {
                        setOpen(false);
                        setShowAllColors(false);
                        setQuery(repairColorLabel(value));
                    }
                }}
                onBlur={() => {
                    window.setTimeout(() => {
                        setOpen(false);
                        setShowAllColors(false);
                        setQuery(repairColorLabel(value));
                    }, 120);
                }}
            />
            <button
                type="button"
                className="absolute right-2 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-[#475569] hover:bg-[#e2e8f0] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={disabled}
                aria-label="Mostrar colores"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                    if (open && showAllColors) {
                        setOpen(false);
                        setShowAllColors(false);
                        return;
                    }

                    setQuery(repairColorLabel(value));
                    setShowAllColors(true);
                    setOpen(true);
                }}
            >
                <FaChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} aria-hidden="true" />
            </button>
            {open && !disabled ? (
                <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto rounded-md border border-[#cbd5e1] bg-white py-1 shadow-[0_8px_18px_rgba(15,23,42,0.14)]">
                    {filteredOptions.length > 0 ? filteredOptions.map((option) => (
                        <button
                            key={option.value || 'empty'}
                            type="button"
                            className={cn(
                                'flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-[#0f172a] hover:bg-[#eff6ff]',
                                normalizeRepairKey(value) === option.value && 'bg-[#dbeafe]',
                            )}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => selectColor(option.value)}
                        >
                            <span className={cn('h-3.5 w-3.5 shrink-0 rounded-sm border border-[#64748b]', option.swatchClass)} aria-hidden="true" />
                            <span>{option.label}</span>
                        </button>
                    )) : (
                        <div className="px-3 py-2 text-sm font-semibold text-[#64748b]">Sin coincidencias</div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
