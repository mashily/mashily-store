# دليل إعداد Google Sheets للمتجر

## 📋 خطوات الإعداد الكاملة

### 1️⃣ إنشاء Google Sheet جديد

1. اذهب إلى [sheets.google.com](https://sheets.google.com)
2. سجل الدخول بحسابك: `www.mfmm@gmail.com`
3. أنشئ شيت جديد باسم: `Mashily Store Data`
4. أنشئ 4 صفحات (Tabs) داخل الشيت:
   - `Categories` (للأصناف)
   - `Products` (للمنتجات)
   - `Videos` (للفيديوهات)
   - `Settings` (للإعدادات العامة)

---

### 2️⃣ هيكل صفحة Categories

أضف العناوين التالية في الصف الأول (صف 1):

| A | B | C |
|---|---|---|
| name | icon | description |

**شرح الأعمدة:**
- **name**: اسم القسم
- **icon**: اسم أيقونة Font Awesome (مثال: fas fa-mobile-alt)
- **description**: وصف القسم (اختياري)

**مثال بيانات:**
```
name | icon | description
إلكترونيات | fas fa-mobile-alt | الأجهزة الإلكترونية والهواتف
ملابس | fas fa-tshirt | الملابس والأحذية
إكسسوارات | fas fa-gem | الإكسسوارات والمجوهرات
كتب | fas fa-book | الكتب والمجلات
رياضة | fas fa-running | الرياضة واللياقة
منزل | fas fa-home | مستلزمات المنزل
```

---

### 3️⃣ هيكل صفحة Products

أضف العناوين التالية في الصف الأول (صف 1):

| A | B | C | D | E | F | G | H | I | J | K | L | M |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | name | price | originalPrice | image | images | category | stock | status | desc | specs | offerEnds | rating |

**شرح الأعمدة:**
- **id**: رقم فريد لكل منتج (1, 2, 3...)
- **name**: اسم المنتج
- **price**: السعر الحالي
- **originalPrice**: السعر القديم (للخصم)
- **image**: رابط الصورة الرئيسية
- **images**: روابط الصور الإضافية (مفصولة بفاصلة)
- **category**: القسم (إلكترونيات، ملابس، إلخ)
- **stock**: الكمية في المخزون أو "out" للنفاد
- **status**: حالة المنتج (مميز ✨، عرض خاص، إلخ)
- **desc**: وصف المنتج
- **specs**: المواصفات (مفصولة بفاصلة)
- **offerEnds**: تاريخ انتهاء العرض (YYYY-MM-DD)
- **rating**: التقييم (1-5)

**مثال بيانات:**
```
id | name | price | originalPrice | image | images | category | stock | status | desc | specs | offerEnds | rating
1 | ساعة ذكية Pro | 1250 | 1800 | https://example.com/watch.jpg | https://example.com/watch2.jpg,https://example.com/watch3.jpg | إلكترونيات | 5 | مميز ✨ | ساعة ذكية مع شاشة AMOLED ومقاومة للماء | شاشة AMOLED,مقاومة للماء IP68,بطارية طويلة | 2024-12-31 | 4.8
```

---

### 3️⃣ هيكل صفحة Videos

أضف العناوين التالية في الصف الأول (صف 1):

| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| id | title | category | thumbnail | videoUrl | duration | description | price |

**شرح الأعمدة:**
- **id**: رقم فريد لكل فيديو
- **title**: عنوان الفيديو
- **category**: القسم (برمجة، تصميم، إلخ)
- **thumbnail**: رابط صورة الغلاف
- **videoUrl**: رابط الفيديو
- **duration**: مدة الفيديو (مثال: 30min)
- **description**: وصف الفيديو
- **price**: السعر (إن كان مدفوعاً)

**مثال بيانات:**
```
id | title | category | thumbnail | videoUrl | duration | description | price
1 | تعليم البرمجة من الصفر | برمجة | https://example.com/thumb.jpg | https://example.com/video.mp4 | 30min | دورة شاملة لتعليم البرمجة للمبتدئين | 100
```

---

### 4️⃣ هيكل صفحة Settings

أضف العناوين التالية في الصف الأول (صف 1):

| A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|
| key | value | description | type | category | updatedAt | notes |

**شرح الأعمدة:**
- **key**: مفتاح الإعداد
- **value**: القيمة
- **description**: وصف الإعداد
- **type**: نوع البيانات (text, number, boolean)
- **category**: القسم (general, payment, display)
- **updatedAt**: تاريخ آخر تحديث
- **notes**: ملاحظات

**مثال بيانات:**
```
key | value | description | type | category | updatedAt | notes
store_name | Mashily Store | اسم المتجر | text | general | 2024-01-01 | يظهر في الهيدر
whatsapp_number | 201551831308 | رقم الواتساب | text | payment | 2024-01-01 | لاستقبال الطلبات
vodafone_cash | 01551831308 | رقم فودافون كاش | text | payment | 2024-01-01 | للدفع الإلكتروني
instapay_username | Mashily@instapay | حساب إنستاباي | text | payment | 2024-01-01 | للدفع الإلكتروني
```

---

### 5️⃣ إعداد Google Sheets API

#### الخطوة 1: إنشاء مشروع في Google Cloud Console
1. اذهب إلى [console.cloud.google.com](https://console.cloud.google.com)
2. سجل الدخول بحسابك
3. أنشئ مشروع جديد باسم: `Mashily Store API`
4. انتظر حتى يتم إنشاء المشروع

#### الخطوة 2: تفعيل Google Sheets API
1. في المشروع، ابحث عن "Google Sheets API"
2. اضغط على "Enable" لتفعيله
3. انتظر حتى يتم التفعيل

#### الخطوة 3: إنشاء بيانات الاعتماد (Credentials)
1. اذهب إلى "Credentials" في القائمة الجانبية
2. اضغط "Create Credentials"
3. اختر "API Key"
4. انسخ الـ API Key الذي تم إنشاؤه

#### الخطوة 4: مشاركة الشيت
1. في Google Sheet، اضغط "Share"
2. أضف البريد الإلكتروني: `anyone` أو استخدم الرابط المباشر
3. اجعل الشيت "Anyone with the link can view"

---

### 6️⃣ الحصول على Sheet ID

1. في رابط الشيت، ستجد معرف الشيت بين `/d/` و `/edit`
2. مثال: `https://docs.google.com/spreadsheets/d/1ABC123XYZ/edit`
3. الـ Sheet ID هو: `1ABC123XYZ`

---

### 7️⃣ إعداد الموقع

#### أضف هذا الكود في ملف `script.js`:

```javascript
// إعدادات Google Sheets
const GOOGLE_SHEETS_CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE', // ضع API Key هنا
    sheetId: 'YOUR_SHEET_ID_HERE', // ضع Sheet ID هنا
    ranges: {
        products: 'Products!A2:M', // نطاق المنتجات
        videos: 'Videos!A2:H',     // نطاق الفيديوهات
        settings: 'Settings!A2:G' // نطاق الإعدادات
    }
};

// دالة قراءة البيانات من Google Sheets
async function fetchFromGoogleSheets() {
    try {
        // قراءة المنتجات
        const productsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.products}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const productsData = await productsResponse.json();
        
        // قراءة الفيديوهات
        const videosResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.videos}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const videosData = await videosResponse.json();
        
        // قراءة الإعدادات
        const settingsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.settings}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const settingsData = await settingsResponse.json();
        
        // تحويل البيانات إلى التنسيق المطلوب
        const products = convertSheetDataToProducts(productsData.values);
        const videos = convertSheetDataToVideos(videosData.values);
        const settings = convertSheetDataToSettings(settingsData.values);
        
        // حفظ البيانات في localStorage
        localStorage.setItem('storeProducts', JSON.stringify(products));
        localStorage.setItem('academyVideos', JSON.stringify(videos));
        localStorage.setItem('storeSettings', JSON.stringify(settings));
        
        // تحديث الواجهة
        if (typeof renderProducts === 'function') {
            products = products; // تحديث المتغير العام
            renderProducts(products);
        }
        
        return { products, videos, settings };
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        throw error;
    }
}

// تحويل بيانات الشيت إلى تنسيق المنتجات
function convertSheetDataToProducts(rows) {
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row, index) => ({
        id: parseInt(row[0]) || index + 1,
        name: row[1] || '',
        price: parseFloat(row[2]) || 0,
        originalPrice: parseFloat(row[3]) || null,
        image: row[4] || '',
        images: row[5] ? row[5].split(',').map(url => url.trim()) : [],
        category: row[6] || 'الكل',
        stock: row[7] === 'out' ? 'out' : (parseInt(row[7]) || 10),
        status: row[8] || 'مميز ✨',
        desc: row[9] || '',
        specs: row[10] ? row[10].split(',').map(spec => spec.trim()) : [],
        offerEnds: row[11] || null,
        rating: parseFloat(row[12]) || 4.8
    }));
}

// تحويل بيانات الشيت إلى تنسيق الفيديوهات
function convertSheetDataToVideos(rows) {
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row, index) => ({
        id: parseInt(row[0]) || index + 1,
        title: row[1] || '',
        category: row[2] || 'الكل',
        thumbnail: row[3] || '',
        videoUrl: row[4] || '',
        duration: row[5] || '',
        description: row[6] || '',
        price: parseFloat(row[7]) || 0
    }));
}

// تحويل بيانات الشيت إلى تنسيق الإعدادات
function convertSheetDataToSettings(rows) {
    if (!rows || rows.length === 0) return {};
    
    const settings = {};
    rows.forEach(row => {
        if (row[0]) { // إذا كان المفتاح موجوداً
            settings[row[0]] = {
                value: row[1],
                description: row[2],
                type: row[3],
                category: row[4],
                updatedAt: row[5],
                notes: row[6]
            };
        }
    });
    
    return settings;
}

// دالة التحديث التلقائي
function startAutoUpdate(intervalMinutes = 5) {
    // تحديث فوري عند التحميل
    fetchFromGoogleSheets();
    
    // تحديث دوري
    setInterval(() => {
        fetchFromGoogleSheets();
    }, intervalMinutes * 60 * 1000);
}
```

---

### 8️⃣ إضافة زر التحديث في لوحة التحكم

أضف هذا الكود في `admin.html` في قسم الإجراءات السريعة:

```html
<button class="btn btn-primary" onclick="syncWithGoogleSheets()" style="background: #4285f4; border: none; padding: 12px 20px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 8px; color: white;">
    <i class="fas fa-sync-alt"></i> تحديث من Google Sheets
</button>
```

وأضف هذه الدالة في JavaScript:

```javascript
async function syncWithGoogleSheets() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    
    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
        btn.disabled = true;
        
        await fetchFromGoogleSheets();
        
        // تحديث المنتجات في لوحة التحكم
        products = JSON.parse(localStorage.getItem('storeProducts')) || [];
        renderProductsTable();
        updateStats();
        
        btn.innerHTML = '<i class="fas fa-check"></i> تم التحديث بنجاح';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
        
    } catch (error) {
        btn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> فشل التحديث';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 2000);
        
        alert('فشل في الاتصال بـ Google Sheets. تأكد من صحة API Key و Sheet ID.');
    }
}
```

---

### 9️⃣ إعداد التحميل التلقائي

أضف هذا الكود في نهاية ملف `script.js`:

```javascript
// بدء التحديث التلقائي عند تحميل الصفحة
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // تأخير بسيط لضمان تحميل الملفات الأخرى
    setTimeout(() => {
        startAutoUpdate(5); // تحديث كل 5 دقائق
    }, 1000);
}
```

---

### 🔟 إعداد GitHub

#### رفع الملفات إلى GitHub:
1. أنشئ مستودع جديد في GitHub باسم: `mashily-store`
2. ارفع الملفات التالية:
   - `index.html`
   - `admin.html`
   - `script.js`
   - `style.css`
   - `db.json` (كبيانات احتياطية)

#### النشر باستخدام GitHub Pages:
1. في إعدادات المستودع، فعّل GitHub Pages
2. اختر الفرع (branch) الذي تريد نشره
3. بعد دقائق، سيكون موقعك متاحاً على: `https://username.github.io/mashily-store`

---

### 📝 نصائح مهمة:

1. **حماية API Key**: لا تشارك الـ API Key مع أي شخص
2. **النسخ الاحتياطي**: دائماً احتفظ بنسخة من الشيت
3. **التحقق من البيانات**: تأكد من صحة البيانات قبل الحفظ
4. **التحديث اليدوي**: يمكنك استخدام زر التحديث عند الحاجة
5. **الأخطاء**: إذا فشل التحميل، تحقق من صحة API Key و Sheet ID

---

### 🆘 دعم واستفسارات:

إذا واجهت أي مشاكل:
1. تحقق من صحة API Key
2. تأكد من أن الشيت مُشارك مع "Anyone with the link"
3. تحقق من تفعيل Google Sheets API
4. راجع console في المتصفح للأخطاء