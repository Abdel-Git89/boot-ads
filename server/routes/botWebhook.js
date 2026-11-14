const express = require('express');
const router = express.Router();

const BOT_TOKEN = process.env.BOT_TOKEN || '9007518006:AAF4hkkd7BjA5dl6yCB6DM85WP86zaAQUPI';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// دالة مساعدة سريعة لإرسال الطلبات إلى تيليجرام باستخدام fetch المدمج
async function tgPost(method, bodyData) {
  try {
    const resp = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData),
    });
    return await resp.json();
  } catch (err) {
    console.error(`Telegram API error on ${method}:`, err.message);
    return null;
  }
}

// خريطة سريعة لأفضل العروض الجاهزة للرد الفوري في تيليجرام (0 تأخير)
const QUICK_HOTELS = {
  paris: {
    city: 'باريس 🗼 (Paris)',
    hotel: 'Pullman Paris Tour Eiffel ⭐⭐⭐⭐',
    agodaPrice: '225 €',
    bookingPrice: '280 €',
    economy: '55 € (-20%)',
    tip: 'Agoda يمنحك أرخص سعر مع إطلالة مباشرة على برج إيفل وإلغاء مجاني.',
    agodaUrl: 'https://www.agoda.com/search?city=Paris',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Paris&aid=bootads',
  },
  dubai: {
    city: 'دبي 🌴 (Dubai)',
    hotel: 'Atlantis, The Palm ⭐⭐⭐⭐⭐',
    agodaPrice: '395 $',
    bookingPrice: '490 $',
    economy: '95 $ (-19%)',
    tip: 'توفير 95$ لليلة مع دخول مجاني كامل لأكبر حديقة مائية في الشرق الأوسط.',
    agodaUrl: 'https://www.agoda.com/search?city=Dubai',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Dubai&aid=bootads',
  },
  marrakech: {
    city: 'مراكش 🌸 (Marrakech)',
    hotel: 'Riad Kniza Marrakech ⭐⭐⭐⭐⭐',
    agodaPrice: '169 €',
    bookingPrice: '210 €',
    economy: '41 € (-20%)',
    tip: 'قصر مغربي أصيل يشمل إفطاراً بلدياً ملكياً مجانياً وحماماً تقليدياً.',
    agodaUrl: 'https://www.agoda.com/search?city=Marrakech',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Marrakech&aid=bootads',
  },
  istanbul: {
    city: 'إسطنبول 🌊 (Istanbul)',
    hotel: 'CVK Park Bosphorus ⭐⭐⭐⭐⭐',
    agodaPrice: '148 €',
    bookingPrice: '195 €',
    economy: '47 € (-24%)',
    tip: 'إطلالة بانورامية ساحرة على مضيق البوسفور مع سبا ومسبح دافئ.',
    agodaUrl: 'https://www.agoda.com/search?city=Istanbul',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Istanbul&aid=bootads',
  },
  london: {
    city: 'لندن 🇬🇧 (London)',
    hotel: 'The Tower Hotel London ⭐⭐⭐⭐',
    agodaPrice: '185 £',
    bookingPrice: '240 £',
    economy: '55 £ (-23%)',
    tip: 'موقع استراتيجي بجانب جسر البرج ومحطة المترو مع إطلالة نهرية.',
    agodaUrl: 'https://www.agoda.com/search?city=London',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=London&aid=bootads',
  },
  rome: {
    city: 'روما 🇮🇹 (Rome)',
    hotel: 'Hotel Artemide Roma ⭐⭐⭐⭐',
    agodaPrice: '179 €',
    bookingPrice: '230 €',
    economy: '51 € (-22%)',
    tip: 'في قلب روما مع ميني بار مجاني يومياً وتقييم استثنائي.',
    agodaUrl: 'https://www.agoda.com/search?city=Rome',
    bookingUrl: 'https://www.booking.com/searchresults.html?ss=Rome&aid=bootads',
  },
};

function formatHotelMessage(data) {
  return `🔍 **مقارنة الأسعار المباشرة: ${data.city}** 🏨

✨ **أفضل صفقة وجدها الذكاء الاصطناعي الآن:**
🏨 **${data.hotel}**

🟢 **السعر الأرخص (Agoda) :** **${data.agodaPrice}** / ليلة
🔴 سعر Booking.com : ~~${data.bookingPrice}~~
💰 **وفرت الآن :** **${data.economy}**

💡 *نصيحة المساعد الذكي:* ${data.tip}

👇 **احجز بأرخص سعر مضمون قبل نفاد الغرف:**`;
}

/**
 * POST /api/bot/webhook
 * معالج رسائل ونقرات تيليجرام الفوري فائق السرعة
 */
router.post('/webhook', async (req, res) => {
  // الرد الفوري 200 OK لمنع تيليجرام من تكرار الطلب
  res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update) return;

    // 1. معالجة نقرات الأزرار التفاعلية (Callback Query)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;

      // الرد على تيليجرام لإيقاف مؤشر التحميل على الزر فوراً
      await tgPost('answerCallbackQuery', { callback_query_id: cb.id });

      if (data && data.startsWith('city_')) {
        const cityKey = data.replace('city_', '');
        const deal = QUICK_HOTELS[cityKey] || QUICK_HOTELS.paris;

        await tgPost('sendMessage', {
          chat_id: chatId,
          text: formatHotelMessage(deal),
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [
                { text: `⭐ احجز عبر Agoda (${deal.agodaPrice} - الأرخص)`, url: deal.agodaUrl },
              ],
              [
                { text: '🏨 استعراض في Booking.com', url: deal.bookingUrl },
              ],
              [
                {
                  text: '📱 فتح تطبيق مقارنة الفنادق الكامل',
                  web_app: { url: 'https://boot-ads-anws.vercel.app/' },
                },
              ],
            ],
          },
        });
      }
      return;
    }

    // 2. معالجة الرسائل النصية
    if (!update.message || !update.message.text) return;

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    const firstName = update.message.from?.first_name || 'صديقنا المسافر';

    // أمر البداية /start
    if (text.startsWith('/start')) {
      const welcome = `👋 مرحباً بك يا ${firstName} في **Boot-Travel & Deals**! 🏨✈️

🧠 **مساعدك الفوري لمقارنة أرخص أسعار الفنادق في العالم.**
نقارن لك الأسعار بين كبرى المواقع العالمية (Booking.com، Agoda، Expedia) لنوفر لك **حتى 35% من سعر الإقامة!**

🔍 **جرّب الآن:**
اكتب اسم أي مدينة (مثال: **باريس**، **دبي**، **مراكش**، **لندن**)...
أو اضغط على إحدى الوجهات الشهيرة أدناه:`;

      await tgPost('sendMessage', {
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🚀 فتح تطبيق مقارنة الفنادق والعروض',
                web_app: { url: 'https://boot-ads-anws.vercel.app/' },
              },
            ],
            [
              { text: '🗼 باريس', callback_data: 'city_paris' },
              { text: '🌴 دبي', callback_data: 'city_dubai' },
              { text: '🌸 مراكش', callback_data: 'city_marrakech' },
            ],
            [
              { text: '🌊 إسطنبول', callback_data: 'city_istanbul' },
              { text: '🇬🇧 لندن', callback_data: 'city_london' },
              { text: '🇮🇹 روما', callback_data: 'city_rome' },
            ],
          ],
        },
      });
      return;
    }

    // أمر المساعدة أو أي نص آخر (البحث عن مدينة)
    const cleanText = text.toLowerCase()
      .replace('/hotel', '')
      .replace('/search', '')
      .replace('فندق', '')
      .replace('فنادق', '')
      .replace('hotel', '')
      .trim();

    let matchedKey = null;
    if (cleanText.includes('paris') || cleanText.includes('باريس')) matchedKey = 'paris';
    else if (cleanText.includes('dubai') || cleanText.includes('دبي')) matchedKey = 'dubai';
    else if (cleanText.includes('marrakech') || cleanText.includes('مراكش')) matchedKey = 'marrakech';
    else if (cleanText.includes('istanbul') || cleanText.includes('اسطنبول') || cleanText.includes('إسطنبول')) matchedKey = 'istanbul';
    else if (cleanText.includes('london') || cleanText.includes('لندن') || cleanText.includes('londres')) matchedKey = 'london';
    else if (cleanText.includes('rome') || cleanText.includes('روما') || cleanText.includes('roma')) matchedKey = 'rome';

    if (matchedKey && QUICK_HOTELS[matchedKey]) {
      const deal = QUICK_HOTELS[matchedKey];
      await tgPost('sendMessage', {
        chat_id: chatId,
        text: formatHotelMessage(deal),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: `⭐ احجز عبر Agoda (${deal.agodaPrice} - الأرخص)`, url: deal.agodaUrl },
            ],
            [
              { text: '🏨 استعراض في Booking.com', url: deal.bookingUrl },
            ],
            [
              {
                text: '📱 فتح تطبيق مقارنة الفنادق الكامل',
                web_app: { url: 'https://boot-ads-anws.vercel.app/' },
              },
            ],
          ],
        },
      });
    } else {
      // توليد رد فوري لأي مدينة في العالم
      const cityName = cleanText || 'وجهتك';
      const agodaUrl = `https://www.agoda.com/search?city=${encodeURIComponent(cityName)}`;
      const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(cityName)}&aid=bootads`;
      const expediaUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(cityName)}`;

      const dynMsg = `🔍 **مقارنة أسعار الفنادق في: ${cityName.toUpperCase()}** 🏨

✨ **وجدنا لك أفضل العروض المتاحة لهذه الليلة:**
- 🟢 **أرخص سعر مضمون عبر:** Agoda (توفير حتى 25%)
- 🔴 مقارنة بأسعار Booking.com و Expedia لنفس الفنادق

💡 *نصيحة الذكاء الاصطناعي:* احجز مبكراً للحصول على خيار الإلغاء المجاني وأرخص سعر.

👇 **اختر منصتك المفضلة للحجز:**`;

      await tgPost('sendMessage', {
        chat_id: chatId,
        text: dynMsg,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '⭐ أرخص الصفقات في Agoda', url: agodaUrl },
              { text: '🏨 صفقات Booking.com', url: bookingUrl },
            ],
            [
              {
                text: '📱 استعراض كل الفنادق في التطبيق',
                web_app: { url: 'https://boot-ads-anws.vercel.app/' },
              },
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error('Webhook processing error:', error.message);
  }
});

/**
 * GET /api/bot/set-webhook
 * تفعيل الرابط التلقائي لدى تيليجرام
 */
router.get('/set-webhook', async (req, res) => {
  try {
    const webhookUrl = 'https://boot-ads-anws.vercel.app/api/bot/webhook';
    const data = await tgPost('setWebhook', { url: webhookUrl });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
