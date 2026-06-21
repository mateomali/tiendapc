import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import type { RepairOrderView, RepairTicketView } from '../../types';
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
    returnUrl: string;
}

export default function TicketPage({ ticket, summary, businessHours, returnUrl }: TicketPageProps): JSX.Element {
    const [qrUrl, setQrUrl] = useState<string>('');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', hour12: false, minute: '2-digit' });
    const hasClientDni = ticket.hasClientDni ?? (Number(ticket.dni) > 0 && Number(ticket.dni) !== 12345678);
    const trackingVerifier = ticket.trackingVerifier || String(ticket.dni);
    const hasIncrements = ticket.repairs.some((repair) => (repair.payments ?? []).some((payment) => payment.payment_type === 'incremento'));

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

    return (
        <>
            <Head title={`Ticket #${ticket.id}`} />

            <div className="min-h-screen bg-[linear-gradient(180deg,#eef5ff,#f8fbff)] px-3 py-3 text-black print:w-[80mm] print:bg-white print:p-0">
                <div className="mx-auto mb-2 flex w-[80mm] flex-wrap justify-center gap-1.5 print:hidden">
                    <Link href={returnUrl} className={buttonClass('soft', 'sm')}>
                        Volver
                    </Link>
                    <button type="button" className={buttonClass('primary', 'sm')} onClick={() => window.print()}>
                        Imprimir
                    </button>
                    {ticket.whatsappUrl ? (
                        <a href={ticket.whatsappUrl} className={buttonClass('soft', 'sm')} target="_blank" rel="noreferrer">
                            Enviar
                        </a>
                    ) : null}
                </div>

                <main className="mx-auto w-[80mm] rounded-[10px] border border-[#dbe7f6] bg-white px-[5px] py-[7px] font-[Arial,Helvetica,sans-serif] text-[12px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-black shadow-[0_16px_34px_rgba(15,23,42,0.16)] print:mx-auto print:w-[80mm] print:rounded-none print:border-0 print:px-[4mm] print:pt-[4mm] print:pb-[6mm] print:shadow-none">
                    <div className="hidden print:block print:h-[4mm]" />

                    <header className="text-center">
                        <div className="text-[17px] font-black leading-[1.05] tracking-[0.04em]">SUDOKU</div>
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
                        <TicketLine label="ORDEN N:" value={`#${ticket.id}`} />
                        <TicketLine label="CLIENTE:" value={ticket.nombre_cliente} />
                        {hasClientDni ? <TicketLine label="DNI:" value={String(ticket.dni)} /> : <TicketLine label="CODIGO:" value={trackingVerifier} />}
                        <TicketLine label="FECHA:" value={fecha} />
                        <TicketLine label="HORA:" value={hora} />
                    </section>

                    <div className="my-[5px] border-t border-dashed border-black" />

                    <section>
                        {ticket.repairs.map((repair, index) => {
                            const monto = Number(repair.monto ?? 0);
                            const senia = Number(repair.senia ?? 0);
                            const saldo = Math.max(0, monto - senia);
                            const saldoLabel = monto > 0 && senia >= monto ? 'PAGADO' : formatCurrency(saldo);
                            const deliveredLabel = repair.entregado === 'si' ? formatDeliveredTicketDate(repair.fecha_entregado) : null;
                            const modelLabel = ticketRepairModel(repair);
                            const failureLabel = ticketRepairFailure(repair, modelLabel);
                            const increments = (repair.payments ?? []).filter((payment) => payment.payment_type === 'incremento');

                            return (
                                <div key={`${repair.registro_id}-${repair.reparacion}`} className="border-b border-dashed border-black py-[3px] last:border-b-0">
                                    <div className="mb-[3px] text-[12px]">{ticket.repairs.length === 1 ? 'REPARACION' : `REPARACION ${index + 1}`}</div>
                                    <TicketLine label="MODELO:" value={modelLabel} />
                                    <div className="mb-px block">
                                        <span className="block">FALLA:</span>
                                        <strong className="mt-px block break-words text-left">{failureLabel}</strong>
                                    </div>
                                    {increments.map((payment) => (
                                        <TicketLine
                                            key={payment.id}
                                            label="INCREMENTO:"
                                            value={`${ticketIncrementLabel(payment.notes)} + ${formatCurrency(payment.amount)}`}
                                        />
                                    ))}
                                    {senia > 0 ? (
                                        <>
                                            <TicketLine label="PRESUPUESTO:" value={monto > 0 ? formatCurrency(monto) : 'A PRESUPUESTAR'} />
                                            <TicketLine label="SEÑA:" value={formatCurrency(senia)} />
                                            <TicketLine label="SALDO:" value={monto > 0 ? saldoLabel : 'A DEFINIR'} />
                                        </>
                                    ) : (
                                        <TicketLine label="TOTAL:" value={monto > 0 ? formatCurrency(monto) : 'A PRESUPUESTAR'} />
                                    )}
                                    {deliveredLabel !== null ? (
                                        <TicketLine label="ENTREGA:" value={deliveredLabel} />
                                    ) : null}
                                </div>
                            );
                        })}
                    </section>

                    {ticket.repairs.length > 1 ? (
                        <>
                            <div className="my-[5px] border-t border-dashed border-black" />
                            <div className="mt-[4px] flex justify-between gap-[5px] text-[13px]">
                                <span>TOTAL GENERAL:</span>
                                <strong>{formatCurrency(summary.totalMonto)}</strong>
                            </div>
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

                    <div className="hidden print:block print:h-[22mm]" aria-hidden="true" />
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

function TicketLine({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="mb-px flex justify-between gap-[5px]">
            <span className="shrink-0">{label}</span>
            <strong className="break-words text-right">{value}</strong>
        </div>
    );
}
