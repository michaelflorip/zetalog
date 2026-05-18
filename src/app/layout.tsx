import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import Header from "@/components/header";
import { SandboxBanner } from "@/components/sandbox-banner";
import ProfileSync from "@/components/profile-sync";
import ThemeProvider from "@/components/theme-provider";
import { getSiteOrigin } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "A high-performance mental math training platform for competitive mastery.";

const siteOrigin = getSiteOrigin();
const siteUrl = `${siteOrigin}/`;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: "Zetavant",
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Zetavant",
    title: "Zetavant",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Zetavant",
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-dvh`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh min-h-full flex-col bg-white text-black transition-colors duration-300 dark:bg-black dark:text-white font-sans antialiased">
        <ThemeProvider>
          <Header />
          <SandboxBanner />
          <ProfileSync>{children}</ProfileSync>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
