import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "@/app/globals.css";
import ClientLayout from "@/components/layout/ClientLayout";

// Định nghĩa các fonts
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net'),
  title: "AllDrama - Nền tảng xem phim trực tuyến",
  description: "Xem phim và series yêu thích của bạn tại AllDrama",
  keywords: "xem phim, phim trực tuyến, series,phim trung quốc, drama, tổng tài, phim châu Á, AllDrama, streaming",
  authors: [{ name: "AllDrama Team" }],
  creator: "AllDrama",
  publisher: "AllDrama",
  
  // Favicon và icons
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  
  // Open Graph
  openGraph: {
    title: "AllDrama - Nền tảng xem phim trực tuyến",
    description: "Xem phim và series yêu thích của bạn tại AllDrama",
    url: "https://alldrama.net",
    siteName: "AllDrama",
    images: [
      {
        url: "/logo-seo.svg",
        width: 1200,
        height: 630,
        alt: "AllDrama Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AllDrama - Nền tảng xem phim trực tuyến",
    description: "Xem phim và series yêu thích của bạn tại AllDrama",
    images: ["/logo-seo.svg"],
    creator: "@alldrama",
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark p-0 m-0" style={{ colorScheme: "dark" }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9G6QTCYQ3B"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9G6QTCYQ3B');
          `}
        </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen p-0 m-0`}
      >
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
