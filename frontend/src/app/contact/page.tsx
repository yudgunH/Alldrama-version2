'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, MapPin, Send, Facebook, Twitter, Instagram, Clock, CheckCircle } from 'lucide-react';

// Temporary inline components until proper ones are created
const Label = ({ htmlFor, className, children }: { htmlFor: string, className?: string, children: React.ReactNode }) => (
  <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}>
    {children}
  </label>
);

const Textarea = ({ 
  id, 
  name, 
  placeholder, 
  className, 
  value, 
  onChange, 
  required 
}: { 
  id: string, 
  name: string, 
  placeholder?: string, 
  className?: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, 
  required?: boolean 
}) => (
  <textarea 
    id={id}
    name={name}
    placeholder={placeholder}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
    value={value}
    onChange={onChange}
    required={required}
  />
);

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setIsSubmitted(false);
        setFormState({
          name: '',
          email: '',
          subject: '',
          message: ''
        });
      }, 5000);
    }, 1500);
  };

  // Mock data for contact information and team members
  const contactInfo = [
    { icon: <Mail className="h-5 w-5" />, title: 'Email', content: 'contact@alldrama.com', href: 'mailto:contact@alldrama.com' },
    { icon: <Phone className="h-5 w-5" />, title: 'Số điện thoại', content: '(+84) 123 456 789', href: 'tel:+84123456789' },
    { icon: <MapPin className="h-5 w-5" />, title: 'Địa chỉ', content: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh', href: 'https://maps.google.com' },
    { icon: <Clock className="h-5 w-5" />, title: 'Giờ làm việc', content: 'Thứ 2 - Thứ 6: 9:00 - 18:00', href: null }
  ];

  const teamMembers = [
    { name: 'Nguyễn Văn A', role: 'Giám đốc điều hành', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
    { name: 'Trần Thị B', role: 'Trưởng phòng hỗ trợ', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { name: 'Lê Văn C', role: 'Chuyên viên CSKH', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      {/* Hero Section */}
      <div className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Liên hệ với chúng tôi</h1>
            <p className="text-gray-400 text-lg max-w-2xl">Hãy cho chúng tôi biết ý kiến, câu hỏi hoặc yêu cầu của bạn. Đội ngũ Alldrama luôn sẵn sàng hỗ trợ.</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Gửi tin nhắn</CardTitle>
                <CardDescription className="text-gray-400">
                  Điền đầy đủ thông tin dưới đây và chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="rounded-full bg-green-500/20 p-3">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-medium text-white">Gửi thành công!</h3>
                    <p className="text-gray-400 max-w-md">
                      Cảm ơn bạn đã liên hệ. Chúng tôi đã nhận được tin nhắn và sẽ phản hồi trong thời gian sớm nhất.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-300">Họ và tên</Label>
                        <Input 
                          id="name" 
                          name="name"
                          placeholder="Nhập họ và tên" 
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                          value={formState.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-300">Email</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email" 
                          placeholder="example@email.com" 
                          className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                          value={formState.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-300">Tiêu đề</Label>
                      <Input 
                        id="subject" 
                        name="subject"
                        placeholder="Nhập tiêu đề" 
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                        value={formState.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-300">Nội dung</Label>
                      <Textarea 
                        id="message" 
                        name="message"
                        placeholder="Nhập nội dung tin nhắn" 
                        className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 min-h-[150px]"
                        value={formState.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="mr-2">Đang gửi</span>
                            <div className="h-4 w-4 border-2 border-gray-900 border-r-transparent rounded-full animate-spin"></div>
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" /> Gửi tin nhắn
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div>
            <div className="space-y-6">
              {/* Contact Info Card */}
              <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Thông tin liên hệ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contactInfo.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="bg-amber-500/10 p-2 rounded-md mr-3">
                        <div className="text-amber-500">{item.icon}</div>
                      </div>
                      <div>
                        <h3 className="text-gray-300 text-sm">{item.title}</h3>
                        {item.href ? (
                          <a 
                            href={item.href} 
                            className="text-white hover:text-amber-400 transition-colors"
                            target={item.href.startsWith('http') ? "_blank" : undefined}
                            rel={item.href.startsWith('http') ? "noreferrer" : undefined}
                          >
                            {item.content}
                          </a>
                        ) : (
                          <p className="text-white">{item.content}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  <Separator className="bg-gray-700/50 my-4" />
                  
                  <div>
                    <h3 className="text-white font-medium mb-3">Kết nối với chúng tôi</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" className="bg-transparent border-gray-700 text-blue-400 hover:text-white hover:bg-blue-500/20">
                        <Facebook className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent border-gray-700 text-sky-400 hover:text-white hover:bg-sky-500/20">
                        <Twitter className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="bg-transparent border-gray-700 text-pink-400 hover:text-white hover:bg-pink-500/20">
                        <Instagram className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Team Card */}
              <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Đội ngũ hỗ trợ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3 border border-gray-700">
                          <AvatarImage src={member.avatar} alt={member.name} />
                          <AvatarFallback className="bg-amber-500 text-gray-900">{member.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="text-white font-medium">{member.name}</h4>
                          <p className="text-gray-400 text-sm">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Map and FAQs */}
        <div className="mt-12">
          <Tabs defaultValue="map" className="w-full">
            <TabsList className="bg-gray-800/30 border border-gray-700/50 mb-6">
              <TabsTrigger 
                value="map" 
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Bản đồ
              </TabsTrigger>
              <TabsTrigger 
                value="faq" 
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-gray-900"
              >
                Câu hỏi thường gặp
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-0">
              <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg overflow-hidden">
                <div className="aspect-[21/9] w-full">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4946681007846!2d106.70141415731605!3d10.77166126723046!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc7%3A0x4db964d76bf6e18e!2zMTIzIE5ndXnhu4VuIEh14buHLCBC4bq_biBOZ2jDqSwgUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1652345678901!5m2!1svi!2s" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Alldrama Office Map"
                    className="grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                  ></iframe>
                </div>
                <CardFooter className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    <span className="text-gray-300 text-sm">123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</span>
                  </div>
                  <Button variant="outline" className="bg-transparent border-gray-700 text-white hover:bg-white/10">
                    <MapPin className="h-4 w-4 mr-2" /> Chỉ đường
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="faq" className="mt-0">
              <Card className="bg-gray-800/30 backdrop-blur-sm border-gray-700/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white">Câu hỏi thường gặp</CardTitle>
                  <CardDescription className="text-gray-400">
                    Những câu hỏi khách hàng thường hỏi về dịch vụ của chúng tôi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { 
                        question: 'Làm cách nào để đăng ký tài khoản?', 
                        answer: 'Bạn có thể đăng ký tài khoản bằng cách nhấp vào nút "Đăng ký" ở góc phải trên cùng của trang web và làm theo hướng dẫn.' 
                      },
                      { 
                        question: 'Làm thế nào để xem phim trên Alldrama?', 
                        answer: 'Sau khi đăng nhập, bạn có thể duyệt qua thư viện phim của chúng tôi và chọn bất kỳ phim nào để xem. Chúng tôi hỗ trợ nhiều thiết bị và độ phân giải khác nhau.' 
                      },
                      { 
                        question: 'Alldrama có tính phí không?', 
                        answer: 'Alldrama cung cấp cả phiên bản miễn phí (có quảng cáo) và phiên bản trả phí (không quảng cáo, chất lượng cao hơn). Bạn có thể tham khảo gói dịch vụ phù hợp trong mục "Nâng cấp".' 
                      },
                      { 
                        question: 'Tôi gặp vấn đề khi xem phim, phải làm sao?', 
                        answer: 'Bạn có thể kiểm tra kết nối internet, làm mới trang, hoặc thử đăng xuất và đăng nhập lại. Nếu vấn đề vẫn tồn tại, vui lòng liên hệ với chúng tôi qua form liên hệ.' 
                      },
                    ].map((item, index) => (
                      <div key={index} className="pb-4 border-b border-gray-700/50 last:border-0 last:pb-0">
                        <h3 className="font-medium text-white mb-2">{item.question}</h3>
                        <p className="text-gray-300 text-sm">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-700/50 pt-4">
                  <p className="text-gray-400 text-sm">
                    Không tìm thấy câu trả lời? Hãy{' '}
                    <Button variant="link" className="p-0 h-auto text-amber-400 hover:text-amber-300">
                      liên hệ với chúng tôi
                    </Button>.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
