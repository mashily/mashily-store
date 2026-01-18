let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

function init() {
    const ticker = document.getElementById('ticker-text');
    if(ticker) {
        ticker.innerText = localStorage.getItem('tickerText') || "🔥 أهلاً بكم في متجر مشالى للإلكترونيات 🔥";
    }
    renderCats();
    renderProducts(products);
    updateCartUI();

    // كود زر ESC المطور والمضمون
    window.addEventListener('keydown', function(event) {
        if (event.key === "Escape" || event.keyCode === 27) {
            toggleCart(false); // إغلاق السلة فوراً
        }
    });
}

// نظام إشعارات المشترين (Social Proof)
const buyers = ["أحمد من القاهرة", "محمد من الإسكندرية", "محمود من المنصورة", "ياسين من طنطا", "خالد من الزقازيق", "إبراهيم من أسوان", "علاء من المحلة"];
const actions = ["اشترى الآن رسيفر سيناتور 🔥", "طلب قطعة واي فاي ⚡", "انضم للأكاديمية التعليمية ✅", "طلب تحديث سوفت وير 🆕", "طلب ريموت كنترول أصلي 🎮"];

function showSocialProof() {
    const div = document.createElement('div');
    div.className = 'social-proof-toast';
    const randomBuyer = buyers[Math.floor(Math.random() * buyers.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    div.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <div style="background:#e67e22; color:white; border-radius:50%; width:35px; height:35px; display:flex; align-items:center; justify-content:center;">
                <i class="fas fa-shopping-bag"></i>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.7rem; font-weight:bold;">${randomBuyer}</div>
                <div style="font-size:0.65rem; color:#666;">${randomAction}</div>
            </div>
        </div>
    `;
    document.body.appendChild(div);
    setTimeout(() => div.classList.add('show'), 100);
    setTimeout(() => {
        div.classList.remove('show');
        setTimeout(() => div.remove(), 500);
    }, 5000);
}
setInterval(showSocialProof, 20000); // إشعار كل 20 ثانية

// دالة تحويل ملف الصورة لكود Base64 (تستخدم في الإدارة)
function encodeImageFileAsURL(element, targetId) {
    let file = element.files[0];
    let reader = new FileReader();
    reader.onloadend = function() {
        document.getElementById(targetId).value = reader.result;
    }
    reader.readAsDataURL(file);
}

// باقي دوال المتجر (Render, Add to Cart, etc.)
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
    grid.innerHTML = items.map(p => {
        const isOut = p.stock === 'out';
        return `
        <div class="product-card">
            <div class="badge-premium">${isOut ? 'نفدت الكمية ❌' : 'أصلي ✅'}</div>
            <div class="img-container"><img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'"></div>
            <h4 style="font-size:0.8rem; height:2.4em; overflow:hidden; padding:0 5px;">${p.name}</h4>
            <div style="color:#e67e22; font-weight:bold; margin:8px 0;">${p.price} ج.م</div>
            <button class="qty-btn" style="width:90%; height:35px; font-size:0.75rem; margin-bottom:10px; background:${isOut?'#95a5a6':'#e67e22'}" 
                onclick="${isOut ? "alert('عذراً، غير متوفر حالياً')" : `addToCart(${p.id})`}">
                ${isOut ? 'غير متوفر' : 'إضافة للسلة'}
            </button>
        </div>
    `}).join('');
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
    container.innerHTML = cart.map((item, idx) => `
        <div class="cart-item-compact">
            <div style="flex:1;"><b>${item.name.substring(0,18)}..</b><br><small>${item.price} ج.م</small></div>
            <div style="display:flex; align-items:center; gap:5px;">
                <button onclick="changeQty(${idx},-1)" class="qty-btn" style="width:22px;height:22px;">-</button>
                <span>${item.qty}</span>
                <button onclick="changeQty(${idx},1)" class="qty-btn" style="width:22px;height:22px;">+</button>
                <button onclick="removeFromCart(${idx})" style="background:none; border:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function changeQty(i,v){ cart[i].qty+=v; if(cart[i].qty<1) removeFromCart(i); updateCartUI(); }
function removeFromCart(i){ cart.splice(i,1); updateCartUI(); }
function toggleCart(s){ 
    const c = document.getElementById('cart-sidebar');
    const o = document.getElementById('overlay');
    if(c) { s ? c.classList.add('active') : c.classList.remove('active'); }
    if(o) { s ? o.classList.add('active') : o.classList.remove('active'); }
}

function sendToWhatsApp() {
    if(cart.length === 0) return;
    let details = cart.map(i => i.name + " (" + i.qty + ")").join(' , ');
    let history = JSON.parse(localStorage.getItem('orderHistory')) || [];
    history.unshift({ date: new Date().toLocaleString('ar-EG'), details: details });
    localStorage.setItem('orderHistory', JSON.stringify(history.slice(0, 20)));
    let m = "طلب جديد من متجر مشالى:\n" + details + "\nالإجمالي: " + document.getElementById('total-price').innerText + " ج.م";
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(m)}`);
}

function searchProducts() {
    let t = document.getElementById('search-input').value.toLowerCase();
    renderProducts(products.filter(p => p.name.toLowerCase().includes(t)));
}

window.onload = init;