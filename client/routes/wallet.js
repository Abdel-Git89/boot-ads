const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * GET /api/wallet
 * جلب رصيد المستخدم وسجل المعاملات
 */
router.get('/', async (req, res) => {
  try {
    // جلب أحدث 50 معاملة مرتبة من الأحدث للأقدم
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      balance: req.user.balance,
      transactions,
    });
  } catch (error) {
    console.error('خطأ في جلب بيانات المحفظة:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء جلب بيانات المحفظة' });
  }
});

/**
 * POST /api/wallet/deposit
 * إنشاء معاملة إيداع معلقة
 */
router.post('/deposit', async (req, res) => {
  try {
    const { amount, gateway } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!amount || !gateway) {
      return res.status(400).json({ error: 'المبلغ وبوابة الدفع مطلوبان' });
    }

    // التحقق من أن المبلغ موجب
    if (amount <= 0) {
      return res.status(400).json({ error: 'يجب أن يكون المبلغ أكبر من صفر' });
    }

    // التحقق من صحة بوابة الدفع
    if (!['paypal', 'ton', 'usdt', 'stars'].includes(gateway)) {
      return res.status(400).json({ error: 'بوابة الدفع غير صالحة' });
    }

    // إنشاء معاملة إيداع بحالة "معلقة"
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      type: 'deposit',
      gateway,
      status: 'pending',
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('خطأ في إنشاء الإيداع:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء إنشاء الإيداع' });
  }
});

/**
 * POST /api/wallet/withdraw
 * إنشاء معاملة سحب - يتم خصم الرصيد فوراً
 */
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, gateway } = req.body;

    // التحقق من وجود الحقول المطلوبة
    if (!amount || !gateway) {
      return res.status(400).json({ error: 'المبلغ وبوابة الدفع مطلوبان' });
    }

    // التحقق من أن المبلغ موجب
    if (amount <= 0) {
      return res.status(400).json({ error: 'يجب أن يكون المبلغ أكبر من صفر' });
    }

    // التحقق من صحة بوابة الدفع
    if (!['paypal', 'ton', 'usdt', 'stars'].includes(gateway)) {
      return res.status(400).json({ error: 'بوابة الدفع غير صالحة' });
    }

    // التحقق من أن المستخدم لديه رصيد كافٍ
    if (req.user.balance < amount) {
      return res.status(400).json({ error: 'رصيدك غير كافٍ للسحب' });
    }

    // خصم المبلغ من رصيد المستخدم فوراً
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -amount },
    });

    // إنشاء معاملة سحب بحالة "معلقة"
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      type: 'withdrawal',
      gateway,
      status: 'pending',
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('خطأ في إنشاء السحب:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء إنشاء السحب' });
  }
});

module.exports = router;
