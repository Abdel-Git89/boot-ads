import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../App';
import './AdvertiserPage.css';

/**
 * صفحة المعلن - إنشاء وإدارة الإعلانات
 * متاحة فقط للمعلنين والمشرفين
 */
function AdvertiserPage() {
  const { user, api, showToast, fetchUser } = useContext(AppContext);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetUrl: '',
    type: 'link_click',
    rewardPerUser: '',
    budget: '',
  });

  // جلب إعلانات المعلن
  const fetchMyAds = useCallback(async () => {
    try {
      const res = await api.get('/api/ads');
      // تصفية الإعلانات الخاصة بالمعلن الحالي
      const myAds = res.data.filter(
        (ad) => ad.advertiserId?._id === user?._id || ad.advertiserId === user?._id
      );
      setAds(myAds);
    } catch (err) {
      console.error('فشل جلب الإعلانات:', err);
    } finally {
      setLoading(false);
    }
  }, [api, user]);

  useEffect(() => {
    fetchMyAds();
  }, [fetchMyAds]);

  // التحقق من صلاحية المستخدم
  if (user?.role !== 'advertiser' && user?.role !== 'admin') {
    return (
      <div className="advertiser-page fade-in">
        <div className="access-denied card">
          <span className="access-denied-icon">🔒</span>
          <h2>الوصول مقيّد</h2>
          <p>هذه الصفحة متاحة فقط للمعلنين</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await api.put('/api/users/me', { role: 'advertiser' });
                await fetchUser();
                showToast('تم ترقية حسابك إلى معلن!', 'success');
              } catch (err) {
                showToast('فشل ترقية الحساب', 'error');
              }
            }}
          >
            ترقية إلى معلن
          </button>
        </div>
      </div>
    );
  }

  // تحديث حقول النموذج
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // إرسال إعلان جديد
  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من البيانات
    if (!form.title.trim() || !form.description.trim() || !form.targetUrl.trim()) {
      showToast('يرجى ملء جميع الحقول', 'error');
      return;
    }

    const reward = parseFloat(form.rewardPerUser);
    const budget = parseFloat(form.budget);

    if (isNaN(reward) || reward <= 0) {
      showToast('يرجى إدخال مكافأة صحيحة', 'error');
      return;
    }

    if (isNaN(budget) || budget <= 0) {
      showToast('يرجى إدخال ميزانية صحيحة', 'error');
      return;
    }

    if (budget < reward) {
      showToast('الميزانية يجب أن تكون أكبر من المكافأة', 'error');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/ads', {
        title: form.title.trim(),
        description: form.description.trim(),
        targetUrl: form.targetUrl.trim(),
        type: form.type,
        rewardPerUser: reward,
        budget: budget,
      });

      showToast('تم إنشاء الإعلان بنجاح! 🎉', 'success');

      // إعادة تعيين النموذج
      setForm({
        title: '',
        description: '',
        targetUrl: '',
        type: 'link_click',
        rewardPerUser: '',
        budget: '',
      });

      // تحديث القائمة والرصيد
      await Promise.all([fetchMyAds(), fetchUser()]);
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل إنشاء الإعلان';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // حالة الإعلان
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { label: 'نشط', className: 'badge-active' };
      case 'paused':
        return { label: 'متوقف', className: 'badge-paused' };
      case 'completed':
        return { label: 'مكتمل', className: 'badge-completed' };
      default:
        return { label: status, className: '' };
    }
  };

  return (
    <div className="advertiser-page fade-in">
      <h1 className="page-title">لوحة المعلن</h1>
      <p className="page-subtitle">أنشئ إعلانات وانشرها للمستخدمين</p>

      {/* نموذج إنشاء إعلان */}
      <div className="card">
        <h2 className="form-section-title">إنشاء إعلان جديد</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">عنوان الإعلان</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="مثال: اشترك في قناتنا"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea
              name="description"
              className="form-textarea"
              placeholder="وصف تفصيلي للمهمة المطلوبة..."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">الرابط المستهدف</label>
            <input
              type="url"
              name="targetUrl"
              className="form-input"
              placeholder="https://t.me/channel"
              value={form.targetUrl}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">نوع الإعلان</label>
            <select
              name="type"
              className="form-select"
              value={form.type}
              onChange={handleChange}
            >
              <option value="link_click">🔗 زيارة رابط</option>
              <option value="channel_sub">📢 اشتراك قناة</option>
              <option value="view">👁️ مشاهدة</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group form-group-half">
              <label className="form-label">المكافأة لكل مستخدم</label>
              <input
                type="number"
                name="rewardPerUser"
                className="form-input"
                placeholder="0.50"
                value={form.rewardPerUser}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group form-group-half">
              <label className="form-label">الميزانية الكلية</label>
              <input
                type="number"
                name="budget"
                className="form-input"
                placeholder="10.00"
                value={form.budget}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting ? 'جاري الإنشاء...' : '🚀 إنشاء الإعلان'}
          </button>
        </form>
      </div>

      {/* قائمة إعلانات المعلن */}
      <div className="my-ads-section">
        <h2 className="section-header">إعلاناتي</h2>

        {loading ? (
          <div className="inline-loader">
            <div className="spinner"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">لم تنشئ أي إعلانات بعد</p>
          </div>
        ) : (
          ads.map((ad) => {
            const statusInfo = getStatusInfo(ad.status);
            return (
              <div key={ad._id} className="card my-ad-card">
                <div className="my-ad-header">
                  <h3 className="my-ad-title">{ad.title}</h3>
                  <span className={`badge ${statusInfo.className}`}>{statusInfo.label}</span>
                </div>
                <p className="my-ad-description">{ad.description}</p>
                <div className="my-ad-stats">
                  <div className="stat">
                    <span className="stat-label">المكافأة</span>
                    <span className="stat-value">{ad.rewardPerUser}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">الميزانية المتبقية</span>
                    <span className="stat-value">{ad.remainingBudget?.toFixed(2)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">الإجمالي</span>
                    <span className="stat-value">{ad.budget?.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdvertiserPage;
