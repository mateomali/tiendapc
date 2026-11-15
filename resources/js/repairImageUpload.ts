// Leave room for PHP multipart limits, even when a repair contains several photos.
const TARGET_BYTES = 1024 * 1024;
const MAX_BYTES = 8 * 1024 * 1024;

export async function prepareRepairImage(file: File): Promise<File> {
    if (file.size <= TARGET_BYTES) return file;
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error('No se pudo leer la foto. Probá usar formato JPG.'));
            image.src = url;
        });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context || !image.naturalWidth || !image.naturalHeight) throw new Error('No se pudo procesar la foto.');
        let scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
        for (let attempt = 0; attempt < 5; attempt++) {
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82 - attempt * 0.08));
            if (!blob) throw new Error('No se pudo comprimir la foto.');
            if (blob.size <= TARGET_BYTES) {
                return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg', lastModified: file.lastModified });
            }
            scale *= 0.75;
        }
        throw new Error('La foto sigue siendo demasiado grande. Probá tomar otra foto.');
    } catch (error) {
        // Browsers without a decoder can still upload an already valid image.
        if (file.size <= MAX_BYTES) return file;
        throw error;
    } finally {
        URL.revokeObjectURL(url);
    }
}

export async function prepareRepairImages(files: File[] | null): Promise<File[] | null> {
    if (!files) return null;
    const prepared: File[] = [];
    // Decode sequentially to avoid exhausting mobile memory with full-resolution photos.
    for (const file of files) prepared.push(await prepareRepairImage(file));
    return prepared;
}
