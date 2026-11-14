import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import Navigation from './components/Navigation';
import HotelSearchPage from './pages/HotelSearchPage';
import VipPage from './pages/VipPage';
import FavoritesPage from './pages/FavoritesPage';

// سياق التطبيق لمشاركة بيانات المستخدم وAPI
export const AppContext = createContext(null);

// إعداد عنوان API: في الإنتاج على Vercel يتم استخدام نفس النطاق، وفي التطوير المحلي http://localhost:5000
const API_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : (import.meta.env.DEV ? 'http://localhost:5000' : '');

// إنشاء نسخة axios مع الإعدادات الافتراضية
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة رأس مصادقة تيليجرام لكل طلب
api.interceptors.request.use((config) => {
  if (WebApp.initData) {
    config.headers['x-telegram-init-data'] = WebApp.initData;
  }
  return config;
});

function App() {
  // تهيئة مستخدم افتراضي سريع لعدم حظر واجهة المستخدم أبداً (0 ثانية تحميل)
  const [user, setUser] = useState({
    firstName: WebApp.initDataUnsafe?.user?.first_name || 'مسافر',
    username: WebApp.initDataUnsafe?.user?.username || 'traveler',
    role: 'user',
    isVip: false,
  });
  const [toast, setToast] = useState(null);

  // عرض إشعار مؤقت
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // جلب بيانات المستخدم في الخلفية دون تعطيل الواجهة
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me');
      if (res.data) {
        setUser(res.data);
      }
    } catch {
      // تجاهل الخطأ في حالة عدم وجود جلسة، فصفحات الفنادق تعمل بشكل كامل بدون مصادقة
    }
  }, []);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
    } catch (e) {
      console.warn('Telegram SDK ready warning:', e);
    }

    // جلب بيانات الحساب في الخلفية
    fetchUser();
  }, [fetchUser]);

  return (
    <AppContext.Provider value={{ user, setUser, api, showToast, fetchUser }}>
      <div className="app">
        {/* إشعار مؤقت */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}

        {/* محتوى الصفحات المخصصة للفنادق والسفر */}
        <div className="content">
          <Routes>
            <Route path="/" element={<HotelSearchPage />} />
            <Route path="/vip" element={<VipPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* شريط التنقل السفلي */}
        <Navigation />
      </div>
    </AppContext.Provider>
  );
}

export default App;
