import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { cn } from '../../utils';

interface SettingsPageProps {
    settings: Record<string, string>;
    whatsappDisplay: string;
}

interface SettingsFormPayload {
    settings: Record<string, string>;
}

const labels: Record<string, { label: string; hint: string; multiline?: boolean }> = {
    product_sku_enabled: {
        label: 'Trabajar con SKU',
        hint: 'Muestra los campos SKU en la carga y edicion de productos.',
    },
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
    repair_quote_monthly_increment_percentage: {
        label: 'Aumento mensual presupuestos',
        hint: 'Porcentaje mensual aplicado cuando el precio encontrado para reparar un telefono es antiguo.',
    },
    repair_intake_mode: {
        label: 'Carga de nueva orden',
        hint: 'Define si el alta de reparaciones se completa en una sola pantalla o por pasos.',
    },
    repair_orders_per_page: {
        label: 'Ordenes por pagina',
        hint: 'Cantidad de tickets por pagina en consultas, estados, entregados y archivados. Minimo 24.',
    },
};

export default function SettingsPage({ settings, whatsappDisplay }: SettingsPageProps): JSX.Element {
    const [activeSection, setActiveSection] = useState<'site' | 'products' | 'repairs' | 'maintenance'>('site');
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
        'repair_quote_monthly_increment_percentage',
        'repair_intake_mode',
        'repair_orders_per_page',
    ];
    const productCashKeys = [
        'product_sku_enabled',
        'product_cash_discount_enabled',
        'product_cash_discount_threshold',
        'product_cash_discount_percentage',
        'product_cash_discount_note',
    ];
    const sectionButtons = [
        { key: 'site', label: 'Sitio' },
        { key: 'products', label: 'Productos' },
        { key: 'repairs', label: 'Reparaciones' },
        { key: 'maintenance', label: 'Mantenimiento' },
    ] as const;

    const renderSettingField = (key: string): JSX.Element => {
        const meta = labels[key];
        const value = form.data.settings[key] ?? '';

        return (
            <label key={key} className={ui.field}>
                <span className={ui.fieldLabel}>{meta.label}</span>
                {key === 'repair_intake_mode' ? (
                    <select
                        className={ui.input}
                        value={value || 'continuous'}
                        onChange={(event) =>
                            form.setData('settings', {
                                ...form.data.settings,
                                [key]: event.target.value,
                            })
                        }
                    >
                        <option value="continuous">Formulario continuo</option>
                        <option value="wizard">Paso a paso</option>
                    </select>
                ) : key === 'repair_cash_discount_enabled' || key === 'product_cash_discount_enabled' || key === 'product_sku_enabled' ? (
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
                        type={key === 'repair_cash_discount_threshold' || key === 'repair_cash_discount_percentage' || key === 'repair_quote_monthly_increment_percentage' || key === 'repair_orders_per_page' || key === 'product_cash_discount_threshold' || key === 'product_cash_discount_percentage' || key === 'catalog_new_days' || key === 'catalog_product_image_rotation_ms' || key === 'product_detail_description_word_limit' ? 'number' : 'text'}
                        min={key === 'repair_orders_per_page' ? '24' : (key === 'repair_cash_discount_threshold' || key === 'repair_cash_discount_percentage' || key === 'repair_quote_monthly_increment_percentage' || key === 'product_cash_discount_threshold' || key === 'product_cash_discount_percentage' ? '0' : undefined)}
                        step={key === 'repair_cash_discount_percentage' || key === 'repair_quote_monthly_increment_percentage' || key === 'product_cash_discount_percentage' ? '0.1' : undefined}
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
                <section className={`${ui.sectionCardTight} grid gap-3`}>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-xl font-black text-ink-950">Configuracion</h2>
                            <p className={ui.inlineCaption}>WhatsApp actual: {whatsappDisplay}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-1 rounded-lg border border-sky-100 bg-white p-1 sm:grid-cols-4">
                            {sectionButtons.map((section) => (
                                <button
                                    key={section.key}
                                    type="button"
                                    className={cn(
                                        'min-h-9 rounded-md px-3 text-sm font-black text-ink-800',
                                        activeSection === section.key ? 'bg-brand-600 text-white' : 'bg-white hover:bg-sky-50',
                                    )}
                                    onClick={() => setActiveSection(section.key)}
                                >
                                    {section.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {activeSection !== 'maintenance' ? (
                    <form
                        className={ui.sectionCard}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(route('admin.settings.save'));
                        }}
                    >
                    {activeSection === 'site' ? (
                        <div className="grid gap-3">
                            <div className={ui.cardHeading}>
                                <div className={ui.cardTitleWrap}>
                                    <h3 className={ui.cardTitle}>Sitio y catalogo</h3>
                                </div>
                            </div>
                            <div className={ui.settingsGrid}>
                                {siteKeys.map(renderSettingField)}
                            </div>
                        </div>
                    ) : null}

                    {activeSection === 'products' ? (
                        <div className="grid gap-3">
                            <div className={ui.cardHeading}>
                                <div className={ui.cardTitleWrap}>
                                    <h3 className={ui.cardTitle}>Productos</h3>
                                </div>
                            </div>
                            <div className={ui.settingsGrid}>
                                {productCashKeys.map(renderSettingField)}
                            </div>
                        </div>
                    ) : null}

                    {activeSection === 'repairs' ? (
                        <div className="grid gap-3">
                            <div className={ui.cardHeading}>
                                <div className={ui.cardTitleWrap}>
                                    <h3 className={ui.cardTitle}>Reparaciones</h3>
                                </div>
                            </div>
                            <div className={ui.settingsGrid}>
                                {repairTicketKeys.map(renderSettingField)}
                            </div>
                        </div>
                    ) : null}

                    <div className={ui.inlineActions}>
                        <button className={buttonClass('primary')} type="submit" disabled={form.processing}>
                            Guardar configuracion
                        </button>
                    </div>
                    </form>
                ) : null}

                {activeSection === 'maintenance' ? (
                    <form
                        className={ui.sectionCard}
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(route('admin.settings.clear_cache'));
                        }}
                    >
                        <div className={ui.cardHeading}>
                            <div className={ui.cardTitleWrap}>
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
                ) : null}
            </div>
        </AdminLayout>
    );
}
