interface OrganizationStructuredDataProps {
  className?: string;
}

export default function OrganizationStructuredData({ className = '' }: OrganizationStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net';
  
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AllDrama",
    "alternateName": ["All Drama", "AllDrama.net"],
    "description": "Nền tảng xem phim trực tuyến hàng đầu Việt Nam với hơn 10,000 bộ phim và series chất lượng cao",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/logo-192x192.png`,
      "width": 192,
      "height": 192,
      "caption": "AllDrama Logo"
    },
    "image": [
      `${baseUrl}/logo-192x192.png`,
      `${baseUrl}/logo.svg`,
      `${baseUrl}/logo-seo.svg`
    ],
    "foundingDate": "2018",
    "founders": [
      {
        "@type": "Person",
        "name": "AllDrama Team"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "VN",
      "addressLocality": "Hà Nội"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Vietnamese", "English"],
        "url": `${baseUrl}/contact`
      }
    ],
    "sameAs": [
      "https://facebook.com/alldrama",
      "https://twitter.com/alldrama", 
      "https://instagram.com/alldrama",
      "https://youtube.com/@alldrama"
    ],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`,
        "actionPlatform": [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform"
        ]
      },
      "query-input": "required name=search_term_string"
    },
    "knowsAbout": [
      "Phim trực tuyến",
      "Series châu Á", 
      "Phim Trung Quốc",
      "Drama Hàn Quốc",
      "Phim Thái Lan",
      "Entertainment streaming",
      "Video on demand"
    ],
    "areaServed": {
      "@type": "Country",
      "name": "Vietnam"
    },
    "serviceType": "Entertainment Streaming Platform",
    "audience": {
      "@type": "Audience",
      "audienceType": "Movie and TV Show Enthusiasts",
      "geographicArea": {
        "@type": "Country",
        "name": "Vietnam"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebSite",
      "url": baseUrl,
      "name": "AllDrama",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    }
  };

  // Remove undefined fields
  const cleanedData = JSON.parse(JSON.stringify(organizationData));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(cleanedData, null, 2)
      }}
      className={className}
    />
  );
} 