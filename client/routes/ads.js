const express = require('express');
const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const Completion = require('../models/Completion');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

/**
 * GET /api/ads
 * جلب الإعلانات النشطة المتاحة للمستخدمين
 * يتم أيضاً تحديد الإعلانات التي أكملها المستخدم الحالي
 */
router.get('/', async (req, res) => {
  try {
    // جلب الإعلانات النشطة التي لديها ميزانية متبقية
    const ads = await Ad.find({
      status: 'active',
      remainingBudget: { $gt: 0 },
    }).populate('advertiserId', 'username');

    // جلب الإعلانات التي أكملها المستخدم الحالي
    const completedAds = await Completion.find({ userId: req.user._id }).select('adId');
    const completedAdIds = completedAds.map((c) => c.adId.toString());

    // إضافة حقل isCompleted وعرض المكافأة الصافية بعد عمولة المنصة (20%)
    const adsWithStatus = ads.map((ad) => {
      const netReward = Number((ad.rewardPerUser * 0.80).toFixed(2));
      return {
        ...ad.toObject(),
        rewardPerUser: netReward > 0 ? netReward : ad.rewardPerUser,
        originalReward: ad.rewardPerUser,
        isCompleted: completedAdIds.includes(ad._id.toString()),
      };
    });

    res.json(adsWithStatus);
  } catch (error) {
    console.error('خطأ في جلب الإعلانات:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء جلب الإعلانات' });
  }
});

/**
 * POST /api/ads
 * إنشاء إعلان جديد (للمعلنين والمسؤولين فقط)
 * يتم خصم الميزانية من رصيد المعلن
 */
router.post('/', async (req, res) => {
  try {
    // التحقق من أن المستخدم معلن أو مسؤول
    if (req.user.role !== 'advertiser' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'يجب أن تكون معلناً لإنشاء إعلان' });
    }

    const { title, description, targetUrl, type, rewardPerUser, budget, surveyData } = req.body;

    // التحقق من وجود جميع الحقول المطلوبة
    if (!title || !description || !type || !rewardPerUser || !budget) {
      return res.status(400).json({ error: 'الحقول الأساسية مطلوبة' });
    }

    // التحقق من صحة نوع الإعلان
    if (!['channel_sub', 'link_click', 'view', 'survey', 'bot_start'].includes(type)) {
      return res.status(400).json({ error: 'نوع الإعلان غير صالح' });
    }

    // التحقق من الرابط المستهدف (إذا لم يكن استطلاع رأي)
    if (type !== 'survey' && !targetUrl) {
      return res.status(400).json({ error: 'الرابط المستهدف مطلوب' });
    }

    // التحقق من بيانات الاستطلاع
    if (type === 'survey') {
      if (!surveyData?.question?.trim() || !Array.isArray(surveyData?.options) || surveyData.options.filter(o => o.trim()).length < 2) {
        return res.status(400).json({ error: 'يتطلب الاستطلاع سؤالاً وخيارين على الأقل' });
      }
    }

    // التحقق من أن القيم المالية موجبة
    if (rewardPerUser <= 0 || budget <= 0) {
      return res.status(400).json({ error: 'يجب أن تكون المكافأة والميزانية أكبر من صفر' });
    }

    // التحقق من أن المعلن لديه رصيد كافٍ
    if (req.user.balance < budget) {
      return res.status(400).json({ error: 'رصيدك غير كافٍ لإنشاء هذا الإعلان' });
    }

    // خصم الميزانية من رصيد المعلن
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -budget },
    });

    // إنشاء الإعلان
    const ad = await Ad.create({
      advertiserId: req.user._id,
      title,
      description,
      targetUrl: targetUrl || '',
      type,
      rewardPerUser,
      budget,
      remainingBudget: budget,
      surveyData: type === 'survey' ? {
        question: surveyData.question.trim(),
        options: surveyData.options.filter(o => o.trim()),
      } : undefined,
    });

    // تسجيل معاملة الإنفاق الإعلاني
    await Transaction.create({
      userId: req.user._id,
      amount: budget,
      type: 'ad_spend',
      status: 'completed',
    });

    res.status(201).json(ad);
  } catch (error) {
    console.error('خطأ في إنشاء الإعلان:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء إنشاء الإعلان' });
  }
});

/**
 * POST /api/ads/packages
 * شراء باقة نمو جاهزة بنقرة واحدة (Packs de croissance clé en main)
 */
router.post('/packages', async (req, res) => {
  try {
    const { packageId, channelUrl, customTitle } = req.body;

    if (!channelUrl || !channelUrl.trim()) {
      return res.status(400).json({ error: 'يرجى إدخال رابط القناة أو المجموعة' });
    }

    const PACKAGES = {
      starter: {
        title: customTitle || '🚀 باقة البداية (+100 عضو)',
        description: 'انضم إلى هذه القناة المميزة لمتابعة أحدث المحتويات!',
        type: 'channel_sub',
        rewardPerUser: 0.08,
        budget: 10.0,
      },
      pro: {
        title: customTitle || '🔥 باقة النمو السريع (+500 عضو)',
        description: 'اشترك في هذه القناة الرائدة واحصل على مزايا حصرية!',
        type: 'channel_sub',
        rewardPerUser: 0.06,
        budget: 40.0,
      },
      viral: {
        title: customTitle || '👑 باقة الانفجار الفيروسي (+1500 عضو)',
        description: 'القناة الرسمية الموصى بها من منصة Boot-Ads!',
        type: 'channel_sub',
        rewardPerUser: 0.05,
        budget: 100.0,
      },
    };

    const selectedPack = PACKAGES[packageId];
    if (!selectedPack) {
      return res.status(400).json({ error: 'الباقة المحددة غير صالحة' });
    }

    if (req.user.balance < selectedPack.budget) {
      return res.status(400).json({
        error: `رصيدك غير كافٍ. تحتاج إلى ${selectedPack.budget} نقطة لشراء هذه الباقة. يرجى الشحن أولاً.`,
      });
    }

    // خصم الميزانية
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { balance: -selectedPack.budget },
      $set: { role: 'advertiser' },
    });

    // إنشاء الحملة فوراً
    const ad = await Ad.create({
      advertiserId: req.user._id,
      title: selectedPack.title,
      description: selectedPack.description,
      targetUrl: channelUrl.trim(),
      type: selectedPack.type,
      rewardPerUser: selectedPack.rewardPerUser,
      budget: selectedPack.budget,
      remainingBudget: selectedPack.budget,
      status: 'active',
    });

    await Transaction.create({
      userId: req.user._id,
      amount: selectedPack.budget,
      type: 'ad_spend',
      status: 'completed',
    });

    res.status(201).json({
      message: '🎉 تم تفعيل باقة النمو ونشر حملتك بنجاح!',
      ad,
    });
  } catch (error) {
    console.error('خطأ في شراء الباقة:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء شراء الباقة' });
  }
});

/**
 * POST /api/ads/:id/complete
 * إكمال مهمة إعلان (كسب مكافأة)
 * يستخدم عمليات ذرية لضمان سلامة البيانات
 */
router.post('/:id/complete', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const adId = req.params.id;

    // التحقق من صحة معرّف الإعلان
    if (!mongoose.Types.ObjectId.isValid(adId)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'معرّف الإعلان غير صالح' });
    }

    // جلب الإعلان والتحقق من حالته
    const ad = await Ad.findById(adId).session(session);
    if (!ad) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }

    if (ad.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'الإعلان غير نشط' });
    }

    if (ad.remainingBudget < ad.rewardPerUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'الميزانية المتبقية غير كافية' });
    }

    // التحقق من أن المستخدم لم يكمل هذا الإعلان من قبل
    const existingCompletion = await Completion.findOne({
      userId: req.user._id,
      adId,
    }).session(session);

    if (existingCompletion) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'لقد أكملت هذا الإعلان مسبقاً' });
    }

    const { surveyAnswer } = req.body;

    // التحقق من الإجابة في حال كان نوع الإعلان استطلاع رأي
    if (ad.type === 'survey' && !surveyAnswer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: 'يرجى اختيار إجابة من الاستطلاع لإكمال المهمة' });
    }

    // إنشاء سجل الإكمال
    await Completion.create(
      [
        {
          userId: req.user._id,
          adId,
          earnedAmount: ad.rewardPerUser,
          surveyAnswer: surveyAnswer || null,
        },
      ],
      { session }
    );

    // حساب مكافأة المستخدم بعد عمولة المنصة 20%
    const PLATFORM_FEE_RATE = 0.20;
    const REFERRAL_FEE_RATE = 0.05;
    const netReward = Number((ad.rewardPerUser * (1 - PLATFORM_FEE_RATE)).toFixed(2));
    let finalReward = netReward > 0 ? netReward : ad.rewardPerUser;

    // ميزة VIP: مضاعفة الأرباح بنسبة +25% إضافية للأعضاء المميزين!
    if (req.user.isVip) {
      finalReward = Number((finalReward * 1.25).toFixed(2));
    }

    // زيادة رصيد المستخدم بمقدار المكافأة الصافية
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { balance: finalReward } },
      { session }
    );

    // إذا كان المستخدم مُحالاً، منح عمولة سلبية للمُحيل (5%)
    if (req.user.referredBy) {
      const refBonus = Number((ad.rewardPerUser * REFERRAL_FEE_RATE).toFixed(2));
      if (refBonus > 0) {
        await User.findByIdAndUpdate(
          req.user.referredBy,
          {
            $inc: {
              balance: refBonus,
              referralEarnings: refBonus,
            },
          },
          { session }
        );
        await Transaction.create(
          [
            {
              userId: req.user.referredBy,
              amount: refBonus,
              type: 'reward',
              status: 'completed',
            },
          ],
          { session }
        );
      }
    }

    // خصم التكلفة الكاملة من الميزانية المتبقية للإعلان
    const newRemainingBudget = ad.remainingBudget - ad.rewardPerUser;
    const updateFields = {
      $inc: { remainingBudget: -ad.rewardPerUser },
    };

    // إذا نفدت الميزانية، تحويل حالة الإعلان إلى "مكتمل"
    if (newRemainingBudget <= 0) {
      updateFields.$set = { status: 'completed' };
    }

    await Ad.findByIdAndUpdate(adId, updateFields, { session });

    // تسجيل معاملة المكافأة للمستخدم
    await Transaction.create(
      [
        {
          userId: req.user._id,
          amount: finalReward,
          type: 'reward',
          status: 'completed',
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'تم إكمال المهمة بنجاح',
      reward: finalReward,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('خطأ في إكمال المهمة:', error.message);
    res.status(500).json({ error: 'خطأ في الخادم أثناء إكمال المهمة' });
  }
});

module.exports = router;
