import { router } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { PaymentMethodsLine } from '../../components/PaymentMethodsLine';
import { SiteLayout } from '../../layouts/SiteLayout';
import type { CartLine, HeaderSearchState } from '../../types';
import { buttonClass, storeBackLinkClass } from '../../ui';

interface CartPageProps {
    kind: 'cart';
    headerSearch: HeaderSearchState;
    items: CartLine[];
    totalItems: number;
    total: number;
    totalLabel: string;
    cashTotal: number;
    cashTotalLabel: string;
    hasCashDiscount: boolean;
    clearAction: string;
    continueShoppingUrl: string;
    checkoutWhatsappUrl: string;
}

function CashIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 9h1" />
            <path d="M17 15h1" />
        </svg>
    );
}

export default function CartPage({ headerSearch, items, totalItems, totalLabel, cashTotalLabel, hasCashDiscount, clearAction, continueShoppingUrl, checkoutWhatsappUrl }: CartPageProps): JSX.Element {
    const customerNameRef = useRef<HTMLInputElement | null>(null);
    const [customerName, setCustomerName] = useState('');
    const [customerNameError, setCustomerNameError] = useState('');
    const [qtyByProduct, setQtyByProduct] = useState<Record<number, number>>(() =>
        Object.fromEntries(items.map((item) => [item.productId, item.qty])),
    );

    useEffect(() => {
        setQtyByProduct(Object.fromEntries(items.map((item) => [item.productId, item.qty])));
    }, [items]);

    const updateLineQty = (productId: number, action: string, quantity: number): void => {
        const nextQuantity = Math.max(1, quantity);

        setQtyByProduct((current) => ({
            ...current,
            [productId]: nextQuantity,
        }));

        router.post(
            action,
            {
                product_id: productId,
                quantity: nextQuantity,
            },
            { preserveScroll: true },
        );
    };

    const buildCheckoutUrl = (name: string): string => {
        try {
            const url = new URL(checkoutWhatsappUrl);
            const message = url.searchParams.get('text') ?? '';
            const lines = message.split('\n').map((line) => line.startsWith('TOTAL ') ? `*${line}*` : line);
            const customerName = name.toUpperCase();
            const nextMessage = [
                `SOY *${customerName}*, ME GUSTARIA COMPRAR LO SIGUIENTE:`,
                ...lines.slice(1),
            ].join('\n');

            url.searchParams.set('text', nextMessage);

            return url.toString();
        } catch {
            return checkoutWhatsappUrl;
        }
    };

    const finishCheckout = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const normalizedName = customerName.trim().replace(/\s+/g, ' ');
        if (normalizedName.length < 3 || !normalizedName.includes(' ')) {
            setCustomerNameError('Por favor, indicanos nombre y apellido para preparar tu pedido.');
            customerNameRef.current?.focus();
            return;
        }

        setCustomerNameError('');
        window.location.href = buildCheckoutUrl(normalizedName);
    };

    return (
        <SiteLayout title="Carrito" headerSearch={headerSearch}>
            <section className="mx-auto grid w-[min(100%,1480px)] gap-4 px-2 max-[860px]:px-0">
                <div className="grid min-h-[2.75rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.3rem] border border-[rgba(155,194,242,0.92)] bg-[linear-gradient(180deg,#24488d_0%,#1e3a73_100%)] px-3 py-2 text-center text-[#edf7ff] shadow-[0_14px_28px_rgba(33,74,154,0.12)] max-[720px]:grid-cols-1 max-[720px]:justify-items-center">
                    <button type="button" className={`${storeBackLinkClass} !min-h-9 !bg-[rgba(255,255,255,0.94)] !px-3 !py-1.5`} onClick={() => router.get(continueShoppingUrl)}>
                        <span aria-hidden="true">&lt;</span>
                        <span>Volver al catalogo</span>
                    </button>
                    <strong className="text-[1.06rem] font-bold leading-[1.22]">CARRITO ({totalItems} ITEMS)</strong>
                    <span className="hidden min-[721px]:block min-w-[9rem]" aria-hidden="true" />
                </div>

                <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="grid gap-3">

                    {items.length > 0 ? (
                        <section className="rounded-[1.35rem] border border-[rgba(124,180,243,0.76)] bg-[linear-gradient(180deg,#2f5daf_0%,#294f99_100%)] p-4 shadow-[0_16px_32px_rgba(34,75,154,0.16)]">
                            <div className="grid gap-3">
                                {items.map((item) => (
                                    (() => {
                                        const lineQty = qtyByProduct[item.productId] ?? item.qty;
                                        const lineSubtotal = item.unitPrice * lineQty;
                                        const lineSubtotalLabel = new Intl.NumberFormat('es-AR').format(lineSubtotal);
                                        const lineCashSubtotal = item.cashUnitPrice ? item.cashUnitPrice * lineQty : null;
                                        const lineCashSubtotalLabel = lineCashSubtotal !== null ? new Intl.NumberFormat('es-AR').format(lineCashSubtotal) : '';

                                        return (
                                            <article
                                                key={item.productId}
                                                className="grid items-center gap-4 rounded-[1.2rem] border border-[rgba(208,228,252,0.85)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-4 shadow-[0_14px_28px_rgba(33,74,154,0.12)] md:grid-cols-[110px_minmax(0,1fr)_auto]"
                                            >
                                                <img
                                                    src={item.imageUrl}
                                                    alt={item.name}
                                                    className="h-[110px] w-full rounded-2xl bg-white object-contain"
                                                    onError={(event) => {
                                                        event.currentTarget.src = item.imageFallbackUrl;
                                                    }}
                                                />
                                                <div className="grid gap-1">
                                                    <h2 className="text-[1.06rem] font-bold leading-[1.22] text-[#1f365d]">{item.name}</h2>
                                                    <p className="text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700">Precio unitario: <span className="catalog-preview-price-font">${item.unitPriceLabel}</span></p>
                                                    {item.cashUnitPrice ? (
                                                        <p className="inline-flex items-center gap-1 text-[0.76rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                                                            Oferta en efectivo
                                                            <CashIcon />
                                                            : <span className="catalog-preview-price-font">${item.cashUnitPriceLabel}</span>
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="grid gap-2 md:justify-items-end">
                                                    <div className="flex items-center justify-center gap-2 rounded-[1rem] border border-[rgba(188,214,245,0.92)] bg-[linear-gradient(180deg,#f8fbff_0%,#ebf4ff_100%)] p-1">
                                                        <button
                                                            type="button"
                                                            className="flex h-[2.55rem] w-[2.55rem] items-center justify-center rounded-[0.8rem] border border-[rgba(179,209,245,0.92)] bg-white text-[1.2rem] font-black text-[#1f4078] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                                                            aria-label={`Restar una unidad de ${item.name}`}
                                                            onClick={() => updateLineQty(item.productId, item.updateAction, lineQty - 1)}
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={lineQty}
                                                            className="min-h-[2.55rem] w-[74px] rounded-[0.8rem] bg-white px-3 py-2 text-center text-base font-extrabold text-[#1f4078] outline-none"
                                                            onChange={(event) =>
                                                                setQtyByProduct((current) => ({
                                                                    ...current,
                                                                    [item.productId]: Math.max(1, Number(event.currentTarget.value) || 1),
                                                                }))
                                                            }
                                                            onBlur={(event) => updateLineQty(item.productId, item.updateAction, Number(event.currentTarget.value) || 1)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="flex h-[2.55rem] w-[2.55rem] items-center justify-center rounded-[0.8rem] border border-[rgba(179,209,245,0.92)] bg-white text-[1.2rem] font-black text-[#1f4078] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                                                            aria-label={`Sumar una unidad de ${item.name}`}
                                                            onClick={() => updateLineQty(item.productId, item.updateAction, lineQty + 1)}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    {lineCashSubtotal !== null ? (
                                                        <div className="grid justify-items-end rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 leading-tight text-emerald-900">
                                                            <span className="inline-flex items-center gap-1 text-[0.72rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                                                                Oferta en efectivo
                                                                <CashIcon />
                                                            </span>
                                                            <strong className="catalog-preview-price-font text-[1.55rem] font-black leading-none text-emerald-950 [font-variant-numeric:tabular-nums]">${lineCashSubtotalLabel}</strong>
                                                            <PaymentMethodsLine priceLabel={lineSubtotalLabel} align="end" />
                                                        </div>
                                                    ) : (
                                                        <div className="grid justify-items-end gap-1">
                                                            <span className="text-[0.68rem] font-black uppercase tracking-[0.045em] text-slate-500">Subtotal</span>
                                                            <strong className="catalog-preview-price-font text-[2.02rem] font-black leading-none text-black [font-variant-numeric:tabular-nums]">${lineSubtotalLabel}</strong>
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={buttonClass('danger', 'sm', 'rounded-[0.95rem] px-4 py-2 text-[0.84rem]')}
                                                        onClick={() => router.post(item.removeAction, { product_id: item.productId }, { preserveScroll: true })}
                                                    >
                                                        QUITAR
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })()
                                ))}
                            </div>
                        </section>
                    ) : (
                        <div className="grid justify-items-center gap-3 rounded-[1.3rem] border border-[rgba(155,194,242,0.92)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] px-4 py-8 text-center shadow-[0_14px_28px_rgba(33,74,154,0.12)]">
                            <h2 className="text-[1.55rem] font-bold leading-[1.22] text-[#1f365d]">Tu carrito esta vacio.</h2>
                            <p className="max-w-2xl text-[0.96rem] leading-[1.7] text-[#294a78]">Agrega productos desde el catalogo para continuar con la compra.</p>
                        </div>
                    )}
                </div>

                    <aside className="grid h-fit gap-3 rounded-[1.35rem] border border-[rgba(124,180,243,0.76)] bg-[linear-gradient(180deg,#2f5daf_0%,#294f99_100%)] p-4 shadow-[0_16px_32px_rgba(34,75,154,0.16)] xl:sticky xl:top-[7.2rem]">
                        <form className="grid gap-3 rounded-[1.15rem] border border-[rgba(208,228,252,0.85)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-5 shadow-[0_14px_28px_rgba(33,74,154,0.12)]" onSubmit={finishCheckout}>
                        <p className="text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700">RESUMEN</p>
                        {hasCashDiscount ? (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                                <p className="inline-flex items-center gap-1.5 text-[0.78rem] font-black uppercase tracking-[0.045em] text-emerald-700">
                                    Total oferta en efectivo
                                    <CashIcon />
                                </p>
                                <strong className="catalog-preview-price-font text-[2.35rem] font-black leading-none text-emerald-950">${cashTotalLabel}</strong>
                                <div className="mt-1">
                                    <PaymentMethodsLine priceLabel={totalLabel} />
                                </div>
                                <p className="mt-1 text-[0.72rem] font-bold leading-5 text-emerald-900">Oferta en efectivo al retirar en el local.</p>
                            </div>
                        ) : (
                            <strong className="catalog-preview-price-font text-[2.02rem] font-black leading-none text-black [font-variant-numeric:tabular-nums]">${totalLabel}</strong>
                        )}

                        <label className="grid gap-1.5">
                            <span className="text-[0.76rem] font-semibold uppercase tracking-[0.045em] text-blue-700">Nombre y apellido</span>
                            <input
                                ref={customerNameRef}
                                type="text"
                                value={customerName}
                                className="min-h-11 rounded-[0.85rem] border border-[rgba(179,209,245,0.92)] bg-white px-3 py-2 text-[0.94rem] font-semibold text-[#1f365d] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] outline-none placeholder:text-[#6f87af] focus:border-[rgba(83,160,245,0.85)] focus:ring-2 focus:ring-sky-200/45"
                                placeholder="Ej: Juan Perez"
                                autoComplete="name"
                                onChange={(event) => {
                                    setCustomerName(event.currentTarget.value);
                                    if (customerNameError !== '') {
                                        setCustomerNameError('');
                                    }
                                }}
                            />
                            <span className="text-[0.78rem] leading-[1.35] text-[#49648e]">Te lo pedimos para identificar y preparar tu pedido.</span>
                            {customerNameError !== '' ? <span className="text-[0.78rem] font-bold text-[#b42342]">{customerNameError}</span> : null}
                        </label>

                        <button type="submit" className={buttonClass('success', 'default', 'min-h-12 px-5')}>
                            FINALIZAR POR WHATSAPP
                        </button>
                        <button type="button" className={buttonClass('primary', 'default', 'min-h-12 px-5')} onClick={() => router.get(continueShoppingUrl)}>
                            SEGUIR COMPRANDO
                        </button>
                        <button type="button" className={buttonClass('danger', 'sm', 'w-full rounded-[0.95rem] px-4 py-2 text-[0.84rem]')} onClick={() => router.post(clearAction)}>
                            VACIAR CARRITO
                        </button>
                        </form>
                    </aside>
                </div>
            </section>
        </SiteLayout>
    );
}
