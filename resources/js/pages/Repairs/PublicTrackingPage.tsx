import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FaArrowLeft, FaMapMarkerAlt, FaSearch, FaTimes, FaTools, FaWhatsapp } from 'react-icons/fa';
import type {
    PublicRepairFeedback,
    PublicRepairImageView,
    PublicRepairTicketResultView,
    PublicRepairViewConfig,
} from '../../types';
import { repairButtonClass as buttonClass, repairSurfaceClass as surfaceClass } from '../../repairUi';
import { cn } from '../../utils';

interface PublicTrackingPageProps {
    filters: {
        id_buscado?: number | null;
        dni_buscado?: number | null;
        auto?: number | null;
    };
    searched: boolean;
    publicView: PublicRepairViewConfig;
    feedback?: PublicRepairFeedback | null;
    results: PublicRepairTicketResultView[];
}

interface LightboxState {
    title: string;
    images: PublicRepairImageView[];
    index: number;
}

const pageShellClass =
    'min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(74,172,255,0.26),transparent_26%),radial-gradient(circle_at_top_left,rgba(38,82,180,0.14),transparent_24%),linear-gradient(180deg,#eff5ff_0%,#dce9ff_22%,#d4e3ff_100%)] px-4 py-10';
const cardClass = `${surfaceClass} mx-auto grid w-full max-w-5xl justify-items-center gap-6 border-[#b8cff2] bg-white px-5 py-6 text-[#0f2348] shadow-[0_24px_60px_rgba(14,48,105,0.16)] md:gap-7 md:p-8`;
const iconBaseClass = 'text-[#174ea6]';
const inputClass =
    'min-h-12 w-full rounded-2xl border border-sky-200/90 bg-white/95 px-4 py-3 text-sm font-medium text-ink-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10';
const fieldClass = 'grid gap-2';
const fieldLabelClass = 'whitespace-nowrap text-sm font-black uppercase tracking-[0.12em] text-[#17427f]';
const repairLookupFormClass =
    'mx-auto grid w-full max-w-xl gap-4 rounded-[1.35rem] border border-[#b8d7ff]/80 bg-[linear-gradient(180deg,#ffffff_0%,#f4f9ff_100%)] p-5 shadow-[0_16px_32px_rgba(18,58,132,0.11),0_0_0_3px_rgba(184,215,255,0.14)] sm:grid-cols-[minmax(0,10.5rem)_minmax(0,12rem)] sm:items-end sm:justify-center md:w-fit md:max-w-none md:grid-cols-[10.5rem_12rem_3rem] md:p-5';
const actionButtonClass = buttonClass('primary', 'default', 'min-h-12 w-full rounded-2xl px-4 sm:col-span-2 md:col-span-1 md:w-12 md:min-w-12 md:p-0 md:self-end');

const variantStyles: Record<string, string> = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    warning: 'border-amber-300 bg-amber-50 text-amber-950',
    danger: 'border-rose-300 bg-rose-50 text-rose-950',
    info: 'border-sky-300 bg-sky-50 text-sky-950',
    secondary: 'border-slate-300 bg-slate-100 text-slate-950',
    waiting: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950',
};

function feedbackClass(variant?: string): string {
    return cn(
        'rounded-[1.5rem] border px-4 py-4 text-sm font-semibold shadow-[0_14px_28px_rgba(18,58,132,0.08)]',
        variantStyles[variant ?? 'secondary'] ?? variantStyles.secondary,
    );
}

function orderClass(variant: string, highlight: boolean): string {
    return cn(
        'grid gap-5 rounded-[1.75rem] border bg-white p-5 shadow-[0_18px_34px_rgba(18,58,132,0.13)]',
        variantStyles[variant] ?? variantStyles.secondary,
        highlight && 'ring-4 ring-brand-500/12',
    );
}

function sectionTintClass(variant: string): string {
    return cn(
        'grid gap-4 rounded-[1.5rem] border px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]',
        variantStyles[variant] ?? variantStyles.secondary,
    );
}

function detailToneClass(tone: string): string {
    if (tone === 'accent') {
        return 'text-brand-700';
    }

    if (tone === 'total') {
        return 'text-emerald-700';
    }

    return 'text-ink-900';
}

function ChevronLeftIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path fill="currentColor" d="m15.41 7.41-1.41-1.41L8.59 11.4l5.41 5.42 1.41-1.41L11.41 11.4z" />
        </svg>
    );
}

function ChevronRightIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path fill="currentColor" d="m8.59 16.59 1.41 1.41 5.41-5.41L10 7.17 8.59 8.59 12.59 12z" />
        </svg>
    );
}

export default function PublicTrackingPage({
    filters,
    searched,
    publicView,
    feedback,
    results,
}: PublicTrackingPageProps): JSX.Element {
    const pageTitle = publicView.title;
    const pageSubtitle = publicView.subtitle;
    const bannerAlt = 'Sudoku Jugueteria y Electronica';
    const addressTitle = publicView.addressTitle;
    const hoursLabel = publicView.hoursLabel;
    const mapUrl = publicView.mapUrl;
    const form = useForm({
        id_buscado: filters.id_buscado ? String(filters.id_buscado) : '',
        dni_buscado: filters.dni_buscado ? String(filters.dni_buscado) : '',
    });
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);
    const [submittingLookup, setSubmittingLookup] = useState(false);

    const submitLookup = (): void => {
        const params = new URLSearchParams();
        const orderId = form.data.id_buscado.trim();
        const dni = form.data.dni_buscado.trim();

        if (orderId !== '') {
            params.set('orden', orderId);
        }

        if (dni !== '') {
            params.set('dni', dni);
        }

        router.get(window.location.pathname, Object.fromEntries(params.entries()), {
            preserveState: true,
            preserveScroll: false,
            onStart: () => setSubmittingLookup(true),
            onFinish: () => setSubmittingLookup(false),
        });
    };

    useEffect(() => {
        if (!searched) {
            return;
        }

        const target = document.getElementById('repair-public-anchor');

        if (!target) {
            return;
        }

        window.requestAnimationFrame(() => {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }, [searched, results.length, feedback]);

    const canMoveLightbox = lightbox !== null && lightbox.images.length > 1;

    return (
        <>
            <Head title={pageTitle}>
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="shortcut icon" href="/favicon.ico" />
            </Head>

            <div className={pageShellClass}>
                <div className={cardClass}>
                    <a href={publicView.brandUrl} className="mx-auto flex w-full max-w-xl items-center justify-center overflow-hidden rounded-[1.1rem] border border-sky-100 bg-white/82 p-2.5 shadow-[0_12px_24px_rgba(18,58,132,0.06)]" aria-label="Ir a Sudoku">
                        <img
                            src={publicView.bannerUrl}
                            alt={bannerAlt}
                            className="max-h-20 w-full object-contain"
                            onError={(event) => {
                                event.currentTarget.src = publicView.bannerFallbackUrl;
                            }}
                        />
                    </a>

                    <div className="grid w-full max-w-3xl gap-3 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <FaTools aria-hidden="true" className={`${iconBaseClass} text-3xl`} />
                            <h1 className="text-3xl font-black tracking-tight text-ink-950 md:text-4xl">{pageTitle}</h1>
                        </div>
                        <p className="mx-auto max-w-2xl text-base font-semibold leading-7 text-[#29466f]">{pageSubtitle}</p>
                    </div>

                    <form
                        className={repairLookupFormClass}
                        onSubmit={(event) => {
                            event.preventDefault();
                            submitLookup();
                        }}
                    >
                        <label className={fieldClass}>
                            <span className={fieldLabelClass}>{publicView.orderLabel}</span>
                            <input
                                className={inputClass}
                                type="text"
                                inputMode="numeric"
                                maxLength={7}
                                placeholder={publicView.orderPlaceholder}
                                value={form.data.id_buscado}
                                onChange={(event) => form.setData('id_buscado', event.target.value.replace(/\D/g, '').slice(0, 7))}
                            />
                        </label>

                        <label className={fieldClass}>
                            <span className={fieldLabelClass}>{publicView.dniLabel}</span>
                            <input
                                className={inputClass}
                                type="text"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder={publicView.dniPlaceholder}
                                value={form.data.dni_buscado}
                                onChange={(event) => form.setData('dni_buscado', event.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                        </label>

                        <button className={`${actionButtonClass} ${submittingLookup ? 'opacity-75' : ''}`} type="submit" aria-label="Consultar estado de la reparación" title="Consultar estado" disabled={submittingLookup}>
                            <span className="md:hidden">{submittingLookup ? 'Buscando...' : 'Encontrar mi equipo'}</span>
                            <FaSearch aria-hidden="true" className="text-base" />
                        </button>
                    </form>

                    {feedback ? (
                        <div id="repair-public-anchor" className={feedbackClass(feedback.variant)}>
                            <span>{feedback.message}</span>
                        </div>
                    ) : null}

                    {results.length > 0 ? (
                        <section id="repair-public-anchor" className="grid gap-6">
                            {results.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className={cn(
                                        'grid gap-5 rounded-[2rem] border px-4 py-4 shadow-[0_18px_40px_rgba(18,58,132,0.09)] md:px-5',
                                        ticket.clusterVariant === 'warning'
                                            ? 'border-amber-300 bg-amber-50'
                                            : 'border-sky-200 bg-white',
                                    )}
                                >
                                    {ticket.repairs.map((repair) => (
                                        <article
                                            key={`${repair.id}-${repair.repairNumber}-${repair.registroId}`}
                                            className={orderClass(repair.status.variant, repair.highlight)}
                                        >
                                            <h2 className="text-lg font-black uppercase tracking-[0.16em] text-[#123f82]">
                                                {repair.headline}
                                            </h2>

                                            <div className="grid gap-4 rounded-[1.4rem] border border-sky-200 bg-white p-4 shadow-[0_12px_24px_rgba(18,58,132,0.08)] md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dcecff] text-[#174ea6] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                                                    <FaTools aria-hidden="true" className="text-2xl" />
                                                </div>
                                                <div className="grid gap-3">
                                                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#17427f]">
                                                        DETALLE DE REPARACION
                                                    </p>
                                                    <h3 className="text-2xl font-black tracking-tight text-ink-950">
                                                        {repair.subheadline}
                                                    </h3>
                                                    <div className="inline-flex w-fit items-center rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-black text-[#102146]">
                                                        <span>{repair.model}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {repair.entryImages.length > 0 ? (
                                                <div className={sectionTintClass(repair.status.variant)}>
                                                    <h4 className="text-sm font-black uppercase tracking-[0.16em] text-[#102146]">Imagenes del producto ingresado</h4>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        {repair.entryImages.map((image, index) => (
                                                            <button
                                                                key={`${repair.id}-entry-${image.label}`}
                                                                type="button"
                                                                className="grid gap-2 overflow-hidden rounded-[1.2rem] border border-white/80 bg-white/80 p-3 text-left shadow-[0_10px_24px_rgba(18,58,132,0.08)] transition hover:-translate-y-0.5"
                                                                onClick={() =>
                                                                    setLightbox({
                                                                        title: image.title,
                                                                        images: repair.entryImages,
                                                                        index,
                                                                    })
                                                                }
                                                            >
                                                                <img src={image.thumbnailUrl} alt={image.label} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                                                                <span className="text-sm font-semibold">{image.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="grid gap-3">
                                                {repair.fields.map((field) => (
                                                    <div key={`${repair.id}-${field.label}`} className="flex flex-col gap-1 rounded-[1.2rem] border border-sky-100 bg-white/80 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                                        <span className="text-xs font-black uppercase tracking-[0.14em] text-[#17427f]">{field.label}</span>
                                                        <span className={cn('text-sm font-black', detailToneClass(field.tone))}>{field.value}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {repair.observation ? (
                                                <div className="grid gap-2 rounded-[1.4rem] border border-sky-100 bg-white/85 px-4 py-4">
                                                    <h4 className="text-sm font-black uppercase tracking-[0.16em] text-[#17427f]">{repair.observation.title}</h4>
                                                    {repair.observation.announcedAt ? (
                                                        <p className="text-sm font-bold text-[#35517f]">
                                                            Anunciado el {repair.observation.announcedAt}:
                                                        </p>
                                                    ) : null}
                                                    <p className="text-base leading-7 text-ink-900">{repair.observation.text}</p>
                                                </div>
                                            ) : null}

                                            <div className={sectionTintClass(repair.status.variant)}>
                                                {repair.status.announcedAt ? (
                                                    <span className="text-xs font-black uppercase tracking-[0.16em]">
                                                        Anunciado el {repair.status.announcedAt}
                                                    </span>
                                                ) : null}
                                                <span className="text-base font-black">{repair.status.message}</span>
                                                {repair.status.pickup ? (
                                                    <div className="grid gap-1 rounded-[1.1rem] border border-white/80 bg-white/80 px-4 py-3 text-sm shadow-[0_10px_22px_rgba(18,58,132,0.08)]">
                                                        <strong className="text-xs font-black uppercase tracking-[0.16em]">
                                                            {repair.status.pickup.title}
                                                        </strong>
                                                        <span className="font-bold">{repair.status.pickup.address}</span>
                                                        <span className="leading-6">{repair.status.pickup.hours}</span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {repair.finalImages.length > 0 ? (
                                                <div className={sectionTintClass(repair.status.variant)}>
                                                    <h4 className="text-sm font-black uppercase tracking-[0.16em] text-[#102146]">Imagenes del resultado final</h4>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        {repair.finalImages.map((image, index) => (
                                                            <button
                                                                key={`${repair.id}-final-${image.label}`}
                                                                type="button"
                                                                className="grid gap-2 overflow-hidden rounded-[1.2rem] border border-white/80 bg-white/80 p-3 text-left shadow-[0_10px_24px_rgba(18,58,132,0.08)] transition hover:-translate-y-0.5"
                                                                onClick={() =>
                                                                    setLightbox({
                                                                        title: image.title,
                                                                        images: repair.finalImages,
                                                                        index,
                                                                    })
                                                                }
                                                            >
                                                                <img src={image.thumbnailUrl} alt={image.label} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                                                                <span className="text-sm font-semibold">{image.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </article>
                                    ))}

                                    <div className={cn('rounded-[1.4rem] border px-4 py-4 text-center shadow-[0_12px_26px_rgba(18,58,132,0.08)]', variantStyles[ticket.clusterVariant] ?? variantStyles.secondary)}>
                                        <strong className="text-base font-black">{ticket.summaryLabel}</strong>
                                    </div>
                                </div>
                            ))}
                        </section>
                    ) : null}

                    <a href={publicView.whatsappUrl} target="_blank" rel="noreferrer" className="mx-auto inline-flex min-h-11 w-full max-w-sm items-center justify-center gap-2 rounded-2xl border border-[#128C7E]/45 bg-white px-4 py-2.5 text-sm font-bold text-[#0f6b5f] shadow-[0_8px_18px_rgba(18,58,132,0.07)] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:border-[#128C7E] hover:bg-[#f2fffb] hover:brightness-[1.02] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(53,117,236,0.16)]">
                        <span>{publicView.whatsappLabel}</span>
                        <FaWhatsapp aria-hidden="true" className="text-lg" />
                    </a>

                    <a href={mapUrl} target="_blank" rel="noreferrer" className="grid w-full max-w-3xl gap-2 rounded-[1.35rem] border border-sky-100 bg-white/85 px-5 py-5 text-center shadow-[0_14px_28px_rgba(18,58,132,0.08)] transition hover:-translate-y-px hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:shadow-[0_18px_34px_rgba(18,58,132,0.12)]" aria-label="Abrir ubicación en Google Maps">
                        <p className="flex items-center justify-center gap-2 text-base font-black text-ink-950">
                            <FaMapMarkerAlt aria-hidden="true" className={iconBaseClass} />
                            <strong>{addressTitle}</strong>
                        </p>
                        <p className="text-sm leading-6 text-ink-800">{hoursLabel}</p>
                    </a>

                    {searched ? (
                        <a href={publicView.resetUrl} className={buttonClass('soft', 'default', 'mx-auto')}>
                            <FaArrowLeft aria-hidden="true" className="text-sm" />
                            <span>{publicView.resetLabel}</span>
                        </a>
                    ) : null}
                </div>
            </div>

            {lightbox ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/82 px-4 py-6 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-label={lightbox.title}
                    onClick={() => setLightbox(null)}
                >
                    <div className="relative flex w-full max-w-5xl flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-slate-950/90 p-4 text-white shadow-[0_30px_60px_rgba(0,0,0,0.45)]" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                            onClick={() => setLightbox(null)}
                            aria-label="Cerrar"
                        >
                            <FaTimes aria-hidden="true" className="text-base" />
                        </button>

                        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[1.5rem] bg-slate-900 p-4 md:min-h-[560px]">
                            {canMoveLightbox ? (
                                <button
                                    type="button"
                                    className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                                    onClick={() =>
                                        setLightbox((current) =>
                                            current === null
                                                ? null
                                                : {
                                                      ...current,
                                                      index:
                                                          (current.index - 1 + current.images.length) %
                                                          current.images.length,
                                                  }
                                        )
                                    }
                                    aria-label="Anterior"
                                >
                                    <ChevronLeftIcon />
                                </button>
                            ) : null}

                            <img
                                src={lightbox.images[lightbox.index]?.url}
                                alt={lightbox.images[lightbox.index]?.label ?? 'Imagen de la reparacion'}
                                className="max-h-[72vh] w-auto max-w-full rounded-[1.2rem] object-contain"
                            />

                            {canMoveLightbox ? (
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                                    onClick={() =>
                                        setLightbox((current) =>
                                            current === null
                                                ? null
                                                : {
                                                      ...current,
                                                      index: (current.index + 1) % current.images.length,
                                                  }
                                        )
                                    }
                                    aria-label="Siguiente"
                                >
                                    <ChevronRightIcon />
                                </button>
                            ) : null}
                        </div>

                        <p className="px-2 text-center text-sm font-semibold text-white/90">
                            {lightbox.images[lightbox.index]?.title ?? lightbox.title}
                        </p>
                    </div>
                </div>
            ) : null}
        </>
    );
}
