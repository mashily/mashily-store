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

function isMessageActive(row) {
    const active = String(getFirstValue(row, ['فعال', 'active'])).trim().toLowerCase();
    return !['لا', 'no', 'false', '0', 'غير فعال', 'معطل'].includes(active);
}

function getPositiveSeconds(row, keys, fallback) {
    const value = parseNum(getFirstValue(row, keys));
    return value > 0 ? value : fallback;
}

function getNonNegativeSeconds(row, keys, fallback) {
    const raw = getFirstValue(row, keys);
    if (raw === '') return fallback;
    const value = parseNum(raw);
    return value >= 0 ? value : fallback;
}

function getTickerMessages(rows, isLegacy) {
    return rows.reduce((messages, row) => {
        const text = String(getFirstValue(row, ['الرسالة', 'message'])).trim();
        const type = String(getFirstValue(row, ['النوع', 'type'])).trim().toLowerCase();
        if (!text || !isMessageActive(row) || (isLegacy && type === 'proof')) return messages;
        messages.push({
            text,
            duration: getPositiveSeconds(row, ['مدة العرض (ثانية)', 'المدة (ثانية)', 'duration'], 5),
            speed: getPositiveSeconds(row, ['سرعة الحركة (ثانية)', 'سرعة الشريط (ثانية)', 'speed'], 20)
        });
        return messages;
    }, []);
}

function getProofMessages(rows, isLegacy) {
    return rows.reduce((messages, row) => {
        const text = String(getFirstValue(row, ['الرسالة', 'message'])).trim();
        const type = String(getFirstValue(row, ['النوع', 'type'])).trim().toLowerCase();
        if (!text || !isMessageActive(row) || type === 'ticker' || (isLegacy && type !== 'proof')) return messages;
        messages.push({
            text,
            duration: getPositiveSeconds(row, ['مدة الظهور (ثانية)', 'المدة (ثانية)', 'duration'], 4),
            interval: getNonNegativeSeconds(row, ['الانتظار قبل التالي (ثانية)', 'الفاصل بين الإشعارات (ثانية)', 'interval'], 16)
        });
        return messages;
    }, []);
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
            Notifications: [['الرسالة', 'message']]
        };
        requiredSheets.forEach(name => validateSheetColumns(wb.Sheets[name], name, requiredColumns[name]));
        if (wb.Sheets['Ticker']) {
            validateSheetColumns(wb.Sheets['Ticker'], 'Ticker', [['الرسالة', 'message']]);
        }

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
                offerStarts: getFirstValue(r, ['offer_start', 'بداية العرض', 'offerStarts']),
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

        // أوراق منفصلة للأخبار والإشعارات، مع دعم الورقة القديمة المختلطة.
        const notifRows = sheetToObjects(wb.Sheets['Notifications']);
        const hasTickerSheet = Boolean(wb.Sheets['Ticker']);
        if (hasTickerSheet) data.ticker = '';
        const tickerMessages = getTickerMessages(
            hasTickerSheet ? sheetToObjects(wb.Sheets['Ticker']) : notifRows,
            !hasTickerSheet
        );
        data.tickerMessages = tickerMessages.length
            ? tickerMessages
            : (!hasTickerSheet && data.ticker ? [{ text: data.ticker, duration: 5, speed: 20 }] : []);
        const proofMessages = getProofMessages(notifRows, !hasTickerSheet);
        data.proofMessages = proofMessages.length
            ? proofMessages
            : (!hasTickerSheet && data.proof
                ? data.proof.split(',').map(text => ({ text: text.trim(), duration: 5, interval: 16 })).filter(item => item.text)
                : []);

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
        offer_start: p.offerStarts || '',
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
        { 'المفتاح': 'brand_name', 'القيمة': settings.brand_name || 'مشالى', 'الوصف': 'اسم العلامة التجارية الظاهر في رأس الموقع' },
        { 'المفتاح': 'site_name', 'القيمة': settings.site_name || 'متجر مشالى | الإلكترونيات', 'الوصف': 'اسم الموقع وعنوان صفحة المتجر' },
        { 'المفتاح': 'app_name', 'القيمة': settings.app_name || settings.site_name || 'متجر مشالى | الإلكترونيات', 'الوصف': 'الاسم الكامل لتطبيق الهاتف المثبت' },
        { 'المفتاح': 'short_name', 'القيمة': settings.short_name || 'مشالى', 'الوصف': 'الاسم المختصر لأيقونة التطبيق المثبت' },
        { 'المفتاح': 'site_tagline', 'القيمة': settings.site_tagline || 'للإلكترونيات والفيديوهات التعليمية', 'الوصف': 'العبارة المختصرة أسفل شعار المتجر' },
        { 'المفتاح': 'site_description', 'القيمة': settings.site_description || 'متجر إلكترونيات وفيديوهات تعليمية', 'الوصف': 'وصف الموقع للمتصفح والمشاركة' },
        { 'المفتاح': 'academy_name', 'القيمة': settings.academy_name || 'أكاديمية مشالى التعليمية', 'الوصف': 'اسم صفحة الأكاديمية' },
        { 'المفتاح': 'academy_description', 'القيمة': settings.academy_description || 'منصتك لتعلم صيانة الإلكترونيات والبرمجة وأحدث التقنيات.', 'الوصف': 'الوصف التعريفي للأكاديمية' },
        { 'المفتاح': 'theme_color', 'القيمة': settings.theme_color || '#2e8b57', 'الوصف': 'لون المتصفح وشريط التطبيق بصيغة HEX' },
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
    const savedTickerMessages = localStorage.getItem('tickerMessages');
    const tickerMsgs = savedTickerMessages !== null
        ? JSON.parse(savedTickerMessages)
        : (ticker ? [{ text: ticker, duration: 5, speed: 20 }] : []);
    const savedProofMessages = localStorage.getItem('proofMessages');
    const proofMsgs = savedProofMessages !== null
        ? JSON.parse(savedProofMessages)
        : (proof ? proof.split(',').map(text => ({ text: text.trim(), duration: 4, interval: 16 })).filter(m => m.text) : []);
    const tickerRows = tickerMsgs.map(m => ({
        'الرسالة': typeof m === 'string' ? m : m.text,
        'مدة العرض (ثانية)': typeof m === 'string' ? 5 : (m.duration || 5),
        'سرعة الحركة (ثانية)': typeof m === 'string' ? 20 : (m.speed || 20),
        'فعال': 'نعم'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tickerRows), 'Ticker');

    const notifRows = proofMsgs.map(m => ({
        'الرسالة': typeof m === 'string' ? m : m.text,
        'مدة الظهور (ثانية)': typeof m === 'string' ? 4 : (m.duration || 4),
        'الانتظار قبل التالي (ثانية)': typeof m === 'string' ? 16 : (m.interval || 16),
        'فعال': 'نعم'
    }));
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

function getSiteManifestBase64() {
    const settings = JSON.parse(localStorage.getItem('storeSettings')) || {};
    const themeColor = /^#[0-9a-f]{6}$/i.test(String(settings.theme_color || ''))
        ? settings.theme_color
        : '#2e8b57';
    const manifest = {
        name: settings.app_name || settings.site_name || 'متجر مشالى | الإلكترونيات',
        short_name: settings.short_name || settings.brand_name || 'مشالى',
        description: settings.site_description || 'متجر الإلكترونيات والفيديوهات التعليمية',
        start_url: './index.html',
        scope: './',
        display: 'standalone',
        background_color: themeColor,
        theme_color: themeColor,
        orientation: 'portrait-primary',
        icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2))));
}
