import { SiteLayout } from '../../layouts/SiteLayout';
import type { ServiceCard } from '../../types';
import { buttonClass } from '../../ui';

interface ServicesPageProps {
    kind: 'services';
    hero: {
        eyebrow: string;
        title: string;
        description: string;
    };
    services: ServiceCard[];
    cta: {
        title: string;
        description: string;
        whatsappText: string;
        repairText: string;
        whatsappUrl: string;
        repairUrl: string;
    };
}

export default function ServicesPage({ hero, services, cta }: ServicesPageProps): JSX.Element {
    return (
        <SiteLayout title="Servicios">
            <section className="rounded-[1.35rem] border border-[rgba(124,180,243,0.76)] bg-[linear-gradient(180deg,#2f5daf_0%,#294f99_100%)] p-4 shadow-[0_16px_32px_rgba(34,75,154,0.16)]">
                <div className="rounded-[1.15rem] border border-[rgba(208,228,252,0.85)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-5 shadow-[0_14px_28px_rgba(33,74,154,0.12)]">
                    <p className="text-[0.84rem] font-black tracking-[0.04em] text-[#2f5eb6]">{hero.eyebrow}</p>
                    <h1 className="mt-3 text-[2.25rem] font-black leading-[1.1] text-[#1b2b52]">{hero.title}</h1>
                    <p className="mt-3 max-w-4xl leading-7 text-[#35517f]">{hero.description}</p>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
                {services.map((service) => (
                    <article
                        key={service.indexLabel + service.title}
                        className="grid gap-3 rounded-[1.25rem] border border-[rgba(208,228,252,0.85)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-4 shadow-[0_14px_28px_rgba(33,74,154,0.12)]"
                    >
                        <div className="rounded-[1rem] border border-[rgba(214,230,250,0.92)] bg-white p-3">
                            <img
                                src={service.imageUrl}
                                alt={service.title}
                                className="h-[180px] w-full object-contain"
                                onError={(event) => {
                                    event.currentTarget.src = service.imageFallbackUrl;
                                }}
                            />
                        </div>
                        <h2 className="text-[1.3rem] font-black text-[#1b2f58]">{service.title}</h2>
                        {service.subtitle ? <p className="text-[0.96rem] font-extrabold text-[#2b5aa8]">{service.subtitle}</p> : null}
                        {service.description ? <p className="leading-7 text-[#35517f]">{service.description}</p> : null}
                        {service.points.length > 0 ? (
                            <ul className="grid gap-1.5 pl-4 text-[#35517f]">
                                {service.points.map((point) => (
                                    <li key={point} className="list-disc">
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        ) : null}
                    </article>
                ))}
            </section>

            <section className="rounded-[1.35rem] border border-[rgba(124,180,243,0.76)] bg-[linear-gradient(180deg,#2f5daf_0%,#294f99_100%)] p-4 shadow-[0_16px_32px_rgba(34,75,154,0.16)]">
                <div className="grid gap-4 rounded-[1.15rem] border border-[rgba(208,228,252,0.85)] bg-[linear-gradient(180deg,#ffffff_0%,#eff6ff_100%)] p-5 shadow-[0_14px_28px_rgba(33,74,154,0.12)] xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                    <div>
                        <h3 className="text-[2.25rem] font-black leading-[1.1] text-[#1b2b52]">{cta.title}</h3>
                        <p className="mt-3 max-w-3xl leading-7 text-[#35517f]">{cta.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                        <a href={cta.whatsappUrl} className={buttonClass('success', 'default', 'min-h-12 px-5')}>
                            {cta.whatsappText}
                        </a>
                        <a href={cta.repairUrl} className={buttonClass('primary', 'default', 'min-h-12 px-5')}>
                            {cta.repairText}
                        </a>
                    </div>
                </div>
            </section>
        </SiteLayout>
    );
}
