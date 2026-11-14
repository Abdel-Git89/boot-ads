const mongoose = require('mongoose');

// نموذج المستخدم - يخزن بيانات مستخدمي تيليجرام
const userSchema = new mongoose.Schema(
  {
    // معرّف تيليجرام الفريد للمستخدم
    telegramId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // اسم المستخدم في تيليجرام
    username: {
      type: String,
    },
    // الاسم الأول
    firstName: {
      type: String,
    },
    // رصيد المستخدم
    balance: {
      type: Number,
      default: 0,
    },
    // دور المستخدم: مستخدم عادي، معلن، أو مسؤول
    role: {
      type: String,
      enum: ['user', 'advertiser', 'admin'],
      default: 'user',
    },
    // نظام الإحالة / Parrainage
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    // عدد الأصدقاء المُحالين
    referralCount: {
      type: Number,
      default: 0,
    },
    // إجمالي أرباح الإحالة
    referralEarnings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
