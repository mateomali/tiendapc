import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, pickerRowClass, ui } from '../../ui';

interface MediaItem {
    id: number;
    title: string;
    tags?: string | null;
    fileUrl: string;
}

interface ServiceConfig {
    hero_eyebrow?: string | null;
    hero_title?: string | null;
    hero_description?: string | null;
    cta_title?: string | null;
    cta_description?: string | null;
    cta_whatsapp_text?: string | null;
    cta_repair_text?: string | null;
}

interface ServiceItem {
    id?: number;
    title: string;
    subtitle?: string | null;
    description?: string | null;
    points_text?: string | null;
    image_url?: string | null;
    sort_order?: number | null;
    is_active?: boolean;
}

interface ServicesAdminPageProps {
    config: ServiceConfig;
    items: ServiceItem[];
    mediaItems: MediaItem[];
}

interface ServicesFormData {
    config: ServiceConfig;
    items: ServiceItem[];
}

const blankService = (sortOrder: number): ServiceItem => ({
    title: '',
    subtitle: '',
    description: '',
    points_text: '',
    image_url: '',
    sort_order: sortOrder,
    is_active: true,
});

export default function ServicesAdminPage({ config, items, mediaItems }: ServicesAdminPageProps): JSX.Element {
    const [activeIndex, setActiveIndex] = useState(0);
    const form = useForm<ServicesFormData>({
        config,
        items: items.length > 0 ? items : [blankService(1)],
    });

    const activeItem = form.data.items[activeIndex] ?? form.data.items[0];

    function patchItem(index: number, value: ServiceItem): void {
        const next = [...form.data.items];
        next[index] = value;
        form.setData('items', next);
    }

    return (
        <AdminLayout title="Servicios">
            <form
                className={ui.pageStack}
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(route('admin.services.save'));
                }}
            >
                <section className={ui.heroCard}>
                    <div className={ui.heroTitleWrap}>
                        <p className={ui.eyebrow}>Landing de servicios</p>
                        <h2 className={ui.heroTitle}>Hero, CTA y cards</h2>
                        <p className={ui.heroText}>
                            Esta pantalla vuelve al contrato del legacy con hero configurable, CTA final y cards con
                            orden, estado y media reutilizable.
                        </p>
                    </div>
                    <div className={ui.heroActions}>
                        <button
                            type="button"
                            className={buttonClass('soft')}
                            onClick={() => {
                                const next = [...form.data.items, blankService(form.data.items.length + 1)];
                                form.setData('items', next);
                                setActiveIndex(next.length - 1);
                            }}
                        >
                            Agregar servicio
                        </button>
                        <button className={buttonClass('primary')} type="submit" disabled={form.processing}>
                            Guardar servicios
                        </button>
                    </div>
                </section>

                <section className={ui.sectionCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Configuracion superior</p>
                            <h3 className={ui.cardTitle}>Hero y CTA</h3>
                        </div>
                    </div>
                    <div className={ui.settingsGrid}>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Hero eyebrow</span>
                            <input
                                className={ui.input}
                                value={form.data.config.hero_eyebrow ?? ''}
                                onChange={(event) =>
                                    form.setData('config', { ...form.data.config, hero_eyebrow: event.target.value })
                                }
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Hero title</span>
                            <input
                                className={ui.input}
                                value={form.data.config.hero_title ?? ''}
                                onChange={(event) =>
                                    form.setData('config', { ...form.data.config, hero_title: event.target.value })
                                }
                            />
                        </label>
                        <label className={ui.fieldFull}>
                            <span className={ui.fieldLabel}>Hero description</span>
                            <textarea
                                className={ui.textarea}
                                value={form.data.config.hero_description ?? ''}
                                onChange={(event) =>
                                    form.setData('config', {
                                        ...form.data.config,
                                        hero_description: event.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>CTA title</span>
                            <input
                                className={ui.input}
                                value={form.data.config.cta_title ?? ''}
                                onChange={(event) =>
                                    form.setData('config', { ...form.data.config, cta_title: event.target.value })
                                }
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Texto boton WhatsApp</span>
                            <input
                                className={ui.input}
                                value={form.data.config.cta_whatsapp_text ?? ''}
                                onChange={(event) =>
                                    form.setData('config', {
                                        ...form.data.config,
                                        cta_whatsapp_text: event.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Texto boton Reparaciones</span>
                            <input
                                className={ui.input}
                                value={form.data.config.cta_repair_text ?? ''}
                                onChange={(event) =>
                                    form.setData('config', {
                                        ...form.data.config,
                                        cta_repair_text: event.target.value,
                                    })
                                }
                            />
                        </label>
                        <label className={ui.fieldFull}>
                            <span className={ui.fieldLabel}>CTA description</span>
                            <textarea
                                className={ui.textarea}
                                value={form.data.config.cta_description ?? ''}
                                onChange={(event) =>
                                    form.setData('config', {
                                        ...form.data.config,
                                        cta_description: event.target.value,
                                    })
                                }
                            />
                        </label>
                    </div>
                </section>

                <section className={ui.twoColumnGrid}>
                    <article className={ui.sectionCard}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Cards</p>
                                <h3 className={ui.cardTitle}>Servicios cargados</h3>
                            </div>
                        </div>
                        <div className={ui.stackList}>
                            {form.data.items.map((item, index) => (
                                <button
                                    key={`${item.id ?? 'new'}-${index}`}
                                    type="button"
                                    className={pickerRowClass(index === activeIndex)}
                                    onClick={() => setActiveIndex(index)}
                                >
                                    <div>
                                        <strong>{item.title || `Servicio ${index + 1}`}</strong>
                                        <p className={ui.inlineCaption}>{item.subtitle || 'Sin subtitulo'}</p>
                                    </div>
                                    <span>{item.is_active ? 'Activo' : 'Pausado'}</span>
                                </button>
                            ))}
                        </div>
                    </article>

                    <article className={ui.sectionCard}>
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Edicion puntual</p>
                                <h3 className={ui.cardTitle}>Servicio seleccionado</h3>
                            </div>
                        </div>
                        {activeItem ? (
                            <div className="grid gap-4">
                                <label className={ui.field}>
                                    <span className={ui.fieldLabel}>Titulo</span>
                                    <input
                                        className={ui.input}
                                        value={activeItem.title}
                                        onChange={(event) =>
                                            patchItem(activeIndex, { ...activeItem, title: event.target.value })
                                        }
                                    />
                                </label>
                                <label className={ui.field}>
                                    <span className={ui.fieldLabel}>Subtitulo</span>
                                    <input
                                        className={ui.input}
                                        value={activeItem.subtitle ?? ''}
                                        onChange={(event) =>
                                            patchItem(activeIndex, { ...activeItem, subtitle: event.target.value })
                                        }
                                    />
                                </label>
                                <div className={ui.formGrid}>
                                    <label className={ui.field}>
                                        <span className={ui.fieldLabel}>Orden</span>
                                        <input
                                            type="number"
                                            min={1}
                                            className={ui.input}
                                            value={activeItem.sort_order ?? activeIndex + 1}
                                            onChange={(event) =>
                                                patchItem(activeIndex, {
                                                    ...activeItem,
                                                    sort_order: Number(event.target.value),
                                                })
                                            }
                                        />
                                    </label>
                                    <label className={ui.checkboxLineSpaced}>
                                        <input
                                            type="checkbox"
                                            checked={Boolean(activeItem.is_active)}
                                            onChange={(event) =>
                                                patchItem(activeIndex, {
                                                    ...activeItem,
                                                    is_active: event.target.checked,
                                                })
                                            }
                                        />
                                        <span>Activo en el sitio</span>
                                    </label>
                                </div>
                                <label className={ui.fieldFull}>
                                    <span className={ui.fieldLabel}>Descripcion</span>
                                    <textarea
                                        className={ui.textarea}
                                        value={activeItem.description ?? ''}
                                        onChange={(event) =>
                                            patchItem(activeIndex, { ...activeItem, description: event.target.value })
                                        }
                                    />
                                </label>
                                <label className={ui.fieldFull}>
                                    <span className={ui.fieldLabel}>Puntos (uno por linea)</span>
                                    <textarea
                                        className={ui.textarea}
                                        value={activeItem.points_text ?? ''}
                                        onChange={(event) =>
                                            patchItem(activeIndex, { ...activeItem, points_text: event.target.value })
                                        }
                                    />
                                </label>
                                <label className={ui.field}>
                                    <span className={ui.fieldLabel}>Imagen</span>
                                    <input
                                        className={ui.input}
                                        value={activeItem.image_url ?? ''}
                                        onChange={(event) =>
                                            patchItem(activeIndex, { ...activeItem, image_url: event.target.value })
                                        }
                                    />
                                </label>
                                <div className={ui.previewPanel}>
                                    {activeItem.image_url ? (
                                        <img
                                            src={activeItem.image_url}
                                            alt={activeItem.title || 'Servicio'}
                                            className="max-h-72 w-full rounded-[1.25rem] object-cover"
                                        />
                                    ) : (
                                        <div className={ui.previewBanner}>
                                            <span>Sin imagen seleccionada</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </article>
                </section>

                <section className={ui.sectionCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Media picker</p>
                            <h3 className={ui.cardTitle}>Seleccion rapida de imagen</h3>
                        </div>
                    </div>
                    <div className={ui.mediaPickerGrid}>
                        {mediaItems.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={ui.mediaPicker}
                                onClick={() => {
                                    if (!activeItem) {
                                        return;
                                    }

                                    patchItem(activeIndex, { ...activeItem, image_url: item.fileUrl });
                                }}
                            >
                                <img src={item.fileUrl} alt={item.title} className={ui.mediaPickerThumb} />
                                <strong>{item.title}</strong>
                                <span className={ui.inlineCaption}>{item.tags || 'sin tags'}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}
