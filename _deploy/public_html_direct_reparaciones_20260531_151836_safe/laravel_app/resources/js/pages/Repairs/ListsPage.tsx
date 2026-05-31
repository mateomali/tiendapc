import { router, useForm } from '@inertiajs/react';
import { FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface ServiceCategoryOption {
    value: number;
    label: string;
}

interface ServiceOption {
    id: number;
    type: 'service' | 'failure';
    value: string;
    label: string;
    description: string;
    repuesto: string;
    usage_count: number;
    active: boolean;
}

interface DeviceModelOption {
    id: number;
    category_id: number;
    brand: string | null;
    model: string;
    normalized_model: string;
    usage_count: number;
}

interface ListsPageProps {
    serviceCategories: ServiceCategoryOption[];
    serviceOptions: ServiceOption[];
    deviceModels: DeviceModelOption[];
    actions: {
        storeServiceOption: string;
        storeDeviceModel: string;
    };
}

const brandOptions = ['SAMSUNG', 'MOTOROLA', 'XIAOMI', 'ALCATEL', 'TCL', 'LG', 'OTRAS'];

function optionLabel(type: ServiceOption['type']): string {
    return type === 'service' ? 'Tipo' : 'Falla';
}

function ServiceOptionRow({ option }: { option: ServiceOption }): JSX.Element {
    const form = useForm({
        label: option.label,
        description: option.description,
        repuesto: option.repuesto,
        active: option.active,
    });

    const submit = (): void => {
        form.post(route('repairs.lists.service_options.update', option.id), { preserveScroll: true });
    };

    const remove = (): void => {
        if (window.confirm(`Eliminar ${option.label}?`)) {
            router.post(route('repairs.lists.service_options.delete', option.id), {}, { preserveScroll: true });
        }
    };

    return (
        <div className="grid gap-2 border-b border-[#e2e8f0] px-3 py-3 last:border-b-0 xl:grid-cols-[6rem_minmax(9rem,0.8fr)_minmax(14rem,1.4fr)_minmax(8rem,0.7fr)_4rem_6rem] xl:items-center">
            <div className="text-sm font-bold text-[#475569]">{optionLabel(option.type)}</div>
            <input className={ui.repairDenseInput} value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} />
            <input className={ui.repairDenseInput} value={form.data.description} onChange={(event) => form.setData('description', event.target.value)} />
            <input className={ui.repairDenseInput} value={form.data.repuesto} disabled={option.type !== 'service'} onChange={(event) => form.setData('repuesto', event.target.value)} />
            <label className="inline-flex items-center gap-2 text-sm font-bold text-[#334155]">
                <input type="checkbox" checked={form.data.active} onChange={(event) => form.setData('active', event.target.checked)} />
                Activa
            </label>
            <div className="flex gap-2">
                <button type="button" className={buttonClass('primary', 'sm')} onClick={submit} disabled={form.processing} title="Guardar">
                    <FaSave aria-hidden="true" />
                </button>
                <button type="button" className={buttonClass('danger', 'sm')} onClick={remove} title="Eliminar">
                    <FaTrash aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

function DeviceModelRow({ model, serviceCategories }: { model: DeviceModelOption; serviceCategories: ServiceCategoryOption[] }): JSX.Element {
    const form = useForm({
        category_id: String(model.category_id),
        brand: model.brand ?? '',
        model: model.model,
    });

    const submit = (): void => {
        form.post(route('repairs.lists.device_models.update', model.id), { preserveScroll: true });
    };

    const remove = (): void => {
        if (window.confirm(`Eliminar ${model.model}?`)) {
            router.post(route('repairs.lists.device_models.delete', model.id), {}, { preserveScroll: true });
        }
    };

    return (
        <div className="grid gap-2 border-b border-[#e2e8f0] px-3 py-3 last:border-b-0 xl:grid-cols-[9rem_9rem_minmax(14rem,1fr)_4rem_6rem] xl:items-center">
            <select className={ui.repairDenseInput} value={form.data.category_id} onChange={(event) => form.setData('category_id', event.target.value)}>
                {serviceCategories.map((category) => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                ))}
            </select>
            <select className={ui.repairDenseInput} value={form.data.brand} onChange={(event) => form.setData('brand', event.target.value)}>
                <option value="">Sin marca</option>
                {brandOptions.map((brand) => (
                    <option key={brand} value={brand}>{brand}</option>
                ))}
            </select>
            <input className={ui.repairDenseInput} value={form.data.model} onChange={(event) => form.setData('model', event.target.value)} />
            <div className="text-sm font-bold text-[#64748b]">{model.usage_count}</div>
            <div className="flex gap-2">
                <button type="button" className={buttonClass('primary', 'sm')} onClick={submit} disabled={form.processing} title="Guardar">
                    <FaSave aria-hidden="true" />
                </button>
                <button type="button" className={buttonClass('danger', 'sm')} onClick={remove} title="Eliminar">
                    <FaTrash aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}

export default function ListsPage({ serviceCategories, serviceOptions, deviceModels, actions }: ListsPageProps): JSX.Element {
    const serviceForm = useForm({
        type: 'failure',
        label: '',
        description: '',
        repuesto: '',
    });
    const modelForm = useForm({
        category_id: '1',
        brand: '',
        model: '',
    });

    const submitServiceOption = (): void => {
        serviceForm.post(actions.storeServiceOption, {
            preserveScroll: true,
            onSuccess: () => serviceForm.reset('label', 'description', 'repuesto'),
        });
    };

    const submitDeviceModel = (): void => {
        modelForm.post(actions.storeDeviceModel, {
            preserveScroll: true,
            onSuccess: () => modelForm.reset('model'),
        });
    };

    return (
        <RepairLayout title="Listas de reparacion">
            <section className={ui.repairShell}>
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-xl font-black text-[#0f172a]">Listas de carga</h1>
                    <span className="text-sm font-semibold text-[#475569]">Modelos, tipos y fallas usados en ingreso.</span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                    <div className="rounded-lg border border-[#b8d3f7] bg-white">
                        <div className="border-b border-[#dbeafe] px-3 py-3">
                            <h2 className="text-base font-black text-[#0f172a]">Tipos y fallas</h2>
                        </div>
                        <div className="grid gap-2 border-b border-[#dbeafe] bg-[#f8fbff] p-3 md:grid-cols-[9rem_1fr_1fr_9rem_auto]">
                            <select className={ui.repairDenseInput} value={serviceForm.data.type} onChange={(event) => serviceForm.setData('type', event.target.value)}>
                                <option value="failure">Falla</option>
                                <option value="service">Tipo</option>
                            </select>
                            <input className={ui.repairDenseInput} placeholder="Nombre" value={serviceForm.data.label} onChange={(event) => serviceForm.setData('label', event.target.value)} />
                            <input className={ui.repairDenseInput} placeholder="Texto que agrega" value={serviceForm.data.description} onChange={(event) => serviceForm.setData('description', event.target.value)} />
                            <input className={ui.repairDenseInput} placeholder="Repuesto" value={serviceForm.data.repuesto} disabled={serviceForm.data.type !== 'service'} onChange={(event) => serviceForm.setData('repuesto', event.target.value)} />
                            <button type="button" className={buttonClass('primary', 'sm')} onClick={submitServiceOption} disabled={serviceForm.processing}>
                                <FaPlus aria-hidden="true" />
                                Agregar
                            </button>
                        </div>
                        <div className="max-h-[620px] overflow-auto">
                            {serviceOptions.map((option) => (
                                <ServiceOptionRow key={option.id} option={option} />
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#b8d3f7] bg-white">
                        <div className="border-b border-[#dbeafe] px-3 py-3">
                            <h2 className="text-base font-black text-[#0f172a]">Modelos</h2>
                        </div>
                        <div className="grid gap-2 border-b border-[#dbeafe] bg-[#f8fbff] p-3 md:grid-cols-[9rem_9rem_1fr_auto]">
                            <select className={ui.repairDenseInput} value={modelForm.data.category_id} onChange={(event) => modelForm.setData('category_id', event.target.value)}>
                                {serviceCategories.map((category) => (
                                    <option key={category.value} value={category.value}>{category.label}</option>
                                ))}
                            </select>
                            <select className={ui.repairDenseInput} value={modelForm.data.brand} onChange={(event) => modelForm.setData('brand', event.target.value)}>
                                <option value="">Sin marca</option>
                                {brandOptions.map((brand) => (
                                    <option key={brand} value={brand}>{brand}</option>
                                ))}
                            </select>
                            <input className={cn(ui.repairDenseInput, 'uppercase')} placeholder="Modelo" value={modelForm.data.model} onChange={(event) => modelForm.setData('model', event.target.value.toUpperCase())} />
                            <button type="button" className={buttonClass('primary', 'sm')} onClick={submitDeviceModel} disabled={modelForm.processing}>
                                <FaPlus aria-hidden="true" />
                                Agregar
                            </button>
                        </div>
                        <div className="max-h-[620px] overflow-auto">
                            {deviceModels.map((model) => (
                                <DeviceModelRow key={model.id} model={model} serviceCategories={serviceCategories} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </RepairLayout>
    );
}
