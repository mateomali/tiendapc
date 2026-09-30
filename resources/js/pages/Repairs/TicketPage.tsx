import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import { normalizePartAccessories, partAccessoriesLabel } from '../../components/RepairPartAccessoriesFields';
import type { RepairOrderView, RepairTicketView } from '../../types';
import { repairButtonClass as buttonClass } from '../../repairUi';
import { formatCurrency } from '../../utils';
import { repairFinancialSummary, ticketFinancialSummary, type TicketPricingSettings } from '../../repairPricing';

interface TicketPageProps {
    ticket: RepairTicketView;
    summary: {
        totalMonto: number;
        totalSenia: number;
        saldo: number;
    };
    businessHours: string;
    ticketPricing: TicketPricingSettings;
    ticketMode?: 'intake' | 'delivery';
    returnUrl: string;
}

export default function TicketPage({ ticket, businessHours, ticketPricing, ticketMode = 'intake', returnUrl }: TicketPageProps): JSX.Element {
    const [qrUrl, setQrUrl] = useState<string>('');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', hour12: false, minute: '2-digit' });
    const isDeliveryTicket = ticketMode === 'delivery';
    const trackingVerifier = ticket.trackingVerifier || String(ticket.dni);
    const hasIncrements = ticket.repairs.some((repair) => (repair.payments ?? []).some((payment) => payment.payment_type === 'incremento'));
    const generalFinancial = ticketFinancialSummary(ticket.repairs, ticketPricing);
    const deliveryPaidInCash = ticket.repairs.every((repair) => repair.deliveryPaymentMode === 'cash');
    const deliveryPaidAmount = ticket.repairs.reduce((sum, repair) => {
        const financial = repairFinancialSummary(repair, ticketPricing);
        const due = repair.deliveryPaymentMode === 'cash' ? financial.cashDue : financial.listDue;
        return sum + financial.paidActual + due;
    }, 0);
    const deliveryPaidLabel = formatCurrency(deliveryPaidAmount);
    const deliveryPaidTitle = deliveryPaidInCash ? 'ABONADO EN EFECTIVO:' : 'TOTAL ABONADO:';
    const repairPrintItems = ticket.repairs.map((repair, index) => {
        const monto = Number(repair.monto ?? 0);
        const financial = repairFinancialSummary(repair, ticketPricing);
        const modelLabel = ticketRepairModel(repair);
        const failureLabel = ticketRepairFailure(repair, modelLabel);
        const accessories = normalizePartAccessories(repair.repuesto_agregados);
        const accessoriesLabel = partAccessoriesLabel(repair.repuesto_agregados, repair.repuesto_agregado_otro);
        const showAccessoriesPrefix = !(accessories.length === 1 && accessories[0] === 'sin_porta_chip');
        const isCancelled = repair.estado === 'CANCELADA';
        const increments = (repair.payments ?? []).filter((payment) => payment.payment_type === 'incremento');
        const deposits = isCancelled ? [] : (repair.payments ?? []).filter((payment) => payment.payment_type === 'senia' && Number(payment.amount ?? 0) > 0);
        const depositTotal = deposits.reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

        return {
            repair,
            index,
            number: index + 1,
            key: `${repair.registro_id}-${repair.reparacion}`,
            modelLabel,
            modelKey: normalizeTicketText(modelLabel),
            failureLabel,
            accessoriesLabel,
            showAccessoriesPrefix,
            monto,
            financial,
            isCancelled,
            depositTotal,
            isPaid: !isCancelled && monto > 0 && (financial.cashDue <= 0 || financial.listDue <= 0),
            deliveredLabel: repair.entregado === 'si' ? formatDeliveredTicketDate(repair.fecha_entregado) : null,
            increments,
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
    const hasActiveRepairs = repairPrintItems.some((item) => !item.isCancelled);
    const hasPendingBudgets = repairPrintItems.some((item) => !item.isCancelled && item.monto <= 0);
    const hasOutstandingCashDiscount = repairPrintItems.some((item) => !item.isCancelled && !item.isPaid && item.financial.discountApplies);
    const allRepairsPendingBudget = hasActiveRepairs && repairPrintItems.filter((item) => !item.isCancelled).every((item) => item.monto <= 0);
    const isSimpleSingleRepair = repairPrintGroups.length === 1 && repairPrintGroups[0]?.items.length === 1;
    const isFullyPaid = hasActiveRepairs && !hasPendingBudgets && (generalFinancial.cashDue <= 0 || generalFinancial.listDue <= 0);
    const shouldShowFinancialSummary = hasActiveRepairs && !allRepairsPendingBudget && (isFullyPaid || !isSimpleSingleRepair || generalFinancial.paidActual > 0 || hasPendingBudgets);

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

    useEffect(() => {
        if (typeof window === 'undefined' || window.location.hash !== '#print') {
            return;
        }

        window.requestAnimationFrame(() => window.print());
    }, []);

    const printTicket = (): void => {
        window.requestAnimationFrame(() => window.print());
    };

    return (
        <>
            <Head title={`${isDeliveryTicket ? 'Comprobante entrega' : 'Ticket'} #${ticket.id}`} />
            <div className="min-h-screen bg-[linear-gradient(180deg,#eef5ff,#f8fbff)] px-3 py-3 text-black print:h-auto print:min-h-0 print:w-[80mm] print:bg-white print:p-0">
                <div className="mx-auto mb-2 flex w-[80mm] flex-wrap justify-center gap-1.5 print:hidden">
                    <Link href={returnUrl} className={buttonClass('soft', 'sm')}>
                        Volver
                    </Link>
                    <button type="button" className={buttonClass('primary', 'sm')} onClick={printTicket}>
                        {isDeliveryTicket ? 'Imprimir comprobante' : 'Imprimir'}
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
                        <div className="mb-[3px] text-[12px]">{isDeliveryTicket ? 'COMPROBANTE DE ENTREGA' : hasIncrements ? 'TICKET ACTUALIZADO' : 'COMPROBANTE DE INGRESO'}</div>
                        {!isDeliveryTicket ? <TicketLine label="ORDEN N:" value={`#${ticket.id}`} variant="highlight" /> : null}
                        <TicketLine label="CLIENTE:" value={ticket.nombre_cliente} />
                        {!ticket.hasClientDni ? <TicketLine label="CODIGO:" value={trackingVerifier} /> : null}
                        {!isDeliveryTicket ? <TicketLine label="FECHA DE INGRESO:" value={formatIntakeDate(ticket.fecha)} /> : null}
                        {isDeliveryTicket || formatIntakeDate(ticket.fecha) !== fecha ? <TicketLine label={isDeliveryTicket ? 'FECHA:' : 'IMPRESION:'} value={fecha} /> : null}
                        {isDeliveryTicket ? <TicketLine label="HORA:" value={hora} /> : null}
                    </section>

                    <div className="my-[5px] border-t border-dashed border-black" />

                    <section>
                        {repairPrintGroups.map((group, groupIndex) => {
                            const activeItems = group.items.filter((item) => !item.isCancelled);
                            const outstandingItems = activeItems.filter((item) => !item.isPaid);
                            const normalSubtotal = outstandingItems.reduce((total, item) => total + item.financial.listDue, 0);
                            const cashSubtotal = outstandingItems.reduce((total, item) => total + item.financial.cashDue, 0);
                            const groupHasCashDiscount = outstandingItems.some((item) => item.financial.discountApplies);
                            const groupHasPendingBudget = activeItems.some((item) => item.monto <= 0);

                            return (
                            <div key={`${group.key}-${group.items[0]?.key ?? 'grupo'}`} className={`${groupIndex > 0 ? 'mt-[4px] border-t-2 border-black pt-[5px]' : ''} pb-[3px]`}>
                                <TicketRepairGroupSummary
                                    label={`EQUIPO ${groupIndex + 1}${repairPrintGroups.length > 1 ? ` DE ${repairPrintGroups.length}` : ''}`}
                                    model={group.modelLabel}
                                    items={group.items.map((item) => ({
                                        key: item.key,
                                        number: group.items.indexOf(item) + 1,
                                        failure: item.failureLabel,
                                        accessories: item.accessoriesLabel,
                                        showAccessoriesPrefix: item.showAccessoriesPrefix,
                                        normalAmount: item.monto <= 0 ? 'A PRESUPUESTAR' : formatCurrency(item.financial.listTotal),
                                        cashAmount: item.monto > 0 && item.financial.discountApplies ? formatCurrency(item.financial.cashTotal) : null,
                                        depositAmount: item.depositTotal > 0 ? formatCurrency(item.depositTotal) : null,
                                        remainingAmount: item.depositTotal > 0 && !item.isPaid ? formatCurrency(item.financial.discountApplies ? item.financial.cashDue : item.financial.listDue) : null,
                                        isPaid: item.isPaid,
                                        isCancelled: item.isCancelled,
                                    }))}
                                    normalSubtotal={groupHasPendingBudget ? 'A PRESUPUESTAR' : formatCurrency(normalSubtotal)}
                                    cashSubtotal={groupHasCashDiscount && !groupHasPendingBudget ? formatCurrency(cashSubtotal) : null}
                                    showPrices={!isDeliveryTicket && !isFullyPaid}
                                    showSubtotal={!isFullyPaid && outstandingItems.length > 1}
                                    showCashPrice={!isSimpleSingleRepair && !isFullyPaid}
                                />
                                {!isDeliveryTicket ? group.items.map((item) => item.increments.length === 0 && item.deliveredLabel === null ? null : (
                                    <div key={`${item.key}-detalle`} className="mt-[3px]">
                                        {item.increments.map((payment) => <div key={payment.id} className="text-[11px]">ADICIONAL INCLUIDO: {ticketIncrementLabel(payment.notes)}</div>)}
                                        {item.deliveredLabel !== null ? <TicketLine label="ENTREGA:" value={item.deliveredLabel} /> : null}
                                    </div>
                                )) : null}
                            </div>
                            );
                        })}
                    </section>

                    {!isDeliveryTicket && shouldShowFinancialSummary ? (
                        <>
                            <div className="my-[5px] border-t border-dashed border-black" />
                            <section className="mt-[4px] grid gap-px">
                                {isFullyPaid ? (
                                    <>
                                        <TicketLine label="TOTAL ABONADO:" value={formatCurrency(generalFinancial.paidActual)} />
                                        <div className="mt-[2px] text-center text-[15px] font-black leading-none">PAGADO</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="mb-[2px] text-[12px]">RESUMEN DE LA ORDEN</div>
                                        <TicketLine label={hasOutstandingCashDiscount ? 'TOTAL PENDIENTE NORMAL:' : 'TOTAL PENDIENTE:'} value={generalFinancial.listDue <= 0 ? (hasPendingBudgets ? 'A DEFINIR' : 'PAGADO') : formatCurrency(generalFinancial.listDue)} />
                                        {hasPendingBudgets ? <div className="mt-[3px] text-[11px]">HAY TRABAJOS PENDIENTES DE PRESUPUESTO. LOS IMPORTES SON PARCIALES.</div> : null}
                                    </>
                                )}
                            </section>
                        </>
                    ) : null}

                    {!isDeliveryTicket && !isFullyPaid && generalFinancial.discountApplies ? (
                        <CashPromoBanner
                            note={ticketPricing.cashDiscountNote}
                            percentage={ticketPricing.cashDiscountPercentage}
                            cashDue={generalFinancial.cashDue}
                            partial={hasPendingBudgets}
                        />
                    ) : null}

                    {isDeliveryTicket ? (
                        <>
                            <div className="my-[5px] border-t border-dashed border-black" />
                            <section className="grid gap-px text-[13px]">
                                <TicketLine label={deliveryPaidTitle} value={deliveryPaidLabel} />
                            </section>
                        </>
                    ) : null}


                    <footer className="mt-[6px] text-center text-[10.5px] leading-[1.15]">
                        {isDeliveryTicket ? (
                            <>
                                <div>COMPROBANTE DEL TRABAJO REALIZADO.</div>
                                <div className="mt-[6px]">EL CLIENTE RETIRA EL EQUIPO Y DECLARA RECIBIRLO EN CONFORMIDAD.</div>
                                <div className="mt-[6px]">VERIFICAR EL EQUIPO AL MOMENTO DE RETIRARLO.</div>
                                <div className="mt-[6px]">CONSERVAR ESTE COMPROBANTE PARA EFECTUAR LA GARANTIA DE SER NECESARIO.</div>
                            </>
                        ) : (
                            <>
                                <div>CONSULTA EL ESTADO DE TU REPARACION EN LINEA</div>
                                <div className="mt-[6px] inline-block border border-black bg-white p-[5px]">
                                    {qrUrl !== '' ? <img src={qrUrl} alt={`QR orden ${ticket.id}`} className="mx-auto block h-[116px] w-[116px]" /> : null}
                                </div>
                                <div className="mt-[6px] break-all">sudokumerlo.com/reparacion</div>
                                <div className="mt-[6px]">VERIFICAR EL EQUIPO AL MOMENTO DE RETIRARLO.</div>
                                <div className="mt-[6px]">CONSERVAR ESTE TICKET. EN CASO DE EXTRAVIO, EL EQUIPO SOLO PODRA SER RETIRADO PRESENTANDO EL DNI FISICO DEL TITULAR.</div>
                            </>
                        )}
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

function formatIntakeDate(value?: string | null): string {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? `${match[3]}/${match[2]}/${match[1]}` : 'NO REGISTRADA';
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
            <span className="min-w-0">{label}</span>
            <strong className={`min-w-0 break-words text-right ${strongClassName}`}>{value}</strong>
        </div>
    );
}

function TicketCashLine({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="flex items-baseline justify-between gap-[5px] border-2 border-black px-[3px] py-px text-[11px] font-black leading-[1.1]">
            <span>{label}</span>
            <strong className="text-right text-[12px]">{value}</strong>
        </div>
    );
}

function CashPromoBanner({
    note,
    percentage,
    cashDue,
    partial = false,
}: {
    note: string;
    percentage: number;
    cashDue: number;
    partial?: boolean;
}): JSX.Element {
    const normalizedNote = note.trim() !== ''
        ? note.trim().toUpperCase()
        : `OFERTA EN EFECTIVO ${ticketDiscountPercentageLabel(percentage)} DE DESCUENTO`;

    return (
        <div className="my-[5px] border-2 border-black bg-white px-[5px] py-[4px] text-center leading-[1.1]">
            <div className="text-[12px] font-black">{normalizedNote}</div>
            <div className="mt-[3px] border-t border-dashed border-black pt-[3px]">
                <span className="block text-[10px]">{partial ? 'SALDO PARCIAL EN EFECTIVO' : 'SALDO PENDIENTE EN EFECTIVO'}</span>
                <strong className="block text-[17px] leading-none">{cashDue <= 0 ? 'PAGADO' : formatCurrency(cashDue)}</strong>
            </div>
        </div>
    );
}

function TicketRepairGroupSummary({
    label,
    model,
    items,
    normalSubtotal,
    cashSubtotal,
    showPrices,
    showSubtotal,
    showCashPrice,
}: {
    label: string;
    model: string;
    items: Array<{ key: string; number: number; failure: string; accessories: string; showAccessoriesPrefix: boolean; normalAmount: string; cashAmount: string | null; depositAmount: string | null; remainingAmount: string | null; isPaid: boolean; isCancelled: boolean }>;
    normalSubtotal: string;
    cashSubtotal: string | null;
    showPrices: boolean;
    showSubtotal: boolean;
    showCashPrice: boolean;
}): JSX.Element {
    return (
        <div className="mb-[3px] grid gap-px">
            <div className="grid gap-px border-b-2 border-black pb-[2px]">
                <div className="text-[12px] leading-[1.15]">{label}</div>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[5px]">
                    <span className="text-[12px] leading-[1.15]">MODELO:</span>
                    <strong className="min-w-0 break-words text-right text-[12px] leading-[1.15]">{model}</strong>
                </div>
            </div>
            <div className="pt-px text-[12px] leading-[1.15]">FALLAS:</div>
            <div className="grid gap-px">
                {items.map((item) => (
                    <div key={item.key} className="grid gap-px border-t border-dashed border-black pt-[2px] first:border-t-0 first:pt-0">
                        <div className="grid gap-px">
                            <strong className="min-w-0 break-words text-[12px] leading-[1.15]">{item.number}. {item.failure}</strong>
                        </div>
                        {item.accessories !== '' ? (
                            <div className="break-words text-[11px] leading-[1.15]">
                                {item.showAccessoriesPrefix ? 'INCLUYE: ' : ''}{item.accessories.toUpperCase()}
                            </div>
                        ) : null}
                        {item.isCancelled ? (
                            <div className="border-t border-dashed border-black pt-[2px] text-right text-[12px] font-black">CANCELADA</div>
                        ) : item.isPaid ? (
                            <div className="grid gap-px border-t border-dashed border-black pt-[2px] text-[11px] leading-[1.15]">
                                {item.depositAmount !== null ? <TicketLine label="MONTO ABONADO:" value={item.depositAmount} /> : null}
                                <div className="text-right text-[12px] font-black">PAGADO</div>
                            </div>
                        ) : showPrices ? (
                            <div className="grid gap-px border-t border-dashed border-black pt-[2px] text-[11px] leading-[1.15]">
                                <TicketLine label={item.cashAmount === null ? 'PRECIO:' : 'PRECIO NORMAL:'} value={item.normalAmount} />
                                {showCashPrice && item.cashAmount !== null ? <TicketCashLine label="EN EFECTIVO" value={item.cashAmount} /> : null}
                                {item.depositAmount !== null ? <TicketLine label="SEÑA ASIGNADA:" value={item.depositAmount} /> : null}
                                {item.remainingAmount !== null ? item.cashAmount !== null ? <TicketCashLine label="RESTANTE EFECTIVO" value={item.remainingAmount} /> : <TicketLine label="RESTANTE:" value={item.remainingAmount} /> : null}
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            {showPrices && showSubtotal ? (
                <div className="mt-px grid gap-px border-t-2 border-black pt-[2px] text-[11px]">
                    <TicketLine label="SUBTOTAL PENDIENTE:" value={normalSubtotal} />
                    {cashSubtotal !== null ? <TicketCashLine label="SUBTOTAL PENDIENTE EFECTIVO" value={cashSubtotal} /> : null}
                </div>
            ) : null}
        </div>
    );
}
