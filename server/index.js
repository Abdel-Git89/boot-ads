const { app, connectDB } = require('./app');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('تم الاتصال بقاعدة البيانات MongoDB بنجاح');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات MongoDB:', error.message);
    process.exit(1);
  });
