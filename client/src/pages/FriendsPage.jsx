import React, { useContext, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './FriendsPage.css';

/**
 * صفحة الأصدقاء ونظام الإحالة (Referral / Parrainage)
 * تتيح للمستخدمين دعوة أصدقائهم وكسب عمولات سلبية مستمرة
 */
function FriendsPage() {
  const { user, showToast } = useContext(AppContext);
  const [copied, setCopied] = useState(false);

  // رابط الإحالة الخاص بالمستخدم
  const botUsername = 'TechBIAPBot';
  const refCode = user?.telegramId || '123';
  const referralLink = `https://t.me/${botUsername}?startapp=ref_${refCode}`;

  // نسخ الرابط إلى الحافظة
  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast('تم نسخ رابط الإحالة بنجاح! 📋', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // مشاركة الرابط عبر تيليجرام
  const handleShare = () => {
    const text = encodeURIComponent(
      '🚀 انضم إلى منصة Boot-Ads واكسب مكافآت حقيقية بإكمال مهام بسيطة على تيليجرام!'
    );
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`;
    try {
      WebApp.openTelegramLink(shareUrl);
    } catch {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="friends-page fade-in">
      <h1 className="page-title">الأصدقاء والأرباح 👥</h1>
      <p className="page-subtitle">ادعُ أصدقاءك واكسب دخلاً سلبياً مستمراً من كل مهمة يكملونها!</p>

      {/* بطاقة الإحصائيات */}
      <div className="card referral-stats-card">
        <div className="referral-stat-item">
          <span className="referral-stat-icon">👥</span>
          <span className="referral-stat-num">{user?.referralCount || 0}</span>
          <span className="referral-stat-label">الأصدقاء المُحالين</span>
        </div>
        <div className="referral-stat-divider"></div>
        <div className="referral-stat-item">
          <span className="referral-stat-icon">💰</span>
          <span className="referral-stat-num">{user?.referralEarnings?.toFixed(2) || '0.00'}</span>
          <span className="referral-stat-label">أرباح الإحالة</span>
        </div>
      </div>

      {/* بطاقة رابط الدعوة */}
      <div className="card referral-link-card">
        <h2 className="form-section-title">رابط الدعوة الخاص بك</h2>
        <div className="referral-link-box">
          <input
            type="text"
            className="referral-link-input"
            value={referralLink}
            readOnly
          />
        </div>

        <div className="referral-actions">
          <button className="btn btn-secondary btn-block" onClick={handleCopy}>
            {copied ? 'تم النسخ ✓' : '📋 نسخ الرابط'}
          </button>
          <button className="btn btn-primary btn-block" onClick={handleShare}>
            📢 مشاركة في تيليجرام
          </button>
        </div>
      </div>

      {/* كيف يعمل النظام */}
      <div className="card referral-info-card">
        <h2 className="form-section-title">كيف يعمل نظام الربح؟</h2>
        <div className="step-item">
          <div className="step-num">1</div>
          <div className="step-text">
            <strong>شارك رابطك :</strong> أرسل الرابط لأصدقائك في المجموعات أو القنوات.
          </div>
        </div>
        <div className="step-item">
          <div className="step-num">2</div>
          <div className="step-text">
            <strong>مكافأة تسجيل فورية :</strong> تحصل على <strong>+1.00 نقطة</strong> فور انضمام كل صديق.
          </div>
        </div>
        <div className="step-item">
          <div className="step-num">3</div>
          <div className="step-text">
            <strong>أرباح سلبية 5% :</strong> تكسب <strong>5% من قيمة كل مهمة</strong> ينجزها صديقك مدى الحياة!
          </div>
        </div>
      </div>
    </div>
  );
}

export default FriendsPage;

