import type { Metadata } from "next";
import { Jost, Karla, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-jost",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-karla",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nyatet",
  description: "A small place for your notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${jost.variable} ${karla.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
