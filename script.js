let cart = [];
let total = 0;
const WHATSAPP_NUMBER = "201551831308";

// متغيرات للتحكم في صندوق المعلومات
let currentProductName = '';
let currentProductPrice = 0;

// قاعدة بيانات المواصفات الإضافية للمنتجات
const productSpecs = {
    'هارد SSD 500GB': [
        'سعة 500 جيجابايت',
        'سرعة قراءة 550MB/s',
        'سرعة كتابة 500MB/s',
        'ضمان سنة كاملة',
        'نوع M.2 NVMe',
        'متوافق مع جميع الأجهزة الحديثة'
    ],
    'كابل USB عالي الجودة': [
        'طول 1.5 متر',
        'يدعم الشحن السريع 3.0A',
        'جميع أجهزة Android وiOS',
        'قابل للطي والتخزين',
        'غطاء واقي للمنفذ',
        'مقاوم للالتواء'
    ],
    'ماوس لاسلكي أنيق': [
        'DPI قابل للتعديل حتى 3200',
        'تقنية Bluetooth 5.0',
        'بطارية تدوم 6 أشهر',
        'تصميم مريح لليد',
        'زر إضافي للتحكم',
        'عمل سلس على جميع الأسطح'
    ],
    'لمبة ذكية LED': [
        '10 واط، 16 مليون لون',
        'متوافقة مع Google Home وAlexa',
        'تطبيق Tuya Smart أو Smart Life',
        'تحكم بالصوت والجوال',
        'ضمان سنتين',
        'توفير في الطاقة 80%'
    ],
    'سماعات رأس بلوتوث': [
        'Bluetooth 5.2',
        'بطارية 400mAh',
        'شحن كامل خلال ساعتين',
        'تشغيل حتى 20 ساعة',
        'مايكروفون مدمج',
        'تحكم باللمس'
    ],
    'باور بانك 10000mAh': [
        'سعة 10000 مللي أمبير',
        'يدعم الشحن السريع 18W',
        'منفذ USB-C وUSB-A',
        'شحن جهازين معاً',
        'شاشة عرض رقمية',
        'حماية من الشحن الزائد'
    ],
    'كاميرا مراقبة منزلية': [
        'دقة 1080p Full HD',
        'زاوية عدسة 130 درجة',
        'رؤية ليلية حتى 10 أمتار',
        'بطاقة microSD حتى 128GB',
        'حركة ثنائية الاتجاه',
        'تشغيل مستمر 24/7'
    ],
    'حامل موبايل للسيارة': [
        'تثبيت بماصة هواء قوية',
        'تدوير 360 درجة',
        'يناسب الهواتف حتى 6.8 بوصة',
        'تثبيت على الزجاج الأمامي',
        'قاعدة قابلة للتعديل',
        'ضمان عدم السقوط'
    ],
    'لوحة مفاتيح لاسلكية': [
        'تصميم ميكانيكي',
        'إضاءة RGB قابلة للتخصيص',
        'بطارية تدوم 30 يوم',
        'اتصال Bluetooth 5.1',
        'مفاتيح مقاومة للسوائل',
        'دعم جميع أنظمة التشغيل'
    ],
    'سماعات بلوتوث صغيرة': [
        'وزن خفيف 15 جرام',
        'تشغيل حتى 8 ساعات',
        'شحن سريع 15 دقيقة',
        'مقاومة للعرق',
        'صوت ستيريو عالي',
        'حقيبة شحن صغيرة'
    ],
    'شاحن سيارة سريع': [
        'منفذين USB',
        'شحن سريع 30W',
        'حماية من السخونة',
        'كابل تثبيت مرن',
        'مؤشر ضوئي',
        'مناسب لجميع السيارات'
    ],
    'حافظة لابتوب': [
        'مقاسات 13-15 بوصة',
        'مقاومة للماء والصدمات',
        'جيب داخلي للشاحن',
        'حزام كتف قابل للإزالة',
        'تصميم عصري',
        'ضمان 6 أشهر'
    ]
};

function addToCart(name, price, event) {
    if (event) {
        event.stopPropagation(); // منع ظهور صندوق المعلومات عند النقر على الزر
    }
    
    cart.push({ name, price });
    total += price;
    updateUI();
    
    // إظهار السلة تلقائياً عند إضافة منتج
    if(!document.getElementById('cart-sidebar').classList.contains('active')) {
        toggleCart();
    }
    
    // تأثير بسيط للتأكيد
    const button = event ? event.target : document.getElementById('info-add-to-cart');
    const originalText = button.textContent;
    const originalBackground = button.style.background;
    
    button.textContent = "تم الإضافة ✓";
    button.style.background = "#27ae60";
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = originalBackground || "#e67e22";
        
        // إغلاق صندوق المعلومات بعد إضافة المنتج
        hideProductInfo();
    }, 1000);
}

function updateUI() {
    document.getElementById('cart-count').innerText = cart.length;
    document.getElementById('total-price').innerText = total.toLocaleString();
    
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center; color: #777; padding: 15px;">السلة فارغة حالياً</p>';
    } else {
        container.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-name">${index + 1}. ${item.name}</div>
                <div class="cart-item-price">${item.price.toLocaleString()} جنيه</div>
            </div>
        `).join('');
    }
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
}

function clearCart() {
    if (cart.length === 0) {
        alert("السلة فارغة بالفعل!");
        return;
    }
    
    if (confirm("هل أنت متأكد من رغبتك في مسح جميع محتويات السلة؟")) {
        cart = [];
        total = 0;
        updateUI();
    }
}

function sendToWhatsApp() {
    if (cart.length === 0) {
        alert("سلتك فارغة، أضف بعض المنتجات أولاً!");
        return;
    }
    
    let message = "مرحباً، أود تقديم طلب جديد من متجر مشالى للالكترونيات:%0a%0a";
    message += "📦 *تفاصيل الطلب:*%0a%0a";
    
    cart.forEach((item, index) => {
        message += `*${index + 1}. ${item.name}*%0a`;
        message += `   السعر: ${item.price} جنيه%0a%0a`;
    });
    
    message += `💰 *الإجمالي: ${total.toLocaleString()} جنيه*%0a%0a`;
    message += "⏰ أتمنى معرفة وقت التسليم والتوافر.%0a";
    message += "📞 رقم التواصل: __________%0a";
    message += "📍 العنوان: __________%0a%0a";
    message += "شكراً لكم! 🛍️";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// عرض معلومات المنتج عند النقر عليه
function showProductInfo(name, description, price, image) {
    currentProductName = name;
    currentProductPrice = price;
    
    const infoBox = document.getElementById('product-info-box');
    const productName = document.getElementById('info-product-name');
    const productDescription = document.getElementById('info-product-description');
    const productPrice = document.getElementById('info-product-price');
    const productImage = document.getElementById('info-product-image');
    const productSpecsList = document.getElementById('info-product-specs');
    const addToCartBtn = document.getElementById('info-add-to-cart');
    
    // تعبئة البيانات
    productName.textContent = name;
    productDescription.textContent = description;
    productPrice.textContent = price.toLocaleString() + ' جنيه';
    productImage.src = image;
    productImage.alt = name;
    
    // إعداد زر الإضافة للسلة في صندوق المعلومات
    addToCartBtn.onclick = function() {
        addToCart(name, price);
    };
    
    // تعبئة المواصفات
    const specs = productSpecs[name] || [
        'جودة عالية',
        'ضمان لمدة عام',
        'تصميم حديث',
        'سهولة الاستخدام'
    ];
    
    productSpecsList.innerHTML = specs.map(spec => `<li>${spec}</li>`).join('');
    
    // إظهار صندوق المعلومات مع طبقة شفافة في الخلفية
    infoBox.classList.add('active');
    
    // إنشاء أو تفعيل طبقة شفافة في الخلفية
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay';
        overlay.className = 'overlay';
        overlay.onclick = hideProductInfo;
        document.body.appendChild(overlay);
    }
    overlay.classList.add('active');
}

// إخفاء معلومات المنتج
function hideProductInfo() {
    const infoBox = document.getElementById('product-info-box');
    const overlay = document.getElementById('overlay');
    
    infoBox.classList.remove('active');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// إغلاق صندوق المعلومات عند الضغط على ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        hideProductInfo();
    }
});

// منع ظهور صندوق المعلومات عند النقر على زر "أضف للسلة" في البطاقة
document.querySelectorAll('.buy-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
    });
});

// تهيئة الواجهة
document.addEventListener('DOMContentLoaded', function() {
    updateUI();
    
    // إضافة تأكيد أن الصفحة قد تم تحميلها
    console.log('متجر مشالى للالكترونيات - جاهز للعمل!');
});