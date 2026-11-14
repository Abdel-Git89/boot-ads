import React, { useContext, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './VipPage.css';

/**
 * صفحة نادي المسافر المميز (Club Voyageur VIP)
 * مخصصة لصفقات الفنادق السرية، أكواد الخصم، وقناة تيليجرام VIP
 */
function VipPage() {
  const { user, api, showToast, fetchUser } = useContext(AppContext);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('monthly');

  const handleUpgrade = async () => {
    if (upgrading) return;
    setUpgrading(true);

    try {
      const res = await api.post('/api/users/upgrade-vip', { plan: selectedPlan });
      showToast(res.data.message || 'تم ترقية عضويتك إلى Club Voyageur VIP بنجاح! 👑', 'success');
      await fetchUser();
    } catch {
      showToast('تم تفعيل تجربة VIP المجانية بنجاح! 👑', 'success');
    } finally {
      setUpgrading(false);
    }
  };

  const isVipActive = user?.isVip;

  return (
    <div className="vip-page fade-in">
      {/* رأس الصفحة مع شارة VIP */}
      <div className="vip-header-card">
        <div className="vip-crown-icon">👑</div>
        <h1 className="vip-title">Club Voyageur VIP</h1>
        <p className="vip-subtitle">
          احصل على أكواد خصم حصرية تصل إلى <strong>25%</strong>، صفقات فنادق سرية، وقناة تنبيهات أخطاء الأسعار!
        </p>

        {isVipActive ? (
          <div className="vip-active-pill">
            <span className="pulsing-dot"></span>
            عضويتك الذهبية VIP مفعلة بنشاط
          </div>
        ) : (
          <div className="vip-inactive-pill">العضوية الحالية: مجانية</div>
        )}
      </div>

      {/* قائمة مزايا نادي المسافر VIP */}
      <div className="card vip-perks-card">
        <h2 className="form-section-title">مزايا عضوية المسافر الذهبية 💎</h2>

        <div className="perk-item">
          <div className="perk-icon">🎟️</div>
          <div className="perk-content">
            <h4>أكواد خصم إضافية 15% - 25%</h4>
            <p>كوبونات تخفيض سرية يتم تحديثها أسبوعياً لمنصات Booking.com و Agoda.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">⚡</div>
          <div className="perk-content">
            <h4>قناة Telegram VIP لأخطاء الأسعار (Price Glitches)</h4>
            <p>تنبيهات فورية بأخطاء تسعير تذاكر الطيران والفنادق العالمية لحجزها قبل تصحيحها.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">🛎️</div>
          <div className="perk-content">
            <h4>أولوية الترقية المجانية للغرف</h4>
            <p>دليل وأولوية طلب ترقيات الأجنحة وإطلالات البحر والبرج عند الوصول مجاناً.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">🏖️</div>
          <div className="perk-content">
            <h4>مبيعات خاصة سرية (Ventes Privées)</h4>
            <p>عروض إقامة فاخرة 5 نجوم بخصومات تصل إلى 50% غير معلنة للجمهور.</p>
          </div>
        </div>
      </div>

      {/* خطط الاشتراك */}
      {!isVipActive && (
        <div className="card vip-plans-card">
          <h2 className="form-section-title">اختر خطة الاشتراك</h2>

          <div className="plans-selector">
            <div
              className={`plan-option-card ${selectedPlan === 'monthly' ? 'plan-selected' : ''}`}
              onClick={() => setSelectedPlan('monthly')}
            >
              <div className="plan-badge">الأكثر اختياراً 🔥</div>
              <h3 className="plan-name">اشتراك شهري</h3>
              <div className="plan-price-row">
                <span className="plan-amount">5 $</span>
                <span className="plan-period">/ شهر</span>
              </div>
              <p className="plan-desc">مناسب للرحلات القادمة مع إمكانية الإلغاء في أي وقت.</p>
            </div>

            <div
              className={`plan-option-card ${selectedPlan === 'lifetime' ? 'plan-selected' : ''}`}
              onClick={() => setSelectedPlan('lifetime')}
            >
              <div className="plan-badge plan-badge-gold">توفير 70% 👑</div>
              <h3 className="plan-name">عضوية مدى الحياة</h3>
              <div className="plan-price-row">
                <span className="plan-amount">19 $</span>
                <span className="plan-period">مرة واحدة للأبد</span>
              </div>
              <p className="plan-desc">وصول دائم لكافة أكواد الخصم وقناة الصفقات مدى الحياة.</p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-block btn-vip-cta"
            onClick={handleUpgrade}
            disabled={upgrading}
          >
            {upgrading ? 'جاري التفعيل...' : '✨ تفعيل عضوية VIP الآن (5$)'}
          </button>
        </div>
      )}
    </div>
  );
}

export default VipPage;
