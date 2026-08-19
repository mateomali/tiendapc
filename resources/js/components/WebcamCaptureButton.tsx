import { useEffect, useRef, useState } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';

interface WebcamCaptureButtonProps {
    className: string;
    disabled?: boolean;
    label?: string;
    onCapture: (file: File) => void;
}

export function WebcamCaptureButton({
    className,
    disabled,
    label = 'Usar webcam',
    onCapture,
}: WebcamCaptureButtonProps): JSX.Element {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);

    const stopCamera = (): void => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setReady(false);
    };

    useEffect(() => {
        if (!open) {
            stopCamera();
            return;
        }

        let cancelled = false;

        const startCamera = async (): Promise<void> => {
            setError('');

            if (!navigator.mediaDevices?.getUserMedia) {
                setError('Este navegador no permite usar webcam desde esta pagina.');
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
                setReady(true);
            } catch {
                setError('No se pudo abrir la webcam. Revisa permisos o que otra app no la este usando.');
            }
        };

        void startCamera();

        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [open]);

    const close = (): void => {
        stopCamera();
        setOpen(false);
    };

    const capture = (): void => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            setError('La webcam todavia no esta lista.');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');

        if (!context) {
            setError('No se pudo capturar la imagen.');
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) {
                setError('No se pudo generar la foto.');
                return;
            }

            const file = new File([blob], `webcam-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            close();
        }, 'image/jpeg', 0.9);
    };

    return (
        <>
            <button type="button" className={className} disabled={disabled} onClick={() => setOpen(true)}>
                <FaCamera aria-hidden="true" />
                {label}
            </button>
            {open ? (
                <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/70 px-3 py-6">
                    <div className="grid w-full max-w-2xl gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                        <div className="flex items-center justify-between gap-3">
                            <strong className="text-sm text-[#0f172a]">Tomar foto con webcam</strong>
                            <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-slate-300 bg-white text-slate-700" onClick={close} aria-label="Cerrar webcam">
                                <FaTimes aria-hidden="true" />
                            </button>
                        </div>
                        <div className="overflow-hidden rounded-md border border-slate-300 bg-slate-950">
                            <video ref={videoRef} className="aspect-video w-full object-contain" playsInline muted />
                        </div>
                        {error !== '' ? (
                            <div className="rounded-md border border-[#fecdd3] bg-[#fff1f2] px-3 py-2 text-sm font-semibold text-[#be123c]">
                                {error}
                            </div>
                        ) : null}
                        <div className="flex flex-wrap justify-end gap-2">
                            <button type="button" className="min-h-9 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700" onClick={close}>
                                Cancelar
                            </button>
                            <button type="button" className="min-h-9 rounded-md border border-[#2563eb] bg-[#2563eb] px-3 text-sm font-bold text-white disabled:opacity-60" disabled={!ready} onClick={capture}>
                                Tomar foto
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
