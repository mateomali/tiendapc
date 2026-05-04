import { cn } from './utils';

const cardSurface =
    'rounded-[1rem] border border-[rgba(203,219,244,0.82)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_12px_28px_rgba(18,58,132,0.075)]';
const buttonBase =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.78rem] border border-transparent px-4 py-2 text-[0.86rem] font-black leading-none tracking-[0.01em] no-underline transition duration-150 active:translate-y-px hover:-translate-y-px hover:brightness-[1.02] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgba(53,117,236,0.16)] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none disabled:brightness-100';
const buttonSize = {
    default: 'min-h-10',
    sm: 'min-h-8 rounded-[0.62rem] px-3 py-1.5 text-[0.74rem]',
} as const;
const buttonVariant = {
    primary:
        'border-[rgba(179,208,255,0.94)] bg-[linear-gradient(180deg,#3d7af2_0%,#2456b4_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_12px_24px_rgba(37,86,180,0.2)]',
    soft:
        'border-[#d3e1fb] bg-[linear-gradient(180deg,#ffffff_0%,#edf4ff_100%)] text-[#1f4e9c] shadow-[0_10px_22px_rgba(20,50,108,0.08)]',
    danger:
        'border-[#fecdd3] bg-[linear-gradient(180deg,#fff1f3_0%,#ffd9df_100%)] text-[#b42342] shadow-[0_10px_22px_rgba(190,24,93,0.1)]',
    success:
        'border-[rgba(167,243,208,0.48)] bg-[linear-gradient(180deg,#41d07c_0%,#21a850_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_12px_24px_rgba(33,168,80,0.18)]',
} as const;

export const ui = {
    pageStack: 'grid gap-4',
    heroCard:
        `${cardSurface} flex flex-col gap-4 p-4 text-ink-900 sm:p-5 lg:flex-row lg:items-start lg:justify-between`,
    heroTitleWrap: 'space-y-2',
    eyebrow: 'text-[0.68rem] font-black uppercase tracking-[0.16em] text-brand-700/70',
    heroTitle: 'text-[1.55rem] font-black leading-tight tracking-tight text-ink-950 md:text-[1.9rem]',
    heroText: 'max-w-3xl text-[0.88rem] leading-6 text-ink-800 md:text-[0.96rem]',
    heroActions: 'flex flex-wrap items-center gap-2',
    statsGrid: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    statCard: `${cardSurface} space-y-1.5 p-4`,
    statLabel: 'text-[0.68rem] font-black uppercase tracking-[0.15em] text-brand-700/70',
    statValue: 'text-2xl font-black tracking-tight text-ink-950 md:text-3xl',
    statValueCompact: 'text-lg font-black tracking-tight text-ink-950 md:text-xl',
    sectionCard: `${cardSurface} space-y-4 p-4 sm:p-5`,
    sectionCardTight: `${cardSurface} space-y-3 p-4`,
    cardHeading: 'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
    cardTitleWrap: 'space-y-1',
    cardTitle: 'text-xl font-black tracking-tight text-ink-950',
    dashboardGrid: 'grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]',
    twoColumnGrid: 'grid gap-4 xl:grid-cols-2',
    settingsGrid: 'grid gap-3 md:grid-cols-2',
    formGrid: 'grid gap-3 md:grid-cols-2',
    stackList: 'grid gap-2.5',
    filtersRow: 'flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center',
    inlineActions: 'flex flex-wrap items-center gap-2',
    mediaActions: 'flex flex-wrap items-center gap-2',
    inlineCaption: 'text-sm leading-5 text-ink-700/85',
    field: 'grid gap-1.5',
    fieldWide: 'grid gap-1.5 md:col-span-2',
    fieldFull: 'grid gap-1.5 md:col-span-full',
    fieldLabel: 'text-[0.82rem] font-bold text-ink-900',
    fieldHint: 'text-xs leading-5 text-ink-700/80',
    input:
        'min-h-10 w-full rounded-[0.72rem] border border-sky-200/90 bg-white/95 px-3 py-2 text-[0.88rem] font-medium text-ink-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-500',
    textarea:
        'min-h-28 w-full rounded-[0.72rem] border border-sky-200/90 bg-white/95 px-3 py-2 text-[0.88rem] font-medium text-ink-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-slate-100/70 disabled:text-slate-500',
    checkboxLine: 'inline-flex items-center gap-2.5 rounded-[0.78rem] border border-sky-100 bg-white/75 px-3 py-2 text-[0.86rem] font-semibold text-ink-900',
    checkboxLineSpaced:
        'inline-flex items-center gap-2.5 rounded-[0.78rem] border border-sky-100 bg-white/75 px-3 py-2 text-[0.86rem] font-semibold text-ink-900 md:min-h-10',
    previewPill:
        'rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 text-sm text-ink-900 shadow-[0_10px_24px_rgba(18,58,132,0.08)]',
    previewPanel: `${cardSurface} flex min-h-48 items-center justify-center p-4`,
    previewBanner:
        'flex min-h-44 w-full items-center justify-center rounded-[1.4rem] border border-dashed border-sky-200 bg-sky-50/70 px-4 text-center text-sm font-semibold text-ink-700',
    pickerRow:
        'flex w-full items-center justify-between gap-4 rounded-[1.4rem] border border-sky-100 bg-white/80 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-[0_14px_28px_rgba(18,58,132,0.09)]',
    pickerRowActive:
        'border-brand-500/55 bg-brand-50/70 shadow-[0_16px_30px_rgba(37,86,180,0.12)]',
    tagCloud: 'flex flex-wrap gap-2',
    tagChip:
        'rounded-full border border-sky-200 bg-white/90 px-3 py-2 text-sm font-bold text-ink-800 transition hover:-translate-y-0.5 hover:border-brand-500/45',
    tagChipActive:
        'border-brand-500/55 bg-brand-500 text-white shadow-[0_10px_24px_rgba(37,86,180,0.2)]',
    mediaGrid: 'grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    mediaItem: `${cardSurface} overflow-hidden p-0`,
    mediaThumbWrap:
        'flex h-20 items-center justify-center overflow-hidden rounded-t-[0.55rem] bg-sky-100/70 sm:h-24',
    mediaThumbFallback:
        'flex h-full w-full items-center justify-center px-4 text-center text-sm font-bold text-ink-700',
    mediaBody: 'grid gap-1.5 p-2.5',
    mediaPickerGrid: 'grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    mediaPicker:
        `${cardSurface} grid gap-2 p-2 text-left transition hover:border-brand-500/40 hover:shadow-[0_10px_18px_rgba(18,58,132,0.08)]`,
    mediaPickerThumb: 'h-20 w-full rounded-[0.45rem] object-cover sm:h-24',
    emptyCard:
        `${cardSurface} flex min-h-32 flex-col items-center justify-center gap-2.5 px-4 py-6 text-center`,
    emptyTitle: 'text-lg font-black tracking-tight text-ink-950',
    emptyText: 'max-w-xl text-sm leading-6 text-ink-700/85',
    shortcutsGrid: 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3',
    shortcut:
        `${cardSurface} grid gap-2 p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:shadow-[0_18px_30px_rgba(18,58,132,0.1)]`,
    salesList: 'grid gap-3',
    salesListItem:
        'flex flex-col gap-3 rounded-[1.4rem] border border-sky-100 bg-white/85 px-4 py-4 shadow-[0_10px_24px_rgba(18,58,132,0.06)] md:flex-row md:items-center md:justify-between',
    salesListMeta: 'grid gap-1 text-sm text-ink-700/80 md:text-right',
    validationGrid: 'grid gap-3 sm:grid-cols-2 xl:grid-cols-4',
    validationPill:
        `${cardSurface} flex flex-col gap-1 p-4 text-center sm:text-left`,
    warningChip:
        'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-800',
    backupLayout: 'grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]',
    backupCard: `${cardSurface} space-y-4 p-6`,
    backupUploadGrid: 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]',
    backupRow:
        'flex flex-col gap-4 rounded-[1.4rem] border border-sky-100 bg-white/85 px-4 py-4 shadow-[0_10px_24px_rgba(18,58,132,0.06)] lg:flex-row lg:items-center lg:justify-between',
    backupMeta: 'grid gap-1 text-sm text-ink-700/85',
    pagination: 'flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-sky-100 bg-white/85 px-4 py-4 text-sm font-semibold text-ink-800',
    tableWrap:
        'overflow-x-auto rounded-[0.9rem] border border-sky-100 bg-white/90 shadow-[0_10px_22px_rgba(18,58,132,0.065)]',
    table: 'min-w-full border-separate border-spacing-0 text-left text-[0.84rem] text-ink-900',
    tableHeadCell:
        'border-b border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[0.68rem] font-black uppercase tracking-[0.12em] text-brand-700/80',
    tableCell: 'border-b border-sky-100/80 px-3 py-3 align-top',
    tableRowSelected: 'bg-brand-50/60',
    tableRowDirty: '!bg-amber-50/90',
    tableEmptyCell: 'px-4 py-8 text-center text-sm font-semibold text-ink-700/85',
    productThumb:
        'flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-sky-100 bg-sky-100/70 text-center text-[0.68rem] font-bold text-ink-700',
    stateChip:
        'inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-ink-800',
    stateChipTrash: 'border-rose-200 bg-rose-50 text-rose-700',
    inlineFeedback: 'text-xs font-bold uppercase tracking-[0.14em]',
    inlineFeedbackSuccess: 'text-emerald-700',
    inlineFeedbackError: 'text-rose-700',
    inlineFeedbackPending: 'text-amber-700',
    printPage: 'min-h-screen bg-slate-100 px-4 py-6 text-slate-900 print:bg-white print:p-0',
    printToolbar:
        'mx-auto flex w-full max-w-6xl flex-col gap-3 rounded-[1.4rem] border border-slate-200 bg-white px-5 py-4 shadow-sm md:flex-row md:items-center md:justify-between print:hidden',
    printSheet: 'mx-auto mt-6 w-full max-w-6xl rounded-[1.6rem] bg-white p-8 shadow-sm print:mt-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none',
    printSheetHeader: 'mb-8 border-b border-slate-200 pb-5',
    printGrid: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3',
    printCard: 'overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white',
    printCardThumb: 'flex aspect-square items-center justify-center overflow-hidden bg-slate-100',
    printCardBody: 'grid gap-1 p-4',
};

export function pickerRowClass(active: boolean): string {
    return cn(ui.pickerRow, active && ui.pickerRowActive);
}

export function tagChipClass(active: boolean): string {
    return cn(ui.tagChip, active && ui.tagChipActive);
}

export function stateChipClass(variant?: 'default' | 'trash'): string {
    return cn(ui.stateChip, variant === 'trash' && ui.stateChipTrash);
}

export function inlineFeedbackClass(status: 'idle' | 'dirty' | 'saving' | 'success' | 'error'): string {
    return cn(
        ui.inlineFeedback,
        status === 'success' && ui.inlineFeedbackSuccess,
        status === 'error' && ui.inlineFeedbackError,
        (status === 'idle' || status === 'dirty' || status === 'saving') && ui.inlineFeedbackPending,
    );
}

export function buttonClass(
    variant: keyof typeof buttonVariant,
    size: keyof typeof buttonSize = 'default',
    extra?: string | false | null | undefined,
): string {
    return cn(buttonBase, buttonSize[size], buttonVariant[variant], extra);
}

export const surfaceClass = cardSurface;
export const storeBackLinkClass =
    'inline-flex w-fit items-center gap-[0.38rem] self-start rounded-full border border-[rgba(173,205,244,0.8)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(238,246,255,0.95)_100%)] px-[0.72rem] py-[0.4rem] text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#1e4a88] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_18px_rgba(11,41,95,0.12)] hover:brightness-[1.02]';
export const productMainImageClass =
    'h-[290px] w-full max-w-[620px] rounded-[1.4rem] border-[3px] border-[var(--product-tone-border)] bg-white object-contain shadow-[0_0_16px_color-mix(in_srgb,var(--product-tone-glow)_60%,transparent)] max-[860px]:h-[260px] max-[860px]:max-w-full max-[560px]:h-[220px]';
export const productMainImageShellClass =
    'relative flex min-h-[310px] w-full items-center justify-center px-8 max-[860px]:min-h-[276px] max-[560px]:min-h-[236px] max-[560px]:px-6';
const productMainImageNavBase =
    'absolute top-1/2 z-[2] inline-flex h-14 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[rgba(175,203,240,0.9)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(233,243,255,0.96)_100%)] text-[#214b98] shadow-[0_12px_20px_rgba(17,45,101,0.14),inset_0_1px_0_rgba(255,255,255,0.94)] transition-[transform,filter,box-shadow] duration-150 hover:scale-[1.02] hover:brightness-[1.03]';
export const productMainImageNavIconClass =
    'h-4 w-4 fill-none stroke-current stroke-[2.4] [stroke-linecap:round] [stroke-linejoin:round]';
export const productThumbRowClass =
    'grid w-full grid-cols-[repeat(auto-fit,minmax(64px,78px))] justify-center gap-2 max-[560px]:grid-cols-[repeat(auto-fit,minmax(56px,68px))] max-[560px]:gap-[0.38rem]';
const productThumbBase =
    'rounded-2xl border-2 border-[#d8e7ff] bg-white p-[0.35rem]';
const productThumbActive =
    'border-[var(--product-tone-border)] shadow-[0_0_12px_color-mix(in_srgb,var(--product-tone-glow)_60%,transparent)]';
export const productThumbImageClass =
    'h-14 w-full object-contain max-[560px]:h-12';
export const productInfoCardClass =
    'grid content-start justify-items-start gap-3 border-0 bg-transparent p-4 shadow-none';
export const productDetailCategoryClass =
    'm-0 w-full text-center text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700 max-[560px]:text-[0.64rem] max-[560px]:tracking-[0.035em]';
export const productTitleClass =
    'm-0 w-full text-center text-[1.55rem] font-bold leading-[1.22] text-[#1f365d] max-[560px]:text-[1.2rem] max-[560px]:leading-[1.2]';
export const productDetailBadgesClass =
    'flex min-h-0 w-full flex-wrap items-start gap-2 px-[0.8rem] pt-[0.2rem] max-[560px]:items-stretch max-[560px]:gap-[0.4rem]';
export const productFeaturedFlagClass =
    'inline-flex min-h-8 items-center justify-center rounded-[1rem_1rem_1rem_0.35rem] bg-[linear-gradient(180deg,#f4d772_0%,#dbb34f_100%)] py-[0.4rem] pr-4 pl-[0.88rem] text-[0.78rem] font-black uppercase tracking-[0.08em] text-[#6d4b05] shadow-[0_10px_18px_rgba(144,109,17,0.18),inset_0_1px_0_rgba(255,255,255,0.46)] max-[560px]:w-full';
export const productDetailNewChipClass =
    'inline-flex min-h-[1.5rem] w-fit items-center justify-center rounded-[0.45rem] bg-[linear-gradient(180deg,#7af1e2_0%,#1bb8a5_100%)] px-[0.72rem] py-[0.18rem] text-[0.78rem] font-black uppercase tracking-[0.03em] text-[#053b37] shadow-[0_8px_16px_rgba(7,104,92,0.14),inset_0_1px_0_rgba(255,255,255,0.34)] max-[560px]:w-full';
export const productDetailImageNewChipClass =
    'absolute top-4 right-4 z-[3] inline-flex min-h-[1.5rem] w-fit items-center justify-center rounded-[0.45rem] bg-[linear-gradient(180deg,#7af1e2_0%,#1bb8a5_100%)] px-[0.72rem] py-[0.18rem] text-[0.78rem] font-black uppercase tracking-[0.03em] text-[#053b37] shadow-[0_8px_16px_rgba(7,104,92,0.14),inset_0_1px_0_rgba(255,255,255,0.34)] max-[560px]:top-3 max-[560px]:right-3 max-[560px]:text-[0.68rem]';
export const productDescriptionClass =
    'grid w-full gap-3 rounded-[1.05rem] border-2 border-[var(--product-tone-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-[0.85rem_1rem] text-left leading-[1.7] text-[#294a78] shadow-[0_0_14px_color-mix(in_srgb,var(--product-tone-glow)_32%,transparent),inset_0_1px_0_rgba(255,255,255,0.9)] max-[560px]:rounded-[0.9rem] max-[560px]:p-[0.72rem] max-[560px]:text-[0.92rem]';
export const productDescriptionHeaderClass =
    'border-b border-[color-mix(in_srgb,var(--product-tone-border)_42%,transparent)] pb-2 text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700 max-[560px]:text-[0.64rem] max-[560px]:tracking-[0.035em]';
export const productDescriptionBodyClass =
    'grid gap-3 [&_p]:my-0 [&_strong]:font-black [&_ul]:my-0 [&_ul]:pl-5';
export const productMoreButtonClass =
    'w-fit rounded-full border-0 bg-[linear-gradient(180deg,#e9f8ff_0%,#c7ecff_100%)] px-[0.8rem] py-[0.45rem] font-extrabold text-[#184f7e] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:brightness-[1.03]';

export function productMainImageNavClass(direction: 'left' | 'right'): string {
    return cn(productMainImageNavBase, direction === 'left' ? 'left-0' : 'right-0');
}

export function productThumbClass(active: boolean): string {
    return cn(productThumbBase, active && productThumbActive);
}

const interactiveLift =
    'transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:brightness-[1.03]';

export const site = {
    shell:
        'min-h-screen px-0 pt-0 pb-[1.8rem] text-[#102146] bg-[radial-gradient(circle_at_top_right,rgba(87,182,255,0.28),transparent_24%),radial-gradient(circle_at_top_left,rgba(36,86,184,0.2),transparent_20%),linear-gradient(180deg,#edf4ff_0%,#d9e7ff_26%,#d6e4ff_100%)] max-[860px]:pt-0',
    frame: 'mx-auto w-[min(1880px,calc(100vw-18px))] max-[860px]:w-full max-[860px]:px-[0.18rem]',
    header:
        'sticky top-0 z-40 overflow-hidden rounded-none border-x border-b border-t-0 border-[rgba(178,214,255,0.46)] bg-[radial-gradient(circle_at_84%_10%,rgba(124,211,255,0.12),transparent_20%),linear-gradient(180deg,rgba(42,87,169,0.98)_0%,rgba(34,69,143,0.98)_100%)] p-[0.24rem_0.72rem_0.3rem] shadow-[0_14px_28px_rgba(8,25,70,0.20),0_3px_10px_rgba(90,173,255,0.10),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[10px] after:pointer-events-none after:absolute after:right-[-12%] after:bottom-[-70%] after:h-[28rem] after:w-[28rem] after:rounded-full after:bg-[radial-gradient(circle,rgba(92,196,255,0.12)_0%,rgba(92,196,255,0)_68%)] after:content-[\"\"] max-[860px]:relative max-[860px]:top-auto max-[860px]:z-auto max-[860px]:overflow-visible max-[860px]:rounded-none max-[860px]:border-t max-[860px]:p-[0.2rem_0.3rem] max-[860px]:backdrop-blur-none max-[860px]:after:hidden',
    headerInner:
        'relative z-[1] mx-auto w-full max-w-[1160px] max-[860px]:max-w-none',
    brandRow:
        'grid grid-cols-[minmax(220px,280px)_minmax(380px,620px)_auto] grid-rows-1 items-center justify-center gap-x-[0.95rem] gap-y-0 max-[1320px]:grid-cols-[minmax(190px,238px)_minmax(360px,1fr)_auto] max-[1080px]:grid-cols-[minmax(180px,218px)_minmax(280px,1fr)_auto] max-[860px]:grid-cols-[minmax(0,1fr)_auto] max-[860px]:grid-rows-none max-[860px]:gap-x-[0.22rem] max-[860px]:gap-y-[0.18rem]',
    mobileBrandTop:
        'contents max-[860px]:col-span-full max-[860px]:grid max-[860px]:grid-cols-[2.05rem_minmax(0,1fr)_2.05rem] max-[860px]:items-center max-[860px]:gap-[0.24rem]',
    logoLink: 'col-start-1 row-start-1 grid h-full items-center justify-items-center gap-[0.35rem] self-center max-[860px]:row-span-1 max-[860px]:col-start-2 max-[860px]:h-auto max-[860px]:w-full max-[860px]:translate-y-0 max-[860px]:justify-items-center',
    logo: 'w-full max-w-[268px] translate-x-[-8px] object-contain drop-shadow-[0_10px_18px_rgba(4,17,43,0.30)] max-[1320px]:max-w-[238px] max-[1080px]:max-w-[218px] max-[860px]:max-w-[178px] max-[860px]:translate-x-0 max-[560px]:max-w-[164px]',
    headerCenter:
        'col-start-2 row-start-1 grid min-w-0 justify-items-start gap-0 max-[860px]:hidden',
    mobileSearchDock:
        'hidden max-[860px]:sticky max-[860px]:top-0 max-[860px]:z-50 max-[860px]:mt-0 max-[860px]:block max-[860px]:w-full max-[860px]:[position:-webkit-sticky]',
    mobileSearchDockInner:
        'grid grid-cols-[minmax(0,1fr)_2.46rem] items-center gap-[0.22rem] rounded-none border border-[rgba(162,203,255,0.64)] bg-[linear-gradient(180deg,#2f5ead_0%,#22458f_100%)] p-[0.22rem] shadow-[0_8px_18px_rgba(16,48,108,0.16),inset_0_1px_0_rgba(255,255,255,0.12)]',
    searchPanel: 'grid min-w-0 gap-[0.42rem] max-[860px]:w-full max-[860px]:justify-items-center',
    searchPanelHeader: 'w-full max-w-[620px] justify-self-stretch max-[860px]:min-w-0 max-[860px]:max-w-none',
    desktopStoreInfo:
        'col-start-3 row-start-1 flex min-w-0 w-auto items-center justify-end gap-[0.46rem] justify-self-end text-[#e8f5ff] max-[860px]:hidden',
    desktopStoreInfoWhatsapp:
        `${interactiveLift} inline-flex min-h-[2.55rem] items-center justify-center gap-[0.38rem] whitespace-nowrap rounded-[0.78rem] border border-[rgba(166,255,205,0.62)] bg-[linear-gradient(180deg,#24d366_0%,#12a84d_100%)] px-[0.78rem] text-[0.78rem] font-black uppercase tracking-[0.025em] text-white shadow-[0_8px_16px_rgba(5,120,62,0.22),inset_0_1px_0_rgba(255,255,255,0.25)] max-[1320px]:hidden`,
    desktopStoreInfoWhatsappIcon:
        'inline-flex h-[0.98rem] w-[0.98rem] flex-none items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-current',
    desktopStoreInfoWhatsappText: 'leading-none',
    searchStrip: 'mt-[0.55rem] hidden',
    searchPanelStandalone:
        'rounded-[1.3rem] border border-[rgba(133,174,244,0.55)] bg-[radial-gradient(circle_at_18%_12%,rgba(96,165,250,0.18),transparent_50%),linear-gradient(180deg,#0d3f90_0%,#1c5dbe_100%)] p-[0.85rem_0.95rem] shadow-[0_12px_24px_rgba(8,37,95,0.2)] max-[860px]:w-full max-[860px]:rounded-[1rem] max-[860px]:p-[0.24rem] max-[560px]:w-full',
    searchLabel:
        'text-[0.82rem] font-black uppercase tracking-[0.09em] text-[#ddecff] max-[860px]:w-[min(100%,27rem)] max-[860px]:text-left max-[560px]:w-full',
    searchRow:
        'grid grid-cols-[minmax(0,1fr)_2.12rem] gap-[0.24rem] rounded-[0.72rem] border border-[rgba(129,175,241,0.58)] bg-[#254160] p-[0.14rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_7px_14px_rgba(5,28,74,0.14)] max-[860px]:w-full max-[860px]:grid-cols-[minmax(0,1fr)_2.58rem] max-[860px]:items-center max-[860px]:gap-[0.28rem] max-[860px]:rounded-[0.74rem] max-[860px]:border max-[860px]:border-[rgba(129,175,241,0.58)] max-[860px]:p-[0.2rem] max-[860px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_18px_rgba(5,28,74,0.18)]',
    searchInput:
        'min-h-[2.05rem] rounded-[0.58rem] border border-[rgba(149,180,230,0.65)] bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] p-[0.42rem_0.72rem] text-[0.84rem] text-[#1d417d] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] placeholder:text-[#6f87af] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[rgba(107,185,255,0.34)] max-[860px]:min-h-[2.28rem] max-[860px]:rounded-[0.64rem] max-[860px]:p-[0.46rem_0.66rem] max-[860px]:text-[0.88rem]',
    searchButton:
        `${interactiveLift} rounded-[0.62rem] border border-[rgba(159,210,255,0.88)] bg-[linear-gradient(180deg,#4d90f2_0%,#2e63c8_100%)] font-black uppercase tracking-[0.03em] text-white shadow-[0_7px_14px_rgba(13,56,128,0.18),inset_0_1px_0_rgba(255,255,255,0.26)] max-[860px]:relative max-[860px]:min-h-[2.28rem] max-[860px]:min-w-[2.36rem] max-[860px]:rounded-[0.64rem] max-[860px]:border-[rgba(188,226,255,0.95)] max-[860px]:p-0 max-[860px]:text-[0px] max-[860px]:before:hidden`,
    searchButtonIcon:
        'inline-flex h-4 w-4 flex-none items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    mobileCart:
        'relative hidden min-h-[2.55rem] min-w-[2.7rem] items-center justify-center rounded-[0.88rem] border border-[rgba(159,210,255,0.88)] bg-[linear-gradient(180deg,#49bee1_0%,#1d8fc2_100%)] text-white shadow-[0_8px_18px_rgba(13,56,128,0.18),inset_0_1px_0_rgba(255,255,255,0.24)] max-[860px]:inline-flex',
    mobileCartIcon: 'inline-flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    mobileCartBadge:
        'absolute top-[-0.18rem] right-[-0.18rem] inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f43f5e] px-[0.15rem] text-[0.64rem] font-black text-white shadow-[0_4px_10px_rgba(244,63,94,0.28)]',
    mobileMenuIcon:
        'inline-flex h-[1.15rem] w-[1.15rem] items-center justify-center [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_img]:brightness-0 [&_img]:invert [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.4] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    mobileHeaderCart:
        `${interactiveLift} relative hidden h-[2.46rem] min-h-[2.46rem] w-[2.46rem] min-w-[2.46rem] items-center justify-center rounded-[0.64rem] border border-[rgba(157,234,255,0.8)] bg-[linear-gradient(180deg,#35bcd7_0%,#1388bb_100%)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] max-[860px]:inline-flex`,
    mobileMenuOverlay:
        'fixed inset-0 z-50 hidden items-end bg-[rgba(5,18,48,0.42)] p-[0.55rem] max-[860px]:flex max-[380px]:p-[0.34rem]',
    mobileMenuSheet:
        'grid w-full min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-[0.5rem] rounded-[1.05rem] border border-[rgba(155,201,255,0.44)] bg-[linear-gradient(180deg,#f7fbff_0%,#e6f0ff_100%)] p-[0.75rem] text-[#102146] shadow-[0_24px_52px_rgba(3,12,34,0.35)] max-[380px]:gap-[0.34rem] max-[380px]:rounded-[0.9rem] max-[380px]:p-[0.5rem]',
    mobileMenuTitle:
        'col-span-full px-1 text-[0.78rem] font-black uppercase tracking-[0.08em] text-[#17427f]',
    desktopNavRow:
        'mx-auto flex min-h-[2.45rem] w-full max-w-full flex-nowrap items-center justify-center overflow-hidden rounded-none border-x border-b border-[rgba(178,214,255,0.46)] border-t-0 bg-[radial-gradient(circle_at_84%_10%,rgba(124,211,255,0.12),transparent_20%),linear-gradient(180deg,rgba(42,87,169,0.98)_0%,rgba(34,69,143,0.98)_100%)] p-[0.24rem] shadow-[0_8px_16px_rgba(33,74,154,0.09),inset_0_1px_0_rgba(255,255,255,0.08)] max-[1080px]:flex-wrap max-[860px]:hidden',
    desktopNavShell:
        'mt-0 max-[860px]:hidden',
    main: 'mt-0 grid gap-0',
};

const navPillBase =
    `${interactiveLift} inline-flex min-h-[1.9rem] min-w-0 items-center justify-center gap-[0.36rem] overflow-hidden rounded-none border-0 border-r border-[rgba(190,221,255,0.18)] bg-transparent px-[0.94rem] py-[0.3rem] text-center text-[0.88rem] font-black uppercase tracking-[0.035em] text-[#edf7ff] shadow-none first:rounded-l-[0.64rem] last:rounded-r-[0.64rem] last:border-r-0 hover:bg-white/10 hover:text-white max-[1080px]:min-h-[1.72rem] max-[1080px]:px-[0.72rem] max-[1080px]:py-[0.24rem] max-[1080px]:text-[0.78rem] max-[1080px]:tracking-[0.025em] max-[860px]:min-h-[2.2rem] max-[860px]:w-full max-[860px]:gap-[0.32rem] max-[860px]:rounded-[0.74rem] max-[860px]:border max-[860px]:border-[rgba(159,210,255,0.38)] max-[860px]:bg-[linear-gradient(180deg,rgba(38,93,190,0.98)_0%,rgba(24,64,144,0.98)_100%)] max-[860px]:px-[0.5rem] max-[860px]:py-[0.52rem] max-[860px]:text-[0.68rem] max-[860px]:leading-none max-[860px]:tracking-[0.02em] max-[860px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] max-[560px]:text-[0.66rem] max-[380px]:min-h-[2rem] max-[380px]:px-[0.34rem] max-[380px]:text-[0.6rem] [&]:truncate`;

export function siteMobileToggleClass(open: boolean): string {
    return cn(
        'hidden min-h-10 w-[min(100%,27rem)] items-center justify-center rounded-[0.95rem] border border-[rgba(185,229,255,0.72)] bg-[linear-gradient(180deg,rgba(242,250,255,0.96)_0%,rgba(221,238,255,0.94)_100%)] text-[0.78rem] font-black uppercase tracking-[0.08em] text-[#18437f] shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_8px_16px_rgba(9,38,90,0.14)] max-[860px]:col-start-3 max-[860px]:inline-flex max-[860px]:h-[2.2rem] max-[860px]:min-h-[2.2rem] max-[860px]:w-[2.2rem] max-[860px]:rounded-[0.68rem] max-[860px]:p-0',
        open && 'border-[rgba(211,236,255,0.94)] bg-[linear-gradient(180deg,#85d7ff_0%,#4da8ef_100%)] text-[#083b6c]',
    );
}

export function siteNavRowClass(open: boolean): string {
    return cn(
        'hidden max-[860px]:order-5 max-[860px]:col-span-full max-[860px]:w-full max-[860px]:grid-cols-2 max-[860px]:gap-[0.4rem] max-[860px]:border-t max-[860px]:border-[rgba(185,213,255,0.20)] max-[860px]:pt-[0.28rem]',
        open ? 'max-[860px]:grid' : 'max-[860px]:hidden',
    );
}

export function siteNavPillClass(active = false, mobileOnly = false, variant: 'default' | 'repair' = 'default'): string {
    return cn(
        navPillBase,
        variant === 'repair' && 'border-l border-[rgba(166,239,255,0.46)] bg-[linear-gradient(180deg,rgba(35,188,215,0.96)_0%,rgba(18,128,190,0.96)_100%)] text-white shadow-[0_8px_18px_rgba(20,128,190,0.24),inset_0_1px_0_rgba(255,255,255,0.22)] hover:bg-[linear-gradient(180deg,rgba(70,211,238,0.98)_0%,rgba(28,145,209,0.98)_100%)] hover:shadow-[0_10px_22px_rgba(20,128,190,0.30),0_0_0_2px_rgba(184,236,255,0.25),inset_0_1px_0_rgba(255,255,255,0.26)] max-[860px]:border-[rgba(134,239,172,0.78)] max-[860px]:bg-[linear-gradient(180deg,#34d399_0%,#059669_58%,#047857_100%)] max-[860px]:shadow-[0_8px_18px_rgba(4,120,87,0.24),inset_0_1px_0_rgba(255,255,255,0.22)]',
        active && 'bg-[rgba(225,243,255,0.92)] text-[#073669] shadow-[inset_0_0_0_1px_rgba(196,234,255,0.72)] max-[860px]:border-[rgba(196,234,255,0.95)] max-[860px]:bg-[linear-gradient(180deg,#85d7ff_0%,#4da8ef_100%)] max-[860px]:shadow-[0_10px_22px_rgba(8,48,121,0.22)]',
        mobileOnly && 'min-[861px]:hidden',
    );
}

export const siteActionsClass =
    'col-start-5 row-start-1 mr-[1.1rem] grid items-center justify-items-end gap-[0.35rem] justify-self-end self-center max-[1700px]:col-start-4 max-[1700px]:row-start-1 max-[1700px]:ml-0 max-[860px]:sticky max-[860px]:top-[0.35rem] max-[860px]:z-50 max-[860px]:mr-0 max-[860px]:grid max-[860px]:w-auto max-[860px]:grid-cols-1 max-[860px]:justify-items-center max-[860px]:rounded-[0.82rem] max-[860px]:border max-[860px]:border-[rgba(162,203,255,0.64)] max-[860px]:bg-[linear-gradient(180deg,#2f5ead_0%,#22458f_100%)] max-[860px]:p-[0.22rem] max-[860px]:shadow-[0_10px_20px_rgba(16,48,108,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] max-[860px]:hidden';
const siteActionBase =
    'relative inline-flex min-h-[2.55rem] min-w-[2.55rem] items-center justify-center rounded-[0.78rem] px-0 py-0 text-[0.82rem] font-black uppercase tracking-[0.05em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] max-[560px]:text-[0.76rem]';
export const siteCartLinkClass =
    `${interactiveLift} ${siteActionBase} border border-[rgba(157,234,255,0.8)] bg-[linear-gradient(180deg,#35bcd7_0%,#1388bb_100%)] max-[860px]:h-[2.2rem] max-[860px]:min-h-[2.2rem] max-[860px]:w-[2.2rem] max-[860px]:min-w-[2.2rem] max-[860px]:rounded-[0.68rem]`;
export const siteRepairLinkClass =
    `${interactiveLift} ${siteActionBase} border border-[rgba(186,226,255,0.88)] bg-[linear-gradient(180deg,#61bcff_0%,#2d8ce7_100%)]`;
export const siteCartIconClass = 'inline-flex h-5 w-5 items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]';
export const siteCartBadgeClass =
    'absolute top-[0.12rem] right-[0.12rem] inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f43f5e] px-[0.2rem] text-[0.72rem] font-black text-white shadow-[0_6px_12px_rgba(244,63,94,0.32)]';

export const siteAnnouncement = {
    shell:
        'mt-[0.24rem] grid min-h-0 grid-cols-[20px_minmax(0,1fr)_20px] items-center gap-[0.14rem] rounded-[0.72rem] border border-[rgba(121,185,255,0.5)] bg-[radial-gradient(circle_at_50%_44%,rgba(8,20,49,0.42)_0%,rgba(8,20,49,0)_42%),linear-gradient(90deg,#4872cf_0%,#2d5baa_18%,#16356a_50%,#24529f_80%,#37a6d7_100%)] p-[0.12rem] shadow-[0_6px_12px_rgba(15,45,103,0.14),inset_0_1px_0_rgba(255,255,255,0.12)] max-[860px]:mt-[0.18rem] max-[860px]:grid-cols-1 max-[860px]:items-center max-[860px]:justify-items-center max-[860px]:rounded-none max-[860px]:p-[0.1rem_0.14rem] max-[860px]:shadow-[0_4px_8px_rgba(15,45,103,0.10)]',
    shellCatalog:
        'mt-0 grid grid-cols-[34px_minmax(0,1fr)_34px] items-center gap-[0.18rem] overflow-hidden rounded-none border-y border-[rgba(119,183,255,0.34)] border-x-0 bg-[linear-gradient(90deg,#345fba_0%,#1f4f98_20%,#173d78_50%,#1c5d9f_82%,#2198c8_100%)] p-[0.04rem_0.22rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(5,18,48,0.14)] max-[860px]:mt-0 max-[860px]:grid-cols-[34px_minmax(0,1fr)_34px] max-[860px]:justify-items-stretch max-[860px]:gap-[0.08rem] max-[860px]:rounded-none max-[860px]:border max-[860px]:border-[rgba(119,183,255,0.30)] max-[860px]:p-[0.08rem_0.08rem] max-[860px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] max-[560px]:gap-[0.06rem] max-[560px]:p-[0.07rem_0.06rem]',
    arrow:
        `${interactiveLift} inline-flex min-h-[1.2rem] w-full cursor-pointer items-center justify-center rounded-[0.36rem] border-0 bg-white/12 text-[0.72rem] font-bold text-white/95 disabled:cursor-not-allowed disabled:opacity-35 disabled:transform-none disabled:brightness-100 max-[860px]:hidden`,
    arrowCatalog:
        `${interactiveLift} inline-flex min-h-[32px] w-[32px] min-w-[32px] items-center justify-center rounded-full border border-[rgba(178,224,255,0.46)] bg-[rgba(225,244,255,0.16)] text-[1rem] font-black leading-none text-[#eaf7ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_5px_12px_rgba(4,18,55,0.16)] backdrop-blur-[6px] hover:border-[rgba(191,235,255,0.74)] hover:bg-[rgba(231,247,255,0.26)] hover:text-white hover:shadow-[0_7px_16px_rgba(30,129,220,0.16),0_0_0_2px_rgba(116,207,255,0.12),inset_0_1px_0_rgba(255,255,255,0.22)] disabled:cursor-not-allowed disabled:opacity-35 disabled:transform-none disabled:brightness-100 disabled:shadow-none max-[860px]:min-h-[32px] max-[860px]:w-[32px] max-[860px]:min-w-[32px] max-[860px]:border-[rgba(183,225,255,0.36)] max-[860px]:bg-[rgba(228,246,255,0.18)] max-[860px]:text-[0.94rem] max-[860px]:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_8px_rgba(5,24,62,0.12)] max-[560px]:min-h-[32px] max-[560px]:w-[32px] max-[560px]:min-w-[32px] max-[560px]:text-[0.86rem]`,
    card:
        'flex h-40 min-h-40 overflow-hidden rounded-[0.52rem] bg-[linear-gradient(90deg,rgba(14,42,92,0.76)_0%,rgba(14,42,92,0.18)_18%,rgba(14,42,92,0.18)_82%,rgba(14,42,92,0.76)_100%),linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] max-[860px]:m-0 max-[860px]:w-full max-[560px]:min-h-[2.45rem] max-[560px]:rounded-[0.52rem]',
    copy: 'grid content-center gap-[0.04rem] p-[0.22rem_0.5rem] text-[0.64rem] font-black leading-[1.08] text-white max-[560px]:gap-[0.1rem] max-[560px]:p-[0.34rem_0.56rem] max-[560px]:text-[0.72rem] max-[560px]:leading-[1.15]',
    kicker: 'text-[0.78rem] font-black uppercase tracking-[0.07em] max-[560px]:text-[0.52rem] max-[560px]:tracking-[0.05em]',
    track:
        'relative mx-auto flex min-h-[clamp(27px,2.9vw,41px)] w-full max-w-none items-center overflow-hidden rounded-[0.64rem] bg-transparent shadow-none max-[860px]:min-h-[clamp(60px,17vw,83px)] max-[860px]:rounded-none max-[560px]:min-h-[clamp(44px,13vw,57px)]',
};

export function siteAnnouncementItemClass(active: boolean, image: boolean, catalogLegacy: boolean): string {
    if (!catalogLegacy) {
        return siteAnnouncement.card;
    }

    return cn(
        'relative z-[1] hidden min-h-[inherit] w-full items-center justify-center px-[0.65rem] text-[#f3f8ff] no-underline max-[860px]:px-[0.35rem]',
        image && 'px-[0.45rem] max-[860px]:px-[0.2rem]',
        active && 'inline-flex',
    );
}

export const siteAnnouncementImageShellClass =
    'relative isolate w-full aspect-[6.6/1] overflow-hidden rounded-[0.66rem] shadow-[0_0_0_1px_rgba(202,236,255,0.20),0_10px_24px_rgba(10,28,72,0.18)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(90deg,rgba(10,26,65,0.18)_0%,rgba(10,26,65,0)_18%,rgba(10,26,65,0)_82%,rgba(10,26,65,0.18)_100%)] after:content-[\"\"] max-[860px]:aspect-[4.1/1] max-[860px]:rounded-[0.58rem] max-[860px]:shadow-[0_0_0_1px_rgba(202,236,255,0.16),0_7px_16px_rgba(10,28,72,0.14)] max-[560px]:aspect-[5.1/1] max-[560px]:rounded-[0.5rem]';
export const siteAnnouncementImageClass =
    'mx-auto h-full w-auto max-w-full rounded-[inherit] object-contain saturate-[1.04] contrast-[1.02] [mask-image:linear-gradient(90deg,transparent_0%,#000_5%,#000_95%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_5%,#000_95%,transparent_100%)] max-[560px]:bg-[linear-gradient(90deg,rgba(9,24,58,0.96)_0%,rgba(12,30,70,0.94)_50%,rgba(9,24,58,0.96)_100%)] max-[560px]:[mask-image:linear-gradient(90deg,transparent_0%,#000_4%,#000_96%,transparent_100%)] max-[560px]:[-webkit-mask-image:linear-gradient(90deg,transparent_0%,#000_4%,#000_96%,transparent_100%)]';
export const siteAnnouncementPlainImageClass = 'h-full w-full object-fill';
export const siteAnnouncementTextClass =
    'relative z-[1] min-h-[34px] px-2.5 text-center text-[clamp(0.8rem,0.46vw+0.72rem,0.92rem)] font-extrabold leading-[1.2] text-[#f3f8ff] underline decoration-current underline-offset-2 shadow-none [text-shadow:0_0_12px_rgba(130,205,255,0.14)] max-[860px]:min-h-[30px] max-[860px]:px-2 max-[860px]:text-[0.78rem] max-[560px]:min-h-7 max-[560px]:px-1.5 max-[560px]:text-[0.72rem] max-[560px]:leading-[1.15]';

export const footer = {
    root:
        'relative mt-4 overflow-hidden rounded-[1.5rem] border border-[rgba(127,172,235,0.28)] bg-[radial-gradient(circle_at_12%_28%,rgba(126,194,255,0.16)_0%,rgba(126,194,255,0)_24%),radial-gradient(circle_at_88%_78%,rgba(89,162,255,0.12)_0%,rgba(89,162,255,0)_28%),linear-gradient(135deg,#17376f_0%,#12305f_42%,#10274e_100%)] p-[1rem_1.05rem] text-[#edf6ff] shadow-[0_20px_42px_rgba(12,34,79,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] max-[860px]:rounded-[1.05rem] max-[860px]:p-[0.85rem]',
    grid: 'grid grid-cols-2 items-stretch gap-4 max-[980px]:grid-cols-1',
    panel:
        'grid min-w-0 gap-[0.8rem] rounded-[1.18rem] border border-[rgba(162,198,247,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.04)_100%)] p-[1rem_1.1rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_20px_rgba(8,24,61,0.14)] max-[860px]:gap-[0.72rem] max-[860px]:p-[0.88rem_0.92rem]',
    panelInfo: 'content-center',
    heading: 'grid content-start gap-[0.34rem]',
    kicker: 'text-[0.78rem] font-black uppercase tracking-[0.07em]',
    title: 'm-0 text-[1.02rem] font-bold leading-[1.28] text-[#f5f9ff] max-[860px]:text-[0.96rem]',
    facts: 'grid content-start gap-[0.65rem]',
    detail: 'm-0 flex items-start gap-[0.6rem] text-[0.98rem] leading-[1.4] text-[rgba(237,246,255,0.94)] max-[860px]:text-[0.92rem]',
    detailIcon: 'mt-[0.1rem] inline-flex h-[1.15rem] w-[1.15rem] flex-none items-center justify-center text-[#8bd7ff] [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    actions: 'flex flex-wrap items-center gap-[0.55rem]',
    actionLabel: 'text-[0.78rem] font-black uppercase tracking-[0.07em]',
    whatsapp:
        'inline-flex min-h-[2.1rem] w-fit items-center justify-start gap-[0.42rem] rounded-full border border-[rgba(114,227,163,0.42)] bg-[linear-gradient(180deg,rgba(33,126,73,0.42)_0%,rgba(20,102,56,0.38)_100%)] p-[0.34rem_0.72rem_0.34rem_0.58rem] text-[#e9fff2] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_18px_rgba(4,35,18,0.18)]',
    whatsappText: 'text-[0.82rem] font-bold leading-none',
    whatsappIcon: 'inline-flex h-4 w-4 flex-none items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-current',
    mapShell: 'min-w-0 overflow-hidden rounded-2xl border border-[rgba(170,210,255,0.24)] bg-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_24px_rgba(9,26,61,0.18)]',
    map: 'block h-[176px] w-full border-0 max-[980px]:h-[156px] max-[860px]:h-[146px]',
};

export const catalog = {
    layout: 'grid grid-cols-1 gap-0',
    layoutMain: 'grid grid-cols-1 gap-0',
    mobileControls: 'grid gap-0 min-[861px]:hidden',
    mobileControlsBar:
        'grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[0.32rem] rounded-none border border-[rgba(178,214,255,0.46)] bg-[linear-gradient(180deg,rgba(42,87,169,0.98)_0%,rgba(34,69,143,0.98)_100%)] p-[0.3rem] text-[#f3f8ff] shadow-[0_8px_16px_rgba(33,74,154,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] max-[860px]:gap-[0.22rem] max-[860px]:rounded-none max-[860px]:p-[0.2rem]',
    mobileControlsFilters: 'min-w-0 [&_.catalog-mobile-unused]:hidden',
    mobileControlsCount:
        'inline-flex min-h-[34px] items-center rounded-[0.68rem] bg-[rgba(8,27,67,0.26)] px-3 text-[0.76rem] font-black uppercase tracking-[0.06em] text-[#eaf4ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    mobileControlsActions: 'flex items-end justify-end gap-[0.34rem]',
    mobileControlsButton:
        'inline-flex h-8 min-h-8 w-8 min-w-8 items-center justify-center rounded-[0.58rem] border border-[rgba(205,227,255,0.76)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97)_0%,rgba(237,245,255,0.95)_100%)] p-0 text-[#17427f] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_5px_12px_rgba(7,32,88,0.10)]',
    mobileControlsIcon:
        'inline-flex h-4 w-4 flex-none items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    mobileSheetOverlay:
        'fixed inset-0 z-50 flex items-end bg-[rgba(5,18,48,0.42)] p-[0.55rem] backdrop-blur-[2px] min-[861px]:hidden',
    mobileSheet:
        'grid max-h-[82vh] w-full gap-[0.75rem] overflow-y-auto rounded-[1.05rem] border border-[rgba(155,201,255,0.44)] bg-[linear-gradient(180deg,#f7fbff_0%,#e6f0ff_100%)] p-[0.75rem] text-[#102146] shadow-[0_24px_52px_rgba(3,12,34,0.35)]',
    mobileSheetHeader: 'flex items-center justify-between gap-3',
    mobileSheetClose:
        'inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#c7dbf7] bg-white text-xl font-black leading-none text-[#17427f] shadow-[0_6px_14px_rgba(7,32,88,0.10)]',
    mobileSheetBody: 'grid gap-[0.7rem]',
    mobileSheetQuickActions: 'grid grid-cols-2 gap-[0.5rem]',
    mobileSheetFooter: 'grid grid-cols-[auto_minmax(0,1fr)] gap-[0.5rem]',
    mobileSheetSoftButton:
        'inline-flex min-h-10 items-center justify-center rounded-[0.75rem] border border-[#c7dbf7] bg-white px-3 text-[0.78rem] font-black uppercase tracking-[0.04em] text-[#17427f]',
    mobileSheetPrimaryButton:
        'inline-flex min-h-10 items-center justify-center rounded-[0.75rem] border border-[rgba(184,229,255,0.96)] bg-[linear-gradient(180deg,#57a9ef_0%,#2759b7_100%)] px-3 text-[0.78rem] font-black uppercase tracking-[0.04em] text-white shadow-[0_10px_18px_rgba(13,53,126,0.22)]',
    mobileSheetOptionButton: (active: boolean): string =>
        cn(
            'inline-flex min-h-10 items-center justify-center gap-[0.42rem] rounded-[0.75rem] border border-[#c7dbf7] bg-white px-3 text-[0.82rem] font-black text-[#17427f] shadow-[0_6px_14px_rgba(7,32,88,0.08)]',
            active && 'border-[rgba(184,229,255,0.96)] bg-[linear-gradient(180deg,#57a9ef_0%,#2759b7_100%)] text-white shadow-[0_10px_18px_rgba(13,53,126,0.22)]',
        ),
    panel:
        'rounded-[1.3rem] border border-[rgba(155,194,242,0.92)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] shadow-[0_14px_28px_rgba(33,74,154,0.12)] max-[860px]:rounded-none',
    tools: 'rounded-none border border-[rgba(155,194,242,0.72)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-0 shadow-[0_10px_20px_rgba(33,74,154,0.10)] max-[860px]:rounded-none',
    toolsInner:
        'flex flex-wrap items-center justify-between gap-1.5 rounded-none border border-[rgba(178,214,255,0.46)] bg-[radial-gradient(circle_at_84%_10%,rgba(124,211,255,0.12),transparent_20%),linear-gradient(180deg,rgba(42,87,169,0.98)_0%,rgba(34,69,143,0.98)_100%)] p-[0.28rem_0.62rem] text-[#f3f8ff] shadow-[0_8px_16px_rgba(33,74,154,0.09),inset_0_1px_0_rgba(255,255,255,0.08)] max-[1200px]:flex-col max-[1200px]:items-stretch max-[860px]:gap-[0.42rem] max-[860px]:rounded-none max-[860px]:p-[0.42rem]',
    toolbarLeft: 'flex min-w-0 flex-nowrap items-end gap-2 max-[860px]:grid max-[860px]:grid-cols-2 max-[860px]:items-end max-[860px]:gap-[0.42rem]',
    toolbarRight: 'flex min-w-0 flex-nowrap items-end justify-end gap-2 max-[860px]:w-full max-[860px]:items-center max-[860px]:justify-between max-[860px]:gap-[0.42rem]',
    tooltipWrap:
        'group/tooltip relative inline-flex before:pointer-events-none before:absolute before:bottom-[calc(100%+0.48rem)] before:left-1/2 before:z-30 before:hidden before:-translate-x-1/2 before:whitespace-nowrap before:rounded-[0.58rem] before:border before:border-[rgba(190,221,255,0.36)] before:bg-[linear-gradient(180deg,rgba(8,31,78,0.98)_0%,rgba(10,45,105,0.98)_100%)] before:px-2.5 before:py-1.5 before:text-[0.68rem] before:font-bold before:normal-case before:tracking-normal before:text-[#eef7ff] before:shadow-[0_10px_20px_rgba(3,12,34,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] before:content-[attr(data-tooltip)] after:pointer-events-none after:absolute after:bottom-[calc(100%+0.23rem)] after:left-1/2 after:z-30 after:hidden after:h-2 after:w-2 after:-translate-x-1/2 after:rotate-45 after:border-r after:border-b after:border-[rgba(190,221,255,0.30)] after:bg-[rgba(10,45,105,0.98)] group-hover/tooltip:before:block group-hover/tooltip:after:block group-focus-within/tooltip:before:block group-focus-within/tooltip:after:block max-[860px]:before:hidden max-[860px]:after:hidden',
    toolbarSegment: 'grid min-w-0 flex-[0_0_13.5rem] gap-1 max-[860px]:flex-auto max-[860px]:gap-[0.18rem]',
    toolbarSubcategory: 'grid min-w-[24rem] flex-[0_1_24rem] gap-1 transition-opacity duration-150 max-[860px]:min-w-0 max-[860px]:flex-auto max-[860px]:gap-[0.18rem]',
    toolbarSubcategoryHidden: 'pointer-events-none h-0 overflow-hidden opacity-0',
    sectionTitle: 'px-1 text-[0.62rem] font-black uppercase tracking-[0.09em] text-[#dcecff] [text-shadow:0_1px_8px_rgba(5,18,48,0.24)] max-[860px]:text-[0.58rem] max-[860px]:leading-none max-[860px]:tracking-[0.05em]',
    select:
        'min-h-9 min-w-0 rounded-[0.62rem] border border-[rgba(204,226,255,0.72)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(235,244,255,0.94)_100%)] px-2.5 py-0 text-[0.78rem] font-semibold text-[#173b76] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_5px_10px_rgba(7,32,88,0.08)] outline-none transition focus:border-[rgba(184,229,255,0.92)] focus:ring-2 focus:ring-sky-200/35 max-[860px]:min-h-8 max-[860px]:w-full max-[860px]:overflow-hidden max-[860px]:truncate max-[860px]:rounded-[0.56rem] max-[860px]:px-2 max-[860px]:pr-6 max-[860px]:text-[0.68rem]',
    orderForm: 'm-0 flex min-w-0 flex-none items-center gap-0 max-[860px]:flex-none',
    orderLabel: 'hidden',
    orderToggle: 'flex w-auto items-center gap-1 max-[860px]:gap-[0.34rem]',
    densityForm: 'relative m-0 hidden h-10 min-h-10 w-[8rem] min-w-[8rem] flex-none items-center justify-center min-[861px]:flex',
    densityLabel: 'pointer-events-none absolute left-2 top-1/2 z-[1] inline-flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#17427f]',
    densityIcon: 'inline-flex h-4 w-4 flex-none items-center justify-center [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    densitySelect:
        'h-10 min-h-10 w-full cursor-pointer rounded-[0.72rem] border border-[rgba(205,227,255,0.74)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(237,245,255,0.94)_100%)] py-0 pr-1.5 pl-7 text-[0.76rem] font-black text-[#17427f] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_5px_12px_rgba(7,32,88,0.10)] outline-none transition hover:brightness-[1.03] focus:border-[rgba(184,229,255,0.92)] focus:ring-2 focus:ring-sky-200/40',
    clearButton:
        'inline-flex h-9 min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-[0.62rem] border border-[#fecdd3]/90 bg-[linear-gradient(180deg,#fff3f5_0%,#ffdce3_100%)] px-2 text-[0.68rem] font-black uppercase tracking-[0.02em] text-[#b42342] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_12px_rgba(7,32,88,0.08)] transition-[transform,box-shadow,filter] duration-150 hover:-translate-y-px hover:brightness-[1.02] focus-visible:-translate-y-px focus-visible:brightness-[1.03] max-[860px]:h-8 max-[860px]:min-h-8 max-[860px]:w-8 max-[860px]:min-w-8 max-[860px]:rounded-[0.56rem] max-[860px]:px-0 max-[860px]:text-[0px] max-[560px]:text-[0px]',
    clearIcon: 'inline-flex h-4 w-4 flex-none items-center justify-center text-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
    results: 'rounded-none border border-[rgba(91,192,255,0.30)] bg-[radial-gradient(circle_at_16%_12%,rgba(56,189,248,0.10)_0%,rgba(56,189,248,0)_28%),radial-gradient(circle_at_88%_18%,rgba(59,130,246,0.09)_0%,rgba(59,130,246,0)_30%),linear-gradient(180deg,#071a3f_0%,#0a2558_54%,#061634_100%)] pt-0 shadow-[inset_0_1px_0_rgba(186,230,253,0.10),0_16px_30px_rgba(4,18,48,0.18)] max-[860px]:rounded-none max-[860px]:pt-0',
    productToolbar:
        'mb-0 hidden min-h-[3.25rem] w-full max-w-none grid-cols-[minmax(360px,1fr)_auto] items-center gap-2 rounded-none border-y border-x-0 border-[rgba(178,214,255,0.46)] bg-[radial-gradient(circle_at_84%_10%,rgba(124,211,255,0.12),transparent_20%),linear-gradient(180deg,rgba(42,87,169,0.98)_0%,rgba(34,69,143,0.98)_100%)] p-[0.28rem_0.7rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md min-[861px]:grid max-[1120px]:grid-cols-1 max-[1120px]:items-stretch',
    productToolbarFilters: 'min-w-0 min-[861px]:max-w-[1500px]',
    productToolbarActions: 'min-w-0 justify-self-end max-[1120px]:justify-self-stretch',
    grid: 'grid grid-cols-1 gap-2.5',
    empty: 'grid justify-items-center gap-[0.7rem] rounded-[1.3rem] border border-[rgba(155,194,242,0.92)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] px-4 py-8 text-center shadow-[0_14px_28px_rgba(33,74,154,0.12)] max-[860px]:rounded-[1.05rem]',
    marquee: 'relative mx-0 mb-0 overflow-hidden rounded-none border-y border-x-0 border-[rgba(146,189,255,0.28)] bg-[linear-gradient(90deg,rgba(5,31,79,0.72),rgba(16,61,137,0.82),rgba(5,31,79,0.72))] p-[0.2rem_0.75rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] max-[860px]:mx-0 max-[860px]:mb-0 max-[860px]:p-[0.16rem_0.62rem] max-[860px]:pr-10',
    marqueeTrack: 'flex w-full items-center justify-center whitespace-nowrap',
    marqueeText: 'text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#dff0ff]',
    marqueeClearButton:
        'absolute right-1.5 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.58)] bg-[rgba(255,255,255,0.96)] text-[#17427f] shadow-[0_5px_12px_rgba(4,18,48,0.20),inset_0_1px_0_rgba(255,255,255,0.90)] transition hover:brightness-105 max-[860px]:inline-flex [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.5] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]',
};

const orderButtonBase =
    'inline-flex h-9 min-h-9 min-w-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-[0.62rem] border border-[rgba(205,227,255,0.74)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(237,245,255,0.94)_100%)] px-2 py-0 text-[0.68rem] font-black uppercase tracking-[0.02em] text-[#17427f] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_5px_10px_rgba(7,32,88,0.08)] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 hover:-translate-y-px hover:brightness-[1.03] focus-visible:-translate-y-px focus-visible:brightness-[1.03] max-[860px]:h-8 max-[860px]:min-h-8 max-[860px]:w-8 max-[860px]:min-w-8 max-[860px]:rounded-[0.56rem] max-[860px]:px-0 max-[860px]:text-[0px]';

export function catalogOrderButtonClass(active: boolean): string {
    return cn(
        orderButtonBase,
        active && '!border-[rgba(184,229,255,0.96)] !bg-[linear-gradient(180deg,#57a9ef_0%,#2759b7_100%)] !text-[#f7fbff] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_10px_18px_rgba(13,53,126,0.24)]',
    );
}

export function catalogGridClass(columns: 1 | 2 | 3 | 4 | 5 | 6): string {
    return cn(
        catalog.grid,
        columns === 1 && 'min-[861px]:mx-auto min-[861px]:w-[min(980px,100%)] min-[861px]:grid-cols-1',
        columns === 2 && 'min-[861px]:mx-auto min-[861px]:w-[min(760px,100%)] min-[861px]:grid-cols-2',
        columns === 3 && 'min-[861px]:mx-auto min-[861px]:w-[min(1080px,100%)] min-[861px]:grid-cols-3',
        columns === 4 && 'min-[861px]:mx-auto min-[861px]:w-[min(1360px,100%)] min-[861px]:grid-cols-4',
        columns === 5 && 'min-[861px]:grid-cols-5',
        columns === 6 && 'min-[861px]:grid-cols-6',
    );
}

export const catalogOrderIconClass =
    'inline-flex h-[15px] w-[15px] flex-none items-center justify-center text-current [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-2 [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]';
export const catalogOrderFireIconClass =
    'inline-flex h-auto w-auto flex-none items-center justify-center text-[0.95rem] leading-none text-current';
export const catalogOrderCurrencyClass = 'text-[0.68rem] font-black leading-none';

const catalogCardBase =
    'relative grid h-[196px] min-h-[170px] grid-cols-[42%_minmax(0,1fr)] items-stretch overflow-hidden rounded-[0.82rem] border bg-white shadow-[0_8px_18px_rgba(15,23,42,0.075)] transition-[transform,box-shadow,filter,border-color] duration-200 min-[861px]:h-auto min-[861px]:min-h-full min-[861px]:grid-cols-1 min-[861px]:content-start min-[861px]:rounded-[0.95rem] min-[861px]:hover:-translate-y-1 min-[861px]:hover:brightness-[1.01] min-[861px]:hover:shadow-[0_14px_28px_rgba(15,23,42,0.105),0_0_0_3px_rgba(184,215,255,0.24)] max-[860px]:[contain:layout_paint_style] max-[860px]:[content-visibility:auto] max-[860px]:[contain-intrinsic-size:196px] max-[860px]:shadow-[0_6px_14px_rgba(15,23,42,0.065)] max-[560px]:h-[178px] max-[560px]:[contain-intrinsic-size:178px] max-[560px]:grid-cols-[41%_minmax(0,1fr)]';
const catalogToneClasses = {
    offer: 'border-[#ff8aa0]/70 ring-1 ring-[#ff2d55]/35 shadow-[0_0_0_1px_rgba(255,255,255,0.62),0_0_20px_rgba(255,45,85,0.28),0_0_42px_rgba(255,122,0,0.18),0_10px_24px_rgba(15,23,42,0.08)] min-[861px]:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.70),0_0_24px_rgba(255,45,85,0.34),0_0_52px_rgba(255,122,0,0.22),0_16px_30px_rgba(15,23,42,0.11)]',
    featured: 'border-slate-200 ring-1 ring-slate-100/80',
    new: 'border-slate-200 ring-1 ring-slate-100/80',
    regular: 'border-slate-200 ring-1 ring-slate-100/80',
} as const;
const productToneClasses = {
    offer: '[--product-tone-glow:rgba(249,115,22,0.16)] [--product-tone-border:#fed7aa]',
    featured: '[--product-tone-glow:rgba(234,179,8,0.14)] [--product-tone-border:#fde68a]',
    new: '[--product-tone-glow:rgba(56,189,248,0.14)] [--product-tone-border:#bae6fd]',
    regular: '[--product-tone-glow:rgba(148,163,184,0.16)] [--product-tone-border:#e2e8f0]',
} as const;

export type StoreTone = keyof typeof catalogToneClasses;

export function catalogCardClass(tone: StoreTone, extra?: string): string {
    return cn(catalogCardBase, catalogToneClasses[tone], extra);
}

export function productSurfaceClass(tone: StoreTone): string {
    return cn(
        'grid gap-0 overflow-hidden rounded-[1.45rem] border border-[var(--product-tone-border)] bg-white shadow-[0_16px_34px_rgba(15,23,42,0.10),0_0_18px_var(--product-tone-glow)]',
        productToneClasses[tone],
    );
}

export const catalogOfferRibbonClass =
    'absolute left-[-2.75rem] top-[1.05rem] z-[4] flex h-[1.8rem] min-w-[10.6rem] -rotate-45 items-center justify-center gap-0 bg-[linear-gradient(180deg,#ff4b4b_0%,#d71920_58%,#a80f17_100%)] px-[2.15rem] text-[0.68rem] font-black uppercase tracking-[0.055em] text-white shadow-[0_9px_20px_rgba(168,15,23,0.34),0_0_18px_rgba(255,99,99,0.24)] max-[560px]:left-0 max-[560px]:top-[0.48rem] max-[560px]:h-5 max-[560px]:min-w-[7.6rem] max-[560px]:px-[0.9rem] max-[560px]:text-[0.48rem] max-[560px]:tracking-[0.02em] max-[560px]:shadow-[0_7px_14px_rgba(168,15,23,0.26)]';
export const catalogOfferRibbonTextClass =
    'relative z-[1] text-[0.92rem] font-black leading-none tracking-[0.02em] [text-shadow:0_2px_8px_rgba(5,23,62,0.30)] max-[560px]:text-[0.68rem]';
export const catalogOfferRibbonIconClass =
    'relative z-[1] inline-flex items-center justify-center text-[0.82rem] leading-none drop-shadow-[0_3px_6px_rgba(5,23,62,0.24)] max-[560px]:text-[0.62rem]';
export const catalogCategoryRowClass = 'flex min-w-0 max-w-full items-center justify-between gap-2 overflow-hidden';
export const catalogBadgesClass = 'flex min-h-6 items-center justify-between gap-2';
export const catalogImageBadgesClass = 'absolute right-2.5 bottom-2.5 left-2.5 z-[2] flex min-h-7 items-end justify-between gap-1.5 px-0 py-0 max-[560px]:right-1.5 max-[560px]:bottom-1.5 max-[560px]:left-1.5 max-[560px]:min-h-6 max-[560px]:gap-1';
export const catalogImageNewBadgeClass = 'absolute top-2 right-2 z-[3] max-[560px]:top-1.5 max-[560px]:right-1.5';
export const catalogFeaturedChipClass =
    'inline-flex items-center gap-1 rounded-full bg-[linear-gradient(180deg,#ffe9a8_0%,#f2c95c_58%,#d7a92f_100%)] px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-[#17376f] shadow-[0_6px_14px_rgba(13,53,126,0.14),inset_0_1px_0_rgba(255,255,255,0.44)] ring-1 ring-[#f8d978]/90 backdrop-blur-[2px] max-[560px]:px-2 max-[560px]:py-0.5 max-[560px]:text-[0.54rem]';
export const catalogNewChipClass =
    'rounded-full bg-[#eefbff]/95 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.1em] text-[#0b6f95] shadow-[0_6px_14px_rgba(8,91,117,0.14)] ring-1 ring-[#b7ecff]/90 backdrop-blur-[2px] max-[560px]:px-2 max-[560px]:py-0.5 max-[560px]:text-[0.54rem]';
export const catalogImageLinkClass = 'group relative m-1 flex min-h-[158px] items-center justify-center overflow-hidden rounded-[0.62rem] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-1.5 shadow-inner ring-1 min-[861px]:m-2 min-[861px]:aspect-[6/7] min-[861px]:min-h-0 min-[861px]:rounded-[0.78rem] min-[861px]:p-2 max-[560px]:m-1 max-[560px]:min-h-[136px] max-[560px]:p-1';
export const catalogImageDetailsPillClass =
    'pointer-events-none absolute left-1/2 top-1/2 z-[3] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#071a3f]/88 px-3 py-1.5 text-[0.72rem] font-bold text-white opacity-0 shadow-[0_10px_20px_rgba(7,26,63,0.24)] backdrop-blur-sm transition duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 max-[860px]:hidden';
export const catalogImageClass = 'h-full max-h-full w-full max-w-full bg-transparent object-contain opacity-95 saturate-[0.96]';
export const catalogBodyClass = 'grid min-w-0 content-start gap-[0.22rem] overflow-hidden px-2 py-1.5 font-sans min-[861px]:content-start min-[861px]:gap-[0.62rem] min-[861px]:overflow-visible min-[861px]:px-3 min-[861px]:pb-3 min-[861px]:pt-1';
export const catalogCategoryClass = 'block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700 max-[560px]:text-[0.64rem] max-[560px]:tracking-[0.035em]';
export const catalogTitleClass = 'line-clamp-2 min-h-0 text-[0.98rem] font-bold leading-[1.18] text-[#1f365d] min-[861px]:line-clamp-3 min-[861px]:min-h-[3.2rem] max-[560px]:text-[0.86rem] max-[560px]:leading-[1.16]';
export const catalogPriceBoxClass = 'mt-1 grid gap-0.5 rounded-[0.58rem] px-2 py-1.5 text-center ring-1 min-[861px]:mt-0 min-[861px]:py-2 max-[560px]:mt-[0.2rem]';
const catalogPriceBoxToneClasses = {
    offer: '!bg-[#f2f8ff] ring-[#b8d7ff]/85',
    featured: '!bg-slate-50 ring-slate-200/80',
    new: '!bg-slate-50 ring-slate-200/80',
    regular: '!bg-slate-50 ring-slate-200/80',
} as const;
const catalogImageToneClasses = {
    offer: '!bg-white ring-slate-100/90',
    featured: '!bg-white ring-slate-100/90',
    new: '!bg-white ring-slate-100/90',
    regular: '!bg-white ring-slate-100/90',
} as const;
export const catalogPriceBeforeClass = 'text-[0.7rem] font-semibold uppercase tracking-[0.045em] text-[#7d8794] opacity-100 no-underline max-[560px]:text-[0.64rem] max-[560px]:text-[#6f7a88]';
export const catalogPriceBeforeValueClass = 'line-through';
export const catalogPriceClass = 'text-[1.58rem] font-black leading-none text-black [font-variant-numeric:tabular-nums] max-[560px]:text-[1.28rem]';
export const productPriceClass = 'text-[1.75rem] font-black leading-none text-black [font-variant-numeric:tabular-nums] max-[560px]:text-[1.45rem]';
export const productPriceBoxClass =
    'mx-auto grid w-[min(100%,420px)] justify-items-center gap-[0.28rem] rounded-[1.2rem] border border-[var(--product-tone-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-[0.9rem_1rem_0.95rem] text-center shadow-[0_0_14px_color-mix(in_srgb,var(--product-tone-glow)_46%,transparent)]';
export const catalogActionsClass = 'mt-[0.45rem] grid grid-cols-2 gap-1 min-[861px]:mt-0 max-[560px]:mt-[0.42rem]';
export const productActionsClass = 'flex w-full flex-wrap justify-center gap-[0.55rem]';

const catalogActionBase =
    'inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[0.72rem] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] transition-[transform,box-shadow,filter,background-color,border-color] duration-150 active:translate-y-px hover:-translate-y-px hover:brightness-[1.03] max-[560px]:text-[0.66rem]';
const catalogActionVariant = {
    primary: 'bg-[linear-gradient(180deg,#2f61bf_0%,#224592_100%)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_16px_rgba(13,53,126,0.20),0_0_0_3px_rgba(184,215,255,0.24)]',
    success: 'border border-[#128C7E] bg-[#128C7E] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_16px_rgba(18,140,126,0.20)] hover:bg-[#075E54]',
} as const;

export function catalogActionClass(variant: keyof typeof catalogActionVariant, extra?: string): string {
    return cn(catalogActionBase, catalogActionVariant[variant], extra);
}

export function catalogPriceBoxToneClass(tone: StoreTone): string {
    return catalogPriceBoxToneClasses[tone];
}

export function catalogImageToneClass(tone: StoreTone): string {
    return catalogImageToneClasses[tone];
}

export const catalogActionIconClass = 'inline-flex flex-none items-center justify-center leading-none';
export const catalogCartQtyShellClass = 'flex min-w-0 items-stretch gap-[0.28rem]';
export const catalogCartQtyClass =
    'relative block min-w-0 flex-auto overflow-hidden rounded-full bg-[linear-gradient(90deg,rgba(14,43,97,0.92)_0%,rgba(31,91,180,0.9)_50%,rgba(14,43,97,0.92)_100%)] px-[0.62rem] py-[0.28rem] text-center text-[0.68rem] font-black uppercase tracking-[0.035em] text-[#eaf5ff] shadow-[0_8px_16px_rgba(19,54,120,0.16),inset_0_1px_0_rgba(255,255,255,0.18)] after:absolute after:inset-0 after:translate-x-[-130%] after:bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.22)_18%,transparent_36%)] after:transition-transform after:duration-200 after:content-[\"\"] hover:after:translate-x-[130%] max-[560px]:px-[0.48rem] max-[560px]:py-[0.24rem] max-[560px]:text-[0.58rem]';
export const catalogCartQtyTrackClass = 'flex min-w-0 items-center justify-center whitespace-nowrap';
export const catalogCartQtyTextClass = 'relative z-[1]';
export const catalogCartQtyClearClass =
    'relative inline-flex min-w-7 flex-none cursor-pointer items-center justify-center rounded-full border-0 bg-[linear-gradient(180deg,#ff6a7e_0%,#d91d47_100%)] px-[0.5rem] text-[0.78rem] font-black leading-none text-white shadow-[0_8px_14px_rgba(181,28,67,0.26),inset_0_1px_0_rgba(255,255,255,0.26)] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-px hover:scale-[1.03] hover:brightness-[1.04] max-[560px]:min-w-6 max-[560px]:px-[0.42rem] max-[560px]:text-[0.7rem]';

export const productDetailShellClass =
    'mx-auto grid w-[min(980px,100%)] grid-cols-1 gap-[0.85rem] max-[1200px]:grid-cols-1';
export const productGalleryCardClass =
    'relative grid justify-items-center gap-[0.7rem] border-0 bg-transparent p-4 shadow-none max-[860px]:rounded-[1.05rem]';

export const related = {
    shell: 'mx-auto mt-2 grid w-[min(980px,100%)] gap-[0.8rem] pt-2 max-[560px]:mt-1',
    header: 'flex items-center justify-between gap-[0.8rem] max-[860px]:flex-col max-[860px]:items-start',
    title: 'text-[1.1rem] font-black uppercase tracking-[0.04em] text-[#1d3f7c]',
    nav: 'inline-flex items-center gap-[0.45rem] max-[860px]:self-end max-[560px]:w-full max-[560px]:justify-end',
    arrow:
        'inline-flex h-[2.4rem] w-[2.4rem] items-center justify-center rounded-full border border-[rgba(171,205,245,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(232,242,255,0.98)_100%)] text-[#214b98] shadow-[0_10px_18px_rgba(17,45,101,0.12),inset_0_1px_0_rgba(255,255,255,0.94)] transition-[transform,filter,box-shadow] duration-150 hover:-translate-y-px hover:brightness-[1.03]',
    carousel:
        'grid auto-cols-[minmax(280px,320px)] grid-flow-col justify-start gap-4 overflow-x-auto p-[0.2rem_0.2rem_0.8rem] [scroll-padding-inline:0.2rem] [scroll-snap-type:x_mandatory] [scrollbar-color:rgba(58,104,186,0.52)_rgba(216,231,255,0.66)] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[10px] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(58,104,186,0.52)] [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(38,80,154,0.72)] [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[rgba(216,231,255,0.66)] max-[860px]:auto-cols-[minmax(268px,86vw)] max-[860px]:gap-[0.8rem] max-[560px]:auto-cols-[minmax(252px,92vw)] max-[560px]:pb-[0.55rem]',
    slide: '[scroll-snap-align:start] [scroll-snap-stop:always]',
};
