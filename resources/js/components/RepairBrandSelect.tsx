import { useId, useState, type KeyboardEvent } from 'react';
import { FaChevronDown, FaMobileAlt } from 'react-icons/fa';
import { phoneBrandOptions } from './RepairColorCombobox';
import { cn } from '../utils';

function BrandIcon({ brand }: { brand: string }): JSX.Element {
    return brand && brand !== 'OTRAS' && phoneBrandOptions.includes(brand as typeof phoneBrandOptions[number])
        ? <img src={`/assets/brands/${brand.toLowerCase()}.svg`} alt="" className="h-5 w-10 shrink-0 object-contain" />
        : <span className="grid h-5 w-10 shrink-0 place-items-center text-slate-500"><FaMobileAlt aria-hidden="true" /></span>;
}

export function RepairBrandSelect({ value, onChange, className }: {
    value: string;
    onChange: (value: string) => void;
    className: string;
}): JSX.Element {
    const id = useId();
    const [open, setOpen] = useState(false);
    const options: string[] = ['', ...phoneBrandOptions];
    if (value && !options.includes(value)) options.push(value);
    const [active, setActive] = useState(0);
    const choose = (index: number): void => {
        onChange(options[index]);
        setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            const current = open ? active : Math.max(0, options.indexOf(value));
            setActive(event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
                : Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1))));
            setOpen(true);
        } else if ((event.key === 'Enter' || event.key === ' ') && open) {
            event.preventDefault(); choose(active);
        } else if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
            const index = options.findIndex((brand) => brand.startsWith(event.key.toUpperCase()));
            if (index >= 0) { event.preventDefault(); setActive(index); setOpen(true); }
        }
    };

    return (
        <div className="relative min-w-0" onBlur={() => setOpen(false)}>
            <button type="button" role="combobox" aria-label="Marca" aria-expanded={open}
                aria-controls={id} aria-activedescendant={open ? `${id}-${active}` : undefined}
                className={cn(className, 'flex w-full items-center gap-2 text-left')}
                onKeyDown={onKeyDown}
                onClick={() => { setActive(Math.max(0, options.indexOf(value))); setOpen(!open); }}>
                {value ? <BrandIcon brand={value} /> : null}
                <span className="min-w-0 flex-1 truncate">{value || 'Elegir marca...'}</span>
                <FaChevronDown aria-hidden="true" className="h-3 w-3 shrink-0" />
            </button>
            {open ? (
                <ul id={id} role="listbox" aria-label="Marcas" className="absolute left-0 top-full z-50 mt-1 max-h-80 min-w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 shadow-sm">
                    {options.map((brand, index) => (
                        <li key={brand} id={`${id}-${index}`} role="option" aria-selected={value === brand}
                            className={cn('flex min-h-10 cursor-pointer items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-800', active === index && 'bg-slate-100')}
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>
                            {brand ? <BrandIcon brand={brand} /> : <span className="w-10 shrink-0" />}
                            <span>{brand || 'Elegir marca...'}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
