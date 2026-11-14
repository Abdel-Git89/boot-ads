const mongoose = require('mongoose');

// نموذج الإعلان - يخزن بيانات الإعلانات المنشورة من قبل المعلنين
const adSchema = new mongoose.Schema(
  {
    // معرّف المعلن (مرجع لنموذج المستخدم)
    advertiserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // عنوان الإعلان
    title: {
      type: String,
      required: true,
    },
    // وصف الإعلان
    description: {
      type: String,
      required: true,
    },
    // الرابط المستهدف (قناة أو موقع أو فارغ في حالة الاستطلاع)
    targetUrl: {
      type: String,
      default: '',
    },
    // نوع الإعلان: اشتراك بقناة، نقر على رابط، مشاهدة، استطلاع رأي، أو تجربة بوت
    type: {
      type: String,
      enum: ['channel_sub', 'link_click', 'view', 'survey', 'bot_start'],
      required: true,
    },
    // بيانات استطلاع الرأي (في حال كان نوع المهمة survey)
    surveyData: {
      question: { type: String, default: '' },
      options: [{ type: String }],
    },
    // المكافأة لكل مستخدم يكمل المهمة
    rewardPerUser: {
      type: Number,
      required: true,
    },
    // الميزانية الكاملة للإعلان
    budget: {
      type: Number,
      required: true,
    },
    // الميزانية المتبقية
    remainingBudget: {
      type: Number,
      required: true,
    },
    // حالة الإعلان: نشط، متوقف، أو مكتمل
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);
