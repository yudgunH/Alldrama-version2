import React from 'react';

interface HomepageSEOContentProps {
  className?: string;
}

export default function HomepageSEOContent({ className = '' }: HomepageSEOContentProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alldrama.net';

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite", 
    "name": "AllDrama - Xem Phim Trực Tuyến",
    "alternateName": ["All Drama", "AllDrama.net", "Xem Phim", "Phim Trực Tuyến"],
    "url": baseUrl,
    "description": "Trang xem phim trực tuyến miễn phí hàng đầu Việt Nam. Phim châu Á, drama Hàn Quốc, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt chất lượng HD.",
    "inLanguage": "vi-VN",
    "potentialAction": [
      {
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
      }
    ],
    "mainEntity": {
      "@type": "ItemList",
      "name": "Danh sách phim trực tuyến",
      "description": "Kho phim châu Á đa dạng với chất lượng HD",
      "numberOfItems": 10000,
      "itemListElement": [
        {
          "@type": "Movie",
          "name": "Phim Trung Quốc",
          "description": "Tuyển tập phim Trung Quốc hay nhất"
        },
        {
          "@type": "Movie", 
          "name": "Drama Hàn Quốc",
          "description": "K-Drama với phụ đề tiếng Việt"
        },
        {
          "@type": "Movie",
          "name": "Phim Thái Lan",
          "description": "Phim Thái Lan lãng mạn và hành động"
        }
      ]
    },
    "audience": {
      "@type": "Audience",
      "audienceType": "Người yêu phim châu Á",
      "geographicArea": {
        "@type": "Country",
        "name": "Việt Nam"
      }
    },
    "about": [
      {
        "@type": "Thing",
        "name": "Phim trực tuyến",
        "description": "Xem phim online miễn phí"
      },
      {
        "@type": "Thing", 
        "name": "Drama châu Á",
        "description": "Phim châu Á chất lượng cao"
      },
      {
        "@type": "Thing",
        "name": "Phim vietsub",
        "description": "Phim có phụ đề tiếng Việt"
      }
    ]
  };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Trang chủ",
        "item": baseUrl
      },
      {
        "@type": "ListItem", 
        "position": 2,
        "name": "Xem phim trực tuyến",
        "item": `${baseUrl}/movie`
      },
      {
        "@type": "ListItem",
        "position": 3, 
        "name": "Phim mới nhất",
        "item": `${baseUrl}/movie?sort=newest`
      }
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "AllDrama là gì?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AllDrama (All Drama) là trang web xem phim trực tuyến miễn phí hàng đầu Việt Nam, chuyên cung cấp phim châu Á như drama Hàn Quốc, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt chất lượng HD."
        }
      },
      {
        "@type": "Question", 
        "name": "Có miễn phí xem phim trên AllDrama không?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Có, AllDrama cung cấp dịch vụ xem phim trực tuyến hoàn toàn miễn phí. Bạn có thể xem tất cả phim và drama châu Á mà không cần đăng ký tài khoản."
        }
      },
      {
        "@type": "Question",
        "name": "AllDrama có những loại phim gì?",
        "acceptedAnswer": {
          "@type": "Answer", 
          "text": "AllDrama có đa dạng thể loại phim châu Á: Drama Hàn Quốc (K-Drama), phim Trung Quốc (phim cổ trang, hiện đại, tổng tài), phim Thái Lan, phim Nhật Bản với các thể loại tình cảm, hành động, kinh dị, hài hước."
        }
      },
      {
        "@type": "Question",
        "name": "Phim trên AllDrama có phụ đề tiếng Việt không?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Có, tất cả phim trên AllDrama đều có phụ đề tiếng Việt chất lượng cao, được dịch chính xác và đồng bộ với hình ảnh."
        }
      }
    ]
  };

  return (
    <>
      {/* Website Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData, null, 2)
        }}
      />
      
      {/* Breadcrumb Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData, null, 2)
        }}
      />

      {/* FAQ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData, null, 2)
        }}
      />

      {/* SEO Content - Hidden but indexable */}
      <div className={`sr-only ${className}`}>
        <h1>Xem Phim Trực Tuyến Miễn Phí - All Drama</h1>
        
        <section>
          <h2>Trang Phim Trực Tuyến Hàng Đầu Việt Nam</h2>
          <p>
            All Drama là trang web xem phim trực tuyến miễn phí hàng đầu tại Việt Nam, 
            chuyên cung cấp phim châu Á chất lượng cao với phụ đề tiếng Việt. 
            Chúng tôi có kho phim đa dạng bao gồm drama Hàn Quốc, phim Trung Quốc, 
            phim Thái Lan và phim Nhật Bản.
          </p>
        </section>

        <section>
          <h2>Kho Phim Châu Á Đa Dạng</h2>
          <h3>Drama Hàn Quốc (K-Drama)</h3>
          <p>
            Xem drama Hàn Quốc mới nhất với chất lượng HD. Kho K-Drama phong phú 
            từ phim tình cảm, hành động đến kinh dị, đều có phụ đề tiếng Việt.
          </p>
          
          <h3>Phim Trung Quốc</h3>
          <p>
            Phim Trung Quốc đa dạng từ phim cổ trang, phim hiện đại, phim tổng tài 
            đến phim ngôn tình. Tất cả đều có phụ đề Việt chất lượng cao.
          </p>
          
          <h3>Phim Thái Lan</h3>
          <p>
            Phim Thái Lan lãng mạn và drama Thái hấp dẫn với nội dung đa dạng, 
            từ tình cảm, hài hước đến hành động.
          </p>
        </section>

        <section>
          <h2>Tại Sao Chọn AllDrama?</h2>
          <ul>
            <li>Xem phim miễn phí hoàn toàn</li>
            <li>Chất lượng HD, Full HD</li>
            <li>Phụ đề tiếng Việt chính xác</li>
            <li>Cập nhật phim mới hàng ngày</li>
            <li>Giao diện thân thiện, dễ sử dụng</li>
            <li>Không cần đăng ký tài khoản</li>
            <li>Hỗ trợ xem trên mọi thiết bị</li>
          </ul>
        </section>

        <section>
          <h2>Thể Loại Phim Phổ Biến</h2>
          <p>
            Khám phá các thể loại phim hấp dẫn: phim tình cảm lãng mạn, 
            phim hành động gay cấn, phim hài hước vui nhộn, phim kinh dị 
            ly kỳ, phim cung đấu intriga, và nhiều thể loại khác.
          </p>
        </section>
      </div>
    </>
  );
} 