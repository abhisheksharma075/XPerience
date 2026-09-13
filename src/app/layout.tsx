import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationShell } from "@/components/layout/NavigationShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "XPerience — Turn Your Life into an RPG",
  description: "Gamify your daily life, conquer quests, earn XP, and forge your hero.",
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark scroll-smooth ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-rpg-void text-slate-200 antialiased selection:bg-rpg-gold selection:text-rpg-void min-h-screen">
        <NavigationShell>{children}</NavigationShell>
      </body>
    </html>
  );
}
