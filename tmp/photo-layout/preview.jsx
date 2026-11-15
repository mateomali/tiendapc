import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
const cn = (...v) => v.filter(Boolean).join(' ');
const displayRepairModel = () => 'SAMSUNG A03';
const FaTrashAlt = () => '?';
const router = { post() { } };
const ModalShell = ({ children }) => children;
function MobileDevicePhotos({ repairs, readOnly }) {
    const [selectedImage, setSelectedImage] = useState(null);
    const [singlePhotoSize, setSinglePhotoSize] = useState(null);
    const images = Array.from(new Map(repairs.flatMap((repair) => [...repair.imagenes, ...repair.imagenes_finales]).map((image) => [image.filename, image])).values());
    const modelLabel = displayRepairModel(repairs[0]);
    const singlePhoto = images.length === 1;
    const photoSize = singlePhotoSize?.filename === images[0]?.filename ? singlePhotoSize : null;
    const rotatePhoto = singlePhoto && photoSize !== null && photoSize.height > photoSize.width;
    const photoRatio = photoSize ? Math.max(photoSize.width, photoSize.height) / Math.min(photoSize.width, photoSize.height) : 4 / 3;
    if (images.length === 0) {
        return !readOnly && repairs[0].actions?.addOriginalImages
            ? React.createElement(MobileModelPhotoCapture, { repair: repairs[0], modelLabel: modelLabel })
            : null;
    }
    return (React.createElement("div", { className: "mt-2 grid gap-2" },
        React.createElement("span", { className: "text-xs font-semibold text-[#475569]" }, "Fotos del dispositivo"),
        React.createElement("div", { className: "flex gap-2 overflow-x-auto" }, images.map((image) => {
            const owner = repairs.find((repair) => repair.imagenes.some((candidate) => candidate.filename === image.filename))
                ?? repairs.find((repair) => repair.imagenes_finales.some((candidate) => candidate.filename === image.filename));
            const isOriginal = owner?.imagenes.some((candidate) => candidate.filename === image.filename);
            const removeAction = isOriginal ? owner?.actions?.removeOriginalImage : owner?.actions?.removeFinalImage;
            return (React.createElement("div", { key: image.filename, className: cn('relative shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white', singlePhoto ? 'w-full' : 'h-28 w-24'), style: singlePhoto ? { aspectRatio: photoRatio } : undefined },
                React.createElement("button", { type: "button", className: "relative block h-full w-full", onClick: () => setSelectedImage(image), "aria-label": `Ver foto de ${modelLabel}` },
                    React.createElement("img", { src: singlePhoto ? image.url : image.thumbnailUrl || image.url, alt: modelLabel, className: cn('object-contain', rotatePhoto ? 'absolute left-1/2 top-1/2 max-w-none' : 'h-full w-full'), style: rotatePhoto ? { width: `${100 / photoRatio}%`, height: `${100 * photoRatio}%`, transform: 'translate(-50%, -50%) rotate(90deg)' } : undefined, onLoad: singlePhoto ? (event) => {
                            const { naturalWidth: width, naturalHeight: height } = event.currentTarget;
                            if (width > 0 && height > 0)
                                setSinglePhotoSize({ filename: image.filename, width, height });
                        } : undefined })),
                !readOnly && removeAction ? (React.createElement("button", { type: "button", className: "group absolute right-0 top-0 flex h-11 w-11 items-start justify-end rounded-md p-1 text-[#b91c1c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#dc2626]", onClick: () => router.post(removeAction, { filename: image.filename }, { preserveScroll: true }), "aria-label": `Quitar foto de ${modelLabel}`, title: "Quitar foto" },
                    React.createElement("span", { className: "grid h-6 w-6 place-items-center rounded border border-slate-200 bg-white/95 text-[11px] shadow-sm transition-colors group-hover:border-[#fecaca] group-hover:bg-[#fef2f2]" },
                        React.createElement(FaTrashAlt, { "aria-hidden": "true" })))) : null));
        })),
        selectedImage ? (React.createElement(ModalShell, { title: `Fotos del dispositivo - ${modelLabel}`, onClose: () => setSelectedImage(null) },
            React.createElement("img", { src: selectedImage.url, alt: modelLabel, className: "max-h-[70vh] w-full object-contain" }))) : null));
}
const image = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#cbd5e1"/><rect x="130" y="40" width="340" height="820" rx="30" fill="#334155"/><rect x="150" y="100" width="300" height="680" fill="#94a3b8"/><text x="300" y="450" text-anchor="middle" font-size="40">SAMSUNG</text></svg>');
const repair = { imagenes: [{ filename: 'phone.jpg', url: image }], imagenes_finales: [], actions: { removeOriginalImage: '/remove' } };
createRoot(document.getElementById('root')).render(React.createElement(MobileDevicePhotos, { repairs: [repair], readOnly: false }));
