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
        <div className="space-y-2">
            {visibleSuccess ? (
                <div role="status" className={`${surfaceClass} border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800`}>
                    {visibleSuccess}
                </div>
            ) : null}
            {flash.error ? (
                <div role="alert" className={`${surfaceClass} border-rose-200 bg-rose-50/80 px-4 py-3 text-sm font-medium text-rose-800`}>
                    {flash.error}
                </div>
            ) : null}
        </div>
    );
}
