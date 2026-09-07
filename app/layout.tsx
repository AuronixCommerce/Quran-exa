import type { Metadata } from "next";
import "./base.css";
import "./premium.css";
import "./chat-reference.css";
import "./genz.css";
import "./genz-surfaces.css";

export const metadata: Metadata = {
  title: "Quran - Exa — Ask. Read. Understand.",
  description: "Read the Quran in Arabic, English and Urdu. Explore source-grounded Islamic knowledge with Quran - Exa.",
  other: {
    "google": "notranslate",
  },
  icons: {
    icon: "/brand/quranexa-logo.png",
    shortcut: "/brand/quranexa-logo.png",
    apple: "/brand/quranexa-logo.png",
  },
};

export default async function RootLayout({
  children, params,
}: Readonly<{
  children: React.ReactNode; params: Promise<{locale?: string}>;
}>) {
  const {locale} = await params;
  const lang = locale && ["en","ur","ar"].includes(locale) ? locale : "en";
  return (
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"} suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
