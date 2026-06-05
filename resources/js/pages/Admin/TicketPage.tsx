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

                <article className="sales-pos-ticket mx-auto w-[80mm] bg-white px-[4mm] py-[4mm] font-['Courier_New',monospace] text-[10px] font-bold leading-[1.16] text-black shadow-[0_12px_26px_rgba(15,23,42,0.14)] print:shadow-none">
                    <header className="grid justify-items-center gap-[1mm] text-center uppercase">
                        <strong className="max-w-[70mm] text-[13.5px] font-black leading-[1.08]">{business.name}</strong>
                        <span className="max-w-[70mm] text-[9px] leading-[1.12]">{business.address}</span>
                        <div className="my-[0.5mm] w-full border-t border-dashed border-black pt-[1mm]">
                            <span className="text-[9px] leading-[1.05]">WHATSAPP: </span>
                            <strong className="text-[11.5px] leading-[1.05] tracking-[0.02em]">{business.whatsapp}</strong>
                        </div>
                        <span className="max-w-[70mm] text-[8.5px] leading-[1.12]">HORARIO DE ATENCION: {business.hours}</span>
                        <span className="mt-[1mm] text-[11px] font-black">TICKET DE VENTA</span>
                    </header>

                    <Separator />

                    <div className="grid gap-[1mm] text-[9.5px] uppercase">
                        <p className="flex justify-between gap-[2mm]">
                            <span>Ticket: </span>
                            <strong>#{sale.ticket_number_display}</strong>
                        </p>
                        <p className="flex justify-between gap-[2mm]">
                            <span>Fecha: </span>
                            <strong>{sale.issued_at ?? '-'}</strong>
                        </p>
                        <p className="flex justify-between gap-[2mm]">
                            <span>Cliente: </span>
                            <strong className="max-w-[44mm] break-words text-right">{sale.customer_label}</strong>
                        </p>
                    </div>

                    <Separator />

                    <div className="grid gap-[1mm]">
                        <div className="grid grid-cols-[1fr_18mm] gap-[2mm] text-[9px] font-black uppercase">
                            <span>Detalle</span>
                            <span className="text-right">Importe</span>
                        </div>
                        {sale.items.map((item) => (
                            <div key={item.id} className="sales-pos-avoid-break grid gap-[0.5mm] py-[1mm] text-[9.5px]">
                                <strong className="break-words uppercase leading-[1.12]">{item.product_name_snapshot}</strong>
                                {item.product_sku_snapshot ? <span className="text-[8.5px] uppercase leading-[1.1]">SKU: {item.product_sku_snapshot}</span> : null}
                                <div className="grid grid-cols-[1fr_18mm] items-start gap-[2mm]">
                                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                    <strong className="whitespace-nowrap text-right text-[10px] font-black">{formatCurrency(item.line_total)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <footer className="grid gap-[1mm] text-[9.5px] uppercase">
                        <p className="flex justify-between gap-[2mm]">
                            <span>Items: </span>
                            <strong>{sale.items.reduce((total, item) => total + item.quantity, 0)}</strong>
                        </p>
                        <div className="mt-[1mm] border-t border-black pt-[1.5mm]">
                            <div className="grid grid-cols-[1fr_auto] items-baseline gap-[2mm] text-[15px] font-black">
                                <span>Total</span>
                                <strong className="whitespace-nowrap text-right text-[17px]">{formatCurrency(sale.total)}</strong>
                            </div>
                        </div>
                        {sale.notes ? (
                            <div className="sales-pos-avoid-break mt-[1mm] normal-case">
                                <strong>Observaciones</strong>
                                <p className="break-words">{sale.notes}</p>
                            </div>
                        ) : null}
                        <Separator />
                        <p className="text-center text-[10px] font-black">GRACIAS POR SU COMPRA</p>
                        <p className="text-center text-[8.5px] font-black">CONSERVAR TICKET PARA CAMBIOS</p>
                        <div className="h-[12mm]" aria-hidden="true" />
                    </footer>
                </article>
            </section>
        </AdminLayout>
    );
}

function Separator(): JSX.Element {
    return <div className="my-[2mm] border-t border-dashed border-black" />;
}
