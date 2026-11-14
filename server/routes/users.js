const express = require('express');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/users/me
 * جلب بيانات المستخدم الحالي
 */
router.get('/me', async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء جلب بيانات المستخدم' });
  }
});

/**
 * PUT /api/users/me
 * تحديث دور المستخدم (ترقية إلى معلن)
 */
router.put('/me', async (req, res) => {
  try {
    const { role } = req.body;

    // السماح فقط بالترقية إلى دور "معلن"
    if (role !== 'advertiser') {
      return res.status(400).json({ error: 'يمكنك فقط الترقية إلى دور معلن' });
    }

    // لا يمكن تخفيض دور المسؤول
    if (req.user.role === 'admin') {
      return res.status(400).json({ error: 'لا يمكن تغيير دور المسؤول' });
    }

    // تحديث دور المستخدم
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { role: 'advertiser' },
      { new: true }
    );

    res.json(updatedUser);
  } catch (error) {
    console.error('خطأ في تحديث بيانات المستخدم:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء تحديث بيانات المستخدم' });
  }
});

/**
 * POST /api/users/upgrade-vip
 * تفعيل عضوية VIP الشهرية أو الدائمة
 */
router.post('/upgrade-vip', async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' | 'lifetime'
    const VIP_PRICES = {
      monthly: 5.0,
      lifetime: 20.0,
    };

    const cost = VIP_PRICES[plan] || VIP_PRICES.monthly;

    if (req.user.balance < cost) {
      return res.status(400).json({
        error: `رصيدك غير كافٍ. تحتاج إلى ${cost} نقطة لتفعيل اشتراك VIP`,
      });
    }

    const expiresAt = new Date();
    if (plan === 'lifetime') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // خصم التكلفة وتفعيل العضوية
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $inc: { balance: -cost },
        $set: {
          isVip: true,
          vipPlan: plan || 'monthly',
          vipExpiresAt: expiresAt,
        },
      },
      { new: true }
    );

    // تسجيل المعاملة
    try {
      const Transaction = require('../models/Transaction');
      await Transaction.create({
        userId: req.user._id,
        amount: cost,
        type: 'ad_spend',
        status: 'completed',
      });
    } catch (txErr) {}

    res.json({
      message: '🎉 تهانينا! تم تفعيل اشتراك VIP بنجاح!',
      user: updatedUser,
    });
  } catch (error) {
    console.error('خطأ في تفعيل VIP:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء تفعيل VIP' });
  }
});

module.exports = router;
