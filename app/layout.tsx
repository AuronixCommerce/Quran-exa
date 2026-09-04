import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quranexa AI — Ask. Read. Understand.",
  description:
    "Read the Quran, explore authentic Islamic sources, and ask grounded questions with Quranexa AI.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
