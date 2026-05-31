import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, tagChipClass, ui } from '../../ui';

interface MediaItem {
    id: number;
    title: string;
    file_url: string;
    tags?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
    file_size_label: string;
    dimensions_label: string;
    created_at_label: string;
    is_image: boolean;
}

interface MediaTag {
    name: string;
    count: number;
}

interface MediaPageProps {
    media: MediaItem[];
    filters: {
        q?: string;
        tag?: string;
    };
    tagsCloud: MediaTag[];
    stats: {
        total: number;
        images: number;
        tags: number;
        totalSizeLabel: string;
    };
}

export default function MediaPage({ media, filters, tagsCloud, stats }: MediaPageProps): JSX.Element {
    const [query, setQuery] = useState(filters.q ?? '');
    const [tag, setTag] = useState(filters.tag ?? '');
    const [copyFeedback, setCopyFeedback] = useState<number | null>(null);
    const uploadForm = useForm<{ title: string; tags: string; file: File | null }>({
        title: '',
        tags: '',
        file: null,
    });

    const activeTags = useMemo(
        () =>
            uploadForm.data.tags
                .split(',')
                .map((value) => value.trim())
                .filter((value) => value !== ''),
        [uploadForm.data.tags],
    );

    function applyFilters(event?: FormEvent<HTMLFormElement>): void {
        event?.preventDefault();

        router.get(
            route('admin.media.index'),
            {
                q: query || undefined,
                tag: tag || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    }

    async function copyUrl(item: MediaItem): Promise<void> {
        try {
            await navigator.clipboard.writeText(item.file_url);
            setCopyFeedback(item.id);
            window.setTimeout(() => setCopyFeedback((current) => (current === item.id ? null : current)), 1800);
        } catch {
            setCopyFeedback(null);
        }
    }

    return (
        <AdminLayout title="Media">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Biblioteca visual</p>
                    <h2 className={ui.heroTitle}>Media y assets del catalogo</h2>
                    <p className={ui.heroText}>
                        Esta vista recupera el flujo del panel legacy: subida rapida, filtros por texto y tag, y acceso
                        directo a URLs reutilizables para productos, anuncios y servicios.
                    </p>
                </div>
                <div className={ui.heroActions}>
                    <button
                        type="button"
                        className={buttonClass('soft')}
                        onClick={() => {
                            setQuery('');
                            setTag('');
                            router.get(route('admin.media.index'));
                        }}
                    >
                        Limpiar filtros
                    </button>
                </div>
            </section>

            <section className={ui.statsGrid}>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Archivos visibles</p>
                    <p className={ui.statValue}>{stats.total}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Imagenes</p>
                    <p className={ui.statValue}>{stats.images}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Tags activos</p>
                    <p className={ui.statValue}>{stats.tags}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Peso total</p>
                    <p className={ui.statValueCompact}>{stats.totalSizeLabel}</p>
                </article>
            </section>

            <section className={ui.sectionCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Subida rapida</p>
                        <h3 className={ui.cardTitle}>Agregar archivo a la biblioteca</h3>
                    </div>
                </div>
                <form
                    className={ui.formGrid}
                    onSubmit={(event) => {
                        event.preventDefault();
                        uploadForm.post(route('admin.media.upload'), {
                            forceFormData: true,
                            preserveScroll: true,
                            onSuccess: () => uploadForm.reset(),
                        });
                    }}
                >
                    <div className={ui.field}>
                        <label htmlFor="media_title" className={ui.fieldLabel}>Titulo</label>
                        <input
                            id="media_title"
                            className={ui.input}
                            placeholder="Ej: banner whatsapp abril"
                            value={uploadForm.data.title}
                            onChange={(event) => uploadForm.setData('title', event.target.value)}
                        />
                    </div>
                    <div className={ui.field}>
                        <label htmlFor="media_tags" className={ui.fieldLabel}>Tags</label>
                        <input
                            id="media_tags"
                            className={ui.input}
                            placeholder="producto, banner, oferta"
                            value={uploadForm.data.tags}
                            onChange={(event) => uploadForm.setData('tags', event.target.value)}
                        />
                    </div>
                    <div className={ui.fieldWide}>
                        <label htmlFor="media_file" className={ui.fieldLabel}>Archivo</label>
                        <input
                            id="media_file"
                            className={ui.input}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={(event) => uploadForm.setData('file', event.target.files?.[0] ?? null)}
                        />
                        <p className={ui.inlineCaption}>
                            Formatos permitidos: JPG, PNG, WEBP o GIF. Limite: 10 MB por imagen.
                        </p>
                        {uploadForm.errors.file ? <p className="text-sm font-bold text-rose-700">{uploadForm.errors.file}</p> : null}
                    </div>
                    <div className={ui.mediaActions}>
                        <button className={buttonClass('primary')} type="submit" disabled={uploadForm.processing}>
                            {uploadForm.processing ? 'Subiendo...' : 'Subir archivo'}
                        </button>
                        <p className={ui.inlineCaption}>
                            {activeTags.length > 0
                                ? `Se guardaran ${activeTags.length} tag(s) normalizados`
                                : 'Los tags te ayudan a reutilizar imagenes desde productos, anuncios y servicios.'}
                        </p>
                    </div>
                </form>
            </section>

            <section className={ui.sectionCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Exploracion</p>
                        <h3 className={ui.cardTitle}>Biblioteca filtrable</h3>
                    </div>
                </div>
                <form className={ui.filtersRow} onSubmit={applyFilters}>
                    <input
                        className={`${ui.input} lg:max-w-sm`}
                        placeholder="Buscar por titulo, tag o URL"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <input
                        className={`${ui.input} lg:max-w-sm`}
                        placeholder="Filtrar por tag exacto"
                        value={tag}
                        onChange={(event) => setTag(event.target.value)}
                    />
                    <button className={buttonClass('primary')} type="submit">
                        Filtrar
                    </button>
                </form>

                {tagsCloud.length > 0 ? (
                    <div className={ui.tagCloud}>
                        {tagsCloud.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                className={tagChipClass(tag === item.name)}
                                onClick={() => {
                                    setTag(item.name);
                                    router.get(route('admin.media.index'), {
                                        q: query || undefined,
                                        tag: item.name,
                                    });
                                }}
                            >
                                {item.name} ({item.count})
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className={ui.mediaGrid}>
                    {media.map((item) => (
                        <article key={item.id} className={ui.mediaItem}>
                            <div className={ui.mediaThumbWrap}>
                                {item.is_image ? (
                                    <img src={item.file_url} alt={item.title} className="h-full w-full object-cover" />
                                ) : (
                                    <div className={ui.mediaThumbFallback}>Archivo</div>
                                )}
                            </div>
                            <div className={ui.mediaBody}>
                                <h3>{item.title}</h3>
                                <p className={ui.inlineCaption}>{item.file_url}</p>
                                <p className={ui.inlineCaption}>
                                    {item.dimensions_label} | {item.file_size_label}
                                </p>
                                <p className={ui.inlineCaption}>Subido: {item.created_at_label}</p>
                                <div className={ui.mediaActions}>
                                    {(item.tags ?? 'sin tags')
                                        .split(',')
                                        .map((value) => value.trim())
                                        .filter((value) => value !== '')
                                        .map((value) => (
                                            <span key={`${item.id}-${value}`} className={ui.warningChip}>
                                                {value}
                                            </span>
                                        ))}
                                    {!(item.tags ?? '').trim() ? <span className={ui.stateChip}>Sin tags</span> : null}
                                </div>
                                <div className={ui.mediaActions}>
                                    <a href={item.file_url} target="_blank" rel="noreferrer" className={buttonClass('soft', 'sm')}>
                                        Ver
                                    </a>
                                    <button type="button" className={buttonClass('soft', 'sm')} onClick={() => void copyUrl(item)}>
                                        {copyFeedback === item.id ? 'URL copiada' : 'Copiar URL'}
                                    </button>
                                    <Link
                                        href={route('admin.media.destroy', item.id)}
                                        method="post"
                                        as="button"
                                        className={buttonClass('danger', 'sm')}
                                    >
                                        Eliminar
                                    </Link>
                                </div>
                            </div>
                        </article>
                    ))}
                    {media.length === 0 ? (
                        <article className={ui.emptyCard}>
                            <h3 className={ui.emptyTitle}>No hay archivos para estos filtros</h3>
                            <p className={ui.emptyText}>Ajusta texto, tag o sube nuevas imagenes a la biblioteca.</p>
                        </article>
                    ) : null}
                </div>
            </section>
        </AdminLayout>
    );
}
