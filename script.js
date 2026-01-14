// script.js

// 1. إدارة البيانات
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["الكل", "تخزين", "إكسسوارات"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

// 2. السلايدر (Banner Slider)
let currentSlide = 0;
function startSlider() {
    const slides = document.querySelectorAll('.slide');
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

// 3. عرض الأقسام والمنتجات
function initStore() {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = categories.map(cat => `<span class="nav-link" style="cursor:pointer; padding:5px 15px; background:#eee; border-radius:15px; font-size:0.8rem;" onclick="filterProducts('${cat}')">${cat}</span>`).join('');
    renderProducts(products);
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = items.map(p => `
        <div class="product-card" onclick="openModal(${p.id})">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${p.name}</h3>
            <div class="stars">⭐⭐⭐⭐⭐</div>
            <span class="price" style="color:var(--accent); font-weight:bold;">${p.price} ج.م</span>
            <div class="stock-alert">بقي 3 قطع فقط!</div>
            <button class="add-to-cart-btn" style="margin-top:10px;" onclick="event.stopPropagation(); addToCart(${p.id})">إضافة للسلة</button>
        </div>
    `).join('');
}

function filterProducts(cat) {
    if (cat === "الكل") renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
}

// 4. نافذة تفاصيل المنتج (Modal)
function openModal(id) {
    const p = products.find(item => item.id === id);
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-price').innerText = p.price + " ج.م";
    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-desc').innerText = "هذا المنتج عالي الجودة متوفر الآن في متجر مشالى. ضمان لمدة عام كامل مع استبدال مجاني في حالة عيوب الصناعة.";
    document.getElementById('modal-add-btn').onclick = () => addToCart(id);
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('product-modal').style.display = 'none';
}

// 5. السلة
function addToCart(id) {
    const p = products.find(item => item.id === id);
    cart.push(p);
    updateCart();
    // تأثير بسيط عند الإضافة
    alert('تم إضافة ' + p.name + ' بنجاح');
}

function updateCart() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    document.getElementById('cart-badge').innerText = cart.length;
    document.getElementById('total-price').innerText = cart.reduce((s, i) => s + i.price, 0);
    const box = document.getElementById('cart-items');
    box.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; margin-bottom:10px; background:#f4f4f4; padding:8px; border-radius:5px; font-size:0.8rem;">
            <span>${item.name}</span>
            <b onclick="removeFromCart(${idx})" style="color:red; cursor:pointer">حذف</b>
        </div>
    `).join('');
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCart();
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function sendToWhatsApp() {
    if(cart.length === 0) return alert('السلة فارغة!');
    let msg = "مرحباً مشالى للالكترونيات، أرغب في طلب:\n" + cart.map(i => `- ${i.name} (${i.price}ج)`).join('\n');
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = () => {
    initStore();
    updateCart();
    startSlider();
};