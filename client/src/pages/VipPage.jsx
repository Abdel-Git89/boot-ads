import React, { useContext, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './VipPage.css';

/**
 * صفحة العضوية المميزة VIP (Canal VIP & Abonnement)
 * نموذج اشتراك شهري يضاعف الأرباح ويوفر سحباً بدون رسوم
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
      showToast(res.data.message || 'تم ترقية حسابك إلى VIP بنجاح! 👑', 'success');
      await fetchUser();
    } catch (err) {
      const msg = err.response?.data?.error || 'فشل الترقية إلى VIP';
      showToast(msg, 'error');
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
        <h1 className="vip-title">نادي النخبة VIP</h1>
        <p className="vip-subtitle">
          ضاعف أرباحك، اسحب بدون أي رسوم، وانضم إلى مجتمع الصفوة!
        </p>

        {isVipActive ? (
          <div className="vip-active-pill">
            <span className="pulsing-dot"></span>
            عضويتك المميزة VIP مفعلة بنشاط
          </div>
        ) : (
          <div className="vip-inactive-pill">العضوية الحالية: مجانية</div>
        )}
      </div>

      {/* قائمة مزايا VIP */}
      <div className="card vip-perks-card">
        <h2 className="form-section-title">مزايا عضوية VIP الحصرية 💎</h2>

        <div className="perk-item">
          <div className="perk-icon">⚡</div>
          <div className="perk-content">
            <h4>أرباح إضافية +25%</h4>
            <p>تحصل على 25% نقاط إضافية على كل مهمة أو استطلاع تنجزه.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">💸</div>
          <div className="perk-content">
            <h4>0% رسوم سحب مجاناً</h4>
            <p>سحب أرباحك كاملة دون أي اقتطاع أو رسوم منصة نهائياً.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">📢</div>
          <div className="perk-content">
            <h4>قناة Telegram VIP الخاصة</h4>
            <p>وصول فوري لقناة الصفقات الحصرية وطرق مضاعفة الدخل.</p>
          </div>
        </div>

        <div className="perk-item">
          <div className="perk-icon">🚀</div>
          <div className="perk-content">
            <h4>أولوية السحب الفوري</h4>
            <p>معالجة وتأكيد طلبات السحب الخاصة بك بسرعة فائقة.</p>
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
              <div className="plan-badge">الأكثر شعبية 🔥</div>
              <h3 className="plan-name">اشتراك شهري</h3>
              <div className="plan-price">
                5.00 <span className="plan-curr">نقطة / شهر</span>
              </div>
              <p className="plan-desc">تجديد تلقائي شهرياً مع كافة مزايا VIP</p>
            </div>

            <div
              className={`plan-option-card ${selectedPlan === 'lifetime' ? 'plan-selected' : ''}`}
              onClick={() => setSelectedPlan('lifetime')}
            >
              <div className="plan-badge plan-badge-gold">توفير 80% 👑</div>
              <h3 className="plan-name">عضوية دائمة</h3>
              <div className="plan-price">
                20.00 <span className="plan-curr">نقطة لمرة واحدة</span>
              </div>
              <p className="plan-desc">عضوية VIP دائمة مدى الحياة بدون أي تجديد</p>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block btn-vip-activate"
            onClick={handleUpgrade}
            disabled={upgrading}
          >
            {upgrading ? 'جاري التفعيل...' : '👑 ترقية حسابي إلى VIP الآن'}
          </button>
        </div>
      )}

      {/* زر دخول قناة VIP للمشتركين */}
      {isVipActive && (
        <div className="card">
          <h2 className="form-section-title">قناة المشتركين VIP 🚀</h2>
          <p style={{ fontSize: '13px', color: 'var(--tg-theme-hint-color)', marginBottom: '12px' }}>
            بصفتك عضواً مميزاً، يمكنك الانضمام الآن إلى القناة الخاصة لتحميل استراتيجيات الربح الحصرية:
          </p>
          <button
            className="btn btn-primary btn-block"
            onClick={() => {
              try {
                WebApp.openTelegramLink('https://t.me/telegram');
              } catch {
                window.open('https://t.me/telegram', '_blank');
              }
            }}
          >
            📢 الدخول إلى قناة VIP الخاصة
          </button>
        </div>
      )}
    </div>
  );
}

export default VipPage;
