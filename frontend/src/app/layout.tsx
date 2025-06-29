import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "@/app/globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import OrganizationStructuredData from "@/components/seo/OrganizationStructuredData";
import MetaTagsValidator from "@/components/seo/MetaTagsValidator";

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
  title: "Xem Phim Trực Tuyến - All Drama | Phim Châu Á, Drama Hàn Quốc, Phim Trung Quốc",
  description: "All Drama - Trang xem phim trực tuyến miễn phí hàng đầu Việt Nam. Phim châu Á, drama Hàn Quốc, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt chất lượng HD. Cập nhật mới nhất 2024.",
  keywords: [
    // Brand keywords
    "alldrama", "all drama", "AllDrama",
    // Generic movie keywords
    "xem phim", "phim trực tuyến", "phim online", "trang phim", "web phim", 
    "xem phim miễn phí", "phim hay", "phim mới", "phim hot",
    // Asian content keywords  
    "phim châu á", "drama châu á", "phim asia",
    "phim trung quốc", "phim tq", "drama trung quốc", "phim cổ trang trung quốc",
    "phim hàn quốc", "drama hàn", "phim han", "k-drama", "korean drama",
    "phim thái lan", "drama thái", "phim thai",
    "phim nhật bản", "drama nhật", "j-drama",
    // Genre keywords
    "phim tình cảm", "phim lãng mạn", "phim ngôn tình", "phim tổng tài",
    "phim hành động", "phim kinh dị", "phim hài", "phim chiến tranh",
    "phim cung đấu", "phim cổ trang", "phim hiện đại", "phim đô thị",
    // Quality keywords
    "phim hd", "phim chất lượng cao", "phim vietsub", "phim phụ đề việt",
    "phim full hd", "phim 4k", "phim bluray",
    // Streaming keywords
    "streaming", "xem phim streaming", "phim stream", "video on demand",
    "watch online", "free movies", "free drama"
  ].join(", "),
  authors: [{ name: "AllDrama Team" }],
  creator: "AllDrama - Xem Phim Trực Tuyến",
  publisher: "AllDrama Entertainment",
  
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
    title: "Xem Phim Trực Tuyến Miễn Phí - All Drama | Phim Châu Á HD",
    description: "All Drama - Trang xem phim trực tuyến miễn phí hàng đầu Việt Nam. Drama Hàn Quốc, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt chất lượng HD. Cập nhật mới nhất 2024.",
    url: "https://alldrama.net",
    siteName: "AllDrama - Xem Phim Trực Tuyến",
    images: [
      {
        url: "/logo-192x192.png",
        width: 192,
        height: 192,
        alt: "AllDrama Logo - Xem Phim Trực Tuyến",
        type: "image/png",
      },
      {
        url: "/logo-seo.svg",
        width: 1200,
        height: 630,
        alt: "AllDrama - Phim Trực Tuyến Châu Á",
        type: "image/svg+xml",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Xem Phim Trực Tuyến Miễn Phí - All Drama | Phim Châu Á HD",
    description: "All Drama - Trang xem phim trực tuyến miễn phí hàng đầu Việt Nam. Drama Hàn Quốc, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt chất lượng HD.",
    images: ["/logo-192x192.png"],
    creator: "@alldrama",
    site: "@alldrama_official",
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
  
  // Additional metadata cho better SEO
  alternates: {
    canonical: "https://alldrama.net",
  },
  
  // App metadata
  applicationName: "AllDrama - Xem Phim Trực Tuyến",
  
  // Additional structured hints
  other: {
    "theme-color": "#E50914",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    // SEO hints
    "content-language": "vi-VN",
    "geo.region": "VN",
    "geo.country": "Vietnam",
    "target-country": "VN"
  }
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
        
        {/* Popunder Advertisement */}
        <Script
          src="//pl26011313.profitableratecpm.com/5b/37/32/5b37326563517fd77befc14a649b3002.js"
          strategy="afterInteractive"
        />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen p-0 m-0`}
      >
        <ClientLayout>{children}</ClientLayout>
        <MetaTagsValidator />
        <Analytics />
        
        {/* Social Bar Advertisement */}
        <Script
          src="//pl26011345.profitableratecpm.com/41/2c/78/412c7823fde1808f4dead1cfc800a971.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
