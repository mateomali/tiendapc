import { Link, router, useForm } from '@inertiajs/react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { buttonClass, ui } from '../../ui';

interface BackupItem {
    file_name: string;
    size: number;
    created_at: string;
}

interface BackupsPageProps {
    backups: BackupItem[];
    stats: {
        total: number;
        totalSizeLabel: string;
        latestCreatedAt?: string | null;
    };
}

export default function BackupsPage({ backups, stats }: BackupsPageProps): JSX.Element {
    const createForm = useForm<Record<string, never>>({});
    const createRepairsForm = useForm<Record<string, never>>({});
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    const restoreForm = useForm<{ file: string; backup_zip: File | null }>({
        file: '',
        backup_zip: null,
    });
    const restoreRepairsForm = useForm<{ file: string; backup_zip: File | null }>({
        file: '',
        backup_zip: null,
    });

    function restoreExisting(fileName: string): void {
        if (!window.confirm(`Se restaurara el backup ${fileName} y se reemplazaran tablas y uploads actuales.`)) {
            return;
        }

        router.post(route('admin.backups.restore'), { file: fileName });
    }

    function restoreRepairExisting(fileName: string): void {
        if (!window.confirm(`Se restauraran solo las tablas de reparaciones desde ${fileName}.`)) {
            return;
        }

        router.post(route('admin.backups.repairs.restore'), { file: fileName });
    }

    return (
        <AdminLayout title="Backups">
            <section className={ui.heroCard}>
                <div className={ui.heroTitleWrap}>
                    <p className={ui.eyebrow}>Seguridad operativa</p>
                    <h2 className={ui.heroTitle}>Backups y restauracion completa</h2>
                    <p className={ui.heroText}>
                        Esta pantalla vuelve al flujo del legacy: crear ZIP del estado actual, descargarlo, subir uno
                        externo y restaurar base de datos mas uploads desde el panel.
                    </p>
                </div>
            </section>

            <section className={ui.statsGrid}>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Backups disponibles</p>
                    <p className={ui.statValue}>{stats.total}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Peso total</p>
                    <p className={ui.statValueCompact}>{stats.totalSizeLabel}</p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Ultimo backup</p>
                    <p className={ui.statValueCompact}>
                        {stats.latestCreatedAt ?? 'Sin registros'}
                    </p>
                </article>
                <article className={ui.statCard}>
                    <p className={ui.statLabel}>Cobertura</p>
                    <p className={ui.statValueCompact}>DB + uploads</p>
                </article>
            </section>

            <section className={ui.backupLayout}>
                <article className={ui.backupCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Backup local</p>
                            <h3 className={ui.cardTitle}>Crear un ZIP nuevo</h3>
                        </div>
                    </div>
                    <p className={ui.inlineCaption}>
                        Genera un snapshot del catalogo, configuraciones, ventas, reparaciones y archivos de uploads.
                    </p>
                    <div className={ui.inlineActions}>
                        <button
                            type="button"
                            className={buttonClass('primary')}
                            onClick={() => createForm.post(route('admin.backups.create'))}
                            disabled={createForm.processing}
                        >
                            {createForm.processing ? 'Creando...' : 'Crear backup'}
                        </button>
                    </div>
                </article>

                <article className={ui.backupCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Backup reparaciones</p>
                            <h3 className={ui.cardTitle}>Exportar ordenes y reparaciones</h3>
                        </div>
                    </div>
                    <p className={ui.inlineCaption}>
                        Genera un ZIP solo con ordenes, pagos, eventos, repuestos, modelos y listas de carga.
                    </p>
                    <div className={ui.inlineActions}>
                        <button
                            type="button"
                            className={buttonClass('primary')}
                            onClick={() => createRepairsForm.post(route('admin.backups.repairs.create'))}
                            disabled={createRepairsForm.processing}
                        >
                            {createRepairsForm.processing ? 'Creando...' : 'Crear backup reparaciones'}
                        </button>
                        <form action={route('admin.backups.repairs.create_download')} method="post">
                            <input type="hidden" name="_token" value={csrfToken} />
                            <button type="submit" className={buttonClass('soft')}>
                                Crear y descargar
                            </button>
                        </form>
                    </div>
                </article>

                <article className={ui.backupCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Restore desde archivo</p>
                            <h3 className={ui.cardTitle}>Subir un backup ZIP</h3>
                        </div>
                    </div>
                    <p className={ui.inlineCaption}>
                        Sube un backup descargado del servidor para restaurar base de datos e imagenes del entorno
                        local. Limite recomendado: hasta 300 MB.
                    </p>
                    <form
                        className="grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (!window.confirm('Se restaurara el backup subido y se reemplazaran los datos actuales.')) {
                                return;
                            }

                            restoreForm.post(route('admin.backups.restore'), {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: () => restoreForm.reset(),
                            });
                        }}
                    >
                        <div className={ui.backupUploadGrid}>
                            <div className={ui.field}>
                                <label htmlFor="backup_zip" className={ui.fieldLabel}>Archivo ZIP</label>
                                <input
                                    id="backup_zip"
                                    type="file"
                                    accept=".zip,application/zip"
                                    className={ui.input}
                                    onChange={(event) => restoreForm.setData('backup_zip', event.target.files?.[0] ?? null)}
                                />
                                <p className={ui.inlineCaption}>
                                    Formato esperado: backup ZIP generado desde admin.
                                </p>
                            </div>
                            <button type="submit" className={buttonClass('soft')} disabled={restoreForm.processing}>
                                {restoreForm.processing ? 'Restaurando...' : 'Subir y restaurar'}
                            </button>
                        </div>
                    </form>
                </article>

                <article className={ui.backupCard}>
                    <div className={ui.cardHeading}>
                        <div className={ui.cardTitleWrap}>
                            <p className={ui.eyebrow}>Importar reparaciones</p>
                            <h3 className={ui.cardTitle}>Subir ZIP de reparaciones</h3>
                        </div>
                    </div>
                    <p className={ui.inlineCaption}>
                        Restaura solamente las tablas del modulo de reparaciones. No toca productos, ventas ni configuracion general.
                    </p>
                    <form
                        className="grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();

                            if (!window.confirm('Se reemplazaran solo las tablas actuales de reparaciones.')) {
                                return;
                            }

                            restoreRepairsForm.post(route('admin.backups.repairs.restore'), {
                                forceFormData: true,
                                preserveScroll: true,
                                onSuccess: () => restoreRepairsForm.reset(),
                            });
                        }}
                    >
                        <div className={ui.backupUploadGrid}>
                            <div className={ui.field}>
                                <label htmlFor="repair_backup_zip" className={ui.fieldLabel}>Archivo ZIP</label>
                                <input
                                    id="repair_backup_zip"
                                    type="file"
                                    accept=".zip,application/zip"
                                    className={ui.input}
                                    onChange={(event) => restoreRepairsForm.setData('backup_zip', event.target.files?.[0] ?? null)}
                                />
                                <p className={ui.inlineCaption}>
                                    Acepta ZIP de reparaciones o un backup completo; solo se restauran las tablas de reparaciones.
                                </p>
                            </div>
                            <button type="submit" className={buttonClass('soft')} disabled={restoreRepairsForm.processing}>
                                {restoreRepairsForm.processing ? 'Restaurando...' : 'Subir y restaurar reparaciones'}
                            </button>
                        </div>
                    </form>
                </article>
            </section>

            <section className={ui.backupCard}>
                <div className={ui.cardHeading}>
                    <div className={ui.cardTitleWrap}>
                        <p className={ui.eyebrow}>Historico</p>
                        <h3 className={ui.cardTitle}>Backups disponibles</h3>
                    </div>
                </div>
                <div className="grid gap-4">
                    {backups.map((backup) => (
                        <article key={backup.file_name} className={ui.backupRow}>
                            <div className={ui.backupMeta}>
                                <strong>{backup.file_name}</strong>
                                <span>Generado: {backup.created_at}</span>
                                <span>{Math.round(backup.size / 1024)} KB</span>
                            </div>
                            <div className={ui.inlineActions}>
                                <a href={route('admin.backups.download', backup.file_name)} className={buttonClass('soft', 'sm')}>
                                    Descargar
                                </a>
                                <button type="button" className={buttonClass('primary', 'sm')} onClick={() => restoreExisting(backup.file_name)}>
                                    Restaurar
                                </button>
                                <button type="button" className={buttonClass('soft', 'sm')} onClick={() => restoreRepairExisting(backup.file_name)}>
                                    Restaurar reparaciones
                                </button>
                                <Link
                                    href={route('admin.backups.delete', backup.file_name)}
                                    method="post"
                                    as="button"
                                    className={buttonClass('danger', 'sm')}
                                >
                                    Eliminar
                                </Link>
                            </div>
                        </article>
                    ))}
                    {backups.length === 0 ? (
                        <article className={ui.emptyCard}>
                            <h3 className={ui.emptyTitle}>Todavia no hay backups guardados</h3>
                            <p className={ui.emptyText}>Crea el primero desde este panel o sube uno exportado del sistema legacy.</p>
                        </article>
                    ) : null}
                </div>
            </section>
        </AdminLayout>
    );
}
