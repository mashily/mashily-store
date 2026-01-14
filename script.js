// script.js
let categories = JSON.parse(localStorage.getItem('storeCats')) || ["الكل", "تخزين", "إكسسوارات"];
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let cart = JSON.parse(localStorage.getItem('MASHILY_CART')) || [];

function init() {
    renderCats();
    renderProducts(products);
    updateCartUI();
}

function renderCats() {
    const nav = document.getElementById('categories-nav');
    nav.innerHTML = categories.map(cat => `<span style="padding:5px 15px; background:#eee; border-radius:15px; cursor:pointer; font-size:0.8rem;" onclick="filterProducts('${cat}')">${cat}</span>`).join('');
}

function renderProducts(items) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = items.map(p => `
        <div class="product-card" onclick="openModal(${p.id})">
            <img src="${p.image}">
            <h3 style="font-size:0.85rem; margin:8px 0;">${p.name}</h3>
            <span class="price">${p.price} ج.م</span>
            <button class="btn-main" onclick="event.stopPropagation(); addToCart(${p.id})">إضافة</button>
        </div>
    `).join('');
}

function searchProducts() {
    let term = document.getElementById('search-input').value.toLowerCase();
    let filtered = products.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
}

function filterProducts(cat) {
    if (cat === "الكل") renderProducts(products);
    else renderProducts(products.filter(p => p.category === cat));
}

function openModal(id) {
    const p = products.find(i => i.id === id);
    document.getElementById('modal-name').innerText = p.name;
    document.getElementById('modal-price').innerText = p.price + " ج.م";
    document.getElementById('modal-img').src = p.image;
    document.getElementById('modal-desc').innerText = "منتج عالي الجودة متوفر لدى مشالى للالكترونيات بضمان حقيقي.";
    document.getElementById('modal-add-btn').onclick = () => { addToCart(id); closeModal(); };
    document.getElementById('product-modal').style.display = 'flex';
}

function closeModal() { document.getElementById('product-modal').style.display = 'none'; }

function addToCart(id) {
    const p = products.find(i => i.id === id);
    cart.push(p);
    updateCartUI();
}

function updateCartUI() {
    localStorage.setItem('MASHILY_CART', JSON.stringify(cart));
    document.getElementById('cart-badge').innerText = cart.length;
    document.getElementById('total-price').innerText = cart.reduce((s, i) => s + i.price, 0);
    document.getElementById('cart-items').innerHTML = cart.map((item, idx) => `
        <div style="display:flex; justify-content:space-between; padding:5px; background:#f4f4f4; margin-bottom:5px; border-radius:5px; font-size:0.8rem;">
            <span>${item.name}</span>
            <b onclick="removeFromCart(${idx})" style="color:red; cursor:pointer">✕</b>
        </div>
    `).join('');
}

function removeFromCart(idx) { cart.splice(idx, 1); updateCartUI(); }
function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('active'); document.getElementById('overlay').classList.toggle('active'); }

function sendToWhatsApp() {
    let msg = "طلب جديد من مشالى:\n" + cart.map(i => `- ${i.name} (${i.price}ج)`).join('\n');
    window.open(`https://wa.me/201551831308?text=${encodeURIComponent(msg)}`);
}

window.onload = init;