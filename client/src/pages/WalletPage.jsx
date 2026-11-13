import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AppContext } from '../App';
import './WalletPage.css';

/**
 * صفحة المحفظة - عرض الرصيد والمعاملات
 * إيداع وسحب الأموال
 */
function WalletPage() {
  const { user, api, showToast, fetchUser } = useContext(AppContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('history'); // history | deposit | withdraw
  const [depositForm, setDepositForm] = useState({ amount: '', gateway: 'paypal' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', gateway: 'paypal' });
  const [submitting, setSubmitting] = useState(false);

  // جلب بيانات المحفظة
  const fetchWallet = useCallback(async () => {
    try {
      const res = await api.get('/api/wallet');
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('فشل جلب المحفظة:', err);
      showToast('فشل تحميل بيانات المحفظة', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // معلومات نوع المعاملة
  const getTransactionInfo = (type) => {
    switch (type) {
      case 'reward':
        return { icon: '🎁', label: 'مكافأة', color: 'tx-reward', sign: '+' };
      case 'deposit':
        return { icon: '💳', label: 'إيداع', color: 'tx-deposit', sign: '+' };
      case 'withdrawal':
        return { icon: '📤', label: 'سحب', color: 'tx-withdrawal', sign: '-' };
      case 'ad_spend':
        return { icon: '📢', label: 'إنفاق إعلاني', color: 'tx-ad-spend', sign: '-' };
      default:
        return { icon: '💰', label: type, color: '', sign: '' };
    }
  };

  // بوابات الدفع المتاحة
  const gateways = [
    { value: 'paypal', label: 'PayPal', icon: '💳' },
    { value: 'ton', label: 'TON', icon: '💎' },
    { value: 'usdt', label: 'USDT', icon: '🪙' },
    { value: 'stars', label: 'Stars', icon: '⭐' },
  ];

  // إيداع
  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/wallet/deposit', {
        amount,
        gateway: depositForm.gateway,
      });
      showToast('تم تقديم طلب الإيداع بنجاح ✅', 'success');
      setDepositForm({ amount: '', gateway: 'paypal' });
      await Promise.all([fetchWallet(), fetchUser()]);
      setActiveTab('history');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل الإيداع';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // سحب
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    if (amount > (user?.balance || 0)) {
      showToast('الرصيد غير كافٍ', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/wallet/withdraw', {
        amount,
        gateway: withdrawForm.gateway,
      });
      showToast('تم تقديم طلب السحب بنجاح ✅', 'success');
      setWithdrawForm({ amount: '', gateway: 'paypal' });
      await Promise.all([fetchWallet(), fetchUser()]);
      setActiveTab('history');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل السحب';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="wallet-page fade-in">
      <h1 className="page-title">المحفظة</h1>

      {/* بطاقة الرصيد */}
      <div className="balance-card">
        <span className="balance-card-label">الرصيد الحالي</span>
        <span className="balance-card-amount">{user?.balance?.toFixed(2) || '0.00'}</span>
        <div className="balance-actions">
          <button
            className={`balance-action-btn ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            💳 إيداع
          </button>
          <button
            className={`balance-action-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            📤 سحب
          </button>
        </div>
      </div>

      {/* نموذج الإيداع */}
      {activeTab === 'deposit' && (
        <div className="card form-card fade-in">
          <h2 className="form-section-title">إيداع رصيد</h2>
          <form onSubmit={handleDeposit}>
            <div className="form-group">
              <label className="form-label">المبلغ</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={depositForm.amount}
                onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <div className="gateway-options">
                {gateways.map((gw) => (
                  <button
                    type="button"
                    key={gw.value}
                    className={`gateway-btn ${depositForm.gateway === gw.value ? 'gateway-btn-active' : ''}`}
                    onClick={() => setDepositForm({ ...depositForm, gateway: gw.value })}
                  >
                    <span>{gw.icon}</span>
                    <span>{gw.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'جاري المعالجة...' : 'تأكيد الإيداع'}
            </button>
          </form>
        </div>
      )}

      {/* نموذج السحب */}
      {activeTab === 'withdraw' && (
        <div className="card form-card fade-in">
          <h2 className="form-section-title">سحب رصيد</h2>
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label className="form-label">المبلغ</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                min="0.01"
                step="0.01"
                max={user?.balance || 0}
                required
              />
              <span className="form-hint">المتاح: {user?.balance?.toFixed(2) || '0.00'}</span>
            </div>

            <div className="form-group">
              <label className="form-label">طريقة السحب</label>
              <div className="gateway-options">
                {gateways.map((gw) => (
                  <button
                    type="button"
                    key={gw.value}
                    className={`gateway-btn ${withdrawForm.gateway === gw.value ? 'gateway-btn-active' : ''}`}
                    onClick={() => setWithdrawForm({ ...withdrawForm, gateway: gw.value })}
                  >
                    <span>{gw.icon}</span>
                    <span>{gw.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn btn-danger btn-block" disabled={submitting}>
              {submitting ? 'جاري المعالجة...' : 'تأكيد السحب'}
            </button>
          </form>
        </div>
      )}

      {/* سجل المعاملات */}
      <div className="transactions-section">
        <h2
          className="section-header clickable-header"
          onClick={() => setActiveTab('history')}
        >
          سجل المعاملات
        </h2>

        {loading ? (
          <div className="inline-loader">
            <div className="spinner"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <p className="empty-state-text">لا توجد معاملات بعد</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((tx) => {
              const info = getTransactionInfo(tx.type);
              return (
                <div key={tx._id} className="transaction-item card">
                  <div className="tx-icon-wrapper">
                    <span className={`tx-icon ${info.color}`}>{info.icon}</span>
                  </div>
                  <div className="tx-details">
                    <span className="tx-label">{info.label}</span>
                    <span className="tx-date">{formatDate(tx.createdAt)}</span>
                    {tx.gateway && (
                      <span className="tx-gateway">{tx.gateway.toUpperCase()}</span>
                    )}
                  </div>
                  <div className={`tx-amount ${info.color}`}>
                    {info.sign}{tx.amount?.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletPage;
