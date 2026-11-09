import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense, type CSSProperties } from "react";
import { AsciiHero } from "@/components/ascii/AsciiHero";
import { CloudBand } from "@/components/ascii/CloudBand";
import { ServiceDemo } from "@/components/demos/ServiceDemo";
import { ContributionGraph } from "@/components/github/ContributionGraph";
import { CopyButton, LocalTime, Reveal, ScrollMeter, Tilt } from "@/components/interactive";
import { Loader } from "@/components/Loader";
import { Scramble } from "@/components/motion";
import { Chars, Headline, Words, wordCount } from "@/components/text";
import { LangSwitch, ThemeToggle } from "@/components/theme";
import { getContributions } from "@/lib/github";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import { services, site, stack } from "@/lib/site";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** A nav link whose word rolls up to a copy of itself on hover. */
function RollLink({ href, text }: { href: string; text: string }) {
  return (
    <a href={href} className="nav-link">
      <span className="roll" data-text={text}>
        <span>{text}</span>
      </span>
    </a>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const other: Lang = lang === "en" ? "mn" : "en";

  return (
    <>
      <Loader lang={lang} />
      <a className="skip" href="#services">
        {t.nav.skip}
      </a>

      <header className="nav">
        <a className="nav__mark" href="#top" aria-label={`${t.name.full}, ${t.nav.top}`}>
          <span className="mark mark--photo" aria-hidden>
            <Image src={site.photo} alt="" width={64} height={64} priority />
          </span>
          <span className="nav__name">{t.name.first}</span>
        </a>
        <nav className="nav__links" aria-label={t.nav.services}>
          <RollLink href="#services" text={t.nav.services} />
          <RollLink href="#about" text={t.nav.about} />
          <RollLink href="#github" text={t.nav.github} />
          <RollLink href="#contact" text={t.nav.contact} />
        </nav>
        <span className="nav__meta label">
          <LocalTime zone={site.timezone} label={t.nav.clock} />
        </span>
        <div className="nav__toggles">
          <LangSwitch to={other} text={t.toggles.lang} label={t.toggles.langLabel} />
          <ThemeToggle label={t.toggles.themeLabel} />
        </div>
      </header>

      <main id="top">
        <AsciiHero className="hero" labels={t.hero}>
          <div className="hero__copy">
            <p className="label hero__kicker">
              <span className="dot" aria-hidden /> <Scramble text={t.hero.kicker} />
            </p>
            <h1 className="hero__title">
              <Chars className="hero__line" text={t.name.first} />
              <Chars className="hero__line hero__line--2" text={t.name.last} start={t.name.first.length} />
            </h1>
            <p className="hero__lede">
              <Words text={t.hero.lede} start={6} />
            </p>
            <div className="hero__cta" data-no-drag>
              <a className="btn btn--ink" href="#contact">
                {t.hero.start}
              </a>
              <a className="btn" href="#about">
                {t.hero.about}
              </a>
            </div>
          </div>
        </AsciiHero>

        <section id="services" className="section">
          <Reveal className="section__head">
            <p className="label">
              <Scramble text={t.services.label} />
            </p>
            <h2 className="h2">
              <Headline parts={t.services.title} />
            </h2>
            <p className="section__lede">
              <Words text={t.services.lede} start={4} />
            </p>
          </Reveal>

          <div className="services">
            {services.map((s, n) => {
              const copy = t.services.items[n];
              return (
                <article key={s.index} className="service" data-flip={n % 2 === 1 || undefined}>
                  <Reveal className="service__copy">
                    <span className="service__index">
                      <Scramble text={s.index} />
                    </span>
                    <h3 className="h3">
                      <Words text={copy.title} />
                    </h3>
                    <p className="service__lede">
                      <Words text={copy.lede} start={wordCount(copy.title)} />
                    </p>
                    <ul className="service__points">
                      {copy.points.map((p, k) => (
                        <li key={p} style={i(k)}>
                          <span>
                            <Words text={p} start={8 + k * 6} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <ul className="chips" aria-label={t.services.tools}>
                      {s.tools.map((tool, k) => (
                        <li key={tool} className="chip" style={i(k)}>
                          {tool}
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                  <Reveal className="service__demo" delay={120}>
                    <ServiceDemo demo={s.demo} lang={lang} replay={t.services.replay} label={`${t.services.fig} ${s.index} · ${copy.title}`} />
                  </Reveal>
                </article>
              );
            })}
          </div>
        </section>

        <CloudBand className="divider" bank="both" cover={0.5} />

        <section id="about" className="section about">
          <Reveal className="about__photo">
            <Tilt className="portrait" max={8}>
              <figure className="portrait__frame">
                <Image src={site.photo} alt={t.about.photoAlt} width={460} height={460} sizes="(max-width: 900px) 80vw, 420px" />
                <span className="portrait__glare" aria-hidden />
              </figure>
            </Tilt>
            <p className="label portrait__cap">
              <Scramble text={`${t.name.full} · ${t.location}`} />
            </p>
          </Reveal>

          <Reveal className="about__copy" delay={120}>
            <p className="label">
              <Scramble text={t.about.label} />
            </p>
            <h2 className="h2">
              <Headline parts={t.about.title} />
            </h2>
            <p className="section__lede">
              <Words text={t.about.lede} start={4} />
            </p>
            <ul className="chips" aria-label={t.about.tools}>
              {stack.slice(0, 10).map((tool, k) => (
                <li key={tool} className="chip" style={i(k)}>
                  {tool}
                </li>
              ))}
            </ul>
            <div className="about__cta">
              <a className="btn btn--ink" href="#contact">
                {t.about.work}
              </a>
              <a className="btn" href={site.githubHref} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </div>
          </Reveal>
        </section>

        <section id="github" className="section">
          <Reveal className="section__head">
            <p className="label">
              <Scramble text={t.github.label} />
            </p>
            <h2 className="h2">
              <Headline parts={t.github.title} />
            </h2>
            <p className="section__lede">
              <Words text={t.github.lede} start={4} />
            </p>
          </Reveal>
          <Reveal>
            <Suspense fallback={<GithubFallback lang={lang} />}>
              <GithubActivity lang={lang} />
            </Suspense>
          </Reveal>
        </section>

        <section id="contact" className="section contact">
          <Reveal className="section__head">
            <p className="label">
              <Scramble text={t.contact.label} />
            </p>
            <h2 className="h2 h2--xl">
              <Headline parts={t.contact.title} />
            </h2>
            <p className="section__lede">
              <Words text={t.contact.lede} start={5} />
            </p>
          </Reveal>

          <ul className="contact__list">
            <Reveal as="li" className="contact__row">
              <span className="label">
                <Scramble text={t.contact.email} />
              </span>
              <a className="contact__value roll" data-text={site.email} href={`mailto:${site.email}`}>
                <span>{site.email}</span>
              </a>
              <CopyButton value={site.email} copiedText={t.contact.copied} className="contact__action">
                {t.contact.copy}
              </CopyButton>
            </Reveal>
            <Reveal as="li" className="contact__row" delay={90}>
              <span className="label">
                <Scramble text={t.contact.phone} />
              </span>
              <a className="contact__value roll" data-text={site.phone} href={site.phoneHref}>
                <span>{site.phone}</span>
              </a>
              <span className="contact__action contact__action--hint label">
                <Scramble text={t.contact.call} />
              </span>
            </Reveal>
            <Reveal as="li" className="contact__row" delay={180}>
              <span className="label">
                <Scramble text={t.contact.instagram} />
              </span>
              <a className="contact__value roll" data-text={`@${site.instagram}`} href={site.instagramHref} target="_blank" rel="noreferrer">
                <span>@{site.instagram}</span>
              </a>
              <span className="contact__action contact__action--hint label">↗</span>
            </Reveal>
            <Reveal as="li" className="contact__row" delay={270}>
              <span className="label">
                <Scramble text={t.contact.github} />
              </span>
              <a className="contact__value roll" data-text={`@${site.github}`} href={site.githubHref} target="_blank" rel="noreferrer">
                <span>@{site.github}</span>
              </a>
              <span className="contact__action contact__action--hint label">↗</span>
            </Reveal>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <CloudBand className="footer__clouds" bank="bottom" cover={0.62} size={13} />
        <div className="footer__row label">
          <Scramble text={`© 2026 ${t.name.full}`} />
          <Scramble text={t.footer.built} />
          <Scramble text={t.location} />
        </div>
      </footer>

      <ScrollMeter />
    </>
  );
}

async function GithubActivity({ lang }: { lang: Lang }) {
  const data = await getContributions(site.github);
  if (!data) return <GithubFallback lang={lang} />;
  return <ContributionGraph data={data} profile={site.github} lang={lang} />;
}

function GithubFallback({ lang }: { lang: Lang }) {
  const t = getDict(lang).github;
  return (
    <div className="gh-card gh-card--empty">
      <p>
        {t.fallback}{" "}
        <a className="link" href={site.githubHref} target="_blank" rel="noreferrer">
          {t.see}
        </a>
      </p>
    </div>
  );
}
