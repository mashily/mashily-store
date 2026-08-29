# دليل رفع الموقع على GitHub Pages

## 🚀 خطوات الرفع والنشر على GitHub

### 1️⃣ إنشاء حساب GitHub (إذا لم يكن لديك)

1. اذهب إلى [github.com](https://github.com)
2. اضغط "Sign up" للتسجيل
3. املأ البيانات المطلوبة
4. تحقق من البريد الإلكتروني

---

### 2️⃣ إنشاء مستودع جديد (Repository)

1. بعد تسجيل الدخول، اضغط على زر "+" في أعلى اليمين
2. اختر "New repository"
3. املأ البيانات:
   - **Repository name**: `mashily-store`
   - **Description**: `Mashily Store - متجر إلكتروني احترافي`
   - **Public**: ✅ (اختر Public للنشر المجاني)
   - **Add a README file**: ✅ (اختر هذا)
4. اضغط "Create repository"

---

### 3️⃣ تحميل Git (إذا لم يكن مثبتاً)

#### على Windows:
1. اذهب إلى [git-scm.com](https://git-scm.com/download/win)
2. حمل وتثبت Git
3. افتح Git Bash من قائمة البدء

#### على Mac:
```bash
# عبر Homebrew
brew install git
```

#### على Linux:
```bash
# Ubuntu/Debian
sudo apt install git

# Fedora
sudo dnf install git
```

---

### 4️⃣ إعداد Git على جهازك

افتح Git Bash أو Terminal وقم بتشغيل:

```bash
# إعداد اسم المستخدم
git config --global user.name "Your Name"

# إعداد البريد الإلكتروني
git config --global user.email "www.mfmm@gmail.com"
```

---

### 5️⃣ رفع الملفات على GitHub

#### الخطوة 1: انتقل إلى مجلد المشروع
```bash
cd "D:\M@shily\WEPSITE\Windsurf\mashily-store-M-shily_Store\mashily-store-M-shily_Store"
```

#### الخطوة 2: تهيئة Git
```bash
git init
```

#### الخطوة 3: إضافة ملف `.gitignore`
أنشئ ملف اسمه `.gitignore` في المجلد الرئيسي وأضف:
```
# Node modules
node_modules/

# Logs
*.log

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Backup files
*-backup.html
*-backup.js
```

#### الخطوة 4: إضافة الملفات
```bash
git add .
```

#### الخطوة 5: إنشاء أول commit
```bash
git commit -m "Initial commit - Mashily Store"
```

#### الخطوة 6: ربط المستودع البعيد
```bash
# استبدل YOUR_USERNAME باسم المستخدم الخاص بك على GitHub
git remote add origin https://github.com/YOUR_USERNAME/mashily-store.git
```

#### الخطوة 7: رفع الملفات
```bash
git branch -M main
git push -u origin main
```

---

### 6️⃣ تفعيل GitHub Pages

#### الطريقة الأولى (من خلال GitHub):
1. افتح المستودع على GitHub
2. اذهب إلى **Settings** في القائمة الجانبية
3. اضغط على **Pages** من القائمة اليسرى
4. في قسم **Build and deployment**:
   - **Source**: اختر `Deploy from a branch`
   - **Branch**: اختر `main` و `/ (root)`
5. اضغط **Save**

#### الطريقة الثانية (عبر Git):
```bash
# إنشاء فرع gh-pages
git checkout -b gh-pages

# رفع الفرع
git push origin gh-pages
```

---

### 7️⃣ انتظار النشر

بعد دقائق قليلة (1-5 دقائق)، سيكون موقعك متاحاً على:
```
https://YOUR_USERNAME.github.io/mashily-store/
```

يمكنك التحقق من حالة النشر في:
- **Settings** → **Pages** → **Deployments**

---

### 8️⃣ تعديل الملفات والتحديث

#### عند إضافة أو تعديل ملفات:

```bash
# إضافة الملفات المعدلة
git add .

# إنشاء commit جديد
git commit -m "Update products page"

# رفع التعديلات
git push
```

التحديثات ستُنشر تلقائياً على GitHub Pages.

---

### 9️⃣ ربط اسم نطاق مخصص (اختياري)

إذا كان لديك اسم نطاق خاص:

1. في **Settings** → **Pages**:
   - اضغط **Custom domain**
   - أدخل اسم النطاق (مثال: `mashily.com`)
   
2. إعدادات DNS:
   - أضف سجل `CNAME` يشير إلى `YOUR_USERNAME.github.io`
   - أو أضف سجل `A` يشير إلى أرقام IP الخاصة بـ GitHub Pages

---

### 🔟 استكشاف الأخطاء الشائعة

#### خطأ: "fatal: remote origin already exists"
```bash
# إزالة الربط القديم
git remote remove origin

# إضافة الربط الجديد
git remote add origin https://github.com/YOUR_USERNAME/mashily-store.git
```

#### خطأ: "Permission denied"
```bash
# إعداد SSH keys
ssh-keygen -t ed25519 -C "www.mfmm@gmail.com"

# إضافة المفتاح العام إلى GitHub
# نسخ محتوى ~/.ssh/id_ed25519.pub
# وإضافته في GitHub: Settings → SSH and GPG keys
```

#### خطأ: "Pages not found"
- تأكد من تفعيل GitHub Pages في الإعدادات
- انتظر بضع دقائق للنشر
- تحقق من أن الفرع المحدد هو `main`

---

### 📁 هيكل الملفات الموصى به

```
mashily-store/
├── index.html          # الصفحة الرئيسية
├── admin.html          # لوحة التحكم
├── academy.html        # صفحة الأكاديمية
├── script.js           # ملف JavaScript
├── style.css           # ملف التنسيقات
├── db.json             # قاعدة البيانات (احتياطي)
├── images/             # مجلد الصور
├── .gitignore          # ملف تجاهل Git
├── README.md           # وصف المشروع
├── GOOGLE_SHEETS_GUIDE.md
└── GITHUB_GUIDE.md
```

---

### 🎯 نصائح مهمة:

1. **النسخ الاحتياطي**: دائماً احتفظ بنسخة محلية من الملفات
2. **التعديلات**: قم بتجربة التعديلات محلياً قبل الرفع
3. **التوثيق**: استخدم رسائل commit واضحة ومفيدة
4. **الأمان**: لا ترفع ملفات تحتوي على مفاتيح API أو بيانات حساسة
5. **الاختبار**: اختبر الموقع بعد كل تحديث

---

### 🔄 التحديث التلقائي

لجعل التحديثات تلقائية:

#### باستخدام GitHub Actions:
1. أنشئ ملف `.github/workflows/deploy.yml`
2. أضف الكود التالي:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: .
```

3. عند كل push إلى فرع `main`، سيتم النشر تلقائياً

---

### 📞 الدعم والمساعدة:

إذا واجهت أي مشاكل:
1. تحقق من حالة GitHub Pages في إعدادات المستودع
2. راجع سجل الأحداث (Actions log) في GitHub
3. تأكد من صحة رابط المستودع البعيد
4. تحقق من صلاحيات النشر (Deploy keys)

---

### ✅ التحقق من النشر الناجح:

1. افتح الرابط: `https://YOUR_USERNAME.github.io/mashily-store/`
2. تأكد من تحميل الصفحة بشكل صحيح
3. اختبر الوظائف الأساسية (السلة، البحث، إلخ)
4. تحقق من تحديثات Google Sheets (إذا تم إعدادها)

---

### 🎉 مبروك!

الآن موقعك منشور على الإنترنت ومتاح للجميع! 🚀