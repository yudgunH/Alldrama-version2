'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/api/useAuth';

// Loading component for Suspense
const LoginPageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-lg animate-pulse">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gray-700 rounded-full"></div>
        </div>
        <div className="h-8 bg-gray-700 rounded w-2/3 mx-auto"></div>
        <div className="h-4 bg-gray-700 rounded w-1/3 mx-auto"></div>
        
        <div className="space-y-4 pt-4">
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
          <div className="h-6 bg-gray-700 rounded"></div>
          <div className="h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Component that uses useSearchParams
const LoginContent = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading } = useAuth();
  
  // Kiểm tra nếu user vừa đăng ký thành công
  useEffect(() => {
    const registered = searchParams?.get('registered');
    if (registered === 'success') {
      setShowSuccess(true);
    }
  }, [searchParams]);
  
  // Kiểm tra nếu đã đăng nhập, chuyển hướng về trang chủ
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login({ email, password });
      
      if (!result) {
        setError('Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.');
        setIsLoading(false);
        return;
      }
      
      // Login thành công, router.push sẽ được gọi bởi useEffect trong useAuth hook
    } catch (err) {
      setError('Có lỗi xảy ra, vui lòng thử lại');
      console.error('Login error:', err);
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
          <h2 className="text-3xl font-extrabold text-white">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-400">
            Hoặc{' '}
            <Link href="/register" className="font-medium text-red-500 hover:text-red-400">
              đăng ký tài khoản mới
            </Link>
          </p>
        </div>
        
        {showSuccess && (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-4 py-3 rounded-lg">
            <p>Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
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
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
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
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-700 placeholder-gray-500 text-white rounded-md bg-gray-700/50 focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Mật khẩu"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-700 rounded bg-gray-700/50"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Ghi nhớ đăng nhập
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-red-500 hover:text-red-400">
                Quên mật khẩu?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {(isLoading || loading) ? 'Đang xử lý...' : 'Đăng nhập'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoader />}>
      <LoginContent />
    </Suspense>
  );
}
