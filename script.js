// script.js
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["الكل", "تخزين", "إكسسوارات", "ذكية"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let currentModalProdId = null;

function init() {
    renderCats();
    renderProducts(products);
    updateCartUI();
}

function renderCats() {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = categories.map(cat => `
        <span class="nav-link" style="padding:6px 16px; background:#fff; border:1px solid #ddd; border-radius:20px; font-size:0.8rem; cursor:pointer; font-weight:600;" onclick="filterProducts('${cat}', this)">${cat}</span>
    `).join('');
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(items.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:50px; color:#999;">لا توجد منتجات حالياً في هذا القسم.</p>`;
        return;
    }
    grid.innerHTML = items.map(p => `
        <div class="product-card" onclick="openModal(${p.id})">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'">
            <div>
                <h3>${p.name}</h3>
                <div class="stars">⭐⭐⭐⭐⭐</div>
                <span class="price">${p.price} ج.م</span>
            </div>
            <button class="btn-main" style="margin-top:10px; font-size:0.75rem; padding:6px;" onclick="event.stopPropagation(); addToCart(${p.id})">إضافة للسلة</button>
        </div>
    `).join('');
}

function filterProducts(cat, el) {
    document.querySelectorAll('.nav-link').forEach(n => n.style.background = '#fff');
    if(el) el.style.background = '#3498db';
    if(el) el.style.color = '#fff';

    if (cat === "الكل") renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
}

function openModal(id) {
    currentModalProdId = id;
    const p = products.find(i => i.id === id);
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-price').innerText = p.price + " ج.م";
    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-desc').innerText = "منتج أصلي وعالي الجودة من متجر مشالى. يتم فحص المنتج قبل الشحن لضمان أفضل تجربة للمستخدم.";
    document.getElementById('modal-add-btn').onclick = () => { addToCart(id); closeModal(); };
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('product-modal').style.display = 'none'; }

function addToCart(id) {
    const p = products.find(i => i.id === id);
    cart.push(p);
    updateCartUI();
    // تنبيه خفيف
    const toast = document.createElement('div');
    toast.innerText = "تمت إضافة " + p.name;
    toast.style = "position:fixed; bottom:60px; right:20px; background:#2ecc71; color:white; padding:10px 20px; border-radius:5px; z-index:4000;";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    document.getElementById('cart-badge').innerText = cart.length;
    document.getElementById('total-price').innerText = cart.reduce((s, i) => s + i.price, 0).toLocaleString();
    
    document.getElementById('cart-items').innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:10px; margin-bottom:8px; border-radius:8px; border:1px solid #eee;">
            <div style="font-size:0.8rem;"><b>${item.name}</b><br><span style="color:var(--accent)">${item.price} ج.م</span></div>
            <i class="fas fa-trash-alt" onclick="removeFromCart(${idx})" style="color:#e74c3c; cursor:pointer;"></i>
        </div>
    `).join('');
}

function removeFromCart(idx) { cart.splice(idx, 1); updateCartUI(); }

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function sendToWhatsApp() {
    if(cart.length === 0) return alert('السلة فارغة!');
    let msg = "مرحباً مشالى للالكترونيات، أرغب في طلب هذه المنتجات:\n\n";
    cart.forEach((it, i) => msg += `${i+1}. ${it.name} - (${it.price} ج.م)\n`);
    msg += `\nالإجمالي: ${document.getElementById('total-price').innerText} ج.م`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = init;