import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Play, Star, Heart, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: "All Drama - Xem Drama Châu Á Miễn Phí Online | K-Drama, Phim Trung Quốc",
  description: "All Drama - Thiên đường drama châu Á với K-Drama Hàn Quốc, phim Trung Quốc, drama Thái Lan miễn phí. Xem all drama với chất lượng HD, phụ đề tiếng Việt chuẩn xác.",
  keywords: "all drama, drama châu á, k-drama, drama hàn quốc, phim trung quốc, drama online, xem drama miễn phí, drama thái lan, drama 2024, AllDrama",
  openGraph: {
    title: "All Drama - Xem Drama Châu Á Miễn Phí Online",
    description: "All Drama - Thiên đường drama châu Á với K-Drama Hàn Quốc, phim Trung Quốc, drama Thái Lan miễn phí.",
    type: "website",
    url: "https://alldrama.net/all-drama",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Drama - Xem Drama Châu Á Miễn Phí Online",
    description: "All Drama - Thiên đường drama châu Á với K-Drama Hàn Quốc, phim Trung Quốc, drama Thái Lan miễn phí.",
  },
};

export default function AllDramaPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "All Drama - Drama Châu Á",
    "description": "Trang xem all drama châu Á miễn phí với K-Drama, phim Trung Quốc, drama Thái Lan",
    "url": "https://alldrama.net/all-drama",
    "mainEntity": {
      "@type": "ItemList",
      "name": "All Drama Collection",
      "description": "Bộ sưu tập drama châu Á đầy đủ",
      "itemListElement": [
        {
          "@type": "Movie",
          "name": "K-Drama Hàn Quốc",
          "description": "Korean Drama với chất lượng cao"
        },
        {
          "@type": "Movie",
          "name": "Drama Trung Quốc",
          "description": "Chinese Drama đa dạng thể loại"
        },
        {
          "@type": "Movie",
          "name": "Drama Thái Lan",
          "description": "Thai Drama lãng mạn"
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

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-500/10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="flex flex-col items-center text-center relative z-10">
              <Badge className="bg-gradient-to-r from-amber-500/20 to-purple-500/20 text-amber-300 border-amber-500/30 mb-6">
                ✨ All Drama Collection
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
                  All Drama
                </span> <br />
                Thiên Đường Drama Châu Á
              </h1>
              <p className="text-gray-300 text-xl max-w-4xl mb-10 leading-relaxed">
                Khám phá <strong>all drama</strong> châu Á tại một nơi! Từ <strong>K-Drama Hàn Quốc</strong> 
                lãng mạn đến <strong>drama Trung Quốc</strong> cổ trang, từ <strong>drama Thái Lan</strong> 
                ngọt ngào đến drama Nhật tinh tế - tất cả đều miễn phí với chất lượng HD.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/movie">
                  <Button size="lg" className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white shadow-lg">
                    <Play className="mr-2 h-5 w-5" />
                    Xem All Drama Ngay
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="outline" size="lg" className="bg-transparent border-2 border-amber-500/50 text-amber-300 hover:bg-amber-500/10">
                    Khám Phá Drama Mới
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          
          {/* Drama Categories */}
          <section className="mb-20">
            <h2 className="text-4xl font-bold text-white mb-12 text-center">
              Khám Phá <span className="text-amber-400">All Drama</span> Theo Quốc Gia
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Korean Drama */}
              <div className="bg-gradient-to-br from-red-900/20 to-red-600/10 rounded-2xl p-8 border border-red-500/20">
                <div className="text-red-400 mb-6">
                  <Heart className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">K-Drama Hàn Quốc</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  <strong>Korean Drama</strong> với cốt truyện lãng mạn, hấp dẫn. 
                  Từ drama tình cảm đến thriller, từ cổ trang đến hiện đại - 
                  tất cả K-Drama đều có tại <strong>All Drama</strong>.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-400">
                    <Star className="h-4 w-4 mr-2 text-amber-400" />
                    Drama Romance, Thriller, Historical
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <TrendingUp className="h-4 w-4 mr-2 text-amber-400" />
                    Cập nhật hàng ngày
                  </div>
                </div>
                <Link href="/movie?country=Korea">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Xem K-Drama
                  </Button>
                </Link>
              </div>

              {/* Chinese Drama */}
              <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-600/10 rounded-2xl p-8 border border-yellow-500/20">
                <div className="text-yellow-400 mb-6">
                  <Star className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Drama Trung Quốc</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  <strong>Chinese Drama</strong> đa dạng từ cổ trang hoành tráng 
                  đến hiện đại sôi động. Drama cung đấu, tổng tài, tiên hiệp - 
                  <strong>all drama</strong> Trung Quốc đều có tại đây.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-400">
                    <Star className="h-4 w-4 mr-2 text-amber-400" />
                    Cổ trang, Hiện đại, Tổng tài, Cung đấu
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <TrendingUp className="h-4 w-4 mr-2 text-amber-400" />
                    Chất lượng HD cao
                  </div>
                </div>
                <Link href="/movie?country=China">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    Xem Drama TQ
                  </Button>
                </Link>
              </div>

              {/* Thai Drama */}
              <div className="bg-gradient-to-br from-green-900/20 to-green-600/10 rounded-2xl p-8 border border-green-500/20">
                <div className="text-green-400 mb-6">
                  <Heart className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Drama Thái Lan</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  <strong>Thai Drama</strong> ngọt ngào với những câu chuyện 
                  tình yêu đầy cảm xúc. Drama Thái độc đáo với văn hóa 
                  phong phú - trải nghiệm <strong>all drama</strong> Thái tại đây.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-gray-400">
                    <Star className="h-4 w-4 mr-2 text-amber-400" />
                    Romance, Comedy, Slap Kiss
                  </div>
                  <div className="flex items-center text-sm text-gray-400">
                    <TrendingUp className="h-4 w-4 mr-2 text-amber-400" />
                    Phụ đề tiếng Việt
                  </div>
                </div>
                <Link href="/movie?country=Thailand">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Xem Drama Thái
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Why Choose All Drama */}
          <section className="mb-20">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Tại Sao Chọn <span className="text-amber-400">All Drama</span>?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">15,000+</div>
                  <div className="text-gray-300">Bộ drama từ khắp châu Á</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">100%</div>
                  <div className="text-gray-300">Hoàn toàn miễn phí</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">HD</div>
                  <div className="text-gray-300">Chất lượng cao nhất</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-amber-400 mb-2">24/7</div>
                  <div className="text-gray-300">Cập nhật liên tục</div>
                </div>
              </div>
            </div>
          </section>

          {/* Popular Genres */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              Thể Loại Drama Phổ Biến
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                'Drama Romance',
                'Drama Historical', 
                'Drama Comedy',
                'Drama Thriller',
                'Drama Fantasy',
                'Drama Medical',
                'Drama School',
                'Drama Business'
              ].map((genre) => (
                <div key={genre} className="bg-gray-800/40 hover:bg-gray-700/40 rounded-lg p-4 text-center transition-colors cursor-pointer">
                  <div className="text-white font-medium">{genre}</div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center bg-gradient-to-r from-amber-500/10 to-purple-500/10 rounded-2xl p-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Bắt Đầu Hành Trình <span className="text-amber-400">All Drama</span>
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-3xl mx-auto">
              Hãy cùng khám phá thế giới <strong>all drama</strong> châu Á đa dạng và phong phú. 
              Hàng nghìn bộ drama đang chờ bạn trải nghiệm với chất lượng tuyệt vời!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/movie">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white">
                  <Play className="mr-2 h-5 w-5" />
                  Khám Phá All Drama
                </Button>
              </Link>
              <Link href="/search?genre=Romance">
                <Button variant="outline" size="lg" className="border-amber-500/50 text-amber-300 hover:bg-amber-500/10">
                  Xem Drama Romance
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
} 