import type { Metadata, Viewport } from "next";
import { Comic_Neue } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/providers/PrivyProvider";

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  variable: '--font-comic-neue',
  display: 'swap',
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: 'Zo World - Unicorn Onboarding',
  description: 'Enter the magical world of Zo with unicorn-themed onboarding and community events',
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    title: 'Zo World',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    shortcut: '/icons/icon-192x192.svg',
    apple: '/icons/icon-192x192.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Zo World',
    'application-name': 'Zo World',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body 
        className={`${comicNeue.className} paper-ui antialiased bg-black text-white`}
        suppressHydrationWarning
      >
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
