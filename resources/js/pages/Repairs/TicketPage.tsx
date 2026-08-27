import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import type { RepairOrderView, RepairPaymentView, RepairTicketView } from '../../types';
import { repairButtonClass as buttonClass } from '../../repairUi';
import { formatCurrency } from '../../utils';

interface TicketPageProps {
    ticket: RepairTicketView;
    summary: {
        totalMonto: number;
        totalSenia: number;
        saldo: number;
    };
    businessHours: string;
    ticketPricing: TicketPricingSettings;
    returnUrl: string;
}

interface TicketPricingSettings {
    cashDiscountEnabled: boolean;
    cashDiscountThreshold: number;
    cashDiscountPercentage: number;
    cashDiscountNote: string;
}

export default function TicketPage({ ticket, businessHours, ticketPricing, returnUrl }: TicketPageProps): JSX.Element {
    const [qrUrl, setQrUrl] = useState<string>('');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', hour12: false, minute: '2-digit' });
    const trackingVerifier = ticket.trackingVerifier || String(ticket.dni);
    const hasIncrements = ticket.repairs.some((repair) => (repair.payments ?? []).some((payment) => payment.payment_type === 'incremento'));
    const generalFinancial = ticketFinancialSummary(ticket.repairs, ticketPricing);
    const repairPrintItems = ticket.repairs.map((repair, index) => {
        const monto = Number(repair.monto ?? 0);
        const financial = repairFinancialSummary(repair, ticketPricing);
        const modelLabel = ticketRepairModel(repair);
        const failureLabel = ticketRepairFailure(repair, modelLabel);
        const increments = (repair.payments ?? []).filter((payment) => payment.payment_type === 'incremento');
        const deposits = (repair.payments ?? []).filter((payment) => payment.payment_type === 'senia' && Number(payment.amount ?? 0) > 0);
        const hasDeposits = deposits.length > 0;
        const canUseCompactPrice = increments.length === 0 && !hasDeposits && !financial.discountApplies;

        return {
            repair,
            index,
            number: index + 1,
            key: `${repair.registro_id}-${repair.reparacion}`,
            modelLabel,
            modelKey: normalizeTicketText(modelLabel),
            failureLabel,
            monto,
            financial,
            deliveredLabel: repair.entregado === 'si' ? formatDeliveredTicketDate(repair.fecha_entregado) : null,
            increments,
            deposits,
            hasDeposits,
            canUseCompactPrice,
            compactPriceLabel: monto > 0 ? formatCurrency(financial.cashTotal) : 'A PRESUPUESTAR',
            cashDueLabel: financial.cashDue <= 0 ? 'PAGADO' : formatCurrency(financial.cashDue),
        };
    });
    const repairPrintGroups = repairPrintItems.reduce<Array<{ key: string; modelLabel: string; items: typeof repairPrintItems }>>((groups, item) => {
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.key === item.modelKey) {
            lastGroup.items.push(item);
            return groups;
        }

        groups.push({ key: item.modelKey, modelLabel: item.modelLabel, items: [item] });

        return groups;
    }, []);

    useEffect(() => {
        let cancelled = false;

        void toDataURL(ticket.trackingUrl, {
            margin: 1,
            width: 116,
        }).then((url) => {
            if (!cancelled) {
                setQrUrl(url);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [ticket.trackingUrl]);

    const printTicket = (): void => {
        window.requestAnimationFrame(() => window.print());
    };

    return (
        <>
            <Head title={`Ticket #${ticket.id}`} />
            <div className="min-h-screen bg-[linear-gradient(180deg,#eef5ff,#f8fbff)] px-3 py-3 text-black print:h-auto print:min-h-0 print:w-[80mm] print:bg-white print:p-0">
                <div className="mx-auto mb-2 flex w-[80mm] flex-wrap justify-center gap-1.5 print:hidden">
                    <Link href={returnUrl} className={buttonClass('soft', 'sm')}>
                        Volver
                    </Link>
                    <button type="button" className={buttonClass('primary', 'sm')} onClick={printTicket}>
                        Imprimir
                    </button>
                    {ticket.whatsappUrl ? (
                        <a href={ticket.whatsappUrl} className={buttonClass('soft', 'sm')} target="_blank" rel="noreferrer">
                            Enviar
                        </a>
                    ) : null}
                </div>

                <main className="mx-auto h-auto min-h-0 w-[80mm] rounded-[10px] border border-[#dbe7f6] bg-white px-[5px] py-[7px] font-[Arial,Helvetica,sans-serif] text-[12px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-black shadow-[0_16px_34px_rgba(15,23,42,0.16)] print:mx-auto print:h-auto print:min-h-0 print:w-[80mm] print:rounded-none print:border-0 print:px-[4mm] print:pt-[4mm] print:pb-[2mm] print:shadow-none">
                    <div className="hidden print:block print:h-[4mm]" />

                    <header className="text-center">
                        <div className="text-[21px] font-black leading-[1.02] tracking-[0.06em]">SUDOKU</div>
                        <div className="text-[11px] leading-[1.15]">AV. JOSE DE SAN MARTIN 2658 - MERLO</div>
                        <div className="mx-auto my-[3px] w-full border-t border-dashed border-black pt-[3px]">
                            <span className="text-[10px] leading-[1.05]">WHATSAPP: </span>
                            <strong className="text-[12.5px] leading-[1.05] tracking-[0.02em]">1128974824</strong>
                        </div>
                        <div className="mx-auto mt-[2px] max-w-[68mm] text-[9.5px] leading-[1.15]">HORARIO DE ATENCION: {businessHours}</div>
                    </header>

                    <div className="my-[5px] border-t border-dashed border-black" />

                    <section>
                        <div className="mb-[3px] text-[12px]">{hasIncrements ? 'TICKET ACTUALIZADO' : 'COMPROBANTE DE INGRESO'}</div>
                        <TicketLine label="ORDEN N:" value={`#${ticket.id}`} variant="highlight" />
                        <TicketLine label="CLIENTE:" value={ticket.nombre_cliente} />
                        <TicketLine label="CODIGO:" value={trackingVerifier} />
                        <TicketLine label="FECHA:" value={fecha} />
                        <TicketLine label="HORA:" value={hora} />
                    </section>

                    <div className="my-[5px] border-t border-dashed border-black" />

                    <section>
                        {repairPrintGroups.map((group) => {
                            const subtotal = ticketRepairGroupSubtotal(group.items, ticketPricing);

                            return (
                            <div key={`${group.key}-${group.items[0]?.key ?? 'grupo'}`} className="border-b border-dashed border-black py-[3px] last:border-b-0">
                                <TicketRepairGroupSummary
                                    label={ticket.repairs.length === 1 ? 'TRABAJO' : group.items.length === 1 ? `TRABAJO ${group.items[0].number}` : `TRABAJOS ${group.items[0].number}-${group.items[group.items.length - 1].number}`}
                                    model={group.modelLabel}
                                    items={group.items.map((item) => ({
                                        key: item.key,
                                        failure: item.failureLabel,
                                        price: ticketRepairLinePriceLabel(item, subtotal.discountApplies, ticketPricing),
                                    }))}
                                    subtotal={group.items.length > 1 || subtotal.discountApplies ? subtotal : null}
                                    showRegularSubtotal={group.items.length > 1}
                                    discountLabel={ticketCashDiscountLabel(ticketPricing.cashDiscountPercentage)}
                                />
                                {group.items.map((item) => !ticketRepairNeedsDetail(item, subtotal.discountApplies) ? null : (
                                    <div key={`${item.key}-detalle`} className="mt-[3px]">
                                        {item.increments.map((payment) => (
                                            <TicketLine
                                                key={payment.id}
                                                label="INCREMENTO:"
                                                value={`${ticketIncrementLabel(payment.notes)} + ${formatCurrency(payment.amount)}`}
                                            />
                                        ))}
                                        {subtotal.discountApplies ? null : item.financial.discountApplies ? (
                                            <CashOfferBlock
                                                regularLabel={item.hasDeposits ? 'PRESUP. REGULAR:' : 'PRECIO REGULAR:'}
                                                cashLabel={ticketCashDiscountLabel(ticketPricing.cashDiscountPercentage)}
                                                regularAmount={item.financial.listTotal}
                                                cashAmount={item.financial.cashTotal}
                                            />
                                        ) : (
                                            item.canUseCompactPrice ? null : <TicketLine label={item.hasDeposits ? 'PRESUPUESTO:' : 'PRECIO:'} value={item.monto > 0 ? formatCurrency(item.financial.listTotal) : 'A PRESUPUESTAR'} />
                                        )}
                                        {item.deposits.map((payment) => (
                                            <TicketLine key={payment.id} label={`SEÑA ${paymentMethodLabel(payment)}:`} value={formatCurrency(payment.amount)} />
                                        ))}
                                        {item.hasDeposits ? <TicketLine label="SALDO:" value={item.monto > 0 ? listDueLabel(item.financial) : 'A DEFINIR'} /> : null}
                                        {item.hasDeposits && item.financial.discountApplies ? <TicketLine label="SALDO EFECTIVO HOY:" value={item.monto > 0 ? item.cashDueLabel : 'A DEFINIR'} /> : null}
                                        {ticket.repairs.length > 1 && !item.canUseCompactPrice ? <TicketLine label="SUBTOTAL TRABAJO:" value={item.monto > 0 ? formatCurrency(item.financial.cashTotal) : 'A PRESUPUESTAR'} /> : null}
                                        {item.deliveredLabel !== null ? <TicketLine label="ENTREGA:" value={item.deliveredLabel} /> : null}
                                    </div>
                                ))}
                            </div>
                            );
                        })}
                    </section>

                    {ticket.repairs.length > 1 ? (
                        <>
                            <div className="my-[5px] border-t border-dashed border-black" />
                            {generalFinancial.discountApplies ? (
                                <CashOfferBlock
                                    regularLabel={generalFinancial.paidActual > 0 ? 'SALDO GRAL. REGULAR:' : 'TOTAL GRAL. REGULAR:'}
                                    cashLabel={ticketCashDiscountLabel(ticketPricing.cashDiscountPercentage)}
                                    regularAmount={generalFinancial.listDue}
                                    cashAmount={generalFinancial.cashDue}
                                    className="mt-[4px] text-[13px]"
                                />
                            ) : (
                                <div className="mt-[4px] flex justify-between gap-[5px] text-[13px]">
                                    <span>{generalFinancial.paidActual > 0 ? 'SALDO GENERAL:' : 'TOTAL GENERAL:'}</span>
                                    <strong>{formatCurrency(generalFinancial.listDue)}</strong>
                                </div>
                            )}
                        </>
                    ) : null}

                    <footer className="mt-[6px] text-center text-[10.5px] leading-[1.15]">
                        <div>CONSULTA EL ESTADO DE TU REPARACION EN LINEA</div>
                        <div className="mt-[6px] inline-block border border-black bg-white p-[5px]">
                            {qrUrl !== '' ? <img src={qrUrl} alt={`QR orden ${ticket.id}`} className="mx-auto block h-[116px] w-[116px]" /> : null}
                        </div>
                        <div className="mt-[6px] break-all">sudokumerlo.com/reparacion</div>
                        <div className="mt-[6px]">VERIFICAR EL EQUIPO AL MOMENTO DE RETIRARLO.</div>
                        <div className="mt-[6px]">CONSERVAR ESTE TICKET. EN CASO DE EXTRAVIO, EL EQUIPO SOLO PODRA SER RETIRADO PRESENTANDO EL DNI FISICO DEL TITULAR.</div>
                    </footer>

                </main>
            </div>
        </>
    );
}

function normalizeTicketText(value?: string | null): string {
    return (value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function cashDiscountApplies(cashAmount: number, pricing: TicketPricingSettings): boolean {
    return pricing.cashDiscountEnabled && pricing.cashDiscountPercentage > 0 && cashAmount > pricing.cashDiscountThreshold;
}

function listAmount(cashAmount: number, discountApplies: boolean, pricing: TicketPricingSettings): number {
    return discountApplies ? Math.round(Math.max(0, cashAmount) * (1 + pricing.cashDiscountPercentage / 100)) : Math.max(0, cashAmount);
}

function listDueLabel(financial: ReturnType<typeof repairFinancialSummary>): string {
    return financial.listDue <= 0 ? 'PAGADO' : formatCurrency(financial.listDue);
}

function paymentMethod(payment: RepairPaymentView): 'efectivo' | 'transferencia' {
    return payment.method === 'transferencia' ? 'transferencia' : 'efectivo';
}

function paymentMethodLabel(payment: RepairPaymentView): string {
    return paymentMethod(payment) === 'transferencia' ? 'TRANSF.' : 'EFECTIVO';
}

function paymentCashEquivalent(payment: RepairPaymentView, discountApplies: boolean, pricing: TicketPricingSettings): number {
    const amount = Math.max(0, Number(payment.amount ?? 0));

    return discountApplies && paymentMethod(payment) === 'transferencia' ? amount / (1 + pricing.cashDiscountPercentage / 100) : amount;
}

function repairFinancialSummary(repair: RepairOrderView, pricing: TicketPricingSettings): { cashTotal: number; listTotal: number; paidActual: number; cashDue: number; listDue: number; discountApplies: boolean } {
    const cashTotal = Math.max(0, Number(repair.monto ?? 0));
    const discountApplies = cashDiscountApplies(cashTotal, pricing);
    const deposits = (repair.payments ?? []).filter((payment) => payment.payment_type === 'senia');
    const paidActual = deposits.reduce((total, payment) => total + Math.max(0, Number(payment.amount ?? 0)), 0);
    const paidCashEquivalent = deposits.reduce((total, payment) => total + paymentCashEquivalent(payment, discountApplies, pricing), 0);
    const cashDue = Math.max(0, cashTotal - paidCashEquivalent);

    return {
        cashTotal,
        listTotal: listAmount(cashTotal, discountApplies, pricing),
        paidActual,
        cashDue,
        listDue: listAmount(cashDue, discountApplies, pricing),
        discountApplies,
    };
}

function ticketFinancialSummary(repairs: RepairOrderView[], pricing: TicketPricingSettings): { cashDue: number; listDue: number; paidActual: number; discountApplies: boolean } {
    const cashTotal = repairs.reduce((total, repair) => total + Math.max(0, Number(repair.monto ?? 0)), 0);
    const discountApplies = cashDiscountApplies(cashTotal, pricing);
    const deposits = repairs.flatMap((repair) => repair.payments ?? []).filter((payment) => payment.payment_type === 'senia');
    const paidActual = deposits.reduce((total, payment) => total + Math.max(0, Number(payment.amount ?? 0)), 0);
    const paidCashEquivalent = deposits.reduce((total, payment) => total + paymentCashEquivalent(payment, discountApplies, pricing), 0);
    const cashDue = Math.max(0, cashTotal - paidCashEquivalent);

    return {
        cashDue,
        listDue: listAmount(cashDue, discountApplies, pricing),
        paidActual,
        discountApplies,
    };
}

const ticketKnownBrands = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG'];

function ticketRepairBrand(repair: RepairOrderView): string {
    const storedBrand = normalizeTicketText(repair.marca);
    if (storedBrand !== '') return storedBrand;

    const normalizedModel = normalizeTicketText(repair.modelo);
    const normalizedFailure = normalizeTicketText(repair.descripcion);

    return ticketKnownBrands.find((brand) => {
        if (normalizedFailure === brand || normalizedFailure.endsWith(` ${brand}`)) return true;
        return normalizedModel !== '' && normalizedFailure.endsWith(` ${brand} ${normalizedModel}`);
    }) ?? '';
}

function ticketRepairModel(repair: RepairOrderView): string {
    const model = (repair.modelo ?? '').trim();
    const brand = ticketRepairBrand(repair);

    if (model === '') return brand || 'SIN MODELO';

    const normalizedModel = normalizeTicketText(model);
    if (brand === '' || normalizedModel === brand || normalizedModel.startsWith(`${brand} `)) {
        return model;
    }

    return `${brand} ${model}`;
}

function ticketRepairFailure(repair: RepairOrderView, displayModel: string): string {
    let failure = (repair.descripcion ?? '').trim();
    const brand = ticketRepairBrand(repair);
    const model = (repair.modelo ?? '').trim();
    const tokens = [displayModel, brand && model ? `${brand} ${model}` : '', model, brand]
        .map((token) => token.trim())
        .filter((token, index, tokensList) => token !== '' && tokensList.indexOf(token) === index)
        .sort((left, right) => right.length - left.length);

    tokens.forEach((token) => {
        const normalizedToken = normalizeTicketText(token);
        const normalizedFailure = normalizeTicketText(failure);

        if (normalizedFailure === normalizedToken) {
            failure = '';
            return;
        }

        if (normalizedFailure.endsWith(` ${normalizedToken}`)) {
            failure = failure.slice(0, Math.max(0, failure.length - token.length)).trim();
        }
    });

    return failure || 'SIN DESCRIPCION';
}

function ticketIncrementLabel(value?: string | null): string {
    const label = (value ?? '').trim();

    return label !== '' ? label.toUpperCase() : 'ADICIONAL';
}

function formatDeliveredTicketDate(value?: string | null): string {
    if (!value) {
        return 'Entregado';
    }

    const [year, month, day] = value.split('-');

    if (!year || !month || !day) {
        return 'Entregado';
    }

    return `Entregado el ${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year.slice(-2)}`;
}

function ticketDiscountPercentageLabel(value: number): string {
    const normalized = Math.max(0, Number(value ?? 0));

    return Number.isInteger(normalized) ? `${normalized}%` : `${normalized.toFixed(1).replace('.', ',')}%`;
}

function ticketCashDiscountLabel(value: number): string {
    return `EFECTIVO ${ticketDiscountPercentageLabel(value)} DESC.:`;
}

function ticketRepairGroupSubtotal(
    items: Array<{ monto: number; financial: ReturnType<typeof repairFinancialSummary> }>,
    pricing: TicketPricingSettings,
): { cashLabel: string; listLabel: string; discountApplies: boolean } {
    if (items.some((item) => item.monto <= 0)) {
        return {
            cashLabel: 'A PRESUPUESTAR',
            listLabel: 'A PRESUPUESTAR',
            discountApplies: false,
        };
    }

    const cashSubtotal = items.reduce((total, item) => total + item.financial.cashTotal, 0);
    const discountApplies = cashDiscountApplies(cashSubtotal, pricing);

    return {
        cashLabel: formatCurrency(cashSubtotal),
        listLabel: formatCurrency(listAmount(cashSubtotal, discountApplies, pricing)),
        discountApplies,
    };
}

function ticketRepairLinePriceLabel(
    item: { monto: number; financial: ReturnType<typeof repairFinancialSummary>; compactPriceLabel: string },
    groupDiscountApplies: boolean,
    pricing: TicketPricingSettings,
): string {
    if (item.monto <= 0) {
        return item.compactPriceLabel;
    }

    return formatCurrency(listAmount(item.financial.cashTotal, groupDiscountApplies, pricing));
}

function ticketRepairNeedsDetail(
    item: {
        canUseCompactPrice: boolean;
        deliveredLabel: string | null;
        financial: ReturnType<typeof repairFinancialSummary>;
        hasDeposits: boolean;
        increments: RepairPaymentView[];
    },
    groupDiscountApplies: boolean,
): boolean {
    return item.increments.length > 0
        || item.hasDeposits
        || item.deliveredLabel !== null
        || (!groupDiscountApplies && !item.canUseCompactPrice)
        || (!groupDiscountApplies && item.financial.discountApplies);
}

function TicketLine({ label, value, strongClassName = '', variant = 'default' }: { label: string; value: string; strongClassName?: string; variant?: 'default' | 'highlight' }): JSX.Element {
    if (variant === 'highlight') {
        return (
            <div className="my-[4px] flex items-center justify-between gap-[5px] border-2 border-black bg-white px-[5px] py-[4px] text-black print:border-black print:bg-white print:text-black">
                <span className="shrink-0 text-[18px] font-black leading-none text-black print:text-black">ORDEN:</span>
                <strong className="break-words text-right text-[19px] font-black leading-none text-black print:text-black">{value}</strong>
            </div>
        );
    }

    return (
        <div className="mb-px flex items-baseline justify-between gap-[5px]">
            <span className="shrink-0">{label}</span>
            <strong className={`break-words text-right ${strongClassName}`}>{value}</strong>
        </div>
    );
}

function TicketRepairGroupSummary({
    label,
    model,
    items,
    subtotal,
    showRegularSubtotal,
    discountLabel,
}: {
    label: string;
    model: string;
    items: Array<{ key: string; failure: string; price: string | null }>;
    subtotal: { cashLabel: string; listLabel: string; discountApplies: boolean } | null;
    showRegularSubtotal: boolean;
    discountLabel: string;
}): JSX.Element {
    return (
        <div className="mb-[3px] grid gap-px">
            <div className="text-[12px] leading-[1.15]">{label}</div>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[5px]">
                <span className="text-[12px] leading-[1.15]">MODELO:</span>
                <strong className="min-w-0 break-words text-right text-[12px] leading-[1.15]">{model}</strong>
            </div>
            <div className="text-[12px] leading-[1.15]">FALLAS:</div>
            <div className="grid gap-px">
                {items.map((item) => (
                    <div key={item.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[6px]">
                        <strong className="min-w-0 break-words text-[12px] leading-[1.15]">{item.failure}</strong>
                        {item.price !== null ? <strong className="whitespace-nowrap text-right text-[12px] leading-[1.15]">{item.price}</strong> : null}
                    </div>
                ))}
            </div>
            {subtotal !== null ? (
                <div className="mt-px grid gap-px border-t border-dashed border-black pt-[2px]">
                    {subtotal.discountApplies ? (
                        <>
                            {showRegularSubtotal ? (
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[6px]">
                                    <span className="text-[12px] leading-[1.15]">SUBTOTAL REGULAR:</span>
                                    <strong className="whitespace-nowrap text-right text-[12px] leading-[1.15]">{subtotal.listLabel}</strong>
                                </div>
                            ) : null}
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[6px]">
                                <span className="text-[12px] leading-[1.15]">{discountLabel}</span>
                                <strong className="whitespace-nowrap text-right text-[12px] leading-[1.15]">{subtotal.cashLabel}</strong>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-[6px]">
                            <span className="text-[12px] leading-[1.15]">SUBTOTAL MODELO:</span>
                            <strong className="whitespace-nowrap text-right text-[12px] leading-[1.15]">{subtotal.cashLabel}</strong>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function CashOfferBlock({
    regularLabel,
    cashLabel,
    regularAmount,
    cashAmount,
    className = '',
}: {
    regularLabel: string;
    cashLabel: string;
    regularAmount: number;
    cashAmount: number;
    className?: string;
}): JSX.Element {
    return (
        <div className={`my-[3px] border-y border-dashed border-black py-[3px] ${className}`}>
            <TicketLine label={regularLabel} value={formatCurrency(regularAmount)} />
            <TicketLine label={cashLabel} value={formatCurrency(cashAmount)} strongClassName="text-[13px]" />
        </div>
    );
}
