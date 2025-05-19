"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  Search,
  ChevronDown,
  MenuIcon,
  User,
  LogOut,
  Heart,
  History,
  Settings,
  Film,
  Home,
  Clapperboard,
  Bell,
  List,
  Play,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/api/useAuth"
import { toast } from "react-hot-toast"
import { useApiCache, CacheMatcher } from "@/hooks/api/useApiCache"
import { API_ENDPOINTS } from "@/lib/api/endpoints"
import { clearHomepageCache } from "@/hooks/api/useHomepageData"

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isNavbarVisible, setIsNavbarVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false)
  const isMobile = useMobile()
  const pathname = usePathname() || '/'
  const router = useRouter()

  // Sử dụng useAuth hook thay vì auth store trực tiếp
  const { isAuthenticated, user, logout, loading } = useAuth()
  const { clearCache } = useApiCache()

  // Desktop Navigation Button Component
  const NavButton = ({
    href,
    active,
    children,
    onClick,
  }: {
    href: string
    active: boolean
    children: React.ReactNode
    onClick?: () => void
  }) => {
    return (
      <Button
        variant="ghost"
        size="default"
        className={cn(
          "gap-1.5 text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors",
          active && "bg-amber-600 text-white hover:bg-amber-600/90 hover:text-white",
        )}
        onClick={onClick}
        asChild
      >
        <Link href={href}>{children}</Link>
      </Button>
    )
  }

  // Handle logo click to clear cache when going to homepage
  const handleLogoClick = (e: React.MouseEvent) => {
    // Only do special handling if not already on homepage
    if (pathname !== '/') {
      e.preventDefault();
      
      // Clear the homepage data cache to ensure fresh data
      clearHomepageCache();
      
      // Manually navigate to homepage
      router.push('/');
    }
  };

  // Xử lý sự kiện scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Đối với trang watch
      if (pathname?.includes("/watch/")) {
        if (currentScrollY > 50) {
          // Cuộn xuống - ẩn navbar
          setIsNavbarVisible(false)
        } else {
          setIsNavbarVisible(true)
        }
      }
      
      if (isMobile) {
        // Các trang khác trên mobile: ẩn navbar khi cuộn xuống
        setIsScrolled(currentScrollY > 0)
      } else if (pathname === "/") {
        // Trang chính: luôn hiển thị navbar khi cuộn
        setIsScrolled(currentScrollY > 50)
      } else {
        // Các trang khác trên desktop: hiển thị navbar khi cuộn
        setIsScrolled(currentScrollY > 50)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [pathname, isMobile, lastScrollY])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Xóa cache của kết quả tìm kiếm trước đó
      const matcher: CacheMatcher = (key: string) => key.includes(API_ENDPOINTS.MOVIES.SEARCH);
      clearCache(matcher);
      
      // Chuyển hướng đến trang search với query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      
      // Đóng khung tìm kiếm trên mobile sau khi submit
      setMobileSearchVisible(false)
      
      // Giữ lại giá trị tìm kiếm nếu ở trang search để dễ chỉnh sửa
      if (!pathname?.startsWith('/search')) {
        setSearchQuery("")
      }
    }
  }

  // Xử lý đăng xuất sử dụng useAuth hook
  const handleLogout = async () => {
    try {
      // Xóa cache trước khi đăng xuất
      clearCache(() => true);
      
      // Đăng xuất
      await logout();
      
      // Xóa các state liên quan đến người dùng
      setSearchQuery("");
      
      // Thông báo thành công
      toast.success("Đăng xuất thành công!");
      
      // Chuyển hướng về trang chủ sau khi đăng xuất
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Đã xảy ra lỗi khi đăng xuất");
    }
  }

  // Lấy chữ cái đầu từ tên người dùng để hiển thị avatar
  const getUserInitial = () => {
    if (user?.full_name) {
      return user.full_name.charAt(0).toUpperCase()
    }
    return "U"
  }

  const genres = [
    { name: "Hành động", slug: "hanh-dong" },
    { name: "Tình cảm", slug: "tinh-cam" },
    { name: "Hài hước", slug: "hai-huoc" },
    { name: "Viễn tưởng", slug: "vien-tuong" },
    { name: "Kinh dị", slug: "kinh-di" },
    { name: "Hoạt hình", slug: "hoat-hinh" },
  ]

  // Ẩn navbar trên mobile ở các trang khác khi cuộn xuống
  // Hoặc ẩn navbar khi đang ở trang watch và đang cuộn xuống
  if ((isMobile && pathname !== "/" && isScrolled) || 
      (pathname?.includes("/watch/") && !isNavbarVisible)) {
    return null
  }

  return (
    <nav
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        pathname === "/"
          ? isScrolled
            ? "bg-black/80 backdrop-blur-md shadow-md py-2 border-b border-gray-800/50"
            : "bg-gray-950 py-3" // Nền đen ở trang chính khi chưa cuộn
          : !isScrolled 
          ? "bg-black/80 backdrop-blur-md shadow-md py-2 border-b border-gray-800/50"
          : "bg-black/80", // Nền đen ở các trang khác khi chưa cuộn
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2 group" onClick={handleLogoClick}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 relative overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 transition-transform duration-300 group-hover:scale-110 shadow-lg shadow-amber-900/20">
                <div className="absolute inset-0 bg-black rounded-full m-0.5"></div>
                <Image
                  src="/logo.svg"
                  alt="AllDrama Logo"
                  width={40}
                  height={40}
                  className="object-contain relative z-20 p-1.5"
                />
              </div>
              <span className="text-2xl sm:text-3xl font-normal bg-gradient-to-r from-amber-400 to-amber-500 text-transparent bg-clip-text transition-all duration-300 group-hover:from-amber-300 group-hover:to-amber-400 font-fleur-de-leah">
                AllDrama
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              <NavButton 
                href="/" 
                active={pathname === "/"}
                onClick={() => pathname !== "/" && clearHomepageCache()}
              >
                <Home className="h-4 w-4 mr-1.5" />
                Trang chủ
              </NavButton>

              <NavButton href="/movie" active={pathname.startsWith("/movie") && !pathname.startsWith("/movie/genre")}>
                <Clapperboard className="h-4 w-4 mr-1.5" />
                Phim
              </NavButton>

              <NavButton href="/episode" active={pathname.startsWith("/episode")}>
                <List className="h-4 w-4 mr-1.5" />
                Tập mới
              </NavButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="default"
                    className={cn(
                      "gap-1.5 text-gray-300 hover:text-white hover:bg-gray-800/50",
                      pathname.startsWith("/movie/genre") &&
                        "bg-amber-600 text-white hover:bg-amber-600/90 hover:text-white",
                    )}
                  >
                    <Film className="h-4 w-4 mr-1.5" />
                    Thể loại
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 grid grid-cols-2 gap-1 p-2 bg-gray-900/95 backdrop-blur-sm border-gray-800 rounded-xl shadow-xl"
                >
                  {genres.map((genre) => (
                    <DropdownMenuItem
                      key={genre.slug}
                      asChild
                      className="text-gray-300 focus:text-white focus:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Link href={`/search?genre=${encodeURIComponent(genre.name)}`}>{genre.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop Search and User Menu */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Input
                type="search"
                placeholder="Tìm kiếm phim..."
                className="w-64 h-10 bg-gray-800/60 border-gray-700/50 focus-visible:ring-amber-500 text-white placeholder:text-gray-400 rounded-full pl-4 pr-10 transition-all focus-within:bg-gray-800/80"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-full w-10 rounded-l-none rounded-r-full text-gray-400 hover:text-white"
                aria-label="Tìm kiếm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <div className="flex items-center gap-2">
              {isAuthenticated ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-gray-300 hover:text-white relative">
                        <Bell className="h-5 w-5" />
                        {/* <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-amber-600 text-[10px]">
                          2
                        </Badge> */}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-72 bg-gray-900/95 backdrop-blur-sm border-gray-800 rounded-xl shadow-xl p-1">
                      <div className="p-3 border-b border-gray-800 flex justify-between items-center">
                        <div className="font-medium text-white">Thông báo</div>
                        <Button variant="ghost" size="sm" className="text-xs text-amber-500 hover:text-amber-400 p-1 h-auto">
                          Đánh dấu tất cả đã đọc
                        </Button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        <p className="text-center text-sm text-gray-400 py-6">
                          Hiện chưa có thông báo.
                        </p>
                      </div>
                      <div className="p-2 pt-1">
                        <Button variant="ghost" className="w-full justify-center py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/70 rounded-lg" asChild>
                          <Link href="/notifications">Xem tất cả thông báo</Link>
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 ml-1">
                        <Avatar className="h-9 w-9 border-2 border-amber-600/20 ring-2 ring-amber-500/10 transition-all hover:ring-amber-500/30">
                          {user?.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={user.full_name || "Avatar"} />
                          ) : (
                            <AvatarFallback className="bg-amber-600/10 text-amber-500 font-medium">
                              {getUserInitial()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-gray-900/95 backdrop-blur-sm border-gray-800 rounded-xl shadow-xl p-1">
                      <div className="p-3 border-b border-gray-800">
                        <div className="font-medium text-white">{user?.full_name || "Người dùng"}</div>
                        <div className="text-xs text-gray-400 truncate mt-0.5">{user?.email || ""}</div>
                      </div>
                      <div className="p-1">
                        <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-gray-800 rounded-lg py-2">
                          <Link href="/profile" className="flex items-center cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Trang cá nhân
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-gray-800 rounded-lg py-2">
                          <Link href="/profile?tab=favorites" className="flex items-center cursor-pointer">
                            <Heart className="h-4 w-4 mr-2" />
                            Phim yêu thích
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-gray-800 rounded-lg py-2">
                          <Link href="/profile?tab=history" className="flex items-center cursor-pointer">
                            <History className="h-4 w-4 mr-2" />
                            Lịch sử xem
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-gray-800 rounded-lg py-2">
                          <Link href="/profile?tab=settings" className="flex items-center cursor-pointer">
                            <Settings className="h-4 w-4 mr-2" />
                            Cài đặt
                          </Link>
                        </DropdownMenuItem>
                      </div>
                      <DropdownMenuSeparator className="bg-gray-800" />
                      <div className="p-1">
                        <DropdownMenuItem
                          onClick={handleLogout}
                          className="text-amber-500 focus:text-amber-400 focus:bg-gray-800 rounded-lg py-2"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Đăng xuất
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full"
                    asChild
                  >
                    <Link href="/login">Đăng nhập</Link>
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-md shadow-amber-900/20 transition-all hover:shadow-lg hover:shadow-amber-900/30" 
                    asChild
                  >
                    <Link href="/register">Đăng ký</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button and Search */}
          <div className="flex items-center md:hidden gap-2">
            {mobileSearchVisible ? (
              <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-start pt-20 px-4 animate-in fade-in slide-in-from-top duration-300">
                <div className="w-full max-w-md mx-auto">
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <Input
                      type="search"
                      placeholder="Tìm kiếm phim..."
                      className="w-full h-12 bg-gray-800/80 border-gray-700/50 focus-visible:ring-amber-500 text-white placeholder:text-gray-400 rounded-full pl-4 pr-12 shadow-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-12 top-0 h-full w-10 text-gray-400 hover:text-white"
                      onClick={() => setMobileSearchVisible(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M18 6 6 18"></path>
                        <path d="m6 6 12 12"></path>
                      </svg>
                    </Button>
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full w-12 rounded-l-none rounded-r-full text-white bg-amber-600/90 hover:bg-amber-700"
                      aria-label="Tìm kiếm"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-gray-300 hover:text-white"
                onClick={() => setMobileSearchVisible(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {isAuthenticated && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-9 w-9 text-gray-300 hover:text-white relative ml-1"
                  onClick={() => router.push('/notifications')}
                >
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-amber-600 text-[10px]">
                    2
                  </Badge>
                </Button>
                
                <Link href="/profile" className="ml-1">
                  <Avatar className="h-8 w-8 border-2 border-amber-600/20 ring-2 ring-amber-500/10">
                    {user?.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.full_name || "Avatar"} />
                    ) : (
                      <AvatarFallback className="bg-amber-600/10 text-amber-500 text-xs font-medium">
                        {getUserInitial()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Link>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-300 hover:text-white ml-1">
                  <MenuIcon className="h-5 w-5" />
                  <span className="sr-only">Mở menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px] bg-gray-900 border-gray-800 text-white p-0">
                <SheetHeader className="p-4 border-b border-gray-800/50 mb-0 bg-gradient-to-b from-black to-transparent">
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <Link href="/" onClick={(e) => { handleLogoClick(e); }} className="flex items-center gap-2">
                      <div className="w-8 h-8 relative overflow-hidden rounded-full bg-gradient-to-br from-amber-500 to-amber-600 p-0.5 shadow-md shadow-amber-900/20">
                        <div className="absolute inset-0 bg-black rounded-full m-0.5"></div>
                        <Image
                          src="/logo.svg"
                          alt="AllDrama Logo"
                          width={32}
                          height={32}
                          className="object-contain relative z-20 p-1.5"
                        />
                      </div>
                      <span className="text-xl font-normal bg-gradient-to-r from-amber-400 to-amber-500 text-transparent bg-clip-text font-fleur-de-leah">
                        AllDrama
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="py-4 px-3 overflow-y-auto">
                  <div className="space-y-1 mb-6">
                    <h3 className="text-sm font-medium text-gray-400 px-2 mb-2">Điều hướng</h3>
                    <SheetClose asChild>
                      <Button
                        variant={pathname === "/" ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start rounded-lg",
                          pathname === "/"
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50",
                        )}
                        onClick={() => pathname !== "/" && clearHomepageCache()}
                        asChild
                      >
                        <Link href="/">
                          <Home className="h-4 w-4 mr-2" />
                          Trang chủ
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant={
                          pathname.startsWith("/movie") && !pathname.startsWith("/movie/genre") ? "default" : "ghost"
                        }
                        className={cn(
                          "w-full justify-start rounded-lg",
                          pathname.startsWith("/movie") && !pathname.startsWith("/movie/genre")
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50",
                        )}
                        asChild
                      >
                        <Link href="/movie">
                          <Clapperboard className="h-4 w-4 mr-2" />
                          Phim
                        </Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        variant={pathname.startsWith("/episode") ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start rounded-lg",
                          pathname.startsWith("/episode")
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-800/50",
                        )}
                        asChild
                      >
                        <Link href="/episode">
                          <List className="h-4 w-4 mr-2" />
                          Tập mới
                        </Link>
                      </Button>
                    </SheetClose>
                  </div>

                  <div className="space-y-1 mb-6">
                    <h3 className="text-sm font-medium text-gray-400 px-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Thể loại phim
                      </div>
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                      {genres.map((genre) => (
                        <SheetClose key={genre.slug} asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start h-9 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                            asChild
                          >
                            <Link href={`/search?genre=${encodeURIComponent(genre.name)}`}>{genre.name}</Link>
                          </Button>
                        </SheetClose>
                      ))}
                    </div>
                  </div>

                  {isAuthenticated ? (
                    <div className="space-y-1 pt-4 border-t border-gray-800">
                      <div className="flex items-center gap-3 mb-4 px-2">
                        <Avatar className="h-11 w-11 border-2 border-amber-600/20 ring-2 ring-amber-500/10">
                          {user?.avatar_url ? (
                            <AvatarImage src={user.avatar_url} alt={user.full_name || "Avatar"} />
                          ) : (
                            <AvatarFallback className="bg-amber-600/10 text-amber-500 font-medium">
                              {getUserInitial()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{user?.full_name || "Người dùng"}</div>
                          <div className="text-xs text-gray-400 truncate">{user?.email || ""}</div>
                        </div>
                      </div>

                      <h3 className="text-sm font-medium text-gray-400 px-2 mb-2">Tài khoản</h3>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          asChild
                        >
                          <Link href="/profile">
                            <User className="h-4 w-4 mr-2" />
                            Trang cá nhân
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          asChild
                        >
                          <Link href="/notifications">
                            <Bell className="h-4 w-4 mr-2" />
                            <div className="flex items-center gap-2">
                              Thông báo
                              <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-amber-600 text-[10px]">
                                2
                              </Badge>
                            </div>
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          asChild
                        >
                          <Link href="/profile?tab=favorites">
                            <Heart className="h-4 w-4 mr-2" />
                            Phim yêu thích
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          asChild
                        >
                          <Link href="/profile?tab=history">
                            <History className="h-4 w-4 mr-2" />
                            Lịch sử xem
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                          asChild
                        >
                          <Link href="/profile?tab=settings">
                            <Settings className="h-4 w-4 mr-2" />
                            Cài đặt
                          </Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-gray-800/50 rounded-lg mt-1"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Đăng xuất
                        </Button>
                      </SheetClose>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-4 border-t border-gray-800">
                      <h3 className="text-sm font-medium text-gray-400 px-2 mb-2">Tài khoản</h3>
                      <div className="flex flex-col gap-2 px-1">
                        <SheetClose asChild>
                          <Button
                            variant="ghost"
                            className="w-full text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg"
                            asChild
                          >
                            <Link href="/login">Đăng nhập</Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button 
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow shadow-amber-900/20" 
                            asChild
                          >
                            <Link href="/register">Đăng ký</Link>
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
