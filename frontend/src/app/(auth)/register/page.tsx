'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/api/useAuth';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { isAuthenticated, register, loading } = useAuth();
  
  // Nếu đã đăng nhập, chuyển hướng về trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra các trường
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin đăng ký');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với điều khoản dịch vụ');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Gọi hàm đăng ký từ useAuth hook
      const result = await register({
        full_name: fullName,
        email,
        password
      });
      
      if (result) {
        toast.success('Đăng ký thành công!');
        // Nếu đăng ký thành công, useAuth sẽ tự động đăng nhập và chuyển hướng
      } else {
        // Nếu register trả về null, có thể đã có lỗi
        setError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi đăng ký. Vui lòng thử lại');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <Link href="/" className="flex justify-center mb-6">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={64}
              height={64}
              className="h-16 w-auto"
            />
          </Link>
          <h2 className="text-3xl font-extrabold text-white">Đăng ký tài khoản</h2>
          <p className="mt-2 text-sm text-gray-400">
            Hoặc{' '}
            <Link href="/login" className="font-medium text-amber-500 hover:text-amber-400">
              đăng nhập nếu đã có tài khoản
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="full-name" className="sr-only">
                Họ và tên
              </label>
              <input
                id="full-name"
                name="full-name"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                placeholder="Họ và tên"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Xác nhận mật khẩu
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-amber-500 focus:border-amber-500 focus:z-10 sm:text-sm"
                placeholder="Xác nhận mật khẩu"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-700 rounded bg-gray-700"
            />
            <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-300">
              Tôi đồng ý với{' '}
              <Link href="/terms" className="text-amber-500 hover:text-amber-400">
                điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link href="/privacy" className="text-amber-500 hover:text-amber-400">
                chính sách bảo mật
              </Link>
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md text-white text-sm font-medium ${(isLoading || loading) ? 'bg-amber-700 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'}`}
            >
              {(isLoading || loading) ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {(isLoading || loading) ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
