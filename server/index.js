require('dotenv').config();
const dns = require('dns');
// حل مشكلة SRV lookup في Node.js على Windows مع MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authMiddleware = require('./middleware/auth');
const adsRoutes = require('./routes/ads');
const walletRoutes = require('./routes/wallet');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

// إعداد الوسائط الأساسية
app.use(cors({ origin: '*' }));
app.use(express.json());

// تطبيق وسيط المصادقة على جميع مسارات API
app.use('/api', authMiddleware);

// تسجيل المسارات
app.use('/api/ads', adsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/users', usersRoutes);

// الاتصال بقاعدة البيانات وتشغيل الخادم
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boot-ads';

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات MongoDB بنجاح');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات MongoDB:', error.message);
    console.error('\n💡 نصيحة:');
    console.error('1. تأكد من تشغيل خادم MongoDB محلياً (mongodb://localhost:27017)');
    console.error('2. أو استخدم قاعدة بيانات سحابية مجانية MongoDB Atlas وضع الرابط في ملف server/.env:');
    console.error('   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/boot-ads\n');
    process.exit(1);
  });
