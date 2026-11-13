# 🚀 Boot-Ads — Telegram Mini App (Ad-Marketplace)

تطبيق تيليجرام مصغّر متكامل لإدارة الإعلانات والمهام. يتيح للمستخدمين كسب النقاط بإكمال المهام الإعلانية، وللمعلنين نشر إعلاناتهم واستهداف الجمهور.

## 📁 هيكل المشروع

```
Boot-Ads/
├── server/                    # الخادم الخلفي (Backend)
│   ├── index.js               # نقطة الدخول
│   ├── package.json
│   ├── .env.example           # متغيرات البيئة
│   ├── middleware/
│   │   └── auth.js            # وسيط مصادقة تيليجرام
│   ├── models/
│   │   ├── User.js            # نموذج المستخدم
│   │   ├── Ad.js              # نموذج الإعلان
│   │   ├── Completion.js      # نموذج إكمال المهام
│   │   └── Transaction.js     # نموذج المعاملات المالية
│   └── routes/
│       ├── ads.js             # مسارات الإعلانات
│       ├── wallet.js          # مسارات المحفظة
│       └── users.js           # مسارات المستخدمين
│
└── client/                    # الواجهة الأمامية (Frontend)
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx           # نقطة الدخول
        ├── App.jsx            # المكوّن الرئيسي
        ├── App.css            # الأنماط العامة
        ├── components/
        │   ├── Navigation.jsx # شريط التنقل السفلي
        │   └── Navigation.css
        └── pages/
            ├── TasksPage.jsx  # صفحة المهام
            ├── TasksPage.css
            ├── AdvertiserPage.jsx  # لوحة المعلن
            ├── AdvertiserPage.css
            ├── WalletPage.jsx # المحفظة
            └── WalletPage.css
```

## ⚡ التشغيل السريع

### 1. إعداد الخادم (Backend)
```bash
cd server
cp .env.example .env
# عدّل ملف .env بتوكن البوت ورابط MongoDB
npm install
npm run dev
```

### 2. إعداد الواجهة (Frontend)
```bash
cd client
npm install
npm run dev
```

### 3. متغيرات البيئة (server/.env)
```
BOT_TOKEN=your_telegram_bot_token
MONGODB_URI=mongodb://localhost:27017/boot-ads
PORT=5000
```

## 🔐 نظام المصادقة
يتم التحقق من هوية المستخدم عبر **Telegram initData** باستخدام HMAC-SHA256، مما يضمن أن كل طلب يأتي فعلاً من تطبيق تيليجرام.

## 📡 API Endpoints

| Method | Endpoint              | الوصف                          |
|--------|-----------------------|-------------------------------|
| GET    | /api/users/me         | جلب بيانات المستخدم            |
| PUT    | /api/users/me         | ترقية الدور إلى معلن           |
| GET    | /api/ads              | جلب الإعلانات النشطة           |
| POST   | /api/ads              | إنشاء إعلان جديد (معلنين فقط) |
| POST   | /api/ads/:id/complete | إتمام مهمة إعلان              |
| GET    | /api/wallet           | جلب الرصيد وسجل المعاملات      |
| POST   | /api/wallet/deposit   | طلب إيداع                     |
| POST   | /api/wallet/withdraw  | طلب سحب                       |

## 🛡️ الأمان
- التحقق من initData في كل طلب API
- فهرس فريد على Completion لمنع التكرار
- عمليات ذرية (MongoDB Sessions) لضمان سلامة البيانات المالية
- التحقق من الصلاحيات (دور المستخدم) قبل إنشاء الإعلانات

