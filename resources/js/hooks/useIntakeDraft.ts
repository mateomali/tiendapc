import { useEffect, useRef, useState } from 'react';

let database: Promise<IDBDatabase> | undefined;
function draftDatabase(): Promise<IDBDatabase> {
    return database ??= new Promise((resolve, reject) => {
        const request = indexedDB.open('repair-intake-drafts', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('drafts');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => { database = undefined; reject(request.error); };
    });
}

// IndexedDB serializes transactions on this store in the order they are created.
async function draftOperation<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await draftDatabase();
    return new Promise<T>((resolve, reject) => {
        const transaction = db.transaction('drafts', mode);
        const request = operation(transaction.objectStore('drafts'));
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
    });
}

export function useIntakeDraft<T>({ enabled, storageKey, data, hasContent, restore }: {
    enabled: boolean;
    storageKey: string;
    data: T;
    hasContent: boolean;
    restore: (data: T) => void;
}): { ready: boolean; message: string; clear: () => Promise<void> } {
    const [ready, setReady] = useState(false);
    const [message, setMessage] = useState('');
    const latest = useRef({ data, hasContent, restore });
    latest.current = { data, hasContent, restore };
    const skipSave = useRef(false);
    const generation = useRef(0);
    const timer = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        setReady(false);
        void draftOperation('readonly', (store) => store.get(storageKey)).then((draft) => {
            if (cancelled) return;
            if (draft?.version === 1 && Date.now() - draft.savedAt < 7 * 86400000) {
                latest.current.restore(draft.data as T);
                setMessage('Borrador recuperado, incluidas las fotos.');
            }
        }).catch(() => {
            if (!cancelled) setMessage('No se pudo recuperar el borrador en este navegador.');
        }).finally(() => { if (!cancelled) setReady(true); });
        return () => { cancelled = true; };
    }, [enabled, storageKey]);

    const save = (): void => {
        window.clearTimeout(timer.current);
        if (skipSave.current) return;
        const snapshot = latest.current;
        const currentGeneration = generation.current;
        if (!snapshot.hasContent) {
            void draftOperation('readwrite', (store) => store.delete(storageKey)).catch(() => undefined);
            return;
        }
        void draftOperation('readwrite', (store) => store.put({ version: 1, savedAt: Date.now(), data: snapshot.data }, storageKey))
            .then(() => { if (generation.current === currentGeneration) setMessage('Borrador guardado en este dispositivo.'); })
            .catch(() => { if (generation.current === currentGeneration) setMessage('No se pudo guardar el borrador. Mantené esta página abierta.'); });
    };
    const saveRef = useRef(save);
    saveRef.current = save;

    useEffect(() => {
        if (!enabled || !ready) return;
        skipSave.current = false;
        timer.current = window.setTimeout(save, 350);
        return () => window.clearTimeout(timer.current);
    }, [data, hasContent, enabled, ready, storageKey]);

    useEffect(() => {
        if (!enabled || !ready) return;
        const flush = (): void => saveRef.current();
        const onHidden = (): void => { if (document.visibilityState === 'hidden') flush(); };
        document.addEventListener('visibilitychange', onHidden);
        window.addEventListener('pagehide', flush);
        return () => {
            window.clearTimeout(timer.current);
            document.removeEventListener('visibilitychange', onHidden);
            window.removeEventListener('pagehide', flush);
            flush();
        };
    }, [enabled, ready, storageKey]);

    const clear = async (): Promise<void> => {
        skipSave.current = true;
        generation.current++;
        window.clearTimeout(timer.current);
        try {
            await draftOperation('readwrite', (store) => store.delete(storageKey));
            setMessage('');
        } catch {
            setMessage('No se pudo borrar el borrador.');
        }
    };
    return { ready: !enabled || ready, message, clear };
}
