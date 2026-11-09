import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, IBM_Plex_Mono, Noto_Serif_Display } from "next/font/google";
import { notFound } from "next/navigation";
import { InlineScript } from "@/components/InlineScript";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { getDict, isLang, LANGS } from "@/lib/i18n";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

// Fraunces has no Cyrillic, so Mongolian headings fall through to this
// high-contrast serif (cyrillic-ext carries Ө and Ү). It only downloads on
// pages that use those letters.
const notoSerif = Noto_Serif_Display({
  variable: "--font-serif-cyrillic",
  subsets: ["cyrillic", "cyrillic-ext"],
  style: ["normal", "italic"],
  preload: false,
});

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    title: t.meta.title,
    description: t.meta.description,
    alternates: { languages: { en: "/en", mn: "/mn" } },
    openGraph: { title: t.name.full, description: t.meta.description, type: "website", locale: lang === "mn" ? "mn_MN" : "en_US" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ece5d4" },
    { media: "(prefers-color-scheme: dark)", color: "#11131b" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html
      lang={lang}
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${plexMono.variable} ${fraunces.variable} ${notoSerif.variable}`}
    >
      <head>
        {/* Sets day or night before the first paint, so the page never flashes the wrong one */}
        <InlineScript html={THEME_SCRIPT} />
      </head>
      <body>{children}</body>
    </html>
  );
}
