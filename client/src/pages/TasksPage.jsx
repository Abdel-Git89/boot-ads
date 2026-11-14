import React, { useState, useEffect, useContext, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { AppContext } from '../App';
import './TasksPage.css';

/**
 * صفحة المهام والاستطلاعات - عرض المهام المتاحة للمستخدم
 * يمكن للمستخدم تنفيذ المهام والمشاركة في الاستطلاعات لكسب المكافآت
 */
function TasksPage() {
  const { user, api, showToast, fetchUser } = useContext(AppContext);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [surveyAnswers, setSurveyAnswers] = useState({});

  // جلب قائمة الإعلانات والمهام
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

  // تنفيذ مهمة أو الإجابة على استطلاع
  const handleComplete = async (ad) => {
    if (completingId) return;

    // إذا كانت المهمة استطلاع رأي، التأكد من اختيار إجابة
    if (ad.type === 'survey' && !surveyAnswers[ad._id]) {
      showToast('يرجى اختيار إجابة من الاستطلاع أولاً 📊', 'error');
      return;
    }

    setCompletingId(ad._id);

    try {
      // فتح الرابط الخارجي (قناة، موقع، أو بوت)
      if (ad.type === 'link_click' || ad.type === 'channel_sub' || ad.type === 'bot_start') {
        if (ad.targetUrl) {
          try {
            WebApp.openLink(ad.targetUrl);
          } catch {
            window.open(ad.targetUrl, '_blank');
          }
        }
      }

      // إرسال طلب إتمام المهمة مع الإجابة
      await api.post(`/api/ads/${ad._id}/complete`, {
        surveyAnswer: surveyAnswers[ad._id] || undefined,
      });

      showToast(`🎉 مبروك! حصلت على +${ad.rewardPerUser} نقطة!`, 'success');

      // تحديث القائمة والرصيد
      await Promise.all([fetchAds(), fetchUser()]);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'فشل تنفيذ المهمة';
      showToast(msg, 'error');
    } finally {
      setCompletingId(null);
    }
  };

  // أيقونة وتسمية نوع الإعلان
  const getTypeInfo = (type) => {
    switch (type) {
      case 'survey':
        return { icon: '📊', label: 'استطلاع رأي', className: 'badge-survey' };
      case 'channel_sub':
        return { icon: '📢', label: 'اشتراك قناة', className: 'badge-channel' };
      case 'link_click':
        return { icon: '🔗', label: 'زيارة رابط', className: 'badge-link' };
      case 'bot_start':
        return { icon: '🤖', label: 'تجربة بوت', className: 'badge-bot' };
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
          <h1 className="page-title">المهام والاستطلاعات 🚀</h1>
          <p className="page-subtitle">أكمل المهام وشارك في الاستطلاعات واكسب مكافآت فورية!</p>
        </div>
        <div className="balance-badge">
          <span className="balance-label">رصيدك</span>
          <span className="balance-amount">{user?.balance?.toFixed(2) || '0.00'}</span>
        </div>
      </div>

      {/* قائمة المهام والاستطلاعات */}
      {ads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p className="empty-state-text">لا توجد مهام أو استطلاعات متاحة حالياً</p>
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

                {/* جزء استطلاع الرأي التفاعلي */}
                {ad.type === 'survey' && ad.surveyData?.question && !isCompleted && (
                  <div className="survey-container">
                    <h4 className="survey-question">❓ {ad.surveyData.question}</h4>
                    <div className="survey-options">
                      {ad.surveyData.options?.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`survey-opt-btn ${surveyAnswers[ad._id] === opt ? 'survey-opt-selected' : ''}`}
                          onClick={() => setSurveyAnswers((prev) => ({ ...prev, [ad._id]: opt }))}
                        >
                          <span className="survey-opt-radio">
                            {surveyAnswers[ad._id] === opt ? '🔘' : '⚪'}
                          </span>
                          <span className="survey-opt-text">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                          جاري التحقق...
                        </>
                      ) : ad.type === 'survey' ? (
                        '🗳️ إرسال الإجابة وكسب المكافأة'
                      ) : (
                        '⚡ تنفيذ المهمة'
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
