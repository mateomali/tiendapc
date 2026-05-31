import { useForm } from '@inertiajs/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface ContactPageProps {
    contact: {
        whatsapp_number: string;
        contact_title?: string | null;
        contact_description?: string | null;
        contact_email?: string | null;
        maps_embed_url?: string | null;
        whatsapp_display?: string;
        whatsapp_url?: string;
    };
}

export default function ContactPage({ contact }: ContactPageProps): JSX.Element {
    const form = useForm({
        whatsapp_number: contact.whatsapp_number ?? '',
        contact_title: contact.contact_title ?? '',
        contact_description: contact.contact_description ?? '',
        contact_email: contact.contact_email ?? '',
        maps_embed_url: contact.maps_embed_url ?? '',
    });

    const currentWhatsapp = form.data.whatsapp_number || contact.whatsapp_display || '-';
    const currentWhatsappUrl = form.data.whatsapp_number
        ? `https://wa.me/${form.data.whatsapp_number.replace(/\D+/g, '')}`
        : contact.whatsapp_url ?? '#';

    return (
        <AdminLayout title="Contacto">
            <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
                <form
                    className={ui.sectionCard}
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.post(route('admin.contact.save'));
                    }}
                >
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Bloque publico</p>
                            <h3 className={ui.cardTitle}>Contacto y WhatsApp</h3>
                        </div>
                    </div>
                    <div className={ui.settingsGrid}>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>WhatsApp</span>
                            <input
                                className={ui.input}
                                placeholder="54911..."
                                value={form.data.whatsapp_number}
                                onChange={(event) => form.setData('whatsapp_number', event.target.value)}
                            />
                            <small className={ui.fieldHint}>Fuente principal del CTA publico y de ventas por WhatsApp.</small>
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Titulo</span>
                            <input
                                className={ui.input}
                                value={form.data.contact_title}
                                onChange={(event) => form.setData('contact_title', event.target.value)}
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Email</span>
                            <input
                                className={ui.input}
                                value={form.data.contact_email}
                                onChange={(event) => form.setData('contact_email', event.target.value)}
                            />
                        </label>
                        <label className={ui.field}>
                            <span className={ui.fieldLabel}>Mapa / Embed URL</span>
                            <input
                                className={ui.input}
                                value={form.data.maps_embed_url}
                                onChange={(event) => form.setData('maps_embed_url', event.target.value)}
                            />
                        </label>
                        <label className={ui.fieldFull}>
                            <span className={ui.fieldLabel}>Descripcion</span>
                            <textarea
                                className={ui.textarea}
                                value={form.data.contact_description}
                                onChange={(event) => form.setData('contact_description', event.target.value)}
                            />
                        </label>
                    </div>
                    <div className={ui.inlineActions}>
                        <button className={buttonClass('primary')} type="submit" disabled={form.processing}>
                            Guardar contacto
                        </button>
                    </div>
                </form>

                <aside className={ui.sectionCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Preview</p>
                            <h3 className={ui.cardTitle}>Como se ve en el sitio</h3>
                        </div>
                    </div>
                    <div className="grid gap-3 rounded-[1.4rem] border border-sky-100 bg-white/80 p-5 shadow-[0_12px_26px_rgba(18,58,132,0.08)]">
                        <span className={ui.stateChip}>WhatsApp principal</span>
                        <strong>{currentWhatsapp}</strong>
                        <p className="text-base font-semibold text-ink-900">{form.data.contact_title || 'Escribinos para consultas, stock o reparaciones'}</p>
                        <p className={ui.inlineCaption}>
                            {form.data.contact_description || 'El bloque de contacto usa este texto como apoyo del CTA.'}
                        </p>
                        <p className={ui.inlineCaption}>
                            Email visible: {form.data.contact_email || 'sin configurar'}
                        </p>
                        <a href={currentWhatsappUrl} target="_blank" rel="noreferrer" className={buttonClass('primary')}>
                            Abrir WhatsApp
                        </a>
                    </div>
                </aside>
            </div>
        </AdminLayout>
    );
}
