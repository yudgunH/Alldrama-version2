import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { SWRConfig } from 'swr';

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
  title: "AllDrama - Nền tảng xem phim trực tuyến",
  description: "Xem phim và series yêu thích của bạn tại AllDrama",
};

// Global SWR configuration to optimize API calls
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 10000, // 10 seconds
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  loadingTimeout: 10000,
  focusThrottleInterval: 5000,
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen p-0 m-0`}
      >
        <SWRConfig value={swrConfig}>
        <ClientLayout>{children}</ClientLayout>
        </SWRConfig>
      </body>
    </html>
  );
}
