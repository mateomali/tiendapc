import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaEye, FaEyeSlash, FaSave, FaSearch, FaTrashAlt } from 'react-icons/fa';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { cn } from '../../utils';

const categoryIconButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black shadow-[0_8px_16px_rgba(15,23,42,0.08)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0';
const categoryIconButtonSoft = `${categoryIconButton} border-sky-200 bg-white text-brand-700 hover:bg-brand-50`;
const categoryIconButtonPrimary = `${categoryIconButton} border-brand-500 bg-brand-600 text-white hover:bg-brand-700`;
const categoryIconButtonSuccess = `${categoryIconButton} border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600`;
const categoryIconButtonDanger = `${categoryIconButton} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`;

interface CategoryItem {
    id: number;
    name: string;
    description?: string | null;
    image_url?: string | null;
    group_key: string;
    sort_order: number;
    is_hidden: boolean;
    product_count: number;
}

interface GroupOption {
    key: string;
    label: string;
}

interface CategoriesPageProps {
    categories: CategoryItem[];
    groupOptions: GroupOption[];
    stats: {
        total: number;
        hidden: number;
        withProducts: number;
        withoutProducts: number;
    };
}

interface CategoryForm {
    name: string;
    image_url: string;
    group_key: string;
    sort_order: number;
    is_hidden: boolean;
}

type FilterKey = 'all' | 'visible' | 'hidden' | 'withProducts' | 'withoutProducts';

const filterLabels: Record<FilterKey, string> = {
    all: 'Todas',
    visible: 'Visibles',
    hidden: 'Ocultas',
    withProducts: 'Con productos',
    withoutProducts: 'Sin productos',
};

function normalizeGroup(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '-');
}

function CategoryEditor({
    category,
    groups,
    canMoveUp,
    canMoveDown,
    onMove,
    mode,
}: {
    category: CategoryItem;
    groups: GroupOption[];
    canMoveUp: boolean;
    canMoveDown: boolean;
    onMove: (id: number, direction: -1 | 1) => void;
    mode: 'table' | 'card';
}): JSX.Element {
    const [form, setForm] = useState<CategoryForm>({
        name: category.name,
        image_url: category.image_url ?? '',
        group_key: category.group_key,
        sort_order: category.sort_order,
        is_hidden: category.is_hidden,
    });

    const groupListId = `category-groups-${category.id}`;

    useEffect(() => {
        setForm({
            name: category.name,
            image_url: category.image_url ?? '',
            group_key: category.group_key,
            sort_order: category.sort_order,
            is_hidden: category.is_hidden,
        });
    }, [category]);

    function submitUpdate(): void {
        router.post(route('admin.categories.update', category.id), { ...form, group_key: normalizeGroup(form.group_key) }, { preserveScroll: true });
    }

    function deleteCategory(): void {
        if (!window.confirm(`Enviar "${category.name}" a papelera?`)) {
            return;
        }

        router.post(route('admin.categories.destroy', category.id), {}, { preserveScroll: true });
    }

    const stateClass = form.is_hidden
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-emerald-200 bg-emerald-50 text-emerald-800';

    if (mode === 'table') {
        return (
            <tr>
                <td className={`${ui.tableCell} w-[72px]`}>
                    <strong>#{category.id}</strong>
                    <span className={cn('mt-2 inline-flex rounded-full border px-2 py-1 text-[0.68rem] font-black uppercase', stateClass)}>
                        {form.is_hidden ? 'Oculta' : 'Visible'}
                    </span>
                </td>
                <td className={ui.tableCell}>
                    <div className="grid gap-2">
                        <input className={`${ui.input} min-h-10 rounded-xl py-2`} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                    </div>
                </td>
                <td className={`${ui.tableCell} w-[190px]`}>
                    <input className={`${ui.input} min-h-10 rounded-xl py-2`} list={groupListId} value={form.group_key} onChange={(event) => setForm((current) => ({ ...current, group_key: event.target.value }))} />
                    <datalist id={groupListId}>
                        {groups.map((group) => (
                            <option key={group.key} value={group.key}>{group.label}</option>
                        ))}
                    </datalist>
                </td>
                <td className={`${ui.tableCell} w-[96px]`}>
                    <input className={`${ui.input} min-h-10 rounded-xl px-3 py-2`} type="number" min="1" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
                </td>
                <td className={`${ui.tableCell} w-[120px]`}>
                    <span className="inline-flex rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black text-ink-800">
                        {category.product_count} productos
                    </span>
                </td>
                <td className={`${ui.tableCell} w-[210px]`}>
                    <div className="flex items-center gap-2">
                        <button type="button" className={categoryIconButtonSoft} onClick={() => onMove(category.id, -1)} disabled={!canMoveUp} aria-label="Subir categoria">
                            <FaArrowUp aria-hidden="true" />
                        </button>
                        <button type="button" className={categoryIconButtonSoft} onClick={() => onMove(category.id, 1)} disabled={!canMoveDown} aria-label="Bajar categoria">
                            <FaArrowDown aria-hidden="true" />
                        </button>
                        <button type="button" className={form.is_hidden ? categoryIconButtonSuccess : categoryIconButtonSoft} onClick={() => setForm((current) => ({ ...current, is_hidden: !current.is_hidden }))} aria-label={form.is_hidden ? 'Marcar visible' : 'Ocultar categoria'}>
                            {form.is_hidden ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                        </button>
                        <button type="button" className={categoryIconButtonPrimary} onClick={submitUpdate} aria-label="Guardar categoria">
                            <FaSave aria-hidden="true" />
                        </button>
                        <button type="button" className={`${categoryIconButtonDanger} w-auto gap-2 px-3`} onClick={deleteCategory} aria-label="Eliminar categoria">
                            <FaTrashAlt aria-hidden="true" />
                            <span>Eliminar</span>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
            <article className="grid gap-3 rounded-2xl border border-sky-100 bg-white/95 p-3 shadow-[0_10px_24px_rgba(18,58,132,0.07)]">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <strong className="text-sm text-ink-950">#{category.id}</strong>
                        <span className={cn('ml-2 inline-flex rounded-full border px-2 py-1 text-[0.68rem] font-black uppercase', stateClass)}>
                            {form.is_hidden ? 'Oculta' : 'Visible'}
                        </span>
                    </div>
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-black text-ink-800">
                        {category.product_count} prod.
                    </span>
                </div>
                <input className={`${ui.input} min-h-10 rounded-xl py-2`} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                <div className="grid gap-2 sm:grid-cols-2">
                    <input className={`${ui.input} min-h-10 rounded-xl py-2`} list={groupListId} placeholder="Grupo" value={form.group_key} onChange={(event) => setForm((current) => ({ ...current, group_key: event.target.value }))} />
                    <input className={`${ui.input} min-h-10 rounded-xl py-2`} type="number" min="1" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <button type="button" className={`${categoryIconButtonSoft} h-10 w-full`} onClick={() => onMove(category.id, -1)} disabled={!canMoveUp} aria-label="Subir categoria"><FaArrowUp aria-hidden="true" /></button>
                    <button type="button" className={`${categoryIconButtonSoft} h-10 w-full`} onClick={() => onMove(category.id, 1)} disabled={!canMoveDown} aria-label="Bajar categoria"><FaArrowDown aria-hidden="true" /></button>
                    <button type="button" className={`${form.is_hidden ? categoryIconButtonSuccess : categoryIconButtonSoft} h-10 w-full`} onClick={() => setForm((current) => ({ ...current, is_hidden: !current.is_hidden }))} aria-label={form.is_hidden ? 'Marcar visible' : 'Ocultar categoria'}>
                        {form.is_hidden ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                    </button>
                    <button type="button" className={`${categoryIconButtonPrimary} h-10 w-full`} onClick={submitUpdate} aria-label="Guardar categoria"><FaSave aria-hidden="true" /></button>
                    <button type="button" className={`${categoryIconButtonDanger} col-span-2 h-10 w-full gap-2 px-3`} onClick={deleteCategory} aria-label="Eliminar categoria">
                        <FaTrashAlt aria-hidden="true" />
                        <span>Eliminar</span>
                    </button>
                </div>
            </article>
    );
}

export default function CategoriesPage({ categories, groupOptions, stats }: CategoriesPageProps): JSX.Element {
    const groups = useMemo(() => {
        const baseGroups = groupOptions.length > 0 ? groupOptions : [{ key: 'electronica', label: 'ELECTRONICA' }];
        return baseGroups;
    }, [groupOptions]);
    const createForm = useForm<CategoryForm>({
        name: '',
        image_url: '',
        group_key: groups[0]?.key ?? 'electronica',
        sort_order: categories.length + 1,
        is_hidden: false,
    });
    const [orderedIds, setOrderedIds] = useState<number[]>(categories.map((category) => category.id));
    const [mergeSourceId, setMergeSourceId] = useState<string>('');
    const [mergeTargetId, setMergeTargetId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<FilterKey>('all');
    const [groupFilter, setGroupFilter] = useState('');

    useEffect(() => {
        setOrderedIds(categories.map((category) => category.id));
    }, [categories]);

    const orderedCategories = useMemo(
        () => orderedIds.map((id) => categories.find((category) => category.id === id)).filter(Boolean) as CategoryItem[],
        [categories, orderedIds],
    );

    const filteredCategories = useMemo(() => {
        const term = search.trim().toLowerCase();

        return orderedCategories.filter((category) => {
            const matchesSearch =
                term === '' ||
                category.name.toLowerCase().includes(term) ||
                category.group_key.toLowerCase().includes(term) ||
                (category.description ?? '').toLowerCase().includes(term);
            const matchesGroup = groupFilter === '' || category.group_key === groupFilter;
            const matchesFilter =
                filter === 'all' ||
                (filter === 'visible' && !category.is_hidden) ||
                (filter === 'hidden' && category.is_hidden) ||
                (filter === 'withProducts' && category.product_count > 0) ||
                (filter === 'withoutProducts' && category.product_count === 0);

            return matchesSearch && matchesGroup && matchesFilter;
        });
    }, [filter, groupFilter, orderedCategories, search]);

    function move(id: number, direction: -1 | 1): void {
        setOrderedIds((current) => {
            const index = current.indexOf(id);
            const target = index + direction;

            if (index === -1 || target < 0 || target >= current.length) {
                return current;
            }

            const next = [...current];
            [next[index], next[target]] = [next[target], next[index]];
            return next;
        });
    }

    function submitMerge(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        if (mergeSourceId === '' || mergeTargetId === '' || mergeSourceId === mergeTargetId) {
            window.alert('Elegi origen y destino distintos para fusionar.');
            return;
        }

        const source = categories.find((category) => String(category.id) === mergeSourceId);
        const target = categories.find((category) => String(category.id) === mergeTargetId);

        if (!window.confirm(`Los productos de "${source?.name ?? 'origen'}" pasaran a "${target?.name ?? 'destino'}" y la categoria origen ira a papelera.`)) {
            return;
        }

        router.post(route('admin.categories.merge'), {
            source_id: mergeSourceId,
            target_id: mergeTargetId,
        });
    }

    function saveOrder(): void {
        router.post(route('admin.categories.reorder'), { ordered_ids: orderedIds }, { preserveScroll: true });
    }

    return (
        <AdminLayout title="Categorias">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Taxonomia</p>
                    <h2 className={ui.heroTitle}>Categorias, grupos y visibilidad</h2>
                    <p className={ui.heroText}>Alta, edicion rapida, fusion, orden y control del menu publico desde una vista compacta.</p>
                </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {([
                    ['all', 'Total', stats.total],
                    ['hidden', 'Ocultas', stats.hidden],
                    ['withProducts', 'Con productos', stats.withProducts],
                    ['withoutProducts', 'Sin productos', stats.withoutProducts],
                ] as Array<[FilterKey, string, number]>).map(([key, label, value]) => (
                    <button key={key} type="button" className={cn(ui.statCard, 'text-left transition hover:border-brand-300', filter === key && 'border-brand-400 bg-brand-50')} onClick={() => setFilter(key)}>
                        <p className={ui.statLabel}>{label}</p>
                        <p className={ui.statValue}>{value}</p>
                    </button>
                ))}
            </section>

            <section className={ui.dashboardGrid}>
                <form
                    className={ui.sectionCard}
                    onSubmit={(event) => {
                        event.preventDefault();
                        createForm.post(route('admin.categories.store'), {
                            preserveScroll: true,
                            onSuccess: () => createForm.reset('name', 'image_url'),
                        });
                    }}
                >
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Alta</p>
                            <h3 className={ui.cardTitle}>Nueva categoria</h3>
                        </div>
                    </div>
                    <div className={ui.formGrid}>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Nombre</span>
                            <input className={ui.input} value={createForm.data.name} onChange={(event) => createForm.setData('name', event.target.value)} />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Grupo</span>
                            <input className={ui.input} list="new-category-groups" value={createForm.data.group_key} onChange={(event) => createForm.setData('group_key', event.target.value)} />
                            <datalist id="new-category-groups">
                                {groups.map((group) => (
                                    <option key={group.key} value={group.key}>{group.label}</option>
                                ))}
                            </datalist>
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Orden</span>
                            <input className={ui.input} type="number" min="1" value={createForm.data.sort_order} onChange={(event) => createForm.setData('sort_order', Number(event.target.value))} />
                        </label>
                        <div className={ui.mediaActions}>
                            <label className={ui.checkboxLine}>
                                <input type="checkbox" checked={!createForm.data.is_hidden} onChange={(event) => createForm.setData('is_hidden', !event.target.checked)} />
                                <span>Visible en menu</span>
                            </label>
                        </div>
                    </div>
                    <div className={ui.heroActions}>
                        <button className={buttonClass('primary')}>Guardar categoria</button>
                    </div>
                </form>

                <form className={ui.sectionCard} onSubmit={submitMerge}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Fusion</p>
                            <h3 className={ui.cardTitle}>Unir categorias</h3>
                        </div>
                    </div>
                    <div className={ui.formGrid}>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Origen</span>
                            <select className={ui.input} value={mergeSourceId} onChange={(event) => setMergeSourceId(event.target.value)}>
                                <option value="">Elegir categoria</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Destino</span>
                            <select className={ui.input} value={mergeTargetId} onChange={(event) => setMergeTargetId(event.target.value)}>
                                <option value="">Elegir categoria</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className={ui.heroActions}>
                        <button className={buttonClass('soft')}>Fusionar</button>
                    </div>
                </form>
            </section>

            <section className={ui.sectionCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Gestion</p>
                        <h3 className={ui.cardTitle}>{filteredCategories.length} categorias visibles</h3>
                    </div>
                    <button type="button" className={buttonClass('primary', 'sm')} onClick={saveOrder}>
                        <FaSave aria-hidden="true" />
                        Guardar orden
                    </button>
                </div>

                <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_180px_auto] lg:items-center">
                    <div className="relative">
                        <input className={`${ui.input} pr-10`} placeholder="Buscar categoria, grupo o descripcion" value={search} onChange={(event) => setSearch(event.target.value)} />
                        <FaSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-700" aria-hidden="true" />
                    </div>
                    <select className={ui.input} value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
                        <option value="">Todos los grupos</option>
                        {groups.map((group) => (
                            <option key={group.key} value={group.key}>{group.label}</option>
                        ))}
                    </select>
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                            <button key={key} type="button" className={filter === key ? buttonClass('primary', 'sm') : buttonClass('soft', 'sm')} onClick={() => setFilter(key)}>
                                {filterLabels[key]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-3 lg:hidden">
                    {filteredCategories.map((category) => {
                        const orderIndex = orderedIds.indexOf(category.id);
                        return (
                            <CategoryEditor
                                key={category.id}
                                category={category}
                                groups={groups}
                                canMoveUp={orderIndex > 0}
                                canMoveDown={orderIndex >= 0 && orderIndex < orderedIds.length - 1}
                                onMove={move}
                                mode="card"
                            />
                        );
                    })}
                </div>

                <div className={`${ui.tableWrap} hidden lg:block`}>
                    <table className={ui.table}>
                        <thead>
                            <tr>
                                <th className={ui.tableHeadCell}>ID</th>
                                <th className={ui.tableHeadCell}>Categoria</th>
                                <th className={ui.tableHeadCell}>Grupo</th>
                                <th className={ui.tableHeadCell}>Orden</th>
                                <th className={ui.tableHeadCell}>Productos</th>
                                <th className={ui.tableHeadCell}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.map((category) => {
                                const orderIndex = orderedIds.indexOf(category.id);
                                return (
                                    <CategoryEditor
                                        key={category.id}
                                        category={category}
                                        groups={groups}
                                        canMoveUp={orderIndex > 0}
                                        canMoveDown={orderIndex >= 0 && orderIndex < orderedIds.length - 1}
                                        onMove={move}
                                        mode="table"
                                    />
                                );
                            })}
                            {filteredCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className={ui.tableEmptyCell}>No hay categorias para los filtros actuales.</td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </section>
        </AdminLayout>
    );
}
