import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://quranexa-ai.vs26bf9tsc.chatgpt.site"),
  title: "Quranexa AI — Ask. Read. Understand.",
  description: "Read the Quran in Arabic, English and Urdu. Explore Islamic knowledge through verified sources.",
  other: {
    "codex-preview": "development",
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
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
