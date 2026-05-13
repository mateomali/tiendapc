import { Link, router, useForm } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FaPlus, FaSave, FaSearch, FaTimes, FaTools, FaTrashAlt } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface PartRequestRow {
    registro_id: number;
    tipo_repuesto: string;
    repuesto: string;
    pedido: string;
    cliente: string;
    fecha?: string | null;
    ticket_url: string;
    remove_url: string;
}

interface InventoryPart {
    id: number;
    quantity: number;
    model: string;
    box: string;
    update_url: string;
    delete_url: string;
}

interface PartsPageProps {
    period: 'week' | 'month' | 'all';
    rows: PartRequestRow[];
    filters: {
        week: string;
        month: string;
        all: string;
    };
    inventory: InventoryPart[];
    boxes: string[];
    inventoryActions: {
        store: string;
        storeBox: string;
    };
}

interface InventoryCreateForm {
    quantity: string;
    model: string;
    box: string;
}

interface BoxCreateForm {
    box: string;
}

const periodLabels = {
    week: 'Semana',
    month: 'Mes',
    all: 'Todos',
} as const;

const inputClass =
    'min-h-10 w-full rounded-lg border border-[#bfdbfe] bg-white px-3 py-2 text-sm font-bold text-[#0f172a] shadow-inner outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#93c5fd66]';
const tableInputClass =
    'h-9 w-full rounded-md border border-transparent bg-transparent px-2 text-sm font-bold text-[#0f172a] outline-none transition hover:border-[#bfdbfe] hover:bg-white focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#93c5fd66]';

function normalizePart(part: InventoryPart): InventoryPart {
    return {
        ...part,
        quantity: Number.isFinite(Number(part.quantity)) ? Math.max(0, Number(part.quantity)) : 0,
        model: part.model.trim(),
        box: part.box.trim().toLowerCase(),
    };
}

function boxSortValue(box: string): number {
    return box
        .trim()
        .toLowerCase()
        .split('')
        .reduce((value, char) => {
            const code = char.charCodeAt(0);

            if (code < 97 || code > 122) {
                return value;
            }

            return value * 26 + (code - 96);
        }, 0);
}

function sortBoxes(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean))).sort((a, b) => boxSortValue(a) - boxSortValue(b) || a.localeCompare(b));
}

export default function PartsPage({ period, rows, filters, inventory, boxes, inventoryActions }: PartsPageProps): JSX.Element {
    const [parts, setParts] = useState<InventoryPart[]>(inventory);
    const [boxList, setBoxList] = useState<string[]>(sortBoxes(boxes));
    const [modelFilter, setModelFilter] = useState('');
    const [boxFilter, setBoxFilter] = useState('');
    const [savingIds, setSavingIds] = useState<number[]>([]);
    const [dirtyIds, setDirtyIds] = useState<number[]>([]);

    const createForm = useForm<InventoryCreateForm>({
        quantity: '1',
        model: '',
        box: '',
    });
    const boxForm = useForm<BoxCreateForm>({
        box: '',
    });

    useEffect(() => {
        setParts(inventory);
        setDirtyIds([]);
    }, [inventory]);

    useEffect(() => {
        setBoxList(sortBoxes(boxes));
    }, [boxes]);

    const boxOptions = useMemo(() => sortBoxes([...boxList, ...parts.map((part) => part.box)]), [boxList, parts]);

    const selectedBoxLabel = boxFilter === '' ? 'Todas las cajas' : `Caja ${boxFilter.toUpperCase()}`;

    const filteredParts = useMemo(() => {
        const modelNeedle = modelFilter.trim().toLowerCase();
        const boxNeedle = boxFilter.trim().toLowerCase();

        return parts.filter((part) => {
            const matchesModel = modelNeedle === '' || part.model.toLowerCase().includes(modelNeedle);
            const matchesBox = boxNeedle === '' || part.box.toLowerCase() === boxNeedle;

            return matchesModel && matchesBox;
        });
    }, [boxFilter, modelFilter, parts]);

    const totalUnits = filteredParts.reduce((sum, part) => sum + part.quantity, 0);

    const updatePart = (partId: number, changes: Partial<InventoryPart>): void => {
        setParts((current) => current.map((part) => (part.id === partId ? { ...part, ...changes } : part)));
        setDirtyIds((current) => [...new Set([...current, partId])]);
    };

    const selectBox = (value: string): void => {
        const nextBox = value.toLowerCase();

        setBoxFilter(nextBox);
        if (nextBox !== '') {
            createForm.setData('box', nextBox);
        }
    };

    const createBox = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const nextBox = boxForm.data.box.trim().toLowerCase();
        if (nextBox === '') {
            return;
        }

        setBoxList((current) => sortBoxes([...current, nextBox]));
        selectBox(nextBox);
        boxForm.post(inventoryActions.storeBox, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => boxForm.reset('box'),
        });
    };

    const savePart = (part: InventoryPart): void => {
        const normalized = normalizePart(part);
        if (normalized.model === '' || normalized.box === '') {
            return;
        }

        updatePart(part.id, normalized);
        setSavingIds((current) => [...new Set([...current, part.id])]);

        router.post(
            part.update_url,
            {
                quantity: normalized.quantity,
                model: normalized.model,
                box: normalized.box,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setDirtyIds((current) => current.filter((id) => id !== part.id)),
                onFinish: () => setSavingIds((current) => current.filter((id) => id !== part.id)),
            },
        );
    };

    const deletePart = (part: InventoryPart): void => {
        setParts((current) => current.filter((item) => item.id !== part.id));
        router.post(part.delete_url, {}, { preserveScroll: true, preserveState: true });
    };

    const removeRequestRow = (row: PartRequestRow): void => {
        router.post(row.remove_url, {}, { preserveScroll: true });
    };

    const createPart = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        const nextBox = createForm.data.box.trim().toLowerCase();

        if (nextBox !== '') {
            setBoxList((current) => sortBoxes([...current, nextBox]));
        }

        createForm.post(inventoryActions.store, {
            preserveScroll: true,
            onSuccess: () => createForm.reset('model'),
        });
    };

    return (
        <RepairLayout title="Repuestos">
            <section className="overflow-hidden rounded-[18px] border border-[#bfdbfe] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
                <div className="grid gap-4 border-b border-[#dbeafe] bg-[linear-gradient(135deg,#173b7d,#2563eb)] px-4 py-4 text-white xl:grid-cols-[1fr_2fr] xl:items-end">
                    <div className="min-w-0">
                        <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-blue-100">Inventario por cajas</p>
                        <h1 className="flex items-center gap-2 text-xl font-black md:text-2xl">
                            <FaTools aria-hidden="true" />
                            Repuestos
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-blue-100">
                            {selectedBoxLabel} - {filteredParts.length} modelo{filteredParts.length === 1 ? '' : 's'} - {totalUnits} unidad{totalUnits === 1 ? '' : 'es'}
                        </p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-[1fr_11rem_auto]">
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-blue-100">
                            Modelo
                            <span className="relative">
                                <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2563eb]" aria-hidden="true" />
                                <input
                                    type="search"
                                    value={modelFilter}
                                    onChange={(event) => setModelFilter(event.target.value)}
                                    className={cn(inputClass, 'pl-9')}
                                    placeholder="Buscar modelo"
                                />
                            </span>
                        </label>
                        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-blue-100">
                            Caja
                            <select value={boxFilter} onChange={(event) => selectBox(event.target.value)} className={inputClass}>
                                <option value="">Todas</option>
                                {boxOptions.map((box) => (
                                    <option key={box} value={box}>
                                        {box.toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className={cn(buttonClass('soft', 'sm'), 'self-end border-white bg-white/12 text-white')}
                            onClick={() => {
                                setModelFilter('');
                                selectBox('');
                            }}
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                <div className="grid gap-2 border-b border-[#dbeafe] bg-white px-3 py-2 xl:grid-cols-[1fr_auto] xl:items-center">
                    <div className="flex gap-1 overflow-x-auto">
                        <button
                            type="button"
                            className={cn(
                                'min-h-9 shrink-0 rounded-lg border px-3 text-xs font-black uppercase tracking-[0.05em] transition',
                                boxFilter === '' ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]',
                            )}
                            onClick={() => selectBox('')}
                        >
                            Todas
                        </button>
                        {boxOptions.map((box) => (
                            <button
                                key={box}
                                type="button"
                                className={cn(
                                    'min-h-9 shrink-0 rounded-lg border px-3 text-xs font-black uppercase tracking-[0.05em] transition',
                                    boxFilter === box ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]',
                                )}
                                onClick={() => selectBox(box)}
                            >
                                {box.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={createBox} className="grid gap-2 sm:grid-cols-[10rem_auto]">
                        <input
                            type="text"
                            value={boxForm.data.box}
                            onChange={(event) => boxForm.setData('box', event.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                            className={inputClass}
                            placeholder="Nueva caja"
                            maxLength={16}
                            required
                        />
                        <button type="submit" className={cn(buttonClass('soft', 'sm'), 'min-h-10 border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]')} disabled={boxForm.processing}>
                            <FaPlus aria-hidden="true" />
                            Crear caja
                        </button>
                    </form>
                </div>

                <form onSubmit={createPart} className="grid gap-2 border-b border-[#dbeafe] bg-[#eff6ff] p-3 md:grid-cols-[8rem_1fr_8rem_auto] md:items-end">
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-[#1d4ed8]">
                        Cantidad
                        <input
                            type="number"
                            min="0"
                            value={createForm.data.quantity}
                            onChange={(event) => createForm.setData('quantity', event.target.value)}
                            className={inputClass}
                        />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-[#1d4ed8]">
                        Modelo
                        <input
                            type="text"
                            value={createForm.data.model}
                            onChange={(event) => createForm.setData('model', event.target.value)}
                            className={inputClass}
                            placeholder="Ej: moto e7"
                            required
                        />
                    </label>
                    <label className="grid gap-1 text-xs font-black uppercase tracking-[0.08em] text-[#1d4ed8]">
                        Caja
                        <input
                            type="text"
                            value={createForm.data.box}
                            onChange={(event) => createForm.setData('box', event.target.value.toLowerCase().replace(/[^a-z]/g, ''))}
                            className={inputClass}
                            placeholder="a"
                            maxLength={16}
                            required
                        />
                    </label>
                    <button type="submit" className={cn(buttonClass('primary', 'md'), 'min-h-10')} disabled={createForm.processing}>
                        <FaPlus aria-hidden="true" />
                        {createForm.data.box.trim() === '' ? 'Agregar' : `Agregar en ${createForm.data.box.trim().toUpperCase()}`}
                    </button>
                </form>

                <div className="overflow-x-auto">
                    <div className="min-w-[760px]">
                        <div className="grid grid-cols-[7rem_1fr_8rem_7rem] gap-2 bg-[#0f172a] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white">
                            <span>Cantidad</span>
                            <span>Modelo</span>
                            <span>Caja</span>
                            <span />
                        </div>

                        {filteredParts.map((part) => {
                            const isSaving = savingIds.includes(part.id);
                            const isDirty = dirtyIds.includes(part.id);

                            return (
                                <article
                                    key={part.id}
                                    className={cn(
                                        'grid grid-cols-[7rem_1fr_8rem_7rem] gap-2 border-b px-3 py-2 transition-colors',
                                        isDirty
                                            ? 'border-[#f59e0b] bg-[#fff7ed] ring-1 ring-inset ring-[#f59e0b55]'
                                            : 'border-[#dbeafe] odd:bg-white even:bg-[#f8fbff]',
                                    )}
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        value={part.quantity}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) => updatePart(part.id, { quantity: Number(event.target.value) })}
                                        onBlur={() => savePart(part)}
                                        className={tableInputClass}
                                        aria-label={`Cantidad de ${part.model}`}
                                    />
                                    <input
                                        type="text"
                                        value={part.model}
                                        onChange={(event) => updatePart(part.id, { model: event.target.value })}
                                        onBlur={() => savePart(part)}
                                        className={tableInputClass}
                                        aria-label={`Modelo ${part.model}`}
                                    />
                                    <input
                                        type="text"
                                        value={part.box}
                                        onChange={(event) => updatePart(part.id, { box: event.target.value.toLowerCase() })}
                                        onBlur={() => savePart(part)}
                                        className={cn(tableInputClass, 'uppercase')}
                                        aria-label={`Caja de ${part.model}`}
                                    />
                                    <div className="flex items-center justify-end gap-1">
                                        <span className={cn('w-10 text-right text-[0.68rem] font-black uppercase tracking-[0.08em]', isDirty ? 'text-[#92400e]' : 'text-[#64748b]')}>{isSaving ? 'Guard.' : isDirty ? 'Edit.' : ''}</span>
                                        <button
                                            type="button"
                                            className="grid h-9 w-9 place-items-center rounded-lg border border-[#bfdbfe] bg-white text-[#1d4ed8] shadow-sm transition hover:bg-[#eff6ff]"
                                            onClick={() => savePart(part)}
                                            title="Guardar"
                                        >
                                            <FaSave aria-hidden="true" />
                                        </button>
                                        <button
                                            type="button"
                                            className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffe4e6] text-[#be123c] shadow-sm transition hover:bg-[#fecdd3]"
                                            onClick={() => deletePart(part)}
                                            title="Eliminar"
                                        >
                                            <FaTrashAlt aria-hidden="true" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>

                {filteredParts.length === 0 ? (
                    <div className="p-3">
                        <div className={ui.repairCard}>
                            <h2 className={ui.cardTitle}>No hay repuestos con esos filtros.</h2>
                            <p className={ui.inlineCaption}>Proba buscar por otro modelo o limpiar la caja seleccionada.</p>
                        </div>
                    </div>
                ) : null}
            </section>

            <section className="overflow-hidden rounded-[18px] border border-[#bfdbfe] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
                <div className="grid gap-3 border-b border-[#dbeafe] bg-[#eff6ff] px-4 py-3 md:grid-cols-[1fr_auto] md:items-center">
                    <div className="min-w-0">
                        <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#1d4ed8]">Pedidos desde ordenes</p>
                        <h2 className="text-lg font-black text-[#0f172a]">Repuestos pendientes</h2>
                    </div>
                    <div className="flex gap-2 overflow-x-auto">
                        {(['week', 'month', 'all'] as const).map((key) => (
                            <Link
                                key={key}
                                href={filters[key]}
                                className={cn(
                                    buttonClass('soft', 'sm'),
                                    period === key && 'border-[#2563eb] bg-[#2563eb] text-white',
                                )}
                            >
                                {periodLabels[key]}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex min-h-10 items-center overflow-hidden border-b border-[#dbeafe] bg-[#f8fbff] text-sm font-black text-[#1d4ed8]">
                    <div className="animate-[marquee_28s_linear_infinite] whitespace-nowrap px-4">
                        {rows.length} pedido{rows.length === 1 ? '' : 's'} de repuesto en filtro {periodLabels[period].toLowerCase()}.
                    </div>
                </div>

                <div className="grid gap-2 p-3">
                    <div className="hidden grid-cols-[1fr_1.4fr_1fr_2rem] gap-2 rounded-xl bg-[#0f172a] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white md:grid">
                        <span>Tipo de repuesto</span>
                        <span>Repuesto</span>
                        <span>Pedido</span>
                        <span />
                    </div>

                    {rows.map((row) => (
                        <article key={row.registro_id} className="grid gap-2 rounded-xl border border-[#dbeafe] bg-[#f8fbff] p-3 shadow-sm md:grid-cols-[1fr_1.4fr_1fr_2rem] md:items-center">
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Tipo de repuesto</span>
                                <strong className="text-sm text-[#0f172a]">{row.tipo_repuesto}</strong>
                            </div>
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Repuesto</span>
                                <span className="text-sm font-bold text-[#334155]">{row.repuesto}</span>
                            </div>
                            <div className="grid gap-0.5">
                                <span className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#64748b] md:hidden">Pedido</span>
                                <Link href={row.ticket_url} className="text-sm font-black text-[#1d4ed8] underline-offset-2 hover:underline">
                                    {row.pedido}
                                </Link>
                                <span className="text-xs font-semibold text-slate-500">{row.cliente}{row.fecha ? ` - ${row.fecha}` : ''}</span>
                            </div>
                            <button type="button" className="grid h-8 w-8 place-items-center rounded-lg bg-[#ffe4e6] text-[#be123c] shadow-sm md:justify-self-end" onClick={() => removeRequestRow(row)} title="Quitar de la lista">
                                <FaTimes aria-hidden="true" />
                            </button>
                        </article>
                    ))}

                    {rows.length === 0 ? (
                        <div className={ui.repairCard}>
                            <h2 className={ui.cardTitle}>No hay repuestos pedidos para este filtro.</h2>
                            <p className={ui.inlineCaption}>Los pedidos aparecen cuando se marca la tilde Mandar a pedidos en ingreso, editar o agregar reparacion.</p>
                        </div>
                    ) : null}
                </div>
            </section>
        </RepairLayout>
    );
}
