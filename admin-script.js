// لوحة التحكم المتقدمة - Mashily Store
// إدارة متكاملة للمنتجات، الأصناف، الفيديوهات، الكوبونات، الفواتير والعروض

// تحميل البيانات من localStorage
let products = JSON.parse(localStorage.getItem('storeProducts')) || [];
let categories = JSON.parse(localStorage.getItem('storeCategories')) || [];
let videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
let coupons = JSON.parse(localStorage.getItem('storeCoupons')) || [];
let offers = JSON.parse(localStorage.getItem('storeOffers')) || [];
let invoices = JSON.parse(localStorage.getItem('storeInvoices')) || [];
let paymentSettings = JSON.parse(localStorage.getItem('paymentSettings')) || {
    vodafone: '01551831308',
    instapay: 'Mashily@instapay',
    instapayBarcode: ''
};

// دوال مساعدة
function showAlert(message, type = 'info') {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type} active`;
    
    setTimeout(() => {
        alertBox.classList.remove('active');
    }, 3000);
}

function showSection(sectionId) {
    // إخفاء جميع الأقسام
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // إظهار القسم المطلوب
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    // تحديث القائمة
    document.querySelectorAll('.menu-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // تحميل البيانات للقسم
    switch(sectionId) {
        case 'products':
            loadProducts();
            loadCategories();
            break;
        case 'videos':
            loadVideos();
            break;
        case 'coupons':
            loadCoupons();
            break;
        case 'offers':
            loadOffers();
            break;
        case 'invoices':
            loadInvoices();
            break;
        case 'payments':
            loadPaymentSettings();
            break;
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function logout() {
    if (confirm('هل تريد الخروج من لوحة التحكم؟')) {
        window.location.href = 'login.html';
    }
}

// دوال المنتجات والأصناف
function downloadProductsExcel() {
    if (typeof XLSX === 'undefined') {
        showAlert('مكتبة Excel غير محملة. تأكد من الاتصال بالإنترنت.', 'error');
        return;
    }

    const wb = XLSX.utils.book_new();

    // ورقة المنتجات
    if (products.length > 0) {
        const productsData = products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice || '',
            description: p.description,
            category: p.category,
            stock: p.stock,
            status: p.status || '',
            images: (p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : [])).join('\n'),
            tags: (p.tags || []).join(', '),
            specs: (p.specs || []).join('\n')
        }));
        const productsWs = XLSX.utils.json_to_sheet(productsData);
        XLSX.utils.book_append_sheet(wb, productsWs, "Products");
    }

    // ورقة الأصناف
    if (categories.length > 0) {
        const categoriesData = categories.map(c => ({
            name: c.name,
            icon: c.icon,
            description: c.description
        }));
        const categoriesWs = XLSX.utils.json_to_sheet(categoriesData);
        XLSX.utils.book_append_sheet(wb, categoriesWs, "Categories");
    }

    XLSX.writeFile(wb, "products_categories_backup.xlsx");
    showAlert('تم تنزيل ملف Excel بنجاح', 'success');
}

function uploadProductsExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const mode = document.querySelector('input[name="products-mode"]:checked').value;
    
    if (!confirm(`هل تريد رفع ملف Excel بوضع "${mode === 'add' ? 'إضافة' : 'استبدال'}"؟`)) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (typeof XLSX === 'undefined') {
                showAlert('مكتبة Excel غير محملة.', 'error');
                return;
            }

            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            
            // قراءة المنتجات
            let newProducts = [];
            if (workbook.SheetNames.includes('Products')) {
                const productsWs = workbook.Sheets['Products'];
                newProducts = XLSX.utils.sheet_to_json(productsWs);
            }
            
            // قراءة الأصناف
            let newCategories = [];
            if (workbook.SheetNames.includes('Categories')) {
                const categoriesWs = workbook.Sheets['Categories'];
                newCategories = XLSX.utils.sheet_to_json(categoriesWs);
            }

            if (mode === 'replace') {
                products = newProducts.map(p => normalizeProduct(p));
                categories = newCategories.map(c => normalizeCategory(c));
            } else {
                // إضافة
                newProducts.forEach(p => {
                    const existingIndex = products.findIndex(prod => prod.id === p.id);
                    if (existingIndex !== -1) {
                        products[existingIndex] = normalizeProduct(p);
                    } else {
                        products.push(normalizeProduct(p));
                    }
                });
                
                newCategories.forEach(c => {
                    const existingIndex = categories.findIndex(cat => cat.name === c.name);
                    if (existingIndex === -1) {
                        categories.push(normalizeCategory(c));
                    }
                });
            }

            saveData();
            loadProducts();
            loadCategories();
            showAlert('تم رفع ملف Excel بنجاح', 'success');
        } catch (err) {
            console.error('خطأ في قراءة Excel:', err);
            showAlert('خطأ في قراءة ملف Excel', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function normalizeProduct(p) {
    return {
        id: parseInt(p.id) || Date.now(),
        name: p.name || '',
        price: parseFloat(p.price) || 0,
        originalPrice: parseFloat(p.originalPrice) || 0,
        description: p.description || '',
        category: p.category || '',
        stock: parseInt(p.stock) || 0,
        status: p.status || '',
        images: p.images ? (Array.isArray(p.images) ? p.images : p.images.toString().split('\n').filter(img => img.trim())) : [],
        tags: p.tags ? (Array.isArray(p.tags) ? p.tags : p.tags.toString().split(',').map(t => t.trim()).filter(t => t)) : [],
        specs: p.specs ? (Array.isArray(p.specs) ? p.specs : p.specs.toString().split('\n').map(s => s.trim()).filter(s => s)) : []
    };
}

function normalizeCategory(c) {
    return {
        name: c.name || '',
        icon: c.icon || 'fas fa-tag',
        description: c.description || ''
    };
}

function loadProducts() {
    const container = document.getElementById('products-list');
    if (products.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد منتجات</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="item-card">
            <h4>${p.name}</h4>
            <p>السعر: ${p.price} ج.م</p>
            <p>الصنف: ${p.category || 'غير محدد'}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="editProduct(${p.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteProduct(${p.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function loadCategories() {
    const container = document.getElementById('categories-list');
    if (categories.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد أصناف</p>';
        return;
    }

    container.innerHTML = categories.map(c => `
        <div class="item-card">
            <h4><i class="${c.icon}"></i> ${c.name}</h4>
            <p>${c.description || ''}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="editCategory('${c.name}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteCategory('${c.name}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function openProductModal(productId = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const product = productId ? products.find(p => p.id === productId) : null;
    
    title.textContent = product ? 'تعديل منتج' : 'إضافة منتج جديد';
    
    body.innerHTML = `
        <div class="form-group">
            <label>اسم المنتج:</label>
            <input type="text" id="product-name" value="${product ? product.name : ''}">
        </div>
        <div class="form-group">
            <label>السعر:</label>
            <input type="number" id="product-price" value="${product ? product.price : ''}">
        </div>
        <div class="form-group">
            <label>السعر الأصلي:</label>
            <input type="number" id="product-original-price" value="${product ? product.originalPrice : ''}">
        </div>
        <div class="form-group">
            <label>الوصف:</label>
            <textarea id="product-description" rows="3">${product ? product.description : ''}</textarea>
        </div>
        <div class="form-group">
            <label>الصنف:</label>
            <select id="product-category">
                <option value="">اختر صنف</option>
                ${categories.map(c => `<option value="${c.name}" ${product && product.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>المخزون:</label>
            <input type="number" id="product-stock" value="${product ? product.stock : ''}">
        </div>
        <div class="form-group">
            <label>الحالة:</label>
            <input type="text" id="product-status" value="${product ? product.status : ''}">
        </div>
        <div class="form-group">
            <label>الصور (رابط أو روابط مفصولة بـ \\n):</label>
            <textarea id="product-images" rows="3">${product ? (Array.isArray(product.images) ? product.images.join('\\n') : product.images) : ''}</textarea>
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="saveProduct(${productId || 'null'})">
                <i class="fas fa-save"></i> حفظ
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function saveProduct(productId) {
    const name = document.getElementById('product-name').value;
    const price = parseFloat(document.getElementById('product-price').value);
    const originalPrice = parseFloat(document.getElementById('product-original-price').value) || 0;
    const description = document.getElementById('product-description').value;
    const category = document.getElementById('product-category').value;
    const stock = parseInt(document.getElementById('product-stock').value);
    const status = document.getElementById('product-status').value;
    const images = document.getElementById('product-images').value.split('\\n').filter(img => img.trim());
    
    const productData = {
        id: productId || Date.now(),
        name,
        price,
        originalPrice,
        description,
        category,
        stock,
        status,
        images,
        tags: [],
        specs: []
    };
    
    if (productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index !== -1) {
            products[index] = productData;
        }
    } else {
        products.push(productData);
    }
    
    saveData();
    loadProducts();
    closeModal();
    showAlert('تم حفظ المنتج بنجاح', 'success');
}

function editProduct(productId) {
    openProductModal(productId);
}

function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
        return;
    }
    
    products = products.filter(p => p.id !== productId);
    saveData();
    loadProducts();
    showAlert('تم حذف المنتج بنجاح', 'success');
}

function openCategoryModal(categoryName = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const category = categoryName ? categories.find(c => c.name === categoryName) : null;
    
    title.textContent = category ? 'تعديل صنف' : 'إضافة صنف جديد';
    
    body.innerHTML = `
        <div class="form-group">
            <label>اسم الصنف:</label>
            <input type="text" id="category-name" value="${category ? category.name : ''}">
        </div>
        <div class="form-group">
            <label>الأيقونة (FontAwesome):</label>
            <input type="text" id="category-icon" value="${category ? category.icon : 'fas fa-tag'}">
        </div>
        <div class="form-group">
            <label>الوصف:</label>
            <textarea id="category-description" rows="3">${category ? category.description : ''}</textarea>
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="saveCategory('${categoryName || 'null'}')">
                <i class="fas fa-save"></i> حفظ
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function saveCategory(categoryName) {
    const name = document.getElementById('category-name').value;
    const icon = document.getElementById('category-icon').value;
    const description = document.getElementById('category-description').value;
    
    const categoryData = {
        name,
        icon,
        description
    };
    
    if (categoryName) {
        const index = categories.findIndex(c => c.name === categoryName);
        if (index !== -1) {
            categories[index] = categoryData;
        }
    } else {
        categories.push(categoryData);
    }
    
    saveData();
    loadCategories();
    closeModal();
    showAlert('تم حفظ الصنف بنجاح', 'success');
}

function editCategory(categoryName) {
    openCategoryModal(categoryName);
}

function deleteCategory(categoryName) {
    if (!confirm('هل أنت متأكد من حذف هذا الصنف؟')) {
        return;
    }
    
    categories = categories.filter(c => c.name !== categoryName);
    saveData();
    loadCategories();
    showAlert('تم حذف الصنف بنجاح', 'success');
}

// دوال الفيديوهات
function downloadVideosExcel() {
    if (typeof XLSX === 'undefined') {
        showAlert('مكتبة Excel غير محملة.', 'error');
        return;
    }

    if (videos.length === 0) {
        showAlert('لا توجد فيديوهات للتصدير', 'error');
        return;
    }

    const videosData = videos.map(v => ({
        id: v.id,
        title: v.title,
        description: v.description,
        videoUrl: v.videoUrl,
        thumbnail: v.thumbnail,
        category: v.category,
        points: v.points || 0,
        date: v.date || ''
    }));

    const ws = XLSX.utils.json_to_sheet(videosData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Videos");
    
    XLSX.writeFile(wb, "videos_backup.xlsx");
    showAlert('تم تنزيل ملف Excel بنجاح', 'success');
}

function uploadVideosExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const mode = document.querySelector('input[name="videos-mode"]:checked').value;
    
    if (!confirm(`هل تريد رفع ملف Excel بوضع "${mode === 'add' ? 'إضافة' : 'استبدال'}"؟`)) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (typeof XLSX === 'undefined') {
                showAlert('مكتبة Excel غير محملة.', 'error');
                return;
            }

            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const videosWs = workbook.Sheets['Videos'];
            const newVideos = XLSX.utils.sheet_to_json(videosWs);

            if (mode === 'replace') {
                videos = newVideos.map(v => normalizeVideo(v));
            } else {
                newVideos.forEach(v => {
                    const existingIndex = videos.findIndex(vid => vid.id === v.id);
                    if (existingIndex !== -1) {
                        videos[existingIndex] = normalizeVideo(v);
                    } else {
                        videos.push(normalizeVideo(v));
                    }
                });
            }

            saveData();
            loadVideos();
            showAlert('تم رفع ملف Excel بنجاح', 'success');
        } catch (err) {
            console.error('خطأ في قراءة Excel:', err);
            showAlert('خطأ في قراءة ملف Excel', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

function normalizeVideo(v) {
    return {
        id: parseInt(v.id) || Date.now(),
        title: v.title || '',
        description: v.description || '',
        videoUrl: v.videoUrl || '',
        thumbnail: v.thumbnail || '',
        category: v.category || '',
        points: parseInt(v.points) || 0,
        date: v.date || ''
    };
}

function loadVideos() {
    const container = document.getElementById('videos-list');
    if (videos.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد فيديوهات</p>';
        return;
    }

    container.innerHTML = videos.map(v => `
        <div class="item-card">
            <h4>${v.title}</h4>
            <p>${v.description || ''}</p>
            <p>النقاط: ${v.points || 0}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="editVideo(${v.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteVideo(${v.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function openVideoModal(videoId = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const video = videoId ? videos.find(v => v.id === videoId) : null;
    
    title.textContent = video ? 'تعديل فيديو' : 'إضافة فيديو جديد';
    
    body.innerHTML = `
        <div class="form-group">
            <label>عنوان الفيديو:</label>
            <input type="text" id="video-title" value="${video ? video.title : ''}">
        </div>
        <div class="form-group">
            <label>الوصف:</label>
            <textarea id="video-description" rows="3">${video ? video.description : ''}</textarea>
        </div>
        <div class="form-group">
            <label>رابط الفيديو:</label>
            <input type="text" id="video-url" value="${video ? video.videoUrl : ''}">
        </div>
        <div class="form-group">
            <label>الصورة المصغرة:</label>
            <input type="text" id="video-thumbnail" value="${video ? video.thumbnail : ''}">
        </div>
        <div class="form-group">
            <label>الصنف:</label>
            <input type="text" id="video-category" value="${video ? video.category : ''}">
        </div>
        <div class="form-group">
            <label>النقاط:</label>
            <input type="number" id="video-points" value="${video ? video.points : 0}">
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="saveVideo(${videoId || 'null'})">
                <i class="fas fa-save"></i> حفظ
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function saveVideo(videoId) {
    const title = document.getElementById('video-title').value;
    const description = document.getElementById('video-description').value;
    const videoUrl = document.getElementById('video-url').value;
    const thumbnail = document.getElementById('video-thumbnail').value;
    const category = document.getElementById('video-category').value;
    const points = parseInt(document.getElementById('video-points').value);
    
    const videoData = {
        id: videoId || Date.now(),
        title,
        description,
        videoUrl,
        thumbnail,
        category,
        points,
        date: new Date().toISOString()
    };
    
    if (videoId) {
        const index = videos.findIndex(v => v.id === videoId);
        if (index !== -1) {
            videos[index] = videoData;
        }
    } else {
        videos.push(videoData);
    }
    
    saveData();
    loadVideos();
    closeModal();
    showAlert('تم حفظ الفيديو بنجاح', 'success');
}

function editVideo(videoId) {
    openVideoModal(videoId);
}

function deleteVideo(videoId) {
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
        return;
    }
    
    videos = videos.filter(v => v.id !== videoId);
    saveData();
    loadVideos();
    showAlert('تم حذف الفيديو بنجاح', 'success');
}

// دوال الكوبونات
function loadCoupons() {
    const container = document.getElementById('coupons-list');
    if (coupons.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد كوبونات</p>';
        return;
    }

    container.innerHTML = coupons.map(c => `
        <div class="item-card">
            <h4>${c.code}</h4>
            <p>خصم: ${c.discount}%</p>
            <p>ينتهي: ${c.endDate || 'غير محدد'}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="editCoupon('${c.code}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteCoupon('${c.code}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function openCouponModal(couponCode = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const coupon = couponCode ? coupons.find(c => c.code === couponCode) : null;
    
    title.textContent = coupon ? 'تعديل كوبون' : 'إضافة كوبون جديد';
    
    body.innerHTML = `
        <div class="form-group">
            <label>كود الكوبون:</label>
            <input type="text" id="coupon-code" value="${coupon ? coupon.code : ''}">
        </div>
        <div class="form-group">
            <label>نسبة الخصم (%):</label>
            <input type="number" id="coupon-discount" value="${coupon ? coupon.discount : ''}">
        </div>
        <div class="form-group">
            <label>تاريخ الانتهاء:</label>
            <input type="date" id="coupon-end-date" value="${coupon ? coupon.endDate : ''}">
        </div>
        <div class="form-group">
            <label>الوصف:</label>
            <textarea id="coupon-description" rows="3">${coupon ? coupon.description : ''}</textarea>
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="saveCoupon('${couponCode || 'null'}')">
                <i class="fas fa-save"></i> حفظ
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function saveCoupon(couponCode) {
    const code = document.getElementById('coupon-code').value;
    const discount = parseFloat(document.getElementById('coupon-discount').value);
    const endDate = document.getElementById('coupon-end-date').value;
    const description = document.getElementById('coupon-description').value;
    
    const couponData = {
        code,
        discount,
        endDate,
        description
    };
    
    if (couponCode) {
        const index = coupons.findIndex(c => c.code === couponCode);
        if (index !== -1) {
            coupons[index] = couponData;
        }
    } else {
        coupons.push(couponData);
    }
    
    saveData();
    loadCoupons();
    closeModal();
    showAlert('تم حفظ الكوبون بنجاح', 'success');
}

function editCoupon(couponCode) {
    openCouponModal(couponCode);
}

function deleteCoupon(couponCode) {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
        return;
    }
    
    coupons = coupons.filter(c => c.code !== couponCode);
    saveData();
    loadCoupons();
    showAlert('تم حذف الكوبون بنجاح', 'success');
}

// دوال العروض
function loadOffers() {
    const container = document.getElementById('offers-list');
    if (offers.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد عروض</p>';
        return;
    }

    container.innerHTML = offers.map(o => `
        <div class="item-card">
            <h4>${o.name}</h4>
            <p>${o.badge}</p>
            <p>الخصم: ${o.discount}%</p>
            <p>الأصناف: ${o.categories.join(', ')}</p>
            <p>ينتهي: ${o.endDate}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="editOffer(${o.id})">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-danger" onclick="deleteOffer(${o.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function openOfferModal(offerId = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    const offer = offerId ? offers.find(o => o.id === offerId) : null;
    
    title.textContent = offer ? 'تعديل عرض' : 'إضافة عرض جديد';
    
    body.innerHTML = `
        <div class="form-group">
            <label>اسم العرض:</label>
            <input type="text" id="offer-name" value="${offer ? offer.name : ''}">
        </div>
        <div class="form-group">
            <label>الشارة:</label>
            <input type="text" id="offer-badge" value="${offer ? offer.badge : ''}">
        </div>
        <div class="form-group">
            <label>نسبة الخصم (%):</label>
            <input type="number" id="offer-discount" value="${offer ? offer.discount : ''}">
        </div>
        <div class="form-group">
            <label>الأصناف المستهدفة:</label>
            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
                ${categories.map(c => `
                    <label style="display: block; margin-bottom: 5px;">
                        <input type="checkbox" name="offer-categories" value="${c.name}" ${offer && offer.categories.includes(c.name) ? 'checked' : ''}>
                        ${c.name}
                    </label>
                `).join('')}
            </div>
        </div>
        <div class="form-group">
            <label>تاريخ البدء:</label>
            <input type="date" id="offer-start-date" value="${offer ? offer.startDate : ''}">
        </div>
        <div class="form-group">
            <label>تاريخ الانتهاء:</label>
            <input type="date" id="offer-end-date" value="${offer ? offer.endDate : ''}">
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="saveOffer(${offerId || 'null'})">
                <i class="fas fa-save"></i> حفظ
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function saveOffer(offerId) {
    const name = document.getElementById('offer-name').value;
    const badge = document.getElementById('offer-badge').value;
    const discount = parseFloat(document.getElementById('offer-discount').value);
    const startDate = document.getElementById('offer-start-date').value;
    const endDate = document.getElementById('offer-end-date').value;
    
    const selectedCategories = Array.from(document.querySelectorAll('input[name="offer-categories"]:checked'))
        .map(cb => cb.value);
    
    const offerData = {
        id: offerId || Date.now(),
        name,
        badge,
        discount,
        categories: selectedCategories,
        startDate,
        endDate
    };
    
    if (offerId) {
        const index = offers.findIndex(o => o.id === offerId);
        if (index !== -1) {
            offers[index] = offerData;
        }
    } else {
        offers.push(offerData);
    }
    
    saveData();
    loadOffers();
    closeModal();
    showAlert('تم حفظ العرض بنجاح', 'success');
}

function editOffer(offerId) {
    openOfferModal(offerId);
}

function deleteOffer(offerId) {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) {
        return;
    }
    
    offers = offers.filter(o => o.id !== offerId);
    saveData();
    loadOffers();
    showAlert('تم حذف العرض بنجاح', 'success');
}

// دوال الفواتير
function loadInvoices() {
    const container = document.getElementById('invoices-list');
    if (invoices.length === 0) {
        container.innerHTML = '<p style="color: #64748b;">لا توجد فواتير</p>';
        return;
    }

    container.innerHTML = invoices.map(inv => `
        <div class="item-card">
            <h4>فاتورة #${inv.id}</h4>
            <p>العميل: ${inv.customerName}</p>
            <p>الإجمالي: ${inv.total} ج.م</p>
            <p>التاريخ: ${inv.date}</p>
            <div class="item-actions">
                <button class="btn btn-info" onclick="viewInvoice(${inv.id})">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="btn btn-success" onclick="sendInvoiceWhatsApp(${inv.id})">
                    <i class="fab fa-whatsapp"></i> إرسال
                </button>
                <button class="btn btn-danger" onclick="deleteInvoice(${inv.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function openInvoiceModal() {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = 'إنشاء فاتورة جديدة';
    
    body.innerHTML = `
        <div class="form-group">
            <label>اسم العميل:</label>
            <input type="text" id="invoice-customer-name">
        </div>
        <div class="form-group">
            <label>رقم الهاتف:</label>
            <input type="text" id="invoice-customer-phone">
        </div>
        <div class="form-group">
            <label>العنوان:</label>
            <input type="text" id="invoice-customer-address">
        </div>
        <div class="form-group">
            <label>اختر المنتجات:</label>
            <select id="invoice-products" multiple style="height: 150px;">
                ${products.map(p => `<option value="${p.id}">${p.name} - ${p.price} ج.م</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>الكوبون:</label>
            <select id="invoice-coupon">
                <option value="">بدون كوبون</option>
                ${coupons.map(c => `<option value="${c.code}">${c.code} - خصم ${c.discount}%</option>`).join('')}
            </select>
        </div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="createInvoice()">
                <i class="fas fa-save"></i> إنشاء الفاتورة
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إلغاء
            </button>
        </div>
    `;
    
    modal.classList.add('active');
}

function createInvoice() {
    const customerName = document.getElementById('invoice-customer-name').value;
    const customerPhone = document.getElementById('invoice-customer-phone').value;
    const customerAddress = document.getElementById('invoice-customer-address').value;
    
    const selectedProducts = Array.from(document.getElementById('invoice-products').selectedOptions)
        .map(opt => {
            const product = products.find(p => p.id === parseInt(opt.value));
            return {
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1
            };
        });
    
    const couponCode = document.getElementById('invoice-coupon').value;
    const coupon = coupons.find(c => c.code === couponCode);
    
    let subtotal = selectedProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    let discount = 0;
    
    if (coupon) {
        discount = subtotal * (coupon.discount / 100);
    }
    
    const total = subtotal - discount;
    
    const invoice = {
        id: Date.now(),
        customerName,
        customerPhone,
        customerAddress,
        products: selectedProducts,
        couponCode,
        subtotal,
        discount,
        total,
        date: new Date().toISOString()
    };
    
    invoices.push(invoice);
    saveData();
    loadInvoices();
    closeModal();
    showAlert('تم إنشاء الفاتورة بنجاح', 'success');
}

function viewInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.textContent = `فاتورة #${invoice.id}`;
    
    body.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h4>معلومات العميل:</h4>
            <p>الاسم: ${invoice.customerName}</p>
            <p>الهاتف: ${invoice.customerPhone}</p>
            <p>العنوان: ${invoice.customerAddress}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <h4>المنتجات:</h4>
            ${invoice.products.map(p => `
                <p>${p.name} × ${p.quantity} = ${p.price * p.quantity} ج.م</p>
            `).join('')}
        </div>
        <div style="margin-bottom: 20px;">
            <h4>الملخص:</h4>
            <p>المجموع الفرعي: ${invoice.subtotal} ج.م</p>
            <p>الخصم: ${invoice.discount} ج.م</p>
            <p><strong>الإجمالي: ${invoice.total} ج.م</strong></p>
        </div>
        <div id="qrcode" style="margin-top: 20px;"></div>
        <div class="form-actions">
            <button class="btn btn-success" onclick="downloadInvoiceAsImage(${invoice.id})">
                <i class="fas fa-image"></i> حفظ كصورة
            </button>
            <button class="btn btn-info" onclick="downloadInvoiceAsPDF(${invoice.id})">
                <i class="fas fa-file-pdf"></i> حفظ كـ PDF
            </button>
            <button class="btn btn-danger" onclick="closeModal()">
                <i class="fas fa-times"></i> إغلاق
            </button>
        </div>
    `;
    
    modal.classList.add('active');
    
    // توليد الباركود
    setTimeout(() => {
        const qrData = `فاتورة #${invoice.id} - ${invoice.customerName} - ${invoice.total} ج.م`;
        new QRCode(document.getElementById('qrcode'), {
            text: qrData,
            width: 128,
            height: 128
        });
    }, 100);
}

function sendInvoiceWhatsApp(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    const message = `🧾 فاتورة #${invoice.id}
━━━━━━━━━━━━━━━━━━
👤 العميل: ${invoice.customerName}
📱 الهاتف: ${invoice.customerPhone}
📍 العنوان: ${invoice.customerAddress}

📦 المنتجات:
${invoice.products.map(p => `• ${p.name} × ${p.quantity} = ${p.price * p.quantity} ج.م`).join('\n')}

💰 المجموع الفرعي: ${invoice.subtotal} ج.م
🎟️ الخصم: ${invoice.discount} ج.م
💵 الإجمالي: ${invoice.total} ج.م

━━━━━━━━━━━━━━━━━━
شكراً لتعاملكم معنا! 🎉`;
    
    const whatsappUrl = `https://wa.me/${invoice.customerPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function deleteInvoice(invoiceId) {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
        return;
    }
    
    invoices = invoices.filter(inv => inv.id !== invoiceId);
    saveData();
    loadInvoices();
    showAlert('تم حذف الفاتورة بنجاح', 'success');
}

function downloadInvoiceAsImage(invoiceId) {
    showAlert('سيتم تحميل الفاتورة كصورة... (ميزة قيد التطوير)', 'info');
}

function downloadInvoiceAsPDF(invoiceId) {
    showAlert('سيتم تحميل الفاتورة كـ PDF... (ميزة قيد التطوير)', 'info');
}

// دوال إعدادات الدفع
function loadPaymentSettings() {
    document.getElementById('vodafone-number').value = paymentSettings.vodafone;
    document.getElementById('instapay-number').value = paymentSettings.instapay;
    
    if (paymentSettings.instapayBarcode) {
        document.getElementById('barcode-preview').innerHTML = `
            <img src="${paymentSettings.instapayBarcode}" style="max-width: 200px; border-radius: 8px;">
        `;
    }
}

function saveVodafoneSettings() {
    paymentSettings.vodafone = document.getElementById('vodafone-number').value;
    saveData();
    showAlert('تم حفظ إعدادات فودافون كاش بنجاح', 'success');
}

function saveInstapaySettings() {
    paymentSettings.instapay = document.getElementById('instapay-number').value;
    saveData();
    showAlert('تم حفظ إعدادات إنستاباي بنجاح', 'success');
}

function uploadInstapayBarcode(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        paymentSettings.instapayBarcode = e.target.result;
        saveData();
        loadPaymentSettings();
        showAlert('تم رفع صورة الباركود بنجاح', 'success');
    };
    reader.readAsDataURL(file);
}

// دالة حفظ البيانات
function saveData() {
    localStorage.setItem('storeProducts', JSON.stringify(products));
    localStorage.setItem('storeCategories', JSON.stringify(categories));
    localStorage.setItem('academyVideos', JSON.stringify(videos));
    localStorage.setItem('storeCoupons', JSON.stringify(coupons));
    localStorage.setItem('storeOffers', JSON.stringify(offers));
    localStorage.setItem('storeInvoices', JSON.stringify(invoices));
    localStorage.setItem('paymentSettings', JSON.stringify(paymentSettings));
}

// التحميل الأولي
document.addEventListener('DOMContentLoaded', function() {
    // تحميل البيانات
    products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    categories = JSON.parse(localStorage.getItem('storeCategories')) || [];
    videos = JSON.parse(localStorage.getItem('academyVideos')) || [];
    coupons = JSON.parse(localStorage.getItem('storeCoupons')) || [];
    offers = JSON.parse(localStorage.getItem('storeOffers')) || [];
    invoices = JSON.parse(localStorage.getItem('storeInvoices')) || [];
    paymentSettings = JSON.parse(localStorage.getItem('paymentSettings')) || {
        vodafone: '01551831308',
        instapay: 'Mashily@instapay',
        instapayBarcode: ''
    };
    
    // تحميل القسم الافتراضي
    showSection('products');
});