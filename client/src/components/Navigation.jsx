import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Navigation.css';

/**
 * شريط التنقل السفلي المخصص لخدمات الفنادق والسفر حصراً
 */
function Navigation() {
  const location = useLocation();

  const tabs = [
    { path: '/', label: 'فنادق وعروض', icon: '🏨' },
    { path: '/vip', label: 'Club VIP', icon: '👑' },
    { path: '/favorites', label: 'المفضلة', icon: '❤️' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
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
