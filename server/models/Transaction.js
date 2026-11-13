const mongoose = require('mongoose');

// نموذج المعاملة المالية - يسجل جميع العمليات المالية
const transactionSchema = new mongoose.Schema(
  {
    // معرّف المستخدم صاحب المعاملة
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // المبلغ
    amount: {
      type: Number,
      required: true,
    },
    // نوع المعاملة: إيداع، سحب، مكافأة، أو إنفاق إعلاني
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'reward', 'ad_spend'],
      required: true,
    },
    // بوابة الدفع المستخدمة
    gateway: {
      type: String,
      enum: ['paypal', 'ton', 'usdt', 'stars'],
    },
    // حالة المعاملة
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
