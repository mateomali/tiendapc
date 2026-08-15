import{l as e,o as t,r as n,t as r}from"./app-Yc8fgNKp.js";import{r as i}from"./utils-EtUx172I.js";import{t as a}from"./ui-KPlO6tn6.js";import{t as o}from"./AdminLayout-CLcMXbEY.js";var s=e(t(),1),c=r();function l({business:e,sale:t}){return(0,s.useEffect)(()=>{if(window.location.hash!==`#print`)return;let e=`__sales_ticket_autoprint_done__:${window.location.pathname}${window.location.search}${window.location.hash}`;if(window.sessionStorage.getItem(e)===`1`)return;window.sessionStorage.setItem(e,`1`);let t=window.setTimeout(()=>window.print(),450);return()=>window.clearTimeout(t)},[]),(0,c.jsxs)(o,{title:t.ticket_number_display,children:[(0,c.jsx)(`style`,{children:`
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }

                    html,
                    body,
                    #app {
                        width: 80mm;
                        min-width: 80mm;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    .sales-pos-page {
                        width: 80mm !important;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .sales-pos-ticket {
                        width: 80mm !important;
                        min-width: 80mm !important;
                        height: auto !important;
                        min-height: 0 !important;
                        margin: 0 !important;
                        padding: 3mm 4mm 2mm !important;
                        box-shadow: none !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                    }

                    .sales-pos-avoid-break {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}),(0,c.jsxs)(`section`,{className:`sales-pos-page mx-auto grid w-full max-w-4xl gap-4 print:max-w-none print:p-0`,children:[(0,c.jsxs)(`div`,{className:`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-100 bg-white p-4 shadow-sm print:hidden`,children:[(0,c.jsxs)(`h1`,{className:`text-xl font-black text-ink-950`,children:[`Ticket de venta #`,t.ticket_number_display]}),(0,c.jsxs)(`div`,{className:`flex flex-wrap gap-2`,children:[(0,c.jsx)(n,{href:route(`admin.sales.index`),className:a(`soft`,`sm`),children:`Volver a ventas`}),(0,c.jsx)(n,{href:route(`admin.sales.create`),className:a(`soft`,`sm`),children:`Nueva venta`}),(0,c.jsx)(`button`,{type:`button`,className:a(`primary`,`sm`),onClick:()=>window.print(),children:`Imprimir`})]})]}),(0,c.jsxs)(`article`,{className:`sales-pos-ticket mx-auto w-[80mm] rounded-[10px] border border-[#dbe7f6] bg-white px-[5px] py-[7px] font-[Arial,Helvetica,sans-serif] text-[12px] font-bold uppercase leading-[1.2] tracking-[0.01em] text-black shadow-[0_16px_34px_rgba(15,23,42,0.16)] print:rounded-none print:border-0 print:px-[4mm] print:pt-[4mm] print:pb-[2mm] print:shadow-none`,children:[(0,c.jsx)(`div`,{className:`hidden print:block print:h-[4mm]`}),(0,c.jsxs)(`header`,{className:`text-center`,children:[(0,c.jsx)(`div`,{className:`text-[17px] font-black leading-[1.05] tracking-[0.04em]`,children:e.name}),(0,c.jsx)(`div`,{className:`text-[11px] leading-[1.15]`,children:e.address}),(0,c.jsxs)(`div`,{className:`mx-auto my-[3px] w-full border-t border-dashed border-black pt-[3px]`,children:[(0,c.jsx)(`span`,{className:`text-[10px] leading-[1.05]`,children:`WHATSAPP: `}),(0,c.jsx)(`strong`,{className:`text-[12.5px] leading-[1.05] tracking-[0.02em]`,children:e.whatsapp})]}),(0,c.jsxs)(`div`,{className:`mx-auto mt-[2px] max-w-[68mm] text-[9.5px] leading-[1.15]`,children:[`HORARIO DE ATENCION: `,e.hours]})]}),(0,c.jsx)(u,{}),(0,c.jsxs)(`section`,{children:[(0,c.jsx)(`div`,{className:`mb-[3px] text-[12px]`,children:`TICKET DE VENTA`}),(0,c.jsx)(d,{label:`TICKET:`,value:`#${t.ticket_number_display}`}),(0,c.jsx)(d,{label:`FECHA:`,value:t.issued_at??`-`}),(0,c.jsx)(d,{label:`CLIENTE:`,value:t.customer_label})]}),(0,c.jsx)(u,{}),(0,c.jsxs)(`section`,{children:[(0,c.jsxs)(`div`,{className:`mb-[3px] grid grid-cols-[1fr_21mm] gap-[5px] text-[12px]`,children:[(0,c.jsx)(`span`,{children:`Detalle`}),(0,c.jsx)(`span`,{className:`text-right`,children:`Importe`})]}),t.items.map(e=>(0,c.jsxs)(`div`,{className:`sales-pos-avoid-break border-b border-dashed border-black py-[3px] last:border-b-0`,children:[(0,c.jsx)(`strong`,{className:`block break-words leading-[1.15]`,children:e.product_name_snapshot}),e.product_sku_snapshot?(0,c.jsxs)(`span`,{className:`block text-[10.5px] leading-[1.15]`,children:[`SKU: `,e.product_sku_snapshot]}):null,(0,c.jsxs)(`div`,{className:`mt-px grid grid-cols-[1fr_21mm] items-start gap-[5px]`,children:[(0,c.jsxs)(`span`,{children:[e.quantity,` x `,i(e.unit_price)]}),(0,c.jsx)(`strong`,{className:`whitespace-nowrap text-right`,children:i(e.line_total)})]})]},e.id))]}),(0,c.jsx)(u,{}),(0,c.jsxs)(`footer`,{children:[(0,c.jsx)(d,{label:`ITEMS:`,value:String(t.items.reduce((e,t)=>e+t.quantity,0))}),(0,c.jsx)(`div`,{className:`mt-[4px] border-t border-black pt-[4px]`,children:(0,c.jsx)(d,{label:`TOTAL:`,value:i(t.total),strongClassName:`text-[13px]`})}),t.notes?(0,c.jsxs)(`div`,{className:`sales-pos-avoid-break mt-[5px]`,children:[(0,c.jsx)(`strong`,{children:`OBSERVACIONES:`}),(0,c.jsx)(`p`,{className:`break-words`,children:t.notes})]}):null,(0,c.jsx)(u,{}),(0,c.jsxs)(`div`,{className:`text-center text-[10.5px] leading-[1.15]`,children:[(0,c.jsx)(`div`,{children:`GRACIAS POR SU COMPRA`}),(0,c.jsx)(`div`,{className:`mt-[6px]`,children:`CONSERVAR TICKET PARA CAMBIOS.`})]})]})]})]})]})}function u(){return(0,c.jsx)(`div`,{className:`my-[5px] border-t border-dashed border-black`})}function d({label:e,value:t,strongClassName:n=``}){return(0,c.jsxs)(`div`,{className:`mb-px flex justify-between gap-[5px]`,children:[(0,c.jsx)(`span`,{className:`shrink-0`,children:e}),(0,c.jsx)(`strong`,{className:`break-words text-right ${n}`,children:t})]})}export{l as default};