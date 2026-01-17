// script.js
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["تخزين", "إكسسوارات", "صوتيات"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];
let tickerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في مشالى للالكترونيات 🔥 جودة نضمنها لك 🔥";

function init() {
    const ticker = document.getElementById('ticker-text');
    if(ticker) ticker.innerText = tickerText;
    renderCats();
    renderProducts(products);
    updateCartUI();
    applyTheme(localStorage.getItem('theme') || 'light-theme');
}

// إغلاق السلة بـ ESC
document.addEventListener('keydown', (e) => {
    if(e.key === "Escape") {
        document.getElementById('cart-sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }
});

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
    if(!nav) return;
    nav.innerHTML = categories.map(cat => `<button onclick="filterProducts('${cat}')" class="qty-btn" style="background:#7f8c8d;">${cat}</button>`).join('');
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = items.map(p => `
        <div class="product-card">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'">
            <h4 style="font-size:0.8rem; margin:8px 0; height:2.4em; overflow:hidden;">${p.name}</h4>
            <span style="color:#ff4757; font-weight:bold; display:block; margin-bottom:8px;">${p.price} ج.م</span>
            <button class="qty-btn" style="width:100%;" onclick="addToCart(${p.id})">إضافة للسلة</button>
        </div>
    `).join('');
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
    let found = cart.find(item => item.id === id);
    if(found) found.qty++;
    else cart.push({...p, qty: 1});
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    const badge = document.getElementById('cart-badge');
    const total = document.getElementById('total-price');
    if(badge) badge.innerText = cart.reduce((s,i)=>s+i.qty, 0);
    if(total) total.innerText = cart.reduce((s,i)=>s+(i.price*i.qty), 0).toLocaleString();
    
    const container = document.getElementById('cart-items');
    if(!container) return;
    container.innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; background:rgba(120,120,120,0.1); padding:10px; border-radius:10px; font-size:0.8rem; position:relative;">
            <button class="remove-item" onclick="removeFromCart(${idx})">✕</button>
            <div style="flex:1; padding-right:10px;"><b>${item.name}</b><br><span>${item.price} ج.م</span></div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx}, -1)" class="qty-btn" style="padding:2px 8px;">-</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${idx}, 1)" class="qty-btn" style="padding:2px 8px;">+</button>
            </div>
        </div>
    `).join('');
}

function changeQty(idx, val) {
    cart[idx].qty += val;
    if(cart[idx].qty < 1) cart.splice(idx, 1);
    updateCartUI();
}

function removeFromCart(idx) { cart.splice(idx, 1); updateCartUI(); }

function toggleCart(forceOpen = false) {
    const side = document.getElementById('cart-sidebar');
    const over = document.getElementById('overlay');
    if(forceOpen) { side.classList.add('active'); over.classList.add('active'); }
    else { side.classList.toggle('active'); over.classList.toggle('active'); }
}

function sendToWhatsApp() {
    if(!cart.length) return;
    let msg = "طلب جديد من مشالى:\n";
    cart.forEach(i => msg += `• ${i.name} (${i.qty}) = ${i.price * i.qty}ج\n`);
    msg += `الإجمالي: ${document.getElementById('total-price').innerText} ج.م`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = init;