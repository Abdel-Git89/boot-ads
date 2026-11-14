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

module.exports = router;
