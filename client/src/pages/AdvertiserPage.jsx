import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../App';
import './AdvertiserPage.css';

/**
 * صفحة المعلن - إنشاء وإدارة الإعلانات والاستطلاعات
 * متاحة للمعلنين والمسؤولين
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
    surveyQuestion: '',
    surveyOptions: ['', ''],
  });

  // جلب إعلانات المعلن
  const fetchMyAds = useCallback(async () => {
    try {
      const res = await api.get('/api/ads');
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
          <h2>لوحة المعلن</h2>
          <p>قم بترقية حسابك إلى معلن لنشر المهام والاستطلاعات</p>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await api.put('/api/users/me', { role: 'advertiser' });
                await fetchUser();
                showToast('تم ترقية حسابك إلى معلن بنجاح! 🚀', 'success');
              } catch (err) {
                showToast('فشل ترقية الحساب', 'error');
              }
            }}
          >
            ترقية حسابي إلى معلن (مجاناً)
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

  // تحديث خيار استطلاع
  const handleOptionChange = (index, value) => {
    const newOptions = [...form.surveyOptions];
    newOptions[index] = value;
    setForm((prev) => ({ ...prev, surveyOptions: newOptions }));
  };

  // إضافة خيار إضافي للاستطلاع
  const addOption = () => {
    if (form.surveyOptions.length < 5) {
      setForm((prev) => ({ ...prev, surveyOptions: [...prev.surveyOptions, ''] }));
    } else {
      showToast('الحد الأقصى هو 5 خيارات', 'error');
    }
  };

  // حذف خيار استطلاع
  const removeOption = (index) => {
    if (form.surveyOptions.length > 2) {
      const newOptions = form.surveyOptions.filter((_, i) => i !== index);
      setForm((prev) => ({ ...prev, surveyOptions: newOptions }));
    }
  };

  // إرسال إعلان جديد
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      showToast('يرجى ملء جميع الحقول الأساسية', 'error');
      return;
    }

    if (form.type !== 'survey' && !form.targetUrl.trim()) {
      showToast('يرجى إدخال الرابط المستهدف للمهمة', 'error');
      return;
    }

    if (form.type === 'survey') {
      if (!form.surveyQuestion.trim()) {
        showToast('يرجى كتابة سؤال الاستطلاع', 'error');
        return;
      }
      const validOptions = form.surveyOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        showToast('يرجى كتابة خيارين على الأقل للاستطلاع', 'error');
        return;
      }
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
        targetUrl: form.type === 'survey' ? '' : form.targetUrl.trim(),
        type: form.type,
        rewardPerUser: reward,
        budget: budget,
        surveyData: form.type === 'survey' ? {
          question: form.surveyQuestion.trim(),
          options: form.surveyOptions.filter((o) => o.trim()),
        } : undefined,
      });

      showToast('تم نشر الحملة بنجاح! 🎉', 'success');

      // إعادة تعيين النموذج
      setForm({
        title: '',
        description: '',
        targetUrl: '',
        type: 'link_click',
        rewardPerUser: '',
        budget: '',
        surveyQuestion: '',
        surveyOptions: ['', ''],
      });

      await Promise.all([fetchMyAds(), fetchUser()]);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'فشل إنشاء الإعلان';
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
      <h1 className="page-title">لوحة المعلن 📢</h1>
      <p className="page-subtitle">أنشئ مهاماً واستطلاعات رأي وانشرها لآلاف المستخدمين!</p>

      {/* نموذج إنشاء مهمة أو استطلاع */}
      <div className="card">
        <h2 className="form-section-title">إنشاء مهمة أو استطلاع جديد</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">نوع المهمة</label>
            <select
              name="type"
              className="form-select"
              value={form.type}
              onChange={handleChange}
            >
              <option value="survey">📊 استطلاع رأي (Sondage)</option>
              <option value="channel_sub">📢 اشتراك قناة تيليجرام</option>
              <option value="link_click">🔗 زيارة موقع / رابط</option>
              <option value="bot_start">🤖 تجربة بوت تيليجرام</option>
              <option value="view">👁️ مشاهدة محتوى</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">عنوان الحملة</label>
            <input
              type="text"
              name="title"
              className="form-input"
              placeholder="مثال: شارك برأيك حول أفضل تطبيق"
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
              placeholder="وصف واضح للمهمة أو التعليمات للمستخدم..."
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* حقول استطلاع الرأي */}
          {form.type === 'survey' ? (
            <div className="survey-form-box">
              <div className="form-group">
                <label className="form-label">سؤال الاستطلاع ❓</label>
                <input
                  type="text"
                  name="surveyQuestion"
                  className="form-input"
                  placeholder="مثال: ما هي ميزتك المفضلة؟"
                  value={form.surveyQuestion}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">خيارات الإجابة</label>
                {form.surveyOptions.map((option, idx) => (
                  <div key={idx} className="survey-option-input-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`الخيار ${idx + 1}`}
                      value={option}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      required
                    />
                    {form.surveyOptions.length > 2 && (
                      <button
                        type="button"
                        className="btn-remove-opt"
                        onClick={() => removeOption(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}

                {form.surveyOptions.length < 5 && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: '8px' }}
                    onClick={addOption}
                  >
                    + إضافة خيار آخر
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">الرابط المستهدف</label>
              <input
                type="url"
                name="targetUrl"
                className="form-input"
                placeholder="https://t.me/your_channel"
                value={form.targetUrl}
                onChange={handleChange}
                required
              />
            </div>
          )}

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
            {submitting ? 'جاري النشر...' : '🚀 نشر الحملة الآن'}
          </button>
        </form>
      </div>

      {/* قائمة حملات المعلن */}
      <div className="my-ads-section">
        <h2 className="section-header">حملاتي النشطة</h2>

        {loading ? (
          <div className="inline-loader">
            <div className="spinner"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">لم تنشئ أي مهام أو استطلاعات بعد</p>
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
                {ad.type === 'survey' && (
                  <p style={{ fontSize: '12px', color: '#af52de', fontWeight: '600', marginBottom: '8px' }}>
                    📊 استطلاع: {ad.surveyData?.question} ({ad.surveyData?.options?.length} خيارات)
                  </p>
                )}
                <div className="my-ad-stats">
                  <div className="stat">
                    <span className="stat-label">المكافأة</span>
                    <span className="stat-value">{ad.rewardPerUser}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">المتبقي</span>
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
