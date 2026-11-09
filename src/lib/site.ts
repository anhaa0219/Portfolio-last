// Facts that are the same in every language. The words themselves live in
// i18n.ts.

export const site = {
  timezone: "Asia/Ulaanbaatar",
  email: "anhaadiamond2002@gmail.com",
  phone: "+976 8924 0319",
  phoneHref: "tel:+97689240319",
  instagram: "anhaa.0219",
  instagramHref: "https://instagram.com/anhaa.0219",
  github: "anhaa0219",
  githubHref: "https://github.com/anhaa0219",
  /** His GitHub profile photo, saved locally so the page never waits on GitHub. */
  photo: "/ankhbayar.jpg",
} as const;

/** What he builds with, taken from the dependencies of his own repositories. */
export const stack = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "Prisma",
  "Supabase",
  "JWT auth",
  "Zod",
  "Cloudinary",
  "Claude API",
  "Gemini API",
] as const;

/** The service rows, in order; their words are `services.items` in i18n.ts. */
export const services = [
  { index: "01", tools: ["Next.js", "React", "TypeScript", "Tailwind"], demo: "storefront" },
  { index: "02", tools: ["Node.js", "Express", "MongoDB", "PostgreSQL"], demo: "api" },
  { index: "03", tools: ["Claude API", "Gemini API", "Webhooks", "Cron"], demo: "automation" },
] as const;
