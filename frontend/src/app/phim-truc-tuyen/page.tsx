import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Play, Star, Calendar, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: "Phim Trực Tuyến - Xem Phim Online Miễn Phí Chất Lượng HD | AllDrama",
  description: "Xem phim trực tuyến miễn phí với chất lượng HD tại AllDrama. Kho phim châu Á đa dạng: K-Drama, phim Trung Quốc, phim Thái Lan với phụ đề tiếng Việt. Cập nhật mới nhất 2024.",
  keywords: "phim trực tuyến, xem phim online, phim miễn phí, phim HD, phim châu á trực tuyến, drama online, streaming phim, xem phim streaming, phim online vietsub, AllDrama",
  openGraph: {
    title: "Phim Trực Tuyến - Xem Phim Online Miễn Phí Chất Lượng HD",
    description: "Xem phim trực tuyến miễn phí với chất lượng HD tại AllDrama. Kho phim châu Á đa dạng với phụ đề tiếng Việt.",
    type: "website",
    url: "https://alldrama.net/phim-truc-tuyen",
  },
  twitter: {
    card: "summary_large_image",
    title: "Phim Trực Tuyến - Xem Phim Online Miễn Phí Chất Lượng HD",
    description: "Xem phim trực tuyến miễn phí với chất lượng HD tại AllDrama. Kho phim châu Á đa dạng với phụ đề tiếng Việt.",
  },
};

export default function PhimTrucTuyenPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Phim Trực Tuyến - Xem Phim Online Miễn Phí",
    "description": "Trang xem phim trực tuyến miễn phí chất lượng HD với kho phim châu Á đa dạng",
    "url": "https://alldrama.net/phim-truc-tuyen",
    "mainEntity": {
      "@type": "ItemList",
      "name": "Danh sách phim trực tuyến",
      "description": "Kho phim trực tuyến đa dạng thể loại",
      "itemListElement": [
        {
          "@type": "Movie",
          "name": "Phim Trực Tuyến Miễn Phí",
          "description": "Xem phim online không mất phí"
        },
        {
          "@type": "Movie",
          "name": "Phim HD Chất Lượng Cao",
          "description": "Phim với chất lượng hình ảnh HD, Full HD"
        }
      ]
    }
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
        {/* Hero Section */}
        <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="flex flex-col items-center text-center">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
                Phim Trực Tuyến
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                Xem <span className="text-amber-500">Phim Trực Tuyến</span> Miễn Phí <br />
                Chất Lượng HD
              </h1>
              <p className="text-gray-400 text-lg max-w-3xl mb-8">
                Khám phá kho phim trực tuyến đa dạng với hơn 10,000+ bộ phim và series châu Á. 
                Xem phim online miễn phí với chất lượng HD, phụ đề tiếng Việt chính xác.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/movie">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                    <Play className="mr-2 h-4 w-4" />
                    Xem Phim Ngay
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" size="lg" className="bg-transparent border-gray-700 text-white hover:bg-gray-800">
                    Tìm Kiếm Phim
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Features Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Tại Sao Chọn Xem Phim Trực Tuyến Tại AllDrama?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="text-amber-500 mb-4">
                  <Play className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Phim Trực Tuyến Miễn Phí
                </h3>
                <p className="text-gray-400">
                  Xem phim online hoàn toàn miễn phí, không cần đăng ký tài khoản. 
                  Trải nghiệm xem phim trực tuyến mượt mà trên mọi thiết bị.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="text-amber-500 mb-4">
                  <Star className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Chất Lượng HD Cao
                </h3>
                <p className="text-gray-400">
                  Phim trực tuyến với chất lượng HD, Full HD đảm bảo trải nghiệm 
                  xem phim tuyệt vời với hình ảnh sắc nét, âm thanh sống động.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <div className="text-amber-500 mb-4">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Cập Nhật Liên Tục
                </h3>
                <p className="text-gray-400">
                  Phim mới được cập nhật hàng ngày. Luôn có phim trực tuyến mới nhất 
                  để bạn thưởng thức ngay khi ra mắt.
                </p>
              </div>
            </div>
          </section>

          {/* Content Types Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Kho Phim Trực Tuyến Đa Dạng
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-6">Drama Châu Á Trực Tuyến</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-medium text-white">K-Drama Hàn Quốc</h4>
                      <p className="text-gray-400">
                        Xem drama Hàn Quốc trực tuyến với đầy đủ thể loại từ lãng mạn, 
                        hành động đến kinh dị. Phụ đề tiếng Việt chính xác.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-medium text-white">Phim Trung Quốc Online</h4>
                      <p className="text-gray-400">
                        Kho phim Trung Quốc trực tuyến phong phú: phim cổ trang, 
                        hiện đại, tổng tài với chất lượng HD.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="text-lg font-medium text-white">Phim Thái Lan Streaming</h4>
                      <p className="text-gray-400">
                        Drama Thái Lan ngọt ngào và hấp dẫn, xem trực tuyến 
                        với phụ đề Việt chất lượng cao.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-white mb-6">Thể Loại Phim Phổ Biến</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Phim Tình Cảm',
                    'Phim Hành Động', 
                    'Phim Hài Hước',
                    'Phim Kinh Dị',
                    'Phim Cung Đấu',
                    'Phim Cổ Trang',
                    'Phim Hiện Đại',
                    'Phim Tổng Tài'
                  ].map((genre) => (
                    <div key={genre} className="bg-gray-800/30 rounded-lg p-4 text-center">
                      <div className="text-white font-medium">{genre}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="bg-gray-800/30 rounded-lg p-8 mb-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-2">10,000+</div>
                <div className="text-gray-400">Bộ phim trực tuyến</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-2">100%</div>
                <div className="text-gray-400">Miễn phí</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-2">HD</div>
                <div className="text-gray-400">Chất lượng cao</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-500 mb-2">24/7</div>
                <div className="text-gray-400">Luôn sẵn sàng</div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Bắt Đầu Xem Phim Trực Tuyến Ngay
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
              Khám phá thế giới phim trực tuyến đa dạng với AllDrama. 
              Hàng nghìn bộ phim và series châu Á đang chờ bạn khám phá.
            </p>
            <Link href="/movie">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                <Play className="mr-2 h-4 w-4" />
                Khám Phá Ngay
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </>
  );
} 