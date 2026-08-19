import { router } from '@inertiajs/react';
import { useMemo, useState, type FormEvent } from 'react';
import { SiteLayout } from '../../layouts/SiteLayout';
import { buttonClass, ui } from '../../ui';

interface RepairQuoteModel {
    id: number;
    label: string;
}

interface RepairQuoteBrand {
    brand: string;
    models: RepairQuoteModel[];
}

interface RepairQuoteFailure {
    value: string;
    label: string;
}

interface RepairQuoteResult {
    found: boolean;
    basePriceLabel: string;
    estimatedPriceLabel: string;
    sourceDate: string;
    monthsOld: number;
    monthlyIncrementPercentage: number;
    orderId: number;
}

interface RepairQuotePageProps {
    brands: RepairQuoteBrand[];
    failuresByModel: Record<string, RepairQuoteFailure[]>;
    selected: {
        modelId: number | null;
        failure: string;
    };
    searched: boolean;
    result: RepairQuoteResult | null;
    whatsappUrl: string;
    whatsappBaseUrl: string;
}

const consultOptionValue = '__consultar_whatsapp__';

export default function RepairQuotePage({ brands, failuresByModel, selected, searched, result, whatsappUrl, whatsappBaseUrl }: RepairQuotePageProps): JSX.Element {
    const initialBrand = useMemo(() => {
        if (!selected.modelId) {
            return brands[0]?.brand ?? '';
        }

        return brands.find((brand) => brand.models.some((model) => model.id === selected.modelId))?.brand ?? brands[0]?.brand ?? '';
    }, [brands, selected.modelId]);

    const [brand, setBrand] = useState(initialBrand);
    const [modelId, setModelId] = useState<number | ''>(selected.modelId ?? '');
    const [failure, setFailure] = useState(selected.failure ?? '');
    const availableModels = brands.find((item) => item.brand === brand)?.models ?? [];
    const selectedModel = availableModels.find((model) => model.id === modelId) ?? brands.flatMap((item) => item.models).find((model) => model.id === modelId) ?? null;
    const knownFailures = modelId ? failuresByModel[String(modelId)] ?? [] : [];
    const failureOptions = [...knownFailures, { value: consultOptionValue, label: 'Consultar por WhatsApp' }];
    const currentWhatsappUrl = `${whatsappBaseUrl}${encodeURIComponent([
        'Hola Sudoku, quiero consultar por reparar mi telefono.',
        selectedModel ? `Modelo: ${brand !== 'OTROS' ? `${brand} ` : ''}${selectedModel.label}` : '',
        failure && failure !== consultOptionValue ? `Falla: ${failure}` : 'Falla: quiero consultar una falla puntual',
    ].filter(Boolean).join('\n'))}`;

    const submit = (event: FormEvent): void => {
        event.preventDefault();

        if (failure === consultOptionValue) {
            window.open(currentWhatsappUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        router.get(route('store.repair_quote'), {
            modelo: modelId,
            falla: failure,
        }, {
            preserveScroll: true,
        });
    };

    const changeBrand = (value: string): void => {
        const nextModels = brands.find((item) => item.brand === value)?.models ?? [];
        setBrand(value);
        setModelId(nextModels[0]?.id ?? '');
        setFailure('');
    };

    const changeModel = (value: string): void => {
        setModelId(value === '' ? '' : Number(value));
        setFailure('');
    };

    return (
        <SiteLayout title="Quiero reparar mi telefono">
            <section className="mx-auto grid w-full max-w-6xl gap-5 px-3 py-5 sm:px-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.65fr)] lg:items-start">
                <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:p-5">
                    <div className="grid gap-2">
                        <p className="text-xs font-black uppercase text-brand-700">Presupuesto rapido</p>
                        <h1 className="text-2xl font-black leading-tight text-ink-950 sm:text-3xl">Quiero reparar mi telefono</h1>
                        <p className="max-w-2xl text-sm font-semibold leading-6 text-ink-600">
                            Elegi marca, modelo y falla. El precio se calcula con el ultimo trabajo similar registrado y se actualiza si el valor quedo antiguo.
                        </p>
                    </div>

                    <form className="grid gap-4" onSubmit={submit}>
                        <div className="grid gap-3 md:grid-cols-3">
                            <label className={ui.field}>
                                <span className={ui.fieldLabel}>Marca</span>
                                <select className={ui.input} value={brand} onChange={(event) => changeBrand(event.target.value)} disabled={brands.length === 0}>
                                    {brands.map((item) => (
                                        <option key={item.brand} value={item.brand}>{item.brand}</option>
                                    ))}
                                </select>
                            </label>

                            <label className={ui.field}>
                                <span className={ui.fieldLabel}>Modelo</span>
                                <select className={ui.input} value={modelId} onChange={(event) => changeModel(event.target.value)} disabled={availableModels.length === 0}>
                                    <option value="">Seleccionar</option>
                                    {availableModels.map((model) => (
                                        <option key={model.id} value={model.id}>{model.label}</option>
                                    ))}
                                </select>
                            </label>

                            <label className={ui.field}>
                                <span className={ui.fieldLabel}>Falla</span>
                                <select className={ui.input} value={failure} onChange={(event) => setFailure(event.target.value)} disabled={!modelId}>
                                    <option value="">Seleccionar</option>
                                    {failureOptions.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                                {modelId && knownFailures.length === 0 ? (
                                    <small className={ui.fieldHint}>No hay fallas con precio conocido para este modelo.</small>
                                ) : null}
                            </label>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <button className={buttonClass('primary')} type="submit" disabled={!modelId || failure === ''}>
                                {failure === consultOptionValue ? 'Abrir WhatsApp' : 'Consultar precio'}
                            </button>
                            <a className={buttonClass('soft')} href={failure === consultOptionValue ? currentWhatsappUrl : whatsappUrl} target="_blank" rel="noreferrer">
                                Consultar por WhatsApp
                            </a>
                        </div>
                    </form>
                </div>

                <aside className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] sm:p-5">
                    <div className="grid gap-1">
                        <p className="text-xs font-black uppercase text-ink-500">Resultado</p>
                        {result ? (
                            <>
                                <strong className="text-3xl font-black text-ink-950">{result.estimatedPriceLabel}</strong>
                                <p className="text-sm font-semibold text-ink-600">Precio estimado para la reparacion seleccionada.</p>
                            </>
                        ) : !searched ? (
                            <>
                                <strong className="text-xl font-black text-ink-950">Selecciona una reparacion</strong>
                                <p className="text-sm font-semibold leading-6 text-ink-600">
                                    El resultado aparece despues de elegir el modelo y la falla.
                                </p>
                            </>
                        ) : (
                            <>
                                <strong className="text-xl font-black text-ink-950">Sin precio disponible</strong>
                                <p className="text-sm font-semibold leading-6 text-ink-600">
                                    Cuando no hay un trabajo coincidente, conviene confirmar por WhatsApp con el equipo tecnico.
                                </p>
                            </>
                        )}
                    </div>

                    {result ? (
                        <div className="grid gap-3 rounded-md bg-slate-50 p-3 text-sm font-semibold text-ink-700">
                            <div className="flex items-center justify-between gap-3">
                                <span>Ultimo precio registrado</span>
                                <strong className="text-ink-950">{result.basePriceLabel}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Fecha del trabajo</span>
                                <strong className="text-ink-950">{result.sourceDate}</strong>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                                <span>Ajuste aplicado</span>
                                <strong className="text-ink-950">{result.monthsOld > 0 ? `${result.monthlyIncrementPercentage}% x ${result.monthsOld} mes(es)` : 'Sin ajuste'}</strong>
                            </div>
                        </div>
                    ) : null}

                    <p className="text-xs font-bold leading-5 text-ink-500">
                        El valor es orientativo. El presupuesto final se confirma al revisar el equipo y disponibilidad del repuesto.
                    </p>
                </aside>
            </section>
        </SiteLayout>
    );
}
