import { Link } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { AnnouncementItem } from '../types';
import {
    siteAnnouncement,
    siteAnnouncementItemClass,
    siteAnnouncementPlainImageClass,
} from '../ui';

function isExternalAnnouncementUrl(url: string | undefined): boolean {
    return /^https?:\/\//i.test((url ?? '').trim());
}

interface StoreAnnouncementsProps {
    announcements?: { rotationMs: number; items: AnnouncementItem[] };
    announcementMode?: 'default' | 'catalogLegacy';
}

function catalogAnnouncementDesign(item: AnnouncementItem): { image: string; title: string; subtitle?: string; action: string } | null {
    if (/(?:^|\/)reparaci(?:on|ones)(?:\.php)?(?:[/?#]|$)/i.test(item.linkUrl)) {
        return { image: 'catalog-repair-v2.webp', title: '¿Dejaste un equipo?', subtitle: 'Seguimiento en línea', action: 'Consultar reparación' };
    }
    if (/lista de precios|precios actualizad/i.test(item.message)) {
        return { image: 'catalog-prices-v2.webp', title: 'Precios actualizados', subtitle: 'Noviembre 2026', action: 'Ver productos' };
    }
    if (/^https?:\/\/(?:wa\.me|(?:api\.|web\.)?whatsapp\.com)(?:\/|$)/i.test(item.linkUrl)) {
        return { image: 'catalog-contact-v2.webp', title: '¿Tenés una consulta?', subtitle: 'Te ayudamos a elegir', action: 'Escribinos por WhatsApp' };
    }
    return null;
}

export function StoreAnnouncements({ announcements, announcementMode = 'default' }: StoreAnnouncementsProps): JSX.Element | null {
    const [announcementIndex, setAnnouncementIndex] = useState(0);
    const [failedAnnouncementImages, setFailedAnnouncementImages] = useState<string[]>([]);
    const [paused, setPaused] = useState(false);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [rotationStopped, setRotationStopped] = useState(false);
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    useEffect(() => {
        setAnnouncementIndex(0);
    }, [announcements?.items.length]);

    useEffect(() => {
        if (!announcements || announcements.items.length <= 1 || paused || hovered || focused || rotationStopped || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        const interval = window.setInterval(() => {
            setAnnouncementIndex((current) => (current + 1) % announcements.items.length);
        }, announcementMode === 'catalogLegacy' ? Math.max(6000, announcements.rotationMs) : announcements.rotationMs);

        return () => window.clearInterval(interval);
    }, [announcements, paused, hovered, focused, rotationStopped, announcementMode]);

    const activeAnnouncement = announcements?.items[announcementIndex] ?? null;

    const showAnnouncementControls = (announcements?.items.length ?? 0) > 1;
    const isCatalogLegacyAnnouncements = announcementMode === 'catalogLegacy';

    const moveAnnouncement = (direction: -1 | 1): void => {
        if (!announcements || announcements.items.length <= 1) {
            return;
        }

        setAnnouncementIndex((current) => {
            const next = current + direction;

            if (next < 0) {
                return announcements.items.length - 1;
            }

            return next % announcements.items.length;
        });
    };

    const renderAnnouncementVisual = (item: AnnouncementItem): JSX.Element => {
        const design = isCatalogLegacyAnnouncements ? catalogAnnouncementDesign(item) : null;
        if (design) {
            return (
                <span className="catalog-feature-announcement">
                    <img src={`/assets/img/${design.image}`} alt="" width="480" height="160" decoding="async" />
                    <span className="catalog-feature-copy">
                        <strong>{design.title}</strong>
                        {design.subtitle ? <span>{design.subtitle}</span> : null}
                        <span className="catalog-feature-action">{design.action} <span aria-hidden="true">→</span></span>
                    </span>
                </span>
            );
        }
        if (item.displayType === 'image' && item.imageUrl && !failedAnnouncementImages.includes(item.imageUrl)) {
            return (
                <span className={isCatalogLegacyAnnouncements ? 'catalog-announcement-image' : 'h-full w-full'}>
                    <picture className="block h-full w-full">
                        {item.mobileImageUrl ? <source media="(max-width: 560px)" srcSet={item.mobileImageUrl} /> : null}
                        <img onError={() => setFailedAnnouncementImages((current) => [...current, item.imageUrl!])} src={item.imageUrl} alt={item.message || 'Anuncio promocional'} className={isCatalogLegacyAnnouncements ? undefined : siteAnnouncementPlainImageClass} />
                    </picture>
                </span>
            );
        }

        if (isCatalogLegacyAnnouncements) {
            return <span className="catalog-announcement-text">{item.message}</span>;
        }

        return (
            <div className={siteAnnouncement.copy}>
                <span className={siteAnnouncement.kicker}>Novedades</span>
                <strong>{item.message}</strong>
            </div>
        );
    };

    const renderAnnouncementItem = (item: AnnouncementItem, index: number): JSX.Element => {
        const isActive = index === announcementIndex;
        const itemClassName = isCatalogLegacyAnnouncements ? 'catalog-inline-announcement' : siteAnnouncementItemClass(isActive, item.displayType === 'image' && Boolean(item.imageUrl), false);
        const content = renderAnnouncementVisual(item);
        const href = (item.linkUrl ?? '').trim();

        if (href === '' || href === '#') {
            return (
                <span key={`announcement-${item.id}-${index}`} className={itemClassName}>
                    {content}
                </span>
            );
        }

        if (isExternalAnnouncementUrl(href)) {
            return (
                <a key={`announcement-${item.id}-${index}`} href={href} className={itemClassName} target="_blank" rel="noopener noreferrer">
                    {content}
                </a>
            );
        }

        return (
            <Link key={`announcement-${item.id}-${index}`} href={href} className={itemClassName} prefetch={['hover', 'click']} cacheFor="30s">
                {content}
            </Link>
        );
    };

    if (!activeAnnouncement) return null;

    return (
        <section
            className={isCatalogLegacyAnnouncements ? 'catalog-inline-announcements' : siteAnnouncement.shell}
            aria-label="Novedades"
            aria-roledescription={isCatalogLegacyAnnouncements ? 'carrusel' : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onFocus={(event) => { setFocused(true); if (isCatalogLegacyAnnouncements && event.target.matches(':focus-visible') && !event.currentTarget.contains(event.relatedTarget)) setRotationStopped(true); }}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        >
            {isCatalogLegacyAnnouncements ? (
                <div className="catalog-announcement-row">
                    {showAnnouncementControls ? <button className="catalog-banner-playback" type="button" aria-label={rotationStopped ? 'Reanudar anuncios' : 'Pausar anuncios'} title={rotationStopped ? 'Reanudar anuncios' : 'Pausar anuncios'} onClick={() => setRotationStopped((stopped) => !stopped)}><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{rotationStopped ? <path d="m9 5 11 7-11 7Z" /> : <><path d="M8 5v14" /><path d="M16 5v14" /></>}</svg></button> : null}
                    {showAnnouncementControls ? <button className="catalog-announcement-arrow is-prev" type="button" onClick={() => moveAnnouncement(-1)} aria-label="Mensaje anterior">‹</button> : null}
                    <div className="catalog-banner-stage"
                        onTouchStart={(event) => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; setPaused(true); }}
                        onTouchEnd={(event) => {
                            const touch = event.changedTouches[0];
                            const start = touchStart.current;
                            touchStart.current = null;
                            if (!start) return;
                            const dx = touch.clientX - start.x;
                            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(touch.clientY - start.y)) moveAnnouncement(dx < 0 ? 1 : -1);
                            setPaused(false);
                        }}
                        onTouchCancel={() => { touchStart.current = null; setPaused(false); }}
                    >
                        {renderAnnouncementItem(activeAnnouncement, announcementIndex)}
                    </div>
                    {showAnnouncementControls ? <button className="catalog-announcement-arrow is-next" type="button" onClick={() => moveAnnouncement(1)} aria-label="Siguiente mensaje">›</button> : null}
                    {showAnnouncementControls ? (
                        <div className="catalog-banner-pagination" role="group" aria-label="Elegir anuncio">
                            {announcements!.items.map((item, index) => <button key={item.id} type="button" aria-label={`Mostrar anuncio: ${catalogAnnouncementDesign(item)?.title ?? item.message}`} aria-pressed={index === announcementIndex} onClick={() => setAnnouncementIndex(index)}><span /></button>)}
                        </div>
                    ) : null}
                </div>
            ) : (
                <>
                    <button
                        type="button"
                        className={siteAnnouncement.arrow}
                        onClick={() => moveAnnouncement(-1)}
                        aria-label="Anterior"
                        disabled={!showAnnouncementControls}
                    >
                        &#8249;
                    </button>
                    {renderAnnouncementItem(activeAnnouncement, announcementIndex)}
                    <button
                        type="button"
                        className={siteAnnouncement.arrow}
                        onClick={() => moveAnnouncement(1)}
                        aria-label="Siguiente"
                        disabled={!showAnnouncementControls}
                    >
                        &#8250;
                    </button>
                </>
            )}
        </section>
    );
}
