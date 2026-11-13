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

// إعداد الوسائط الأساسية
app.use(cors({ origin: '*' }));
app.use(express.json());

// الاتصال بقاعدة البيانات مع التخزين المؤقت للبيئات الخادمة (Serverless)
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/boot-ads';
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
}

// التأكد من الاتصال بقاعدة البيانات قبل معالجة أي طلب
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err.message);
    res.status(500).json({ error: 'فشل الاتصال بقاعدة البيانات' });
  }
});

// تطبيق وسيط المصادقة على جميع مسارات API
app.use('/api', authMiddleware);

// تسجيل المسارات
app.use('/api/ads', adsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/users', usersRoutes);

module.exports = { app, connectDB };
