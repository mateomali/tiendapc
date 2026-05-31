import type { ReactNode } from 'react';
import { surfaceClass } from '../ui';
import { cn } from '../utils';

interface AdminPageHeaderProps {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: ReactNode;
}

interface AdminPanelProps {
    eyebrow?: string;
    title?: string;
    actions?: ReactNode;
    children: ReactNode;
    className?: string;
}

interface AdminMetricCardProps {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    tone?: 'default' | 'brand' | 'success' | 'warning';
}

interface AdminActionBarProps {
    children: ReactNode;
    className?: string;
}

const toneClasses = {
    default: 'border-sky-100 bg-white',
    brand: 'border-brand-200 bg-brand-50',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50',
} as const;

export function AdminPageHeader({ eyebrow, title, description, actions }: AdminPageHeaderProps): JSX.Element {
    return (
        <section className={cn(surfaceClass, 'flex flex-col gap-3 p-3 text-ink-900 lg:flex-row lg:items-start lg:justify-between')}>
            <div className="min-w-0">
                {eyebrow ? <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-brand-700/70">{eyebrow}</p> : null}
                <h2 className="text-xl font-black leading-tight text-ink-950">{title}</h2>
                {description ? <p className="mt-1 max-w-3xl text-sm leading-5 text-ink-800">{description}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </section>
    );
}

export function AdminPanel({ eyebrow, title, actions, children, className }: AdminPanelProps): JSX.Element {
    return (
        <section className={cn(surfaceClass, 'grid gap-3 p-3', className)}>
            {title || eyebrow || actions ? (
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                        {eyebrow ? <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-brand-700/70">{eyebrow}</p> : null}
                        {title ? <h3 className="text-lg font-black leading-tight text-ink-950">{title}</h3> : null}
                    </div>
                    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
                </div>
            ) : null}
            {children}
        </section>
    );
}

export function AdminMetricCard({ label, value, detail, tone = 'default' }: AdminMetricCardProps): JSX.Element {
    return (
        <article className={cn('grid gap-1 rounded-xl border p-3 shadow-[0_8px_18px_rgba(18,58,132,0.06)]', toneClasses[tone])}>
            <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-brand-700/70">{label}</p>
            <strong className="text-2xl font-black text-ink-950">{value}</strong>
            {detail ? <p className="text-xs font-bold text-ink-700">{detail}</p> : null}
        </article>
    );
}

export function AdminActionBar({ children, className }: AdminActionBarProps): JSX.Element {
    return (
        <div className={cn('flex flex-wrap items-center gap-2 rounded-xl border border-sky-100 bg-white/80 p-2 shadow-[0_8px_18px_rgba(18,58,132,0.06)]', className)}>
            {children}
        </div>
    );
}
