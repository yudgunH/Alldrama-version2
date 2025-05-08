'use client'

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';

// Create a component that uses useSearchParams
const ResetPasswordForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Lấy token từ URL
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setInvalidToken(true);
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Kiểm tra các trường
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ thông tin!');
      return;
    }
    
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự!');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    
    setIsLoading(true);
    
    // Mô phỏng API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Trong thực tế, đây sẽ là API đặt lại mật khẩu
      setSuccess(true);
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại sau!');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (invalidToken) {
    return (
      <div className="min-h-screen bg-gray-900 py-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
          <div className="text-center">
            <Link href="/" className="inline-flex justify-center">
              <Image 
                src="/logo.svg" 
                alt="AllDrama Logo" 
                width={60} 
                height={60} 
                className="mx-auto"
              />
            </Link>
            <h2 className="mt-4 text-3xl font-extrabold text-white">Liên kết không hợp lệ</h2>
            <p className="mt-2 text-sm text-gray-400">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
            </p>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="bg-red-900/60 text-white p-4 rounded-md">
              <p className="text-sm">
                Vui lòng thực hiện lại yêu cầu đặt lại mật khẩu để nhận liên kết mới.
              </p>
            </div>
            
            <div className="text-center">
              <Link href="/forgot-password" className="inline-flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Yêu cầu liên kết mới
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <Link href="/" className="inline-flex justify-center">
            <Image 
              src="/logo.svg" 
              alt="AllDrama Logo" 
              width={60} 
              height={60} 
              className="mx-auto"
            />
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Đặt lại mật khẩu</h2>
          <p className="mt-2 text-sm text-gray-400">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>
        
        {!success ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/60 text-white text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Mật khẩu mới
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt
                </p>
              </div>
              
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300">
                  Xác nhận mật khẩu
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : 'Đặt lại mật khẩu'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="bg-green-900/60 text-white p-4 rounded-md">
              <h3 className="text-lg font-medium mb-2">Mật khẩu đã được đặt lại!</h3>
              <p className="text-sm">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
            </div>
            
            <div className="text-center">
              <Link href="/login" className="inline-flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Loading component
const LoadingForm = () => {
  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 bg-gray-800 p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-700 animate-pulse rounded-full mx-auto" />
          <div className="mt-4 h-8 bg-gray-700 animate-pulse rounded-lg w-3/4 mx-auto" />
          <div className="mt-2 h-4 bg-gray-700 animate-pulse rounded-lg w-1/2 mx-auto" />
        </div>
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="h-20 bg-gray-700 animate-pulse rounded-lg" />
            <div className="h-20 bg-gray-700 animate-pulse rounded-lg" />
          </div>
          <div className="h-12 bg-gray-700 animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Main component with Suspense
const ResetPasswordPage = () => {
  return (
    <Suspense fallback={<LoadingForm />}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage; 