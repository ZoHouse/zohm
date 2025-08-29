import type { Metadata, Viewport } from "next";
import { Comic_Neue } from "next/font/google";
import "./globals.css";

const comicNeue = Comic_Neue({
  subsets: ["latin"],
  variable: '--font-comic-neue',
  display: 'swap',
  weight: ['400', '700']
});

export const metadata: Metadata = {
  title: 'zohm',
  description: 'Interactive map of Zo House events and community members',
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    title: 'Zo House',
    statusBarStyle: 'black-translucent',
    capable: true,
  },
  icons: {
    icon: '/spinner_Z_4.gif',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
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
      <body className={`${comicNeue.className} paper-ui antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
