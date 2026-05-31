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

export default function TicketPage({ sale }: TicketPageProps): JSX.Element {
    useEffect(() => {
        if (window.location.hash !== '#print') {
            return;
        }

        const key = `__sales_ticket_autoprint_done__:${window.location.pathname}${window.location.search}${window.location.hash}`;
        if (window.sessionStorage.getItem(key) === '1') {
            return;
        }

        window.sessionStorage.setItem(key, '1');
        const timeoutId = window.setTimeout(() => window.print(), 180);

        return () => window.clearTimeout(timeoutId);
    }, []);

    return (
        <AdminLayout title={sale.ticket_number_display}>
            <section className="mx-auto grid w-full max-w-4xl gap-4 print:max-w-none print:p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-sky-100 bg-white/90 p-4 shadow-sm print:hidden">
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
                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => window.print()}>
                            Guardar PDF
                        </button>
                    </div>
                </div>

                <article className="mx-auto w-[80mm] bg-white p-[4mm] text-black shadow-[0_18px_40px_rgba(15,23,42,0.16)] print:absolute print:left-0 print:top-0 print:m-0 print:w-[80mm] print:shadow-none">
                    <header className="grid justify-items-center gap-1 text-center">
                        <strong className="text-[12px] font-black uppercase leading-tight">SUDOKU JUGUETERIA & ELECTRONICA</strong>
                        <span className="text-[10px] leading-tight">AV. Jose de San Martin 2658.</span>
                        <span className="mt-1 text-[11px] font-black uppercase">Ticket de venta</span>
                    </header>

                    <div className="my-2 border-t border-dashed border-black" />

                    <div className="grid gap-1 text-[10px]">
                        <p className="flex justify-between gap-2">
                            <span>Ticket: </span>
                            <strong>#{sale.ticket_number_display}</strong>
                        </p>
                        <p className="flex justify-between gap-2">
                            <span>Fecha: </span>
                            <strong>{sale.issued_at ?? '-'}</strong>
                        </p>
                        <p className="flex justify-between gap-2">
                            <span>Cliente: </span>
                            <strong className="text-right">{sale.customer_label}</strong>
                        </p>
                    </div>

                    <div className="my-2 border-t border-dashed border-black" />

                    <div className="grid gap-1">
                        <div className="flex justify-between text-[10px] font-black uppercase">
                            <span>Detalle</span>
                            <span>Importe</span>
                        </div>
                        {sale.items.map((item) => (
                            <div key={item.id} className="grid gap-0.5 py-1 text-[10px]">
                                <strong className="leading-tight">{item.product_name_snapshot}</strong>
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[10px]">
                                    <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                                    <strong className="whitespace-nowrap text-right text-[11px] font-black">{formatCurrency(item.line_total)}</strong>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="my-2 border-t border-dashed border-black" />

                    <footer className="grid gap-1 text-[10px]">
                        <p className="flex justify-between">
                            <span>Productos totales: </span>
                            <strong>{sale.items.length}</strong>
                        </p>
                        <table className="w-full border-t border-black pt-1 text-[15px] font-black" style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                            <tbody>
                                <tr>
                                    <td className="pt-1 uppercase" style={{ width: '40%' }}>Total</td>
                                    <td className="whitespace-nowrap pt-1 text-[17px]" style={{ width: '60%', textAlign: 'right' }}>{formatCurrency(sale.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                        {sale.notes ? (
                            <div className="mt-1">
                                <strong>Observaciones</strong>
                                <p>{sale.notes}</p>
                            </div>
                        ) : null}
                        <div className="my-1 border-t border-dashed border-black" />
                        <p className="text-center font-bold">Gracias por su compra.</p>
                        <p className="text-center text-[9px] font-black uppercase">Conservar ticket para cambios</p>
                    </footer>
                </article>
            </section>
        </AdminLayout>
    );
}
