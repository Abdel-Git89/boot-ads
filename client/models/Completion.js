const mongoose = require('mongoose');

// نموذج الإكمال - يسجل إكمال المستخدمين لمهام الإعلانات
const completionSchema = new mongoose.Schema({
  // معرّف المستخدم الذي أكمل المهمة
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // معرّف الإعلان المكتمل
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true,
  },
  // المبلغ المكتسب من إكمال المهمة
  earnedAmount: {
    type: Number,
    required: true,
  },
  // تاريخ الإكمال
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

// فهرس مركب فريد لمنع إكمال نفس الإعلان مرتين من قبل نفس المستخدم
completionSchema.index({ userId: 1, adId: 1 }, { unique: true });

module.exports = mongoose.model('Completion', completionSchema);
