// ===== بيانات الأقسام =====
const categoriesData = [
    { id: 1, name: "تخزين", slug: "storage", icon: "fas fa-hdd" },
    { id: 2, name: "إكسسوارات", slug: "accessories", icon: "fas fa-headphones" },
    { id: 3, name: "ذكية", slug: "smart", icon: "fas fa-lightbulb" },
    { id: 4, name: "صوتيات", slug: "audio", icon: "fas fa-music" }
];

// ===== بيانات المنتجات =====
const productsData = [
    {
        id: 1,
        name: "هارد SSD 500GB",
        price: 1500,
        originalPrice: 1800,
        description: "سرعة فائقة لجهازك، ضمان سنة كاملة.",
        image: "https://picsum.photos/300/200?random=1",
        category: "storage",
        specs: [
            "سعة 500 جيجابايت",
            "سرعة قراءة 550MB/s", 
            "سرعة كتابة 500MB/s",
            "ضمان سنة كاملة",
            "نوع M.2 NVMe",
            "متوافق مع جميع الأجهزة الحديثة"
        ],
        tags: ["🔥 الأكثر مبيعاً", "عرض خاص"],
        stock: 15,
        rating: 4.5,
        reviewCount: 24
    },
    {
        id: 2,
        name: "كابل USB عالي الجودة",
        price: 100,
        originalPrice: 120,
        description: "متين ويدعم الشحن السريع ونقل البيانات.",
        image: "https://picsum.photos/300/200?random=2",
        category: "accessories",
        specs: [
            "طول 1.5 متر",
            "يدعم الشحن السريع 3.0A",
            "جميع أجهزة Android وiOS",
            "قابل للطي والتخزين",
            "غطاء واقي للمنفذ",
            "مقاوم للالتواء"
        ],
        tags: ["🆕 جديد"],
        stock: 50,
        rating: 4.2,
        reviewCount: 18
    },
    {
        id: 3,
        name: "ماوس لاسلكي أنيق",
        price: 250,
        originalPrice: 300,
        description: "تصميم مريح لليد، يعمل ببطارية تدوم طويلاً.",
        image: "https://picsum.photos/300/200?random=3",
        category: "accessories",
        specs: [
            "DPI قابل للتعديل حتى 3200",
            "تقنية Bluetooth 5.0",
            "بطارية تدوم 6 أشهر",
            "تصميم مريح لليد",
            "زر إضافي للتحكم",
            "عمل سلس على جميع الأسطح"
        ],
        tags: [],
        stock: 25,
        rating: 4.0,
        reviewCount: 12
    },
    {
        id: 4,
        name: "لمبة ذكية LED",
        price: 120,
        originalPrice: 150,
        description: "تحكم بالإضاءة عبر تطبيق الموبايل بألوان مختلفة.",
        image: "https://picsum.photos/300/200?random=4",
        category: "smart",
        specs: [
            "10 واط، 16 مليون لون",
            "متوافقة مع Google Home وAlexa",
            "تطبيق Tuya Smart أو Smart Life",
            "تحكم بالصوت والجوال",
            "ضمان سنتين",
            "توفير في الطاقة 80%"
        ],
        tags: ["عرض خاص"],
        stock: 40,
        rating: 4.7,
        reviewCount: 31
    },
    {
        id: 5,
        name: "سماعات رأس بلوتوث",
        price: 400,
        originalPrice: 500,
        description: "صوت نقي ومايك مدمج لإجراء المكالمات.",
        image: "https://picsum.photos/300/200?random=5",
        category: "audio",
        specs: [
            "Bluetooth 5.2",
            "بطارية 400mAh",
            "شحن كامل خلال ساعتين",
            "تشغيل حتى 20 ساعة",
            "مايكروفون مدمج",
            "تحكم باللمس"
        ],
        tags: ["🔥 الأكثر مبيعاً"],
        stock: 20,
        rating: 4.3,
        reviewCount: 27
    },
    {
        id: 6,
        name: "باور بانك 10000mAh",
        price: 300,
        originalPrice: 350,
        description: "شاحن متنقل سريع يشحن جهازك مرتين.",
        image: "https://picsum.photos/300/200?random=6",
        category: "accessories",
        specs: [
            "سعة 10000 مللي أمبير",
            "يدعم الشحن السريع 18W",
            "منفذ USB-C وUSB-A",
            "شحن جهازين معاً",
            "شاشة عرض رقمية",
            "حماية من الشحن الزائد"
        ],
        tags: [],
        stock: 30,
        rating: 4.1,
        reviewCount: 15
    },
    {
        id: 7,
        name: "كاميرا مراقبة منزلية",
        price: 850,
        originalPrice: 1000,
        description: "رؤية ليلية وصوت ثنائي الاتجاه، تحكم من جوالك.",
        image: "https://picsum.photos/300/200?random=7",
        category: "smart",
        specs: [
            "دقة 1080p Full HD",
            "زاوية عدسة 130 درجة",
            "رؤية ليلية حتى 10 أمتار",
            "بطاقة microSD حتى 128GB",
            "حركة ثنائية الاتجاه",
            "تشغيل مستمر 24/7"
        ],
        tags: ["🆕 جديد"],
        stock: 10,
        rating: 4.8,
        reviewCount: 42
    },
    {
        id: 8,
        name: "حامل موبايل للسيارة",
        price: 90,
        originalPrice: 120,
        description: "تثبيت قوي وآمن لهاتفك أثناء القيادة.",
        image: "https://picsum.photos/300/200?random=8",
        category: "accessories",
        specs: [
            "تثبيت بماصة هواء قوية",
            "تدوير 360 درجة",
            "يناسب الهواتف حتى 6.8 بوصة",
            "تثبيت على الزجاج الأمامي",
            "قاعدة قابلة للتعديل",
            "ضمان عدم السقوط"
        ],
        tags: [],
        stock: 60,
        rating: 3.9,
        reviewCount: 8
    },
    {
        id: 9,
        name: "لوحة مفاتيح لاسلكية",
        price: 350,
        originalPrice: 400,
        description: "لوحة مفاتيح ميكانيكية مع إضاءة RGB.",
        image: "https://picsum.photos/300/200?random=9",
        category: "accessories",
        specs: [
            "تصميم ميكانيكي",
            "إضاءة RGB قابلة للتخصيص",
            "بطارية تدوم 30 يوم",
            "اتصال Bluetooth 5.1",
            "مفاتيح مقاومة للسوائل",
            "دعم جميع أنظمة التشغيل"
        ],
        tags: ["عرض خاص"],
        stock: 18,
        rating: 4.4,
        reviewCount: 23
    },
    {
        id: 10,
        name: "سماعات بلوتوث صغيرة",
        price: 180,
        originalPrice: 220,
        description: "سماعات بلوتوث صغيرة الحجم عالية الجودة.",
        image: "https://picsum.photos/300/200?random=10",
        category: "audio",
        specs: [
            "وزن خفيف 15 جرام",
            "تشغيل حتى 8 ساعات",
            "شحن سريع 15 دقيقة",
            "مقاومة للعرق",
            "صوت ستيريو عالي",
            "حقيبة شحن صغيرة"
        ],
        tags: [],
        stock: 35,
        rating: 4.0,
        reviewCount: 19
    },
    {
        id: 11,
        name: "شاحن سيارة سريع",
        price: 120,
        originalPrice: 150,
        description: "شاحن سيارة بمنفذين يدعم الشحن السريع.",
        image: "https://picsum.photos/300/200?random=11",
        category: "accessories",
        specs: [
            "منفذين USB",
            "شحن سريع 30W",
            "حماية من السخونة",
            "كابل تثبيت مرن",
            "مؤشر ضوئي",
            "مناسب لجميع السيارات"
        ],
        tags: [],
        stock: 45,
        rating: 3.8,
        reviewCount: 11
    },
    {
        id: 12,
        name: "حافظة لابتوب",
        price: 220,
        originalPrice: 280,
        description: "حافظة لابتوب مقاومة للماء والصدمات.",
        image: "https://picsum.photos/300/200?random=12",
        category: "accessories",
        specs: [
            "مقاسات 13-15 بوصة",
            "مقاومة للماء والصدمات",
            "جيب داخلي للشاحن",
            "حزام كتف قابل للإزالة",
            "تصميم عصري",
            "ضمان 6 أشهر"
        ],
        tags: ["🆕 جديد"],
        stock: 22,
        rating: 4.2,
        reviewCount: 16
    },
    {
        id: 13,
        name: "حافظة لابتوب مقاومة للماء",
        price: 220,
        originalPrice: 280,
        description: "حافظة لابتوب مقاومة للماء والصدمات.",
        image: "images/download.jfif",
        category: "accessories",
        specs: [
            "مقاسات 13-15 بوصة",
            "مقاومة للماء والصدمات",
            "جيب داخلي للشاحن",
            "حزام كتف قابل للإزالة",
            "تصميم عصري",
            "ضمان 6 أشهر"
        ],
        tags: ["🆕 جديد"],
        stock: 22,
        rating: 4.2,
        reviewCount: 16
    },
    {
        id: 14,
        name: "بطارية لاب توب HP",
        price: 150,
        originalPrice: 180,
        description: "بطارية لاب توب نوع HP.",
        image: "images/1.webp",
        category: "accessories",
        specs: [
            "مقاسات 13-15 بوصة",
            "مقاومة للماء والصدمات",
            "جيب داخلي للشاحن",
            "حزام كتف قابل للإزالة",
            "تصميم عصري",
            "ضمان 6 أشهر"
        ],
        tags: ["🆕 الاكثر طلبا"],
        stock: 22,
        rating: 4.2,
        reviewCount: 16
    }
];

// ===== نظام التقييمات =====
const productReviews = {
    1: [
        { user: "أحمد محمد", rating: 5, text: "منتج ممتاز وسريع، أنصح به بشدة!", date: "2024-01-15" },
        { user: "سارة علي", rating: 4, text: "جيد لكن السعر مرتفع قليلاً", date: "2024-01-10" },
        { user: "محمد خالد", rating: 5, text: "السرعة خرافية، فرق كبير عن الهارد العادي", date: "2024-01-05" }
    ],
    2: [
        { user: "محمد خالد", rating: 5, text: "كابل قوي ومتين، يعمل بشكل ممتاز", date: "2024-01-12" },
        { user: "فاطمة أحمد", rating: 4, text: "جيد ولكن الطول يمكن أن يكون أطول", date: "2024-01-08" }
    ],
    4: [
        { user: "علي سعيد", rating: 5, text: "تغير حياتي، التحكم بالإضاءة عن بعد رائع", date: "2024-01-14" },
        { user: "مريم حسن", rating: 5, text: "الألوان جميلة والتطبيق سهل الاستخدام", date: "2024-01-09" }
    ],
    7: [
        { user: "خالد عمرو", rating: 5, text: "كاميرا ممتازة، الرؤية الليلية واضحة جداً", date: "2024-01-16" },
        { user: "نور محمد", rating: 4, text: "جيدة ولكن تحتاج إنترنت قوي", date: "2024-01-11" }
    ]
};

// ===== المتغيرات العامة =====
let cart = [];
let total = 0;
let subtotal = 0;
let discount = 0;
const WHATSAPP_NUMBER = "201551831308";
let currentProduct = null;
let currentQuantity = 1;
let currentCategory = "all";
let searchQuery = "";
let sortBy = "default";
let currentLang = 'ar';

// ===== نظام الثيمات =====
let currentTheme = 'light';
const THEMES = {
    light: 'light',
    dark: 'dark',
    hacker: 'hacker'
};

// ===== نظام اللغة =====
const translations = {
    ar: {
        // الهيدر
        "storeName": "مشالى للالكترونيات",
        "allProducts": "جميع المنتجات",
        "storage": "أجهزة التخزين",
        "accessories": "الإكسسوارات",
        "smart": "الأجهزة الذكية",
        "audio": "الصوتيات",
        "searchPlaceholder": "ابحث عن منتج...",
        "cart": "السلة",
        "orderWhatsapp": "طلب عبر واتساب",
        
        // العروض
        "specialOffers": "عروض خاصة",
        "bestSelling": "🔥 الأكثر مبيعاً",
        "newArrival": "🆕 جديد",
        "freeShipping": "🚚 توصيل",
        "comboOffer": "عرض كومبو",
        "discount15": "خصم 15%",
        "freeShippingTitle": "توصيل مجاني",
        "orderNow": "اطلب الآن",
        "getOffer": "استفد من العرض",
        "shopNow": "تسوق الآن",
        "saveUp": "وفر حتى",
        "free": "مجاناً",
        
        // الفلاتر
        "sortBy": "ترتيب حسب:",
        "bestSellingSort": "الأكثر مبيعاً",
        "priceLow": "السعر: من الأقل للأعلى",
        "priceHigh": "السعر: من الأعلى للأقل",
        "nameSort": "الاسم: أ-ي",
        "productsCount": "منتج",
        "fastDelivery": "توصيل خلال 24 ساعة",
        "warranty": "ضمان حتى سنة",
        
        // المنتجات
        "addToCart": "أضف للسلة",
        "noResults": "لا توجد منتجات تطابق بحثك",
        "tryDifferent": "حاول البحث بكلمات أخرى أو تصفح الفئات المختلفة",
        
        // صندوق المعلومات
        "specifications": "المواصفات:",
        "features": "المميزات:",
        "fastShipping": "توصيل سريع خلال 24-48 ساعة",
        "yearWarranty": "ضمان لمدة سنة كاملة",
        "returnPolicy": "إرجاع خلال 7 أيام",
        "quantity": "الكمية",
        "addToCartBtn": "أضف للسلة",
        
        // السلة
        "shoppingCart": "سلة المشتريات",
        "emptyCart": "السلة فارغة",
        "addProducts": "أضف بعض المنتجات لتبدأ التسوق!",
        "subtotal": "المجموع:",
        "discount": "الخصم:",
        "total": "الإجمالي:",
        "clearCart": "مسح السلة",
        "completeOrder": "إتمام الطلب عبر واتساب ✅",
        "paymentMethods": "طرق الدفع المتاحة:",
        "instapay": "إنستاباي",
        "vodafoneCash": "فودافون كاش",
        "copyInfo": "نسخ المعلومات",
        "close": "إغلاق",
        
        // الفوتر
        "storeDescription": "أفضل منتجات الكترونية بأسعار تنافسية مع ضمان وجودة عالية",
        "support": "الدعم والمساعدة",
        "whatsappNum": "واتساب:",
        "deliveryAreas": "التوصيل:",
        "warrantyInfo": "الضمان:",
        "workingHours": "أوقات العمل",
        "weekDays": "السبت إلى الخميس:",
        "friday": "الجمعة:",
        "rights": "جميع الحقوق محفوظة.",
        
        // التقيمات
        "reviews": "التقيمات",
        "writeReview": "اكتب تقييمك",
        "reviewPlaceholder": "شاركنا تجربتك مع هذا المنتج...",
        "submitReview": "إرسال التقييم",
        "noReviews": "لا توجد تقييمات بعد. كن أول من يقيم هذا المنتج!",
        "rating": "تقييم",
        "stars": "نجوم"
    },
    
    en: {
        // Header
        "storeName": "Mashaly Electronics",
        "allProducts": "All Products",
        "storage": "Storage Devices",
        "accessories": "Accessories",
        "smart": "Smart Devices",
        "audio": "Audio",
        "searchPlaceholder": "Search for a product...",
        "cart": "Cart",
        "orderWhatsapp": "Order via WhatsApp",
        
        // Offers
        "specialOffers": "Special Offers",
        "bestSelling": "🔥 Best Selling",
        "newArrival": "🆕 New",
        "freeShipping": "🚚 Shipping",
        "comboOffer": "Combo Offer",
        "discount15": "15% Discount",
        "freeShippingTitle": "Free Shipping",
        "orderNow": "Order Now",
        "getOffer": "Get Offer",
        "shopNow": "Shop Now",
        "saveUp": "Save up to",
        "free": "Free",
        
        // Filters
        "sortBy": "Sort by:",
        "bestSellingSort": "Best Selling",
        "priceLow": "Price: Low to High",
        "priceHigh": "Price: High to Low",
        "nameSort": "Name: A-Z",
        "productsCount": "products",
        "fastDelivery": "Delivery within 24 hours",
        "warranty": "Warranty up to 1 year",
        
        // Products
        "addToCart": "Add to Cart",
        "noResults": "No products match your search",
        "tryDifferent": "Try different keywords or browse categories",
        
        // Product Info
        "specifications": "Specifications:",
        "features": "Features:",
        "fastShipping": "Fast shipping within 24-48 hours",
        "yearWarranty": "1 year warranty",
        "returnPolicy": "Return within 7 days",
        "quantity": "Quantity",
        "addToCartBtn": "Add to Cart",
        
        // Cart
        "shoppingCart": "Shopping Cart",
        "emptyCart": "Cart is empty",
        "addProducts": "Add some products to start shopping!",
        "subtotal": "Subtotal:",
        "discount": "Discount:",
        "total": "Total:",
        "clearCart": "Clear Cart",
        "completeOrder": "Complete Order via WhatsApp ✅",
        "paymentMethods": "Available Payment Methods:",
        "instapay": "InstaPay",
        "vodafoneCash": "Vodafone Cash",
        "copyInfo": "Copy Info",
        "close": "Close",
        
        // Footer
        "storeDescription": "Best electronic products with competitive prices, warranty, and high quality",
        "support": "Support & Help",
        "whatsappNum": "WhatsApp:",
        "deliveryAreas": "Delivery:",
        "warrantyInfo": "Warranty:",
        "workingHours": "Working Hours",
        "weekDays": "Saturday to Thursday:",
        "friday": "Friday:",
        "rights": "All rights reserved.",
        
        // Reviews
        "reviews": "Reviews",
        "writeReview": "Write your review",
        "reviewPlaceholder": "Share your experience with this product...",
        "submitReview": "Submit Review",
        "noReviews": "No reviews yet. Be the first to review this product!",
        "rating": "Rating",
        "stars": "stars"
    }
};

// ===== تهيئة الصفحة =====
document.addEventListener('DOMContentLoaded', function() {
    // تحميل الثيم المحفوظ
    loadSavedTheme();
    
    // التحقق من تسجيل دخول المدير
    checkAdminLogin();
    
    // تحميل البيانات
    loadPreferredLanguage();
    loadProducts();
    updateUI();
    setupEventListeners();
    loadReviewsFromStorage();
    updateProductsCount();
    
    // إخفاء رسالة عدم وجود نتائج
    document.getElementById('no-results').style.display = 'none';
});

// ===== نظام الثيمات =====
function changeTheme(theme) {
    // إزالة كل الثيمات
    document.body.classList.remove('dark-theme', 'hacker-theme');
    
    // إضافة الثيم الجديد
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'hacker') {
        document.body.classList.add('hacker-theme');
        applyHackerEffects();
    } else {
        removeHackerEffects();
    }
    
    // تحديث الأزرار النشطة
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
    
    // حفظ في localStorage
    currentTheme = theme;
    localStorage.setItem('storeTheme', theme);
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('storeTheme') || 'light';
    changeTheme(savedTheme);
}

// تأثيرات خاصة لثيم الهاكر
function applyHackerEffects() {
    // تأثير الكتابة على العناوين
    const titles = document.querySelectorAll('h1, h2, h3, .product-card h3');
    titles.forEach(title => {
        if (!title.classList.contains('hacker-text')) {
            title.classList.add('hacker-text');
        }
    });
    
    // تأثير عشوائي على الأسعار
    const prices = document.querySelectorAll('.current-price, .info-price, .new-price');
    prices.forEach(price => {
        const original = price.textContent;
        
        // حفظ الأصل
        if (!price.dataset.original) {
            price.dataset.original = original;
        }
        
        // إعداد المؤقت للتأثير
        if (!price.dataset.hackerInterval) {
            const intervalId = setInterval(() => {
                if (document.body.classList.contains('hacker-theme') && Math.random() > 0.7) {
                    // تأثير تغيير الأرقام
                    const hacked = original.replace(/\d/g, () => 
                        Math.floor(Math.random() * 10)
                    );
                    price.textContent = hacked;
                    
                    setTimeout(() => {
                        price.textContent = price.dataset.original;
                    }, 100);
                }
            }, 2000);
            
            price.dataset.hackerInterval = intervalId;
        }
    });
}

function removeHackerEffects() {
    // إزالة تأثير الكتابة
    document.querySelectorAll('.hacker-text').forEach(el => {
        el.classList.remove('hacker-text');
    });
    
    // إيقاف مؤقتات الهاكر
    const prices = document.querySelectorAll('.current-price, .info-price, .new-price');
    prices.forEach(price => {
        if (price.dataset.hackerInterval) {
            clearInterval(parseInt(price.dataset.hackerInterval));
            delete price.dataset.hackerInterval;
        }
        
        // استعادة النص الأصلي
        if (price.dataset.original) {
            price.textContent = price.dataset.original;
        }
    });
}

// ===== التحقق من تسجيل دخول المدير =====
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const loginTime = localStorage.getItem('loginTime');
    const currentTime = new Date().getTime();
    
    if (isLoggedIn === 'true' && (currentTime - loginTime < 8 * 60 * 60 * 1000)) {
        document.getElementById('adminQuickAccess').style.display = 'block';
    }
}

// ===== الانتقال إلى لوحة المدير =====
function goToManager() {
    window.location.href = 'manager.html';
}

// ===== دالة تغيير اللغة =====
function changeLanguage(lang) {
    currentLang = lang;
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const key = element.getAttribute('data-translate-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    document.querySelectorAll('option[data-translate]').forEach(option => {
        const key = option.getAttribute('data-translate');
        if (translations[lang][key]) {
            option.textContent = translations[lang][key];
        }
    });
    
    localStorage.setItem('preferredLanguage', lang);
    loadProducts();
}

function loadPreferredLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'ar';
    changeLanguage(savedLang);
}

// ===== تحميل وعرض المنتجات =====
function loadProducts() {
    const container = document.getElementById('products-grid');
    container.innerHTML = '';
    
    let filteredProducts = productsData.filter(product => {
        if (currentCategory === "offers") {
            return product.tags.length > 0;
        }
        
        if (currentCategory !== "all" && product.category !== currentCategory) {
            return false;
        }
        
        if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !product.description.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        return true;
    });
    
    filteredProducts = sortProducts(filteredProducts);
    
    if (filteredProducts.length === 0) {
        container.innerHTML = '';
        document.getElementById('no-results').style.display = 'block';
    } else {
        document.getElementById('no-results').style.display = 'none';
        
        filteredProducts.forEach(product => {
            const discountPercent = product.originalPrice ? 
                Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
            
            const ratingStars = getStarsHTML(product.rating);
            
            const productHTML = `
                <div class="product-card" onclick="showProductInfo(${product.id})">
                    ${product.tags.length > 0 ? 
                        `<div class="discount-tag">${product.tags[0]}</div>` : ''}
                    <div class="category-tag">${getCategoryName(product.category)}</div>
                    
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                    </div>
                    
                    <div class="product-details">
                        <h3>${product.name}</h3>
                        
                        <div class="product-rating">
                            <div class="rating-stars">${ratingStars}</div>
                            <div class="rating-count">(${product.reviewCount})</div>
                        </div>
                        
                        <div class="price-container">
                            <span class="current-price">${product.price.toLocaleString()} جنيه</span>
                            ${product.originalPrice ? 
                                `<span class="original-price">${product.originalPrice.toLocaleString()} جنيه</span>` : ''}
                        </div>
                        
                        <button class="buy-btn" onclick="addToCart(${product.id}, event)">
                            <i class="fas fa-cart-plus"></i> ${translations[currentLang].addToCart}
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += productHTML;
        });
    }
    
    updateProductsCount(filteredProducts.length);
}

// ===== عرض معلومات المنتج =====
function showProductInfo(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    currentProduct = product;
    currentQuantity = 1;
    
    const infoBox = document.getElementById('product-info-box');
    const overlay = document.getElementById('overlay');
    const productName = document.getElementById('info-product-name');
    const productDescription = document.getElementById('info-product-description');
    const productPrice = document.getElementById('info-product-price');
    const productImage = document.getElementById('info-product-image');
    const productSpecsList = document.getElementById('info-product-specs');
    const addToCartBtn = document.getElementById('info-add-to-cart');
    const productCategory = document.getElementById('info-product-category');
    const productTag = document.getElementById('info-product-tag');
    const productBadge = document.getElementById('info-product-badge');
    const priceCompare = document.getElementById('price-compare');
    const productQuantity = document.getElementById('product-quantity');
    
    productName.textContent = product.name;
    productDescription.textContent = product.description;
    productPrice.textContent = (product.price * currentQuantity).toLocaleString() + ' جنيه';
    productImage.src = product.image;
    productImage.alt = product.name;
    productCategory.textContent = getCategoryName(product.category);
    productQuantity.value = currentQuantity;
    
    if (product.tags.length > 0) {
        productTag.textContent = product.tags[0];
        productTag.style.display = 'inline-block';
        productBadge.textContent = product.tags[0];
        productBadge.style.display = 'block';
    } else {
        productTag.style.display = 'none';
        productBadge.style.display = 'none';
    }
    
    if (product.originalPrice) {
        const discountPercent = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
        priceCompare.innerHTML = `
            <span class="old-price-compare">${product.originalPrice.toLocaleString()} جنيه</span>
            <span class="discount-percent">خصم ${discountPercent}%</span>
        `;
        priceCompare.style.display = 'flex';
    } else {
        priceCompare.style.display = 'none';
    }
    
    addToCartBtn.onclick = function() {
        addToCart(product.id);
    };
    
    productSpecsList.innerHTML = product.specs.map(spec => `<li>${spec}</li>`).join('');
    
    updateProductReviews(product.id);
    setupStarRating();
    
    infoBox.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== إخفاء معلومات المنتج =====
function hideProductInfo() {
    const infoBox = document.getElementById('product-info-box');
    const overlay = document.getElementById('overlay');
    
    infoBox.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ===== تغيير الكمية =====
function changeQuantity(change) {
    if (!currentProduct) return;
    
    currentQuantity += change;
    if (currentQuantity < 1) currentQuantity = 1;
    if (currentQuantity > 10) currentQuantity = 10;
    
    document.getElementById('product-quantity').value = currentQuantity;
    document.getElementById('info-product-price').textContent = 
        (currentProduct.price * currentQuantity).toLocaleString() + ' جنيه';
}

// ===== إضافة منتج للسلة =====
function addToCart(productId, event = null) {
    if (event) {
        event.stopPropagation();
    }
    
    const product = productsData.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = currentProduct && currentProduct.id === productId ? currentQuantity : 1;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }
    
    updateUI();
    showNotification(`تم إضافة ${product.name} إلى السلة`);
    
    if (currentProduct && currentProduct.id === productId) {
        hideProductInfo();
    }
    
    if (!document.getElementById('cart-sidebar').classList.contains('active')) {
        toggleCart();
    }
}

// ===== إزالة منتج من السلة =====
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateUI();
    showNotification("تم إزالة المنتج من السلة");
}

// ===== تحديث واجهة المستخدم =====
function updateUI() {
    subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    total = subtotal - discount;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;
    document.getElementById('cart-badge').textContent = totalItems;
    
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>${translations[currentLang].emptyCart}</h3>
                <p>${translations[currentLang].addProducts}</p>
            </div>
        `;
    } else {
        container.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${(item.price * item.quantity).toLocaleString()} جنيه</div>
                    <div class="cart-item-quantity">الكمية: ${item.quantity}</div>
                </div>
                <div class="cart-item-remove" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-times"></i>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('subtotal-price').textContent = subtotal.toLocaleString();
    document.getElementById('discount-price').textContent = discount.toLocaleString();
    document.getElementById('total-price').textContent = total.toLocaleString();
}

// ===== تبديل عرض السلة =====
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

// ===== مسح السلة =====
function clearCart() {
    if (cart.length === 0) {
        showNotification("السلة فارغة بالفعل!");
        return;
    }
    
    if (confirm("هل أنت متأكد من رغبتك في مسح جميع محتويات السلة؟")) {
        cart = [];
        discount = 0;
        updateUI();
        showNotification("تم مسح السلة بنجاح");
    }
}

// ===== إرسال الطلب عبر واتساب =====
function sendToWhatsApp() {
    if (cart.length === 0) {
        showNotification("سلتك فارغة، أضف بعض المنتجات أولاً!");
        return;
    }
    
    let message = "مرحباً، أود تقديم طلب جديد من متجر مشالى للالكترونيات:%0a%0a";
    message += "📦 *تفاصيل الطلب:*%0a%0a";
    
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*%0a`;
        message += `   الكمية: ${item.quantity}%0a`;
        message += `   السعر: ${item.price.toLocaleString()} جنيه%0a`;
        message += `   الإجمالي: ${(item.price * item.quantity).toLocaleString()} جنيه%0a%0a`;
    });
    
    message += `💰 *ملخص الطلب:*%0a`;
    message += `   المجموع: ${subtotal.toLocaleString()} جنيه%0a`;
    if (discount > 0) {
        message += `   الخصم: ${discount.toLocaleString()} جنيه%0a`;
    }
    message += `   الإجمالي النهائي: ${total.toLocaleString()} جنيه%0a%0a`;
    
    message += "⏰ أتمنى معرفة وقت التسليم والتوافر.%0a";
    message += "📞 رقم التواصل: __________%0a";
    message += "📍 العنوان: __________%0a%0a";
    message += "شكراً لكم! 🛍️";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ===== تطبيق كود الخصم =====
function applyPromoCode() {
    const promoCode = document.getElementById('promo-code')?.value.trim();
    const validCodes = {
        "WELCOME10": 0.1,
        "SAVE20": 0.2,
        "SUMMER15": 0.15
    };
    
    if (!promoCode) {
        showNotification("يرجى إدخال كود الخصم");
        return;
    }
    
    if (validCodes[promoCode.toUpperCase()]) {
        discount = Math.round(subtotal * validCodes[promoCode.toUpperCase()]);
        updateUI();
        showNotification(`تم تطبيق كود الخصم بنجاح! وفرت ${discount.toLocaleString()} جنيه`);
        if (document.getElementById('promo-code')) {
            document.getElementById('promo-code').value = '';
        }
    } else {
        showNotification("كود الخصم غير صالح");
    }
}

// ===== نظام التقييمات =====
function submitReview() {
    if (!currentProduct) return;
    
    const stars = document.querySelectorAll('.star-rating i.active').length;
    const reviewText = document.querySelector('.review-text').value.trim();
    
    if (stars === 0) {
        showNotification("الرجاء اختيار تقييم من 1-5 نجوم");
        return;
    }
    
    if (!reviewText) {
        showNotification("الرجاء كتابة تعليقك عن المنتج");
        return;
    }
    
    if (!productReviews[currentProduct.id]) {
        productReviews[currentProduct.id] = [];
    }
    
    productReviews[currentProduct.id].unshift({
        user: "عميل",
        rating: stars,
        text: reviewText,
        date: new Date().toISOString().split('T')[0]
    });
    
    localStorage.setItem('productReviews', JSON.stringify(productReviews));
    updateProductReviews(currentProduct.id);
    
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.classList.remove('active', 'fas');
        star.classList.add('far');
    });
    document.querySelector('.review-text').value = '';
    document.querySelector('.selected-rating').textContent = '0 نجوم';
    
    showNotification("شكراً لك! تم إرسال تقييمك بنجاح");
}

function updateProductReviews(productId) {
    const reviews = productReviews[productId] || [];
    
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
        : 0;
    
    const distribution = {5:0, 4:0, 3:0, 2:0, 1:0};
    reviews.forEach(review => {
        distribution[review.rating]++;
    });
    
    const reviewsSection = document.querySelector('.product-reviews');
    if (reviewsSection) {
        document.querySelector('.rating-number').textContent = averageRating;
        document.querySelector('.total-reviews').textContent = `(${reviews.length} تقييم)`;
        
        const starsContainer = document.querySelector('.stars');
        starsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (averageRating >= i) {
                starsContainer.innerHTML += '<i class="fas fa-star"></i>';
            } else if (averageRating >= i - 0.5) {
                starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsContainer.innerHTML += '<i class="far fa-star"></i>';
            }
        }
        
        document.querySelectorAll('.rating-bar').forEach((bar, index) => {
            const rating = 5 - index;
            const count = distribution[rating] || 0;
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            bar.querySelector('.bar').style.width = `${percentage}%`;
            bar.querySelector('span:last-child').textContent = `${Math.round(percentage)}%`;
        });
        
        const reviewsList = document.querySelector('.reviews-list');
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="far fa-star"></i>
                    <p>${translations[currentLang].noReviews}</p>
                </div>
            `;
        } else {
            reviewsList.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer">${review.user}</div>
                        <div class="review-date">منذ ${calculateTimeSince(review.date)}</div>
                        <div class="review-stars">
                            ${getStarsHTML(review.rating)}
                        </div>
                    </div>
                    <div class="review-text">${review.text}</div>
                </div>
            `).join('');
        }
    }
}

function calculateTimeSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "يوم";
    if (diffDays <= 7) return `${diffDays} أيام`;
    if (diffDays <= 30) return `${Math.floor(diffDays/7)} أسابيع`;
    return `${Math.floor(diffDays/30)} أشهر`;
}

function getStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function setupStarRating() {
    document.querySelectorAll('.star-rating i').forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });
        
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            setRating(rating);
        });
    });
    
    const starRating = document.querySelector('.star-rating');
    if (starRating) {
        starRating.addEventListener('mouseleave', function() {
            const selectedRating = document.querySelector('.selected-rating');
            if (selectedRating) {
                const currentRating = parseInt(selectedRating.textContent);
                highlightStars(currentRating);
            }
        });
    }
}

function highlightStars(rating) {
    document.querySelectorAll('.star-rating i').forEach((star, index) => {
        const starRating = index + 1;
        if (starRating <= rating) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

function setRating(rating) {
    const selectedRating = document.querySelector('.selected-rating');
    if (selectedRating) {
        selectedRating.textContent = `${rating} نجوم`;
        highlightStars(rating);
    }
}

function loadReviewsFromStorage() {
    const savedReviews = localStorage.getItem('productReviews');
    if (savedReviews) {
        Object.assign(productReviews, JSON.parse(savedReviews));
    }
}

// ===== دوال العرض =====
function showOffersOnly() {
    event.preventDefault();
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    event.target.closest('.nav-link').classList.add('active');
    
    currentCategory = "offers";
    loadProducts();
}

function orderOffer(offerType) {
    switch(offerType) {
        case 'combo':
            showNotification("عرض الكومبو: تم إضافة المنتجات للسلة");
            break;
        case 'discount':
            showNotification("خصم 15%: استخدم كود SUMMER15 عند الدفع");
            break;
        case 'shipping':
            showNotification("التوصيل المجاني: ساري للطلبات فوق 1000 جنيه");
            break;
    }
}

// ===== دوال الدفع =====
function showPaymentInfo(type) {
    const paymentInfo = document.getElementById('payment-info');
    const paymentTitle = document.getElementById('payment-title');
    const paymentDetails = document.getElementById('payment-details');
    
    if (type === 'instapay') {
        paymentTitle.textContent = 'الدفع عبر إنستاباي';
        paymentDetails.innerHTML = `
            <p>اسم المستلم: <strong>محمد مشالى</strong></p>
            <p>رقم الهاتف: <strong>01012345678</strong></p>
            <div class="barcode-container">
                <div class="barcode">⬜⬛⬜⬛⬜⬛⬜⬛⬜⬛</div>
                <div class="barcode-text">باركود إنستاباي</div>
            </div>
            <p style="font-size: 0.8rem; color: #7f8c8d;">يمكنك مسح الباركود من تطبيق البنك</p>
        `;
    } else if (type === 'vodafone') {
        paymentTitle.textContent = 'الدفع عبر فودافون كاش';
        paymentDetails.innerHTML = `
            <p>اسم المستلم: <strong>محمد مشالى</strong></p>
            <p>رقم المحفظة: <strong>01012345678</strong></p>
            <p>كود الخدمة: <strong>*858*01012345678*المبلغ#</strong></p>
            <div class="instructions">
                <h4>طريقة الدفع:</h4>
                <ol style="text-align: right; padding-right: 20px;">
                    <li>ادخل على *858#</li>
                    <li>اختر "إرسال أموال"</li>
                    <li>ادخل رقم المحفظة أعلاه</li>
                    <li>ادخل المبلغ: ${total.toLocaleString()} جنيه</li>
                    <li>تأكد من البيانات وأرسل</li>
                </ol>
            </div>
        `;
    }
    
    paymentInfo.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function hidePaymentInfo() {
    document.getElementById('payment-info').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function copyPaymentInfo() {
    const paymentDetails = document.getElementById('payment-details').innerText;
    navigator.clipboard.writeText(paymentDetails)
        .then(() => {
            showNotification('تم نسخ معلومات الدفع!');
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
        });
}

// ===== دوال مساعدة =====
function sortProducts(products) {
    switch(sortBy) {
        case 'price-low':
            return [...products].sort((a, b) => a.price - b.price);
        case 'price-high':
            return [...products].sort((a, b) => b.price - a.price);
        case 'name':
            return [...products].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        default:
            return [...products].sort((a, b) => b.id - a.id);
    }
}

function getCategoryName(category) {
    const categoryObj = categoriesData.find(c => c.slug === category);
    return categoryObj ? categoryObj.name : category;
}

function updateProductsCount(count) {
    document.getElementById('products-count').textContent = count || productsData.length;
}

function showNotification(text) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    notificationText.textContent = text;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// ===== إعداد مستمعي الأحداث =====
function setupEventListeners() {
    // البحث
    document.getElementById('search-input').addEventListener('input', function(e) {
        searchQuery = e.target.value;
        loadProducts();
    });
    
    // الروابط التنقلية
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.getAttribute('onclick')) {
                e.preventDefault();
                
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                currentCategory = this.dataset.category;
                loadProducts();
            }
        });
    });
    
    // الفرز
    document.getElementById('sort-select').addEventListener('change', function(e) {
        sortBy = e.target.value;
        loadProducts();
    });
    
    // إغلاق بالنقر على ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('product-info-box').classList.contains('active')) {
                hideProductInfo();
            }
            if (document.getElementById('payment-info').classList.contains('active')) {
                hidePaymentInfo();
            }
        }
    });
    
    // إغلاق السلة بالنقر خارجها
    document.addEventListener('click', function(e) {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartLink = document.querySelector('.cart-link');
        
        if (cartSidebar.classList.contains('active') && 
            !cartSidebar.contains(e.target) && 
            !cartLink.contains(e.target) &&
            !e.target.closest('.cart-link')) {
            toggleCart();
        }
    });
    
    // منع إغلاق صندوق معلومات المنتج عند النقر داخله
    const productInfoBox = document.getElementById('product-info-box');
    if (productInfoBox) {
        productInfoBox.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // إغلاق نافذة الدفع بالنقر خارجها
    const paymentInfo = document.getElementById('payment-info');
    if (paymentInfo) {
        paymentInfo.addEventListener('click', function(e) {
            if (e.target === this) {
                hidePaymentInfo();
            }
        });
    }
    
    // تحديث الكمية يدوياً
    const quantityInput = document.getElementById('product-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('change', function(e) {
            const value = parseInt(e.target.value);
            if (value >= 1 && value <= 10) {
                currentQuantity = value;
                if (currentProduct) {
                    document.getElementById('info-product-price').textContent = 
                        (currentProduct.price * currentQuantity).toLocaleString() + ' جنيه';
                }
            } else {
                e.target.value = currentQuantity;
            }
        });
    }
    
    // إضافة مستمعين لأزرار الثيمات
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            changeTheme(this.dataset.theme);
        });
    });
}

// ===== دوال التخزين والاسترجاع =====
function saveDataToLocalStorage() {
    localStorage.setItem('storeProducts', JSON.stringify(productsData));
    localStorage.setItem('storeCategories', JSON.stringify(categoriesData));
    localStorage.setItem('storeReviews', JSON.stringify(productReviews));
}

function loadDataFromLocalStorage() {
    const savedProducts = localStorage.getItem('storeProducts');
    const savedCategories = localStorage.getItem('storeCategories');
    const savedReviews = localStorage.getItem('storeReviews');
    
    if (savedProducts) {
        productsData = JSON.parse(savedProducts);
    }
    
    if (savedCategories) {
        categoriesData = JSON.parse(savedCategories);
    }
    
    if (savedReviews) {
        Object.assign(productReviews, JSON.parse(savedReviews));
    }
}

// ===== التهيئة النهائية =====
// تحميل التقييمات عند البدء
loadReviewsFromStorage();

// حفظ بيانات أولية إذا لم تكن موجودة
if (!localStorage.getItem('storeProducts')) {
    saveDataToLocalStorage();
}