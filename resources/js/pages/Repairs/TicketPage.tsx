import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toDataURL } from 'qrcode';
import type { RepairTicketView } from '../../types';
import { repairButtonClass as buttonClass } from '../../repairUi';
import { formatCurrency } from '../../utils';

interface TicketPageProps {
    ticket: RepairTicketView;
    summary: {
        totalMonto: number;
        totalSenia: number;
        saldo: number;
    };
    returnUrl: string;
}

export default function TicketPage({ ticket, summary, returnUrl }: TicketPageProps): JSX.Element {
    const [qrUrl, setQrUrl] = useState<string>('');
    const now = new Date();
    const fecha = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = now.toLocaleTimeString('es-AR', { hour: '2-digit', hour12: false, minute: '2-digit' });

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
            <style>{`
                @media print {
                    html, body {
                        width: 80mm;
                        margin: 0;
                        padding: 0;
                        background: #fff !important;
                    }
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    .ticket-toolbar {
                        display: none !important;
                    }
                    .thermal-ticket {
                        width: 80mm !important;
                        margin: 0 auto !important;
                        padding: 4mm 4mm 6mm !important;
                        box-shadow: none !important;
                    }
                    .print-top-gap {
                        display: block !important;
                        height: 4mm;
                    }
                    .ticket-cut-space {
                        display: block !important;
                        height: 22mm;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-[#f3f4f6] px-3 py-2 text-black">
                <div className="ticket-toolbar mx-auto mb-2 flex w-[80mm] flex-wrap justify-center gap-1.5">
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

                <main className="thermal-ticket mx-auto w-[80mm] bg-white px-[5px] py-[7px] font-[Arial,Helvetica,sans-serif] text-[12px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-black shadow-[0_10px_24px_rgba(15,23,42,0.16)]">
                    <div className="print-top-gap hidden" />

                    <header className="text-center">
                        <div className="text-[14px]">SUDOKU</div>
                        <div className="text-[11px] leading-[1.15]">AV. JOSE DE SAN MARTIN 2658 - MERLO</div>
                        <div className="text-[11px] leading-[1.15]">WHATSAPP: 1128974824</div>
                    </header>

                    <div className="my-[5px] border-t border-dashed border-black" />

                    <section>
                        <div className="mb-[3px] text-[12px]">COMPROBANTE DE INGRESO</div>
                        <TicketLine label="ORDEN N:" value={`#${ticket.id}`} />
                        <TicketLine label="CLIENTE:" value={ticket.nombre_cliente} />
                        <TicketLine label="DNI:" value={String(ticket.dni)} />
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

                            return (
                                <div key={`${repair.registro_id}-${repair.reparacion}`} className="border-b border-dashed border-black py-[3px] last:border-b-0">
                                    <div className="mb-[3px] text-[12px]">{ticket.repairs.length === 1 ? 'REPARACION' : `REPARACION ${index + 1}`}</div>
                                    <TicketLine label="MODELO:" value={repair.modelo || 'SIN MODELO'} />
                                    <div className="mb-px block">
                                        <span className="block">FALLA:</span>
                                        <strong className="mt-px block break-words text-left">{repair.descripcion || 'SIN DESCRIPCION'}</strong>
                                    </div>
                                    {senia > 0 ? (
                                        <>
                                            <TicketLine label="PRESUPUESTO:" value={monto > 0 ? formatCurrency(monto) : 'A PRESUPUESTAR'} />
                                            <TicketLine label="SENA:" value={formatCurrency(senia)} />
                                            <TicketLine label="SALDO:" value={monto > 0 ? saldoLabel : 'A DEFINIR'} />
                                        </>
                                    ) : (
                                        <TicketLine label="TOTAL:" value={monto > 0 ? formatCurrency(monto) : 'A PRESUPUESTAR'} />
                                    )}
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

                    <div className="ticket-cut-space hidden" aria-hidden="true" />
                </main>
            </div>
        </>
    );
}

function TicketLine({ label, value }: { label: string; value: string }): JSX.Element {
    return (
        <div className="mb-px flex justify-between gap-[5px]">
            <span className="shrink-0">{label}</span>
            <strong className="break-words text-right">{value}</strong>
        </div>
    );
}
