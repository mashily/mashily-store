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

function parseOptionalBoolean(value) {
    const normalized = String(value == null ? '' : value)
        .trim()
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '');
    if (!normalized) return null;
    if (['نعم', 'yes', 'true', '1', 'on'].includes(normalized)) return true;
    if (['لا', 'no', 'false', '0', 'off'].includes(normalized)) return false;
    return null;
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
    const status = String(availability == null ? '' : availability)
        .trim()
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[إأآ]/g, 'ا')
        .replace(/\s+/g, ' ');
    const isOutOfStock = value => {
        const normalized = String(value == null ? '' : value)
            .trim()
            .toLowerCase()
            .replace(/[\u064B-\u065F\u0670]/g, '')
            .replace(/[إأآ]/g, 'ا')
            .replace(/\s+/g, ' ');
        return ['out', 'out of stock', 'out_of_stock', 'sold out', 'unavailable', 'not available', 'نفد', 'نفذ', 'نفد المخزون', 'نفذ المخزون', 'غير متوفر', 'غير متاح', 'نفذت الكمية', 'لا', 'no', 'false', '0'].includes(normalized)
            || /(غير متوفر|غير متاح|نفد|نفذ المخزون|out of stock|sold out|unavailable|not available)/.test(normalized);
    };
    if (isOutOfStock(status)) return 'out';

    const quantityValue = String(quantity == null ? '' : quantity).trim();
    if (quantityValue) {
        if (isOutOfStock(quantityValue)) return 'out';
        const parsedQuantity = parseNum(quantityValue);
        return parsedQuantity > 0 ? parsedQuantity : 'out';
    }

    if (!status || ['in stock', 'stock', 'available', 'متوفر', 'متاح', 'yes', 'true', 'نعم'].includes(status)) {
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
            const imageName = String(getFirstValue(r, ['اسم الصورة']) || '').trim();
            const primaryImage = getFirstValue(r, ['اسم الصورة', 'image_link', 'صورة الصنف', 'الصورة', 'image_path']);
            const images = parseProductImages(primaryImage, getFirstValue(r, ['additional_image_link', 'صور إضافية']));
            return {
                id: r['id'] !== undefined && r['id'] !== '' ? r['id'] : (Date.now() + Math.floor(Math.random()*100000)),
                name: getFirstValue(r, ['title', 'الاسم', 'name']),
                price: parseNum(r['price']),
                originalPrice: parseNum(r['sale_price']) || null,
                description: getFirstValue(r, ['description', 'الوصف', 'desc']),
                image: images[0] || '',
                imageName,
                images,
                category: getFirstValue(r, ['product_type', 'الصنف', 'category']) || 'الكل',
                stock: parseStock(r['availability'], getFirstValue(r, ['المخزون', 'quantity', 'stock_quantity'])),
                status: getFirstValue(r, ['condition', 'الحالة', 'status']),
                tags: parseSplit(r['custom_label_0']),
                specs: parseSplit(r['custom_label_1']),
                offerStarts: getFirstValue(r, ['offer_start', 'بداية العرض', 'offerStarts']),
                offerEnds: getFirstValue(r, ['end', 'نهاية العرض', 'offerEnds']),
                showInOffers: parseOptionalBoolean(getFirstValue(r, ['عرض متحرك', 'إظهار في العروض', 'عرض في العروض', 'showInOffers'])),
                videos: parseSplit(getFirstValue(r, ['فيديوهات (|)', 'فيديوهات', 'videos'])),
                rating: parseNum(r['التقييم']),
                reviewCount: parseNum(r['عدد التقييمات'])
            };
        }).filter(p => p.name);

        // ---- الأصناف ----
        const catRows = sheetToObjects(wb.Sheets['Categories']);
        const categoryEntries = catRows
            .map(r => ({
                name: String(getFirstValue(r, ['الاسم', 'name', 'category']) || '').trim(),
                icon: getFirstValue(r, ['الأيقونة', 'icon']) || 'fas fa-tag',
                image: String(getFirstValue(r, ['صورة الصنف', 'اسم صورة الصنف', 'الصورة', 'image', 'image_path']) || '').trim()
            }))
            .filter(c => c.name);
        const categoryNameKey = name => String(name || '').trim().toLowerCase();
        const isAllCategory = name => ['الكل', 'كل الأصناف', 'كل الأقسام', 'all'].includes(categoryNameKey(name));
        const isOffersCategory = name => ['offers', 'التخفيضات', 'تخفيضات'].includes(categoryNameKey(name));
        const allCategory = categoryEntries.find(category => isAllCategory(category.name));
        const offersCategory = categoryEntries.find(category => isOffersCategory(category.name));
        data.categoryImages = {
            all: allCategory && allCategory.image || 'images/default.svg',
            offers: offersCategory && offersCategory.image || 'images/offers.svg'
        };
        data.categories = categoryEntries.filter(category => !isAllCategory(category.name) && !isOffersCategory(category.name));

        // ---- الفيديوهات ----
        const vidRows = sheetToObjects(wb.Sheets['Videos']);
        data.videos = vidRows.map(r => ({
            id: r['id'] !== undefined && r['id'] !== '' ? r['id'] : (Date.now() + Math.floor(Math.random()*100000)),
            title: r['العنوان'] || '',
            url: r['الرابط'] || '',
            category: r['الصنف'] || 'عام',
            track: getFirstValue(r, ['المسار', 'مسار الفيديو', 'track']) || r['الصنف'] || 'عام',
            type: ['locked', 'paid', 'مدفوع', 'مشفر'].includes(String(r['النوع'] || '').trim().toLowerCase()) ? 'locked' : 'free',
            duration: r['المدة'] || '',
            image: getFirstValue(r, ['رابط الصورة', 'الصورة', 'thumbnail', 'image']),
            tools: parseSplit(getFirstValue(r, ['الأدوات المستخدمة', 'الأدوات', 'tools'])),
            linkedProducts: parseSplit(getFirstValue(r, ['المنتجات المرتبطة', 'منتجات مرتبطة', 'linked_products', 'product_ids'])),
            attachments: parseSplit(getFirstValue(r, ['مرفقات (|)', 'مرفقات', 'attachments'])).map((item, index) => {
                const separatorIndex = item.indexOf('=');
                return separatorIndex >= 0
                    ? {name: item.slice(0, separatorIndex).trim() || `مرفق ${index + 1}`, url: item.slice(separatorIndex + 1).trim()}
                    : {name: `مرفق ${index + 1}`, url: item};
            }).filter(item => item.url),
            likes: 0,
            dislikes: 0,
            comments: []
        })).filter(v => v.title);

        // ---- مسارات الفيديوهات (ورقة اختيارية للتنظيم الواضح) ----
        const trackRows = wb.Sheets['VideoTracks'] ? sheetToObjects(wb.Sheets['VideoTracks']) : [];
        data.videoTracks = trackRows.map((row, index) => ({
            name: String(getFirstValue(row, ['الاسم', 'اسم المسار', 'name']) || '').trim(),
            description: String(getFirstValue(row, ['الوصف', 'description']) || '').trim(),
            image: String(getFirstValue(row, ['الصورة', 'رابط الصورة', 'image']) || '').trim(),
            icon: String(getFirstValue(row, ['الأيقونة', 'icon']) || 'fas fa-book-open').trim(),
            order: parseNum(getFirstValue(row, ['الترتيب', 'order'])) || index + 1,
            active: isMessageActive(row)
        })).filter(track => track.name && track.active).sort((left, right) => left.order - right.order);

        // ---- أكواد فتح المحتوى المدفوع (تجريبية ومحلية) ----
        const codeRows = wb.Sheets['Codes'] ? sheetToObjects(wb.Sheets['Codes']) : [];
        if (wb.Sheets['Codes']) {
            validateSheetColumns(wb.Sheets['Codes'], 'Codes', [
                ['الكود', 'code'],
                ['مدة الصلاحية (يوم)', 'المدة بالأيام', 'duration_days']
            ]);
        }
        data.accessCodes = codeRows.map(row => {
            const rawActiveValue = getFirstValue(row, ['فعال', 'نشط', 'active']);
            const activeValue = String(rawActiveValue === undefined || rawActiveValue === null || rawActiveValue === ''
                ? 'نعم'
                : rawActiveValue).trim().toLowerCase();
            return {
                code: String(getFirstValue(row, ['الكود', 'code']) || '').trim(),
                durationDays: Math.floor(parseNum(getFirstValue(row, ['مدة الصلاحية (يوم)', 'المدة بالأيام', 'duration_days']))),
                active: !['لا', 'no', 'false', '0', 'غير فعال', 'معطل'].includes(activeValue)
            };
        }).filter(item => item.code && item.durationDays > 0);

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

        // ---- سياسة الاستبدال والاسترجاع المعروضة في تذييل المتجر ----
        const policyRows = wb.Sheets['Policies'] ? sheetToObjects(wb.Sheets['Policies']) : [];
        if (wb.Sheets['Policies']) {
            validateSheetColumns(wb.Sheets['Policies'], 'Policies', [
                ['العنوان', 'title'],
                ['المحتوى', 'content']
            ]);
        }
        data.footerPolicies = policyRows
            .map((row, index) => ({
                title: String(getFirstValue(row, ['العنوان', 'title']) || 'سياسة الاستبدال والاسترجاع').trim(),
                content: String(getFirstValue(row, ['المحتوى', 'content']) || '').trim(),
                order: parseNum(getFirstValue(row, ['الترتيب', 'order'])) || index + 1,
                active: isMessageActive(row)
            }))
            .filter(policy => policy.active && policy.content)
            .sort((left, right) => left.order - right.order);

        // ---- خدمات الصيانة (ورقة اختيارية للتوافق مع ملفات المتجر القديمة) ----
        const maintenanceRows = wb.Sheets['Maintenance'] ? sheetToObjects(wb.Sheets['Maintenance']) : [];
        if (wb.Sheets['Maintenance']) {
            validateSheetColumns(wb.Sheets['Maintenance'], 'Maintenance', [
                ['الخدمة', 'اسم الخدمة', 'العنوان', 'title'],
                ['الوصف', 'description']
            ]);
        }
        data.maintenanceServices = maintenanceRows
            .map((row, index) => ({
                title: String(getFirstValue(row, ['الخدمة', 'اسم الخدمة', 'العنوان', 'title']) || '').trim(),
                description: String(getFirstValue(row, ['الوصف', 'description']) || '').trim(),
                order: parseNum(getFirstValue(row, ['الترتيب', 'order'])) || index + 1,
                active: isMessageActive(row)
            }))
            .filter(service => service.title && service.active)
            .sort((left, right) => left.order - right.order);

        // ---- الحالات ----
        const stRows = sheetToObjects(wb.Sheets['Statuses']);
        data.statuses = stRows.map(r => r['القيمة']).filter(Boolean);

        // أوراق منفصلة للأخبار والإشعارات، مع دعم الورقة القديمة المختلطة.
        const notifRows = sheetToObjects(wb.Sheets['Notifications']);
        const hasTickerSheet = Boolean(wb.Sheets['Ticker']);
        const tickerMessages = getTickerMessages(
            hasTickerSheet ? sheetToObjects(wb.Sheets['Ticker']) : notifRows,
            !hasTickerSheet
        );
        // إذا كانت ورقة Ticker فارغة (أو بدون رسائل مفعلة) يُستخدم مفتاح ticker من ورقة Settings كنسخة احتياطية
        data.tickerMessages = tickerMessages.length
            ? tickerMessages
            : (data.ticker ? [{ text: data.ticker, duration: 5, speed: 20 }] : []);
        const proofMessages = getProofMessages(notifRows, !hasTickerSheet);
        data.proofMessages = proofMessages.length
            ? proofMessages
            : (data.proof
                ? String(data.proof).split(',').map(text => ({ text: text.trim(), duration: 5, interval: 16 })).filter(item => item.text)
                : []);

        const popupRows = wb.Sheets['Popups'] ? sheetToObjects(wb.Sheets['Popups']) : [];
        data.popups = popupRows
            .map(row => ({
                active: isMessageActive(row),
                location: String(getFirstValue(row, ['المكان', 'location']) || 'الكل').trim().toLowerCase(),
                type: String(getFirstValue(row, ['النوع', 'type']) || 'ترحيب').trim(),
                title: String(getFirstValue(row, ['العنوان', 'title']) || '').trim(),
                message: String(getFirstValue(row, ['الرسالة', 'message']) || '').trim(),
                image: String(getFirstValue(row, ['رابط الصورة', 'الصورة', 'image']) || '').trim(),
                buttonText: String(getFirstValue(row, ['نص الزر', 'buttonText']) || '').trim(),
                buttonUrl: String(getFirstValue(row, ['رابط الزر', 'buttonUrl']) || '').trim(),
                starts: getFirstValue(row, ['يبدأ في', 'بداية العرض', 'starts']),
                ends: getFirstValue(row, ['ينتهي في', 'نهاية العرض', 'ends']),
                duration: getPositiveSeconds(row, ['مدة الظهور (ثانية)', 'مدة العرض (ثانية)', 'duration'], 6),
                celebration: isMessageActive({فعال: getFirstValue(row, ['تأثير احتفالي', 'celebration'])}),
                celebrationDuration: getPositiveSeconds(row, ['مدة التأثير (ثانية)', 'celebrationDuration'], 2),
                decorations: parseSplit(getFirstValue(row, ['رموز التأثير (|)', 'رموز التأثير', 'decorations']))
            }))
            .filter(popup => popup.title || popup.message);

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
    localStorage.setItem('storeDataVersion', String(Date.now()));
    if (data.products) localStorage.setItem('storeProducts', JSON.stringify(data.products));
    if (data.categories) localStorage.setItem('storeCategories', JSON.stringify(data.categories));
    if (data.categoryImages) localStorage.setItem('storeCategoryImages', JSON.stringify(data.categoryImages));
    if (data.videos) localStorage.setItem('academyVideos', JSON.stringify(data.videos));
    if (data.videoTracks) localStorage.setItem('academyVideoTracks', JSON.stringify(data.videoTracks));
    if (data.accessCodes) localStorage.setItem('academyAccessCodes', JSON.stringify(data.accessCodes));
    if (data.coupons) localStorage.setItem('storeCoupons', JSON.stringify(data.coupons));
    if (data.statuses) localStorage.setItem('storeStatuses', JSON.stringify(data.statuses));
    if (data.ticker !== undefined) localStorage.setItem('tickerText', data.ticker);
    if (data.proof !== undefined) localStorage.setItem('proofText', data.proof);
    if (data.tickerMessages) localStorage.setItem('tickerMessages', JSON.stringify(data.tickerMessages));
    if (data.proofMessages) localStorage.setItem('proofMessages', JSON.stringify(data.proofMessages));
    if (data.popups) localStorage.setItem('storePopups', JSON.stringify(data.popups));
    if (data.settings) localStorage.setItem('storeSettings', JSON.stringify(data.settings));
    if (data.footerPolicies) localStorage.setItem('storeFooterPolicies', JSON.stringify(data.footerPolicies));
    if (data.maintenanceServices) localStorage.setItem('storeMaintenanceServices', JSON.stringify(data.maintenanceServices));
    return true;
}

/* ------------------------------------------------------------
   تصدير بيانات المتجر الحالية إلى ملف Excel
   (تستخدم من لوحة التحكم - زر "تصدير إلى Excel")
   ------------------------------------------------------------ */
function buildStoreWorkbook() {
    const products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    const categories = JSON.parse(localStorage.getItem('storeCategories')) || [];
    const categoryImages = JSON.parse(localStorage.getItem('storeCategoryImages')) || {};
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoTracks = JSON.parse(localStorage.getItem('academyVideoTracks')) || [];
    const accessCodes = JSON.parse(localStorage.getItem('academyAccessCodes')) || [];
    const coupons = JSON.parse(localStorage.getItem('storeCoupons')) || [];
    const settings = JSON.parse(localStorage.getItem('storeSettings')) || {};
    const footerPolicies = JSON.parse(localStorage.getItem('storeFooterPolicies')) || [];
    const maintenanceServices = JSON.parse(localStorage.getItem('storeMaintenanceServices')) || [];
    const ticker = localStorage.getItem('tickerText') || '';
    const proof = localStorage.getItem('proofText') || '';
    const popups = JSON.parse(localStorage.getItem('storePopups')) || [];

    const wb = XLSX.utils.book_new();

    // المنتجات
    const prodRows = products.map(p => ({
        id: p.id,
        title: p.name,
        price: p.price,
        sale_price: p.originalPrice || '',
        description: p.description || '',
        image_link: p.imageName ? '' : (p.image || ''),
        'اسم الصورة': p.imageName || '',
        additional_image_link: (p.images || []).join('|'),
        product_type: p.category || '',
        availability: p.stock === 'out' ? 'out of stock' : 'in stock',
        'المخزون': p.stock !== null && p.stock !== '' && Number.isFinite(Number(p.stock)) ? Number(p.stock) : '',
        condition: p.status || 'new',
        custom_label_0: (p.tags || []).join('|'),
        custom_label_1: (p.specs || []).join('|'),
        offer_start: p.offerStarts || '',
        end: p.offerEnds || '',
        'عرض متحرك': p.showInOffers === null || p.showInOffers === undefined ? '' : (p.showInOffers ? 'نعم' : 'لا'),
        'فيديوهات (|)': (p.videos || []).join('|'),
        التقييم: p.rating || 0,
        'عدد التقييمات': p.reviewCount || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(prodRows), 'Products');

    // الأصناف
    const categoryEntries = categories.map(category => typeof category === 'string' ? {name: category} : category);
    const categoryNameKey = name => String(name || '').trim().toLowerCase();
    const isPinnedCategory = name => ['الكل', 'كل الأصناف', 'كل الأقسام', 'all', 'offers', 'التخفيضات', 'تخفيضات'].includes(categoryNameKey(name));
    const catRows = [
        {'الاسم': 'الكل', 'صورة الصنف': categoryImages.all || 'images/default.svg', 'الأيقونة': 'fas fa-layer-group'},
        {'الاسم': 'offers', 'صورة الصنف': categoryImages.offers || 'images/offers.svg', 'الأيقونة': 'fas fa-fire'},
        ...categoryEntries.filter(category => !isPinnedCategory(category.name)).map(category => ({
            'الاسم': category.name,
            'صورة الصنف': category.image || '',
            'الأيقونة': category.icon || 'fas fa-tag'
        }))
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(catRows), 'Categories');

    // الفيديوهات
    const vidRows = videos.map(v => ({
        id: v.id,
        'العنوان': v.title,
        'الرابط': v.url,
        'الصنف': v.category || 'عام',
        'المسار': v.track || v.category || 'عام',
        'النوع': v.type || 'free',
        'المدة': v.duration || '',
        'الصورة': v.image || '',
        'الأدوات المستخدمة': (v.tools || []).join('|'),
        'المنتجات المرتبطة': (v.linkedProducts || []).join('|'),
        'مرفقات (|)': (v.attachments || []).map(item => `${item.name || ''}=${item.url || ''}`).join('|')
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vidRows), 'Videos');

    const trackRows = videoTracks.map(track => ({
        'الاسم': track.name,
        'الوصف': track.description || '',
        'الصورة': track.image || '',
        'الأيقونة': track.icon || 'fas fa-book-open',
        'الترتيب': track.order || 1,
        'فعال': track.active === false ? 'لا' : 'نعم'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trackRows, {header: ['الاسم', 'الوصف', 'الصورة', 'الأيقونة', 'الترتيب', 'فعال']}), 'VideoTracks');

    // الأكواد التجريبية لفتح كل الفيديوهات المدفوعة على الجهاز نفسه.
    const codeRows = accessCodes.map(item => ({
        'الكود': item.code,
        'مدة الصلاحية (يوم)': item.durationDays,
        'فعال': item.active === false ? 'لا' : 'نعم'
    }));
    const codeHeaders = ['الكود', 'مدة الصلاحية (يوم)', 'فعال'];
    const codesSheet = codeRows.length
        ? XLSX.utils.json_to_sheet(codeRows, {header: codeHeaders})
        : XLSX.utils.aoa_to_sheet([codeHeaders]);
    XLSX.utils.book_append_sheet(wb, codesSheet, 'Codes');

    // الكوبونات
    const coupRows = coupons.map(c => ({
        'الكود': c.code,
        'القيمة': c.value,
        'النوع': c.type || 'fixed',
        'تاريخ الانتهاء': c.expiry || '',
        'الحد الأدنى': c.minSpend || 0
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(coupRows), 'Coupons');

    // سياسة الاستبدال والاسترجاع
    const policyHeaders = ['العنوان', 'المحتوى', 'الترتيب', 'فعال'];
    const policyRows = footerPolicies.map((policy, index) => ({
        'العنوان': policy.title || 'سياسة الاستبدال والاسترجاع',
        'المحتوى': policy.content || '',
        'الترتيب': policy.order || index + 1,
        'فعال': policy.active === false ? 'لا' : 'نعم'
    }));
    const policiesSheet = policyRows.length
        ? XLSX.utils.json_to_sheet(policyRows, {header: policyHeaders})
        : XLSX.utils.aoa_to_sheet([policyHeaders]);
    XLSX.utils.book_append_sheet(wb, policiesSheet, 'Policies');

    // خدمات الصيانة
    const maintenanceHeaders = ['الخدمة', 'الوصف', 'الترتيب', 'فعال'];
    const maintenanceRows = maintenanceServices.map((service, index) => ({
        'الخدمة': service.title || '',
        'الوصف': service.description || '',
        'الترتيب': service.order || index + 1,
        'فعال': service.active === false ? 'لا' : 'نعم'
    }));
    const maintenanceSheet = maintenanceRows.length
        ? XLSX.utils.json_to_sheet(maintenanceRows, {header: maintenanceHeaders})
        : XLSX.utils.aoa_to_sheet([maintenanceHeaders]);
    XLSX.utils.book_append_sheet(wb, maintenanceSheet, 'Maintenance');

    // الإعدادات
    const setRows = [
        { 'المفتاح': 'whatsapp', 'القيمة': settings.whatsapp || '', 'الوصف': 'رقم الواتساب (بصيغة دولية بدون + أو 00)' },
        { 'المفتاح': 'footer_address', 'القيمة': settings.footer_address || '', 'الوصف': 'عنوان المحل الظاهر في تذييل المتجر' },
        { 'المفتاح': 'footer_maps_url', 'القيمة': settings.footer_maps_url || '', 'الوصف': 'رابط موقع المحل على خرائط Google (اختياري)' },
        { 'المفتاح': 'footer_working_hours', 'القيمة': settings.footer_working_hours || '', 'الوصف': 'مواعيد العمل؛ يمكن كتابة كل فترة في سطر' },
        { 'المفتاح': 'footer_closed_days', 'القيمة': settings.footer_closed_days || '', 'الوصف': 'يوم أو أيام الإجازة الأسبوعية (اختياري)' },
        { 'المفتاح': 'footer_phone', 'القيمة': settings.footer_phone || '', 'الوصف': 'رقم اتصال المحل (اختياري)' },
        { 'المفتاح': 'footer_description', 'القيمة': settings.footer_description || '', 'الوصف': 'عبارة قصيرة أسفل اسم المتجر في التذييل (اختياري)' },
        { 'المفتاح': 'footer_contact_heading', 'القيمة': settings.footer_contact_heading || 'العنوان ومواعيد العمل', 'الوصف': 'عنوان قسم بيانات المحل في التذييل' },
        { 'المفتاح': 'footer_social_heading', 'القيمة': settings.footer_social_heading || 'تابعنا وتواصل معنا', 'الوصف': 'عنوان قسم روابط التواصل الاجتماعي' },
        { 'المفتاح': 'footer_policy_label', 'القيمة': settings.footer_policy_label || 'سياسة الاستبدال والاسترجاع', 'الوصف': 'النص الظاهر لرابط السياسة في التذييل' },
        { 'المفتاح': 'footer_facebook_url', 'القيمة': settings.footer_facebook_url || '', 'الوصف': 'رابط صفحة المتجر على Facebook' },
        { 'المفتاح': 'footer_youtube_url', 'القيمة': settings.footer_youtube_url || '', 'الوصف': 'رابط قناة المتجر على YouTube' },
        { 'المفتاح': 'footer_instagram_url', 'القيمة': settings.footer_instagram_url || '', 'الوصف': 'رابط Instagram (اختياري)' },
        { 'المفتاح': 'footer_tiktok_url', 'القيمة': settings.footer_tiktok_url || '', 'الوصف': 'رابط TikTok (اختياري)' },
        { 'المفتاح': 'footer_whatsapp', 'القيمة': settings.footer_whatsapp || settings.whatsapp || '', 'الوصف': 'رقم واتساب دولي لزر التواصل في التذييل؛ يترك فارغاً لاستخدام رقم whatsapp' },
        { 'المفتاح': 'maintenance_enabled', 'القيمة': settings.maintenance_enabled !== undefined ? settings.maintenance_enabled : 'نعم', 'الوصف': 'إظهار زر طلب الصيانة؛ نعم أو لا' },
        { 'المفتاح': 'maintenance_button_label', 'القيمة': settings.maintenance_button_label || 'طلب صيانة', 'الوصف': 'نص زر فتح طلب الصيانة' },
        { 'المفتاح': 'maintenance_whatsapp', 'القيمة': settings.maintenance_whatsapp || '', 'الوصف': 'رقم واتساب الصيانة بصيغة دولية؛ اتركه فارغاً لاستخدام رقم whatsapp' },
        { 'المفتاح': 'maintenance_intro', 'القيمة': settings.maintenance_intro || 'أرسل تفاصيل الجهاز والعطل، وسيتواصل معك فريق الصيانة لتأكيد الخطوات والتكلفة.', 'الوصف': 'تعليمات نموذج طلب الصيانة' },
        { 'المفتاح': 'maintenance_areas', 'القيمة': settings.maintenance_areas || '', 'الوصف': 'مناطق الخدمة مفصولة بفاصلة أو | أو سطر جديد (اختياري)' },
        { 'المفتاح': 'bottom_nav_enabled', 'القيمة': settings.bottom_nav_enabled !== undefined ? settings.bottom_nav_enabled : 'نعم', 'الوصف': 'إظهار شريط التنقل السفلي على الهاتف؛ نعم أو لا' },
        { 'المفتاح': 'bottom_nav_home_label', 'القيمة': settings.bottom_nav_home_label || 'الرئيسية', 'الوصف': 'اسم زر الرئيسية في الشريط السفلي' },
        { 'المفتاح': 'bottom_nav_offers_label', 'القيمة': settings.bottom_nav_offers_label || 'التخفيضات', 'الوصف': 'اسم زر التخفيضات في الشريط السفلي' },
        { 'المفتاح': 'bottom_nav_store_label', 'القيمة': settings.bottom_nav_store_label || 'الرئيسية', 'الوصف': 'اسم الزر المركزي (الشعار) في الشريط السفلي؛ الضغط عليه خمس مرات يفتح لوحة التحكم' },
        { 'المفتاح': 'bottom_nav_cart_label', 'القيمة': settings.bottom_nav_cart_label || 'السلة', 'الوصف': 'اسم زر السلة في الشريط السفلي' },
        { 'المفتاح': 'bottom_nav_maintenance_label', 'القيمة': settings.bottom_nav_maintenance_label || 'الصيانة', 'الوصف': 'اسم زر طلب الصيانة في الشريط السفلي' },
        { 'المفتاح': 'bottom_nav_videos_label', 'القيمة': settings.bottom_nav_videos_label || 'الفيديوهات', 'الوصف': 'اسم زر الفيديوهات في الشريط السفلي' },
        { 'المفتاح': 'bottom_nav_active_color', 'القيمة': settings.bottom_nav_active_color || '', 'الوصف': 'لون زر التنقل النشط بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'onesignal_enabled', 'القيمة': settings.onesignal_enabled || 'لا', 'الوصف': 'تفعيل إشعارات OneSignal في الويب؛ نعم أو لا' },
        { 'المفتاح': 'onesignal_app_id', 'القيمة': settings.onesignal_app_id || '', 'الوصف': 'App ID الخاص بتطبيق OneSignal (يُعطى من لوحة OneSignal ولا يعد سرًا)' },
        { 'المفتاح': 'site_tagline', 'القيمة': settings.site_tagline || 'الإلكترونيات والفيديوهات التعليمية', 'الوصف': 'العبارة أسفل شعار المتجر وتُستخدم كعبارة ترحيب احتياطية' },
        { 'المفتاح': 'currency_label', 'القيمة': settings.currency_label || 'ج.م', 'الوصف': 'رمز العملة الظاهر بجوار كل سعر' },
        { 'المفتاح': 'currency_code', 'القيمة': settings.currency_code || 'EGP', 'الوصف': 'كود العملة في بيانات السيو (مثال: EGP)' },
        { 'المفتاح': 'store_city', 'القيمة': settings.store_city || '', 'الوصف': 'المدينة (تظهر في بيانات السيو لمحركات البحث)' },
        { 'المفتاح': 'store_region', 'القيمة': settings.store_region || '', 'الوصف': 'المحافظة (تظهر في بيانات السيو لمحركات البحث)' },
        { 'المفتاح': 'store_country', 'القيمة': settings.store_country || 'EG', 'الوصف': 'كود الدولة في بيانات السيو (مثال: EG)' },
        { 'المفتاح': 'store_hero_enabled', 'القيمة': settings.store_hero_enabled !== undefined ? settings.store_hero_enabled : 'نعم', 'الوصف': 'إظهار مقدمة المتجر أعلى الصفحة؛ نعم أو لا' },
        { 'المفتاح': 'store_splash_text', 'القيمة': settings.store_splash_text || 'جاري تحميل المتجر...', 'الوصف': 'نص شاشة التحميل في صفحة المتجر' },
        { 'المفتاح': 'academy_splash_text', 'القيمة': settings.academy_splash_text || 'جاري تحميل الأكاديمية...', 'الوصف': 'نص شاشة التحميل في صفحة الأكاديمية' },
        { 'المفتاح': 'search_placeholder', 'القيمة': settings.search_placeholder || 'ابحث باسم المنتج أو القسم أو المواصفات', 'الوصف': 'النص التوضيحي داخل مربع البحث في المتجر' },
        { 'المفتاح': 'academy_search_placeholder', 'القيمة': settings.academy_search_placeholder || 'ابحث باسم الدرس أو القسم...', 'الوصف': 'النص التوضيحي داخل مربع البحث في الأكاديمية' },
        { 'المفتاح': 'mode_store_label', 'القيمة': settings.mode_store_label || 'المتجر', 'الوصف': 'اسم زر المتجر في مفتاح التبديل أعلى الصفحة' },
        { 'المفتاح': 'mode_academy_label', 'القيمة': settings.mode_academy_label || 'الفيديوهات التعليمية', 'الوصف': 'اسم زر الأكاديمية في مفتاح التبديل أعلى الصفحة' },
        { 'المفتاح': 'offers_title', 'القيمة': settings.offers_title || 'تخفيضات', 'الوصف': 'عنوان قسم التخفيضات في الصفحة الرئيسية' },
        { 'المفتاح': 'offers_expired_text', 'القيمة': settings.offers_expired_text || 'انتهت التخفيضات', 'الوصف': 'نص يظهر عند انتهاء مدة التخفيضات' },
        { 'المفتاح': 'cart_title', 'القيمة': settings.cart_title || '🛒 السلة', 'الوصف': 'عنوان درج سلة المشتريات' },
        { 'المفتاح': 'cart_empty_text', 'القيمة': settings.cart_empty_text || 'السلة فارغة', 'الوصف': 'النص الذي يظهر عندما تكون السلة فارغة' },
        { 'المفتاح': 'cart_remove_label', 'القيمة': settings.cart_remove_label || 'حذف', 'الوصف': 'نص زر حذف صنف من السلة' },
        { 'المفتاح': 'cart_clear_confirm', 'القيمة': settings.cart_clear_confirm || 'هل أنت متأكد من حذف جميع المنتجات من السلة؟', 'الوصف': 'رسالة تأكيد إفراغ السلة' },
        { 'المفتاح': 'cart_checkout_label', 'القيمة': settings.cart_checkout_label || 'تأكيد الطلب', 'الوصف': 'نص زر تأكيد الطلب داخل السلة' },
        { 'المفتاح': 'cart_clear_label', 'القيمة': settings.cart_clear_label || 'إفراغ السلة', 'الوصف': 'نص زر تفريغ السلة' },
        { 'المفتاح': 'cart_note', 'القيمة': settings.cart_note || '', 'الوصف': 'ملاحظة اختيارية تظهر أسفل السلة (مثال: سياسة الشحن أو التوصيل)' },
        { 'المفتاح': 'cart_payment_prompt', 'القيمة': settings.cart_payment_prompt || 'طريقة الدفع المفضلة', 'الوصف': 'النص فوق أزرار طرق الدفع في السلة' },
        { 'المفتاح': 'cart_coupon_label', 'القيمة': settings.cart_coupon_label || 'كوبون:', 'الوصف': 'نص عنوان خانة الكوبون في السلة' },
        { 'المفتاح': 'cart_coupon_placeholder', 'القيمة': settings.cart_coupon_placeholder || 'الكود', 'الوصف': 'النص التوضيحي داخل خانة الكوبون' },
        { 'المفتاح': 'cart_coupon_apply_label', 'القيمة': settings.cart_coupon_apply_label || 'تطبيق', 'الوصف': 'نص زر تطبيق الكوبون' },
        { 'المفتاح': 'payment_cash_label', 'القيمة': settings.payment_cash_label || 'تحويل بنكي', 'الوصف': 'اسم طريقة الدفع بالتحويل البنكي' },
        { 'المفتاح': 'payment_vodafone_label', 'القيمة': settings.payment_vodafone_label || 'فودافون كاش', 'الوصف': 'اسم طريقة الدفع فودافون كاش' },
        { 'المفتاح': 'payment_instapay_label', 'القيمة': settings.payment_instapay_label || 'InstaPay', 'الوصف': 'اسم طريقة الدفع انستاباي' },
        { 'المفتاح': 'checkout_title', 'القيمة': settings.checkout_title || 'تأكيد طلب المنتجات', 'الوصف': 'عنوان نافذة تأكيد الطلب' },
        { 'المفتاح': 'checkout_submit_label', 'القيمة': settings.checkout_submit_label || 'متابعة إلى واتساب', 'الوصف': 'نص زر إرسال الطلب إلى واتساب' },
        { 'المفتاح': 'maintenance_form_title', 'القيمة': settings.maintenance_form_title || 'طلب صيانة', 'الوصف': 'عنوان نافذة طلب الصيانة' },
        { 'المفتاح': 'maintenance_submit_label', 'القيمة': settings.maintenance_submit_label || 'إرسال طلب الصيانة عبر واتساب', 'الوصف': 'نص زر إرسال طلب الصيانة' },
        { 'المفتاح': 'install_button_label', 'القيمة': settings.install_button_label || 'تثبيت التطبيق', 'الوصف': 'نص زر تثبيت التطبيق على الهاتف' },
        { 'المفتاح': 'whatsapp_float_label', 'القيمة': settings.whatsapp_float_label || 'تواصل معنا على واتساب', 'الوصف': 'الوصف الظاهر عند مرور المؤشر على زر واتساب العائم' },
        { 'المفتاح': 'whatsapp_float_message', 'القيمة': settings.whatsapp_float_message || 'أريد تصفح المتجر: {store_url}', 'الوصف': 'نص رسالة زر واتساب العائم؛ استخدم {store_url} لإدراج رابط المتجر' },
        { 'المفتاح': 'order_whatsapp_template', 'القيمة': settings.order_whatsapp_template || 'طلب جديد من متجر {brand}\nالاسم: {name}\nرقم الهاتف: {phone}\nالعنوان: {address}\n\nالمنتجات:\n{items}\nكوبون الخصم: {coupon}\nالإجمالي النهائي: {total} {currency}\nطريقة الدفع: {payment}\n\nرابط المتجر: {url}', 'الوصف': 'قالب رسالة الطلب: {brand} {name} {phone} {address} {items} {coupon} {total} {currency} {payment} {url}' },
        { 'المفتاح': 'maintenance_whatsapp_template', 'القيمة': settings.maintenance_whatsapp_template || 'طلب صيانة جديد — متجر {brand}\nالاسم: {name}\nرقم الهاتف: {phone}\nالعنوان: {address}\nالمنطقة: {area}\nنوع الجهاز: {device}\nالماركة والموديل: {model}\nالخدمة المطلوبة: {service}\nوصف العطل: {issue}\nرابط المتجر: {url}', 'الوصف': 'قالب رسالة الصيانة: {brand} {name} {phone} {address} {area} {device} {model} {service} {issue} {url}' },
        { 'المفتاح': 'footer_copyright_template', 'القيمة': settings.footer_copyright_template || '© {year} متجر {brand} — جميع الحقوق محفوظة', 'الوصف': 'نص حقوق النشر في تذييل المتجر؛ {year} و {brand}' },
        { 'المفتاح': 'academy_footer_template', 'القيمة': settings.academy_footer_template || '© {year} {academy_name} - جميع الحقوق محفوظة', 'الوصف': 'نص حقوق النشر في تذييل الأكاديمية؛ {year} و {academy_name}' },
        { 'المفتاح': 'website', 'القيمة': settings.website || 'https://mashily.github.io/mashily-store/', 'الوصف': 'رابط المتجر على الإنترنت (لمعاينة واتساب والمشاركة)' },
        { 'المفتاح': 'drive_folder_id', 'القيمة': settings.drive_folder_id || '1ONsyQHZaoPNvzCXWxLjIaXs6yfMwiVRD', 'الوصف': 'معرّف مجلد صور Google Drive؛ اجعل الوصول للصور Anyone with the link / Viewer' },
        { 'المفتاح': 'drive_api_key', 'القيمة': settings.drive_api_key || '', 'الوصف': 'مفتاح Google Drive API مقيّد بالموقع وبـ Drive API فقط؛ المفتاح ظاهر للزوار لذا يجب تقييده' },
        { 'المفتاح': 'brand_name', 'القيمة': settings.brand_name || 'مشالى', 'الوصف': 'اسم العلامة التجارية الظاهر في رأس الموقع' },
        { 'المفتاح': 'brand_logo_image', 'القيمة': settings.brand_logo_image || 'logo.png', 'الوصف': 'مسار صورة شعار المتجر؛ اكتب اسم الملف أو رابطه وارفع ملف الصورة إلى GitHub' },
        { 'المفتاح': 'app_icon_192', 'القيمة': settings.app_icon_192 || 'icon-192.png', 'الوصف': 'مسار أيقونة التطبيق المربعة بحجم 192×192؛ حدّث الصورة وارفعها للمستودع' },
        { 'المفتاح': 'app_icon_512', 'القيمة': settings.app_icon_512 || 'icon-512.png', 'الوصف': 'مسار أيقونة التطبيق المربعة بحجم 512×512؛ تستخدم أيضاً لشاشة بدء Android' },
        { 'المفتاح': 'app_splash_image', 'القيمة': settings.app_splash_image || settings.brand_logo_image || 'logo.png', 'الوصف': 'مسار الصورة التي تظهر أثناء تحميل التطبيق؛ ارفع الصورة إلى المستودع' },
        { 'المفتاح': 'cart_auto_close_seconds', 'القيمة': settings.cart_auto_close_seconds !== undefined && settings.cart_auto_close_seconds !== '' ? settings.cart_auto_close_seconds : '3', 'الوصف': 'عدد الثواني قبل إغلاق السلة تلقائياً بعد إضافة صنف؛ اكتب 0 لإيقاف الإغلاق التلقائي' },
        { 'المفتاح': 'offers_end_date', 'القيمة': settings.offers_end_date || '', 'الوصف': 'موعد انتهاء التخفيضات بصيغة YYYY-MM-DD HH:mm (مثال: 2026-12-31 23:59)' },
        { 'المفتاح': 'site_name', 'القيمة': settings.site_name || 'متجر مشالى | الإلكترونيات', 'الوصف': 'اسم الموقع وعنوان صفحة المتجر' },
        { 'المفتاح': 'app_name', 'القيمة': settings.app_name || settings.site_name || 'متجر مشالى | الإلكترونيات', 'الوصف': 'الاسم الكامل لتطبيق الهاتف المثبت' },
        { 'المفتاح': 'short_name', 'القيمة': settings.short_name || 'مشالى', 'الوصف': 'الاسم المختصر لأيقونة التطبيق المثبت' },
        { 'المفتاح': 'site_description', 'القيمة': settings.site_description || 'متجر إلكترونيات وفيديوهات تعليمية', 'الوصف': 'وصف الموقع للمتصفح والمشاركة' },
        { 'المفتاح': 'academy_name', 'القيمة': settings.academy_name || 'أكاديمية مشالى للإلكترونيات', 'الوصف': 'اسم الأكاديمية الظاهر في المتجر وصفحة الفيديوهات؛ عدّل النص هنا لتحديثه بالموقع' },
        { 'المفتاح': 'academy_description', 'القيمة': settings.academy_description || 'تعلّم خطوة بخطوة عبر دروس مصوّرة، وابحث عن الموضوع الذي تحتاجه أو تابع من حيث توقفت.', 'الوصف': 'الوصف التعريفي للأكاديمية' },
        { 'المفتاح': 'academy_logo_image', 'القيمة': settings.academy_logo_image || 'video.png', 'الوصف': 'مسار صورة الأكاديمية؛ استبدل video.png أو اكتب مسار صورة أخرى لتحديثها بالموقع' },
        { 'المفتاح': 'academy_description_color', 'القيمة': settings.academy_description_color || '', 'الوصف': 'لون وصف الأكاديمية بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'academy_description_size', 'القيمة': settings.academy_description_size || '16', 'الوصف': 'حجم خط وصف الأكاديمية بالبكسل' },
        { 'المفتاح': 'store_hero_kicker', 'القيمة': settings.store_hero_kicker || 'أهلاً بك في متجر مشالى', 'الوصف': 'عبارة الترحيب أعلى مقدمة المتجر' },
        { 'المفتاح': 'store_hero_title', 'القيمة': settings.store_hero_title || 'اختياراتك التقنية', 'الوصف': 'العنوان الرئيسي لمقدمة المتجر' },
        { 'المفتاح': 'store_hero_highlight', 'القيمة': settings.store_hero_highlight || 'بخطوات أسهل', 'الوصف': 'السطر المميز أسفل عنوان مقدمة المتجر' },
        { 'المفتاح': 'store_hero_description', 'القيمة': settings.store_hero_description || 'تصفّح المنتجات والأقسام، قارن التفاصيل والأسعار، ثم أرسل طلبك مباشرة عبر واتساب.', 'الوصف': 'النص التعريفي أسفل عنوان المتجر' },
        { 'المفتاح': 'store_hero_kicker_color', 'القيمة': settings.store_hero_kicker_color || '', 'الوصف': 'لون عبارة الترحيب بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'store_hero_title_color', 'القيمة': settings.store_hero_title_color || '', 'الوصف': 'لون عنوان المتجر بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'store_hero_highlight_color', 'القيمة': settings.store_hero_highlight_color || '', 'الوصف': 'لون السطر المميز بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'store_hero_description_color', 'القيمة': settings.store_hero_description_color || '', 'الوصف': 'لون النص التعريفي بصيغة HEX؛ اتركه فارغاً لاستخدام لون الثيم' },
        { 'المفتاح': 'store_hero_kicker_size', 'القيمة': settings.store_hero_kicker_size || '14', 'الوصف': 'حجم عبارة الترحيب بالبكسل' },
        { 'المفتاح': 'store_hero_title_size', 'القيمة': settings.store_hero_title_size || '45', 'الوصف': 'حجم عنوان المتجر بالبكسل (من 12 إلى 64)' },
        { 'المفتاح': 'store_hero_description_size', 'القيمة': settings.store_hero_description_size || '16', 'الوصف': 'حجم النص التعريفي بالبكسل' },
        { 'المفتاح': 'theme_color', 'القيمة': settings.theme_color || '#f7f9f8', 'الوصف': 'لون المتصفح وشريط التطبيق بصيغة HEX' },
        { 'المفتاح': 'vodafone', 'القيمة': settings.vodafone || '', 'الوصف': 'رقم فودافون كاش للتحويل' },
        { 'المفتاح': 'instapay', 'القيمة': settings.instapay || '', 'الوصف': 'اسم مستخدم انستاباي' },
        { 'المفتاح': 'qr', 'القيمة': settings.qr || '', 'الوصف': 'رابط صورة QR كود انستاباي (اختياري)' },
        { 'المفتاح': 'bank_name', 'القيمة': settings.bank_name || '', 'الوصف': 'اسم البنك للتحويل البنكي' },
        { 'المفتاح': 'bank_account', 'القيمة': settings.bank_account || '', 'الوصف': 'رقم الحساب البنكي للتحويل' },
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

    const popupRows = popups.map(popup => ({
        'فعال': popup.active === false ? 'لا' : 'نعم',
        'المكان': popup.location || 'الكل',
        'النوع': popup.type || 'ترحيب',
        'العنوان': popup.title || '',
        'الرسالة': popup.message || '',
        'رابط الصورة': popup.image || '',
        'نص الزر': popup.buttonText || '',
        'رابط الزر': popup.buttonUrl || '',
        'يبدأ في': popup.starts || '',
        'ينتهي في': popup.ends || '',
        'مدة الظهور (ثانية)': popup.duration || 6,
        'تأثير احتفالي': popup.celebration ? 'نعم' : 'لا',
        'مدة التأثير (ثانية)': popup.celebrationDuration || 2,
        'رموز التأثير (|)': (popup.decorations || []).join('|')
    }));
    const popupHeaders = ['فعال', 'المكان', 'النوع', 'العنوان', 'الرسالة', 'رابط الصورة', 'نص الزر', 'رابط الزر', 'يبدأ في', 'ينتهي في', 'مدة الظهور (ثانية)', 'تأثير احتفالي', 'مدة التأثير (ثانية)', 'رموز التأثير (|)'];
    const popupSheet = popupRows.length
        ? XLSX.utils.json_to_sheet(popupRows, {header: popupHeaders})
        : XLSX.utils.aoa_to_sheet([popupHeaders]);
    XLSX.utils.book_append_sheet(wb, popupSheet, 'Popups');

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
        : '#f7f9f8';
    const manifest = {
        name: settings.app_name || settings.site_name || 'متجر مشالى | الإلكترونيات',
        short_name: settings.short_name || settings.brand_name || 'مشالى',
        description: settings.site_description || 'متجر الإلكترونيات والفيديوهات التعليمية',
        start_url: './index.html',
        scope: './',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        launch_handler: {client_mode: 'navigate-existing'},
        background_color: themeColor,
        theme_color: themeColor,
        orientation: 'portrait-primary',
        icons: [
            { src: settings.app_icon_192 || 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: settings.app_icon_512 || 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
        ]
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(manifest, null, 2))));
}
