import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import './FavoritesPage.css';

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('boot_hotel_favs');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const removeFavorite = (id) => {
    const updated = favorites.filter((h) => h.id !== id);
    setFavorites(updated);
    try {
      localStorage.setItem('boot_hotel_favs', JSON.stringify(updated));
    } catch {}
  };

  const handleBookingClick = (url) => {
    try {
      WebApp.openLink(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="favorites-page fade-in">
      <div className="fav-hero card">
        <h1 className="fav-title">فنادقي المفضلة والحجوزات ❤️</h1>
        <p className="fav-subtitle">
          قائمة الفنادق والعروض التي قمت بحفظها للرجوع إليها وحجزها بأرخص سعر.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="no-favs-card card">
          <span className="no-favs-icon">🏨</span>
          <h3>لم تقم بحفظ أي فنادق بعد!</h3>
          <p>أثناء تصفح الفنادق، اضغط على علامة القلب ❤️ لحفظ أي فندق في هذه القائمة.</p>
          <NavLink to="/" className="btn btn-primary btn-block">
            🔍 استعراض الفنادق والصفقات الآن
          </NavLink>
        </div>
      ) : (
        <div className="favs-list">
          {favorites.map((hotel) => (
            <div key={hotel.id} className="card fav-item-card">
              <div className="fav-item-img-wrapper">
                <img src={hotel.image} alt={hotel.name} className="fav-item-img" />
                <span className="fav-item-rating">★ {hotel.rating}</span>
              </div>
              <div className="fav-item-content">
                <div className="fav-item-header">
                  <h3 className="fav-item-name">{hotel.name}</h3>
                  <button
                    type="button"
                    className="fav-remove-btn"
                    onClick={() => removeFavorite(hotel.id)}
                    title="حذف من المفضلة"
                  >
                    🗑️
                  </button>
                </div>
                <p className="fav-item-location">📍 {hotel.location}</p>

                <div className="fav-item-price-row">
                  <div>
                    <span className="fav-price-label">أرخص سعر (Agoda) :</span>
                    <span className="fav-price-val">{hotel.prices?.agoda} €</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary fav-book-btn"
                    onClick={() => handleBookingClick(hotel.agodaUrl)}
                  >
                    🚀 حجز
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
