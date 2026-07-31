import { cn } from './utils';

const repairSurfaceClass =
    'rounded-lg border border-[#b8d3f7] bg-white shadow-sm';

const repairButtonBase =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent px-3.5 py-2 text-[0.86rem] font-bold leading-none no-underline transition duration-150 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb33] disabled:cursor-not-allowed disabled:opacity-60';

const repairButtonSize = {
    default: 'min-h-10',
    sm: 'min-h-8 px-2.5 py-1.5 text-[0.74rem]',
} as const;

const repairButtonVariant = {
    primary: 'border-[#1d4ed8] bg-[#2563eb] text-white hover:bg-[#1d4ed8]',
    soft: 'border-[#cbd5e1] bg-white text-[#334155] hover:bg-[#f8fafc]',
    danger: 'border-[#fecdd3] bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6]',
    success: 'border-[#15803d] bg-[#16a34a] text-white hover:bg-[#15803d]',
} as const;

export const repairUi = {
    statsGrid: 'grid gap-3 md:grid-cols-2 xl:grid-cols-4',
    statCard: `${repairSurfaceClass} space-y-2 bg-[#f8fbff] p-4`,
    statLabel: 'text-[0.78rem] font-bold text-[#1d4ed8]',
    statValue: 'text-2xl font-black tracking-tight text-[#0f172a] md:text-3xl',
    cardTitleWrap: 'space-y-1',
    eyebrow: 'text-[0.78rem] font-bold text-[#1d4ed8]',
    cardTitle: 'text-lg font-black tracking-tight text-[#0f172a] md:text-xl',
    inlineCaption: 'text-sm leading-5 text-[#475569]',
    inlineActions: 'flex flex-wrap items-center gap-2',
    input:
        'min-h-10 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[0.88rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb20] disabled:bg-slate-100 disabled:text-slate-500',
    textarea:
        'min-h-24 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[0.88rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb20] disabled:bg-slate-100 disabled:text-slate-500',
    pagination: 'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#cbd5e1] bg-white px-3 py-3 text-sm font-bold text-[#334155]',
    repairGridSingle: 'grid gap-3',
    repairList: 'grid gap-3',
    repairCard: `${repairSurfaceClass} p-4 md:p-5`,
    repairCardHeading: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
    repairFormGrid: 'grid gap-3 md:grid-cols-2',
    repairFull: 'md:col-span-full',
    repairUploadField:
        'flex min-h-28 flex-col justify-center gap-2 rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] px-3 py-3 text-sm font-bold text-[#334155]',
    repairShell:
        'rounded-lg border border-[#b8d3f7] bg-[#f8fbff] p-3 shadow-sm md:p-4',
    repairTicketPanel: 'rounded-lg border border-[#b8d3f7] bg-white p-2.5 shadow-sm md:p-4',
    repairRepairCard: 'rounded-lg border border-[#b8d3f7] bg-white p-3 shadow-sm md:p-4',
    repairRepairHead: 'flex flex-col gap-3 md:flex-row md:items-start md:justify-between',
    repairMiniChip:
        'inline-flex items-center rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-2.5 py-1 text-[0.7rem] font-bold text-[#475569]',
    repairDenseInput:
        'min-h-9 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-[0.84rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb1f] disabled:bg-slate-100 disabled:text-slate-500',
    repairDenseTextarea:
        'min-h-20 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-[0.84rem] font-semibold text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb1f] disabled:bg-slate-100 disabled:text-slate-500',
};

export function repairButtonClass(
    variant: keyof typeof repairButtonVariant,
    size: keyof typeof repairButtonSize = 'default',
    extra?: string | false | null | undefined,
): string {
    return cn(repairButtonBase, repairButtonSize[size], repairButtonVariant[variant], extra);
}

export { repairSurfaceClass };
