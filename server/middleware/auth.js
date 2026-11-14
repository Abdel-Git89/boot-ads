const crypto = require('crypto');
const User = require('../models/User');

/**
 * وسيط التحقق من هوية مستخدم تيليجرام
 * يتحقق من صحة بيانات initData المرسلة من Telegram Mini App
 * باستخدام خوارزمية HMAC-SHA256 الموصى بها من تيليجرام
 */
const authMiddleware = async (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
      // في وضع التطوير: إنشاء أو جلب مستخدم تجريبي لتسهيل التجربة في المتصفح
      if (process.env.DEV_MODE === 'true' || process.env.NODE_ENV !== 'production') {
        let demoUser = await User.findOne({ telegramId: 'demo_user_123' });
        if (!demoUser) {
          demoUser = await User.create({
            telegramId: 'demo_user_123',
            username: 'demo_advertiser',
            firstName: 'المستخدم التجريبي (Demo)',
            balance: 100,
            role: 'advertiser',
          });
        }
        req.user = demoUser;
        return next();
      }
      return res.status(401).json({ error: 'بيانات المصادقة غير موجودة' });
    }

    // تحليل بيانات initData كـ URLSearchParams
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      return res.status(401).json({ error: 'الهاش غير موجود في بيانات المصادقة' });
    }

    // حذف الهاش من المعاملات لبناء سلسلة التحقق
    params.delete('hash');

    // ترتيب المعاملات أبجدياً وبناء سلسلة التحقق
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // إنشاء المفتاح السري باستخدام توكن البوت
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.BOT_TOKEN)
      .digest();

    // حساب HMAC-SHA256 لسلسلة التحقق باستخدام المفتاح السري
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // مقارنة الهاش المحسوب مع الهاش المرسل
    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'بيانات المصادقة غير صالحة' });
    }

    // استخراج بيانات المستخدم من initData
    const userParam = params.get('user');
    if (!userParam) {
      return res.status(401).json({ error: 'بيانات المستخدم غير موجودة' });
    }

    const telegramUser = JSON.parse(decodeURIComponent(userParam));

    // البحث عن المستخدم أو إنشاؤه مع دعم نظام الإحالة (Referral)
    let user = await User.findOne({ telegramId: String(telegramUser.id) });

    if (!user) {
      let referredBy = null;
      const startParam = params.get('start_param');
      if (startParam && startParam.startsWith('ref_')) {
        const refTelegramId = startParam.replace('ref_', '').trim();
        if (refTelegramId && refTelegramId !== String(telegramUser.id)) {
          const referrer = await User.findOne({ telegramId: refTelegramId });
          if (referrer) {
            referredBy = referrer._id;
            // مكافأة الإحالة الترحيبية
            const REFERRAL_SIGNUP_BONUS = 1.0;
            referrer.balance += REFERRAL_SIGNUP_BONUS;
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            referrer.referralEarnings = (referrer.referralEarnings || 0) + REFERRAL_SIGNUP_BONUS;
            await referrer.save();

            // تسجيل المعاملة
            try {
              const Transaction = require('../models/Transaction');
              await Transaction.create({
                userId: referrer._id,
                amount: REFERRAL_SIGNUP_BONUS,
                type: 'reward',
                status: 'completed',
              });
            } catch (txErr) {}
          }
        }
      }

      user = await User.create({
        telegramId: String(telegramUser.id),
        username: telegramUser.username || '',
        firstName: telegramUser.first_name || '',
        balance: 0,
        role: 'user',
        referredBy,
      });
    } else {
      user.username = telegramUser.username || user.username;
      user.firstName = telegramUser.first_name || user.firstName;
      await user.save();
    }

    // إرفاق المستخدم بالطلب لاستخدامه في المسارات
    req.user = user;
    next();
  } catch (error) {
    console.error('خطأ في المصادقة:', error.message);
    return res.status(401).json({ error: 'فشل التحقق من الهوية' });
  }
};

module.exports = authMiddleware;
