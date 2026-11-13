import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';
import Navigation from './components/Navigation';
import TasksPage from './pages/TasksPage';
import AdvertiserPage from './pages/AdvertiserPage';
import WalletPage from './pages/WalletPage';

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // عرض إشعار مؤقت
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // جلب بيانات المستخدم من الخادم
  const fetchUser = useCallback(async () => {
    try {
      const res = await api.get('/api/users/me');
      setUser(res.data);
    } catch (err) {
      console.error('فشل جلب بيانات المستخدم:', err);
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // إخبار تيليجرام بأن التطبيق جاهز
    WebApp.ready();
    WebApp.expand();

    // جلب بيانات المستخدم عند التحميل
    fetchUser();
  }, [fetchUser]);

  // شاشة التحميل
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>جاري التحميل...</p>
      </div>
    );
  }

  // شاشة الخطأ
  if (error) {
    return (
      <div className="error-screen">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => { setError(null); setLoading(true); fetchUser(); }}>
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, setUser, api, showToast, fetchUser }}>
      <div className="app">
        {/* إشعار مؤقت */}
        {toast && (
          <div className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        )}

        {/* محتوى الصفحات */}
        <div className="content">
          <Routes>
            <Route path="/" element={<TasksPage />} />
            <Route path="/advertiser" element={<AdvertiserPage />} />
            <Route path="/wallet" element={<WalletPage />} />
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
