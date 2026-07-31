import { cn } from '../utils';

type UnlockType = '' | 'pin' | 'pattern';

interface PhoneUnlockFieldsProps {
    unlockType: string;
    unlockValue: string;
    onChange: (unlockType: string, unlockValue: string) => void;
    selectClassName: string;
    inputClassName: string;
    disabled?: boolean;
}

const patternNodes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const patternNodePositions: Record<number, { x: number; y: number }> = {
    1: { x: 16.7, y: 16.7 },
    2: { x: 50, y: 16.7 },
    3: { x: 83.3, y: 16.7 },
    4: { x: 16.7, y: 50 },
    5: { x: 50, y: 50 },
    6: { x: 83.3, y: 50 },
    7: { x: 16.7, y: 83.3 },
    8: { x: 50, y: 83.3 },
    9: { x: 83.3, y: 83.3 },
};

function parsePattern(value: string): number[] {
    return value
        .split('-')
        .map((item) => Number(item))
        .filter((item, index, items) => Number.isInteger(item) && item >= 1 && item <= 9 && items.indexOf(item) === index);
}

export function PhoneUnlockFields({
    unlockType,
    unlockValue,
    onChange,
    selectClassName,
    inputClassName,
    disabled = false,
}: PhoneUnlockFieldsProps): JSX.Element {
    const selectedType = (['', 'pin', 'pattern'].includes(unlockType) ? unlockType : '') as UnlockType;
    const pattern = parsePattern(selectedType === 'pattern' ? unlockValue : '');

    const setType = (value: UnlockType): void => {
        onChange(value, '');
    };

    const togglePatternNode = (node: number): void => {
        if (disabled) return;

        const existingIndex = pattern.indexOf(node);
        const nextPattern = existingIndex >= 0
            ? pattern.slice(0, existingIndex)
            : [...pattern, node];

        onChange('pattern', nextPattern.join('-'));
    };

    return (
        <div className="grid gap-2">
            <select className={selectClassName} value={selectedType} onChange={(event) => setType(event.target.value as UnlockType)} disabled={disabled}>
                <option value="">Sin desbloqueo</option>
                <option value="pin">PIN</option>
                <option value="pattern">Patron</option>
            </select>

            {selectedType === 'pin' ? (
                <input
                    className={inputClassName}
                    value={unlockValue}
                    onChange={(event) => onChange('pin', event.target.value)}
                    placeholder="PIN del telefono"
                    disabled={disabled}
                    inputMode="numeric"
                    maxLength={32}
                />
            ) : null}

            {selectedType === 'pattern' ? (
                <div className="grid gap-2 rounded-lg border border-[#cbd5e1] bg-white p-3">
                    <div className="relative mx-auto aspect-square w-full max-w-[210px]">
                        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                            {pattern.slice(0, -1).map((node, index) => {
                                const start = patternNodePositions[node];
                                const end = patternNodePositions[pattern[index + 1]];

                                return (
                                    <line
                                        key={`${node}-${pattern[index + 1]}-${index}`}
                                        x1={start.x}
                                        y1={start.y}
                                        x2={end.x}
                                        y2={end.y}
                                        stroke="#334155"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </svg>
                        <div className="grid h-full w-full grid-cols-3 gap-4 p-2">
                            {patternNodes.map((node) => {
                                const selectedIndex = pattern.indexOf(node);
                                const selected = selectedIndex >= 0;

                                return (
                                    <button
                                        key={node}
                                        type="button"
                                        className={cn(
                                            'relative z-10 grid place-items-center rounded-full border text-sm font-black transition',
                                            selected
                                                ? 'border-[#334155] bg-[#334155] text-white'
                                                : 'border-[#94a3b8] bg-[#f8fafc] text-transparent hover:bg-[#e2e8f0]',
                                        )}
                                        onClick={() => togglePatternNode(node)}
                                        disabled={disabled}
                                        aria-label={`Punto ${node}`}
                                    >
                                        {selected ? selectedIndex + 1 : <span className="h-3 w-3 rounded-full bg-[#334155]" aria-hidden="true" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#64748b]">
                        <span>Secuencia: {pattern.length > 0 ? pattern.join('-') : 'sin seleccionar'}</span>
                        <button
                            type="button"
                            className="rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-2 py-1 font-bold text-[#334155] hover:bg-[#e2e8f0]"
                            onClick={() => onChange('pattern', '')}
                            disabled={disabled || pattern.length === 0}
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export function phoneUnlockLabel(unlockType?: string | null, unlockValue?: string | null): string {
    const value = (unlockValue ?? '').trim();

    if (value === '') {
        return '';
    }

    return unlockType === 'pattern' ? `Patron ${value}` : `PIN ${value}`;
}
