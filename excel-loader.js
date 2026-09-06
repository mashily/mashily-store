/* ============================================================
   excel-loader.js
   قراءة بيانات المتجر من ملف Excel (store-data.xlsx) على GitHub
   + تصدير البيانات الحالية إلى ملف Excel
   ============================================================ */

// تقسيم خلية تحتوي أكثر من قيمة (مفصولة بـ |)
function parseSplit(value) {
    if (!value) return [];
    return String(value).split('|').map(s => s.trim()).filter(s => s.length > 0);
}

// تحويل قيمة إلى رقم
function parseNum(value) {
    const n = parseFloat(value);
    return isNaN(n) ? 0 : n;
}

// تحويل ورقة عمل إلى مصفوفة كائنات
function sheetToObjects(sheet) {
    if (!sheet) return [];
    try {
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        // تخطي صفوف الملاحظات/التعليمات (تبدأ بـ 💡) حتى لا تُقرأ كبيانات
        return rows.filter(r => {
            const firstKey = Object.keys(r)[0];
            const firstVal = r[firstKey];
            return !(typeof firstVal === 'string' && firstVal.trim().startsWith('💡'));
        });
    } catch (e) {
        return [];
    }
}

/* ------------------------------------------------------------
   جلب بيانات المتجر من ملف Excel
   ترجع كائن بيانات بنفس بنية db.json أو null عند الفشل
   ------------------------------------------------------------ */
async function fetchStoreFromExcel() {
    try {
        const res = await fetch('store-data.xlsx?v=' + Date.now());
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const data = {};

        // ---- المنتجات ----
        const prodRows = sheetToObjects(wb.Sheets['Products']);
        data.products = prodRows.map(r => ({
            id: r['id'] !== undefined && r['id'] !== '' ? r['id'] : (Date.now() + Math.floor(Math.random()*100000)),
            name: r['الاسم'] || '',
            price: parseNum(r['السعر']),
            originalPrice: parseNum(r['السعر قبل الخصم']) || null,
            description: r['الوصف'] || '',
            image: r['الصورة الرئيسية'] || '',
            images: parseSplit(r['صور إضافية (|)']),
            category: r['الصنف'] || 'الكل',
            stock: String(r['المخزون']).toLowerCase() === 'out' ? 'out' : parseNum(r['المخزون']),
            status: r['الحالة'] || '',
            tags: parseSplit(r['الشارات (|)']),
            specs: parseSplit(r['المواصفات (|)']),
            offerEnds: r['نهاية العرض'] || '',
            videos: parseSplit(r['فيديوهات (|)']),
            rating: parseNum(r['التقييم']),
            reviewCount: parseNum(r['عدد التقييمات'])
        })).filter(p => p.name);

        // ---- الأصناف ----
        const catRows = sheetToObjects(wb.Sheets['Categories']);
        data.categories = catRows
            .map(r => ({ name: r['الاسم'], icon: r['الأيقونة'] || 'fas fa-tag' }))
            .filter(c => c.name);

        // ---- الفيديوهات ----
        const vidRows = sheetToObjects(wb.Sheets['Videos']);
        data.videos = vidRows.map(r => ({
            id: r['id'] !== undefined && r['id'] !== '' ? r['id'] : (Date.now() + Math.floor(Math.random()*100000)),
            title: r['العنوان'] || '',
            url: r['الرابط'] || '',
            category: r['الصنف'] || 'عام',
            type: r['النوع'] || 'free',
            duration: r['المدة'] || '',
            image: r['الصورة'] || '',
            password: '',
            likes: 0,
            dislikes: 0,
            comments: []
        })).filter(v => v.title);

        // ---- الكوبونات ----
        const coupRows = sheetToObjects(wb.Sheets['Coupons']);
        data.coupons = coupRows.map(r => ({
            code: String(r['الكود'] || '').trim(),
            value: parseNum(r['القيمة']),
            type: r['النوع'] || 'fixed',
            expiry: r['تاريخ الانتهاء'] || '',
            minSpend: parseNum(r['الحد الأدنى'])
        })).filter(c => c.code);

        // ---- الإعدادات ----
        const setRows = sheetToObjects(wb.Sheets['Settings']);
        const settings = {};
        setRows.forEach(r => { if (r['المفتاح']) settings[r['المفتاح']] = r['القيمة']; });
        data.settings = settings;
        data.ticker = settings.ticker || '';
        data.proof = settings.proof || '';

        // ---- الحالات ----
        const stRows = sheetToObjects(wb.Sheets['Statuses']);
        data.statuses = stRows.map(r => r['القيمة']).filter(Boolean);

        // ---- الإشعارات (شريط الأخبار + إشعارات الشراء) ----
        const notifRows = sheetToObjects(wb.Sheets['Notifications']);
        const tickerMessages = [];
        const proofMessages = [];
        notifRows.forEach(r => {
            const msg = r['الرسالة'];
            if (!msg) return;
            if (String(r['فعال']).trim() === 'لا') return; // رسالة غير فعالة
            const dur = parseNum(r['المدة (ثانية)']) || 5; // مدة العرض بالثواني
            const item = { text: msg, duration: dur };
            if (String(r['النوع']).trim() === 'proof') proofMessages.push(item);
            else tickerMessages.push(item);
        });
        data.tickerMessages = tickerMessages;
        data.proofMessages = proofMessages;

        return data;
    } catch (e) {
        console.log('تعذر قراءة ملف Excel:', e);
        return null;
    }
}

/* ------------------------------------------------------------
   تطبيق بيانات الـ Excel على localStorage (مثل db.json)
   ------------------------------------------------------------ */
function applyStoreData(data) {
    if (!data) return false;
    if (data.products) localStorage.setItem('storeProducts', JSON.stringify(data.products));
    if (data.categories) localStorage.setItem('storeCategories', JSON.stringify(data.categories));
    if (data.videos) localStorage.setItem('academyVideos', JSON.stringify(data.videos));
    if (data.coupons) localStorage.setItem('storeCoupons', JSON.stringify(data.coupons));
    if (data.ticker) localStorage.setItem('tickerText', data.ticker);
    if (data.proof) localStorage.setItem('proofText', data.proof);
    if (data.tickerMessages && data.tickerMessages.length) localStorage.setItem('tickerMessages', JSON.stringify(data.tickerMessages));
    if (data.proofMessages && data.proofMessages.length) localStorage.setItem('proofMessages', JSON.stringify(data.proofMessages));
    if (data.settings) {
        const old = JSON.parse(localStorage.getItem('storeSettings')) || {};
        const merged = Object.assign({}, old, data.settings);
        localStorage.setItem('storeSettings', JSON.stringify(merged));
    }
    return true;
}

/* ------------------------------------------------------------
   تصدير بيانات المتجر الحالية إلى ملف Excel
   (تستخدم من لوحة التحكم - زر "تصدير إلى Excel")
   ------------------------------------------------------------ */
function buildStoreWorkbook() {
    const products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    const categories = JSON.parse(localStorage.getItem('storeCategories')) || [];
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const coupons = JSON.parse(localStorage.getItem('storeCoupons')) || [];
    const settings = JSON.parse(localStorage.getItem('storeSettings')) || {};
    const ticker = localStorage.getItem('tickerText') || '';
    const proof = localStorage.getItem('proofText') || '';

    const wb = XLSX.utils.book_new();

    // المنتجات
    const prodRows = products.map(p => ({
        id: p.id,
        'الاسم': p.name,
        'السعر': p.price,
        'السعر قبل الخصم': p.originalPrice || '',
        'الوصف': p.description || '',
        'الصورة الرئيسية': p.image || '',
        'صور إضافية (|)': (p.images || []).join(' | '),
        'الصنف': p.category || '',
        'المخزون': p.stock,
        'الحالة': p.status || '',
        'الشارات (|)': (p.tags || []).join(' | '),
        'المواصفات (|)': (p.specs || []).join(' | '),
        'نهاية العرض': p.offerEnds || '',
        'فيديوهات (|)': (p.videos || []).join(' | '),
        'التقييم': p.rating || 0,
        'عدد التقييمات': p.reviewCount || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Products');

    // الأصناف
    const catRows = categories.map(c => ({ 'الاسم': c.name, 'الأيقونة': c.icon || 'fas fa-tag' }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Categories');

    // الفيديوهات
    const vidRows = videos.map(v => ({
        id: v.id,
        'العنوان': v.title,
        'الرابط': v.url,
        'الصنف': v.category || 'عام',
        'النوع': v.type || 'free',
        'المدة': v.duration || '',
        'الصورة': v.image || ''
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vidRows), 'Videos');

    // الكوبونات
    const coupRows = coupons.map(c => ({
        'الكود': c.code,
        'القيمة': c.value,
        'النوع': c.type || 'fixed',
        'تاريخ الانتهاء': c.expiry || '',
        'الحد الأدنى': c.minSpend || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coupRows), 'Coupons');

    // الإعدادات
    const setRows = [
        { 'المفتاح': 'whatsapp', 'القيمة': settings.whatsapp || '', 'الوصف': 'رقم الواتساب (بصيغة دولية بدون + أو 00)' },
        { 'المفتاح': 'vodafone', 'القيمة': settings.vodafone || '', 'الوصف': 'رقم فودافون كاش للتحويل' },
        { 'المفتاح': 'instapay', 'القيمة': settings.instapay || '', 'الوصف': 'اسم مستخدم انستاباي' },
        { 'المفتاح': 'qr', 'القيمة': settings.qr || '', 'الوصف': 'رابط صورة QR كود انستاباي (اختياري)' },
        { 'المفتاح': 'ticker', 'القيمة': ticker, 'الوصف': 'شريط الأخبار السفلي' },
        { 'المفتاح': 'proof', 'القيمة': proof, 'الوصف': 'رسالة إشعار الشراء (افصل بين رسائل متعددة بـ ,)' }
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(setRows), 'Settings');

    // الحالات
    const statuses = JSON.parse(localStorage.getItem('storeStatuses')) || ['عرض خاص', 'جديد'];
    const stRows = statuses.map(s => ({ 'القيمة': s }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stRows), 'Statuses');

    // الإشعارات (شريط الأخبار + إشعارات الشراء)
    const tickerMsgs = JSON.parse(localStorage.getItem('tickerMessages')) || [];
    const proofMsgs = JSON.parse(localStorage.getItem('proofMessages')) || [];
    const notifRows = [
        ...tickerMsgs.map(m => ({ 'الرسالة': typeof m === 'string' ? m : m.text, 'النوع': 'ticker', 'المدة (ثانية)': typeof m === 'string' ? 5 : (m.duration || 5), 'فعال': 'نعم' })),
        ...proofMsgs.map(m => ({ 'الرسالة': typeof m === 'string' ? m : m.text, 'النوع': 'proof', 'المدة (ثانية)': typeof m === 'string' ? 5 : (m.duration || 5), 'فعال': 'نعم' }))
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notifRows), 'Notifications');

    return wb;
}

function exportStoreToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('مكتبة Excel غير محمّلة. تأكد من اتصال الإنترنت.');
        return;
    }
    const wb = buildStoreWorkbook();
    XLSX.writeFile(wb, 'store-data.xlsx');
    alert('✅ تم تصدير ملف Excel بنجاح!\n\nالآن ارفعه على GitHub ليظهر التعديل للزوار.');
}

// إرجاع محتوى ملف Excel بصيغة Base64 (لرفعه على GitHub)
function getStoreWorkbookBase64() {
    if (typeof XLSX === 'undefined') return null;
    const wb = buildStoreWorkbook();
    return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}
