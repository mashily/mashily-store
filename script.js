// script.js

// جلب البيانات من LocalStorage لضمان ظهور التعديلات فوراً
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["الكل", "تخزين", "إكسسوارات"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

// 1. عرض الأقسام في المتجر
function renderCategories() {
    const nav = document.getElementById('categories-nav');
    if (!nav) return;
    nav.innerHTML = categories.map(cat => `
        <li><span class="nav-link" onclick="filterByCategory('${cat}')">${cat}</span></li>
    `).join('');
}

// 2. عرض المنتجات (مع دعم الملصقات Badge)
function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = `<p style="grid-column: span 6; text-align:center; padding:50px;">لا يوجد منتجات في هذا القسم حالياً.</p>`;
        return;
    }

    grid.innerHTML = items.map(p => `
        <div class="product-card">
            ${p.label ? `<span class="badge">${p.label}</span>` : ''}
            <img src="${p.image}" onerror="this.src='https://via.placeholder.com/150'">
            <div>
                <h3>${p.name}</h3>
                <span class="price">${p.price} ج.م</span>
            </div>
            <button onclick="addToCart(${p.id})" class="add-to-cart-btn">إضافة للسلة</button>
        </div>
    `).join('');
}

// 3. الفلترة
function filterByCategory(cat) {
    if (cat === "الكل") renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
    
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.innerText === cat);
    });
}

// 4. السلة
function addToCart(id) {
    const p = products.find(prod => prod.id === id);
    cart.push(p);
    updateCart();
    alert('تم إضافة ' + p.name + ' للسلة');
}

function updateCart() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    const badge = document.getElementById('cart-badge');
    if(badge) badge.innerText = cart.length;
    
    const total = cart.reduce((s, i) => s + i.price, 0);
    const totalDisp = document.getElementById('total-price');
    if(totalDisp) totalDisp.innerText = total;

    const itemsBox = document.getElementById('cart-items');
    if(itemsBox) {
        itemsBox.innerHTML = cart.map((item, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-bottom:8px; background:#f9f9f9; padding:5px; border-radius:4px;">
                <span>${item.name}</span>
                <span>${item.price}ج <i class="fas fa-trash" onclick="removeFromCart(${idx})" style="color:red; cursor:pointer; margin-right:5px;"></i></span>
            </div>
        `).join('');
    }
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateCart();
}

function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function changeTheme(theme) {
    document.body.className = theme + '-theme';
}

function sendToWhatsApp() {
    if (cart.length === 0) return alert('السلة فارغة!');
    let msg = "مرحباً متجر مشالى، أود طلب الآتي:\n\n";
    cart.forEach((item, i) => {
        msg += `${i+1}. ${item.name} (${item.price} ج.م)\n`;
    });
    msg += `\nإجمالي المبلغ: ${document.getElementById('total-price').innerText} ج.م`;
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = () => {
    renderCategories();
    renderProducts(products);
    updateCart();
    filterByCategory("الكل");
};