import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass } from '../../ui';
import { formatCurrency } from '../../utils';
import { useEffect } from 'react';
import { Link } from '@inertiajs/react';

interface TicketItem {
    id: number;
    product_name_snapshot: string;
    product_sku_snapshot?: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
}

interface TicketPageProps {
    business: {
        name: string;
        address: string;
        whatsapp: string;
        hours: string;
    };
    sale: {
        id: number;
        ticket_number_display: string;
        customer_label: string;
        issued_at: string | null;
        subtotal: number;
        total: number;
        notes?: string | null;
        items: TicketItem[];
    };
}

export default function TicketPage({ business, sale }: TicketPageProps): JSX.Element {
    useEffect(() => {
        if (window.location.hash !== '#print') {
            return;
        }

        const key = `__sales_ticket_autoprint_done__:${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (window.sessionStorage.getItem(key) === '1') {
            return;
        }

        window.sessionStorage.setItem(key, '1');
        const timeoutId = window.setTimeout(() => window.print(), 450);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <AdminLayout title={sale.ticket_number_display}>
            <style>{`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    html,
                    body {
                        width: 80mm;
                        min-width: 80mm;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .sales-pos-page {
                        width: 80mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .sales-pos-ticket {
                        width: 80mm !important;
                        min-width: 80mm !important;
                        margin: 0 !important;
                        padding: 3mm 4mm 8mm !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                    }

                    .sales-pos-avoid-break {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <section className="sales-pos-page mx-auto grid w-full max-w-4xl gap-4 print:max-w-none print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 bg-white p-4 shadow-sm print:hidden">
                    <h1 className="text-xl font-black text-ink-950">Ticket de venta #{sale.ticket_number_display}</h1>
                    <div className="flex flex-wrap gap-2">
                        <Link href={route('admin.sales.index')} className={buttonClass('soft', 'sm')}>
                            Volver a ventas
                        </Link>
                        <Link href={route('admin.sales.create')} className={buttonClass('soft', 'sm')}>
                            Nueva venta
                        </Link>
                        <button type="button" className={buttonClass('primary', 'sm')} onClick={() => window.print()}>
                            Imprimir
                        </button>
                    </div>
                </div>

                <article className="sales-pos-ticket mx-auto w-[80mm] rounded-[10px] border border-[#dbe7f6] bg-white px-[5px] py-[7px] font-[Arial,Helvetica,sans-serif] text-[12px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-black shadow-[0_16px_34px_rgba(15,23,42,0.16)] print:rounded-none print:border-0 print:px-[4mm] print:pt-[4mm] print:pb-[6mm] print:shadow-none">
                    <div className="hidden print:block print:h-[4mm]" />

                    <header className="text-center">
                        <div className="text-[17px] font-black leading-[1.05] tracking-[0.04em]">{business.name}</div>
                        <div className="text-[11px] leading-[1.15]">{business.address}</div>
                        <div className="mx-auto my-[3px] w-full border-t border-dashed border-black pt-[3px]">
                            <span className="text-[10px] leading-[1.05]">WHATSAPP: </span>
                            <strong className="text-[12.5px] leading-[1.05] tracking-[0.02em]">{business.whatsapp}</strong>
                        </div>
                        <div className="mx-auto mt-[2px] max-w-[68mm] text-[9.5px] leading-[1.15]">HORARIO DE ATENCION: {business.hours}</div>
                    </header>

                    <Separator />

                    <section>
                        <div className="mb-[3px] text-[12px]">TICKET DE VENTA</div>
                        <TicketLine label="TICKET:" value={`#${sale.ticket_number_display}`} />
                        <TicketLine label="FECHA:" value={sale.issued_at ?? '-'} />
                        <TicketLine label="CLIENTE:" value={sale.customer_label} />
                    </section>

                    <Separator />

                    <section>
                        <div className="mb-[3px] grid grid-cols-[1fr_21mm] gap-[5px] text-[12px]">
                            <span>Detalle</span>
                            <span className="text-right">Importe</span>
                        </div>
                        {sale.items.map((item) => (
                            <div key={item.id} className="sales-pos-avoid-break border-b border-dashed border-black py-[3px] last:border-b-0">
                                <strong className="block break-words leading-[1.15]">{item.product_name_snapshot}</strong>
                                {item.product_sku_snapshot ? <span className="block text-[10.5px] leading-[1.15]">SKU: {item.product_sku_snapshot}</span> : null}
                                <div className="mt-px grid grid-cols-[1fr_21mm] items-start gap-[5px]">
                                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                    <strong className="whitespace-nowrap text-right">{formatCurrency(item.line_total)}</strong>
                                </div>
                            </div>
                        ))}
                    </section>

                    <Separator />

                    <footer>
                        <TicketLine label="ITEMS:" value={String(sale.items.reduce((total, item) => total + item.quantity, 0))} />
                        <div className="mt-[4px] border-t border-black pt-[4px]">
                            <TicketLine label="TOTAL:" value={formatCurrency(sale.total)} strongClassName="text-[13px]" />
                        </div>
                        {sale.notes ? (
                            <div className="sales-pos-avoid-break mt-[5px]">
                                <strong>OBSERVACIONES:</strong>
                                <p className="break-words">{sale.notes}</p>
                            </div>
                        ) : null}
                        <Separator />
                        <div className="text-center text-[10.5px] leading-[1.15]">
                            <div>GRACIAS POR SU COMPRA</div>
                            <div className="mt-[6px]">CONSERVAR TICKET PARA CAMBIOS.</div>
                        </div>
                        <div className="hidden print:block print:h-[22mm]" aria-hidden="true" />
                    </footer>
                </article>
            </section>
        </AdminLayout>
    );
}

function Separator(): JSX.Element {
    return <div className="my-[5px] border-t border-dashed border-black" />;
}

function TicketLine({ label, value, strongClassName = '' }: { label: string; value: string; strongClassName?: string }): JSX.Element {
    return (
        <div className="mb-px flex justify-between gap-[5px]">
            <span className="shrink-0">{label}</span>
            <strong className={`break-words text-right ${strongClassName}`}>{value}</strong>
        </div>
    );
}
