let products = [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let currentCategory = 'الكل';
let currentSort = 'default';
let appliedCoupon = null;
let selectedPaymentMethod = 'cash';

// وظائف حالة النظام (معرفة مبكراً للاستخدام في init)
function showSystemStatus(message, type) {
    const statusDiv = document.getElementById('system-status');
    const messageDiv = document.getElementById('status-message');
    
    if (statusDiv && messageDiv) {
        statusDiv.style.display = 'block';
        messageDiv.textContent = message;
        
        // تغيير اللون حسب النوع
        if (type === 'success') {
            statusDiv.style.borderLeft = '4px solid #10b981';
        } else if (type === 'error') {
            statusDiv.style.borderLeft = '4px solid #ef4444';
        } else if (type === 'warning') {
            statusDiv.style.borderLeft = '4px solid #f59e0b';
        } else {
            statusDiv.style.borderLeft = '4px solid #3b82f6';
        }
    }
}

function hideSystemStatus() {
    const statusDiv = document.getElementById('system-status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

// إعدادات Google Sheets
let GOOGLE_SHEETS_CONFIG = {
    apiKey: 'AIzaSyBzB0HnN9wqwPQFiutkjwvpdg-3_J_-ETI', // ضع API Key هنا
    sheetId: '1SWGvJfnrEWcg6La6XIRdDp6JLGkOe6XIzn9NZ5irJws', // ضع Sheet ID هنا
    ranges: {
        categories: 'Categories!A2:C', // نطاق الأصناف
        products: 'Products!A2:M', // نطاق المنتجات
        videos: 'Videos!A2:H',     // نطاق الفيديوهات
        settings: 'Settings!A2:G' // نطاق الإعدادات
    }
};

// تحديث إعدادات Google Sheets من localStorage
function updateGoogleSheetsConfig() {
    const settings = JSON.parse(localStorage.getItem('storeSettings')) || {};
    if (settings.sheetId) {
        GOOGLE_SHEETS_CONFIG.sheetId = settings.sheetId;
    }
    if (settings.apiKey) {
        GOOGLE_SHEETS_CONFIG.apiKey = settings.apiKey;
    }
    console.log('تم تحديث إعدادات Google Sheets:', GOOGLE_SHEETS_CONFIG);
}

// دالة قراءة البيانات من Google Sheets
async function fetchFromGoogleSheets() {
    try {
        console.log('جاري تحميل البيانات من Google Sheets...');
        console.log('Sheet ID:', GOOGLE_SHEETS_CONFIG.sheetId);
        console.log('API Key:', GOOGLE_SHEETS_CONFIG.apiKey.substring(0, 10) + '...');
        
        // قراءة الأصناف
        const categoriesResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.categories}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const categoriesData = await categoriesResponse.json();
        console.log('بيانات الأصناف:', categoriesData);
        
        // قراءة المنتجات
        const productsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.products}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const productsData = await productsResponse.json();
        console.log('بيانات المنتجات:', productsData);
        
        // قراءة الفيديوهات
        const videosResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.videos}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const videosData = await videosResponse.json();
        console.log('بيانات الفيديوهات:', videosData);
        
        // قراءة الإعدادات
        const settingsResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEETS_CONFIG.sheetId}/values/${GOOGLE_SHEETS_CONFIG.ranges.settings}?key=${GOOGLE_SHEETS_CONFIG.apiKey}`
        );
        const settingsData = await settingsResponse.json();
        console.log('بيانات الإعدادات:', settingsData);
        
        // تحويل البيانات إلى التنسيق المطلوب
        const categories = convertSheetDataToCategories(categoriesData.values);
        const products = convertSheetDataToProducts(productsData.values);
        const videos = convertSheetDataToVideos(videosData.values);
        const settings = convertSheetDataToSettings(settingsData.values);
        
        console.log('البيانات المحولة:', { 
            categories: categories.length, 
            products: products.length, 
            videos: videos.length, 
            settings: Object.keys(settings).length 
        });
        
        // حفظ البيانات في localStorage
        localStorage.setItem('storeCategories', JSON.stringify(categories));
        localStorage.setItem('storeProducts', JSON.stringify(products));
        localStorage.setItem('academyVideos', JSON.stringify(videos));
        localStorage.setItem('storeSettings', JSON.stringify(settings));
        
        // تحديث الواجهة
        if (typeof renderProducts === 'function') {
            window.products = products; // تحديث المتغير العام
            renderProducts(products);
        }
        
        if (typeof renderCategories === 'function') {
            renderCategories();
        }
        
        console.log('تم تحميل البيانات من Google Sheets بنجاح');
        return { categories, products, videos, settings };
    } catch (error) {
        console.error('Error fetching from Google Sheets:', error);
        console.error('تفاصيل الخطأ:', error.message);
        throw error;
    }
}

// تحويل بيانات الشيت إلى تنسيق الأصناف
function convertSheetDataToCategories(rows) {
    if (!rows || rows.length === 0) return [];
    
    return rows.map((row, index) => ({
        name: row[0] || 'قسم غير مسمى',
        icon: row[1] || 'fas fa-tag',
        description: row[2] || ''
    }));
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

function resolveProductImageUrl(src) {
    if (!src || typeof src !== 'string') return '';

    const trimmed = src.trim();
    if (!trimmed) return '';

    const driveMatch = trimmed.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/i) ||
        trimmed.match(/(?:google\.com.*[?&]id=)([a-zA-Z0-9_-]+)/i);

    if (driveMatch && driveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
    }

    const fileMatch = trimmed.match(/https?:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
    if (fileMatch && fileMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
    }

    return trimmed;
}

function normalizeProductImages(product) {
    const list = [];
    const sources = [];

    if (Array.isArray(product?.images) && product.images.length > 0) {
        product.images.forEach(src => { if (src) sources.push(src); });
    }

    if (product?.image) {
        sources.push(product.image);
    }

    sources.forEach(src => {
        const resolved = resolveProductImageUrl(src);
        if (resolved && !list.some(item => item.src === resolved)) {
            list.push({ type: 'image', src: resolved });
        }
    });

    return list;
}

async function init() {
    console.log('جاري تهيئة النظام...');
    
    // تحديث إعدادات Google Sheets من localStorage
    updateGoogleSheetsConfig();
    
    // التحقق مما إذا كان المستخدم مديراً (لتجنب مسح التعديلات المحلية عند التحديث)
    const isAdmin = sessionStorage.getItem('mashily_user');

    // محاولة جلب البيانات من Google Sheets أولاً
    try {
        if (GOOGLE_SHEETS_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' && GOOGLE_SHEETS_CONFIG.sheetId !== 'YOUR_SHEET_ID_HERE') {
            console.log('محاولة الاتصال بـ Google Sheets...');
            const sheetData = await fetchFromGoogleSheets();
            if (sheetData && sheetData.products) {
                products = sheetData.products;
                console.log('تم تحميل البيانات من Google Sheets بنجاح');
            } else {
                console.log('لم يتم تحميل بيانات من Google Sheets، استخدام البيانات المحلية');
            }
        } else {
            console.log('لم يتم تكوين Google Sheets، استخدام البيانات المحلية');
        }
    } catch (e) {
        console.log('فشل في تحميل البيانات من Google Sheets، محاولة من db.json:', e);
    }

    // إذا لم تنجح Google Sheets، جرب من db.json
    if (!isAdmin && products.length === 0) {
        try {
            console.log('محاولة تحميل البيانات من db.json...');
            const response = await fetch('db.json?v=' + new Date().getTime()); // منع التخزين المؤقت
            if (response.ok) {
                const data = await response.json();
                console.log('بيانات db.json:', data);
                // تحديث البيانات المحلية ببيانات السيرفر
                if(data.products) {
                    localStorage.setItem('storeProducts', JSON.stringify(data.products));
                    products = data.products;
                    console.log('تم تحميل', products.length, 'منتج من db.json');
                }
                if(data.categories) {
                    localStorage.setItem('storeCategories', JSON.stringify(data.categories));
                    console.log('تم تحميل', data.categories.length, 'صنف من db.json');
                }
                if(data.videos) localStorage.setItem('academyVideos', JSON.stringify(data.videos));
                if(data.ticker) localStorage.setItem('tickerText', data.ticker);
                if(data.proof) localStorage.setItem('proofText', data.proof);
                if(data.coupons) localStorage.setItem('storeCoupons', JSON.stringify(data.coupons));
            }
        } catch (e) {
            console.log('وضع الأوفلاين أو لم يتم رفع ملف db.json بعد');
        }
    }

    // إذا لم توجد بيانات بعد كل المحاولات، استخدم البيانات المحلية
    if (products.length === 0) {
        console.log('استخدام البيانات المحلية من localStorage');
        products = JSON.parse(localStorage.getItem('storeProducts')) || [];
        console.log('تم تحميل', products.length, 'منتج من localStorage');
    }

    // --- إضافة منتج تجريبي (للتجربة) ---
    // هذا المنتج سيظهر دائماً في البداية لتجربة التصميم الجديد
    // if (!products.some(p => p.id === 9999)) {
    //     products.unshift({
    //         id: 9999,
    //         name: "ساعة ذكية Ultra Pro (منتج تجريبي)",
    //         price: 1250,
    //         originalPrice: 1800,
    //         image: "https://img.freepik.com/free-photo/smart-watch-space-gray-aluminum-case-black-sport-band_1057-27347.jpg",
    //         images: [
    //             "https://img.freepik.com/free-photo/smart-watch-space-gray-aluminum-case-black-sport-band_1057-27347.jpg",
    //             "https://img.freepik.com/free-vector/realistic-fitness-trackers_23-2148530529.jpg",
    //             "https://img.freepik.com/free-photo/rendering-smart-home-device_23-2151039302.jpg"
    //         ],
    //         videos: ["https://www.w3schools.com/html/mov_bbb.mp4"], // فيديو تجريبي
    //         category: "الكل",
    //         stock: 5,
    //         status: "تجربة ✨",
    //         desc: "هذا منتج تجريبي لاختبار شكل النافذة الجديد ومعرض الصور. يتميز هذا المنتج بوجود صور متعددة ومواصفات كاملة لتجربة التكبير والتنسيق.",
    //         specs: ["شاشة AMOLED عالية الدقة", "بطارية تدوم طويلاً", "مقاومة للماء IP68", "دعم كامل للغة العربية", "حساسات رياضية دقيقة"]
    //     });
    // }

    // تحميل إعدادات الدفع المخصصة
    const settings = JSON.parse(localStorage.getItem('storeSettings'));
    if(settings) {
        if(settings.vodafone) {
            const vfEl = document.getElementById('vf-number-display');
            if(vfEl) vfEl.innerText = settings.vodafone;
        }
        if(settings.instapay) {
            const ipEl = document.getElementById('ip-username-display');
            if(ipEl) ipEl.innerText = settings.instapay;
        }
        if(settings.qr) {
            const qrContainer = document.getElementById('ip-qr-container');
            const qrImg = document.getElementById('ip-qr-image');
            if(qrContainer && qrImg) {
                qrImg.src = settings.qr;
                qrContainer.style.display = 'block';
            }
        }
        // تحديث رقم الواتساب
        if(settings.whatsapp) {
            const waFloat = document.getElementById('wa-float-btn');
            if(waFloat) waFloat.href = `https://wa.me/${settings.whatsapp}`;
        }
    }

    // 1. تطبيق الثيم المحفوظ (Light هو الافتراضي)
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // في المرة الأولى، نتأكد أنه Light
    if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'light');
    }
    
    const themeIcons = {
        'light': 'fas fa-sun',
        'neon': 'fas fa-bolt',
        'gold': 'fas fa-crown'
    };
    
    const themeColors = {
        'light': '#e67e22',
        'neon': '#00D4FF',
        'gold': '#FFD700'
    };
    
    const themeIcon = document.getElementById('theme-icon');
    if(themeIcon) {
        themeIcon.className = themeIcons[savedTheme] || 'fas fa-sun';
        themeIcon.style.color = themeColors[savedTheme] || '#e67e22';
    }

    // 2. تحديث شريط الأخبار السفلي
    const ticker = document.getElementById('ticker-text');
    if(ticker) ticker.innerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في متجر مشالى للإلكترونيات - جودة نثق بها 🔥";

    // 3. عرض الأقسام والمنتجات مع تأثير التحميل
    console.log('جاري عرض الأقسام والمنتجات...');
    console.log('عدد المنتجات:', products.length);
    
    // إظهار حالة النظام
    showSystemStatus('جاري التحميل...', 'info');
    
    renderCategories();
    showSkeletons();
    setTimeout(() => {
        renderProducts(products);
        console.log('تم عرض المنتجات');
        showSystemStatus('تم التحميل بنجاح', 'success');
        setTimeout(() => hideSystemStatus(), 3000);
    }, 700);

    updateCartUI();
    updateWishlistBadge();

    // 4. مستمع لوحة المفاتيح (إغلاق السلة أو بيانات المنتج بـ ESC)
    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            toggleCart(false);
            closeWishlist();
            document.getElementById('theme-menu').style.display = 'none';
            hideAllInfos();
            closeProductModal(); // إغلاق نافذة المنتج
        }
    });

    // تفعيل تأثير التكبير في نافذة المنتج
    setupZoomEffect();
    
    // Event Delegation للمنتجات - للتعامل مع المنتجات المحملة ديناميكياً
    document.addEventListener('click', function(e) {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.id;
            if (productId) {
                console.log('Product card clicked, ID:', productId);
                window.openProductDetails(parseInt(productId));
            }
        }
    });
}

// --- وظائف الثيمات ---
function toggleThemeMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('theme-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function setTheme(themeName, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    // حفظ الثيم في localStorage
    localStorage.setItem('mashily_theme', themeName);
    
    document.documentElement.setAttribute('data-theme', themeName);
    
    const icons = {
        'light': 'fas fa-sun',
        'neon': 'fas fa-bolt',
        'gold': 'fas fa-crown'
    };
    
    const colors = {
        'light': '#e67e22',
        'neon': '#00D4FF',
        'gold': '#FFD700'
    };
    
    const themeIcon = document.getElementById('theme-icon');
    if(themeIcon) {
        themeIcon.className = icons[themeName] || 'fas fa-sun';
        themeIcon.style.color = colors[themeName] || '#e67e22';
    }
    
    // إغلاق القائمة إذا وجدت
    const menu = document.getElementById('theme-menu');
    if(menu) menu.style.display = 'none';
    
    console.log('Theme changed to:', themeName);
}

// إغلاق menu الثيمات عند الضغط بعيد عنه
document.addEventListener('click', function(event) {
    const themeMenu = document.getElementById('theme-menu');
    const themeContainer = event.target.closest('[style*="position:relative"]');
    
    if (!themeContainer && themeMenu && themeMenu.style.display !== 'none') {
        themeMenu.style.display = 'none';
    }
});

function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const target = current === 'light' ? 'neon' : 'light';
    setTheme(target);
}

// دالة مساعدة لإنشاء كارت المنتج (لإعادة الاستخدام) - محدث للتصميم الجديد
function createProductCard(p) {
    const isOut = p.stock === 'out';
    const hasTimer = p.offerEnds && new Date(p.offerEnds) > new Date();
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const isInWishlist = wishlist.some(item => item.id === p.id);
    const oldPrice = p.originalPrice || p.oldPrice;
    const discountPercent = oldPrice ? Math.round(((oldPrice - p.price) / oldPrice) * 100) : 0;
    const imageUrl = resolveProductImageUrl(p.image || (Array.isArray(p.images) ? p.images[0] : ''));

    const safeDesc = (p.desc || 'منتج أصلي من متجر مشالي').replace(/\s+/g, ' ').trim();
    const shortDesc = safeDesc.length > 80 ? safeDesc.slice(0, 80) + '…' : safeDesc;
    const rating = Number(p.rating || 4.8);
    const stockText = isOut ? 'غير متوفر' : 'متوفر الآن';

    return `
    <div class="product-card" data-id="${p.id}" onmouseleave="hideAllInfos()">
        <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="window.toggleWishlist(${p.id}, event)" title="${isInWishlist ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" style="position: absolute; top: 6px; right: 6px; z-index: 10; background: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <i class="fas fa-heart" style="color: ${isInWishlist ? '#ef4444' : '#9ca3af'}; font-size: 0.7rem;"></i>
        </button>
        
        <div class="img-container" style="position: relative; width: 100%; height: 140px; background: var(--color-surface); display: flex; align-items: center; justify-content: center; padding: 0.5rem; overflow: hidden; cursor: pointer;">
            ${!isOut ? `<div style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); z-index: 5; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover)); color: white; font-size: 0.6rem; padding: 2px 8px; border-radius: 14px; font-weight: 700; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.2); white-space: nowrap;">${p.status || 'مميز ✨'}</div>` : ''}
            ${discountPercent > 0 ? `<div style="position: absolute; bottom: 6px; right: 6px; z-index: 5; padding: 2px 5px; border-radius: 14px; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; font-size: 0.6rem; font-weight: 900; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);">-${discountPercent}%</div>` : ''}
            <img src="${imageUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: contain; transition: transform 0.3s; ${isOut ? 'filter: grayscale(100%); opacity: 0.6;' : ''}">
            ${isOut ? '<div style="position: absolute; inset: 0; background: rgba(15, 23, 42, 0.8); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.75rem; backdrop-filter: blur(4px);">نفدت الكمية ❌</div>' : ''}
        </div>
        
        <div class="product-content" style="padding: 0.5rem;">
            <h4 class="product-title" style="font-size: 0.85rem; margin: 0 0 0.2rem 0; line-height: 1.2;">${p.name}</h4>
            <div style="display: flex; align-items: center; gap: 0.25rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
                <span style="background: rgba(251, 191, 36, 0.14); color: #b45309; padding: 2px 5px; border-radius: 14px; font-size: 0.6rem; font-weight: 600; display: inline-flex; align-items: center; gap: 2px;">
                    <i class="fas fa-star" style="font-size: 0.45rem;"></i> ${rating.toFixed(1)}
                </span>
                <span style="background: ${isOut ? 'rgba(148, 163, 184, 0.14)' : 'rgba(16, 185, 129, 0.12)'}; color: ${isOut ? '#475569' : '#047857'}; padding: 2px 5px; border-radius: 14px; font-size: 0.6rem; font-weight: 600;">${stockText}</span>
            </div>
            <p class="product-description" style="font-size: 0.65rem; margin: 0 0 0.25rem 0; line-height: 1.2;">${shortDesc}</p>
            <div class="product-price" style="font-size: 0.95rem; margin: 0 0 0.25rem 0;">
                ${oldPrice ? `<s style="color: #94a3b8; font-size: 0.7rem; text-decoration: line-through; font-weight: 500; margin-left: 0.25rem;">${oldPrice} ج.م</s>` : ''}
                ${p.price} ج.م
            </div>
            ${hasTimer ? `<div class="countdown-timer" data-ends="${p.offerEnds}" style="font-size: 0.6rem; color: #c0392b; font-weight: 700; background: #fff5f5; padding: 3px 6px; border-radius: 14px; border: 1px dashed #e74c3c; text-align: center; margin: 0.25rem 0; animation: pulseTimer 2s infinite;">جاري التحميل...</div>` : ''}
            <button class="add-to-cart-btn" style="background: ${isOut ? '#9ca3af' : 'var(--color-primary)'}; cursor: ${isOut ? 'not-allowed' : 'pointer'}; padding: 0.4rem 0.6rem; font-size: 0.75rem;" 
                onclick="${isOut ? "alert('عذراً، المنتج غير متوفر حالياً')" : `window.addToCart(${p.id})`}">
                ${isOut ? 'غير متوفر' : 'إضافة للسلة'}
            </button>
        </div>
    </div>
    `;
}

// --- وظائف نافذة تفاصيل المنتج (Modal & Gallery) ---
let currentGalleryIndex = 0;
let currentProductImages = [];

function openProductDetails(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    // إعداد الصور
    currentProductImages = normalizeProductImages(product);

    if (product.videos && product.videos.length > 0) {
        product.videos.forEach(src => currentProductImages.push({type: 'video', src: src}));
    }

    currentGalleryIndex = 0;
    updateGallery();

    // تعبئة البيانات
    document.getElementById('modal-title').innerText = product.name;
    
    // --- عرض التفاصيل الكاملة (ميتا داتا) ---
    const oldPrice = product.originalPrice || product.oldPrice;
    const discountPercent = oldPrice ? Math.round(((oldPrice - product.price) / oldPrice) * 100) : 0;
    const hasTimer = product.offerEnds && new Date(product.offerEnds) > new Date();
    
    let metaHTML = '';
    
    // 1. شارة الحالة
    if (product.status) {
        metaHTML += `<span style="background:var(--primary); color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold; box-shadow:0 2px 5px rgba(0,0,0,0.1);">${product.status}</span>`;
    }
    
    // 2. شارة الخصم
    if (discountPercent > 0) {
        metaHTML += `<span style="background:#e74c3c; color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold; box-shadow:0 2px 5px rgba(231, 76, 60, 0.3);">خصم ${discountPercent}%</span>`;
    }
    
    // 3. حالة المخزون
    if (product.stock === 'out') {
        metaHTML += `<span style="background:#95a5a6; color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold;">نفدت الكمية ❌</span>`;
    } else {
        metaHTML += `<span style="background:#27ae60; color:white; padding:4px 12px; border-radius:20px; font-size:0.85rem; font-weight:bold;">متوفر: ${product.stock} ✅</span>`;
    }

    // 4. عداد العرض (كامل العرض)
    if (hasTimer) {
        metaHTML += `<div class="countdown-timer" data-ends="${product.offerEnds}" style="width:100%; text-align:center; margin-top:8px; font-size:1rem; padding:10px; background:#fff3cd; color:#d35400; border:1px dashed #e67e22; border-radius:8px; font-weight:bold;">جاري التحميل...</div>`;
    }

    const metaContainer = document.getElementById('modal-meta');
    if(metaContainer) metaContainer.innerHTML = metaHTML;
    // ---------------------------------------

    document.getElementById('modal-desc').innerText = product.description;
    
    // السعر
    const priceHTML = `
        ${oldPrice ? `<s style="color:#999; font-size:1.1rem; margin-left:10px;">${oldPrice} ج.م</s> ` : ''}
        <span style="font-size:1.5rem; color:var(--primary);">${product.price} ج.م</span>
    `;
    document.getElementById('modal-price-area').innerHTML = priceHTML;

    // المواصفات
    const specsHTML = product.specs ? 
        `<strong>المواصفات:</strong><ul style="margin:5px 20px 0 0;">${product.specs.map(s => `<li>${s}</li>`).join('')}</ul>` : '';
    document.getElementById('modal-specs').innerHTML = specsHTML;

    // زر الإضافة
    const btn = document.getElementById('modal-add-btn');
    if (product.stock === 'out') {
        btn.innerText = 'غير متوفر';
        btn.style.background = '#95a5a6';
        btn.onclick = null;
    } else {
        btn.innerText = 'إضافة للسلة';
        btn.style.background = 'var(--primary)';
        btn.onclick = () => { addToCart(product.id); closeProductModal(); };
    }

    // زر المفضلة في النافذة المنبثقة
    const wishlistBtn = document.getElementById('modal-wishlist-btn');
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const isInWishlist = wishlist.some(item => item.id === product.id);
    
    // دالة لتحديث شكل الزر في النافذة
    const updateModalWishlistUI = (active) => {
        const icon = wishlistBtn.querySelector('i');
        if (active) {
            wishlistBtn.style.background = '#ffebee';
            wishlistBtn.style.color = '#e74c3c';
            wishlistBtn.style.borderColor = '#e74c3c';
            icon.className = 'fas fa-heart';
        } else {
            wishlistBtn.style.background = '#f5f5f5';
            wishlistBtn.style.color = '#777';
            wishlistBtn.style.borderColor = '#ddd';
            icon.className = 'far fa-heart';
        }
    };
    updateModalWishlistUI(isInWishlist);

    wishlistBtn.onclick = () => {
        let currentWishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
        const index = currentWishlist.findIndex(item => item.id === product.id);
        
        // البحث عن الزر المقابل في الشبكة لتحديثه أيضاً
        const gridBtn = document.querySelector(`.wishlist-btn[onclick*="toggleWishlist(${product.id},"]`);
        
        if (index > -1) {
            currentWishlist.splice(index, 1);
            updateModalWishlistUI(false);
            if(gridBtn) gridBtn.classList.remove('active');
        } else {
            currentWishlist.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                addedAt: new Date().toISOString()
            });
            updateModalWishlistUI(true);
            if(gridBtn) gridBtn.classList.add('active');
        }
        localStorage.setItem('MASHILY_WISHLIST', JSON.stringify(currentWishlist));
        updateWishlistBadge();
    };

    // زر المشاركة
    const shareBtn = document.getElementById('modal-share-btn');
    if(shareBtn) {
        shareBtn.onclick = () => {
            const text = `شاهد هذا المنتج المميز من متجر مشالى: 🔥\n\n*${product.name}*\n\nالسعر: ${product.price} ج.م\n\n${product.description}\n\nرابط الصورة:\n${product.image}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        };
    }

    // إظهار النافذة
    document.getElementById('product-details-modal').style.display = 'flex';
}

function closeProductModal() {
    document.getElementById('product-details-modal').style.display = 'none';
}

function updateGallery() {
    const item = currentProductImages[currentGalleryIndex];
    const img = document.getElementById('modal-img');
    const videoContainer = document.getElementById('modal-video');
    const container = document.querySelector('.gallery-container');

    if (item.type === 'image') {
        img.style.display = 'block';
        videoContainer.style.display = 'none';
        videoContainer.innerHTML = ''; // إيقاف الفيديو عند الانتقال
        img.src = resolveProductImageUrl(item.src);
        container.style.cursor = 'zoom-in';
    } else {
        img.style.display = 'none';
        videoContainer.style.display = 'flex';
        videoContainer.innerHTML = `<video controls autoplay style="max-width:100%; max-height:100%; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2);"><source src="${item.src}" type="video/mp4">المتصفح لا يدعم الفيديو.</video>`;
        container.style.cursor = 'default';
    }
    
    // تحديث النقاط
    const dotsContainer = document.getElementById('modal-dots');
    dotsContainer.innerHTML = currentProductImages.map((_, i) => 
        `<div class="dot ${i === currentGalleryIndex ? 'active' : ''}" onclick="currentGalleryIndex=${i}; updateGallery()"></div>`
    ).join('');

    // تحديث المصغرات (Thumbnails)
    const thumbsContainer = document.getElementById('modal-thumbnails');
    if(thumbsContainer) {
        thumbsContainer.innerHTML = currentProductImages.map((item, i) => {
            const activeClass = i === currentGalleryIndex ? 'active' : '';
            if (item.type === 'image') {
                return `<img src="${resolveProductImageUrl(item.src)}" class="thumbnail-img ${activeClass}" onclick="currentGalleryIndex=${i}; updateGallery()">`;
            } else {
                return `<div class="thumbnail-img ${activeClass}" onclick="currentGalleryIndex=${i}; updateGallery()" style="display:flex; align-items:center; justify-content:center; background:#000; color:#fff; font-size:1.5rem; cursor:pointer; border-radius:8px; width:60px; height:60px;"><i class="fas fa-play"></i></div>`;
            }
        }).join('');
        
        // إخفاء المصغرات إذا كانت صورة واحدة فقط
        thumbsContainer.style.display = currentProductImages.length > 1 ? 'flex' : 'none';
    }
    
    // إخفاء الأسهم إذا صورة واحدة
    document.querySelectorAll('.gallery-btn').forEach(btn => btn.style.display = currentProductImages.length > 1 ? 'flex' : 'none');
}

function changeGalleryImage(dir) {
    currentGalleryIndex += dir;
    if (currentGalleryIndex >= currentProductImages.length) currentGalleryIndex = 0;
    if (currentGalleryIndex < 0) currentGalleryIndex = currentProductImages.length - 1;
    updateGallery();
}

// --- دالة تأثير التكبير (Zoom) ---
function setupZoomEffect() {
    const container = document.querySelector('.gallery-container');
    const img = document.getElementById('modal-img');

    if (!container || !img) return;

    let isClickedZoom = false; // حالة الزوم في وضع ملء الشاشة

    container.addEventListener('mousemove', function(e) {
        if (img.style.display === 'none') return; // لا تقم بالتكبير إذا كان المعروض فيديو

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // حساب النسبة المئوية لمكان الماوس
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        if (document.fullscreenElement) {
            // في وضع ملء الشاشة: التحريك فقط إذا كان الزوم مفعلاً بالنقر
            if (isClickedZoom) {
                img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            }
        } else {
            // في الوضع العادي: تكبير عند التحويم (Hover)
            img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            img.style.transform = "scale(2)"; 
        }
    });

    container.addEventListener('mouseleave', function() {
        if (!document.fullscreenElement) {
            img.style.transformOrigin = "center center";
            img.style.transform = "scale(1)";
        }
    });

    // إضافة النقر للتكبير في وضع ملء الشاشة
    container.addEventListener('click', function(e) {
        if (img.style.display === 'none') return; // لا تقم بالتكبير إذا كان المعروض فيديو
        if (e.target.closest('button')) return; // تجاهل الأزرار

        if (document.fullscreenElement) {
            isClickedZoom = !isClickedZoom;
            if (isClickedZoom) {
                img.style.transform = "scale(2.5)"; // تكبير أكبر
                img.style.cursor = "zoom-out";
                
                // تحديث المركز فوراً
                const rect = container.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const xPercent = (x / rect.width) * 100;
                const yPercent = (y / rect.height) * 100;
                img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
            } else {
                img.style.transform = "scale(1)";
                img.style.cursor = "zoom-in";
                img.style.transformOrigin = "center center";
            }
        }
    });

    // إعادة تعيين عند الخروج من ملء الشاشة
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            isClickedZoom = false;
            img.style.transform = "scale(1)";
            img.style.cursor = "zoom-in";
            img.style.transformOrigin = "center center";
        }
    });
}

// --- دالة تكبير الشاشة (Fullscreen) ---
function toggleFullscreen() {
    const container = document.querySelector('.gallery-container');
    if (!document.fullscreenElement) {
        if (container.requestFullscreen) container.requestFullscreen();
        else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen(); // Safari
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

// تغيير الأيقونة عند الدخول/الخروج من وضع ملء الشاشة
document.addEventListener('fullscreenchange', () => {
    const icon = document.querySelector('.fullscreen-btn i');
    if (document.fullscreenElement) {
        icon.classList.replace('fa-expand', 'fa-compress');
    } else {
        icon.classList.replace('fa-compress', 'fa-expand');
    }
});

// --- وظائف عرض المنتجات ببياناتها الجديدة ---
function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    
    console.log('renderProducts called with', items.length, 'items');
    
    if(items.length === 0) { 
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px; color:var(--color-text-secondary);">
                <i class="fas fa-box-open fa-3x" style="margin-bottom:1rem; opacity:0.4;"></i>
                <p style="font-size:1.125rem; font-weight:500; margin:0;">عذراً، لا توجد منتجات متوفرة حالياً!</p>
                <p style="font-size:0.875rem; margin:0.5rem 0 0 0;">يرجى المحاولة لاحقاً أو تحديث الصفحة</p>
            </div>
        `; 
        return; 
    }
    
    grid.innerHTML = items.map(p => createProductCard(p)).join('');
    console.log('Products rendered successfully');
}

// فتح/إغلاق بيانات الصنف عند الضغط على الصورة
function toggleProductInfo(element) {
    const card = element.closest('.product-card');
    const isAlreadyOpen = card.classList.contains('show-info');
    hideAllInfos(); // إغلاق أي بيانات أخرى مفتوحة
    if(!isAlreadyOpen) card.classList.add('show-info');
}

function hideAllInfos() {
    document.querySelectorAll('.product-card').forEach(c => c.classList.remove('show-info'));
}

// --- وظائف الأقسام ---
function renderCategories() {
    const catContainer = document.getElementById('product-cats');
    if(!catContainer) {
        console.log('لم يتم العثور على عنصر product-cats');
        return;
    }
    
    console.log('جاري عرض الأصناف...');
    
    let rawCats = JSON.parse(localStorage.getItem('storeCategories')) || [];
    console.log('الأصناف من localStorage:', rawCats.length);
    
    // إذا لم توجد أصناف، استخدم أصناف افتراضية
    if (rawCats.length === 0) {
        console.log('لم توجد أصناف في localStorage، استخدام الأصناف الافتراضية');
        rawCats = [
            { name: 'إلكترونيات', icon: 'fas fa-mobile-alt', description: 'الأجهزة الإلكترونية والهواتف' },
            { name: 'ملابس', icon: 'fas fa-tshirt', description: 'الملابس والأحذية' },
            { name: 'إكسسوارات', icon: 'fas fa-gem', description: 'الإكسسوارات والمجوهرات' },
            { name: 'كتب', icon: 'fas fa-book', description: 'الكتب والمجلات' },
            { name: 'رياضة', icon: 'fas fa-running', description: 'الرياضة واللياقة' },
            { name: 'منزل', icon: 'fas fa-home', description: 'مستلزمات المنزل' }
        ];
        localStorage.setItem('storeCategories', JSON.stringify(rawCats));
        console.log('تم حفظ الأصناف الافتراضية في localStorage');
    }
    
    // تحويل البيانات القديمة (نصوص) إلى كائنات لضمان التوافق
    let categoriesFromStorage = (rawCats.length > 0 && typeof rawCats[0] === 'string') 
        ? rawCats.map(c => ({ name: c, icon: 'fas fa-tag' })) 
        : rawCats;

    // التأكد من وجود قسم "الكل" دائماً في البداية وإزالة أي تكرار له من القائمة الأصلية
    const categories = [{name: 'الكل', icon: 'fas fa-layer-group'}, ...categoriesFromStorage.filter(c => c.name !== 'الكل')];
    console.log('الأصناف النهائية:', categories.length);
    
    catContainer.innerHTML = categories.map(cat => {
        let btn = `
        <button class="cat-btn ${currentCategory === cat.name ? 'active' : ''}" 
                onclick="window.filterByCategory('${cat.name}')">
            <i class="${cat.icon}"></i> ${cat.name === 'الكل' ? 'كل الأصناف' : cat.name}
        </button>`;
        
        // إضافة زر العروض المؤقتة بعد زر "الكل"
        if(cat.name === 'الكل') {
            btn += `
            <button class="cat-btn cat-btn-offer ${currentCategory === 'offers' ? 'active' : ''}" 
                    onclick="window.filterByCategory('offers')">
                <i class="fas fa-fire-alt"></i> 🔥 عروض خاصة
            </button>`;
        }
        return btn;
    }).join('');
    
    console.log('تم عرض الأصناف بنجاح');
}

function filterByCategory(cat) {
    currentCategory = cat;
    renderCategories(); // لتحديث اللون النشط
    
    console.log('=== بدء الفلترة ===');
    console.log('الصنف المطلوب:', cat);
    console.log('عدد المنتجات الكلي:', products.length);
    
    // عرض عينة من بيانات المنتجات للتحقق
    if (products.length > 0) {
        console.log('عينة من المنتجات:');
        products.slice(0, 3).forEach((p, i) => {
            console.log(`المنتج ${i}:`, {
                name: p.name,
                category: p.category,
                categories: p.categories
            });
        });
    }
    
    let filtered;
    if (cat === 'الكل') {
        filtered = products;
        console.log('عرض جميع المنتجات');
    } else if (cat === 'offers') {
        filtered = products.filter(p => p.offerEnds && new Date(p.offerEnds) > new Date());
        console.log('عرض العروض:', filtered.length);
    } else {
        // البحث عن المنتجات التي تحتوي على اسم الصنف
        filtered = products.filter(p => {
            // إذا كان المنتج له خاصية category
            if (p.category) {
                const match = p.category === cat || p.category.includes(cat);
                if (match) console.log('مطابقة بالتصنيف المباشر:', p.name);
                return match;
            }
            // إذا كان المنتج له خاصية categories (مصفوفة)
            if (p.categories && Array.isArray(p.categories)) {
                const match = p.categories.includes(cat);
                if (match) console.log('مطابقة بمصفوفة التصنيفات:', p.name);
                return match;
            }
            // مطابقة بالاسم (fallback)
            if (p.name && p.name.includes(cat)) {
                console.log('مطابقة بالاسم:', p.name);
                return true;
            }
            // إذا لم يوجد تصنيف، اعرض المنتج (fallback)
            console.log('المنتج بدون تصنيف:', p.name);
            return false;
        });
        console.log('نتيجة الفلترة:', filtered.length);
    }
    
    // تطبيق الترتيب
    if(currentSort === 'price_low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if(currentSort === 'price_high') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    console.log('المنتجات النهائية:', filtered.length);
    renderProducts(filtered);
    
    // فتح Modal للصنف (إذا لم يكن "الكل" أو "عروض")
    if (cat !== 'الكل' && cat !== 'offers') {
        openCategoryModal(cat, filtered);
    }
}

// --- وظائف Modal الصنف ---
function openCategoryModal(categoryName, products) {
    const modal = document.getElementById('category-modal');
    const categories = JSON.parse(localStorage.getItem('storeCategories')) || [];
    const category = categories.find(c => c.name === categoryName) || { name: categoryName, icon: 'fas fa-box', description: '' };
    
    // تعبئة البيانات
    document.getElementById('category-modal-title').textContent = category.name;
    document.getElementById('category-modal-desc').textContent = category.description || '';
    document.getElementById('category-modal-icon').innerHTML = `<i class="${category.icon}"></i>`;
    document.getElementById('category-modal-count').textContent = products.length;
    
    // عرض صور المنتجات
    const productsContainer = document.getElementById('category-modal-products');
    if (products.length === 0) {
        productsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 20px;">لا توجد منتجات في هذا الصنف</div>';
    } else {
        productsContainer.innerHTML = products.slice(0, 8).map(p => {
            const imageUrl = resolveProductImageUrl(p.image || (Array.isArray(p.images) ? p.images[0] : ''));
            return `
                <div style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--color-surface); cursor: pointer;" onclick="closeCategoryModal();">
                    <img src="${imageUrl}" alt="${p.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `;
        }).join('');
        
        if (products.length > 8) {
            productsContainer.innerHTML += `<div style="grid-column: 1/-1; text-align: center; color: var(--color-primary); font-size: 0.85rem; padding: 10px;">+${products.length - 8} منتج آخر</div>`;
        }
    }
    
    // عرض Modal
    modal.style.display = 'flex';
}

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    modal.style.display = 'none';
}

// إغلاق Modal عند النقر خارجها
document.addEventListener('click', function(event) {
    const modal = document.getElementById('category-modal');
    if (modal && modal.style.display === 'flex') {
        if (event.target === modal) {
            closeCategoryModal();
        }
    }
});

// جعل الدوال متاحة عالمياً
window.filterByCategory = filterByCategory;
window.closeCategoryModal = closeCategoryModal;
window.openCategoryModal = openCategoryModal;
window.openProductDetails = openProductDetails;
window.toggleWishlist = toggleWishlist;
window.addToCart = addToCart;
window.closeProductModal = closeProductModal;

// --- وظائف المفضلة (Wishlist) ---
function toggleWishlist(productId, event) {
    event.stopPropagation();
    let wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    const index = wishlist.findIndex(item => item.id === productId);
    
    if (index > -1) {
        // حذف من المفضلة
        wishlist.splice(index, 1);
        event.target.closest('.wishlist-btn').classList.remove('active');
    } else {
        // إضافة للمفضلة
        wishlist.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            addedAt: new Date().toISOString()
        });
        event.target.closest('.wishlist-btn').classList.add('active');
    }
    
    localStorage.setItem('MASHILY_WISHLIST', JSON.stringify(wishlist));
    updateWishlistBadge();
}

function updateWishlistBadge() {
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const badge = document.getElementById('wishlist-badge');
    if (badge) {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'block' : 'none';
    }
}

function showWishlist() {
    console.log('جاري فتح المفضلة...');
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const container = document.getElementById('wishlist-items');
    const sidebar = document.getElementById('wishlist-sidebar');
    const overlay = document.getElementById('overlay');
    
    console.log('عدد عناصر المفضلة:', wishlist.length);
    console.log('عنصر sidebar:', sidebar);
    console.log('عنصر overlay:', overlay);
    
    if (!sidebar) {
        console.error('لم يتم العثور على wishlist-sidebar');
        return;
    }
    
    if (wishlist.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px 20px; color:var(--color-text-secondary);">
                <i class="fas fa-heart fa-3x" style="margin-bottom:1rem; opacity:0.4;"></i>
                <p style="font-size:1rem; font-weight:500; margin:0;">لا توجد عناصر مفضلة حالياً</p>
                <p style="font-size:0.875rem; margin:0.5rem 0 0 0;">أضف منتجات للمفضلة للمتابعة</p>
            </div>
        `;
    } else {
        container.innerHTML = wishlist.map((item, index) => `
            <div style="background:var(--color-surface); padding:12px; border-radius:var(--radius-md); margin-bottom:12px; display:flex; gap:12px; align-items:center; border:1px solid var(--color-border); box-shadow: var(--shadow-sm);">
                <img src="${resolveProductImageUrl(item.image)}" alt="${item.name}" style="width:70px; height:70px; object-fit:contain; border-radius:var(--radius-md); background:white; border:1px solid var(--color-border);">
                <div style="flex:1;">
                    <h5 style="margin:0 0 4px 0; font-size:0.9rem; color:var(--color-text); font-weight:600;">${item.name}</h5>
                    <div style="color:var(--color-primary); font-weight:bold; font-size:0.95rem; margin-bottom:8px;">${item.price} ج.م</div>
                    <div style="display:flex; gap:8px;">
                        <button onclick="addToCart(${item.id}); showWishlist();" style="background:var(--color-primary); color:white; border:none; padding:6px 12px; border-radius:var(--radius-sm); font-size:0.8rem; cursor:pointer; flex:1; font-weight:600; transition: all 0.2s;">إضافة للسلة</button>
                        <button onclick="removeFromWishlist(${item.id}); showWishlist();" style="background:var(--color-danger); color:white; border:none; padding:6px 12px; border-radius:var(--radius-sm); font-size:0.8rem; cursor:pointer; font-weight:600; transition: all 0.2s;">حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    sidebar.classList.add('active');
    overlay.classList.add('active');
    console.log('تم فتح المفضلة');
}

function closeWishlist() {
    const sidebar = document.getElementById('wishlist-sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}

function removeFromWishlist(productId) {
    let wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    wishlist = wishlist.filter(item => item.id !== productId);
    localStorage.setItem('MASHILY_WISHLIST', JSON.stringify(wishlist));
    updateWishlistBadge();
    renderProducts(products);
}

// --- وظائف السلة ---
function addToCart(id) {
    let p = products.find(x => x.id === id);
    let f = cart.find(x => x.id === id);
    if(f) f.qty++; else cart.push({...p, qty: 1});
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    const badge = document.getElementById('cart-badge');
    
    let total = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
    let discountAmount = 0;

    // حساب الخصم إذا وجد كوبون
    if(appliedCoupon) {
        if(appliedCoupon.type === 'percent') {
            discountAmount = total * (appliedCoupon.value / 100);
        } else {
            discountAmount = appliedCoupon.value;
        }
    }
    let finalTotal = total - discountAmount;
    if(finalTotal < 0) finalTotal = 0;

    if(badge) badge.innerText = cart.reduce((s,i)=>s+i.qty, 0);
    
    // تحديث منطقة السعر في السلة
    const subtotalPrice = document.getElementById('subtotal-price');
    const discountPrice = document.getElementById('discount-price');
    const totalPrice = document.getElementById('total-price');
    const discountRow = document.getElementById('discount-row');
    
    if(subtotalPrice) subtotalPrice.textContent = total + ' ج.م';
    if(totalPrice) totalPrice.textContent = Math.floor(finalTotal);
    
    if(discountRow && discountPrice) {
        if(discountAmount > 0) {
            discountRow.style.display = 'flex';
            discountPrice.textContent = '-' + Math.floor(discountAmount) + ' ج.م';
        } else {
            discountRow.style.display = 'none';
        }
    }
    
    // تحديث منطقة السعر القديمة
    const totalArea = document.getElementById('cart-total-area');
    if(totalArea) {
        totalArea.innerHTML = `
            ${discountAmount > 0 ? `<div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#777; margin-bottom:5px;"><span>المجموع الفرعي:</span><span>${total} ج.م</span></div>` : ''}
            ${discountAmount > 0 ? `<div style="display:flex; justify-content:space-between; font-size:0.85rem; color:#27ae60; margin-bottom:5px;"><span>خصم (${appliedCoupon.code}):</span><span>-${Math.floor(discountAmount)} ج.م</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; align-items:center; font-weight:bold; border-top:${discountAmount > 0 ? '1px solid #ddd; padding-top:5px' : 'none'}">
                <span style="color:#555; font-size:0.9rem;">الإجمالي:</span>
                <div style="color:var(--primary); font-size:1.3rem; font-weight:900;">
                    <span id="total-price">${Math.floor(finalTotal)}</span> <small style="font-size:0.8rem; color:#777;">ج.م</small>
                </div>
            </div>
        `;
    }
    
    const container = document.getElementById('cart-items');
    if(!container) return;

    container.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; gap:12px; background:var(--color-surface); padding:12px; border-radius:var(--radius-md); margin-bottom:10px; border:1px solid var(--color-border); box-shadow: var(--shadow-sm); flex-shrink: 0;">
            <!-- الصورة -->
            <img src="${resolveProductImageUrl(item.image)}" style="width:60px; height:60px; object-fit:contain; background:white; border-radius:var(--radius-md); border:1px solid var(--color-border); flex-shrink: 0;">
            
            <!-- البيانات -->
            <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; min-width: 0;">
                <div>
                    <b style="font-size:0.85rem; color:var(--color-text); display:block; line-height:1.3; margin-bottom:4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</b>
                    <small style="color:var(--color-primary); font-weight:bold; font-size:0.9rem;">${item.price} ج.م</small>
                </div>
                
                <!-- الكمية والأزرار -->
                <div style="display:flex; align-items:center; gap:6px; margin-top:6px;">
                    <button onclick="changeQty(${idx},-1); return false;" style="width:24px; height:24px; background:var(--color-primary); color:white; border:none; border-radius:var(--radius-sm); cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; transition: all 0.2s; font-size:0.8rem;">−</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold; color:var(--color-text); font-size:0.85rem;">${item.qty}</span>
                    <button onclick="changeQty(${idx},1); return false;" style="width:24px; height:24px; background:var(--color-primary); color:white; border:none; border-radius:var(--radius-sm); cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; transition: all 0.2s; font-size:0.8rem;">+</button>
                    <button onclick="removeFromCart(${idx}); return false;" style="margin-right:auto; background:var(--color-danger); color:white; border:none; padding:4px 10px; border-radius:var(--radius-sm); cursor:pointer; font-size:0.75rem; font-weight:bold; transition: all 0.2s;">حذف</button>
                </div>
            </div>
        </div>
    `).join('') || `
        <div style="text-align:center; padding:40px 20px; color:var(--color-text-secondary);">
            <i class="fas fa-shopping-cart fa-3x" style="margin-bottom:1rem; opacity:0.4;"></i>
            <p style="margin:0; font-size:1rem; font-weight:500;">السلة فارغة</p>
            <p style="margin:0.5rem 0 0 0; font-size:0.875rem;">أضف بعض المنتجات للبدء</p>
        </div>
    `;
}

function changeQty(i,v){ cart[i].qty+=v; if(cart[i].qty<1) removeFromCart(i); updateCartUI(); }
function removeFromCart(i){ 
    cart.splice(i,1); 
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    updateCartUI(); 
}
function clearCart() {
    if(cart.length === 0) return;
    if(confirm('هل أنت متأكد من حذف جميع المنتجات من السلة؟')) {
        cart = [];
        appliedCoupon = null; // إلغاء الكوبون عند تفريغ السلة
        localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
        localStorage.removeItem('appliedCoupon');
        
        // إعادة تعيين واجهة الكوبون
        const couponMsg = document.getElementById('coupon-msg');
        if(couponMsg) couponMsg.innerText = '';
        
        const couponInput = document.getElementById('coupon-input');
        if(couponInput) couponInput.value = '';
        
        updateCartUI();
        console.log('Cart cleared successfully');
    }
}

function toggleCart(s){ 
    console.log('toggleCart called with:', s);
    const c = document.getElementById('cart-sidebar');
    const o = document.getElementById('overlay');
    console.log('cart-sidebar:', c);
    console.log('overlay:', o);
    if(s) { 
        c.classList.add('active'); 
        o.classList.add('active'); 
        console.log('Cart opened');
    } else { 
        c.classList.remove('active'); 
        o.classList.remove('active'); 
        console.log('Cart closed');
    }
}

// تبديل عرض معلومات فودافون كاش
function togglePayment(method) {
    selectedPaymentMethod = method;
    const vfInfo = document.getElementById('vodafone-info');
    const ipInfo = document.getElementById('instapay-info');
    if(vfInfo) vfInfo.style.display = method === 'vodafone' ? 'block' : 'none';
    if(ipInfo) ipInfo.style.display = method === 'instapay' ? 'block' : 'none';
}

// --- نظام الكوبونات ---
function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    const coupons = JSON.parse(localStorage.getItem('storeCoupons')) || [];
    const coupon = coupons.find(c => c.code === code);
    const msg = document.getElementById('coupon-msg');

    // حساب المجموع الفرعي للتحقق من الحد الأدنى
    let subTotal = cart.reduce((s,i)=>s+(i.price*i.qty), 0);

    if(coupon) {
        const today = new Date().toISOString().split('T')[0];
        // التحقق من تاريخ الصلاحية
        if (coupon.expiry && coupon.expiry < today) {
            appliedCoupon = null;
            msg.style.color = '#e74c3c';
            msg.innerText = '❌ هذا الكوبون منتهي الصلاحية.';
            updateCartUI();
            return;
        }
        // التحقق من الحد الأدنى للطلب
        if (coupon.minSpend && subTotal < coupon.minSpend) {
            appliedCoupon = null;
            msg.style.color = '#e74c3c';
            msg.innerText = `❌ يجب أن تكون قيمة السلة ${coupon.minSpend} ج.م على الأقل.`;
            updateCartUI();
            return;
        }

        appliedCoupon = coupon;
        msg.style.color = '#27ae60';
        msg.innerText = `✅ تم تطبيق خصم ${coupon.value}${coupon.type === 'percent' ? '%' : 'ج.م'}`;
    } else {
        appliedCoupon = null;
        msg.style.color = '#e74c3c';
        msg.innerText = '❌ الكوبون غير صحيح أو منتهي';
    }
    updateCartUI();
}

function sendToWhatsApp() {
    if(cart.length === 0) {
        alert('السلة فارغة! الرجاء إضافة منتجات أولاً.');
        return;
    }
    
    // معرفة طريقة الدفع المختارة
    const paymentMethod = selectedPaymentMethod;
    let paymentText = 'الدفع عند الاستلام';
    if (paymentMethod === 'vodafone') paymentText = 'فودافون كاش (يرجى مراجعة التحويل)';
    else if (paymentMethod === 'instapay') paymentText = 'InstaPay (يرجى مراجعة التحويل)';

    let details = cart.map(i => i.name + " (" + i.qty + ")").join(' , ');
    let history = JSON.parse(localStorage.getItem('orderHistory')) || [];
    history.unshift({ date: new Date().toLocaleString('ar-EG'), details: details });
    localStorage.setItem('orderHistory', JSON.stringify(history.slice(0, 15)));
    
    // جلب رقم الواتساب من الإعدادات أو استخدام الافتراضي
    const settings = JSON.parse(localStorage.getItem('storeSettings')) || {};
    const waNumber = settings.whatsapp || '201551831308';

    let msg = `طلب جديد من متجر مشالى:\n${details}\n`;
    if(appliedCoupon) {
        msg += `\n🎟️ كوبون خصم: ${appliedCoupon.code}`;
    }
    msg += `\n💰 الإجمالي النهائي: ${document.getElementById('total-price').innerText} ج.م\n💳 طريقة الدفع: ${paymentText}`;
    
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`);
}

// --- نظام البحث ---
function searchProducts() {
    let t = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(t)));
}

// --- نظام الترتيب ---
function sortProducts(sortType) {
    currentSort = sortType;
    filterByCategory(currentCategory); // إعادة تطبيق الفلتر مع الترتيب الجديد
}

// --- تأثير التحميل الذكي (Skeletons) ---
function showSkeletons() {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = Array(6).fill(0).map(() => `<div class="skeleton-card"></div>`).join('');
}

// نظام إشعارات المشترين المتعددة (قائمة تلقائية)
function showSocialProof() {
    // قائمة الإشعارات الافتراضية إذا لم يحدد المدير قائمة مخصصة
    const defaultMessages = [
        "أحمد من القاهرة اشترى رسيفر سيناتور 🔥",
        "محمد من المنصورة طلب قطعة واي فاي ⚡",
        "خالد من طنطا انضم للأكاديمية الآن ✅",
        "عميل جديد طلب وصلة HDMI أصلية 🔌",
        "تم شحن طلب جديد إلى الإسكندرية بنجاح 🚚"
    ];

    // جلب القائمة من لوحة المدير (مفصولة بفاصلة) أو استخدام الافتراضية
    const savedText = localStorage.getItem('proofText');
    const messages = savedText ? savedText.split(',') : defaultMessages;
    
    // اختيار رسالة عشوائية
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    let toast = document.getElementById('social-toast');
    if(!toast) {
        toast = document.createElement('div');
        toast.id = 'social-toast';
        toast.className = 'social-proof-toast';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `<i class="fas fa-bullhorn" style="margin-left:8px; color:var(--primary);"></i> ${randomMessage}`;
    toast.classList.add('show');
    
    setTimeout(() => { toast.classList.remove('show'); }, 5000);
}

// تشغيل إشعار كل 20 ثانية (رسالة مختلفة كل مرة)
setInterval(showSocialProof, 20000);

// --- تحديث العداد التنازلي للعروض ---
setInterval(() => {
    document.querySelectorAll('.countdown-timer').forEach(el => {
        const end = new Date(el.dataset.ends).getTime();
        const now = new Date().getTime();
        const diff = end - now;
        
        if(diff < 0) {
            el.innerHTML = "انتهى العرض ⌛";
            el.style.color = "#7f8c8d"; el.style.borderColor = "#ccc"; el.style.background = "#eee";
        } else {
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            el.innerHTML = `🔥 باقي ${d}ي ${h}س ${m}د ${s}ث`;
        }
    });
}, 1000);

// بدء العمل عند تحميل الصفحة
window.onload = init;

// --- الدخول السري للوحة التحكم ---
let adminClicks = 0;
function triggerAdmin() {
    adminClicks++;
    if(adminClicks === 5) {
        window.location.href = 'login.html'; // التوجيه لصفحة تسجيل الدخول بدلاً من admin.html
    }
    setTimeout(() => { adminClicks = 0; }, 1000); // إعادة التصفير إذا توقف النقر
}

// ===== نظام الفاتورة =====
let invoices = JSON.parse(localStorage.getItem('storeInvoices')) || [];

// إضافة بند جديد للفاتورة
function addInvoiceItem() {
    const container = document.getElementById('invoice-items-container');
    const itemRow = document.createElement('div');
    itemRow.className = 'invoice-item-row';
    itemRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;';
    
    itemRow.innerHTML = `
        <div class="form-group">
            <input type="text" class="item-name" placeholder="مثال: هارد SSD">
        </div>
        <div class="form-group">
            <input type="number" class="item-quantity" value="1" min="1" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
        </div>
        <div class="form-group">
            <input type="number" class="item-price" placeholder="0" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
        </div>
        <div class="form-group">
            <input type="number" class="item-total" readonly style="background: #f0f0f0;">
        </div>
        <button type="button" class="btn btn-danger btn-small" onclick="removeInvoiceItem(this)">حذف</button>
    `;
    
    container.appendChild(itemRow);
    updateInvoiceTotals();
}

// تحديث الإجمالي لكل بند
function updateInvoiceItemTotal(input) {
    const row = input.closest('.invoice-item-row');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    row.querySelector('.item-total').value = total.toFixed(2);
    updateInvoiceTotals();
}

// حذف بند من الفاتورة
function removeInvoiceItem(btn) {
    btn.closest('.invoice-item-row').remove();
    updateInvoiceTotals();
}

// تحديث الإجماليات
function updateInvoiceTotals() {
    const rows = document.querySelectorAll('.invoice-item-row');
    let subtotal = 0;
    
    rows.forEach(row => {
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        subtotal += total;
    });
    
    // عرض الإجمالي الفرعي
    const subtotalDisplay = document.getElementById('invoice-subtotal-display');
    if (subtotalDisplay) {
        subtotalDisplay.textContent = subtotal.toFixed(2) + ' ج.م';
    }
    
    // حساب الخصم
    const discountRate = parseFloat(document.getElementById('invoice-discount')?.value) || 0;
    const discount = (subtotal * discountRate) / 100;
    
    // حساب الإجمالي بعد الخصم
    const afterDiscount = subtotal - discount;
    
    // حساب الرسوم
    const feesRate = parseFloat(document.getElementById('invoice-fees')?.value) || 0;
    const fees = (afterDiscount * feesRate) / 100;
    
    // حساب الضريبة
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate')?.value) || 14;
    const tax = (afterDiscount * taxRate) / 100;
    
    // حساب الإجمالي النهائي
    const total = afterDiscount + fees + tax;
    
    // عرض الخصم
    const discountDisplay = document.getElementById('invoice-discount-display');
    if (discountDisplay) {
        discountDisplay.textContent = discount.toFixed(2) + ' ج.م';
    }
    
    // عرض الرسوم
    const feesDisplay = document.getElementById('invoice-fees-display');
    if (feesDisplay) {
        feesDisplay.textContent = fees.toFixed(2) + ' ج.م';
    }
    
    // عرض الضريبة
    const taxDisplay = document.getElementById('invoice-tax-display');
    if (taxDisplay) {
        taxDisplay.textContent = tax.toFixed(2) + ' ج.م';
    }
    
    // عرض الإجمالي النهائي
    const totalDisplay = document.getElementById('invoice-total-display');
    if (totalDisplay) {
        totalDisplay.textContent = total.toFixed(2) + ' ج.م';
    }
    
    return subtotal;
}

// إنشاء فاتورة جديدة
function createInvoice() {
    const invoiceNumber = document.getElementById('invoice-number').value.trim();
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('invoice-client-name').value.trim();
    const clientPhone = document.getElementById('invoice-client-phone').value.trim();
    const clientEmail = document.getElementById('invoice-client-email').value.trim();
    const clientAddress = document.getElementById('invoice-client-address').value.trim();
    const taxNumber = document.getElementById('invoice-tax-number').value.trim();
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 14;
    const discountRate = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const feesRate = parseFloat(document.getElementById('invoice-fees').value) || 0;
    const notes = document.getElementById('invoice-notes').value.trim();

    if (!invoiceNumber || !clientName || !invoiceDate) {
        alert('يرجى ملء البيانات الأساسية (رقم الفاتورة، اسم العميل، التاريخ)');
        return;
    }

    const items = [];
    const rows = document.querySelectorAll('.invoice-item-row');
    
    if (rows.length === 0) {
        alert('يرجى إضافة بند واحد على الأقل');
        return;
    }

    rows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;

        if (name && quantity > 0 && price > 0) {
            items.push({
                name,
                quantity,
                price,
                total: quantity * price
            });
        }
    });

    if (items.length === 0) {
        alert('يرجى ملء بيانات الأصناف بشكل صحيح');
        return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const fees = (afterDiscount * feesRate) / 100;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + fees + tax;

    // التحقق من وجود فاتورة قيد التعديل
    if (window.editingInvoiceId) {
        // تحديث الفاتورة الموجودة
        const invoice = invoices.find(inv => inv.id === window.editingInvoiceId);
        if (invoice) {
            invoice.invoiceNumber = invoiceNumber;
            invoice.date = invoiceDate;
            invoice.client = {
                name: clientName,
                phone: clientPhone,
                email: clientEmail,
                address: clientAddress
            };
            invoice.taxNumber = taxNumber;
            invoice.taxRate = taxRate;
            invoice.discountRate = discountRate;
            invoice.feesRate = feesRate;
            invoice.items = items;
            invoice.subtotal = subtotal;
            invoice.discount = discount;
            invoice.afterDiscount = afterDiscount;
            invoice.fees = fees;
            invoice.tax = tax;
            invoice.total = total;
            invoice.notes = notes;
            
            localStorage.setItem('storeInvoices', JSON.stringify(invoices));
            alert('✅ تم تحديث الفاتورة بنجاح!');
        }
    } else {
        // إنشاء فاتورة جديدة
        const invoice = {
            id: Date.now(),
            invoiceNumber,
            date: invoiceDate,
            client: {
                name: clientName,
                phone: clientPhone,
                email: clientEmail,
                address: clientAddress
            },
            taxNumber,
            taxRate,
            discountRate,
            feesRate,
            items,
            subtotal,
            discount,
            afterDiscount,
            fees,
            tax,
            total,
            notes,
            createdAt: new Date().toLocaleString('ar-EG')
        };

        invoices.push(invoice);
        localStorage.setItem('storeInvoices', JSON.stringify(invoices));
        alert('✅ تم إنشاء الفاتورة بنجاح!');
    }
    
    resetInvoiceForm();
    displayInvoicesList();
}

// مسح نموذج الفاتورة
function resetInvoiceForm() {
    document.getElementById('invoice-number').value = '';
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-client-name').value = '';
    document.getElementById('invoice-client-phone').value = '';
    document.getElementById('invoice-client-email').value = '';
    document.getElementById('invoice-client-address').value = '';
    document.getElementById('invoice-tax-number').value = '';
    document.getElementById('invoice-tax-rate').value = '14';
    document.getElementById('invoice-discount').value = '0';
    document.getElementById('invoice-fees').value = '0';
    document.getElementById('invoice-notes').value = '';
    
    const container = document.getElementById('invoice-items-container');
    container.innerHTML = '';
    addInvoiceItem(); // إضافة بند واحد فارغ
    updateInvoiceTotals(); // تحديث الإجماليات
    
    // مسح معرف الفاتورة المراد تعديلها
    window.editingInvoiceId = null;
    
    // استرجاع زر الإنشاء إلى حالته الأصلية
    const submitBtn = document.querySelector('button[onclick="createInvoice()"]');
    if (submitBtn) {
        submitBtn.textContent = '✅ إنشاء الفاتورة';
        submitBtn.style.background = '';
    }
}

// عرض قائمة الفواتير مع أزرار الإجراءات المحسّنة
function displayInvoicesList() {
    const tbody = document.getElementById('invoices-list-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #999; padding: 30px;">لا توجد فواتير محفوظة</td></tr>';
        return;
    }

    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong style="color: #0f172a;">${invoice.invoiceNumber}</strong></td>
            <td>${new Date(invoice.date).toLocaleDateString('ar-EG')}</td>
            <td><strong>${invoice.client.name}</strong></td>
            <td>${invoice.subtotal.toFixed(2)} ج.م</td>
            <td style="color: ${invoice.discount > 0 ? '#27ae60' : '#666'};">${(invoice.discount || invoice.tax || 0).toFixed(2)} ج.م</td>
            <td><strong style="color: #667eea; font-size: 1.05rem;">${invoice.total.toFixed(2)} ج.م</strong></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="viewInvoice(${invoice.id})" title="عرض الفاتورة" style="padding: 6px 8px;">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-small" onclick="editInvoice(${invoice.id})" title="تعديل الفاتورة" style="padding: 6px 8px; background: #3498db; color: white;">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-success btn-small" onclick="printInvoice(${invoice.id})" title="طباعة" style="padding: 6px 8px;">
                    <i class="fas fa-print"></i>
                </button>
                <button class="btn btn-info btn-small" onclick="downloadInvoicePDF(${invoice.id})" title="تحميل PDF" style="padding: 6px 8px;">
                    <i class="fas fa-download"></i>
                </button>
                <button class="btn btn-small" onclick="downloadInvoiceJPEG(${invoice.id})" title="تحميل JPEG" style="padding: 6px 8px; background: #e67e22; color: white;">
                    <i class="fas fa-image"></i>
                </button>
                <button class="btn btn-small" onclick="sendInvoiceWhatsApp('${invoice.invoiceNumber}', '${invoice.client.phone}', ${invoice.total})" title="إرسال واتس" style="padding: 6px 8px; background: #25d366; color: white;">
                    <i class="fab fa-whatsapp"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteInvoice(${invoice.id})" title="حذف" style="padding: 6px 8px;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// معاينة الفاتورة من النموذج
function previewInvoice() {
    const invoiceNumber = document.getElementById('invoice-number').value.trim();
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('invoice-client-name').value.trim();
    const clientPhone = document.getElementById('invoice-client-phone').value.trim();
    const clientEmail = document.getElementById('invoice-client-email').value.trim();
    const clientAddress = document.getElementById('invoice-client-address').value.trim();
    const taxNumber = document.getElementById('invoice-tax-number').value.trim();
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 14;
    const discountRate = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const feesRate = parseFloat(document.getElementById('invoice-fees').value) || 0;
    const notes = document.getElementById('invoice-notes').value.trim();

    if (!invoiceNumber || !clientName || !invoiceDate) {
        alert('يرجى ملء البيانات الأساسية (رقم الفاتورة، اسم العميل، التاريخ)');
        return;
    }

    const items = [];
    const rows = document.querySelectorAll('.invoice-item-row');
    
    if (rows.length === 0) {
        alert('يرجى إضافة بند واحد على الأقل');
        return;
    }

    rows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;

        if (name && quantity > 0 && price > 0) {
            items.push({ name, quantity, price, total: quantity * price });
        }
    });

    if (items.length === 0) {
        alert('يرجى ملء بيانات الأصناف بشكل صحيح');
        return;
    }

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const fees = (afterDiscount * feesRate) / 100;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + fees + tax;

    const invoice = {
        id: Date.now(),
        invoiceNumber,
        date: invoiceDate,
        client: { name: clientName, phone: clientPhone, email: clientEmail, address: clientAddress },
        taxNumber,
        taxRate,
        discountRate,
        feesRate,
        items,
        subtotal,
        discount,
        afterDiscount,
        fees,
        tax,
        total,
        notes,
        createdAt: new Date().toLocaleString('ar-EG')
    };

    displayInvoiceModal(invoice, true); // true = معاينة فقط
}

// عرض الفاتورة
function viewInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('الفاتورة غير موجودة');
        return;
    }

    displayInvoiceModal(invoice);
}

// عرض نافذة الفاتورة المحسّنة مع QR و الخصم والرسوم
function displayInvoiceModal(invoice, isPreview = false) {
    let modal = document.getElementById('invoice-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'invoice-modal';
        modal.style.cssText = 'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 4000; align-items: flex-start; justify-content: center; padding: 50px 20px; overflow-y: auto;';
        document.body.appendChild(modal);
    }

    let itemsHTML = '';
    invoice.items.forEach(item => {
        itemsHTML += '<tr>' +
            '<td style="padding: 12px; border: 1px solid #e2e8f0;">' + item.name + '</td>' +
            '<td style="text-align: center; padding: 12px; border: 1px solid #e2e8f0;">' + item.quantity + '</td>' +
            '<td style="text-align: right; padding: 12px; border: 1px solid #e2e8f0;">' + item.price.toFixed(2) + ' ج.م</td>' +
            '<td style="text-align: right; font-weight: bold; padding: 12px; border: 1px solid #e2e8f0;">' + item.total.toFixed(2) + ' ج.م</td>' +
            '</tr>';
    });

    // بناء القسم المالي
    let financialSection = '<div style="display: flex; justify-content: flex-end; margin-bottom: 20px;">' +
        '<div style="width: 380px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">' +
        '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; font-size: 0.95rem;">' +
        '<span>الإجمالي الفرعي:</span>' +
        '<span style="font-weight: bold;">' + invoice.subtotal.toFixed(2) + ' ج.م</span>' +
        '</div>';
    
    if (invoice.discountRate && invoice.discount > 0) {
        financialSection += '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; color: #27ae60; font-size: 0.95rem;">' +
            '<span>خصم (' + invoice.discountRate + '%):</span>' +
            '<span style="font-weight: bold;">-' + invoice.discount.toFixed(2) + ' ج.م</span>' +
            '</div>';
    }
    
    if (invoice.afterDiscount && invoice.afterDiscount !== invoice.subtotal) {
        financialSection += '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; font-size: 0.95rem; background: #f0f0f0; margin: 5px 0; padding: 10px;">' +
            '<span>الإجمالي بعد الخصم:</span>' +
            '<span style="font-weight: bold;">' + invoice.afterDiscount.toFixed(2) + ' ج.م</span>' +
            '</div>';
    }
    
    if (invoice.feesRate && invoice.fees > 0) {
        financialSection += '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; color: #e74c3c; font-size: 0.95rem;">' +
            '<span>رسوم التحصيل (' + invoice.feesRate + '%):</span>' +
            '<span style="font-weight: bold;">+' + invoice.fees.toFixed(2) + ' ج.م</span>' +
            '</div>';
    }
    
    financialSection += '<div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #ddd; font-size: 0.95rem;">' +
        '<span>الضريبة (' + invoice.taxRate + '%):</span>' +
        '<span style="font-weight: bold;">' + invoice.tax.toFixed(2) + ' ج.م</span>' +
        '</div>' +
        '<div style="display: flex; justify-content: space-between; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-weight: bold; border-radius: 6px; font-size: 1.15rem; margin-top: 8px;">' +
        '<span>المجموع النهائي:</span>' +
        '<span>' + invoice.total.toFixed(2) + ' ج.م</span>' +
        '</div>' +
        '</div>' +
        '</div>';

    let notesHTML = '';
    if (invoice.notes) {
        notesHTML = '<div style="background: linear-gradient(135deg, #fef5e715 0%, #fff9c415 100%); padding: 18px; border-radius: 10px; border-right: 5px solid #e67e22; margin-bottom: 25px; border: 2px solid #e67e2240;">' +
            '<p style="margin: 0; font-weight: bold; margin-bottom: 10px; color: #0f172a; font-size: 1.05rem;">ملاحظات وشروط:</p>' +
            '<p style="margin: 0; color: #555; white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">' + invoice.notes + '</p>' +
            '</div>';
    }

    let taxNumberHTML = '';
    if (invoice.taxNumber) {
        taxNumberHTML = '<p style="margin: 6px 0; color: #666; font-size: 0.9rem;">الرقم الضريبي: <strong>' + invoice.taxNumber + '</strong></p>';
    }

    modal.innerHTML = '<div style="background: white; width: 950px; max-width: 100%; padding: 30px; border-radius: 12px; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">' +
        '<button onclick="this.parentElement.parentElement.style.display=\'none\'" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #999; transition: 0.2s;"onmouseover="this.style.color=\'#f44336\'" onmouseout="this.style.color=\'#999\'">X</button>' +
        '<div id="invoice-content" style="border: 3px solid #0f172a; padding: 35px; font-family: \'Cairo\', sans-serif; color: #000; background: white;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0f172a; padding-bottom: 25px; margin-bottom: 30px;">' +
        '<div style="flex: 1;">' +
        '<h1 style="margin: 0; color: #0f172a; font-size: 2.2rem; font-weight: 900;">فاتورة</h1>' +
        '<p style="margin: 8px 0; color: #666; font-size: 0.95rem;"><strong>رقم الفاتورة:</strong> <span style="color: #0f172a; font-weight: bold; font-family: monospace;">' + invoice.invoiceNumber + '</span></p>' +
        '<p style="margin: 5px 0; color: #666; font-size: 0.95rem;"><strong>التاريخ:</strong> ' + new Date(invoice.date).toLocaleDateString('ar-EG') + '</p>' +
        '</div>' +
        '<div style="text-align: center; flex: 1;">' +
        '<p style="margin: 0; font-size: 3rem;">STORE</p>' +
        '<p style="margin: 5px 0; font-weight: bold; color: #0f172a; font-size: 1.1rem;">متجر مشالى</p>' +
        '<p style="margin: 3px 0; color: #e67e22; font-size: 0.9rem; font-weight: 600;">الإلكترونيات والتكنولوجيا</p>' +
        '</div>' +
        '<div id="invoice-qr" style="text-align: center; flex: 1;"></div>' +
        '</div>' +
        '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">' +
        '<div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 18px; border-radius: 10px; border: 2px solid #667eea40;">' +
        '<p style="margin: 0; font-weight: bold; color: #0f172a; margin-bottom: 10px; font-size: 1.05rem;">فاتورة إلى:</p>' +
        '<p style="margin: 6px 0; color: #0f172a; font-weight: 600; font-size: 1.05rem;">' + invoice.client.name + '</p>' +
        '<p style="margin: 5px 0; color: #666; font-size: 0.9rem;">' + invoice.client.phone + '</p>' +
        '<p style="margin: 5px 0; color: #666; font-size: 0.9rem;">' + invoice.client.email + '</p>' +
        '<p style="margin: 5px 0; color: #666; font-size: 0.9rem;">' + invoice.client.address + '</p>' +
        '</div>' +
        '<div style="background: linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%); padding: 18px; border-radius: 10px; border: 2px solid #f5576c40; text-align: right;">' +
        '<p style="margin: 0; font-weight: bold; color: #0f172a; margin-bottom: 10px; font-size: 1.05rem;">من:</p>' +
        '<p style="margin: 6px 0; font-weight: 600; color: #0f172a; font-size: 1.05rem;">متجر مشالى</p>' +
        taxNumberHTML +
        '<p style="margin: 6px 0; color: #666; font-size: 0.9rem;">التاريخ: <strong>' + new Date(invoice.date).toLocaleDateString('ar-EG') + '</strong></p>' +
        '</div>' +
        '</div>' +
        '<table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">' +
        '<thead>' +
        '<tr style="background: linear-gradient(135deg, #0f172a 0%, #1a2332 100%); color: white;">' +
        '<th style="border: 1px solid #ddd; padding: 14px; text-align: right; font-weight: 700;">البند</th>' +
        '<th style="border: 1px solid #ddd; padding: 14px; text-align: center; font-weight: 700;">الكمية</th>' +
        '<th style="border: 1px solid #ddd; padding: 14px; text-align: right; font-weight: 700;">السعر الواحد</th>' +
        '<th style="border: 1px solid #ddd; padding: 14px; text-align: right; font-weight: 700;">الإجمالي</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        itemsHTML +
        '</tbody>' +
        '</table>' +
        financialSection +
        notesHTML +
        '<div style="margin-top: 35px; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 25px; border-top: 2px solid #ddd;">' +
        '<div style="text-align: center; width: 200px;">' +
        '<p style="border-bottom: 2px solid #000; height: 60px; margin-bottom: 8px;"></p>' +
        '<p style="margin: 0; font-size: 0.95rem; color: #0f172a; font-weight: bold;">توقيع المسؤول</p>' +
        '</div>' +
        '<div style="text-align: center; flex: 1;">' +
        '<p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 1.1rem;">شكرا لتعاملكم معنا</p>' +
        '<p style="margin: 8px 0; color: #999; font-size: 0.85rem;">نتمنى لكم تجربة تسوق ممتعة وخدمة على أعلى مستوى</p>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div style="display: flex; gap: 12px; justify-content: center; margin-top: 25px; flex-wrap: wrap;">' +
        '<button class="btn btn-primary" onclick="printInvoiceWindow()" style="display: flex; align-items: center; gap: 8px;">' +
        '<i class="fas fa-print"></i> طباعة' +
        '</button>' +
        '<button class="btn btn-success" onclick="downloadInvoicePDFDirect()" style="display: flex; align-items: center; gap: 8px;">' +
        '<i class="fas fa-file-pdf"></i> PDF' +
        '</button>' +
        '<button class="btn" onclick="downloadInvoiceJPEGDirect()" style="display: flex; align-items: center; gap: 8px; background: #e67e22; color: white;">' +
        '<i class="fas fa-image"></i> JPEG' +
        '</button>' +
        '<button class="btn btn-info" onclick="sendInvoiceWhatsApp(\'' + invoice.invoiceNumber + '\', \'' + invoice.client.phone + '\', ' + invoice.total + ')" style="display: flex; align-items: center; gap: 8px;">' +
        '<i class="fab fa-whatsapp"></i> واتساب' +
        '</button>' +
        '<button class="btn btn-secondary" onclick="this.parentElement.parentElement.style.display=\'none\'" style="display: flex; align-items: center; gap: 8px;">' +
        '<i class="fas fa-times"></i> إغلاق' +
        '</button>' +
        '</div>' +
        '</div>';

    modal.style.display = 'flex';
    window.currentInvoice = invoice;

    // توليد QR Code بعد رسم الصفحة
    setTimeout(function() {
        const qrContainer = document.getElementById('invoice-qr');
        if (qrContainer && qrContainer.children.length === 0) {
            try {
                new QRCode(qrContainer, {
                    text: 'Invoice: ' + invoice.invoiceNumber + '|Client: ' + invoice.client.name + '|Amount: ' + invoice.total + '|Date: ' + invoice.date,
                    width: 130,
                    height: 130,
                    colorDark: '#0f172a',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } catch (e) {
                console.log('QR Code generation failed');
            }
        }
    }, 100);
}

// ارسال الفاتورة على الواتساب
function sendInvoiceWhatsApp(invoiceNumber, clientPhone, totalAmount) {
    if (!clientPhone) {
        alert('رقم هاتف العميل غير موجود');
        return;
    }

    let phone = clientPhone.replace(/^0/, '2');
    
    const invoiceDetails = window.currentInvoice;
    let itemsList = invoiceDetails.items.map(item => 
        item.name + ' x' + item.quantity + ' = ' + item.total.toFixed(2) + ' ج.م'
    ).join('%0A');

    let message = 'فاتورة من متجر مشالى%0A%0A';
    message += 'رقم الفاتورة: ' + invoiceNumber + '%0A';
    message += 'العميل: ' + invoiceDetails.client.name + '%0A%0A';
    message += 'البيانات:%0A' + itemsList + '%0A%0A';
    message += 'الملخص المالي:%0A';
    message += 'الاجمالي الفرعي: ' + invoiceDetails.subtotal.toFixed(2) + ' ج.م%0A';
    if (invoiceDetails.discountRate > 0) {
        message += 'الخصم (' + invoiceDetails.discountRate + '%): -' + invoiceDetails.discount.toFixed(2) + ' ج.م%0A';
    }
    if (invoiceDetails.feesRate > 0) {
        message += 'الرسوم (' + invoiceDetails.feesRate + '%): +' + invoiceDetails.fees.toFixed(2) + ' ج.م%0A';
    }
    message += 'الضريبة (' + invoiceDetails.taxRate + '%): ' + invoiceDetails.tax.toFixed(2) + ' ج.م%0A%0A';
    message += 'المجموع النهائي: ' + invoiceDetails.total.toFixed(2) + ' ج.م%0A%0A';
    message += 'شكرا لتعاملكم معنا';

    const whatsappURL = 'https://wa.me/' + phone + '?text=' + message;
    window.open(whatsappURL, '_blank');
}


// طباعة الفاتورة
function printInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => printInvoiceWindow(), 500);
}

function printInvoiceWindow() {
    window.print();
}

// تحميل الفاتورة كـ PDF
function downloadInvoicePDF(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => downloadInvoicePDFDirect(), 500);
}

function downloadInvoicePDFDirect() {
    const content = document.getElementById('invoice-content');
    if (!content) return;

    html2canvas(content, {
        scale: 2,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save(window.currentInvoice?.invoiceNumber + '.pdf');
    });
}

// تحميل الفاتورة كـ صورة JPEG
function downloadInvoiceJPEG(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => downloadInvoiceJPEGDirect(), 500);
}

function downloadInvoiceJPEGDirect() {
    const content = document.getElementById('invoice-content');
    if (!content) return;

    html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = window.currentInvoice?.invoiceNumber + '.jpeg';
        link.click();
    });
}

// تعديل الفاتورة الموجودة
function editInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert('لم يتم العثور على الفاتورة');
        return;
    }
    
    // ملء النموذج ببيانات الفاتورة
    document.getElementById('invoice-number').value = invoice.invoiceNumber || '';
    document.getElementById('invoice-date').value = invoice.date || '';
    document.getElementById('invoice-client-name').value = invoice.client.name || '';
    document.getElementById('invoice-client-phone').value = invoice.client.phone || '';
    document.getElementById('invoice-client-email').value = invoice.client.email || '';
    document.getElementById('invoice-client-address').value = invoice.client.address || '';
    document.getElementById('invoice-tax-number').value = invoice.taxNumber || '';
    document.getElementById('invoice-tax-rate').value = invoice.taxRate || '14';
    document.getElementById('invoice-discount').value = invoice.discountRate || '0';
    document.getElementById('invoice-fees').value = invoice.feesRate || '0';
    document.getElementById('invoice-notes').value = invoice.notes || '';
    
    // مسح البنود القديمة
    const container = document.getElementById('invoice-items-container');
    container.innerHTML = '';
    
    // إضافة بنود الفاتورة
    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'invoice-item-row';
            itemRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;';
            
            itemRow.innerHTML = `
                <div class="form-group">
                    <input type="text" class="item-name" value="${item.name || ''}" placeholder="مثال: هارد SSD">
                </div>
                <div class="form-group">
                    <input type="number" class="item-quantity" value="${item.quantity || 1}" min="1" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
                </div>
                <div class="form-group">
                    <input type="number" class="item-price" value="${item.price || 0}" placeholder="0" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
                </div>
                <div class="form-group">
                    <input type="number" class="item-total" value="${item.total || 0}" readonly style="background: #f0f0f0;">
                </div>
                <button type="button" class="btn btn-danger btn-small" onclick="removeInvoiceItem(this)">حذف</button>
            `;
            
            container.appendChild(itemRow);
        });
    } else {
        addInvoiceItem();
    }
    
    // تحديث الإجماليات
    updateInvoiceTotals();
    
    // تعيين معرف الفاتورة للتعديل
    window.editingInvoiceId = invoiceId;
    
    // تغيير نص الزر
    const submitBtn = document.querySelector('button[onclick="createInvoice()"]');
    if (submitBtn) {
        submitBtn.textContent = '✏️ حفظ التعديلات';
        submitBtn.style.background = '#3498db';
    }
    
    // التمرير إلى نموذج الفاتورة
    document.querySelector('a[href="#invoices"]').click();
    setTimeout(() => {
        document.getElementById('invoice-number').focus();
    }, 200);
}

// حذف الفاتورة
function deleteInvoice(invoiceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    
    invoices = invoices.filter(inv => inv.id !== invoiceId);
    localStorage.setItem('storeInvoices', JSON.stringify(invoices));
    displayInvoicesList();
    alert('✅ تم حذف الفاتورة بنجاح');
}

// تحديث قائمة الفواتير عند تحميل صفحة الفاتورة
function initInvoiceTab() {
    // تعيين تاريخ اليوم الحالي
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('invoice-date');
    if (dateInput && !dateInput.value) {
        dateInput.value = today;
    }

    // عرض قائمة الفواتير
    displayInvoicesList();

    // إضافة بند واحد فارغ في البداية
    const container = document.getElementById('invoice-items-container');
    if (container && container.children.length === 0) {
        addInvoiceItem();
    }
    
    // تحديث الإجماليات
    updateInvoiceTotals();
}

// استدعاء التهيئة عند تحميل الصفحة
window.addEventListener('load', init);

// ==========================================
// 🎓 نظام الأكاديمية (Academy System)
// ==========================================

// متغير لتتبع الفيديو الحالي المفتوح
let currentAcademyVideoId = null;
let currentAcademyCategory = 'الكل'; // لتتبع القسم الحالي

// --- نظام النقاط والمستويات ---
const ACADEMY_LEVELS = {
    'مبتدئ': { points: 0, next: 100 },
    'متعلم': { points: 100, next: 500 },
    'خبير': { points: 500, next: 1500 },
    'محترف': { points: 1500, next: 5000 },
    'أسطورة': { points: 5000, next: Infinity }
};

// تحميل إعدادات النقاط من لوحة التحكم أو استخدام الافتراضي
const savedPoints = JSON.parse(localStorage.getItem('storeAcademySettings')) || {};
const ACADEMY_POINTS = {
    WATCH: savedPoints.WATCH || 15,
    LIKE_VIDEO: savedPoints.LIKE_VIDEO || 5,
    COMMENT: savedPoints.COMMENT || 10
};

function getAcademyUser() {
    let user = JSON.parse(localStorage.getItem('academyUser'));
    if (!user) {
        user = { name: 'زائر', points: 0, level: 'مبتدئ', watchedVideos: [] };
        localStorage.setItem('academyUser', JSON.stringify(user));
    }
    return user;
}

function saveAcademyUser(user) { localStorage.setItem('academyUser', JSON.stringify(user)); }

function changeUsername() {
    const user = getAcademyUser();
    const newName = prompt("أدخل اسمك الجديد:", user.name);

    if (newName && newName.trim() !== "" && newName.trim().length <= 20) {
        user.name = newName.trim();
        saveAcademyUser(user);
        updateAcademyProfileUI();
        showAcademyNotification(`✅ تم تغيير اسمك إلى "${user.name}"`, 'success');
    } else if (newName !== null) {
        alert("الاسم غير صالح. يجب ألا يكون فارغاً وألا يتجاوز 20 حرفاً.");
    }
}

// دالة التشفير البسيطة (للتحقق من كلمات المرور)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; 
    }
    return Math.abs(hash).toString();
}

function initAcademyPage() {
    const grid = document.getElementById('academy-grid');
    if(!grid) return; // لسنا في صفحة الأكاديمية

    // عرض تأثير التحميل (Skeleton)
    grid.innerHTML = Array(8).fill(0).map(() => `
        <div class="skeleton-video">
            <div class="skeleton-vid-top"></div>
            <div class="skeleton-vid-bot">
                <div class="skeleton-line" style="width:70%"></div>
                <div class="skeleton-line" style="width:40%"></div>
            </div>
        </div>
    `).join('');

    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const catsContainer = document.getElementById('academy-cats');
    
    // عرض الأقسام
    const cats = ['الكل', ...new Set(videos.map(v => v.category))];
    if(catsContainer) {
        catsContainer.innerHTML = cats.map(c => 
            `<button class="cat-btn-chip ${c === 'الكل' ? 'active' : ''}" onclick="filterAcademy('${c}', this)">${c}</button>`
        ).join('');
    }

    // محاكاة وقت التحميل لإظهار التأثير
    setTimeout(() => {
        renderVideos(videos);
        applyAcademyFilters(); // استخدام دالة الفلترة الشاملة بدلاً من العرض المباشر
    }, 800);
}

function addPoints(pointsToAdd, reason) {
    const user = getAcademyUser();
    user.points += pointsToAdd;

    // Check for level up
    const currentLevelInfo = ACADEMY_LEVELS[user.level];
    if (user.points >= currentLevelInfo.next) {
        for (const levelName in ACADEMY_LEVELS) {
            if (user.points >= ACADEMY_LEVELS[levelName].points) {
                user.level = levelName;
            }
        }
        showAcademyNotification(`🎉 ترقية! لقد وصلت إلى مستوى ${user.level}`, 'level-up');
    } else {
        showAcademyNotification(`+${pointsToAdd} نقطة | ${reason}`, 'points');
    }

    saveAcademyUser(user);
    updateAcademyProfileUI();
}

function showAcademyNotification(message, type) {
    const notif = document.createElement('div');
    notif.className = `academy-notification ${type}`;
    notif.innerHTML = message;
    document.body.appendChild(notif);
    setTimeout(() => {
        notif.remove();
    }, 4000);
}

function updateAcademyProfileUI() {
    // سيتم ملء هذه الدالة لاحقاً
}


function renderVideos(list) {
    const grid = document.getElementById('academy-grid');
    if(!grid) return;

    if(list.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-light);">
            <i class="fas fa-video-slash fa-3x" style="margin-bottom:15px; opacity:0.5;"></i>
            <h3>لا توجد دروس حالياً</h3>
            <p>ترقبوا المزيد من المحتوى قريباً!</p>
        </div>`;
        return;
    }

    grid.innerHTML = list.map(v => {
        const isLocked = v.type === 'locked';
        const durationHTML = v.duration ? `<span class="video-duration">${v.duration}</span>` : '';
        return `
        <div class="video-card ${isLocked ? 'locked' : ''}" onclick="playVideo(${v.id})">
            <div class="video-thumbnail">
                <img src="${v.image || 'https://img.freepik.com/free-vector/online-tutorials-concept_52683-37480.jpg'}" alt="${v.title}">
                ${durationHTML}
                <div class="play-icon-overlay"><i class="fas ${isLocked ? 'fa-lock' : 'fa-play'}"></i></div>
            </div>
            <div class="video-content">
                <div class="video-meta">
                    <span class="video-cat">${v.category}</span>
                    <span style="font-size:0.7rem; opacity:0.7;"><i class="far fa-eye"></i> ${v.views || 0}</span>
                    <span class="video-status" style="color:${isLocked ? '#e74c3c' : '#27ae60'}">
                        <i class="fas ${isLocked ? 'fa-lock' : 'fa-unlock'}"></i> ${isLocked ? 'مشفر' : 'مجاني'}
                    </span>
                </div>
                <h3 class="video-title">${v.title}</h3>
                <button class="video-btn">
                    ${isLocked ? '<i class="fas fa-key"></i> أدخل الكود للمشاهدة' : '<i class="fas fa-play-circle"></i> مشاهدة الآن'}
                </button>
            </div>
        </div>
        `;
    }).join('');
}

function filterAcademy(cat, btn) {
    document.querySelectorAll('.cat-btn-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const filtered = cat === 'الكل' ? videos : videos.filter(v => v.category === cat);
    renderVideos(filtered);
    currentAcademyCategory = cat;
    applyAcademyFilters();
}

function searchAcademy() {
    applyAcademyFilters();
}

function sortAcademyVideos() {
    applyAcademyFilters();
}

// دالة مركزية لتطبيق كل الفلاتر (بحث + قسم + ترتيب)
function applyAcademyFilters() {
    let videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const term = document.getElementById('academy-search').value.toLowerCase();
    const sortType = document.getElementById('academy-sort').value;

    // 1. فلترة القسم
    if (currentAcademyCategory !== 'الكل') {
        videos = videos.filter(v => v.category === currentAcademyCategory);
    }

    // 2. فلترة البحث
    if (term) {
        videos = videos.filter(v => v.title.toLowerCase().includes(term));
    }

    // 3. الترتيب
    videos.sort((a, b) => {
        if (sortType === 'newest') return b.id - a.id; // الأحدث (بناءً على ID/Timestamp)
        if (sortType === 'oldest') return a.id - b.id;
        if (sortType === 'most_viewed') return (b.views || 0) - (a.views || 0);
        if (sortType === 'most_liked') return (b.likes || 0) - (a.likes || 0);
        return 0;
    });

    renderVideos(videos);
}

function playVideo(id) {
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === id);
    if(videoIndex === -1) return;

    // زيادة عدد المشاهدات
    videos[videoIndex].views = (videos[videoIndex].views || 0) + 1;
    localStorage.setItem('academyVideos', JSON.stringify(videos));
    
    const video = videos[videoIndex];

    // --- نظام النقاط: إضافة نقاط عند المشاهدة لأول مرة ---
    const user = getAcademyUser();
    if (!user.watchedVideos.includes(id)) {
        addPoints(ACADEMY_POINTS.WATCH, 'مشاهدة درس جديد');
        user.watchedVideos.push(id);
        saveAcademyUser(user);
    }

    currentAcademyVideoId = id; // حفظ المعرف الحالي

    if(video.type === 'locked') {
        const userPass = prompt("🔒 هذا المحتوى خاص ومشفر. الرجاء إدخال كود التفعيل:");
        if(!userPass || simpleHash(userPass) !== video.password) {
            alert("❌ كود التفعيل غير صحيح!");
            return;
        }
    }

    const modal = document.getElementById('video-player-modal');
    const container = document.getElementById('video-frame-container');
    const progressContainer = document.getElementById('video-progress-container');
    const progressBar = document.getElementById('video-progress-bar');
    const attachmentsContainer = document.getElementById('video-attachments-container');
    
    // إعادة تعيين الشريط
    if(progressBar) progressBar.style.width = '0%';
    if(progressContainer) progressContainer.style.display = 'none';
    if(attachmentsContainer) attachmentsContainer.innerHTML = '';

    let embedCode = '';
    if (video.url.includes('youtube') || video.url.includes('youtu.be')) {
        embedCode = `<iframe src="https://www.youtube.com/embed/${video.url.split('/').pop().split('v=')[1] || video.url.split('/').pop()}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    } else {
        embedCode = `<video id="active-academy-video" controls autoplay style="width:100%; height:100%;"><source src="${video.url}" type="video/mp4">المتصفح لا يدعم الفيديو.</video>`;
        if(progressContainer) progressContainer.style.display = 'block';
    }

    container.innerHTML = embedCode;
    modal.style.display = 'flex';

    // تفعيل شريط التقدم للفيديوهات المباشرة
    const videoPlayer = document.getElementById('active-academy-video');
    if(videoPlayer && progressBar) {
        videoPlayer.addEventListener('timeupdate', () => {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBar.style.width = `${percent}%`;
        });
    }

    // عرض المرفقات
    if(attachmentsContainer && video.attachments && video.attachments.length > 0) {
        attachmentsContainer.innerHTML = video.attachments.map(a => 
            `<a href="${a.url}" target="_blank" class="attachment-btn"><i class="fas fa-download"></i> ${a.name}</a>`
        ).join('');
    }

    // --- إعداد التفاعلات (لايك وتعليقات) ---
    setupVideoInteractions(video);
}

function updateAcademyProfileUI() {
    const user = getAcademyUser();
    const levelInfo = ACADEMY_LEVELS[user.level];
    
    document.getElementById('profile-username').innerText = user.name;
    document.getElementById('profile-level').innerText = user.level;

    if (levelInfo.next !== Infinity) {
        const pointsInLevel = user.points - levelInfo.points;
        const pointsForNextLevel = levelInfo.next - levelInfo.points;
        const progressPercent = (pointsInLevel / pointsForNextLevel) * 100;
        
        document.getElementById('profile-points').innerText = `${user.points} / ${levelInfo.next} نقطة`;
        document.getElementById('profile-progress').style.width = `${Math.min(progressPercent, 100)}%`;
    } else {
        // Max level
        document.getElementById('profile-points').innerText = `${user.points} نقطة`;
        document.getElementById('profile-progress').style.width = '100%';
    }
}

function setupVideoInteractions(video) {
    // 1. إعداد زر اللايك
    const likeBtn = document.getElementById('video-like-btn');
    const likeCount = document.getElementById('video-like-count');
    
    // التحقق مما إذا كان المستخدم قد أعجب بالفيديو سابقاً
    const userLikes = JSON.parse(localStorage.getItem('userLikes')) || [];
    const isLiked = userLikes.includes(video.id);
    
    if(isLiked) {
        likeBtn.classList.add('active');
        likeBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> <span id="video-like-count">${video.likes || 0}</span> أعجبني`;
    } else {
        likeBtn.classList.remove('active');
        likeBtn.innerHTML = `<i class="far fa-thumbs-up"></i> <span id="video-like-count">${video.likes || 0}</span> أعجبني`;
    }

    // 2. إعداد زر الديسلايك (Dislike)
    const dislikeBtn = document.getElementById('video-dislike-btn');
    const userDislikes = JSON.parse(localStorage.getItem('userDislikes')) || [];
    const isDisliked = userDislikes.includes(video.id);
    
    if(isDisliked) {
        dislikeBtn.classList.add('active', 'dislike-active');
        dislikeBtn.innerHTML = `<i class="fas fa-thumbs-down"></i> <span id="video-dislike-count">${video.dislikes || 0}</span> لم يعجبني`;
    } else {
        dislikeBtn.classList.remove('active', 'dislike-active');
        dislikeBtn.innerHTML = `<i class="far fa-thumbs-down"></i> <span id="video-dislike-count">${video.dislikes || 0}</span> لم يعجبني`;
    }

    // 3. عرض التعليقات
    renderCommentsList(video.comments || []);

    // 4. تحديث واجهة المستخدم لملف النقاط
    updateAcademyProfileUI();
}

function toggleVideoLike() {
    if(!currentAcademyVideoId) return;
    
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === currentAcademyVideoId);
    if(videoIndex === -1) return;
    
    let userLikes = JSON.parse(localStorage.getItem('userLikes')) || [];
    let userDislikes = JSON.parse(localStorage.getItem('userDislikes')) || [];
    const wasLiked = userLikes.includes(currentAcademyVideoId); // Check state before toggle
    const likeBtn = document.getElementById('video-like-btn');
    const dislikeBtn = document.getElementById('video-dislike-btn');
    
    // إذا كان المستخدم قد ضغط dislike سابقاً، نقوم بإزالته أولاً
    if(userDislikes.includes(currentAcademyVideoId)) {
        videos[videoIndex].dislikes = Math.max(0, (videos[videoIndex].dislikes || 0) - 1);
        userDislikes = userDislikes.filter(id => id !== currentAcademyVideoId);
        localStorage.setItem('userDislikes', JSON.stringify(userDislikes));
        
        // تحديث شكل زر الديسلايك
        dislikeBtn.classList.remove('active', 'dislike-active');
        dislikeBtn.innerHTML = `<i class="far fa-thumbs-down"></i> <span id="video-dislike-count">${videos[videoIndex].dislikes || 0}</span> لم يعجبني`;
    }
    
    if(userLikes.includes(currentAcademyVideoId)) {
        // إزالة اللايك
        videos[videoIndex].likes = Math.max(0, (videos[videoIndex].likes || 0) - 1);
        userLikes = userLikes.filter(id => id !== currentAcademyVideoId);
    }
}

// بدء التحديث التلقائي عند تحميل الصفحة
// تم إيقاف التحديث التلقائي لاستخدام الإدارة اليدوية
// if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
//     setTimeout(() => {
//         if (GOOGLE_SHEETS_CONFIG.apiKey !== 'YOUR_API_KEY_HERE' && GOOGLE_SHEETS_CONFIG.sheetId !== 'YOUR_SHEET_ID_HERE') {
//             startAutoUpdate(5);
//         }
//     }, 1000);
// }

// وظائف الكوبون في الهيدر
function toggleCouponInput() {
    const container = document.getElementById('coupon-input-container');
    const applied = document.getElementById('coupon-applied');
    
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'flex';
        applied.style.display = 'none';
    } else {
        container.style.display = 'none';
    }
}

function toggleCouponInputInCart() {
    const container = document.getElementById('coupon-input-container-in-cart');
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

function applyCouponFromHeader() {
    const couponCode = document.getElementById('coupon-input').value.trim();
    if (!couponCode) {
        alert('يرجى إدخال كود الكوبون');
        return;
    }
    
    // نسخ الكود إلى حقل الكوبون في السلة
    const couponInputInCart = document.querySelector('#cart-sidebar #coupon-input');
    if (couponInputInCart) {
        couponInputInCart.value = couponCode;
    }
    
    // استدعاء دالة applyCoupon الموجودة في السلة
    const couponBtn = document.querySelector('#cart-sidebar .apply-coupon-btn');
    if (couponBtn) {
        couponBtn.click();
    }
    
    // إخفاء حقل الإدخال
    document.getElementById('coupon-input-container').style.display = 'none';
    
    // عرض رسالة النجاح
    const applied = document.getElementById('coupon-applied');
    applied.style.display = 'block';
    applied.textContent = 'تم تطبيق الكوبون بنجاح!';
    
    setTimeout(() => {
        applied.style.display = 'none';
    }, 3000);
}

function toggleVideoDislike() {
    if(!currentAcademyVideoId) return;
    
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === currentAcademyVideoId);
    if(videoIndex === -1) return;
    
    let userLikes = JSON.parse(localStorage.getItem('userLikes')) || [];
    let userDislikes = JSON.parse(localStorage.getItem('userDislikes')) || [];
    const likeBtn = document.getElementById('video-like-btn');
    const dislikeBtn = document.getElementById('video-dislike-btn');
    
    // إذا كان المستخدم قد ضغط like سابقاً، نقوم بإزالته أولاً
    if(userLikes.includes(currentAcademyVideoId)) {
        videos[videoIndex].likes = Math.max(0, (videos[videoIndex].likes || 0) - 1);
        userLikes = userLikes.filter(id => id !== currentAcademyVideoId);
        localStorage.setItem('userLikes', JSON.stringify(userLikes));
        
        // تحديث شكل زر اللايك
        likeBtn.classList.remove('active');
        likeBtn.innerHTML = `<i class="far fa-thumbs-up"></i> <span id="video-like-count">${videos[videoIndex].likes || 0}</span> أعجبني`;
    }

    if(userDislikes.includes(currentAcademyVideoId)) {
        // إزالة الديسلايك
        videos[videoIndex].dislikes = Math.max(0, (videos[videoIndex].dislikes || 0) - 1);
        userDislikes = userDislikes.filter(id => id !== currentAcademyVideoId);
        dislikeBtn.classList.remove('active', 'dislike-active');
        dislikeBtn.innerHTML = `<i class="far fa-thumbs-down"></i> <span id="video-dislike-count">${videos[videoIndex].dislikes}</span> لم يعجبني`;
    } else {
        // إضافة ديسلايك
        videos[videoIndex].dislikes = (videos[videoIndex].dislikes || 0) + 1;
        userDislikes.push(currentAcademyVideoId);
        dislikeBtn.classList.add('active', 'dislike-active');
        dislikeBtn.innerHTML = `<i class="fas fa-thumbs-down"></i> <span id="video-dislike-count">${videos[videoIndex].dislikes}</span> لم يعجبني`;
    }
    
    localStorage.setItem('academyVideos', JSON.stringify(videos));
    localStorage.setItem('userDislikes', JSON.stringify(userDislikes));
}

function shareAcademyVideo() {
    if(!currentAcademyVideoId) return;
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const video = videos.find(v => v.id === currentAcademyVideoId);
    if(!video) return;
    
    const text = `شاهد هذا الدرس المميز من أكاديمية مشالى: \n\n*${video.title}*\n\n${video.desc || ''}`;
    
    // استخدام واجهة المشاركة الحديثة إذا كانت مدعومة
    if (navigator.share) {
        navigator.share({
            title: video.title,
            text: text,
            url: window.location.href
        }).catch(console.error);
    } else {
        // أو الفتح عبر واتساب
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
}

function submitComment() {
    if(!currentAcademyVideoId) return;
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if(!text) return;
    
    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === currentAcademyVideoId);
    if(videoIndex === -1) return;
    
    const user = getAcademyUser();
    const newComment = {
        id: Date.now(), // إضافة معرف فريد للتعليق
        user: user.name, // استخدام اسم المستخدم الحالي
        text: text,
        date: new Date().toLocaleDateString('ar-EG'),
        replies: [], // مصفوفة الردود
        likes: 0, // لإضافة الإعجابات على التعليقات
        isNew: true // إشعار للمدير
    };
    
    if(!videos[videoIndex].comments) videos[videoIndex].comments = [];
    videos[videoIndex].comments.unshift(newComment); // إضافة في البداية

    // --- نظام النقاط: إضافة نقاط عند التعليق ---
    addPoints(ACADEMY_POINTS.COMMENT, 'إضافة تعليق');
    
    localStorage.setItem('academyVideos', JSON.stringify(videos));
    renderCommentsList(videos[videoIndex].comments);
    input.value = ''; // مسح الحقل
}

function renderCommentsList(comments) {
    const list = document.getElementById('comments-list');
    if(!list) return;
    
    if(!comments || comments.length === 0) {
        list.innerHTML = '<p style="color:#777; font-size:0.9rem; text-align:center; padding:10px;">كن أول من يعلق!</p>';
        return;
    }
    
    const userCommentLikes = JSON.parse(localStorage.getItem('userCommentLikes')) || [];

    list.innerHTML = comments.map(c => {
        const isLiked = userCommentLikes.includes(c.id);
        const likeIcon = isLiked ? 'fas' : 'far';
        const likeBtnClass = isLiked ? 'active' : '';

        return `
        <div class="comment-item" id="comment-${c.id}">
            <div>
                <div class="comment-header">
                    <span class="comment-user"><i class="fas fa-user-circle"></i> ${c.user}</span>
                    <span>${c.date}</span>
                </div>
                <div class="comment-text" style="color:#ddd;">${c.text}</div>
                <div class="comment-actions">
                    <button class="reply-btn" onclick="showReplyForm(${c.id})"><i class="fas fa-reply"></i> رد</button>
                    <button class="like-comment-btn ${likeBtnClass}" onclick="toggleCommentLike(${c.id})">
                        <i class="${likeIcon} fa-thumbs-up"></i> <span>${c.likes || 0}</span>
                    </button>
                </div>
            </div>
            <div class="replies-container" id="replies-for-${c.id}">
                ${(c.replies || []).map(r => {
                    const isAdminReply = r.user === 'مشرف';
                    return `
                    <div class="comment-item reply-item ${isAdminReply ? 'admin-reply' : ''}">
                        <div class="comment-header">
                            <span class="comment-user"><i class="fas ${isAdminReply ? 'fa-user-shield' : 'fa-user-circle'}"></i> ${r.user}</span>
                            <span>${r.date}</span>
                        </div>
                        <div class="comment-text" style="color:#ccc;">${r.text}</div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `}).join('');
}

function toggleCommentLike(commentId) {
    if (!currentAcademyVideoId) return;

    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === currentAcademyVideoId);
    if (videoIndex === -1 || !videos[videoIndex].comments) return;

    // ابحث عن التعليق في القائمة الرئيسية
    let comment = videos[videoIndex].comments.find(c => c.id === commentId);
    // ملاحظة: يمكن توسيع هذا البحث ليشمل الردود في المستقبل

    if (!comment) return;

    let userCommentLikes = JSON.parse(localStorage.getItem('userCommentLikes')) || [];
    const likeIndex = userCommentLikes.indexOf(commentId);

    if (likeIndex > -1) {
        // إلغاء الإعجاب
        userCommentLikes.splice(likeIndex, 1);
        comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
        // إضافة إعجاب
        userCommentLikes.push(commentId);
        comment.likes = (comment.likes || 0) + 1;
    }

    localStorage.setItem('academyVideos', JSON.stringify(videos));
    localStorage.setItem('userCommentLikes', JSON.stringify(userCommentLikes));

    // إعادة عرض قائمة التعليقات لتحديث الواجهة
    renderCommentsList(videos[videoIndex].comments);
}

function showReplyForm(commentId) {
    // إزالة أي نموذج رد موجود مسبقاً
    const existingForm = document.querySelector('.reply-form-container');
    if (existingForm) {
        existingForm.remove();
    }

    const parentComment = document.getElementById(`comment-${commentId}`);
    if (!parentComment) return;

    const formContainer = document.createElement('div');
    formContainer.className = 'reply-form-container';
    formContainer.innerHTML = `
        <input type="text" id="reply-input-${commentId}" placeholder="اكتب ردك..." onkeypress="if(event.key==='Enter') submitReply(${commentId})">
        <button onclick="submitReply(${commentId})">نشر</button>
        <button class="cancel-reply" onclick="this.parentElement.remove()">إلغاء</button>
    `;

    parentComment.appendChild(formContainer);
    document.getElementById(`reply-input-${commentId}`).focus();
}

function submitReply(commentId) {
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    const text = replyInput.value.trim();
    if (!text) return;

    const videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    const videoIndex = videos.findIndex(v => v.id === currentAcademyVideoId);
    if (videoIndex === -1 || !videos[videoIndex].comments) return;

    const parentComment = videos[videoIndex].comments.find(c => c.id === commentId);
    if (!parentComment) return;

    const newReply = { user: 'مشرف', text: text, date: new Date().toLocaleDateString('ar-EG') };
    if (!parentComment.replies) parentComment.replies = [];
    parentComment.replies.push(newReply);

    localStorage.setItem('academyVideos', JSON.stringify(videos));
    renderCommentsList(videos[videoIndex].comments);
}

function closeVideoModal() {
    document.getElementById('video-player-modal').style.display = 'none';
    document.getElementById('video-frame-container').innerHTML = '';

}
