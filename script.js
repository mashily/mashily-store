let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

function init() {
    const ticker = document.getElementById('ticker-text');
    if(ticker) {
        ticker.innerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في متجر مشالى للإلكترونيات 🔥";
        document.documentElement.style.setProperty('--speed', localStorage.getItem('tickerSpeed') || '20s');
    }
    renderCats();
    renderProducts(products);
    updateCartUI();
}

// إغلاق السلة بـ ESC
document.addEventListener('keydown', (e) => { if (e.key === "Escape") toggleCart(false); });

function renderCats() {
    const nav = document.getElementById('product-cats');
    if(!nav) return;
    const cats = ['الكل', ...new Set(products.map(p => p.category).filter(c => c))];
    nav.innerHTML = cats.map(c => `<button class="cat-btn-chip" onclick="filterP('${c}', this)">${c}</button>`).join('');
    if(nav.firstChild) nav.firstChild.classList.add('active');
}

function filterP(cat, btn) {
    document.querySelectorAll('.cat-btn-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(cat === 'الكل' ? products : products.filter(p => p.category === cat));
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    grid.innerHTML = items.map(p => `
        <div class="product-card">
            <div class="img-container"><img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'"></div>
            <h4 style="font-size:0.8rem; height:2.4em; overflow:hidden;">${p.name}</h4>
            <div style="color:var(--primary); font-weight:bold; margin:8px 0;">${p.price} ج.م</div>
            <button class="qty-btn" style="width:100%; height:35px; font-size:0.75rem;" onclick="addToCart(${p.id})">إضافة للسلة</button>
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
    const badge = document.getElementById('cart-badge');
    const total = document.getElementById('total-price');
    if(badge) badge.innerText = cart.reduce((s,i)=>s+i.qty, 0);
    if(total) total.innerText = cart.reduce((s,i)=>s+(i.price*i.qty), 0);
    
    const container = document.getElementById('cart-items');
    if(!container) return;
    
    if(cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:20px; opacity:0.5;">السلة فارغة</div>`;
        return;
    }

    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-compact">
            <div style="flex:1;">
                <b style="display:block; font-size:0.75rem;">${item.name.substring(0,20)}..</b>
                <small style="color:var(--primary); font-weight:bold;">${item.price} ج.م</small>
            </div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx},-1)" class="qty-btn" style="width:22px; height:22px; font-size:12px;">-</button>
                <span style="font-size:0.8rem; font-weight:bold;">${item.qty}</span>
                <button onclick="changeQty(${idx},1)" class="qty-btn" style="width:22px; height:22px; font-size:12px;">+</button>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:#ff4757; cursor:pointer; margin-right:5px; font-size:1rem;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function changeQty(i,v){ 
    cart[i].qty += v; 
    if(cart[i].qty < 1) removeFromCart(i); 
    else updateCartUI(); 
}

function removeFromCart(i) {
    cart.splice(i, 1);
    updateCartUI();
}

function clearFullCart() { 
    if(confirm('هل تريد إفراغ سلة المشتريات بالكامل؟')) { 
        cart = []; 
        updateCartUI(); 
        toggleCart(false); 
    } 
}

function toggleCart(show){ 
    const c = document.getElementById('cart-sidebar');
    const o = document.getElementById('overlay');
    if(show === true) { c.classList.add('active'); o.classList.add('active'); }
    else if(show === false) { c.classList.remove('active'); o.classList.remove('active'); }
    else { c.classList.toggle('active'); o.classList.toggle('active'); }
}

function searchProducts() {
    let t = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(t)));
}

function sendToWhatsApp() {
    if(cart.length === 0) return alert("السلة فارغة!");
    let m = "طلب جديد - متجر مشالى:\n" + cart.map(i => `- ${i.name} (عدد: ${i.qty})`).join('\n') + `\n\nإجمالي الحساب: ${document.getElementById('total-price').innerText} ج.م`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(m)}`);
}

window.onload = init;