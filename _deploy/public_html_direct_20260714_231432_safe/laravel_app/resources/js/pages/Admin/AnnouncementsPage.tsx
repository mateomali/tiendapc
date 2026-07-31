import { useForm } from '@inertiajs/react';
import type { ChangeEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaCopy, FaEye, FaEyeSlash, FaImage, FaPlus, FaSave, FaSearch, FaTrashAlt } from 'react-icons/fa';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { cn } from '../../utils';

interface MediaItem {
    id: number;
    title: string;
    tags?: string | null;
    fileUrl: string;
    width?: number | null;
    height?: number | null;
}

interface AnnouncementItem {
    id?: number;
    message: string;
    link_url?: string | null;
    display_type?: string | null;
    image_url?: string | null;
    mobile_image_url?: string | null;
    sort_order?: number | null;
    is_active?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
    status_label?: string;
    fit_mode?: string | null;
}

interface AnnouncementsPageProps {
    items: AnnouncementItem[];
    config: {
        rotation_ms: number;
        catalog_product_image_rotation_ms: number;
    };
    mediaItems: MediaItem[];
}

interface AnnouncementFormData {
    rotation_ms: number;
    catalog_product_image_rotation_ms: number;
    items: AnnouncementItem[];
}

const iconButton =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm shadow-[0_8px_16px_rgba(15,23,42,0.08)] transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0';
const iconSoft = `${iconButton} border-sky-200 bg-white text-brand-700 hover:bg-brand-50`;
const iconPrimary = `${iconButton} border-brand-500 bg-brand-600 text-white hover:bg-brand-700`;
const iconDanger = `${iconButton} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`;

const blankAnnouncement = (sortOrder: number): AnnouncementItem => ({
    message: '',
    link_url: '',
    display_type: 'text',
    image_url: '',
    mobile_image_url: '',
    sort_order: sortOrder,
    is_active: true,
    starts_at: '',
    ends_at: '',
    status_label: 'nuevo',
    fit_mode: 'contain',
});

function itemIssues(item: AnnouncementItem): string[] {
    const issues: string[] = [];
    const startsAt = item.starts_at ? Date.parse(item.starts_at) : null;
    const endsAt = item.ends_at ? Date.parse(item.ends_at) : null;

    if (item.message.trim() === '') {
        issues.push('Falta mensaje');
    }

    if (item.display_type === 'image' && !item.image_url) {
        issues.push('Tipo imagen sin imagen');
    }

    if (item.display_type !== 'image' && item.image_url) {
        issues.push('Tiene imagen pero esta como texto');
    }

    if (startsAt !== null && endsAt !== null && endsAt < startsAt) {
        issues.push('Fin anterior al inicio');
    }

    return issues;
}

function statusChipClass(item: AnnouncementItem): string {
    if (!item.is_active) {
        return 'border-slate-200 bg-slate-50 text-slate-600';
    }

    if (item.status_label === 'programado') {
        return 'border-sky-200 bg-sky-50 text-sky-800';
    }

    if (item.status_label === 'vencido') {
        return 'border-rose-200 bg-rose-50 text-rose-700';
    }

    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

export default function AnnouncementsPage({ items, config, mediaItems }: AnnouncementsPageProps): JSX.Element {
    const [activeIndex, setActiveIndex] = useState(0);
    const [mediaOpen, setMediaOpen] = useState(false);
    const [mediaTarget, setMediaTarget] = useState<'desktop' | 'mobile'>('desktop');
    const [mediaSearch, setMediaSearch] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const uploadInputRef = useRef<HTMLInputElement | null>(null);
    const form = useForm<AnnouncementFormData>({
        rotation_ms: config.rotation_ms,
        catalog_product_image_rotation_ms: config.catalog_product_image_rotation_ms,
        items: items.length > 0 ? items : [blankAnnouncement(1)],
    });

    const selected = form.data.items[activeIndex] ?? form.data.items[0];
    const selectedIssues = selected ? itemIssues(selected) : [];
    const allIssues = form.data.items.flatMap((item, index) => itemIssues(item).map((issue) => `Anuncio ${index + 1}: ${issue}`));
    const filteredMedia = useMemo(() => {
        const term = mediaSearch.trim().toLowerCase();

        if (term === '') {
            return mediaItems;
        }

        return mediaItems.filter((item) =>
            item.title.toLowerCase().includes(term) ||
            (item.tags ?? '').toLowerCase().includes(term) ||
            item.fileUrl.toLowerCase().includes(term),
        );
    }, [mediaItems, mediaSearch]);

    function patchItem(index: number, nextItem: AnnouncementItem): void {
        const next = [...form.data.items];
        next[index] = nextItem;
        form.setData('items', next);
    }

    function addItem(): void {
        const next = [...form.data.items, blankAnnouncement(form.data.items.length + 1)];
        form.setData('items', next);
        setActiveIndex(next.length - 1);
    }

    function duplicateItem(index: number): void {
        const item = form.data.items[index];
        const next = [
            ...form.data.items.slice(0, index + 1),
            { ...item, id: undefined, message: `${item.message} copia`, sort_order: form.data.items.length + 1, status_label: 'nuevo' },
            ...form.data.items.slice(index + 1),
        ];
        form.setData('items', next);
        setActiveIndex(index + 1);
    }

    function moveItem(index: number, direction: -1 | 1): void {
        const target = index + direction;

        if (target < 0 || target >= form.data.items.length) {
            return;
        }

        const next = [...form.data.items];
        [next[index], next[target]] = [next[target], next[index]];
        form.setData('items', next.map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 })));
        setActiveIndex(target);
    }

    function removeItem(index: number): void {
        const item = form.data.items[index];

        if (!window.confirm(`Quitar "${item.message || `Anuncio ${index + 1}`}" del formulario? Al guardar se eliminara del sitio.`)) {
            return;
        }

        const next = form.data.items.filter((_, itemIndex) => itemIndex !== index);
        form.setData('items', next.length > 0 ? next : [blankAnnouncement(1)]);
        setActiveIndex(Math.max(0, index - 1));
    }

    function openMediaPicker(target: 'desktop' | 'mobile'): void {
        setMediaTarget(target);
        setUploadFeedback(null);
        setUploadError(null);
        setMediaOpen(true);
    }

    function assignAnnouncementImage(fileUrl: string): void {
        if (!selected) {
            return;
        }

        patchItem(
            activeIndex,
            mediaTarget === 'mobile'
                ? { ...selected, display_type: 'image', mobile_image_url: fileUrl }
                : { ...selected, display_type: 'image', image_url: fileUrl },
        );
    }

    async function uploadAnnouncementImage(event: ChangeEvent<HTMLInputElement>): Promise<void> {
        const file = event.target.files?.[0] ?? null;

        if (!file || !selected) {
            return;
        }

        const payload = new FormData();
        payload.append('file', file);
        payload.append('title', selected.message.trim() || file.name);
        payload.append('tags', 'anuncio');

        setUploading(true);
        setUploadFeedback(null);
        setUploadError(null);

        try {
            const response = await fetch(route('admin.media.upload'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
                body: payload,
            });
            const data = (await response.json().catch(() => null)) as { media?: MediaItem; message?: string; errors?: Record<string, string[]> } | null;

            if (!response.ok || !data?.media) {
                const firstError = data?.errors ? Object.values(data.errors).flat()[0] : null;
                throw new Error(firstError || data?.message || 'No se pudo subir la imagen.');
            }

            assignAnnouncementImage(data.media.fileUrl);
            setUploadFeedback(`Imagen subida y asignada a ${mediaTarget === 'mobile' ? 'móvil' : 'desktop'}.`);
            setMediaOpen(false);
            event.currentTarget.value = '';
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'No se pudo subir la imagen.');
        } finally {
            setUploading(false);
        }
    }

    return (
        <AdminLayout title="Anuncios">
            <form
                className={ui.pageStack}
                onSubmit={(event) => {
                    event.preventDefault();

                    if (allIssues.length > 0 && !window.confirm(`Hay advertencias:\n\n${allIssues.join('\n')}\n\nGuardar de todos modos?`)) {
                        return;
                    }

                    form.post(route('admin.announcements.save'));
                }}
            >
                <section className={`${ui.sectionCardTight} grid gap-3`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className={ui.eyebrow}>Home y ticker</p>
                            <h2 className="text-2xl font-black text-ink-950">Anuncios programados</h2>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[160px_180px_auto_auto] lg:items-end">
                            <label className="grid gap-1">
                                <span className={ui.fieldLabel}>Rotacion anuncios</span>
                                <input type="number" className={ui.input} min={1000} step={100} value={form.data.rotation_ms} onChange={(event) => form.setData('rotation_ms', Number(event.target.value))} />
                            </label>
                            <label className="grid gap-1">
                                <span className={ui.fieldLabel}>Rotacion catalogo</span>
                                <input type="number" className={ui.input} min={2000} max={20000} step={500} value={form.data.catalog_product_image_rotation_ms} onChange={(event) => form.setData('catalog_product_image_rotation_ms', Number(event.target.value))} />
                            </label>
                            <button type="button" className={buttonClass('soft')} onClick={addItem}>
                                <FaPlus aria-hidden="true" />
                                Agregar
                            </button>
                            <button type="submit" className={buttonClass('primary')} disabled={form.processing}>
                                <FaSave aria-hidden="true" />
                                Guardar
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 xl:grid-cols-[minmax(300px,0.76fr)_minmax(0,1.24fr)]">
                    <article className={`${ui.sectionCardTight} grid content-start gap-3`}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Listado</p>
                                <h3 className={ui.cardTitle}>Piezas cargadas</h3>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {form.data.items.map((item, index) => {
                                const issues = itemIssues(item);
                                const active = index === activeIndex;

                                return (
                                    <article key={`${item.id ?? 'new'}-${index}`} className={cn('rounded-xl border bg-white p-3 shadow-[0_8px_18px_rgba(18,58,132,0.06)]', active ? 'border-brand-400 bg-brand-50/35' : 'border-sky-100')}>
                                        <button type="button" className="grid w-full gap-2 text-left" onClick={() => setActiveIndex(index)}>
                                            <div className="flex items-start justify-between gap-3">
                                                <strong className="line-clamp-2 text-sm text-ink-950">{item.message || `Anuncio ${index + 1}`}</strong>
                                                <span className="text-xs font-black text-brand-700">#{item.sort_order ?? index + 1}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className={cn('rounded-full border px-2 py-1 text-[0.68rem] font-black uppercase', statusChipClass(item))}>
                                                    {item.is_active ? item.status_label ?? 'vigente' : 'pausado'}
                                                </span>
                                                <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[0.68rem] font-black uppercase text-sky-800">
                                                    {item.display_type === 'image' ? 'Imagen' : 'Texto'}
                                                </span>
                                                {issues.length > 0 ? (
                                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[0.68rem] font-black uppercase text-amber-800">
                                                        Revisar
                                                    </span>
                                                ) : null}
                                            </div>
                                        </button>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <button type="button" className={iconSoft} onClick={() => moveItem(index, -1)} disabled={index === 0} aria-label="Subir anuncio"><FaArrowUp aria-hidden="true" /></button>
                                            <button type="button" className={iconSoft} onClick={() => moveItem(index, 1)} disabled={index === form.data.items.length - 1} aria-label="Bajar anuncio"><FaArrowDown aria-hidden="true" /></button>
                                            <button type="button" className={iconSoft} onClick={() => patchItem(index, { ...item, is_active: !item.is_active })} aria-label={item.is_active ? 'Pausar anuncio' : 'Activar anuncio'}>
                                                {item.is_active ? <FaEye aria-hidden="true" /> : <FaEyeSlash aria-hidden="true" />}
                                            </button>
                                            <button type="button" className={iconPrimary} onClick={() => duplicateItem(index)} aria-label="Duplicar anuncio"><FaCopy aria-hidden="true" /></button>
                                            <button type="button" className={iconDanger} onClick={() => removeItem(index)} aria-label="Eliminar anuncio"><FaTrashAlt aria-hidden="true" /></button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </article>

                    <article className={`${ui.sectionCardTight} grid gap-4`}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Edicion</p>
                                <h3 className={ui.cardTitle}>Contenido y vista previa</h3>
                            </div>
                        </div>
                        {selected ? (
                            <div className="grid gap-4">
                                {selectedIssues.length > 0 ? (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">
                                        {selectedIssues.join(' | ')}
                                    </div>
                                ) : null}
                                {mediaOpen ? (
                                    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
                                        <div className="grid max-h-[86vh] w-full max-w-5xl gap-3 overflow-hidden rounded-2xl border border-sky-100 bg-white p-4 shadow-[0_28px_80px_rgba(15,23,42,0.28)]">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className={ui.eyebrow}>Biblioteca</p>
                                                    <h3 className="text-xl font-black text-ink-950">Elegir imagen {mediaTarget === 'mobile' ? 'móvil' : 'desktop'}</h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <input
                                                        ref={uploadInputRef}
                                                        className="hidden"
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                                        onChange={(event) => void uploadAnnouncementImage(event)}
                                                    />
                                                    <button type="button" className={buttonClass('primary', 'sm')} disabled={uploading} onClick={() => uploadInputRef.current?.click()}>
                                                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                                                    </button>
                                                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setMediaOpen(false)}>
                                                        Cerrar
                                                    </button>
                                                </div>
                                            </div>
                                            {uploadFeedback ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{uploadFeedback}</p> : null}
                                            {uploadError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{uploadError}</p> : null}
                                            <div className="relative">
                                                <input className={`${ui.input} pr-10`} placeholder="Buscar por titulo, tag o URL" value={mediaSearch} onChange={(event) => setMediaSearch(event.target.value)} />
                                                <FaSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-700" aria-hidden="true" />
                                            </div>
                                            <div className="grid max-h-[62vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-4">
                                                {filteredMedia.map((item) => (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        className="grid gap-2 rounded-lg border border-sky-100 bg-white p-2 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                                                        onClick={() => {
                                                            assignAnnouncementImage(item.fileUrl);
                                                            setMediaOpen(false);
                                                        }}
                                                    >
                                                        <img src={item.fileUrl} alt={item.title} className="h-24 w-full rounded-md object-cover" />
                                                        <strong className="line-clamp-1 text-xs text-ink-950">{item.title}</strong>
                                                        <span className="line-clamp-1 text-[0.68rem] font-bold text-ink-700">{item.tags || 'sin tags'}</span>
                                                    </button>
                                                ))}
                                                {filteredMedia.length === 0 ? (
                                                    <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm font-bold text-ink-700">No hay imagenes para esa busqueda.</div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Mensaje</span>
                                        <input className={ui.input} value={selected.message} onChange={(event) => patchItem(activeIndex, { ...selected, message: event.target.value })} />
                                    </label>
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Tipo</span>
                                        <select className={ui.input} value={selected.display_type ?? 'text'} onChange={(event) => patchItem(activeIndex, { ...selected, display_type: event.target.value })}>
                                            <option value="text">Texto</option>
                                            <option value="image">Imagen</option>
                                        </select>
                                    </label>
                                </div>
                                <label className={ui.field}>
                                    <span className={ui.fieldLabel}>Link</span>
                                    <input className={ui.input} placeholder="https:// o /ruta-interna" value={selected.link_url ?? ''} onChange={(event) => patchItem(activeIndex, { ...selected, link_url: event.target.value })} />
                                </label>
                                <div className="grid gap-3 rounded-xl border border-sky-100 bg-white/80 p-3 lg:grid-cols-3">
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Orden</span>
                                        <input type="number" min={1} className={ui.input} value={selected.sort_order ?? activeIndex + 1} onChange={(event) => patchItem(activeIndex, { ...selected, sort_order: Number(event.target.value) })} />
                                    </label>
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Inicio</span>
                                        <input type="datetime-local" className={ui.input} value={selected.starts_at ?? ''} onChange={(event) => patchItem(activeIndex, { ...selected, starts_at: event.target.value })} />
                                    </label>
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Fin</span>
                                        <input type="datetime-local" className={ui.input} value={selected.ends_at ?? ''} onChange={(event) => patchItem(activeIndex, { ...selected, ends_at: event.target.value })} />
                                    </label>
                                    <p className="text-xs font-bold text-ink-700 lg:col-span-3">
                                        {selected.starts_at || selected.ends_at ? 'El anuncio respeta la vigencia cargada.' : 'Siempre visible mientras este activo.'}
                                    </p>
                                </div>
                                <label className={ui.checkboxLine}>
                                    <input type="checkbox" checked={Boolean(selected.is_active)} onChange={(event) => patchItem(activeIndex, { ...selected, is_active: event.target.checked })} />
                                    <span>Activo en home</span>
                                </label>
                                <div className="grid gap-3 rounded-xl border border-sky-100 bg-white/80 p-3">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className={ui.fieldLabel}>Imagen</p>
                                            <p className={ui.fieldHint}>Elegi desde media o pega una URL.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => openMediaPicker('desktop')}>
                                                <FaImage aria-hidden="true" />
                                                Elegir / subir desktop
                                            </button>
                                            <button type="button" className={buttonClass('soft', 'sm')} onClick={() => patchItem(activeIndex, { ...selected, display_type: 'text', image_url: '', mobile_image_url: '' })}>
                                                Quitar imagen
                                            </button>
                                        </div>
                                    </div>
                                    <label className="grid gap-1">
                                        <span className={ui.fieldLabel}>Desktop</span>
                                        <input className={ui.input} value={selected.image_url ?? ''} onChange={(event) => patchItem(activeIndex, { ...selected, image_url: event.target.value })} />
                                    </label>
                                    <label className="grid gap-1">
                                        <span className={ui.fieldLabel}>Móvil</span>
                                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => openMediaPicker('mobile')}>
                                            <FaImage aria-hidden="true" />
                                            Elegir / subir móvil
                                        </button>
                                        <input className={ui.input} placeholder="Opcional. Si queda vacio usa la imagen desktop." value={selected.mobile_image_url ?? ''} onChange={(event) => patchItem(activeIndex, { ...selected, mobile_image_url: event.target.value })} />
                                    </label>
                                </div>
                                <div className="rounded-xl border border-sky-100 bg-slate-950 p-3">
                                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-sky-100">
                                        <span>Preview publico</span>
                                        <span className="rounded-full bg-white/10 px-2 py-1">{selected.display_type === 'image' ? 'Imagen' : 'Texto'}</span>
                                    </div>
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="text-xs font-black uppercase tracking-[0.14em] text-sky-100">Ajuste</div>
                                        <div className="flex rounded-lg border border-white/15 bg-white/8 p-1">
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-sky-100 transition',
                                                    (selected.fit_mode ?? 'contain') === 'contain' && 'bg-white text-slate-950',
                                                )}
                                                onClick={() => patchItem(activeIndex, { ...selected, fit_mode: 'contain' })}
                                            >
                                                Completa
                                            </button>
                                            <button
                                                type="button"
                                                className={cn(
                                                    'rounded-md px-3 py-1.5 text-xs font-black uppercase tracking-[0.08em] text-sky-100 transition',
                                                    selected.fit_mode === 'stretch' && 'bg-white text-slate-950',
                                                )}
                                                onClick={() => patchItem(activeIndex, { ...selected, fit_mode: 'stretch' })}
                                            >
                                                Al cartel
                                            </button>
                                        </div>
                                    </div>
                                    {selected.display_type === 'image' && selected.image_url ? (
                                        <div className="grid gap-3">
                                            <div>
                                                <div className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-sky-100">Desktop</div>
                                                <div className="aspect-[6.6/1] overflow-hidden rounded-lg border border-sky-200/20 bg-black">
                                                    <img
                                                        src={selected.image_url}
                                                        alt={selected.message || 'Anuncio'}
                                                        className={cn(
                                                            'h-full w-full',
                                                            (selected.fit_mode ?? 'contain') === 'stretch' ? 'object-fill' : 'object-contain',
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="mb-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-sky-100">Móvil</div>
                                                <div className="aspect-[6.6/1] max-w-sm overflow-hidden rounded-lg border border-sky-200/20 bg-black">
                                                    <img
                                                        src={selected.mobile_image_url || selected.image_url}
                                                        alt={selected.message || 'Anuncio móvil'}
                                                        className={cn(
                                                            'h-full w-full',
                                                            (selected.fit_mode ?? 'contain') === 'stretch' ? 'object-fill' : 'object-contain',
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex min-h-[72px] items-center justify-center rounded-lg border border-sky-200/20 bg-[linear-gradient(90deg,#122958,#071636,#122958)] px-4 text-center">
                                            <span className="text-xl font-black uppercase tracking-[0.16em] text-white">{selected.message || 'Vista previa del texto'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </article>
                </section>
            </form>
        </AdminLayout>
    );
}
