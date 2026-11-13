import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppContext } from '../App';
import './Navigation.css';

/**
 * شريط التنقل السفلي
 * يعرض ثلاثة تبويبات: المهام، المعلن، المحفظة
 */
function Navigation() {
  const { user } = useContext(AppContext);
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'المهام', icon: '📋' },
    { path: '/advertiser', label: 'المعلن', icon: '📢' },
    { path: '/wallet', label: 'المحفظة', icon: '💰' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        // إخفاء تبويب المعلن إذا لم يكن المستخدم معلناً أو مشرفاً
        if (tab.path === '/advertiser' && user?.role !== 'advertiser' && user?.role !== 'admin') {
          return null;
        }

        const isActive = location.pathname === tab.path;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`nav-tab ${isActive ? 'nav-tab-active' : ''}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default Navigation;
