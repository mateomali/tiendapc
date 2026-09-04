import { cn } from '../utils';

export type RepairPartAccessory = 'funda' | 'sim' | 'memoria' | 'sin_porta_chip' | 'otro';

const partAccessoryOptions: Array<{ value: RepairPartAccessory; label: string }> = [
    { value: 'funda', label: 'Funda' },
    { value: 'sim', label: 'SIM' },
    { value: 'memoria', label: 'Memoria' },
    { value: 'sin_porta_chip', label: 'Sin porta-chip' },
    { value: 'otro', label: 'OTRO' },
];
const partAccessoryLabels = new Map(partAccessoryOptions.map((option) => [option.value, option.label]));

export function normalizePartAccessories(value?: string[] | null): RepairPartAccessory[] {
    const allowed = new Set(partAccessoryOptions.map((option) => option.value));

    return Array.from(new Set(value ?? []))
        .filter((item): item is RepairPartAccessory => allowed.has(item as RepairPartAccessory));
}

export function partAccessoriesLabel(selected?: string[] | null, other?: string | null): string {
    return normalizePartAccessories(selected)
        .map((item) => {
            const label = item === 'sin_porta_chip' ? 'no incluye bandeja porta-chip' : partAccessoryLabels.get(item) ?? item;
            const otherDetail = (other ?? '').trim();

            return item === 'otro' && otherDetail !== '' ? `${label}: ${otherDetail}` : label;
        })
        .join(', ');
}

export function RepairPartAccessoriesFields({
    selected,
    other,
    onChange,
    onOtherChange,
    inputClassName,
    disabled = false,
    className = '',
}: {
    selected: string[];
    other: string;
    onChange: (selected: RepairPartAccessory[], other: string) => void;
    onOtherChange: (value: string) => void;
    inputClassName: string;
    disabled?: boolean;
    className?: string;
}): JSX.Element {
    const normalized = normalizePartAccessories(selected);
    const selectedSet = new Set(normalized);
    const hasOther = selectedSet.has('otro');

    const toggle = (value: RepairPartAccessory, checked: boolean): void => {
        const next = checked
            ? normalizePartAccessories([...normalized, value])
            : normalized.filter((item) => item !== value);
        const nextOther = value === 'otro' && !checked ? '' : other;

        onChange(next, nextOther);
    };

    return (
        <div className={cn('grid gap-2 rounded-md border border-[#cbd5e1] bg-white p-3', className)}>
            <span className="text-sm font-black text-[#334155]">Incluye</span>
            <div className="grid gap-2 sm:grid-cols-4">
                {partAccessoryOptions.map((option) => (
                    <label key={option.value} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-sm font-bold text-[#334155]">
                        <input
                            type="checkbox"
                            checked={selectedSet.has(option.value)}
                            onChange={(event) => toggle(option.value, event.target.checked)}
                            disabled={disabled}
                        />
                        {option.label}
                    </label>
                ))}
            </div>
            {hasOther ? (
                <input
                    className={inputClassName}
                    value={other}
                    onChange={(event) => onOtherChange(event.target.value)}
                    placeholder="Detalle de otro agregado"
                    disabled={disabled}
                />
            ) : null}
        </div>
    );
}
