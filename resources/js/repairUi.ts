import { cn } from './utils';

const repairSurfaceClass =
    'rounded-[1.5rem] border border-white/75 bg-[linear-gradient(180deg,#ffffff_0%,#f7fbff_100%)] shadow-[0_16px_36px_rgba(15,23,42,0.09)]';

const repairButtonBase =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-black no-underline transition duration-150 hover:-translate-y-px focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb33] disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none';

const repairButtonSize = {
    default: 'min-h-11',
    sm: 'min-h-9 rounded-lg px-3 py-1.5 text-xs',
} as const;

const repairButtonVariant = {
    primary: 'border-[#bfdbfe] bg-[#2563eb] text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] hover:bg-[#1d4ed8]',
    soft: 'border-[#bfdbfe] bg-white text-[#1d4ed8] shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-[#eff6ff]',
    danger: 'border-[#fecdd3] bg-[#ffe4e6] text-[#be123c] shadow-[0_8px_18px_rgba(190,18,60,0.08)] hover:bg-[#fecdd3]',
    success: 'border-[#bbf7d0] bg-[#16a34a] text-white shadow-[0_10px_20px_rgba(22,163,74,0.16)] hover:bg-[#15803d]',
} as const;

export const repairUi = {
    statsGrid: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    statCard: `${repairSurfaceClass} space-y-1.5 p-4`,
    statLabel: 'text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#1d4ed8]/75',
    statValue: 'text-3xl font-black tracking-tight text-[#0f172a] md:text-4xl',
    cardTitleWrap: 'space-y-1',
    eyebrow: 'text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#1d4ed8]/75',
    cardTitle: 'text-xl font-black tracking-tight text-[#0f172a] md:text-2xl',
    inlineCaption: 'text-sm leading-5 text-[#475569]',
    inlineActions: 'flex flex-wrap items-center gap-2',
    input:
        'min-h-11 w-full rounded-xl border border-[#bfdbfe] bg-white px-3 py-2 text-sm font-bold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20] disabled:bg-slate-100 disabled:text-slate-500',
    textarea:
        'min-h-28 w-full rounded-xl border border-[#bfdbfe] bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb20] disabled:bg-slate-100 disabled:text-slate-500',
    pagination: 'flex flex-wrap items-center justify-between gap-2 rounded-[1rem] border border-[#bfdbfe] bg-white/90 px-3 py-3 text-sm font-bold text-[#334155]',
    repairGridSingle: 'grid gap-3',
    repairList: 'grid gap-3',
    repairCard: `${repairSurfaceClass} p-3 md:p-4`,
    repairCardHeading: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
    repairFormGrid: 'grid gap-3 md:grid-cols-2',
    repairFull: 'md:col-span-full',
    repairUploadField:
        'flex min-h-28 flex-col justify-center gap-2 rounded-xl border border-dashed border-[#93c5fd] bg-[#eff6ff] px-3 py-3 text-sm font-bold text-[#334155]',
    repairShell:
        'rounded-[20px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(244,248,255,0.96)_100%)] p-3 shadow-[0_16px_38px_rgba(15,23,42,0.09)] md:p-4',
    repairTicketPanel: 'rounded-[18px] border border-white/75 bg-white/92 p-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.08)] md:p-4',
    repairRepairCard: 'rounded-[16px] border border-[#dbeafe] bg-white/95 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)] md:p-4',
    repairRepairHead: 'flex flex-col gap-3 md:flex-row md:items-start md:justify-between',
    repairMiniChip:
        'inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.08em] text-slate-600',
    repairDenseInput:
        'min-h-10 w-full rounded-xl border border-[#cbdff7] bg-white px-3 py-2 text-sm font-bold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb1f] disabled:bg-slate-100 disabled:text-slate-500',
    repairDenseTextarea:
        'min-h-24 w-full rounded-xl border border-[#cbdff7] bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb1f] disabled:bg-slate-100 disabled:text-slate-500',
};

export function repairButtonClass(
    variant: keyof typeof repairButtonVariant,
    size: keyof typeof repairButtonSize = 'default',
    extra?: string | false | null | undefined,
): string {
    return cn(repairButtonBase, repairButtonSize[size], repairButtonVariant[variant], extra);
}

export { repairSurfaceClass };
