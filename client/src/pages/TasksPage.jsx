import React, { useState, useEffect, useContext, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './TasksPage.css';

/**
 * صفحة المهام - عرض الإعلانات المتاحة للمستخدم
 * يمكن للمستخدم تنفيذ المهام وكسب المكافآت
 */
function TasksPage() {
  const { user, api, showToast, fetchUser } = useContext(AppContext);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  // جلب قائمة الإعلانات
  const fetchAds = useCallback(async () => {
    try {
      const res = await api.get('/api/ads');
      setAds(res.data);
    } catch (err) {
      console.error('فشل جلب الإعلانات:', err);
      showToast('فشل تحميل المهام', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // تنفيذ مهمة إعلان
  const handleComplete = async (ad) => {
    if (completingId) return;
    setCompletingId(ad._id);

    try {
      // فتح الرابط حسب نوع الإعلان
      if (ad.type === 'link_click' || ad.type === 'channel_sub') {
        try {
          WebApp.openLink(ad.targetUrl);
        } catch {
          window.open(ad.targetUrl, '_blank');
        }
      }

      // إرسال طلب إتمام المهمة
      await api.post(`/api/ads/${ad._id}/complete`);
      showToast(`🎉 حصلت على ${ad.rewardPerUser} نقطة!`, 'success');

      // تحديث القائمة وبيانات المستخدم
      await Promise.all([fetchAds(), fetchUser()]);
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تنفيذ المهمة';
      showToast(msg, 'error');
    } finally {
      setCompletingId(null);
    }
  };

  // أيقونة نوع الإعلان
  const getTypeInfo = (type) => {
    switch (type) {
      case 'channel_sub':
        return { icon: '📢', label: 'اشتراك قناة', className: 'badge-channel' };
      case 'link_click':
        return { icon: '🔗', label: 'زيارة رابط', className: 'badge-link' };
      case 'view':
        return { icon: '👁️', label: 'مشاهدة', className: 'badge-view' };
      default:
        return { icon: '📌', label: type, className: '' };
    }
  };

  if (loading) {
    return (
      <div className="inline-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tasks-page fade-in">
      {/* رأس الصفحة مع الرصيد */}
      <div className="tasks-header">
        <div>
          <h1 className="page-title">المهام</h1>
          <p className="page-subtitle">أكمل المهام واكسب المكافآت</p>
        </div>
        <div className="balance-badge">
          <span className="balance-label">رصيدك</span>
          <span className="balance-amount">{user?.balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* قائمة الإعلانات */}
      {ads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">لا توجد مهام متاحة حالياً</p>
        </div>
      ) : (
        <div className="ads-list">
          {ads.map((ad) => {
            const typeInfo = getTypeInfo(ad.type);
            const isCompleted = ad.isCompleted;
            const isCompleting = completingId === ad._id;

            return (
              <div key={ad._id} className={`ad-card card ${isCompleted ? 'ad-card-completed' : ''}`}>
                <div className="ad-card-header">
                  <span className={`badge ${typeInfo.className}`}>
                    {typeInfo.icon} {typeInfo.label}
                  </span>
                  <span className="ad-reward">
                    +{ad.rewardPerUser} <span className="reward-label">نقطة</span>
                  </span>
                </div>

                <h3 className="ad-title">{ad.title}</h3>
                <p className="ad-description">{ad.description}</p>

                {ad.advertiserId?.username && (
                  <p className="ad-advertiser">بواسطة @{ad.advertiserId.username}</p>
                )}

                <div className="ad-card-footer">
                  {isCompleted ? (
                    <button className="btn btn-success btn-block" disabled>
                      مكتمل ✓
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-block"
                      onClick={() => handleComplete(ad)}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <span className="spinner spinner-sm"></span>
                          جاري التنفيذ...
                        </>
                      ) : (
                        'تنفيذ'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TasksPage;
