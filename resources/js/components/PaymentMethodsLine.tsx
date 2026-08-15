type PaymentMethodsLineProps = {
    priceLabel: string;
    variant?: 'compact' | 'detail';
    align?: 'center' | 'end' | 'start';
};

const alignClass = {
    center: 'items-center text-center',
    end: 'items-end text-right',
    start: 'items-start text-left',
};

function TransferIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 7h16" />
            <path d="M7 4 4 7l3 3" />
            <path d="M20 17H4" />
            <path d="m17 14 3 3-3 3" />
        </svg>
    );
}

function QrIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M4 4h6v6H4z" />
            <path d="M14 4h6v6h-6z" />
            <path d="M4 14h6v6H4z" />
            <path d="M14 14h2v2h-2z" />
            <path d="M18 14h2v6h-4v-2h2z" />
            <path d="M14 18h2v2h-2z" />
        </svg>
    );
}

function CardIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
        </svg>
    );
}

function MercadoPagoIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 64 44" focusable="false" aria-hidden="true">
            <ellipse cx="32" cy="22" rx="29" ry="19" fill="#17bdf2" stroke="#12038b" strokeWidth="3.2" />
            <path d="M5.5 17.3c7.1 1.4 14.7 5 21.8 3 6.5-1.8 7.4-6.5 13.4-6.1 6 .4 9 4.9 17.5 2.1" fill="none" stroke="#12038b" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M5.2 26.7c8 2 17.4 6 25.7 4.1 6.2-1.5 9.8-5.2 15.4-5.5 4.1-.3 8.8 1.3 12.5 2.6" fill="none" stroke="#12038b" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M26.5 17.8c4.4-5.3 8.8-7.5 14-5.9 3.6 1.1 6.9 3.9 10.4 7.1l3.8 3.5c1.5 1.4 1.6 3.8.2 5.2-1.1 1.1-2.9 1.3-4.3.5.3 1.2-.1 2.5-1.1 3.4-1.1.9-2.6 1-3.8.4.1 1.1-.3 2.2-1.2 2.9-1.2.9-2.9.8-4.1-.1-.3.7-.8 1.2-1.5 1.6-1.3.6-2.8.3-4-.8l-8.7-8.3" fill="#fff" stroke="#12038b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M31.1 13.3c-3 1-5.8 3.1-8.7 6.6-1.2 1.4-3.5 1.2-4.7-.1l-1.1-1.2c3.9-5.1 8.4-8.5 14.5-8.7" fill="#fff" stroke="#12038b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17.1 25.7c.7-1.5 2.4-2.1 3.8-1.4l.9.5c.2-1.4 1.5-2.4 2.9-2.4 1.3 0 2.5.8 2.9 2 1.3-.7 2.9-.4 3.9.7.8.9 1 2.1.6 3.1 1.1.1 2 .8 2.5 1.8.7 1.4.2 3-1.1 3.8-1.1.7-2.5.6-3.4-.1-.6 1.2-1.9 1.8-3.2 1.5-1.1-.2-1.9-1-2.3-1.9-1.1.8-2.6.8-3.7-.1-.8-.6-1.2-1.5-1.2-2.4-1.1.3-2.4-.1-3.1-1.1-.8-1.1-1-2.5-.5-3.6Z" fill="#fff" stroke="#12038b" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

const paymentMethods = [
    { label: 'Transferencia', icon: <TransferIcon /> },
    { label: 'QR', icon: <QrIcon /> },
    { label: 'Débito', icon: <CardIcon /> },
    { label: 'Mercado Pago', icon: <MercadoPagoIcon />, brand: true },
];

export function PaymentMethodsLine({ priceLabel, variant = 'compact', align = 'center' }: PaymentMethodsLineProps): JSX.Element {
    const isDetail = variant === 'detail';
    const iconClass = isDetail
        ? 'inline-flex h-6 w-6 items-center justify-center text-slate-700 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round]'
        : 'inline-flex h-4 w-4 items-center justify-center text-slate-600 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-2 [&>svg]:[stroke-linecap:round] [&>svg]:[stroke-linejoin:round]';
    const mercadoPagoClass = isDetail
        ? 'inline-flex h-5 w-7 items-center justify-center [&>svg]:h-[1.125rem] [&>svg]:w-7'
        : 'inline-flex h-4 w-6 items-center justify-center [&>svg]:h-4 [&>svg]:w-6';

    if (!isDetail) {
        return (
            <span className={`grid gap-0.5 text-slate-600 ${alignClass[align]}`}>
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.035em]">Otros medios de pago</span>
                <span className="catalog-preview-price-font text-[0.72rem] font-black leading-none text-slate-700">${priceLabel}</span>
            </span>
        );
    }

    return (
        <span className={`mt-2 grid w-full gap-2 border-t border-emerald-200/80 pt-2 text-slate-600 ${alignClass[align]}`}>
            <span className="grid gap-0.5 text-[0.74rem] font-bold uppercase tracking-[0.035em]">
                <span>Otros medios de pago</span>
                <span className="catalog-preview-price-font text-[0.9rem] font-black leading-none text-slate-700">${priceLabel}</span>
            </span>
            <span className={`grid w-full grid-cols-4 ${align === 'end' ? 'justify-items-end' : align === 'start' ? 'justify-items-start' : 'justify-items-center'} gap-2`} aria-label="Otros medios: transferencia, QR, débito y Mercado Pago">
                {paymentMethods.map((method) => (
                    <span key={method.label} className="grid justify-items-center gap-1 text-center text-[0.55rem] font-black uppercase leading-tight tracking-[0.02em] text-slate-600" title={method.label}>
                        <span className={method.brand ? mercadoPagoClass : iconClass}>
                            {method.icon}
                        </span>
                        <span>{method.label}</span>
                    </span>
                ))}
            </span>
        </span>
    );
}
