import type { Metadata, Viewport } from "next";
import { Comic_Neue, Abril_Fatface } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/providers/PrivyProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  variable: '--font-comic-neue',
  display: 'swap',
  weight: ['400', '700']
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  variable: '--font-abril-fatface',
  display: 'swap',
  weight: '400'
});

export const metadata: Metadata = {
  title: 'Zo Zo Zo',
  description: 'Enter the magical world of Zo with unicorn-themed onboarding and community events',
  manifest: '/manifest.json?v=3',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    title: 'Zo Zo Zo',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'Zo Zo Zo',
    'application-name': 'Zo Zo Zo',
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
        className={`${comicNeue.variable} ${abrilFatface.variable} paper-ui antialiased bg-black text-white`}
        suppressHydrationWarning
      >
        <ServiceWorkerRegistration />
        <PrivyProvider>
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
