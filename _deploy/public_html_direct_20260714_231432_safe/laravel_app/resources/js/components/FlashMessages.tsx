import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { SharedPageProps } from '../types';
import { surfaceClass } from '../ui';

export function FlashMessages(): JSX.Element | null {
    const { flash } = usePage<SharedPageProps>().props;
    const [visibleSuccess, setVisibleSuccess] = useState<string | null>(flash.success ?? null);

    useEffect(() => {
        setVisibleSuccess(flash.success ?? null);

        if (!flash.success) {
            return undefined;
        }

        const timeout = window.setTimeout(() => {
            setVisibleSuccess(null);
        }, 3200);

        return () => window.clearTimeout(timeout);
    }, [flash.success]);

    if (!visibleSuccess && !flash.error) {
        return null;
    }

    return (
        <div className="pointer-events-none fixed right-3 top-3 z-[70] grid w-[min(calc(100vw-1.5rem),26rem)] gap-2 max-[560px]:right-2 max-[560px]:top-2 max-[560px]:w-[calc(100vw-1rem)] print:hidden">
            {visibleSuccess ? (
                <div role="status" className={`${surfaceClass} pointer-events-auto border-emerald-200 bg-emerald-50/95 px-4 py-3 text-sm font-bold text-emerald-900 shadow-[0_14px_34px_rgba(6,78,59,0.18)] backdrop-blur-md`}>
                    {visibleSuccess}
                </div>
            ) : null}
            {flash.error ? (
                <div role="alert" className={`${surfaceClass} pointer-events-auto border-rose-200 bg-rose-50/95 px-4 py-3 text-sm font-bold text-rose-900 shadow-[0_14px_34px_rgba(127,29,29,0.18)] backdrop-blur-md`}>
                    {flash.error}
                </div>
            ) : null}
        </div>
    );
}
