import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "@/app/globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import OrganizationStructuredData from "@/components/seo/OrganizationStructuredData";

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
  title: "AllDrama - Nền tảng xem phim trực tuyến hàng đầu Việt Nam",
  description: "Xem phim và series châu Á yêu thích của bạn tại AllDrama. Hơn 10,000+ bộ phim chất lượng cao với phụ đề tiếng Việt.",
  keywords: "xem phim, phim trực tuyến, series, phim trung quốc, drama, tổng tài, phim châu Á, AllDrama, streaming, phim Hàn Quốc, phim Thái Lan",
  authors: [{ name: "AllDrama Team" }],
  creator: "AllDrama",
  publisher: "AllDrama",
  
  // Favicon và icons - Cải thiện cho Google
  icons: {
    icon: [
      { url: "/logo-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  
  // Open Graph - Cải thiện để Google hiển thị logo tốt hơn
  openGraph: {
    title: "AllDrama - Nền tảng xem phim trực tuyến hàng đầu Việt Nam",
    description: "Xem phim và series châu Á yêu thích của bạn tại AllDrama. Hơn 10,000+ bộ phim chất lượng cao với phụ đề tiếng Việt.",
    url: "https://alldrama.net",
    siteName: "AllDrama",
    images: [
      {
        url: "/logo-192x192.png",
        width: 192,
        height: 192,
        alt: "AllDrama Logo",
        type: "image/png",
      },
      {
        url: "/logo-seo.svg",
        width: 1200,
        height: 630,
        alt: "AllDrama Banner",
        type: "image/svg+xml",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AllDrama - Nền tảng xem phim trực tuyến hàng đầu Việt Nam",
    description: "Xem phim và series châu Á yêu thích của bạn tại AllDrama. Hơn 10,000+ bộ phim chất lượng cao với phụ đề tiếng Việt.",
    images: ["/logo-192x192.png"],
    creator: "@alldrama",
    site: "@alldrama",
  },
  
  // Manifest
  manifest: "/manifest.json",
  
  // Robots - Cải thiện để Google index tốt hơn
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

  // Thêm verification cho Google Search Console
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
  },

  // Cải thiện metadata cho mobile
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },

  // Category để Google hiểu rõ hơn về website
  category: "Entertainment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark p-0 m-0" style={{ colorScheme: "dark" }}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <OrganizationStructuredData />
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
