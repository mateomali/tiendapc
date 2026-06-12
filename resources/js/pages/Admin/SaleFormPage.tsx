import { Link, router } from '@inertiajs/react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaMinus, FaPlus, FaSearch, FaTimes, FaTrashAlt, FaVideo } from 'react-icons/fa';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';
import { cn, formatCurrency } from '../../utils';

interface ProductLookup {
    id: number;
    name: string;
    sku?: string | null;
    category_name?: string | null;
    price: number;
    image_url?: string | null;
    description_excerpt?: string | null;
    exact_sku_match?: boolean;
}

interface SaleItemForm {
    product_id: number | null;
    name: string;
    sku: string;
    category_name: string;
    image_url: string;
    quantity: number;
    unit_price: number;
    manual_name?: string;
}

interface ManualDraft {
    name: string;
    quantity: number;
    unit_price: number | '';
}

interface SaleFormPageProps {
    defaults: {
        customerLabel: string;
        issuedAtLabel: string;
    };
    features: {
        cameraScanner: boolean;
    };
    suggestedProducts: ProductLookup[];
    urls: {
        index: string;
        saveApi: string;
        productsApi: string;
    };
}

interface BarcodeDetectionResultLike {
    rawValue?: string;
}

interface BarcodeDetectorLike {
    detect(source: ImageBitmapSource): Promise<BarcodeDetectionResultLike[]>;
}

interface TicketAsideProps {
    customerLabel: string;
    issuedAtLabel: string;
    items: SaleItemForm[];
    saving: boolean;
    onCustomerLabelChange: (value: string) => void;
    onUpdateItem: (index: number, patch: Partial<SaleItemForm>) => void;
    onChangeQuantity: (index: number, delta: number) => void;
    onRemoveItem: (index: number) => void;
    onEmitTicket: () => void;
}

declare global {
    interface Window {
        BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike;
    }
}

function capitalizeFirstLetter(value: string, trimValue = true): string {
    const trimmedValue = trimValue ? value.trim() : value;

    if (trimmedValue === '') {
        return '';
    }

    return trimmedValue.charAt(0).toLocaleUpperCase('es-AR') + trimmedValue.slice(1);
}

export default function SaleFormPage({ defaults, features, suggestedProducts, urls }: SaleFormPageProps): JSX.Element {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<ProductLookup[]>(suggestedProducts);
    const [customerLabel, setCustomerLabel] = useState(defaults.customerLabel);
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<SaleItemForm[]>([]);
    const [scannerOpen, setScannerOpen] = useState(false);
    const [scannerStatus, setScannerStatus] = useState('Listo para buscar por nombre, SKU o camara.');
    const [feedback, setFeedback] = useState('');
    const [manualOpen, setManualOpen] = useState(false);
    const [manualDraft, setManualDraft] = useState<ManualDraft>({ name: '', quantity: 1, unit_price: 0 });
    const [saving, setSaving] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const searchRef = useRef<HTMLInputElement | null>(null);
    const searchReadyRef = useRef(false);
    const searchAbortRef = useRef<AbortController | null>(null);
    const searchSequenceRef = useRef(0);

    const csrfToken = useMemo(() => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '', []);
    const lastItemIndex = items.length - 1;

    const focusSearch = useCallback((): void => {
        searchRef.current?.focus();
        searchRef.current?.select();
    }, []);

    const addProduct = useCallback((product: ProductLookup): void => {
        setItems((current) => {
            const existing = current.find((item) => item.product_id === product.id);
            const productName = capitalizeFirstLetter(product.name);

            if (existing) {
                setFeedback(`Cantidad actualizada: ${productName}`);
                return current.map((item) => (item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
            }

            setFeedback(`Agregado: ${productName}`);
            return [
                ...current,
                {
                    product_id: product.id,
                    name: productName,
                    sku: product.sku ?? '',
                    category_name: product.category_name ?? '',
                    image_url: product.image_url ?? '',
                    quantity: 1,
                    unit_price: product.price,
                },
            ];
        });
        setSearch('');
        setProducts([]);
        window.setTimeout(focusSearch, 0);
    }, [focusSearch]);

    const searchProducts = useCallback(async (term: string, autoAddExact = false): Promise<ProductLookup[]> => {
        const cleanTerm = term.trim();

        if (cleanTerm === '') {
            searchAbortRef.current?.abort();
            searchSequenceRef.current += 1;
            setProducts([]);
            return [];
        }

        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;
        const searchSequence = searchSequenceRef.current + 1;
        searchSequenceRef.current = searchSequence;

        try {
            const response = await window.fetch(`${urls.productsApi}?q=${encodeURIComponent(cleanTerm)}`, {
                signal: controller.signal,
                headers: {
                    Accept: 'application/json',
                },
            });

            if (!response.ok || searchSequence !== searchSequenceRef.current) {
                return [];
            }

            const payload = (await response.json()) as { items?: ProductLookup[] };
            const nextProducts = payload.items ?? [];

            if (searchSequence !== searchSequenceRef.current) {
                return [];
            }

            setProducts(nextProducts);

            if (autoAddExact) {
                const exactMatch = nextProducts.find((product) => product.exact_sku_match);

                if (exactMatch) {
                    addProduct(exactMatch);
                    setScannerStatus(`SKU detectado: ${exactMatch.sku || exactMatch.name}. Producto agregado al ticket.`);
                } else {
                    setScannerStatus(`Se detecto ${cleanTerm}, pero no hubo coincidencia exacta por SKU.`);
                }
            }

            return nextProducts;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return [];
            }

            setFeedback('No se pudo buscar productos. Revisa la conexion e intenta nuevamente.');
            return [];
        }
    }, [addProduct, urls.productsApi]);

    async function searchOrAdd(): Promise<void> {
        const term = search.trim();
        const nextProducts = await searchProducts(term);
        const exactMatch = nextProducts.find((product) => product.exact_sku_match);

        if (exactMatch) {
            addProduct(exactMatch);
            setSearch('');
            focusSearch();
            return;
        }

        if (nextProducts.length === 1) {
            addProduct(nextProducts[0]);
            setSearch('');
            focusSearch();
        }
    }

    function addManualItem(): void {
        const manualUnitPrice = Number(manualDraft.unit_price);

        if (manualDraft.name.trim() === '' || manualUnitPrice <= 0) {
            setFeedback('Completa nombre y precio para el item manual.');
            return;
        }

        const manualName = capitalizeFirstLetter(manualDraft.name);

        setItems((current) => [
            ...current,
            {
                product_id: null,
                name: manualName,
                sku: '',
                category_name: 'Manual',
                image_url: '',
                quantity: Math.max(1, manualDraft.quantity),
                unit_price: Math.max(0, manualUnitPrice),
                manual_name: manualName,
            },
        ]);
        setFeedback(`Agregado manual: ${manualName}`);
        setManualDraft({ name: '', quantity: 1, unit_price: 0 });
        setManualOpen(false);
    }

    function changeManualQuantity(delta: number): void {
        setManualDraft((current) => ({
            ...current,
            quantity: Math.max(1, current.quantity + delta),
        }));
    }

    const updateItem = useCallback((index: number, patch: Partial<SaleItemForm>): void => {
        setItems((current) => current.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
    }, []);

    const changeQuantity = useCallback((index: number, delta: number): void => {
        setItems((current) =>
            current.map((entry, entryIndex) =>
                entryIndex === index ? { ...entry, quantity: Math.max(1, entry.quantity + delta) } : entry,
            ),
        );
    }, []);

    const removeItem = useCallback((index: number): void => {
        setItems((current) => current.filter((_, entryIndex) => entryIndex !== index));
    }, []);

    function openScanner(): void {
        if (!features.cameraScanner) {
            setScannerStatus('El flujo de camara esta desactivado para esta instalacion.');
            return;
        }

        if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
            setScannerStatus('Este navegador no soporta escaneo automatico por camara. Podes seguir buscando por SKU.');
            return;
        }

        setScannerStatus('Iniciando camara trasera...');
        setScannerOpen(true);
    }

    const emitTicket = useCallback(async (): Promise<void> => {
        if (items.length === 0 || saving) {
            return;
        }

        setSaving(true);
        try {
            const response = await window.fetch(urls.saveApi, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    customer_label: customerLabel,
                    notes,
                    items: items.map((item) => ({
                        product_id: item.product_id,
                        manual_name: item.product_id === null ? item.name : undefined,
                        quantity: item.quantity,
                        unit_price: Math.round(item.unit_price),
                    })),
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as {
                message?: string;
                ticket_url?: string;
                id?: number;
            };

            if (!response.ok) {
                setFeedback(payload.message ?? 'No se pudo emitir el ticket. Revisa los datos e intenta nuevamente.');
                setSaving(false);
                return;
            }

            const ticketUrl = payload.ticket_url ?? (payload.id ? route('admin.sales.ticket', { sale: payload.id }) : null);

            if (!ticketUrl) {
                setFeedback('La venta se guardo, pero no llego la URL del ticket. Revisa ventas para imprimirlo.');
                setSaving(false);
                return;
            }

            router.visit(`${ticketUrl}#print`);
        } catch {
            setFeedback('No se pudo emitir el ticket. Revisa la conexion e intenta nuevamente.');
            setSaving(false);
        }
    }, [csrfToken, customerLabel, items, notes, saving, urls.saveApi]);

    const handleEmitTicket = useCallback((): void => {
        void emitTicket();
    }, [emitTicket]);

    useEffect(() => {
        focusSearch();
    }, []);

    useEffect(() => {
        if (!searchReadyRef.current) {
            searchReadyRef.current = true;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void searchProducts(search.trim());
        }, 220);

        return () => window.clearTimeout(timeoutId);
    }, [search, searchProducts]);

    useEffect(() => {
        if (feedback === '') {
            return;
        }

        const timeoutId = window.setTimeout(() => setFeedback(''), 2200);
        return () => window.clearTimeout(timeoutId);
    }, [feedback]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent): void => {
            if (event.key === 'F2') {
                event.preventDefault();
                focusSearch();
            }

            if (event.key === 'Escape') {
                setSearch('');
                focusSearch();
            }

            if (event.key === '+' && lastItemIndex >= 0) {
                event.preventDefault();
                changeQuantity(lastItemIndex, 1);
            }

            if (event.key === '-' && lastItemIndex >= 0) {
                event.preventDefault();
                changeQuantity(lastItemIndex, -1);
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [lastItemIndex]);

    useEffect(() => {
        if (!scannerOpen) {
            return;
        }

        let active = true;
        let stream: MediaStream | null = null;
        let frameTimer = 0;
        const detector = window.BarcodeDetector
            ? new window.BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'],
            })
            : null;

        const stop = (): void => {
            active = false;
            if (frameTimer !== 0) {
                window.clearTimeout(frameTimer);
            }
            stream?.getTracks().forEach((track) => track.stop());
            stream = null;
        };

        const scanLoop = async (): Promise<void> => {
            if (!active || !videoRef.current || detector === null) {
                return;
            }

            try {
                const results = await detector.detect(videoRef.current);
                const value = results[0]?.rawValue?.trim();

                if (value) {
                    stop();
                    setScannerOpen(false);
                    setSearch(value);
                    await searchProducts(value, true);
                    return;
                }
            } catch {
                setScannerStatus('No se pudo interpretar la imagen de camara. Seguimos intentando...');
            }

            frameTimer = window.setTimeout(() => {
                void scanLoop();
            }, 350);
        };

        void (async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                    },
                    audio: false,
                });

                if (!active || !videoRef.current) {
                    stop();
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setScannerStatus('Apunta la camara al codigo de barras o QR del producto.');
                await scanLoop();
            } catch {
                stop();
                setScannerOpen(false);
                setScannerStatus('No se pudo abrir la camara. Revisa permisos o segui con busqueda manual.');
            }
        })();

        return () => {
            stop();
        };
    }, [scannerOpen]);

    return (
        <AdminLayout title="Nueva venta">
            <section className="grid gap-3 xl:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
                <div className="grid content-start gap-3">
                    <section className={`${ui.sectionCardTight} grid gap-2`}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="grid gap-1">
                                <p className={ui.eyebrow}>Caja</p>
                                <h2 className="text-2xl font-black text-ink-950">Nueva venta</h2>
                            </div>
                            <Link href={urls.index} className={buttonClass('soft', 'sm')}>
                                Volver a ventas
                            </Link>
                        </div>
                        <div className="grid gap-2 rounded-xl border border-sky-100 bg-white/92 p-2 shadow-[0_8px_18px_rgba(18,58,132,0.06)] xl:hidden">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
                                <label className="grid gap-1">
                                    <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">Cliente</span>
                                    <input className={`${ui.input} min-h-9 rounded-xl px-3 py-2 text-xs`} value={customerLabel} onChange={(event) => setCustomerLabel(event.target.value)} />
                                </label>
                                <div className="grid gap-1">
                                    <span className="text-xs font-black uppercase tracking-[0.12em] text-brand-700">Fecha</span>
                                    <span className="grid min-h-9 items-center rounded-xl border border-sky-200/90 bg-sky-50 px-3 py-2 text-xs font-black text-ink-900">
                                        {defaults.issuedAtLabel}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <div className="relative">
                                <input
                                    ref={searchRef}
                                    className={`${ui.input} min-h-12 pr-20 text-base font-bold`}
                                    placeholder="Buscar por nombre o SKU"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            void searchOrAdd();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    className="absolute right-10 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-50"
                                    aria-label="Buscar"
                                    onClick={() => void searchOrAdd()}
                                >
                                    <FaSearch aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className={cn(
                                        'absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-rose-700 transition hover:bg-rose-50',
                                        search === '' && 'cursor-not-allowed opacity-40 hover:bg-transparent',
                                    )}
                                    aria-label="Limpiar busqueda"
                                    disabled={search === ''}
                                    onClick={() => {
                                        setSearch('');
                                        focusSearch();
                                    }}
                                >
                                    x
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                                <button type="button" className={buttonClass('soft', 'sm', 'w-full sm:w-auto')} onClick={openScanner}>
                                    <FaVideo aria-hidden="true" />
                                    Camara
                                </button>
                                <button type="button" className={buttonClass('soft', 'sm', 'w-full sm:w-auto')} onClick={() => setManualOpen(!manualOpen)}>
                                    Item manual
                                </button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2 text-sm font-bold text-ink-800">
                            {feedback || scannerStatus}
                        </div>
                        {manualOpen ? (
                            <div className="grid grid-cols-2 items-end gap-2 rounded-xl border border-sky-100 bg-white p-3 shadow-[0_10px_22px_rgba(18,58,132,0.06)] lg:grid-cols-[minmax(0,1fr)_144px_132px_94px]">
                                <label className="col-span-2 grid gap-1 lg:col-span-1">
                                    <span className={ui.fieldLabel}>Descripcion</span>
                                    <input className={`${ui.input} min-h-9 rounded-xl px-3 py-2`} placeholder="Nombre del item" value={manualDraft.name} onChange={(event) => setManualDraft((current) => ({ ...current, name: event.target.value }))} />
                                </label>
                                <div className="grid gap-1">
                                    <span className={ui.fieldLabel}>Cantidad</span>
                                    <div className="grid h-9 grid-cols-[38px_minmax(44px,1fr)_38px] overflow-hidden rounded-xl border border-sky-200/90 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:grid-cols-[38px_minmax(56px,1fr)_38px]">
                                        <button type="button" className="grid place-items-center text-brand-700 hover:bg-brand-50" onClick={() => changeManualQuantity(-1)} aria-label="Restar cantidad manual">
                                            <FaMinus aria-hidden="true" />
                                        </button>
                                        <div className="grid place-items-center border-x border-sky-100 bg-sky-50 text-base font-black text-ink-950" title="Cantidad">
                                            {manualDraft.quantity}
                                        </div>
                                        <button type="button" className="grid place-items-center text-brand-700 hover:bg-brand-50" onClick={() => changeManualQuantity(1)} aria-label="Sumar cantidad manual">
                                            <FaPlus aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                                <label className="grid gap-1">
                                    <span className={ui.fieldLabel}>Precio</span>
                                    <input
                                        className={`${ui.input} min-h-9 rounded-xl px-3 py-2`}
                                        type="number"
                                        min="0"
                                        value={manualDraft.unit_price}
                                        onFocus={() => {
                                            if (manualDraft.unit_price === 0) {
                                                setManualDraft((current) => ({ ...current, unit_price: '' }));
                                            }
                                        }}
                                        onChange={(event) => {
                                            const value = event.target.value;
                                            setManualDraft((current) => ({ ...current, unit_price: value === '' ? '' : Math.max(0, Number(value)) }));
                                        }}
                                    />
                                </label>
                                <button type="button" className={buttonClass('primary', 'sm', 'col-span-2 h-9 min-h-9 w-full rounded-xl px-3 py-0 lg:col-span-1')} onClick={addManualItem}>
                                    Agregar
                                </button>
                            </div>
                        ) : null}
                        {scannerOpen ? (
                            <div className="grid gap-3 rounded-xl border border-sky-100 bg-white p-3 shadow-[0_10px_24px_rgba(18,58,132,0.06)]">
                                <video ref={videoRef} className="aspect-video w-full rounded-xl bg-slate-950 object-cover" muted playsInline />
                                <button type="button" className={buttonClass('danger', 'sm')} onClick={() => setScannerOpen(false)}>
                                    Cerrar camara
                                </button>
                            </div>
                        ) : null}
                    </section>

                    {search.trim() !== '' ? (
                    <section className={`${ui.sectionCardTight} grid gap-2`}>
                        <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                            {products.map((product) => (
                                <article key={product.id} className="grid grid-cols-[58px_minmax(0,1fr)] gap-2 rounded-lg border border-sky-100 bg-white/95 p-2 shadow-[0_8px_18px_rgba(18,58,132,0.06)]">
                                    <div className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-md border border-sky-100 bg-sky-50 text-center text-[0.58rem] font-black text-ink-700">
                                        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" /> : <span>Sin foto</span>}
                                    </div>
                                    <div className="grid min-w-0 gap-1">
                                        <h3 className="line-clamp-2 text-xs font-black leading-tight text-ink-950">{product.name}</h3>
                                        <p className="truncate text-[0.68rem] font-semibold text-ink-700/80">{product.category_name || 'Sin categoria'} | {product.sku || 'Sin SKU'}</p>
                                        <div className="flex items-center justify-between gap-2">
                                            <strong className="text-sm font-black text-ink-950">{formatCurrency(product.price)}</strong>
                                            <button type="button" className={buttonClass('primary', 'sm')} onClick={() => addProduct(product)}>
                                                <FaPlus aria-hidden="true" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                    ) : null}
                </div>

                <TicketAside
                    customerLabel={customerLabel}
                    issuedAtLabel={defaults.issuedAtLabel}
                    items={items}
                    saving={saving}
                    onCustomerLabelChange={setCustomerLabel}
                    onUpdateItem={updateItem}
                    onChangeQuantity={changeQuantity}
                    onRemoveItem={removeItem}
                    onEmitTicket={handleEmitTicket}
                />
            </section>
        </AdminLayout>
    );
}

const TicketAside = memo(function TicketAside({
    customerLabel,
    issuedAtLabel,
    items,
    saving,
    onCustomerLabelChange,
    onUpdateItem,
    onChangeQuantity,
    onRemoveItem,
    onEmitTicket,
}: TicketAsideProps): JSX.Element {
    const total = useMemo(() => items.reduce((carry, item) => carry + item.unit_price * item.quantity, 0), [items]);

    return (
        <aside className={`${ui.sectionCardTight} grid content-start gap-3 xl:sticky xl:top-3 xl:max-h-[calc(100vh-1.5rem)] xl:overflow-y-auto`}>
            <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className={ui.eyebrow}>Ticket</p>
                        <h3 className="text-xl font-black text-ink-950">Venta actual</h3>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-brand-700">
                        {items.length} producto(s)
                    </span>
                </div>
                <div className="hidden gap-2 xl:grid xl:grid-cols-2">
                    <label className="grid gap-1">
                        <span className={ui.fieldLabel}>Cliente</span>
                        <input className={ui.input} value={customerLabel} onChange={(event) => onCustomerLabelChange(event.target.value)} />
                    </label>
                    <label className="grid gap-1">
                        <span className={ui.fieldLabel}>Fecha</span>
                        <input className={ui.input} value={issuedAtLabel} readOnly />
                    </label>
                </div>
            </div>

            <div className="grid gap-2">
                {items.map((item, index) => (
                    <article key={`${item.product_id ?? 'manual'}-${index}`} className="grid grid-cols-[46px_minmax(0,1fr)] gap-2 rounded-lg border border-sky-100 bg-white/95 p-2 shadow-[0_8px_18px_rgba(18,58,132,0.06)]">
                        <div className="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-md border border-sky-100 bg-sky-50 text-center text-[0.52rem] font-black text-ink-700">
                            {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-contain" /> : <span>Sin foto</span>}
                        </div>
                        <div className="grid min-w-0 gap-1">
                            {item.product_id === null ? (
                                <input className={`${ui.input} min-h-9 rounded-lg px-2 py-1 text-xs`} placeholder="Nombre del item manual" value={item.name} onChange={(event) => {
                                    const itemName = capitalizeFirstLetter(event.target.value, false);
                                    onUpdateItem(index, { name: itemName, manual_name: itemName });
                                }} />
                            ) : (
                                <strong className="line-clamp-2 text-sm leading-tight text-ink-950">{item.name}</strong>
                            )}
                            <span className="truncate text-[0.68rem] font-semibold text-ink-700/75">{item.category_name || 'Sin categoria'} | {item.sku || 'Sin SKU'}</span>
                            <div className="grid grid-cols-[auto_minmax(86px,1fr)_auto] items-center gap-2">
                                <div className="inline-grid grid-cols-[28px_42px_28px] overflow-hidden rounded-lg border border-sky-100 bg-white">
                                    <button type="button" className="grid h-8 place-items-center text-brand-700 hover:bg-brand-50" onClick={() => onChangeQuantity(index, -1)} aria-label="Restar">
                                        <FaMinus aria-hidden="true" />
                                    </button>
                                    <div className="grid h-8 place-items-center border-x border-sky-100 bg-sky-50 text-sm font-black text-ink-950" title="Cantidad">
                                        {item.quantity}
                                    </div>
                                    <button type="button" className="grid h-8 place-items-center text-brand-700 hover:bg-brand-50" onClick={() => onChangeQuantity(index, 1)} aria-label="Sumar">
                                        <FaPlus aria-hidden="true" />
                                    </button>
                                </div>
                                <input className={`${ui.input} min-h-8 rounded-lg px-2 py-1 text-xs`} type="number" min="0" value={item.unit_price} onChange={(event) => onUpdateItem(index, { unit_price: Math.max(0, Number(event.target.value)) })} />
                                <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100" onClick={() => onRemoveItem(index)} aria-label="Quitar">
                                    <FaTrashAlt aria-hidden="true" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm font-black text-ink-950">
                                <span>Subtotal</span>
                                <span>{formatCurrency(item.unit_price * item.quantity)}</span>
                            </div>
                        </div>
                    </article>
                ))}
                {items.length === 0 ? <div className={ui.emptyCard}>Todavia no hay productos en el ticket.</div> : null}
            </div>

            <div className="sticky bottom-0 z-10 grid gap-2 rounded-xl border border-brand-100 bg-white/98 p-3 shadow-[0_-12px_28px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-brand-700">Total</span>
                    <strong className="text-3xl font-black text-ink-950">{formatCurrency(total)}</strong>
                </div>
                <button type="button" className={buttonClass('primary')} disabled={items.length === 0 || saving} onClick={onEmitTicket}>
                    {saving ? 'Generando...' : 'Emitir ticket'}
                </button>
            </div>
        </aside>
    );
});
