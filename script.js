let products = [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let currentCategory = 'الكل';
let currentSort = 'default';
let appliedCoupon = null;
let selectedPaymentMethod = 'cash';

async function init() {
    // التحقق مما إذا كان المستخدم مديراً (لتجنب مسح التعديلات المحلية عند التحديث)
    const isAdmin = sessionStorage.getItem('mashily_user');

    if (!isAdmin) {
        // محاولة جلب البيانات من السيرفر (GitHub) للزوار فقط
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
                if(data.coupons) localStorage.setItem('storeCoupons', JSON.stringify(data.coupons));
            }
        } catch (e) {
            console.log('وضع الأوفلاين أو لم يتم رفع ملف db.json بعد');
        }
    }

    // تحميل البيانات للمتغيرات
    products = JSON.parse(localStorage.getItem('storeProducts')) || [];

    // --- إضافة منتج تجريبي (للتجربة) ---
    // هذا المنتج سيظهر دائماً في البداية لتجربة التصميم الجديد
    if (!products.some(p => p.id === 9999)) {
        products.unshift({
            id: 9999,
            name: "ساعة ذكية Ultra Pro (منتج تجريبي)",
            price: 1250,
            originalPrice: 1800,
            image: "https://img.freepik.com/free-photo/smart-watch-space-gray-aluminum-case-black-sport-band_1057-27347.jpg",
            images: [
                "https://img.freepik.com/free-photo/smart-watch-space-gray-aluminum-case-black-sport-band_1057-27347.jpg",
                "https://img.freepik.com/free-vector/realistic-fitness-trackers_23-2148530529.jpg",
                "https://img.freepik.com/free-photo/rendering-smart-home-device_23-2151039302.jpg"
            ],
            category: "الكل",
            stock: 5,
            status: "تجربة ✨",
            desc: "هذا منتج تجريبي لاختبار شكل النافذة الجديد ومعرض الصور. يتميز هذا المنتج بوجود صور متعددة ومواصفات كاملة لتجربة التكبير والتنسيق.",
            specs: ["شاشة AMOLED عالية الدقة", "بطارية تدوم طويلاً", "مقاومة للماء IP68", "دعم كامل للغة العربية", "حساسات رياضية دقيقة"]
        });
    }

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
    renderCategories();
    showSkeletons();
    setTimeout(() => {
        renderProducts(products);
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
    
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
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
    
    // إغلاق القائمة
    const menu = document.getElementById('theme-menu');
    if(menu) menu.style.display = 'none';
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

// دالة مساعدة لإنشاء كارت المنتج (لإعادة الاستخدام)
function createProductCard(p) {
    const isOut = p.stock === 'out';
    const hasTimer = p.offerEnds && new Date(p.offerEnds) > new Date();
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const isInWishlist = wishlist.some(item => item.id === p.id);
    const oldPrice = p.originalPrice || p.oldPrice;
    const discountPercent = oldPrice ? Math.round(((oldPrice - p.price) / oldPrice) * 100) : 0;
    
    return `
    <div class="product-card" onmouseleave="hideAllInfos()">
        <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${p.id}, event)" title="${isInWishlist ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">
            <i class="fas fa-heart"></i>
        </button>
        <div class="img-container" onclick="openProductDetails(${p.id})">
            ${!isOut ? `<div class="pro-badge ${p.status==='عرض خاص'?'offer':''}">${p.status || 'مميز ✨'}</div>` : ''}
            ${discountPercent > 0 ? `<div style="position:absolute;bottom:10px;left:10px;background:#e74c3c;color:white;padding:4px 8px;border-radius:6px;font-size:0.75rem;font-weight:bold;">-${discountPercent}%</div>` : ''}
            <img src="${p.image}" alt="${p.name}" style="${isOut ? 'filter: grayscale(100%); opacity: 0.6;' : ''}">
            ${isOut ? '<div class="out-badge">نفدت الكمية ❌</div>' : ''}
            <div class="product-info-overlay">${p.desc || 'منتج أصلي من متجر مشالي'}</div>
        </div>
        <div class="product-details">
            <h4>${p.name}</h4>
            <div class="price-tag">
                ${oldPrice ? `<s style="color:#95a5a6; font-size:0.8rem; margin-left:5px;">${oldPrice}</s>` : ''}
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

// --- وظائف نافذة تفاصيل المنتج (Modal & Gallery) ---
let currentGalleryIndex = 0;
let currentProductImages = [];

function openProductDetails(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    // إعداد الصور
    currentProductImages = product.images && product.images.length > 0 ? product.images : [product.image];
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
    const img = document.getElementById('modal-img');
    img.src = currentProductImages[currentGalleryIndex];
    
    // تحديث النقاط
    const dotsContainer = document.getElementById('modal-dots');
    dotsContainer.innerHTML = currentProductImages.map((_, i) => 
        `<div class="dot ${i === currentGalleryIndex ? 'active' : ''}" onclick="currentGalleryIndex=${i}; updateGallery()"></div>`
    ).join('');
    
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

    container.addEventListener('mousemove', function(e) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // حساب النسبة المئوية لمكان الماوس
        const xPercent = (x / rect.width) * 100;
        const yPercent = (y / rect.height) * 100;
        
        // تحريك نقطة الارتكاز وتكبير الصورة
        img.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        img.style.transform = "scale(2)"; // نسبة التكبير
    });

    container.addEventListener('mouseleave', function() {
        img.style.transformOrigin = "center center";
        img.style.transform = "scale(1)";
    });
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
    const wishlist = JSON.parse(localStorage.getItem('MASHILY_WISHLIST')) || [];
    const container = document.getElementById('wishlist-items');
    const sidebar = document.getElementById('wishlist-sidebar');
    const overlay = document.getElementById('overlay');
    
    if (wishlist.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">لا توجد عناصر مفضلة حالياً</div>';
    } else {
        container.innerHTML = wishlist.map((item, index) => `
            <div style="background:var(--card-bg); padding:10px; border-radius:8px; margin-bottom:10px; display:flex; gap:10px; align-items:center; border:1px solid var(--border);">
                <img src="${item.image}" alt="${item.name}" style="width:60px; height:60px; object-fit:contain; border-radius:6px; background:white; padding:5px;">
                <div style="flex:1;">
                    <h5 style="margin:0 0 3px 0; font-size:0.85rem; color:var(--text);">${item.name}</h5>
                    <div style="color:var(--primary); font-weight:bold; font-size:0.9rem; margin-bottom:5px;">${item.price} ج.م</div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="addToCart(${item.id}); showWishlist();" style="background:var(--primary); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer; flex:1;">إضافة للسلة</button>
                        <button onclick="removeFromWishlist(${item.id}); showWishlist();" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:0.7rem; cursor:pointer;">حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    sidebar.classList.add('active');
    overlay.classList.add('active');
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
    
    // تحديث منطقة السعر
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
        <div style="display:flex; gap:10px; background:var(--bg); padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid var(--border);">
            <!-- الصورة -->
            <img src="${item.image}" style="width:60px; height:60px; object-fit:contain; background:#fff; border-radius:6px; border:1px solid var(--border);">
            
            <!-- البيانات -->
            <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <b style="font-size:0.85rem; color:var(--text); display:block; line-height:1.2; margin-bottom:2px;">${item.name}</b>
                    <small style="color:var(--primary); font-weight:bold; font-size:0.9rem;">${item.price} ج.م</small>
                </div>
                
                <!-- الكمية والأزرار -->
                <div style="display:flex; align-items:center; gap:5px; margin-top:5px;">
                    <button onclick="changeQty(${idx},-1); return false;" style="width:24px; height:24px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">−</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold; color:var(--text);">${item.qty}</span>
                    <button onclick="changeQty(${idx},1); return false;" style="width:24px; height:24px; background:var(--primary); color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center;">+</button>
                    <button onclick="removeFromCart(${idx}); return false;" style="margin-right:auto; background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:0.75rem; font-weight:bold;">حذف</button>
                </div>
            </div>
        </div>
    `).join('') || `
        <div style="text-align:center; padding:40px 20px; color:var(--text-light);">
            <i class="fas fa-shopping-basket fa-3x" style="margin-bottom:10px; opacity:0.5;"></i>
            <p style="margin:10px 0 0 0; font-size:0.9rem;">السلة فارغة</p>
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
        document.getElementById('coupon-msg').innerText = '';
        document.getElementById('coupon-input').value = '';
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
        window.location.href = 'admin.html';
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