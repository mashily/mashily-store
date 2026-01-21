let products = [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let currentCategory = 'الكل';
let currentSort = 'default';

async function init() {
    // محاولة جلب البيانات من السيرفر (GitHub)
    try {
        const response = await fetch('db.json?v=' + new Date().getTime()); // منع التخزين المؤقت
        if (response.ok) {
            const data = await response.json();
            // تحديث البيانات المحلية ببيانات السيرفر
            if(data.products) localStorage.setItem('storeProducts', JSON.stringify(data.products));
            if(data.categories) localStorage.setItem('storeCategories', JSON.stringify(data.categories));
            if(data.videos) localStorage.setItem('academyVideos', JSON.stringify(data.videos));
            if(data.ticker) localStorage.setItem('tickerText', data.ticker);
            if(data.proof) localStorage.setItem('proofText', data.proof);
        }
    } catch (e) {
        console.log('وضع الأوفلاين أو لم يتم رفع ملف db.json بعد');
    }

    // تحميل البيانات للمتغيرات
    products = JSON.parse(localStorage.getItem('storeProducts')) || [];

    // 1. تطبيق الثيم المحفوظ (ليلي / نهاري)
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeIcon = document.getElementById('theme-icon');
    if(themeIcon) themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

    // 2. تحديث شريط الأخبار السفلي
    const ticker = document.getElementById('ticker-text');
    if(ticker) ticker.innerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في متجر مشالى للإلكترونيات - جودة نثق بها 🔥";

    // 3. عرض الأقسام والمنتجات مع تأثير التحميل
    renderCategories();
    showSkeletons();
    setTimeout(() => {
        renderProducts(products);
    }, 700);

    updateCartUI();

    // 4. مستمع لوحة المفاتيح (إغلاق السلة أو بيانات المنتج بـ ESC)
    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            toggleCart(false);
            hideAllInfos();
        }
    });
}

// --- وظائف الوضع الليلي ---
function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const target = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', target);
    localStorage.setItem('theme', target);
    document.getElementById('theme-icon').className = target === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// دالة مساعدة لإنشاء كارت المنتج (لإعادة الاستخدام)
function createProductCard(p) {
    const isOut = p.stock === 'out';
    const hasTimer = p.offerEnds && new Date(p.offerEnds) > new Date();
    
    return `
    <div class="product-card" onmouseleave="hideAllInfos()">
        <div class="img-container" onclick="toggleProductInfo(this)">
            ${!isOut ? `<div class="pro-badge ${p.status==='عرض خاص'?'offer':''}">${p.status || 'مميز ✨'}</div>` : ''}
            <img src="${p.image}" alt="${p.name}" style="${isOut ? 'filter: grayscale(100%); opacity: 0.6;' : ''}">
            ${isOut ? '<div class="out-badge">نفدت الكمية ❌</div>' : ''}
            <div class="product-info-overlay">${p.desc || 'منتج أصلي من متجر مشالي'}</div>
        </div>
        <div class="product-details">
            <h4>${p.name}</h4>
            <div class="price-tag">
                ${p.oldPrice ? `<s style="color:#95a5a6; font-size:0.8rem; margin-left:5px;">${p.oldPrice}</s>` : ''}
                ${p.price} ج.م
            </div>
            ${hasTimer ? `<div class="countdown-timer" data-ends="${p.offerEnds}">جاري التحميل...</div>` : ''}
            <button class="qty-btn" style="background:${isOut?'#95a5a6':'var(--primary)'}" 
                onclick="${isOut ? "alert('عذراً، المنتج غير متوفر حالياً')" : `addToCart(${p.id})`}">
                ${isOut ? 'غير متوفر' : 'إضافة للسلة'}
            </button>
        </div>
    </div>
    `;
}

// --- وظائف عرض المنتجات ببياناتها الجديدة ---
function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    if(items.length === 0) { grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:50px; opacity:0.5;'>لا توجد منتجات حالياً في هذا القسم</p>"; return; }
    
    grid.innerHTML = items.map(p => createProductCard(p)).join('');
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
    if(!catContainer) return;
    let rawCats = JSON.parse(localStorage.getItem('storeCategories')) || [];
    
    // تحويل البيانات القديمة (نصوص) إلى كائنات لضمان التوافق
    let categoriesFromStorage = (rawCats.length > 0 && typeof rawCats[0] === 'string') 
        ? rawCats.map(c => ({ name: c, icon: 'fas fa-tag' })) 
        : rawCats;

    // التأكد من وجود قسم "الكل" دائماً في البداية وإزالة أي تكرار له من القائمة الأصلية
    const categories = [{name: 'الكل', icon: 'fas fa-layer-group'}, ...categoriesFromStorage.filter(c => c.name !== 'الكل')];
    
    catContainer.innerHTML = categories.map(cat => {
        let btn = `
        <button class="cat-btn ${currentCategory === cat.name ? 'active' : ''}" 
                onclick="filterByCategory('${cat.name}')">
            <i class="${cat.icon}"></i> ${cat.name === 'الكل' ? 'كل الأصناف' : cat.name}
        </button>`;
        
        // إضافة زر العروض المؤقتة بعد زر "الكل"
        if(cat.name === 'الكل') {
            btn += `
            <button class="cat-btn cat-btn-offer ${currentCategory === 'offers' ? 'active' : ''}" 
                    onclick="filterByCategory('offers')">
                <i class="fas fa-fire-alt"></i> عروض مؤقتة
            </button>`;
        }
        return btn;
    }).join('');
}

function filterByCategory(cat) {
    currentCategory = cat;
    renderCategories(); // لتحديث اللون النشط
    
    let filtered;
    if (cat === 'الكل') filtered = products;
    else if (cat === 'offers') filtered = products.filter(p => p.offerEnds && new Date(p.offerEnds) > new Date());
    else filtered = products.filter(p => p.category === cat);
    
    // تطبيق الترتيب
    if(currentSort === 'price_low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if(currentSort === 'price_high') {
        filtered.sort((a, b) => b.price - a.price);
    }
    
    renderProducts(filtered);
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
    const total = document.getElementById('total-price');
    
    if(badge) badge.innerText = cart.reduce((s,i)=>s+i.qty, 0);
    if(total) total.innerText = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
    
    const container = document.getElementById('cart-items');
    if(!container) return;

    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-compact">
            <img src="${item.image}" class="cart-item-img">
            <div style="flex:1;">
                <b style="font-size:0.8rem; display:block; line-height:1.2;">${item.name}</b>
                <small style="color:var(--primary); font-weight:bold;">${item.price} ج.م</small>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx},1)" style="width:22px; height:22px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer;">+</button>
                <span style="font-weight:bold; font-size:0.9rem;">${item.qty}</span>
                <button onclick="changeQty(${idx},-1)" style="width:22px; height:22px; background:#ddd; border:none; border-radius:4px; cursor:pointer;">-</button>
                <button onclick="removeFromCart(${idx})" style="color:#e74c3c; background:none; border:none; margin-right:5px; cursor:pointer;"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>
    `).join('') || `
        <div style="text-align:center; padding:40px 20px; opacity:0.5;">
            <i class="fas fa-shopping-basket fa-3x" style="margin-bottom:10px;"></i>
            <p>السلة فارغة حالياً</p>
        </div>
    `;
}

function changeQty(i,v){ cart[i].qty+=v; if(cart[i].qty<1) removeFromCart(i); updateCartUI(); }
function removeFromCart(i){ cart.splice(i,1); updateCartUI(); }
function clearCart() {
    if(cart.length === 0) return;
    if(confirm('هل أنت متأكد من حذف جميع المنتجات من السلة؟')) {
        cart = [];
        updateCartUI();
    }
}

function toggleCart(s){ 
    const c = document.getElementById('cart-sidebar');
    const o = document.getElementById('overlay');
    if(s) { c.classList.add('active'); o.classList.add('active'); }
    else { c.classList.remove('active'); o.classList.remove('active'); }
}

// تبديل عرض معلومات فودافون كاش
function togglePayment(method) {
    const info = document.getElementById('vodafone-info');
    if(info) info.style.display = method === 'vodafone' ? 'block' : 'none';
}

function sendToWhatsApp() {
    if(cart.length === 0) return;
    
    // معرفة طريقة الدفع المختارة
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const paymentText = paymentMethod === 'vodafone' ? 'فودافون كاش (يرجى مراجعة التحويل)' : 'الدفع عند الاستلام';

    let details = cart.map(i => i.name + " (" + i.qty + ")").join(' , ');
    let history = JSON.parse(localStorage.getItem('orderHistory')) || [];
    history.unshift({ date: new Date().toLocaleString('ar-EG'), details: details });
    localStorage.setItem('orderHistory', JSON.stringify(history.slice(0, 15)));
    
    const msg = `طلب جديد من متجر مشالى:\n${details}\n\n💰 الإجمالي: ${document.getElementById('total-price').innerText} ج.م\n💳 طريقة الدفع: ${paymentText}`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
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
        window.location.href = 'manager.html';
    }
    setTimeout(() => { adminClicks = 0; }, 1000); // إعادة التصفير إذا توقف النقر
}