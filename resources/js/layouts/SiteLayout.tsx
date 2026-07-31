import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { FlashMessages } from '../components/FlashMessages';
import type { AnnouncementItem, HeaderSearchState, SharedPageProps } from '../types';
import {
    footer,
    site,
    siteAnnouncement,
    siteAnnouncementImageClass,
    siteAnnouncementImageShellClass,
    siteAnnouncementItemClass,
    siteAnnouncementPlainImageClass,
    siteAnnouncementTextClass,
    siteCartBadgeClass,
    siteCartIconClass,
    siteCartLinkClass,
    siteMobileToggleClass,
    siteNavPillClass,
} from '../ui';

interface SiteLayoutProps extends PropsWithChildren {
    title: string;
    headerSearch?: HeaderSearchState;
    announcements?: {
        rotationMs: number;
        items: AnnouncementItem[];
    };
    announcementMode?: 'default' | 'catalogLegacy';
}

function CartNavIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 4h2l2.2 9.2a1 1 0 0 0 .97.8h8.98a1 1 0 0 0 .97-.76L20 7H7.2" />
            <circle cx="10" cy="19" r="1.55" />
            <circle cx="17" cy="19" r="1.55" />
        </svg>
    );
}

function SearchNavIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
        </svg>
    );
}

function MenuNavIcon({ open }: { open: boolean }): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {open ? (
                <>
                    <path d="M6 6l12 12" />
                    <path d="M18 6 6 18" />
                </>
            ) : (
                <>
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                </>
            )}
        </svg>
    );
}

function CloseIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}

function RepairNavIcon(): JSX.Element {
    return (
        <img src="/assets/img/repair-icon.png" alt="" aria-hidden="true" />
    );
}

function WhatsAppFooterIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
        </svg>
    );
}

function FooterLocationIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M12 21s6-4.35 6-10a6 6 0 1 0-12 0c0 5.65 6 10 6 10Z" />
            <circle cx="12" cy="11" r="2.35" />
        </svg>
    );
}

function FooterClockIcon(): JSX.Element {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 1.8" />
        </svg>
    );
}

function isExternalAnnouncementUrl(url: string | undefined): boolean {
    return /^https?:\/\//i.test((url ?? '').trim());
}

export function SiteLayout({ children, title, headerSearch, announcements, announcementMode = 'default' }: SiteLayoutProps): JSX.Element {
    const { cart, layout } = usePage<SharedPageProps>().props;
    const [search, setSearch] = useState(headerSearch?.query ?? '');
    const [searching, setSearching] = useState(false);
    const [announcementIndex, setAnnouncementIndex] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartPulse, setCartPulse] = useState(false);
    const [startupNoticeOpen, setStartupNoticeOpen] = useState(false);
    const startupNotice = layout.startupNotice;
    const startupNoticeStorageKey = startupNotice?.version ? `sudoku.startupNotice.closed.${startupNotice.version}` : '';

    useEffect(() => {
        setSearch(headerSearch?.query ?? '');
    }, [headerSearch?.query]);

    useEffect(() => {
        const pulseCart = (): void => {
            setCartPulse(false);
            window.setTimeout(() => setCartPulse(true), 20);
        };

        window.addEventListener('sudoku:cart-added', pulseCart);

        return () => window.removeEventListener('sudoku:cart-added', pulseCart);
    }, []);

    useEffect(() => {
        if (!cartPulse) {
            return;
        }

        const timeout = window.setTimeout(() => setCartPulse(false), 1350);

        return () => window.clearTimeout(timeout);
    }, [cartPulse]);

    useEffect(() => {
        if (!startupNotice?.enabled || `${startupNotice.title}${startupNotice.body}${startupNotice.imageUrl}`.trim() === '') {
            setStartupNoticeOpen(false);
            return;
        }

        const wasClosed = startupNoticeStorageKey !== '' && window.sessionStorage.getItem(startupNoticeStorageKey) === '1';
        setStartupNoticeOpen(!wasClosed);
    }, [startupNotice?.body, startupNotice?.enabled, startupNotice?.imageUrl, startupNotice?.title, startupNoticeStorageKey]);

    useEffect(() => {
        if (!startupNoticeOpen) {
            return;
        }

        const closeOnEscape = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                closeStartupNotice();
            }
        };

        window.addEventListener('keydown', closeOnEscape);

        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [startupNoticeOpen]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 861px)');
        const syncMenuState = (event: MediaQueryList | MediaQueryListEvent): void => {
            if (event.matches) {
                setMobileMenuOpen(false);
            }
        };

        syncMenuState(mediaQuery);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncMenuState);

            return () => mediaQuery.removeEventListener('change', syncMenuState);
        }

        mediaQuery.addListener(syncMenuState);

        return () => mediaQuery.removeListener(syncMenuState);
    }, []);

    useEffect(() => {
        setAnnouncementIndex(0);
    }, [announcements?.items.length]);

    useEffect(() => {
        if (!announcements || announcements.items.length <= 1) {
            return;
        }

        const interval = window.setInterval(() => {
            setAnnouncementIndex((current) => (current + 1) % announcements.items.length);
        }, announcements.rotationMs);

        return () => window.clearInterval(interval);
    }, [announcements]);

    const activeAnnouncement = announcements?.items[announcementIndex] ?? null;

    const buildSearchParams = (query: string): Record<string, string | number> => {
        const params: Record<string, string | number> = {};

        if (query.trim() !== '') {
            params.q = query.trim();
        }

        if (headerSearch?.group) {
            params.grupo = headerSearch.group;
        }

        if (headerSearch?.order && headerSearch.order !== 'fecha_ingreso') {
            params.orden = headerSearch.order;
        }

        if (headerSearch?.onlyNew) {
            params.novedades = 1;
        }

        if (headerSearch?.onlyOffers) {
            params.ofertas = 1;
        }

        if (headerSearch?.onlyFeatured) {
            params.destacados = 1;
        }

        return params;
    };

    const buildSearchUrl = (query: string): string => {
        const params = new URLSearchParams();

        Object.entries(buildSearchParams(query)).forEach(([key, value]) => {
            params.set(key, String(value));
        });

        const queryString = params.toString();

        return `${headerSearch?.actionUrl ?? route('store.catalog')}${queryString !== '' ? `?${queryString}` : ''}`;
    };

    const submitSearch = (query = search): void => {
        setMobileMenuOpen(false);
        router.visit(buildSearchUrl(query), {
            preserveState: true,
            preserveScroll: false,
            onStart: () => setSearching(true),
            onFinish: () => setSearching(false),
        });
    };

    const closeStartupNotice = (): void => {
        if (startupNoticeStorageKey !== '') {
            window.sessionStorage.setItem(startupNoticeStorageKey, '1');
        }

        setStartupNoticeOpen(false);
    };

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
        if (item.displayType === 'image' && item.imageUrl) {
            return (
                <span className={isCatalogLegacyAnnouncements ? siteAnnouncementImageShellClass : 'h-full w-full'}>
                    <picture className="block h-full w-full">
                        {item.mobileImageUrl ? <source media="(max-width: 560px)" srcSet={item.mobileImageUrl} /> : null}
                        <img src={item.imageUrl} alt={item.message || 'Anuncio promocional'} className={isCatalogLegacyAnnouncements ? siteAnnouncementImageClass : siteAnnouncementPlainImageClass} />
                    </picture>
                </span>
            );
        }

        if (isCatalogLegacyAnnouncements) {
            return <span className={siteAnnouncementTextClass}>{item.message}</span>;
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
        const itemClassName = siteAnnouncementItemClass(isActive, item.displayType === 'image' && Boolean(item.imageUrl), isCatalogLegacyAnnouncements);
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

    return (
        <>
            <Head title={title} />
            <div className={`${site.shell} catalog-font-scope`}>
                {startupNoticeOpen && startupNotice ? (
                    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/72 p-3 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="startup-notice-title">
                        <section
                            className="relative grid h-[min(86vh,720px)] w-[min(94vw,980px)] content-center gap-5 overflow-y-auto rounded-lg border border-white/20 px-5 py-10 text-center text-[#102146] shadow-[0_18px_42px_rgba(3,10,28,0.32)] sm:px-8 md:px-12"
                            style={{
                                backgroundColor: startupNotice.backgroundColor,
                                backgroundImage: startupNotice.backgroundImageUrl ? `linear-gradient(rgba(255,255,255,0.16),rgba(255,255,255,0.16)), url("${startupNotice.backgroundImageUrl}")` : undefined,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                color: startupNotice.textColor,
                            }}
                        >
                            <button
                                type="button"
                                className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.10)] transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2456b4]"
                                onClick={closeStartupNotice}
                                aria-label="Cerrar aviso"
                            >
                                <span className="h-4 w-4 [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.5] [&_svg]:[stroke-linecap:round]">
                                    <CloseIcon />
                                </span>
                            </button>
                            <div className="mx-auto grid w-full max-w-3xl gap-4">
                                {startupNotice.imageUrl.trim() !== '' ? (
                                    <picture>
                                        {startupNotice.mobileImageUrl.trim() !== '' ? <source media="(max-width: 560px)" srcSet={startupNotice.mobileImageUrl} /> : null}
                                        <img
                                            src={startupNotice.imageUrl}
                                            alt={startupNotice.title || 'Aviso importante'}
                                            className="mx-auto max-h-[min(46vh,390px)] w-full rounded-md object-contain"
                                        />
                                    </picture>
                                ) : null}
                                {startupNotice.title.trim() !== '' ? (
                                    <h2
                                        id="startup-notice-title"
                                        className="font-black uppercase leading-[0.96]"
                                        style={{ fontSize: `clamp(2rem, 7vw, ${startupNotice.titleSize}px)`, color: 'inherit' }}
                                    >
                                        {startupNotice.title}
                                    </h2>
                                ) : (
                                    <h2 id="startup-notice-title" className="sr-only">Aviso importante</h2>
                                )}
                                {startupNotice.body.trim() !== '' ? (
                                    <p
                                        className="mx-auto max-w-2xl whitespace-pre-line font-black uppercase leading-tight"
                                        style={{ fontSize: `clamp(1rem, 2.6vw, ${startupNotice.bodySize}px)`, color: 'inherit' }}
                                    >
                                        {startupNotice.body}
                                    </p>
                                ) : null}
                                {startupNotice.buttonLabel.trim() !== '' && startupNotice.buttonUrl.trim() !== '' ? (
                                    <Link
                                        href={startupNotice.buttonUrl}
                                        className="mx-auto mt-2 inline-flex min-h-12 items-center justify-center rounded-md bg-[#d71920] px-5 py-3 text-sm font-black uppercase tracking-[0.04em] text-white shadow-[0_8px_18px_rgba(168,15,23,0.22)] transition hover:bg-[#b9151b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d71920]"
                                        onClick={closeStartupNotice}
                                    >
                                        {startupNotice.buttonLabel}
                                    </Link>
                                ) : null}
                            </div>
                        </section>
                    </div>
                ) : null}
                <div className={site.frame}>
                    <header className={site.header}>
                        <div className={site.headerInner}>
                            <div className={site.brandRow}>
                                <div className={site.mobileBrandTop}>
                                    <button
                                        type="button"
                                        className={siteMobileToggleClass(mobileMenuOpen)}
                                        aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
                                        aria-expanded={mobileMenuOpen ? 'true' : 'false'}
                                        aria-controls="site-mobile-nav"
                                        onClick={() => setMobileMenuOpen((current) => !current)}
                                    >
                                        <span className={site.mobileMenuIcon}>
                                            <MenuNavIcon open={mobileMenuOpen} />
                                        </span>
                                    </button>
                                    <Link href={layout.brandUrl} className={site.logoLink} prefetch={['hover', 'click']} cacheFor="30s">
                                        <img
                                            src={layout.logoUrl}
                                            alt="Sudoku"
                                            className={site.logo}
                                            onError={(event) => {
                                                event.currentTarget.src = layout.logoFallbackUrl;
                                            }}
                                        />
                                    </Link>
                                </div>

                            <div className={site.headerCenter}>
                                {headerSearch ? (
                                    <div className={`${site.searchPanel} ${site.searchPanelHeader}`}>
                                        <div className={site.searchRow}>
                                            <input
                                                value={search}
                                                onChange={(event) => setSearch(event.currentTarget.value)}
                                                onKeyDown={(event) => {
                                                    if (event.key === 'Enter') {
                                                        submitSearch();
                                                    }
                                                }}
                                                placeholder="Buscar por producto, ejemplo: auricular o cargador..."
                                                className={site.searchInput}
                                                aria-busy={searching ? 'true' : 'false'}
                                            />
                                            <button
                                                type="button"
                                                className={`${site.searchButton} max-[860px]:before:hidden min-[861px]:inline-flex min-[861px]:min-h-[2.35rem] min-[861px]:min-w-[2.35rem] min-[861px]:items-center min-[861px]:justify-center min-[861px]:rounded-[0.72rem] min-[861px]:p-0 ${searching ? 'opacity-75' : ''}`}
                                                onClick={() => submitSearch()}
                                                aria-label="Buscar productos"
                                                disabled={searching}
                                            >
                                                <span className={site.searchButtonIcon}>
                                                    <SearchNavIcon />
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                ) : null}

                                <Link href={layout.cartUrl} className={`${site.mobileHeaderCart} ${cartPulse ? site.mobileCartPulse : ''}`} aria-label={`Ir al carrito, ${cart.count} productos`} prefetch={['hover', 'click']} cacheFor="15s">
                                    <span className={siteCartIconClass}>
                                        <CartNavIcon />
                                    </span>
                                    <span className={siteCartBadgeClass} data-cart-badge>{cart.count}</span>
                                </Link>
                            </div>

                            <div className={site.desktopStoreInfo} aria-label="Datos de la tienda">
                                <a href={layout.footer.whatsappUrl} className={site.desktopStoreInfoWhatsapp} target="_blank" rel="noreferrer" aria-label="Consultar por WhatsApp">
                                    <span className={site.desktopStoreInfoWhatsappIcon}>
                                        <WhatsAppFooterIcon />
                                    </span>
                                    <span className={site.desktopStoreInfoWhatsappText}>¿Consultas?</span>
                                </a>

                                <Link href={layout.cartUrl} className={`${siteCartLinkClass} ${cartPulse ? site.mobileCartPulse : ''}`} aria-label={`Ir al carrito, ${cart.count} productos`} prefetch={['hover', 'click']} cacheFor="15s">
                                    <span className={siteCartIconClass}>
                                        <CartNavIcon />
                                    </span>
                                    <span className={siteCartBadgeClass} data-cart-badge>{cart.count}</span>
                                </Link>
                            </div>
                            </div>
                        </div>
                    </header>

                    <div className={site.desktopNavShell}>
                        <nav className={site.desktopNavRow} aria-label="Principal">
                            {layout.navItems.map((item) => (
                                <Link
                                    key={`desktop-${item.label}`}
                                    href={item.href}
                                    className={siteNavPillClass(item.isActive)}
                                    prefetch={['hover', 'click']}
                                    cacheFor="30s"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <a href={layout.repairUrl} className={siteNavPillClass(false, false, 'repair')}>
                                Reparaciones
                                <span className={site.mobileMenuIcon}>
                                    <RepairNavIcon />
                                </span>
                            </a>
                        </nav>
                    </div>

                    {headerSearch ? (
                        <section className={site.mobileSearchDock} aria-label="Buscar productos">
                            <div className={site.mobileSearchDockInner}>
                                <div className={`${site.searchPanel} ${site.searchPanelHeader}`}>
                                    <div className={site.searchRow}>
                                        <input
                                            value={search}
                                            onChange={(event) => setSearch(event.currentTarget.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    submitSearch();
                                                }
                                            }}
                                            placeholder="Buscar ej: cargador"
                                            className={site.searchInput}
                                            aria-busy={searching ? 'true' : 'false'}
                                        />
                                        <button
                                            type="button"
                                            className={`${site.searchButton} max-[860px]:before:hidden min-[861px]:inline-flex min-[861px]:min-h-[2.35rem] min-[861px]:min-w-[2.35rem] min-[861px]:items-center min-[861px]:justify-center min-[861px]:rounded-[0.72rem] min-[861px]:p-0 ${searching ? 'opacity-75' : ''}`}
                                            onClick={() => submitSearch()}
                                            aria-label="Buscar productos"
                                            disabled={searching}
                                        >
                                            <span className={site.searchButtonIcon}>
                                                <SearchNavIcon />
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <a href={layout.cartUrl} className={`${site.mobileHeaderCart} ${cartPulse ? site.mobileCartPulse : ''}`} aria-label={`Ir al carrito, ${cart.count} productos`}>
                                    <span className={siteCartIconClass}>
                                        <CartNavIcon />
                                    </span>
                                    <span className={siteCartBadgeClass} data-cart-badge>{cart.count}</span>
                                </a>
                            </div>
                        </section>
                    ) : null}

                    {mobileMenuOpen ? (
                        <div className={site.mobileMenuOverlay} role="presentation" onClick={() => setMobileMenuOpen(false)}>
                            <nav id="site-mobile-nav" className={site.mobileMenuSheet} aria-label="Principal" onClick={(event) => event.stopPropagation()}>
                                <strong className={site.mobileMenuTitle}>Menú</strong>
                                <a href={layout.repairUrl} className={`${siteNavPillClass(false, false, 'repair')} col-span-full`} onClick={() => setMobileMenuOpen(false)}>
                                    Reparaciones
                                    <span className={site.mobileMenuIcon}>
                                        <RepairNavIcon />
                                    </span>
                                </a>
                                {layout.navItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={siteNavPillClass(item.isActive)}
                                        prefetch={['hover', 'click']}
                                        cacheFor="30s"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    ) : null}

                    {headerSearch ? (
                        <section className={site.searchStrip} aria-label="Buscar productos">
                            <div className={`${site.searchPanel} ${site.searchPanelStandalone}`}>
                                <div className={site.searchRow}>
                                    <input
                                        value={search}
                                        onChange={(event) => setSearch(event.currentTarget.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                submitSearch();
                                            }
                                        }}
                                        placeholder="Buscar por producto, ejemplo: auricular o cargador..."
                                        className={site.searchInput}
                                        aria-busy={searching ? 'true' : 'false'}
                                    />
                                    <button type="button" className={`${site.searchButton} ${searching ? 'opacity-75' : ''}`} onClick={() => submitSearch()} disabled={searching}>
                                        {searching ? 'Buscando' : 'Buscar'}
                                    </button>
                                    <Link href={layout.cartUrl} className={site.mobileCart} aria-label={`Ir al carrito, ${cart.count} productos`} prefetch={['hover', 'click']} cacheFor="15s">
                                        <span className={site.mobileCartIcon}>
                                            <CartNavIcon />
                                        </span>
                                        <span className={site.mobileCartBadge}>{cart.count}</span>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    ) : null}

                    {activeAnnouncement ? (
                        <section
                            className={isCatalogLegacyAnnouncements ? siteAnnouncement.shellCatalog : siteAnnouncement.shell}
                            aria-label="Novedades"
                        >
                            {isCatalogLegacyAnnouncements ? (
                                <div className={siteAnnouncement.track} aria-live="polite">
                                    {announcements?.items.map((item, index) => renderAnnouncementItem(item, index))}
                                    <button
                                        type="button"
                                        className={`${siteAnnouncement.arrowCatalog} ${siteAnnouncement.arrowCatalogPrev}`}
                                        onClick={() => moveAnnouncement(-1)}
                                        aria-label="Mensaje anterior"
                                        disabled={!showAnnouncementControls}
                                    >
                                        &#8249;
                                    </button>
                                    <button
                                        type="button"
                                        className={`${siteAnnouncement.arrowCatalog} ${siteAnnouncement.arrowCatalogNext}`}
                                        onClick={() => moveAnnouncement(1)}
                                        aria-label="Siguiente mensaje"
                                        disabled={!showAnnouncementControls}
                                    >
                                        &#8250;
                                    </button>
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
                    ) : null}

                    <main className={site.main}>
                        <FlashMessages />
                        {children}
                    </main>

                    <footer className={footer.root}>
                        <div className={footer.grid}>
                            <div className={`${footer.panel} ${footer.panelInfo}`}>
                                <div className={footer.heading}>
                                    <p className={footer.kicker}>Tienda</p>
                                    <p className={footer.title}>Horario y contacto</p>
                                </div>
                                <div className={footer.facts}>
                                    <div className={footer.heading}>
                                        <p className={footer.detail}>
                                            <span className={footer.detailIcon}>
                                                <FooterClockIcon />
                                            </span>
                                            <span>{layout.footer.hours}</span>
                                        </p>
                                    </div>
                                    <div className={footer.heading}>
                                        <p className={footer.detail}>
                                            <span className={footer.detailIcon}>
                                                <FooterLocationIcon />
                                            </span>
                                            <span>{layout.footer.address}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className={footer.actions}>
                                    <span className={footer.actionLabel}>{layout.footer.ctaTitle}</span>
                                    <a href={layout.footer.whatsappUrl} className={footer.whatsapp} aria-label="Abrir WhatsApp" target="_blank" rel="noreferrer">
                                        <span className={footer.whatsappText}>WhatsApp</span>
                                        <span className={footer.whatsappIcon}>
                                            <WhatsAppFooterIcon />
                                        </span>
                                    </a>
                                </div>
                            </div>
                            <div className={footer.panel}>
                                <div className={footer.heading}>
                                    <p className={footer.kicker}>Mapa</p>
                                    <p className={footer.title}>{layout.footer.address}</p>
                                </div>
                                <div className={footer.mapShell}>
                                    <iframe
                                        src={layout.footer.mapUrl}
                                        className={footer.map}
                                        title="Mapa de ubicacion de Sudoku"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
