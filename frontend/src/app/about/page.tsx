'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Film, Users, Award, TrendingUp, Heart, ChevronRight, 
  Calendar, Clock, BookOpen, Globe, Target, Zap 
} from 'lucide-react';

export default function AboutPage() {
  // Mock data for company milestones
  const milestones = [
    { year: 2018, title: 'Thành lập', description: 'Alldrama được thành lập với mục tiêu mang lại trải nghiệm giải trí chất lượng cao cho người dùng Việt Nam.' },
    { year: 2019, title: 'Ra mắt phiên bản đầu tiên', description: 'Phiên bản đầu tiên của nền tảng Alldrama được ra mắt với kho phim và series châu Á.' },
    { year: 2020, title: 'Mở rộng thị trường', description: 'Alldrama bắt đầu mở rộng sang các thị trường Đông Nam Á và thu hút hơn 1 triệu người dùng.' },
    { year: 2021, title: 'Phát triển nội dung độc quyền', description: 'Chúng tôi bắt đầu đầu tư vào việc sản xuất và phát hành các nội dung độc quyền.' },
    { year: 2022, title: 'Cải tiến công nghệ', description: 'Nâng cấp toàn diện về công nghệ, cải thiện chất lượng hình ảnh và trải nghiệm người dùng.' },
    { year: 2023, title: 'Hôm nay', description: 'Alldrama hiện đang phục vụ hơn 5 triệu người dùng trên toàn khu vực Đông Nam Á với kho nội dung phong phú.' },
  ];

  // Mock data for leadership team
  const leadershipTeam = [
    {
      name: 'Nguyễn Minh Tuấn',
      role: 'Giám đốc điều hành',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      bio: 'Với hơn 15 năm kinh nghiệm trong ngành công nghệ và giải trí, Minh Tuấn đã dẫn dắt Alldrama từ một ý tưởng đến nền tảng hàng đầu hiện nay.'
    },
    {
      name: 'Trần Thị Hương',
      role: 'Giám đốc nội dung',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      bio: 'Hương là người đứng sau chiến lược nội dung đa dạng của Alldrama, với nền tảng vững chắc trong lĩnh vực truyền thông và điện ảnh.'
    },
    {
      name: 'Phạm Văn Đức',
      role: 'Giám đốc công nghệ',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      bio: 'Với chuyên môn sâu về công nghệ streaming và kinh nghiệm phát triển sản phẩm, Đức đã xây dựng nền tảng kỹ thuật vững chắc cho Alldrama.'
    },
    {
      name: 'Lê Thanh Mai',
      role: 'Giám đốc marketing',
      avatar: 'https://randomuser.me/api/portraits/women/29.jpg',
      bio: 'Mai đã giúp xây dựng thương hiệu Alldrama và phát triển các chiến lược marketing sáng tạo nhằm tiếp cận khách hàng mục tiêu.'
    }
  ];

  // Mock data for company stats
  const companyStats = [
    { icon: <Film />, value: '10,000+', label: 'Tác phẩm', description: 'Bộ sưu tập phim và series đa dạng từ châu Á và quốc tế' },
    { icon: <Users />, value: '5M+', label: 'Người dùng', description: 'Người dùng đang hoạt động trên toàn khu vực Đông Nam Á' },
    { icon: <Award />, value: '25+', label: 'Giải thưởng', description: 'Giải thưởng và ghi nhận từ các tổ chức uy tín' },
    { icon: <TrendingUp />, value: '99.9%', label: 'Uptime', description: 'Độ ổn định của hệ thống, luôn sẵn sàng phục vụ' }
  ];

  // Mock data for core values
  const coreValues = [
    { 
      icon: <Heart className="h-8 w-8 text-pink-400" />, 
      title: 'Đam mê', 
      description: 'Chúng tôi đam mê mang đến những trải nghiệm giải trí tuyệt vời và xúc động cho người dùng.' 
    },
    { 
      icon: <Target className="h-8 w-8 text-amber-400" />, 
      title: 'Chất lượng', 
      description: 'Cam kết cung cấp nội dung và dịch vụ chất lượng cao nhất, không ngừng cải tiến.' 
    },
    { 
      icon: <Globe className="h-8 w-8 text-blue-400" />, 
      title: 'Đa dạng', 
      description: 'Tôn trọng và khuyến khích sự đa dạng trong nội dung, tiếng nói và góc nhìn văn hóa.' 
    },
    { 
      icon: <Zap className="h-8 w-8 text-yellow-400" />, 
      title: 'Đổi mới', 
      description: 'Luôn tìm kiếm những cách tiếp cận mới mẻ, sáng tạo để mang lại giá trị cho người dùng.' 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col items-center text-center">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">Về chúng tôi</Badge>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">Khám phá thế giới giải trí <br />cùng <span className="text-amber-500">Alldrama</span></h1>
            <p className="text-gray-400 text-lg max-w-3xl mb-8">
              Chúng tôi là nền tảng xem phim trực tuyến hàng đầu tại Việt Nam, mang đến cho người dùng 
              kho nội dung đa dạng với chất lượng hình ảnh tuyệt vời và trải nghiệm người dùng vượt trội.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-gray-900">
                Khám phá kho phim
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-gray-700 text-white hover:bg-gray-800">
                Đăng ký dùng thử
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-2xl flex items-center">
                <Target className="mr-3 h-6 w-6 text-amber-500" />
                Tầm nhìn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Trở thành nền tảng giải trí hàng đầu Đông Nam Á, mang đến trải nghiệm xem phim số một cho người dùng 
                với kho nội dung đa dạng, chất lượng từ khắp Châu Á và trên toàn thế giới.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-2xl flex items-center">
                <BookOpen className="mr-3 h-6 w-6 text-amber-500" />
                Sứ mệnh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                Chúng tôi cam kết mang đến những tác phẩm điện ảnh chất lượng cao, nội dung đa dạng và 
                công nghệ tiên tiến, nhằm tạo ra trải nghiệm giải trí phong phú, đáp ứng nhu cầu của 
                mọi đối tượng khán giả.
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Core Values */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">Giá trị cốt lõi</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Những giá trị chúng tôi theo đuổi</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Alldrama được xây dựng dựa trên những giá trị cốt lõi, định hình mọi quyết định và hành động của chúng tôi.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreValues.map((value, index) => (
              <Card key={index} className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg h-full">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-gray-700/50 mb-4">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">{value.title}</h3>
                    <p className="text-gray-300 text-sm">{value.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="mb-16 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {companyStats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-800/30 backdrop-blur-sm border border-gray-700/50 rounded-lg">
                <div className="p-3 bg-amber-500/10 rounded-full mb-4">
                  <div className="text-amber-500 h-8 w-8">{stat.icon}</div>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <h4 className="text-amber-400 font-medium mb-2">{stat.label}</h4>
                <p className="text-gray-400 text-sm">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Team Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">Đội ngũ lãnh đạo</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Những người dẫn dắt Alldrama</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Đội ngũ lãnh đạo của chúng tôi là những người có tầm nhìn, kinh nghiệm và đam mê với sứ mệnh mang đến trải nghiệm giải trí tuyệt vời.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadershipTeam.map((leader, index) => (
              <Card key={index} className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg overflow-hidden">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img 
                    src={leader.avatar} 
                    alt={leader.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg">{leader.name}</h3>
                    <p className="text-amber-400 text-sm">{leader.role}</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-gray-300 text-sm">{leader.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* History/Timeline Section */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-2">Lịch sử phát triển</Badge>
            <h2 className="text-3xl font-bold text-white mb-4">Hành trình của chúng tôi</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Theo dõi sự phát triển của Alldrama từ những ngày đầu tiên đến vị thế hiện tại.
            </p>
          </div>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-gray-700 transform md:translate-x-0 translate-x-4"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Timeline dot */}
                  <div className="absolute left-4 md:left-1/2 top-4 w-8 h-8 rounded-full bg-amber-500 transform md:-translate-x-4 -translate-x-12 flex items-center justify-center z-10">
                    <span className="text-gray-900 font-bold text-sm">{milestone.year}</span>
                  </div>
                  
                  <div className="md:w-1/2"></div>
                  
                  <Card className={`md:w-1/2 bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg ml-12 md:ml-0 ${
                    index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">{milestone.title}</CardTitle>
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                          {milestone.year}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg overflow-hidden shadow-xl">
          <div className="px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-8 md:mb-0 md:max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Sẵn sàng để trải nghiệm Alldrama?</h2>
              <p className="text-gray-800 mb-0">
                Đăng ký ngay hôm nay và khám phá thế giới giải trí đa dạng với hàng ngàn bộ phim và series hấp dẫn.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
                Đăng ký dùng thử
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-gray-900 text-gray-900 hover:bg-white/20">
                Tìm hiểu thêm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
