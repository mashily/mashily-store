// script.js

// 1. البيانات الأساسية (تبدأ ببيانات تجريبية إذا كان المتجر فارغاً)
let productsData = JSON.parse(localStorage.getItem('storeProducts')) || [
    { id: 1, name: "هارد SSD 500GB", price: 1500, category: "storage", image: "https://picsum.photos/300/200?random=1" },
    { id: 2, name: "سماعة بلوتوث", price: 350, category: "audio", image: "https://picsum.photos/300/200?random=2" }
];

let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

// 2. عرض المنتجات في الصفحة الرئيسية
function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if (!grid) return; // لضمان عدم حدوث خطأ في صفحات أخرى

    const countDisplay = document.getElementById('products-count');
    
    if (items.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        grid.innerHTML = '';
    } else {
        document.getElementById('no-results').style.display = 'none';
        grid.innerHTML = items.map(p => `
            <div class="product-card">
                <img src="${p.image}" alt="${p.name}">
                <h3>${p.name}</h3>
                <span class="price">${p.price} ج.م</span>
                <button onclick="addToCart(${p.id})" class="add-to-cart-btn">إضافة للسلة <i class="fas fa-cart-plus"></i></button>
            </div>
        `).join('');
    }
    countDisplay.innerText = items.length;
}

// 3. إدارة السلة
function addToCart(id) {
    const product = productsData.find(p => p.id === id);
    cart.push(product);
    updateCart();
    showNotification('تم إضافة المنتج للسلة ✅');
}

function updateCart() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    const badge = document.getElementById('cart-badge');
    if (badge) badge.innerText = cart.length;
    
    const cartItemsBody = document.getElementById('cart-items');
    if (cartItemsBody) {
        cartItemsBody.innerHTML = cart.map((item, index) => `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:8px;">
                <div>
                    <p style="font-weight:600; font-size:0.9rem;">${item.name}</p>
                    <p style="color:var(--accent); font-size:0.8rem;">${item.price} ج.م</p>
                </div>
                <button onclick="removeFromCart(${index})" style="background:none; border:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const totalDisplay = document.getElementById('total-price');
    if (totalDisplay) totalDisplay.innerText = total;
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

// 4. الثيمات والتبديل
function changeTheme(theme) {
    document.body.className = theme + '-theme';
    localStorage.setItem('preferred-theme', theme);
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

// 5. البحث والفلترة
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = productsData.filter(p => p.name.toLowerCase().includes(term));
        renderProducts(filtered);
    });
}

// الفلترة بالأقسام
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        
        const cat = this.dataset.category;
        const filtered = cat === 'all' ? productsData : productsData.filter(p => p.category === cat);
        renderProducts(filtered);
    });
});

// 6. إرسال الطلب عبر واتساب
function sendToWhatsApp() {
    if (cart.length === 0) {
        alert('السلة فارغة!');
        return;
    }
    
    let message = "📦 طلب شراء جديد من متجر مشالى:\n\n";
    cart.forEach((item, i) => {
        message += `${i+1}. ${item.name} - السعر: ${item.price} ج.م\n`;
    });
    
    const total = document.getElementById('total-price').innerText;
    message += `\n💰 الإجمالي: ${total} جنيه مصري`;
    message += `\n\nيرجى التواصل لتأكيد الطلب.`;
    
    const encodedMessage = encodeURIComponent(message);
    const phone = "201551831308";
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
}

function showNotification(msg) {
    const notify = document.createElement('div');
    notify.style.cssText = "position:fixed; bottom:20px; right:20px; background:#2ecc71; color:white; padding:10px 20px; border-radius:5px; z-index:2000; animation: fadeOut 3s forwards;";
    notify.innerText = msg;
    document.body.appendChild(notify);
    setTimeout(() => notify.remove(), 3000);
}

// تشغيل عند التحميل
window.onload = () => {
    renderProducts(productsData);
    updateCart();
    const savedTheme = localStorage.getItem('preferred-theme');
    if (savedTheme) changeTheme(savedTheme);
};