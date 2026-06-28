import { router, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { FaEdit, FaSave, FaSearch, FaStickyNote, FaTimes, FaTrashAlt } from 'react-icons/fa';
import { RepairLayout } from '../../layouts/RepairLayout';
import { repairButtonClass as buttonClass, repairUi as ui } from '../../repairUi';
import { cn } from '../../utils';

interface RepairAnnotationView {
    id: number;
    body: string;
    source: string;
    sourceLabel: string;
    repairOrderId?: number | null;
    repairOrderRegistroId?: number | null;
    customerName?: string | null;
    occurredAt?: string | null;
    updateAction: string;
    deleteAction: string;
}

interface AnnotationsPageProps {
    annotations: RepairAnnotationView[];
    actions: {
        store: string;
    };
}

function formatAnnotationDate(value?: string | null): string {
    if (!value) return 'Sin fecha';

    const [date, time] = value.split(' ');
    const [year, month, day] = date.split('-');

    if (!year || !month || !day) {
        return value;
    }

    return `${day}/${month}/${year}${time ? ` ${time}` : ''}`;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightText({ value, term }: { value: string | number | null | undefined; term: string }): JSX.Element {
    const text = value === null || value === undefined ? '' : String(value);
    const query = term.trim();

    if (text === '' || query === '') {
        return <>{text}</>;
    }

    const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));

    return (
        <>
            {parts.map((part, index) => (
                part.toLowerCase() === query.toLowerCase()
                    ? <mark key={`${part}-${index}`} className="rounded-sm bg-[#fde047] px-0.5 font-black text-[#111827]">{part}</mark>
                    : <span key={`${part}-${index}`}>{part}</span>
            ))}
        </>
    );
}

function annotationSearchText(annotation: RepairAnnotationView): string {
    return [
        annotation.body,
        annotation.sourceLabel,
        annotation.repairOrderId ? `orden ${annotation.repairOrderId}` : '',
        annotation.customerName ?? '',
        formatAnnotationDate(annotation.occurredAt),
    ].join(' ').toLowerCase();
}

function AnnotationRow({ annotation, searchTerm }: { annotation: RepairAnnotationView; searchTerm: string }): JSX.Element {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        body: annotation.body,
    });

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post(annotation.updateAction, {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const remove = (): void => {
        if (window.confirm('Eliminar esta anotacion?')) {
            router.post(annotation.deleteAction, {}, { preserveScroll: true });
        }
    };

    return (
        <article className="grid gap-3 rounded-lg border border-[#cbd5e1] bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#475569]">
                        <span><HighlightText value={formatAnnotationDate(annotation.occurredAt)} term={searchTerm} /></span>
                        <span className={cn('rounded-md border px-2 py-0.5', annotation.source === 'order_info' ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#cbd5e1] bg-[#f8fafc] text-[#334155]')}>
                            <HighlightText value={annotation.sourceLabel} term={searchTerm} />
                        </span>
                        {annotation.repairOrderId ? (
                            <span>Orden #<HighlightText value={annotation.repairOrderId} term={searchTerm} /></span>
                        ) : null}
                        {annotation.customerName ? (
                            <span className="truncate"><HighlightText value={annotation.customerName} term={searchTerm} /></span>
                        ) : null}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {editing ? (
                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => { form.setData('body', annotation.body); setEditing(false); }} title="Cancelar">
                            <FaTimes aria-hidden="true" />
                        </button>
                    ) : (
                        <button type="button" className={buttonClass('soft', 'sm')} onClick={() => setEditing(true)} title="Editar" aria-label="Editar anotacion">
                            <FaEdit aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" className={buttonClass('danger', 'sm')} onClick={remove} title="Eliminar">
                        <FaTrashAlt aria-hidden="true" />
                    </button>
                </div>
            </div>

            {editing ? (
                <form className="grid gap-2" onSubmit={submit}>
                    <textarea
                        className={ui.textarea}
                        rows={4}
                        value={form.data.body}
                        onChange={(event) => form.setData('body', event.target.value)}
                        required
                    />
                    <div className="flex justify-end">
                        <button type="submit" className={buttonClass('primary', 'sm')} disabled={form.processing || form.data.body.trim() === ''}>
                            <FaSave aria-hidden="true" /> Guardar
                        </button>
                    </div>
                </form>
            ) : (
                <p className="whitespace-pre-wrap text-sm font-semibold leading-6 text-[#0f172a]">
                    <HighlightText value={annotation.body} term={searchTerm} />
                </p>
            )}
        </article>
    );
}

export default function AnnotationsPage({ annotations, actions }: AnnotationsPageProps): JSX.Element {
    const form = useForm({
        body: '',
    });
    const [searchTerm, setSearchTerm] = useState('');
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const visibleAnnotations = normalizedSearch === ''
        ? annotations
        : annotations.filter((annotation) => annotationSearchText(annotation).includes(normalizedSearch));

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        form.post(actions.store, {
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    };

    return (
        <RepairLayout title="Anotaciones">
            <section className="grid gap-4">
                <form className="rounded-lg border border-[#cbd5e1] bg-white p-4 shadow-sm" onSubmit={submit}>
                    <label className="grid gap-2">
                        <span className="flex items-center gap-2 text-sm font-black text-[#0f172a]">
                            <FaStickyNote aria-hidden="true" />
                            Nueva anotacion
                        </span>
                        <textarea
                            className={ui.textarea}
                            rows={4}
                            placeholder="Escribir una anotacion de bitacora..."
                            value={form.data.body}
                            onChange={(event) => form.setData('body', event.target.value)}
                            required
                        />
                    </label>
                    <div className="mt-3 flex justify-end">
                        <button type="submit" className={buttonClass('primary')} disabled={form.processing || form.data.body.trim() === ''}>
                            <FaSave aria-hidden="true" /> Guardar anotacion
                        </button>
                    </div>
                </form>

                <div className="grid gap-2">
                    <div className="grid gap-2 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] px-3 py-2 md:grid-cols-[auto_minmax(16rem,28rem)_auto] md:items-center">
                        <strong className="text-sm text-[#0f172a]">Bitacora</strong>
                        <label className="relative">
                            <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" aria-hidden="true" />
                            <input
                                className={cn(ui.input, 'min-h-9 pl-9')}
                                placeholder="Buscar anotaciones..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </label>
                        <span className="text-xs font-bold text-[#475569]">
                            {visibleAnnotations.length} de {annotations.length}
                        </span>
                    </div>

                    {visibleAnnotations.length > 0 ? (
                        <div className="grid gap-3">
                            {visibleAnnotations.map((annotation) => (
                                <AnnotationRow key={annotation.id} annotation={annotation} searchTerm={searchTerm} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white px-4 py-8 text-center text-sm font-semibold text-[#64748b]">
                            {annotations.length === 0 ? 'Todavia no hay anotaciones.' : 'No hay anotaciones que coincidan con la busqueda.'}
                        </div>
                    )}
                </div>
            </section>
        </RepairLayout>
    );
}
