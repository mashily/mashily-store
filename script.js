let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

function init() {
    const ticker = document.getElementById('ticker-text');
    if(ticker) {
        ticker.innerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في مشالى للإلكترونيات 🔥";
        document.documentElement.style.setProperty('--speed', localStorage.getItem('tickerSpeed') || '20s');
    }
    renderProducts(products);
    updateCartUI();
    applyTheme(localStorage.getItem('theme') || 'light-theme');
}

document.addEventListener('keydown', (e) => { 
    if(e.key === "Escape") {
        document.getElementById('cart-sidebar').classList.remove('active');
        document.getElementById('overlay').classList.remove('active');
    }
});

function applyTheme(t) { document.body.className = t; localStorage.setItem('theme', t); }
function toggleTheme() { 
    let n = document.body.className === 'light-theme' ? 'dark-theme' : document.body.className === 'dark-theme' ? 'hacker-theme' : 'light-theme';
    applyTheme(n);
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = items.map(p => `
        <div class="product-card">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <div class="img-container"><img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'"></div>
            <h4 style="font-size:0.75rem; height:2.2em; overflow:hidden;">${p.name}</h4>
            <b style="color:#e74c3c; font-size:0.9rem; margin:5px 0;">${p.price} ج.م</b>
            <button class="qty-btn" style="width:100%; font-size:0.7rem;" onclick="addToCart(${p.id})">إضافة للسلة</button>
        </div>
    `).join('');
}

function addToCart(id) {
    let p = products.find(x => x.id === id);
    let f = cart.find(x => x.id === id);
    if(f) f.qty++; else cart.push({...p, qty: 1});
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    if(document.getElementById('cart-badge')) document.getElementById('cart-badge').innerText = cart.reduce((s,i)=>s+i.qty, 0);
    if(document.getElementById('total-price')) document.getElementById('total-price').innerText = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
    const container = document.getElementById('cart-items');
    if(!container) return;
    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-compact">
            <button onclick="removeFromCart(${idx})" style="border:none; background:none; color:red; cursor:pointer;">✕</button>
            <div style="flex:1; padding:0 5px;"><b>${item.name.substring(0,15)}..</b></div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx},-1)" class="qty-btn">-</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${idx},1)" class="qty-btn">+</button>
            </div>
        </div>
    `).join('');
}

function clearFullCart() { if(confirm('إفراغ السلة؟')) { cart = []; updateCartUI(); toggleCart(false); } }
function changeQty(i,v){ cart[i].qty+=v; if(cart[i].qty<1) cart.splice(i,1); updateCartUI(); }
function removeFromCart(i){ cart.splice(i,1); updateCartUI(); }
function toggleCart(s){ 
    const c = document.getElementById('cart-sidebar');
    const o = document.getElementById('overlay');
    if(s === true) { c.classList.add('active'); o.classList.add('active'); }
    else { c.classList.toggle('active'); o.classList.toggle('active'); }
}

function searchProducts() {
    let t = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(t)));
}

function sendToWhatsApp() {
    let m = "طلب جديد من مشالى:\n" + cart.map(i => `- ${i.name} (${i.qty})`).join('\n');
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(m)}`);
}

window.onload = init;