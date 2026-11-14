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

    // الحد الأدنى للسحب
    const MIN_WITHDRAWAL = 2.0;
    if (amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ error: `الحد الأدنى للسحب هو ${MIN_WITHDRAWAL} نقطة` });
    }

    // التحقق من أن المستخدم لديه رصيد كافٍ
    if (req.user.balance < amount) {
      return res.status(400).json({ error: 'رصيدك غير كافٍ للسحب' });
    }

    // رسوم السحب: 0% مجاناً لأعضاء VIP المميزين، و5% للمستخدمين العاديين
    const fee = req.user.isVip ? 0 : Number((amount * 0.05).toFixed(2));
    const netWithdrawAmount = Number((amount - fee).toFixed(2));

    // خصم المبلغ الإجمالي من رصيد المستخدم فوراً
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -amount },
    });

    // إنشاء معاملة سحب بحالة "معلقة" مع توضيح الرسوم الصافية
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: netWithdrawAmount,
      type: 'withdrawal',
      gateway,
      status: 'pending',
    });

    res.status(201).json({
      ...transaction.toObject(),
      fee,
      totalDeducted: amount,
    });
  } catch (error) {
    console.error('خطأ في إنشاء السحب:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء إنشاء السحب' });
  }
});

/**
 * POST /api/wallet/stars-invoice
 * إنشاء رابط فاتورة نجوم تيليجرام (Telegram Stars)
 */
router.post('/stars-invoice', async (req, res) => {
  try {
    const { amount } = req.body;
    const stars = parseInt(amount, 10);
    if (!stars || stars <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال عدد صحيح من النجوم' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    if (!BOT_TOKEN) {
      return res.status(500).json({ error: 'توكن البوت غير مهيأ' });
    }

    // طلب إنشاء رابط الفاتورة من تيليجرام
    const axios = require('axios');
    const response = await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
      {
        title: 'شحن رصيد الإعلانات ⭐',
        description: `شحن ${stars} نقطة في منصة Boot-Ads عبر نجوم تيليجرام`,
        payload: `stars_dep_${req.user._id}_${stars}_${Date.now()}`,
        currency: 'XTR', // العملة الرسمية لنجوم تيليجرام
        prices: [{ label: `${stars} نجوم`, amount: stars }],
      }
    );

    if (response.data && response.data.ok) {
      res.json({ invoiceLink: response.data.result });
    } else {
      res.status(400).json({ error: 'فشل إنشاء فاتورة النجوم من تيليجرام' });
    }
  } catch (error) {
    console.error('Stars invoice error:', error.response?.data || error.message);
    res.status(500).json({ error: 'تعذر إنشاء فاتورة النجوم' });
  }
});

module.exports = router;
