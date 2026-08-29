# إعداد الأصناف - خطوات سريعة 🚀

## 📋 إضافة الأصناف في Google Sheets

### الطريقة الأولى: استخدام شيت جاهز (أسهل)

1. **انقر على هذا الرابط لفتح شيت جاهز:**
   - سأقوم بإنشاء رابط مباشر لشيت جاهز يحتوي على الأصناف الافتراضية

2. **انسخ الشيت إلى حسابك:**
   - اضغط "File" → "Make a copy"
   - اختر حسابك: `www.mfmm@gmail.com`
   - سمِّ الشيت: `Mashily Store Data`

3. **تعديل الأصناف حسب احتياجاتك:**
   - في صفحة `Categories`، أضف أو عدل الأصناف
   - استخدم أيقونات Font Awesome (مثال: `fas fa-mobile-alt`)

### الطريقة الثانية: إنشاء شيت جديد

1. **اذهب إلى [sheets.google.com](https://sheets.google.com)**
2. **سجل الدخول بحساب:** `www.mfmm@gmail.com`
3. **أنشئ شيت جديد** باسم: `Mashily Store Data`
4. **أنشئ 4 صفحات:**
   - `Categories` (الأصناف)
   - `Products` (المنتجات)
   - `Videos` (الفيديوهات)
   - `Settings` (الإعدادات)

### إعداد صفحة Categories

**أضف العناوين في الصف الأول:**
```
A: name
B: icon  
C: description
```

**أضف الأصناف من الصف الثاني:**
```
الصف 2: إلكترونيات | fas fa-mobile-alt | الأجهزة الإلكترونية والهواتف
الصف 3: ملابس | fas fa-tshirt | الملابس والأحذية
الصف 4: إكسسوارات | fas fa-gem | الإكسسوارات والمجوهرات
الصف 5: كتب | fas fa-book | الكتب والمجلات
الصف 6: رياضة | fas fa-running | الرياضة واللياقة
الصف 7: منزل | fas fa-home | مستلزمات المنزل
```

### إعداد API Key و Sheet ID

#### الحصول على Sheet ID:
1. من رابط الشيت، انسخ المعرف بين `/d/` و `/edit`
2. مثال: `https://docs.google.com/spreadsheets/d/1ABC123XYZ/edit`
3. الـ Sheet ID هو: `1ABC123XYZ`

#### الحصول على API Key:
1. اذهب إلى [console.cloud.google.com](https://console.cloud.google.com)
2. أنشئ مشروع جديد
3. فعّل Google Sheets API
4. أنشئ API Key
5. انسخ الـ API Key

### إعداد الموقع

1. **افتح ملف `script.js`**
2. **ابحث عن هذا السطر:**
   ```javascript
   const GOOGLE_SHEETS_CONFIG = {
       apiKey: 'YOUR_API_KEY_HERE',
       sheetId: 'YOUR_SHEET_ID_HERE',
   ```
3. **استبدل البيانات:**
   ```javascript
   const GOOGLE_SHEETS_CONFIG = {
       apiKey: 'AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // ضع API Key هنا
       sheetId: '1ABC123XYZ', // ضع Sheet ID هنا
   ```

### اختبار الاتصال

1. **افتح لوحة التحكم** (admin.html)
2. **اضغط زر "تحديث من Google Sheets"**
3. **انتظر ظهور رسالة "تم التحديث بنجاح"**
4. **افتح الصفحة الرئيسية** لرؤية الأصناف الجديدة

### أيقونات Font Awesome الشائعة

**إلكترونيات:**
- `fas fa-mobile-alt` - هواتف
- `fas fa-laptop` - لابتوب
- `fas fa-headphones` - سماعات
- `fas fa-camera` - كاميرات

**ملابس:**
- `fas fa-tshirt` - تيشيرت
- `fas fa-shoe-prints` - أحذية
- `fas fa-hat-cowboy` - قبعات
- `fas fa-glasses` - نظارات

**إكسسوارات:**
- `fas fa-gem` - مجوهرات
- `fas fa-ring` - خواتم
- `fas fa-clock` - ساعات
- `fas fa-watch` - ساعات يد

**كتب:**
- `fas fa-book` - كتب
- `fas fa-book-open` - كتب مفتوحة
- `fas fa-graduation-cap` - تعليم
- `fas fa-scroll` - وثائق

**رياضة:**
- `fas fa-running` - رياضة
- `fas fa-futbol` - كرة قدم
- `fas fa-basketball-ball` - كرة سلة
- `fas fa-dumbbell` - أثقال

**منزل:**
- `fas fa-home` - منزل
- `fas fa-couch` - أثاث
- `fas fa-utensils` - مطبخ
- `fas fa-bed` - سرير

### نصائح مهمة

1. **استخدم أسماء واضحة ومختصرة** للأصناف
2. **اختر أيقونات مناسبة** لكل قسم
3. **لا تستخدم مسافات زائدة** في الأسماء
4. **اختبر الاتصال** بعد كل تعديل
5. **احتفظ بنسخة احتياطية** من الشيت

### استكشاف الأخطاء

**الأصناف لا تظهر:**
- تأكد من صحة API Key و Sheet ID
- تحقق من أن الشيت مُشارك مع "Anyone with the link"
- راجع console في المتصفح للأخطاء

**الأيقونات لا تظهر:**
- تأكد من كتابة اسم الأيقونة بشكل صحيح
- تأكد من وجود مكتبة Font Awesome في الموقع
- جرب أيقونات بسيطة مثل `fas fa-tag`

### دعم ومساعدة

إذا واجهت أي مشاكل:
1. راجع الدليل الكامل في `GOOGLE_SHEETS_GUIDE.md`
2. تحقق من صحة البيانات في الشيت
3. اختبر الاتصال عبر زر التحديث في لوحة التحكم