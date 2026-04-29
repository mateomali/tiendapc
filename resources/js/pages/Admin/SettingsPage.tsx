import { useForm } from '@inertiajs/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface SettingsPageProps {
    settings: Record<string, string>;
    whatsappDisplay: string;
}

interface SettingsFormPayload {
    settings: Record<string, string>;
}

const labels: Record<string, { label: string; hint: string; multiline?: boolean }> = {
    whatsapp_number: {
        label: 'WhatsApp principal',
        hint: 'Se usa en carrito, footer, servicios y contacto.',
    },
    reparaciones_url: {
        label: 'URL de reparaciones',
        hint: 'Ruta publica para seguimiento tecnico o consulta de reparaciones.',
    },
    footer_address: {
        label: 'Direccion footer',
        hint: 'Texto breve con ubicacion o barrio.',
    },
    footer_hours: {
        label: 'Horarios footer',
        hint: 'Horario comercial que aparece en el pie del sitio.',
    },
    footer_map_url: {
        label: 'URL mapa',
        hint: 'Link externo o iframe source para ubicacion.',
    },
    footer_cta_title: {
        label: 'Titulo CTA footer',
        hint: 'Titulo principal del bloque final.',
    },
    footer_cta_text: {
        label: 'Texto CTA footer',
        hint: 'Descripcion del llamado a la accion del footer.',
        multiline: true,
    },
    catalog_empty_text: {
        label: 'Mensaje catalogo vacio',
        hint: 'Se ve cuando no hay resultados en el listado.',
        multiline: true,
    },
    catalog_new_days: {
        label: 'Dias para novedad',
        hint: 'Cuantos dias un producto se considera nuevo.',
    },
    catalog_product_image_rotation_ms: {
        label: 'Rotacion de imagenes (ms)',
        hint: 'Intervalo usado por el catalogo para rotar imagenes secundarias.',
    },
    product_detail_description_word_limit: {
        label: 'Limite descripcion detalle',
        hint: 'Cantidad de palabras antes de truncar la descripcion larga.',
    },
};

export default function SettingsPage({ settings, whatsappDisplay }: SettingsPageProps): JSX.Element {
    const form = useForm<SettingsFormPayload>({
        settings,
    });

    const orderedKeys = Object.keys(labels);

    return (
        <AdminLayout title="Configuracion">
            <div className={ui.pageStack}>
                <section className={ui.heroCard}>
                    <div className={ui.heroTitleWrap}>
                        <p className={ui.eyebrow}>Parametros legacy</p>
                        <h2 className={ui.heroTitle}>Configuracion operativa del sitio</h2>
                        <p className={ui.heroText}>
                            Este formulario deja atras el key/value generico y trabaja con las claves funcionales del
                            sistema original.
                        </p>
                    </div>
                    <div className={ui.heroActions}>
                        <div className={ui.previewPill}>
                            <span>WhatsApp actual</span>
                            <strong className="ml-2 block text-lg font-black text-ink-950">{whatsappDisplay}</strong>
                        </div>
                    </div>
                </section>

                <form
                    className={ui.sectionCard}
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('admin.settings.save'));
                    }}
                >
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Contrato del sitio</p>
                            <h3 className={ui.cardTitle}>Claves curadas</h3>
                        </div>
                    </div>
                    <div className={ui.settingsGrid}>
                        {orderedKeys.map((key) => {
                            const meta = labels[key];
                            const value = form.data.settings[key] ?? '';

                            return (
                                <label key={key} className={ui.field}>
                                    <span className={ui.fieldLabel}>{meta.label}</span>
                                    {meta.multiline ? (
                                        <textarea
                                            className={ui.textarea}
                                            value={value}
                                            onChange={(event) =>
                                                form.setData('settings', {
                                                    ...form.data.settings,
                                                    [key]: event.target.value,
                                                })
                                            }
                                        />
                                    ) : (
                                        <input
                                            className={ui.input}
                                            value={value}
                                            onChange={(event) =>
                                                form.setData('settings', {
                                                    ...form.data.settings,
                                                    [key]: event.target.value,
                                                })
                                            }
                                        />
                                    )}
                                    <small className={ui.fieldHint}>{meta.hint}</small>
                                </label>
                            );
                        })}
                    </div>
                    <div className={ui.inlineActions}>
                        <button className={buttonClass('primary')} type="submit" disabled={form.processing}>
                            Guardar configuracion
                        </button>
                    </div>
                </form>

                <form
                    className={ui.sectionCard}
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('admin.settings.clear_cache'));
                    }}
                >
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Mantenimiento</p>
                            <h3 className={ui.cardTitle}>Limpiar cache del panel</h3>
                        </div>
                    </div>
                    <p className={ui.inlineCaption}>
                        Limpia config, rutas y vistas compiladas despues de cambios operativos o importaciones.
                    </p>
                    <div className={ui.inlineActions}>
                        <button className={buttonClass('soft')} type="submit">
                            Limpiar cache
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
