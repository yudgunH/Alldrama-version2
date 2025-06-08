import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về chúng tôi - Alldrama | Nền tảng xem phim trực tuyến hàng đầu",
  description: "Khám phá câu chuyện của Alldrama - nền tảng xem phim trực tuyến hàng đầu Việt Nam với hơn 5 triệu người dùng và 10,000+ tác phẩm chất lượng cao.",
  keywords: "Alldrama, về chúng tôi, xem phim trực tuyến, streaming, phim châu Á, series, giải trí",
  authors: [{ name: "Alldrama Team" }],
  creator: "Alldrama",
  publisher: "Alldrama",
  
  // Open Graph metadata
  openGraph: {
    title: "Về chúng tôi - Alldrama | Nền tảng xem phim trực tuyến hàng đầu",
    description: "Khám phá câu chuyện của Alldrama - nền tảng xem phim trực tuyến hàng đầu Việt Nam với hơn 5 triệu người dùng và 10,000+ tác phẩm chất lượng cao.",
    url: "https://alldrama.net/about",
    siteName: "Alldrama",
    images: [
      {
        url: "/logo-seo.svg",
        width: 1200,
        height: 630,
        alt: "Alldrama Logo",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  
  // Twitter Card metadata
  twitter: {
    card: "summary_large_image",
    title: "Về chúng tôi - Alldrama | Nền tảng xem phim trực tuyến hàng đầu",
    description: "Khám phá câu chuyện của Alldrama - nền tảng xem phim trực tuyến hàng đầu Việt Nam với hơn 5 triệu người dùng và 10,000+ tác phẩm chất lượng cao.",
    images: ["/logo-seo.svg"],
    creator: "@alldrama",
  },
  
  // Additional metadata
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
  
  // Verification
  verification: {
    google: "your-google-verification-code",
  },
  
  // Alternate languages
  alternates: {
    canonical: "https://alldrama.net/about",
    languages: {
      "vi-VN": "https://alldrama.net/about",
      "en-US": "https://alldrama.net/about",
    },
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Alldrama",
            description: "Nền tảng xem phim trực tuyến hàng đầu Việt Nam",
            url: "https://alldrama.net",
            logo: "https://alldrama.net/logo-seo.svg",
            image: "https://alldrama.net/logo-seo.svg",
            sameAs: [
              "https://facebook.com/alldrama",
              "https://twitter.com/alldrama",
              "https://instagram.com/alldrama",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              telephone: "+84-xxx-xxx-xxx",
              contactType: "Customer Service",
              availableLanguage: ["Vietnamese", "English"],
            },
            address: {
              "@type": "PostalAddress",
              addressCountry: "VN",
              addressLocality: "Ha Noi City",
            },
            foundingDate: "2018",
            numberOfEmployees: "100-500",
            industry: "Entertainment",
            keywords: "streaming, movies, series, entertainment, Vietnam",
          }),
        }}
      />
      {children}
    </>
  );
} 