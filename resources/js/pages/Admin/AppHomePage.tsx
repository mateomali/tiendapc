import { Head, Link, usePage } from '@inertiajs/react';
import { FaCashRegister, FaClipboardList, FaExternalLinkAlt, FaPowerOff, FaTools } from 'react-icons/fa';
import type { SharedPageProps } from '../../types';
import { buttonClass } from '../../ui';

interface AppCard {
    title: string;
    description: string;
    primaryUrl: string;
    secondaryUrl: string;
    primaryLabel: string;
    secondaryLabel: string;
    tone: 'store' | 'repairs';
}

interface AppHomePageProps {
    cards: AppCard[];
    logoUrl: string;
}

const cardTone = {
    store: {
        icon: <FaCashRegister aria-hidden="true" />,
        panel: 'border-sky-200 bg-[linear-gradient(145deg,#ffffff_0%,#eef7ff_100%)]',
        iconBox: 'bg-[#0f62d8] text-white',
    },
    repairs: {
        icon: <FaTools aria-hidden="true" />,
        panel: 'border-emerald-200 bg-[linear-gradient(145deg,#ffffff_0%,#effdf6_100%)]',
        iconBox: 'bg-[#058856] text-white',
    },
};

export default function AppHomePage({ cards, logoUrl }: AppHomePageProps): JSX.Element {
    const { auth } = usePage<SharedPageProps>().props;

    return (
        <>
            <Head title="Sudoku App" />
            <main className="min-h-screen bg-[#eaf2ff] px-3 py-4 text-[#0f172a] md:px-6 md:py-6">
                <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-6xl content-center gap-5">
                    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#c6d8f3] bg-white/92 px-4 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                        <div className="flex min-w-0 items-center gap-3">
                            <img src={logoUrl} alt="Sudoku App" className="h-11 w-11 rounded-md object-contain" />
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#2563eb]">Sudoku App</p>
                                <h1 className="truncate text-2xl font-black leading-tight text-[#0f172a]">Centro de trabajo</h1>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                                {auth.user?.name ?? 'Administrador'}
                            </span>
                            <Link href={route('logout')} method="post" as="button" className={buttonClass('soft', 'sm')}>
                                <FaPowerOff aria-hidden="true" />
                                Cerrar sesion
                            </Link>
                        </div>
                    </header>

                    <div className="grid gap-4 lg:grid-cols-2">
                        {cards.map((card) => {
                            const tone = cardTone[card.tone];

                            return (
                                <article key={card.title} className={`grid min-h-[320px] content-between gap-6 rounded-lg border p-5 shadow-[0_16px_34px_rgba(15,23,42,0.10)] ${tone.panel}`}>
                                    <div className="grid gap-4">
                                        <div className={`grid h-14 w-14 place-items-center rounded-lg text-2xl shadow-[0_10px_24px_rgba(15,23,42,0.16)] ${tone.iconBox}`}>
                                            {tone.icon}
                                        </div>
                                        <div className="grid gap-2">
                                            <h2 className="text-3xl font-black leading-tight text-[#0f172a]">{card.title}</h2>
                                            <p className="max-w-xl text-base font-semibold leading-7 text-[#475569]">{card.description}</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <Link href={card.primaryUrl} className={buttonClass('primary')}>
                                            <FaExternalLinkAlt aria-hidden="true" />
                                            {card.primaryLabel}
                                        </Link>
                                        <Link href={card.secondaryUrl} className={buttonClass('soft')}>
                                            <FaClipboardList aria-hidden="true" />
                                            {card.secondaryLabel}
                                        </Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </main>
        </>
    );
}
