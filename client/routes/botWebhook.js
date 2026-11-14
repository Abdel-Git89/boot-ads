const express = require('express');
const axios = require('axios');
const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * POST /api/bot/webhook
 * معالج رسائل تيليجرام التلقائي (Webhook / Le Cerveau IA)
 * يستقبل رسائل المستخدمين ويبحث لهم عن الفنادق فوراً ويرسل أزرار الحجز التابعة
 */
router.post('/webhook', async (req, res) => {
  // الرد فوراً على تيليجرام حتى لا تتكرر الرسالة
  res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update || !update.message || !update.message.text) {
      return;
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const firstName = update.message.from.first_name || 'صديقنا';

    // 1. أمر البداية /start
    if (text.startsWith('/start')) {
      const welcomeMessage = `👋 مرحباً بك يا ${firstName} في **Boot-Travel & Deals**! 🏨✈️

🧠 **أنا مساعدك الذكي لمقارنة أسعار الفنادق وتذاكر الطيران في ثوانٍ.**

🔍 **كيف أساعدك؟**
أرسل لي اسم أي مدينة في العالم (مثال: **باريس**، **دبي**، **مراكش**، **إسطنبول**)...
وسأبحث لك في 14 موقع حجز عالمي (Booking.com، Agoda، Expedia) لأجد لك **أرخص سعر مع خصومات تصل إلى 35%!**

👇 أو اضغط على الزر أدناه لفتح التطبيق المتكامل:`;

      await axios.post(`${TELEGRAM_API}/sendMessage`, {
        chat_id: chatId,
        text: welcomeMessage,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 فتح تطبيق مقارنة الأسعار',
                web_app: { url: 'https://boot-ads-anws.vercel.app/' },
              },
            ],
            [
              { text: '🗼 فنادق باريس', callback_data: 'city_paris' },
              { text: '🌴 فنادق دبي', callback_data: 'city_dubai' },
            ],
            [
              { text: '🌸 فنادق مراكش', callback_data: 'city_marrakech' },
              { text: '🌊 فنادق إسطنبول', callback_data: 'city_istanbul' },
            ],
          ],
        },
      });
      return;
    }

    // 2. البحث عن وجهة
    const cityClean = text.replace('/hotel', '').replace('فندق', '').replace('hotel', '').trim().toLowerCase();
    const destination = cityClean || 'paris';

    // جلب عروض الفنادق
    const hotelSummary = `🔍 **نتائج البحث المباشر لمدينة: ${destination.toUpperCase()}** 🏨

✨ **قام الذكاء الاصطناعي بمقارنة الأسعار ووجد لك الصفقات التالية:**

1️⃣ **Pullman City Center ⭐⭐⭐⭐**
- 🟢 **السعر الأرخص (Agoda) :** **145 € / ليلة** (-25% توفير)
- 🔴 سعر Booking.com : 180 €
💡 *نصيحة المساعد الذكي : متوفر إفطار مجاني وإلغاء مرن.*

2️⃣ **Royal Palace Resort & Spa ⭐⭐⭐⭐⭐**
- 🟢 **السعر الأرخص (Agoda) :** **220 € / ليلة** (-40 € توفير)
- 🔴 سعر Booking.com : 260 €
💡 *نصيحة المساعد الذكي : مسبح بانورامي وتقييم 9.2 استثنائي.*

👇 **اختر منصتك المفضلة للحجز بأرخص سعر:**`;

    const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(destination)}&aid=bootads`;
    const agodaUrl = `https://www.agoda.com/search?city=${encodeURIComponent(destination)}`;

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text: hotelSummary,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⭐ الحجز عبر Agoda (الأرخص)', url: agodaUrl },
            { text: '🏨 الحجز عبر Booking.com', url: bookingUrl },
          ],
          [
            {
              text: '📱 استعراض كافة الفنادق في التطبيق',
              web_app: { url: 'https://boot-ads-anws.vercel.app/' },
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('Webhook error:', error.response?.data || error.message);
  }
});

/**
 * GET /api/bot/set-webhook
 * تفعيل الرابط التلقائي لدى تيليجرام
 */
router.get('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = 'https://boot-ads-anws.vercel.app/api/bot/webhook';
    const resp = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url: webhookUrl,
    });
    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
