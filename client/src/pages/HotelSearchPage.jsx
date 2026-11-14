import React, { useState, useEffect, useContext, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './HotelSearchPage.css';

/**
 * صفحة مقارنة الفنادق والعروض المباشرة (Le Cerveau / Live Price Comparator)
 * تقارن الأسعار الحقيقية بين Booking.com و Agoda و Expedia مع توصيات الذكاء الاصطناعي
 */
function HotelSearchPage() {
  const { api, showToast } = useContext(AppContext);
  const [destination, setDestination] = useState('paris');
  const [searchInput, setSearchInput] = useState('');
  const [hotelsData, setHotelsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب الفنادق وعروض الأسعار
  const fetchHotels = useCallback(async (city) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/hotels/search?destination=${encodeURIComponent(city || 'paris')}`);
      setHotelsData(res.data);
    } catch (err) {
      console.error('فشل جلب عروض الفنادق:', err);
      showToast('تعذر تحميل عروض الفنادق', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    fetchHotels(destination);
  }, [fetchHotels, destination]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setDestination(searchInput.trim());
      fetchHotels(searchInput.trim());
    }
  };

  const handleCityPillClick = (cityKey) => {
    setDestination(cityKey);
    setSearchInput('');
    fetchHotels(cityKey);
  };

  const handleBookingClick = (url) => {
    try {
      WebApp.openLink(url);
    } catch {
      window.open(url, '_blank');
    }
  };

  const quickCities = [
    { key: 'paris', label: '🗼 باريس' },
    { key: 'dubai', label: '🌴 دبي' },
    { key: 'marrakech', label: '🌸 مراكش' },
    { key: 'istanbul', label: '🌊 إسطنبول' },
  ];

  return (
    <div className="hotel-search-page fade-in">
      {/* رأس الصفحة */}
      <div className="travel-hero card">
        <span className="travel-badge">✨ محرك الذكاء الاصطناعي للأسعار</span>
        <h1 className="travel-title">مقارنة أسعار الفنادق المباشرة 🏨</h1>
        <p className="travel-subtitle">
          نوفر لك حتى <strong>35% من سعر الإقامة</strong> بمقارنة كبرى منصات الحجز العالمية في ثانية واحدة!
        </p>

        {/* شريط البحث */}
        <form onSubmit={handleSearchSubmit} className="travel-search-form">
          <input
            type="text"
            className="travel-search-input"
            placeholder="اكتب اسم أي مدينة (مثال: باريس، دبي، روما)..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary travel-search-btn">
            🔍 بحث
          </button>
        </form>

        {/* أزرار الوجهات السريعة */}
        <div className="quick-cities-row">
          {quickCities.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`city-pill ${destination === c.key ? 'city-pill-active' : ''}`}
              onClick={() => handleCityPillClick(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* شريط التوصية بالذكاء الاصطناعي */}
      {hotelsData?.aiAdvice && (
        <div className="ai-advice-banner">
          <span className="ai-advice-icon">🧠</span>
          <span className="ai-advice-text">{hotelsData.aiAdvice}</span>
        </div>
      )}

      {/* قائمة الفنادق والصفقات */}
      {loading ? (
        <div className="inline-loader">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="hotel-cards-list">
          {hotelsData?.hotels?.map((hotel) => (
            <div key={hotel.id} className="card hotel-deal-card">
              <div className="hotel-img-wrapper">
                <img src={hotel.image} alt={hotel.name} className="hotel-img" />
                <span className="hotel-tag">{hotel.tag}</span>
                <span className="hotel-rating-badge">★ {hotel.rating}</span>
              </div>

              <div className="hotel-content">
                <h3 className="hotel-name">{hotel.name}</h3>
                <p className="hotel-location">📍 {hotel.location}</p>

                {/* صندوق مقارنة الأسعار بين المنصات */}
                <div className="price-comparison-box">
                  <div className="provider-row provider-best">
                    <span className="provider-name">⭐ Agoda (أرخص صفقة)</span>
                    <span className="provider-price">{hotel.prices.agoda} €</span>
                  </div>
                  <div className="provider-row">
                    <span className="provider-name">🏨 Booking.com</span>
                    <span className="provider-price provider-price-strike">
                      {hotel.prices.booking} €
                    </span>
                  </div>
                  <div className="provider-row">
                    <span className="provider-name">✈️ Expedia</span>
                    <span className="provider-price provider-price-strike">
                      {hotel.prices.expedia} €
                    </span>
                  </div>
                </div>

                {/* نصيحة الذكاء الاصطناعي */}
                <div className="hotel-ai-tip">
                  <p>{hotel.aiSummary}</p>
                </div>

                {/* أزرار الحجز مع الروابط التابعة */}
                <div className="hotel-actions-row">
                  <button
                    className="btn btn-primary btn-block btn-book-best"
                    onClick={() => handleBookingClick(hotel.agodaUrl)}
                  >
                    🚀 احجز عبر Agoda ({hotel.prices.agoda} € - الأرخص)
                  </button>
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={() => handleBookingClick(hotel.bookingUrl)}
                  >
                    استعراض في Booking.com
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

export default HotelSearchPage;

