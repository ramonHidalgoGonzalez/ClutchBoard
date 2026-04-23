import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { QueryProvider } from "@/lib/query-provider";

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
  title: "Valorant Tracker Personal",
  description: "Dashboard personal de VALORANT con Riot RSO, analytics derivadas y modo demo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
