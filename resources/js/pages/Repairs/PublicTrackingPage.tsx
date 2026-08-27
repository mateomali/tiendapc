import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import {
    FaArrowLeft,
    FaMapMarkerAlt,
    FaSearch,
    FaTimes,
    FaTools,
    FaWhatsapp,
} from 'react-icons/fa';
import type {
    PublicRepairFeedback,
    PublicRepairImageView,
    PublicRepairStatusView,
    PublicRepairTicketResultView,
    PublicRepairViewConfig,
} from '../../types';
import {
    repairButtonClass as buttonClass,
    repairSurfaceClass as surfaceClass,
} from '../../repairUi';
import { cn } from '../../utils';

interface PublicTrackingPageProps {
    filters: {
        id_buscado?: number | null;
        dni_buscado?: string | number | null;
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
    'min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(87,182,255,0.24),transparent_24%),radial-gradient(circle_at_top_left,rgba(36,86,184,0.22),transparent_22%),linear-gradient(180deg,#2a57a9_0%,#22458f_38%,#17376f_100%)] px-4 py-8 md:py-10';
const cardClass =
    `${surfaceClass} mx-auto grid w-full max-w-5xl justify-items-center gap-6 border-[rgba(202,226,255,0.42)] bg-white px-5 py-6 text-[#0f2348] shadow-[0_24px_58px_rgba(4,16,47,0.28),inset_0_1px_0_rgba(255,255,255,0.8)] md:gap-7 md:p-8`;
const iconBaseClass = 'text-[#174ea6]';
const inputClass =
    'min-h-12 w-full rounded-xl border border-[rgba(190,221,255,0.84)] bg-white px-4 py-3 text-sm font-bold text-[#102146] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_6px_14px_rgba(8,25,70,0.12)] outline-none transition placeholder:text-[#6f87af] focus:border-[rgba(184,229,255,0.98)] focus:ring-4 focus:ring-sky-200/30';
const fieldClass = 'grid gap-2';
const fieldLabelClass =
    'whitespace-nowrap text-sm font-black uppercase tracking-[0.12em] text-[#17427f]';
const repairLookupFormClass =
    'relative mx-auto grid w-full max-w-xl gap-4 overflow-hidden rounded-[1.1rem] border border-[#8bbcff] bg-[linear-gradient(180deg,#ffffff_0%,#eef6ff_100%)] p-5 shadow-[0_22px_46px_rgba(4,16,47,0.28),0_0_0_4px_rgba(184,215,255,0.32),inset_0_1px_0_rgba(255,255,255,0.96)] before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[linear-gradient(90deg,#35bcd7_0%,#2f61bf_42%,#17376f_100%)] before:content-[\"\"] sm:grid-cols-[minmax(0,10.5rem)_minmax(0,12rem)] sm:items-end sm:justify-center md:w-fit md:max-w-none md:grid-cols-[10.5rem_12rem_3rem] md:p-5';
const actionButtonClass = buttonClass(
    'primary',
    'default',
    'min-h-12 w-full rounded-xl px-4 sm:col-span-2 md:col-span-1 md:w-12 md:min-w-12 md:p-0 md:self-end',
);

const variantStyles: Record<string, string> = {
    success: 'border-emerald-300 bg-emerald-50 text-emerald-950',
    warning: 'border-amber-300 bg-amber-50 text-amber-950',
    danger: 'border-rose-300 bg-rose-50 text-rose-950',
    info: 'border-sky-300 bg-sky-50 text-sky-950',
    secondary: 'border-slate-300 bg-slate-100 text-slate-950',
    waiting: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-950',
};

const statusImageByVariant: Record<string, string> = {
    warning: '/assets/img/repairs/status/pending.webp',
    waiting: '/assets/img/repairs/status/in-repair.webp',
    success: '/assets/img/repairs/status/ready.webp',
    info: '/assets/img/repairs/status/delivered.webp',
    danger: '/assets/img/repairs/status/cancelled.webp',
    secondary: '/assets/img/repairs/status/pending.webp',
};

const statusImageAltByVariant: Record<string, string> = {
    warning: 'Equipo pendiente de revision',
    waiting: 'Equipo en reparacion',
    success: 'Reparacion lista para retirar',
    info: 'Equipo entregado',
    danger: 'Reparacion cancelada o no realizada',
    secondary: 'Estado de reparacion',
};

const trackingSteps = [
    { key: 'warning', label: 'Recibido' },
    { key: 'waiting', label: 'Estamos trabajando' },
    { key: 'success', label: 'Listo para retirar' },
    { key: 'info', label: 'Entregado' },
] as const;

function trackingStepIndex(variant: string): number {
    if (variant === 'warning') return 0;
    if (variant === 'waiting') return 1;
    if (variant === 'success') return 2;
    if (variant === 'info') return 3;

    return -1;
}

function trackingTitle(variant: string): string {
    if (variant === 'warning') return 'Recibimos tu equipo';
    if (variant === 'waiting') return 'Estamos trabajando';
    if (variant === 'success') return 'Listo para retirar';
    if (variant === 'info') return 'Equipo entregado';
    if (variant === 'danger') return 'Necesitamos revisar esta orden';

    return 'Estado de la reparacion';
}

function trackingToneClass(variant: string, target: 'bg' | 'border' | 'text'): string {
    if (variant === 'warning') {
        if (target === 'bg') return 'bg-[#d97706]';
        if (target === 'border') return 'border-[#d97706]';
        return 'text-[#d97706]';
    }

    if (variant === 'waiting') {
        if (target === 'bg') return 'bg-[#a21caf]';
        if (target === 'border') return 'border-[#a21caf]';
        return 'text-[#a21caf]';
    }

    if (variant === 'success') {
        if (target === 'bg') return 'bg-[#059669]';
        if (target === 'border') return 'border-[#059669]';
        return 'text-[#059669]';
    }

    if (variant === 'info') {
        if (target === 'bg') return 'bg-[#0284c7]';
        if (target === 'border') return 'border-[#0284c7]';
        return 'text-[#0284c7]';
    }

    if (target === 'bg') return 'bg-[#174ea6]';
    if (target === 'border') return 'border-[#174ea6]';
    return 'text-[#174ea6]';
}

function trackingLineWidthClass(index: number): string {
    if (index <= 0) return 'w-0';
    if (index === 1) return 'w-1/4';
    if (index === 2) return 'w-1/2';

    return 'w-3/4';
}

function StatusTracking({ status }: { status: PublicRepairStatusView }): JSX.Element {
    const currentIndex = trackingStepIndex(status.variant);
    const isSpecialState = currentIndex < 0;
    const progressClass = cn(trackingLineWidthClass(currentIndex), trackingToneClass(status.variant, 'bg'));

    return (
        <div className={cn(sectionTintClass(status.variant), 'gap-4')}>
            {!isSpecialState ? (
                <div className="rounded-md border border-white/80 bg-white px-4 py-4">
                    <div className="relative grid grid-cols-4 gap-2">
                        <div className="absolute left-[12.5%] right-[12.5%] top-3 h-1 rounded-full bg-slate-200" aria-hidden="true" />
                        <div
                            className={cn('absolute left-[12.5%] top-3 h-1 rounded-full', progressClass)}
                            aria-hidden="true"
                        />
                        {trackingSteps.map((step, index) => {
                            const complete = index < currentIndex;
                            const active = index === currentIndex;

                            return (
                                <div key={step.key} className="relative z-10 grid justify-items-center gap-2 text-center">
                                    <span
                                        className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white text-xs font-black',
                                            complete && trackingToneClass(status.variant, 'border'),
                                            complete && trackingToneClass(status.variant, 'bg'),
                                            complete && 'text-white',
                                            active && trackingToneClass(status.variant, 'border'),
                                            active && trackingToneClass(status.variant, 'text'),
                                            !complete && !active && 'border-slate-300 text-slate-400',
                                        )}
                                    >
                                        {complete ? '✓' : index + 1}
                                    </span>
                                    <span
                                        className={cn(
                                            'text-[0.72rem] font-black leading-tight md:text-xs',
                                            active && 'text-[#102146]',
                                            complete && trackingToneClass(status.variant, 'text'),
                                            !complete && !active && 'text-slate-500',
                                        )}
                                    >
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[8rem_minmax(0,1fr)] md:items-center">
                <div className="mx-auto w-full max-w-[8rem] overflow-hidden rounded-md border border-white/80 bg-white p-1.5 md:mx-0">
                    <img
                        src={statusImageByVariant[status.variant] ?? statusImageByVariant.secondary}
                        alt={statusImageAltByVariant[status.variant] ?? statusImageAltByVariant.secondary}
                        className="aspect-square w-full rounded-md object-cover"
                        loading="lazy"
                    />
                </div>
                <div className="grid gap-2">
                    {status.announcedAt ? (
                        <span className="text-xs font-black">Actualizado el {status.announcedAt}</span>
                    ) : null}
                    <h4 className="text-xl font-black text-[#102146] md:text-2xl">{trackingTitle(status.variant)}</h4>
                    <p className="text-base font-bold leading-7">{status.message}</p>
                    {status.queue ? (
                        <div className="mt-1 grid gap-1 rounded-md border border-fuchsia-200 bg-white px-3 py-2.5 text-sm text-[#102146]">
                            <span className="font-black">
                                Puesto {status.queue.position} de {status.queue.total}
                            </span>
                            <span className="font-semibold leading-6">
                                {status.queue.message}
                            </span>
                        </div>
                    ) : null}
                </div>
            </div>

            {status.pickup ? (
                <div className="grid gap-1 rounded-md border border-white/80 bg-white px-3 py-2.5 text-sm">
                    <strong className="text-xs font-black">{status.pickup.title}</strong>
                    <span className="font-bold">{status.pickup.address}</span>
                    <span className="leading-6">{status.pickup.hours}</span>
                </div>
            ) : null}
        </div>
    );
}

function feedbackClass(variant?: string): string {
    return cn(
        'rounded-lg border px-4 py-3 text-sm font-semibold',
        variantStyles[variant ?? 'secondary'] ?? variantStyles.secondary,
    );
}

function orderClass(variant: string, highlight: boolean): string {
    return cn(
        'grid gap-4 rounded-lg border bg-white p-4 shadow-sm md:p-5',
        variantStyles[variant] ?? variantStyles.secondary,
        highlight && 'ring-2 ring-brand-500/10',
    );
}

function sectionTintClass(variant: string): string {
    return cn(
        'grid gap-3 rounded-lg border px-4 py-4',
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
            <path
                fill="currentColor"
                d="m15.41 7.41-1.41-1.41L8.59 11.4l5.41 5.42 1.41-1.41L11.41 11.4z"
            />
        </svg>
    );
}

function ChevronRightIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
                fill="currentColor"
                d="m8.59 16.59 1.41 1.41 5.41-5.41L10 7.17 8.59 8.59 12.59 12z"
            />
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
    const showDniField = publicView.showDniField;
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

        router.get(
            window.location.pathname,
            Object.fromEntries(params.entries()),
            {
                preserveState: true,
                preserveScroll: false,
                onStart: () => setSubmittingLookup(true),
                onFinish: () => setSubmittingLookup(false),
            },
        );
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
                    <section className="grid w-full justify-items-center gap-6">
                        <div className="grid w-full justify-items-center gap-6 text-center">
                            <a
                                href={publicView.brandUrl}
                                className="mx-auto flex w-full items-center justify-center overflow-hidden"
                                aria-label="Ir a Sudoku"
                            >
                                <img
                                    src={publicView.bannerUrl}
                                    alt={bannerAlt}
                                    className="h-auto max-h-32 w-full object-contain md:max-h-40"
                                    onError={(event) => {
                                        event.currentTarget.src =
                                            publicView.bannerFallbackUrl;
                                    }}
                                />
                            </a>

                            <div className="grid w-full max-w-3xl justify-items-center gap-3 text-center">
                                <a
                                    href={publicView.brandUrl}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#c7d7ed] bg-white px-4 py-2 text-sm font-bold text-[#17427f] shadow-[0_8px_18px_rgba(18,58,132,0.07)] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:brightness-[1.02] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(53,117,236,0.16)]"
                                >
                                    <FaArrowLeft aria-hidden="true" className="text-sm" />
                                    <span>Volver al sitio</span>
                                </a>

                                <div className="flex items-center justify-center gap-3">
                                    <FaTools
                                        aria-hidden="true"
                                        className={`${iconBaseClass} text-3xl`}
                                    />
                                    <h1 className="text-3xl font-black tracking-tight text-ink-950 md:text-4xl">
                                        {pageTitle}
                                    </h1>
                                </div>
                                <p className="mx-auto max-w-2xl text-base font-semibold leading-7 text-[#29466f]">
                                    {pageSubtitle}
                                </p>
                            </div>
                        </div>

                        <form
                            className={repairLookupFormClass}
                            onSubmit={(event) => {
                                event.preventDefault();
                                submitLookup();
                            }}
                        >
                            <label className={fieldClass}>
                                <span className={fieldLabelClass}>
                                    {publicView.orderLabel}
                                </span>
                                <input
                                    className={inputClass}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={7}
                                    placeholder={publicView.orderPlaceholder}
                                    value={form.data.id_buscado}
                                    onChange={(event) =>
                                        form.setData(
                                            'id_buscado',
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 7),
                                        )
                                    }
                                />
                            </label>

                            {showDniField ? (
                                <label className={fieldClass}>
                                    <span className={fieldLabelClass}>
                                        {publicView.dniLabel}
                                    </span>
                                    <input
                                        className={inputClass}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder={publicView.dniPlaceholder}
                                        value={form.data.dni_buscado}
                                        onChange={(event) =>
                                            form.setData(
                                                'dni_buscado',
                                                event.target.value
                                                    .replace(/\D/g, '')
                                                    .slice(0, 10),
                                            )
                                        }
                                    />
                                </label>
                            ) : null}

                            <button
                                className={`${actionButtonClass} ${submittingLookup ? 'opacity-75' : ''}`}
                                type="submit"
                                aria-label="Consultar estado de la reparación"
                                title="Consultar estado"
                                disabled={submittingLookup}
                            >
                                <span className="md:hidden">
                                    {submittingLookup
                                        ? 'Buscando...'
                                        : 'Encontrar mi equipo'}
                                </span>
                                <FaSearch
                                    aria-hidden="true"
                                    className="text-base"
                                />
                            </button>
                        </form>
                    </section>

                    {feedback ? (
                        <div
                            id="repair-public-anchor"
                            className={feedbackClass(feedback.variant)}
                        >
                            <span>{feedback.message}</span>
                        </div>
                    ) : null}

                    {results.length > 0 ? (
                        <section
                            id="repair-public-anchor"
                            className="grid gap-4"
                        >
                            {results.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className={cn(
                                        'grid gap-4 rounded-lg border px-4 py-4 shadow-sm md:px-5',
                                        ticket.clusterVariant === 'warning'
                                            ? 'border-amber-300 bg-amber-50'
                                            : 'border-sky-200 bg-white',
                                    )}
                                >
                                    {ticket.repairs.map((repair) => (
                                        <article
                                            key={`${repair.id}-${repair.repairNumber}-${repair.registroId}`}
                                            className={orderClass(
                                                repair.status.variant,
                                                repair.highlight,
                                            )}
                                        >
                                            <h2 className="text-lg font-black text-[#123f82]">
                                                {repair.headline}
                                            </h2>

                                            <div className="grid gap-4 rounded-lg border border-sky-200 bg-white p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-start">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#dcecff] text-[#174ea6]">
                                                    <FaTools
                                                        aria-hidden="true"
                                                        className="text-2xl"
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <h3 className="text-xl font-black text-ink-950 md:text-2xl">
                                                        {repair.subheadline}
                                                    </h3>
                                                    <div className="inline-flex w-fit items-center rounded-md border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-black text-[#102146]">
                                                        <span>
                                                            {repair.model}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {repair.entryImages.length > 0 ? (
                                                <div
                                                    className={sectionTintClass(
                                                        repair.status.variant,
                                                    )}
                                                >
                                                    <h4 className="text-sm font-black text-[#102146]">
                                                        Imagenes del producto
                                                        ingresado
                                                    </h4>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        {repair.entryImages.map(
                                                            (image, index) => (
                                                                <button
                                                                    key={`${repair.id}-entry-${image.label}`}
                                                                    type="button"
                                                                    className="grid gap-2 overflow-hidden rounded-md border border-[#d6e4f2] bg-white p-2 text-left transition hover:bg-[#f8fbff]"
                                                                    onClick={() =>
                                                                        setLightbox(
                                                                            {
                                                                                title: image.title,
                                                                                images: repair.entryImages,
                                                                                index,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <img
                                                                        src={
                                                                            image.thumbnailUrl
                                                                        }
                                                                        alt={
                                                                            image.label
                                                                        }
                                                                        className="aspect-[4/3] w-full rounded-md object-cover"
                                                                    />
                                                                    <span className="text-sm font-semibold">
                                                                        {
                                                                            image.label
                                                                        }
                                                                    </span>
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}

                                            <div className="grid gap-3">
                                                {repair.fields.map((field) => (
                                                    <div
                                                        key={`${repair.id}-${field.label}`}
                                                        className="flex flex-col gap-1 rounded-md border border-sky-100 bg-white px-3 py-2.5 md:flex-row md:items-center md:justify-between"
                                                    >
                                                        <span className="text-xs font-black text-[#17427f]">
                                                            {field.label}
                                                        </span>
                                                        <span
                                                            className={cn(
                                                                'text-sm font-black',
                                                                detailToneClass(
                                                                    field.tone,
                                                                ),
                                                            )}
                                                        >
                                                            {field.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {repair.observation ? (
                                                <div className="grid gap-2 rounded-lg border border-sky-100 bg-white px-4 py-3">
                                                    <h4 className="text-sm font-black text-[#17427f]">
                                                        {
                                                            repair.observation
                                                                .title
                                                        }
                                                    </h4>
                                                    {repair.observation
                                                        .announcedAt ? (
                                                        <p className="text-sm font-bold text-[#35517f]">
                                                            Anunciado el{' '}
                                                            {
                                                                repair
                                                                    .observation
                                                                    .announcedAt
                                                            }
                                                            :
                                                        </p>
                                                    ) : null}
                                                    <p className="text-base leading-7 text-ink-900">
                                                        {
                                                            repair.observation
                                                                .text
                                                        }
                                                    </p>
                                                </div>
                                            ) : null}

                                            <StatusTracking status={repair.status} />

                                            {repair.finalImages.length > 0 ? (
                                                <div
                                                    className={sectionTintClass(
                                                        repair.status.variant,
                                                    )}
                                                >
                                                    <h4 className="text-sm font-black text-[#102146]">
                                                        Imagenes del resultado
                                                        final
                                                    </h4>
                                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                                        {repair.finalImages.map(
                                                            (image, index) => (
                                                                <button
                                                                    key={`${repair.id}-final-${image.label}`}
                                                                    type="button"
                                                                    className="grid gap-2 overflow-hidden rounded-md border border-[#d6e4f2] bg-white p-2 text-left transition hover:bg-[#f8fbff]"
                                                                    onClick={() =>
                                                                        setLightbox(
                                                                            {
                                                                                title: image.title,
                                                                                images: repair.finalImages,
                                                                                index,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <img
                                                                        src={
                                                                            image.thumbnailUrl
                                                                        }
                                                                        alt={
                                                                            image.label
                                                                        }
                                                                        className="aspect-[4/3] w-full rounded-md object-cover"
                                                                    />
                                                                    <span className="text-sm font-semibold">
                                                                        {
                                                                            image.label
                                                                        }
                                                                    </span>
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </article>
                                    ))}

                                    <div
                                        className={cn(
                                            'rounded-lg border px-4 py-3 text-center',
                                            variantStyles[
                                                ticket.clusterVariant
                                            ] ?? variantStyles.secondary,
                                        )}
                                    >
                                        <strong className="text-base font-black">
                                            {ticket.summaryLabel}
                                        </strong>
                                    </div>
                                </div>
                            ))}
                        </section>
                    ) : null}

                    <div className="mx-auto grid w-full max-w-sm gap-2">
                        <a
                            href={publicView.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#128C7E]/45 bg-white px-4 py-2.5 text-sm font-bold text-[#0f6b5f] shadow-[0_8px_18px_rgba(18,58,132,0.07)] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:border-[#128C7E] hover:bg-[#f2fffb] hover:brightness-[1.02] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(53,117,236,0.16)]"
                        >
                            <span>{publicView.whatsappLabel}</span>
                            <FaWhatsapp aria-hidden="true" className="text-lg" />
                        </a>
                    </div>

                    <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="grid w-full max-w-3xl gap-2 rounded-[1.35rem] border border-sky-100 bg-white/85 px-5 py-5 text-center shadow-[0_14px_28px_rgba(18,58,132,0.08)] transition hover:-translate-y-px hover:border-[#93c5fd] hover:bg-[#f8fbff] hover:shadow-[0_18px_34px_rgba(18,58,132,0.12)]"
                        aria-label="Abrir ubicación en Google Maps"
                    >
                        <p className="flex items-center justify-center gap-2 text-base font-black text-ink-950">
                            <FaMapMarkerAlt
                                aria-hidden="true"
                                className={iconBaseClass}
                            />
                            <strong>{addressTitle}</strong>
                        </p>
                        <p className="text-sm leading-6 text-ink-800">
                            {hoursLabel}
                        </p>
                    </a>

                    {searched ? (
                        <a
                            href={publicView.resetUrl}
                            className={buttonClass(
                                'soft',
                                'default',
                                'mx-auto',
                            )}
                        >
                            <FaArrowLeft
                                aria-hidden="true"
                                className="text-sm"
                            />
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
                    <div
                        className="relative flex w-full max-w-5xl flex-col gap-4 rounded-lg border border-white/10 bg-slate-950/90 p-4 text-white shadow-lg"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                            onClick={() => setLightbox(null)}
                            aria-label="Cerrar"
                        >
                            <FaTimes aria-hidden="true" className="text-base" />
                        </button>

                        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-lg bg-slate-900 p-4 md:min-h-[560px]">
                            {canMoveLightbox ? (
                                <button
                                    type="button"
                                    className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                                    onClick={() =>
                                        setLightbox((current) =>
                                            current === null
                                                ? null
                                                : {
                                                      ...current,
                                                      index:
                                                          (current.index -
                                                              1 +
                                                              current.images
                                                                  .length) %
                                                          current.images.length,
                                                  },
                                        )
                                    }
                                    aria-label="Anterior"
                                >
                                    <ChevronLeftIcon />
                                </button>
                            ) : null}

                            <img
                                src={lightbox.images[lightbox.index]?.url}
                                alt={
                                    lightbox.images[lightbox.index]?.label ??
                                    'Imagen de la reparacion'
                                }
                                className="max-h-[72vh] w-auto max-w-full rounded-lg object-contain"
                            />

                            {canMoveLightbox ? (
                                <button
                                    type="button"
                                    className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                                    onClick={() =>
                                        setLightbox((current) =>
                                            current === null
                                                ? null
                                                : {
                                                      ...current,
                                                      index:
                                                          (current.index + 1) %
                                                          current.images.length,
                                                  },
                                        )
                                    }
                                    aria-label="Siguiente"
                                >
                                    <ChevronRightIcon />
                                </button>
                            ) : null}
                        </div>

                        <p className="px-2 text-center text-sm font-semibold text-white/90">
                            {lightbox.images[lightbox.index]?.title ??
                                lightbox.title}
                        </p>
                    </div>
                </div>
            ) : null}
        </>
    );
}
