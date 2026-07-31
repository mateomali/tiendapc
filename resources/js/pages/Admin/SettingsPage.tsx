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
    product_cash_discount_enabled: {
        label: 'Precio efectivo en productos',
        hint: 'Activa el precio especial por pago en efectivo para articulos del catalogo.',
    },
    product_cash_discount_threshold: {
        label: 'Aplicar desde',
        hint: 'Precio minimo del producto para mostrar descuento en efectivo.',
    },
    product_cash_discount_percentage: {
        label: 'Descuento global',
        hint: 'Porcentaje por defecto. Cada producto puede sobrescribirlo.',
    },
    product_cash_discount_note: {
        label: 'Texto precio efectivo',
        hint: 'Mensaje que acompana el precio especial en catalogo, carrito y WhatsApp.',
        multiline: true,
    },
    repair_cash_discount_enabled: {
        label: 'Precio efectivo en reparaciones',
        hint: 'Activa el calculo de precio lista y precio efectivo en tickets tecnicos.',
    },
    repair_cash_discount_threshold: {
        label: 'Aplicar desde',
        hint: 'Monto minimo de reparacion para mostrar precio lista y efectivo.',
    },
    repair_cash_discount_percentage: {
        label: 'Diferencia porcentual',
        hint: 'Porcentaje usado para calcular el precio lista desde el precio efectivo.',
    },
    repair_cash_discount_note: {
        label: 'Texto del ticket tecnico',
        hint: 'Mensaje que se imprime cuando aplica el precio efectivo.',
        multiline: true,
    },
};

export default function SettingsPage({ settings, whatsappDisplay }: SettingsPageProps): JSX.Element {
    const form = useForm<SettingsFormPayload>({
        settings,
    });

    const siteKeys = [
        'whatsapp_number',
        'reparaciones_url',
        'footer_address',
        'footer_hours',
        'footer_map_url',
        'footer_cta_title',
        'footer_cta_text',
        'catalog_empty_text',
        'catalog_new_days',
        'catalog_product_image_rotation_ms',
        'product_detail_description_word_limit',
    ];
    const repairTicketKeys = [
        'repair_cash_discount_enabled',
        'repair_cash_discount_threshold',
        'repair_cash_discount_percentage',
        'repair_cash_discount_note',
    ];
    const productCashKeys = [
        'product_cash_discount_enabled',
        'product_cash_discount_threshold',
        'product_cash_discount_percentage',
        'product_cash_discount_note',
    ];

    const renderSettingField = (key: string): JSX.Element => {
        const meta = labels[key];
        const value = form.data.settings[key] ?? '';

        return (
            <label key={key} className={ui.field}>
                <span className={ui.fieldLabel}>{meta.label}</span>
                {key === 'repair_cash_discount_enabled' || key === 'product_cash_discount_enabled' ? (
                    <select
                        className={ui.input}
                        value={value}
                        onChange={(event) =>
                            form.setData('settings', {
                                ...form.data.settings,
                                [key]: event.target.value,
                            })
                        }
                    >
                        <option value="1">Activado</option>
                        <option value="0">Desactivado</option>
                    </select>
                ) : meta.multiline ? (
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
                        type={key === 'repair_cash_discount_threshold' || key === 'repair_cash_discount_percentage' ? 'number' : 'text'}
                        min={key === 'repair_cash_discount_threshold' || key === 'repair_cash_discount_percentage' || key === 'product_cash_discount_threshold' || key === 'product_cash_discount_percentage' ? '0' : undefined}
                        step={key === 'repair_cash_discount_percentage' || key === 'product_cash_discount_percentage' ? '0.1' : undefined}
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
    };

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
                        {siteKeys.map(renderSettingField)}
                    </div>
                    <div className="mt-5 border-t border-sky-100 pt-5">
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Catalogo</p>
                                <h3 className={ui.cardTitle}>Precio efectivo en productos</h3>
                            </div>
                        </div>
                        <div className={ui.settingsGrid}>
                            {productCashKeys.map(renderSettingField)}
                        </div>
                    </div>
                    <div className="mt-5 border-t border-sky-100 pt-5">
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
                                <p className={ui.eyebrow}>Ticket tecnico</p>
                                <h3 className={ui.cardTitle}>Precio lista y efectivo</h3>
                            </div>
                        </div>
                        <div className={ui.settingsGrid}>
                            {repairTicketKeys.map(renderSettingField)}
                        </div>
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
