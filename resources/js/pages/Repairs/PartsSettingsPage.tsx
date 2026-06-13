import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { FaSave, FaSyncAlt, FaTools } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';

interface PartsSettingsPageProps {
    spreadsheetUrl: string;
    csvUrl: string;
    defaultSpreadsheetUrl: string;
    actions: {
        save: string;
    };
}

interface PartsSettingsForm {
    spreadsheet_url: string;
}

export default function PartsSettingsPage({ spreadsheetUrl, csvUrl, defaultSpreadsheetUrl, actions }: PartsSettingsPageProps): JSX.Element {
    const form = useForm<PartsSettingsForm>({
        spreadsheet_url: spreadsheetUrl || defaultSpreadsheetUrl,
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        form.post(actions.save, { preserveScroll: true });
    };

    return (
        <RepairLayout title="Base de repuestos">
            <section className={ui.repairShell}>
                <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <h1 className="flex items-center gap-2 text-xl font-black text-[#0f172a]">
                        <FaTools aria-hidden="true" />
                        Base de repuestos
                    </h1>
                    <Link href={route('repairs.parts')} className={buttonClass('soft', 'sm')}>
                        Volver a repuestos
                    </Link>
                </div>

                <form onSubmit={submit} className="grid gap-4 rounded-lg border border-[#b8d3f7] bg-white p-3 md:p-4">
                    <label className="grid gap-1 text-sm font-black text-[#17427f]">
                        Link de Google Sheets
                        <input
                            type="url"
                            className={ui.input}
                            value={form.data.spreadsheet_url}
                            onChange={(event) => form.setData('spreadsheet_url', event.target.value)}
                            placeholder={defaultSpreadsheetUrl}
                            required
                        />
                    </label>

                    {form.errors.spreadsheet_url ? (
                        <p className="text-sm font-bold text-[#be123c]">{form.errors.spreadsheet_url}</p>
                    ) : null}

                    <div className="rounded-md border border-[#dbe7f6] bg-[#f8fbff] p-3 text-sm font-semibold text-[#334155]">
                        <div className="grid gap-1">
                            <span className="font-black text-[#0f172a]">URL que se usa para importar CSV</span>
                            <span className="break-all">{csvUrl}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing}>
                            <FaSave aria-hidden="true" />
                            Guardar base
                        </button>
                        <button
                            type="button"
                            className={buttonClass('soft', 'sm')}
                            onClick={() => form.setData('spreadsheet_url', defaultSpreadsheetUrl)}
                            disabled={form.processing}
                        >
                            <FaSyncAlt aria-hidden="true" />
                            Usar base actual
                        </button>
                    </div>
                </form>
            </section>
        </RepairLayout>
    );
}
