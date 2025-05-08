import { useState, useEffect } from 'react';

// Helper function to check if code is running in browser
const isBrowser = () => typeof window !== 'undefined';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State để lưu trữ giá trị
  // Thêm function vào useState để chỉ khởi tạo một lần
  const [value, setValue] = useState<T>(() => {
    if (!isBrowser()) {
      return initialValue;
    }
    
    try {
      // Lấy từ local storage bằng key
      const item = window.localStorage.getItem(key);
      // Parse lưu trữ JSON hoặc trả về initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // Nếu có lỗi cũng trả về giá trị khởi tạo
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Trả về hàm wrapper cập nhật localStorage khi state thay đổi
  const setValue2 = (valueOrFn: T | ((val: T) => T)) => {
    try {
      // Cho phép cả giá trị lẫn function như setter của React
      const valueToStore = typeof valueOrFn === 'function'
        ? (valueOrFn as (val: T) => T)(value)
        : valueOrFn;
        
      // Lưu state
      setValue(valueToStore);
      
      // Kiểm tra nếu đang ở browser thì mới lưu vào localStorage
      if (isBrowser()) {
        // Lưu vào localStorage
        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Xử lý localStorage changes từ các cửa sổ khác
  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    
    function handleStorageChange(event: StorageEvent) {
      if (event.key === key && event.newValue) {
        setValue(JSON.parse(event.newValue));
      }
    }

    // Thêm event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Xóa event listener on cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [value, setValue2] as const;
} 