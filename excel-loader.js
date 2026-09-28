/* ============================================================
   excel-loader.js
   قراءة بيانات المتجر من ملف Excel (store-data.xlsx) على GitHub
   + تصدير البيانات الحالية إلى ملف Excel
   ============================================================ */

// تقبل القيم المفصولة بعلامة | أو بأسطر جديدة كما في ملفات Excel.
function parseSplit(value) {
    if (!value) return [];
    const values = Array.isArray(value) ? value : String(value).split(/[|\r\n]+/);
    return values.map(s => String(s).trim()).filter(s => s.length > 0);
}

// تحويل قيمة إلى رقم
function parseNum(value) {
    const n = parseFloat(String(value == null ? '' : value).replace(/,/g, '').trim());
    return isNaN(n) ? 0 : n;
}

function getFirstValue(row, keys) {
    for (const key of keys) {
        if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
    }
    return '';
}

function parseProductImages(primary, additional) {
    return [...new Set([...parseSplit(primary), ...parseSplit(additional)])];
}

function parseStock(availability, quantity) {
    const status = String(availability == null ? '' : availability).trim().toLowerCase();
    const outOfStockValues = ['out', 'out of stock', 'out_of_stock', 'sold out', 'نفد', 'نفد المخزون', 'غير متوفر', 'نفذت الكمية'];
    if (outOfStockValues.includes(status)) return 'out';

    const quantityValue = String(quantity == null ? '' : quantity).trim();
    if (quantityValue) {
        const quantityStatus = quantityValue.toLowerCase();
        if (outOfStockValues.includes(quantityStatus)) return 'out';
        const parsedQuantity = parseNum(quantityValue);
        return parsedQuantity > 0 ? parsedQuantity : 'out';
    }

    if (!status || ['in stock', 'stock', 'available', 'متوفر', 'متاح', 'yes', 'true'].includes(status)) {
        return 'متوفر';
    }
    const numericAvailability = Number(status);
    return Number.isFinite(numericAvailability) ? (numericAvailability > 0 ? numericAvailability : 'out') : 'متوفر';
}

// تحويل ورقة عمل إلى مصفوفة كائنات
function sheetToObjects(sheet) {
    if (!sheet) return [];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    // تخطي صفوف الملاحظات/التعليمات (تبدأ بـ 💡) حتى لا تُقرأ كبيانات
    return rows.filter(r => {
        const firstKey = Object.keys(r)[0];
        const firstVal = r[firstKey];
        return !(typeof firstVal === 'string' && firstVal.trim().startsWith('💡'));
    });
}

function validateSheetColumns(sheet, name, requiredGroups) {
    const headers = (XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false })[0] || [])
        .map(header => String(header).trim());
    const missing = requiredGroups
        .filter(group => !group.some(alias => headers.includes(alias)))
        .map(group => group[0]);
    if (missing.length) {
        throw new Error(`أعمدة مطلوبة غير موجودة في ورقة ${name}: ${missing.join(', ')}`);
    }
}

/* ------------------------------------------------------------
   جلب بيانات المتجر من ملف Excel
   ترجع كائن بيانات بنفس بنية db.json أو null عند الفشل
   ------------------------------------------------------------ */
async function fetchStoreFromExcel() {
    try {
        const res = await fetch('store-data.xlsx?v=' + Date.now());
        if (!res.ok) {
            console.warn(`تعذر تحميل ملف Excel (HTTP ${res.status})، ستتم تجربة المصدر الاحتياطي.`);
            return null;
        }
        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        const data = {};
        const requiredSheets = ['Products', 'Categories', 'Videos', 'Coupons', 'Settings', 'Statuses', 'Notifications'];
        const missingSheets = requiredSheets.filter(name => !wb.Sheets[name]);
        if (missingSheets.length) {
            throw new Error('أوراق Excel التالية غير موجودة: ' + missingSheets.join(', '));
        }
        const requiredColumns = {
            Products: [['title', 'الاسم', 'name'], ['price']],
            Categories: [['الاسم', 'name']],
            Videos: [['العنوان', 'title'], ['الرابط', 'url']],
            Coupons: [['الكود', 'code']],
            Settings: [['المفتاح', 'key'], ['القيمة', 'value']],
            Statuses: [['القيمة', 'value']],
            Notifications: [['الرسالة', 'message'], ['النوع', 'type']]
        };
        requiredSheets.forEach(name => validateSheetColumns(wb.Sheets[name], name, requiredColumns[name]));

        // ---- المنتجات ----
        const prodRows = sheetToObjects(wb.Sheets['Products']);
        data.products = prodRows.map(r => {
            const images = parseProductImages(r['image_link'], r['additional_image_link']);
            return {
                id: r['id'] !== undefined && r['id'] !== '' ? r['id'] : (Date.now() + Math.floor(Math.random()*100000)),
                name: getFirstValue(r, ['title', 'الاسم', 'name']),
                price: parseNum(r['price']),
                originalPrice: parseNum(r['sale_price']) || null,
                description: getFirstValue(r, ['description', 'الوصف', 'desc']),
                image: images[0] || '',
                images,
                category: getFirstValue(r, ['product_type', 'الصنف', 'category']) || 'الكل',
                stock: parseStock(r['availability'], getFirstValue(r, ['المخزون', 'quantity', 'stock_quantity'])),
                status: getFirstValue(r, ['condition', 'الحالة', 'status']),
                tags: parseSplit(r['custom_label_0']),
                specs: parseSplit(r['custom_label_1']),
                offerEnds: getFirstValue(r, ['end', 'نهاية العرض', 'offerEnds']),
                videos: parseSplit(getFirstValue(r, ['فيديوهات (|)', 'فيديوهات', 'videos'])),
                rating: parseNum(r['التقييم']),
                reviewCount: parseNum(r['عدد التقييمات'])
            };
        }).filter(p => p.name);

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
        setRows.forEach(r => {
            const key = String(r['المفتاح'] || '').trim();
            if (key) settings[key] = r['القيمة'];
        });
        data.settings = settings;
        data.ticker = String(settings.ticker || '');
        data.proof = String(settings.proof || '');

        // ---- الحالات ----
        const stRows = sheetToObjects(wb.Sheets['Statuses']);
        data.statuses = stRows.map(r => r['القيمة']).filter(Boolean);

        // ---- الإشعارات (شريط الأخبار + إشعارات الشراء) ----
        const notifRows = sheetToObjects(wb.Sheets['Notifications']);
        const tickerMessages = [];
        const proofMessages = [];
        notifRows.forEach(r => {
            const msg = String(r['الرسالة'] || '').trim();
            if (!msg) return;
            const active = String(r['فعال'] == null ? '' : r['فعال']).trim().toLowerCase();
            if (['لا', 'no', 'false', '0', 'غير فعال', 'معطل'].includes(active)) return;
            const dur = parseNum(r['المدة (ثانية)']) > 0 ? parseNum(r['المدة (ثانية)']) : 5;
            const item = { text: msg, duration: dur };
            if (String(r['النوع'] || '').trim().toLowerCase() === 'proof') proofMessages.push(item);
            else tickerMessages.push(item);
        });
        data.tickerMessages = tickerMessages;
        data.proofMessages = proofMessages;

        return data;
    } catch (e) {
        console.error('تعذر قراءة ملف Excel؛ ستتم تجربة المصدر الاحتياطي:', e);
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
    if (data.statuses) localStorage.setItem('storeStatuses', JSON.stringify(data.statuses));
    if (data.ticker !== undefined) localStorage.setItem('tickerText', data.ticker);
    if (data.proof !== undefined) localStorage.setItem('proofText', data.proof);
    if (data.tickerMessages) localStorage.setItem('tickerMessages', JSON.stringify(data.tickerMessages));
    if (data.proofMessages) localStorage.setItem('proofMessages', JSON.stringify(data.proofMessages));
    if (data.settings) localStorage.setItem('storeSettings', JSON.stringify(data.settings));
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
        title: p.name,
        price: p.price,
        sale_price: p.originalPrice || '',
        description: p.description || '',
        image_link: p.image || '',
        additional_image_link: (p.images || []).join('|'),
        product_type: p.category || '',
        availability: p.stock === 'out' ? 'out of stock' : 'in stock',
        'المخزون': p.stock !== null && p.stock !== '' && Number.isFinite(Number(p.stock)) ? Number(p.stock) : '',
        condition: p.status || 'new',
        custom_label_0: (p.tags || []).join('|'),
        custom_label_1: (p.specs || []).join('|'),
        end: p.offerEnds || '',
        'فيديوهات (|)': (p.videos || []).join('|'),
        التقييم: p.rating || 0,
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
        { 'المفتاح': 'website', 'القيمة': settings.website || 'https://mashily.github.io/mashily-store/', 'الوصف': 'رابط المتجر على الإنترنت (لمعاينة واتساب والمشاركة)' },
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
