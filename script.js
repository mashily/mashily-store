// script.js
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["تخزين", "إكسسوارات"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let tickerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في مشالى للالكترونيات 🔥 جودة نضمنها لك 🔥";

function init() {
    document.getElementById('ticker-text').innerText = tickerText;
    renderCats();
    renderProducts(products);
    updateCartUI();
    applyTheme(localStorage.getItem('theme') || 'light-theme');
}

function toggleTheme() {
    let current = document.body.className;
    let next = current === 'light-theme' ? 'dark-theme' : current === 'dark-theme' ? 'hacker-theme' : 'light-theme';
    applyTheme(next);
}

function applyTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('theme', theme);
}

function renderCats() {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = categories.map(cat => `<button onclick="filterProducts('${cat}')" class="qty-btn" style="width:auto; padding:0 15px; background:#7f8c8d;">${cat}</button>`).join('');
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = items.length ? items.map(p => `
        <div class="product-card">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/120'">
            <h4 style="font-size:0.8rem; margin:8px 0; height:2.4em; overflow:hidden;">${p.name}</h4>
            <span style="color:#ff4757; font-weight:bold; display:block; margin-bottom:8px;">${p.price} ج.م</span>
            <button class="qty-btn" style="width:100%;" onclick="addToCart(${p.id})">إضافة</button>
        </div>
    `).join('') : '<p style="grid-column:1/-1; text-align:center; padding:50px;">لا يوجد نتائج</p>';
}

function searchProducts() {
    let term = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(term)));
}

function filterProducts(cat) {
    if (cat === "الكل") renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
}

function showOffers() {
    renderProducts(products.filter(p => p.label && p.label !== ""));
}

function addToCart(id) {
    const p = products.find(item => item.id === id);
    if(!p) return;
    let found = cart.find(item => item.id === id);
    if(found) found.qty++;
    else cart.push({...p, qty: 1});
    updateCartUI();
    if(!document.getElementById('cart-sidebar').classList.contains('active')) toggleCart();
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    document.getElementById('cart-badge').innerText = cart.reduce((s,i)=>s+i.qty, 0);
    document.getElementById('total-price').innerText = cart.reduce((s,i)=>s+(i.price*i.qty), 0).toLocaleString();
    
    const container = document.getElementById('cart-items');
    container.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(120,120,120,0.1); padding:10px; border-radius:10px; font-size:0.8rem; position:relative;">
            <button class="remove-item" onclick="removeFromCart(${idx})">✕</button>
            <div style="flex:1; padding-right:5px;"><b>${item.name}</b><br><span style="color:#ff4757;">${item.price} ج.م</span></div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx}, -1)" class="qty-btn" style="width:22px; height:22px;">-</button>
                <span style="font-weight:bold; min-width:15px; text-align:center;">${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)" class="qty-btn" style="width:22px; height:22px;">+</button>
            </div>
        </div>
    `).join('');
}

function changeQty(idx, val) {
    cart[idx].qty += val;
    if(cart[idx].qty < 1) cart.splice(idx, 1);
    updateCartUI();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCartUI();
}

function clearCart() { if(confirm('تفريغ السلة بالكامل؟')) { cart = []; updateCartUI(); } }

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function sendToWhatsApp() {
    if(!cart.length) return alert('السلة فارغة!');
    let msg = "طلب جديد من مشالى:\n";
    cart.forEach(i => msg += `• ${i.name} (${i.qty} قطع) = ${i.price * i.qty}ج\n`);
    msg += `الإجمالي: ${document.getElementById('total-price').innerText} ج.م`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = init;