/* ============================================================
   invoice.js - نظام الفواتير الإلكترونية (مستقل)
   يستخدم في لوحة التحكم - تبويب الفواتير
   ============================================================ */

let invoices = JSON.parse(localStorage.getItem('storeInvoices')) || [];
let editingInvoiceId = null;

// ===== إضافة بند جديد =====
function addInvoiceItem() {
    const container = document.getElementById('invoice-items-container');
    if (!container) return;
    const itemRow = document.createElement('div');
    itemRow.className = 'invoice-item-row';
    itemRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;';
    itemRow.innerHTML = `
        <div class="form-group">
            <input type="text" class="item-name" placeholder="مثال: هارد SSD">
        </div>
        <div class="form-group">
            <input type="number" class="item-quantity" value="1" min="1" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
        </div>
        <div class="form-group">
            <input type="number" class="item-price" placeholder="0" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)">
        </div>
        <div class="form-group">
            <input type="number" class="item-total" readonly style="background: #f0f0f0;">
        </div>
        <button type="button" class="btn btn-danger btn-small" onclick="removeInvoiceItem(this)">حذف</button>
    `;
    container.appendChild(itemRow);
    updateInvoiceTotals();
}

// ===== حذف بند =====
function removeInvoiceItem(btn) {
    btn.closest('.invoice-item-row').remove();
    updateInvoiceTotals();
}

// ===== مسح كل البنود =====
function clearAllInvoiceItems() {
    if (confirm('هل تريد مسح جميع بنود الفاتورة؟')) {
        const container = document.getElementById('invoice-items-container');
        container.innerHTML = '';
        addInvoiceItem();
        updateInvoiceTotals();
    }
}

// ===== حساب إجمالي البند =====
function updateInvoiceItemTotal(input) {
    const row = input.closest('.invoice-item-row');
    if (!row) return;
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const total = quantity * price;
    row.querySelector('.item-total').value = total.toFixed(2);
    updateInvoiceTotals();
}

// ===== حساب كل الإجماليات =====
function updateInvoiceTotals() {
    const rows = document.querySelectorAll('.invoice-item-row');
    let subtotal = 0;
    rows.forEach(row => {
        const total = parseFloat(row.querySelector('.item-total').value) || 0;
        subtotal += total;
    });

    const discountRate = parseFloat(document.getElementById('invoice-discount')?.value) || 0;
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const feesRate = parseFloat(document.getElementById('invoice-fees')?.value) || 0;
    const fees = (afterDiscount * feesRate) / 100;
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate')?.value) || 14;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + fees + tax;

    const set = (id, val, suffix) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val.toFixed(2) + (suffix || ' ج.م');
    };
    set('invoice-subtotal-display', subtotal);
    set('invoice-discount-display', discount);
    set('invoice-fees-display', fees);
    set('invoice-tax-display', tax);
    set('invoice-total-display', total);
    return subtotal;
}

// ===== جمع بنود النموذج =====
function collectInvoiceItems() {
    const items = [];
    document.querySelectorAll('.invoice-item-row').forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        if (name && quantity > 0 && price > 0) {
            items.push({ name, quantity, price, total: quantity * price });
        }
    });
    return items;
}

// ===== إنشاء / حفظ الفاتورة =====
function createInvoice() {
    const invoiceNumber = document.getElementById('invoice-number').value.trim();
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('invoice-client-name').value.trim();
    const clientPhone = document.getElementById('invoice-client-phone').value.trim();
    const clientEmail = document.getElementById('invoice-client-email').value.trim();
    const clientAddress = document.getElementById('invoice-client-address').value.trim();
    const taxNumber = document.getElementById('invoice-tax-number').value.trim();
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 14;
    const discountRate = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const feesRate = parseFloat(document.getElementById('invoice-fees').value) || 0;
    const notes = document.getElementById('invoice-notes').value.trim();
    const paymentMethod = document.getElementById('invoice-payment').value || 'نقداً';
    // بيانات المتجر
    const storeName = document.getElementById('invoice-store-name')?.value.trim() || 'متجر مشالى';
    const storeAddress = document.getElementById('invoice-store-address')?.value.trim() || '';
    const storePhone = document.getElementById('invoice-store-phone')?.value.trim() || '';
    const commercial = document.getElementById('invoice-commercial')?.value.trim() || '';
    const storeLogo = document.getElementById('invoice-store-logo')?.value.trim() || '';
    const storeSignature = document.getElementById('invoice-store-signature')?.value.trim() || '';
    const storeInfo = { storeName, storeAddress, storePhone, commercial, storeLogo, storeSignature };
    localStorage.setItem('storeInvoiceSettings', JSON.stringify(storeInfo));

    if (!invoiceNumber || !clientName || !invoiceDate) {
        alert('يرجى ملء البيانات الأساسية (رقم الفاتورة، اسم العميل، التاريخ)');
        return;
    }

    const items = collectInvoiceItems();
    if (items.length === 0) {
        alert('يرجى إضافة بند واحد على الأقل');
        return;
    }

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const fees = (afterDiscount * feesRate) / 100;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + fees + tax;

    if (editingInvoiceId) {
        const invoice = invoices.find(inv => inv.id === editingInvoiceId);
        if (invoice) {
            Object.assign(invoice, {
                invoiceNumber, date: invoiceDate,
                client: { name: clientName, phone: clientPhone, email: clientEmail, address: clientAddress },
                taxNumber, taxRate, discountRate, feesRate, items,
                subtotal, discount, afterDiscount, fees, tax, total, notes, paymentMethod,
                storeName, storeAddress, storePhone, commercial, storeLogo, storeSignature
            });
            localStorage.setItem('storeInvoices', JSON.stringify(invoices));
            alert('✅ تم تحديث الفاتورة بنجاح!');
        }
    } else {
        invoices.push({
            id: Date.now(), invoiceNumber, date: invoiceDate,
            client: { name: clientName, phone: clientPhone, email: clientEmail, address: clientAddress },
            taxNumber, taxRate, discountRate, feesRate, items,
            subtotal, discount, afterDiscount, fees, tax, total, notes, paymentMethod,
            storeName, storeAddress, storePhone, commercial, storeLogo, storeSignature,
            createdAt: new Date().toLocaleString('ar-EG')
        });
        localStorage.setItem('storeInvoices', JSON.stringify(invoices));
        alert('✅ تم إنشاء الفاتورة بنجاح!');
    }

    resetInvoiceForm();
    displayInvoicesList();
}

// ===== مسح النموذج =====
function resetInvoiceForm() {
    document.getElementById('invoice-number').value = '';
    document.getElementById('invoice-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('invoice-client-name').value = '';
    document.getElementById('invoice-client-phone').value = '';
    document.getElementById('invoice-client-email').value = '';
    document.getElementById('invoice-client-address').value = '';
    document.getElementById('invoice-tax-number').value = '';
    document.getElementById('invoice-tax-rate').value = '14';
    document.getElementById('invoice-discount').value = '0';
    document.getElementById('invoice-fees').value = '0';
    document.getElementById('invoice-notes').value = '';
    const pm = document.getElementById('invoice-payment');
    if (pm) pm.value = 'نقداً';

    // إعادة تحميل بيانات المتجر المحفوظة (لا تُمسح)
    const si = JSON.parse(localStorage.getItem('storeInvoiceSettings')) || {};
    const setField = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setField('invoice-store-name', si.storeName || 'متجر مشالى');
    setField('invoice-store-address', si.storeAddress);
    setField('invoice-store-phone', si.storePhone);
    setField('invoice-commercial', si.commercial);
    setField('invoice-store-logo', si.storeLogo);
    setField('invoice-store-signature', si.storeSignature);

    const container = document.getElementById('invoice-items-container');
    if (container) { container.innerHTML = ''; addInvoiceItem(); }
    updateInvoiceTotals();
    editingInvoiceId = null;
}

// ===== عرض قائمة الفواتير =====
function displayInvoicesList() {
    const tbody = document.getElementById('invoices-list-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (invoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999; padding:30px;">لا توجد فواتير محفوظة</td></tr>';
        return;
    }
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong style="color:#0f172a;">${invoice.invoiceNumber}</strong></td>
            <td>${new Date(invoice.date).toLocaleDateString('ar-EG')}</td>
            <td><strong>${invoice.client.name}</strong></td>
            <td>${invoice.subtotal.toFixed(2)} ج.م</td>
            <td>${(invoice.discount || 0).toFixed(2)} ج.م</td>
            <td><strong style="color:#667eea;">${invoice.total.toFixed(2)} ج.م</strong></td>
            <td>
                <button class="btn btn-primary btn-small" onclick="viewInvoice(${invoice.id})" title="عرض" style="padding:6px 8px;"><i class="fas fa-eye"></i></button>
                <button class="btn btn-small" onclick="editInvoice(${invoice.id})" title="تعديل" style="padding:6px 8px; background:#3498db; color:white;"><i class="fas fa-edit"></i></button>
                <button class="btn btn-success btn-small" onclick="printInvoice(${invoice.id})" title="طباعة" style="padding:6px 8px;"><i class="fas fa-print"></i></button>
                <button class="btn btn-info btn-small" onclick="downloadInvoicePDF(${invoice.id})" title="PDF" style="padding:6px 8px;"><i class="fas fa-file-pdf"></i></button>
                <button class="btn btn-small" onclick="downloadInvoiceJPEG(${invoice.id})" title="JPEG" style="padding:6px 8px; background:#e67e22; color:white;"><i class="fas fa-image"></i></button>
                <button class="btn btn-small" onclick="sendInvoiceWhatsApp('${invoice.invoiceNumber}','${invoice.client.phone}',${invoice.total})" title="واتس" style="padding:6px 8px; background:#25d366; color:white;"><i class="fab fa-whatsapp"></i></button>
                <button class="btn btn-danger btn-small" onclick="deleteInvoice(${invoice.id})" title="حذف" style="padding:6px 8px;"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ===== معاينة من النموذج =====
function previewInvoice() {
    const invoiceNumber = document.getElementById('invoice-number').value.trim();
    const invoiceDate = document.getElementById('invoice-date').value;
    const clientName = document.getElementById('invoice-client-name').value.trim();
    const clientPhone = document.getElementById('invoice-client-phone').value.trim();
    const clientEmail = document.getElementById('invoice-client-email').value.trim();
    const clientAddress = document.getElementById('invoice-client-address').value.trim();
    const taxNumber = document.getElementById('invoice-tax-number').value.trim();
    const taxRate = parseFloat(document.getElementById('invoice-tax-rate').value) || 14;
    const discountRate = parseFloat(document.getElementById('invoice-discount').value) || 0;
    const feesRate = parseFloat(document.getElementById('invoice-fees').value) || 0;
    const notes = document.getElementById('invoice-notes').value.trim();
    const paymentMethod = document.getElementById('invoice-payment').value || 'نقداً';
    const storeName = document.getElementById('invoice-store-name')?.value.trim() || 'متجر مشالى';
    const storeAddress = document.getElementById('invoice-store-address')?.value.trim() || '';
    const storePhone = document.getElementById('invoice-store-phone')?.value.trim() || '';
    const commercial = document.getElementById('invoice-commercial')?.value.trim() || '';
    const storeLogo = document.getElementById('invoice-store-logo')?.value.trim() || '';
    const storeSignature = document.getElementById('invoice-store-signature')?.value.trim() || '';

    if (!invoiceNumber || !clientName || !invoiceDate) { alert('يرجى ملء البيانات الأساسية'); return; }
    const items = collectInvoiceItems();
    if (items.length === 0) { alert('يرجى إضافة بند واحد على الأقل'); return; }

    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discount = (subtotal * discountRate) / 100;
    const afterDiscount = subtotal - discount;
    const fees = (afterDiscount * feesRate) / 100;
    const tax = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + fees + tax;

    displayInvoiceModal({
        id: Date.now(), invoiceNumber, date: invoiceDate,
        client: { name: clientName, phone: clientPhone, email: clientEmail, address: clientAddress },
        taxNumber, taxRate, discountRate, feesRate, items,
        subtotal, discount, afterDiscount, fees, tax, total, notes, paymentMethod,
        storeName, storeAddress, storePhone, commercial, storeLogo, storeSignature
    }, true);
}

// ===== عرض فاتورة محفوظة =====
function viewInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) { alert('الفاتورة غير موجودة'); return; }
    displayInvoiceModal(invoice);
}

// ===== تعديل فاتورة =====
function editInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) { alert('لم يتم العثور على الفاتورة'); return; }
    editingInvoiceId = invoiceId;

    document.getElementById('invoice-number').value = invoice.invoiceNumber || '';
    document.getElementById('invoice-date').value = invoice.date || '';
    document.getElementById('invoice-client-name').value = invoice.client.name || '';
    document.getElementById('invoice-client-phone').value = invoice.client.phone || '';
    document.getElementById('invoice-client-email').value = invoice.client.email || '';
    document.getElementById('invoice-client-address').value = invoice.client.address || '';
    document.getElementById('invoice-tax-number').value = invoice.taxNumber || '';
    document.getElementById('invoice-tax-rate').value = invoice.taxRate || '14';
    document.getElementById('invoice-discount').value = invoice.discountRate || '0';
    document.getElementById('invoice-fees').value = invoice.feesRate || '0';
    document.getElementById('invoice-notes').value = invoice.notes || '';
    const pm = document.getElementById('invoice-payment');
    if (pm) pm.value = invoice.paymentMethod || 'نقداً';
    const setF = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    setF('invoice-store-name', invoice.storeName || 'متجر مشالى');
    setF('invoice-store-address', invoice.storeAddress);
    setF('invoice-store-phone', invoice.storePhone);
    setF('invoice-commercial', invoice.commercial);
    setF('invoice-store-logo', invoice.storeLogo);
    setF('invoice-store-signature', invoice.storeSignature);

    const container = document.getElementById('invoice-items-container');
    container.innerHTML = '';
    if (invoice.items && invoice.items.length > 0) {
        invoice.items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.className = 'invoice-item-row';
            itemRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;';
            itemRow.innerHTML = `
                <div class="form-group"><input type="text" class="item-name" value="${item.name || ''}" placeholder="مثال: هارد SSD"></div>
                <div class="form-group"><input type="number" class="item-quantity" value="${item.quantity || 1}" min="1" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)"></div>
                <div class="form-group"><input type="number" class="item-price" value="${item.price || 0}" placeholder="0" oninput="updateInvoiceItemTotal(this)" onchange="updateInvoiceItemTotal(this)"></div>
                <div class="form-group"><input type="number" class="item-total" value="${item.total || 0}" readonly style="background:#f0f0f0;"></div>
                <button type="button" class="btn btn-danger btn-small" onclick="removeInvoiceItem(this)">حذف</button>
            `;
            container.appendChild(itemRow);
        });
    } else {
        addInvoiceItem();
    }
    updateInvoiceTotals();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== حذف فاتورة =====
function deleteInvoice(invoiceId) {
    if (!confirm('هل تريد حذف هذه الفاتورة نهائياً؟')) return;
    invoices = invoices.filter(inv => inv.id !== invoiceId);
    localStorage.setItem('storeInvoices', JSON.stringify(invoices));
    displayInvoicesList();
}

// ===== عرض نافذة الفاتورة (مع QR وبيانات المتجر وطريقة الدفع) =====
function displayInvoiceModal(invoice, isPreview = false) {
    let modal = document.getElementById('invoice-modal-main');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'invoice-modal-main';
        modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:4000; align-items:flex-start; justify-content:center; padding:50px 20px; overflow-y:auto;';
        document.body.appendChild(modal);
    }

    let itemsHTML = '';
    invoice.items.forEach(item => {
        itemsHTML += '<tr>' +
            '<td style="padding:12px; border:1px solid #e2e8f0;">' + item.name + '</td>' +
            '<td style="text-align:center; padding:12px; border:1px solid #e2e8f0;">' + item.quantity + '</td>' +
            '<td style="text-align:right; padding:12px; border:1px solid #e2e8f0;">' + item.price.toFixed(2) + ' ج.م</td>' +
            '<td style="text-align:right; font-weight:bold; padding:12px; border:1px solid #e2e8f0;">' + item.total.toFixed(2) + ' ج.م</td>' +
            '</tr>';
    });

    let fin = '<div style="display:flex; justify-content:flex-end; margin-bottom:20px;"><div style="width:380px; background:#f9f9f9; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">' +
        '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #ddd; font-size:0.95rem;"><span>الإجمالي الفرعي:</span><span style="font-weight:bold;">' + invoice.subtotal.toFixed(2) + ' ج.م</span></div>';
    if (invoice.discountRate && invoice.discount > 0) {
        fin += '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #ddd; color:#27ae60; font-size:0.95rem;"><span>خصم (' + invoice.discountRate + '%):</span><span style="font-weight:bold;">-' + invoice.discount.toFixed(2) + ' ج.م</span></div>';
    }
    if (invoice.feesRate && invoice.fees > 0) {
        fin += '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #ddd; color:#e74c3c; font-size:0.95rem;"><span>رسوم (' + invoice.feesRate + '%):</span><span style="font-weight:bold;">+' + invoice.fees.toFixed(2) + ' ج.م</span></div>';
    }
    fin += '<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #ddd; font-size:0.95rem;"><span>الضريبة (' + invoice.taxRate + '%):</span><span style="font-weight:bold;">' + invoice.tax.toFixed(2) + ' ج.م</span></div>' +
        '<div style="display:flex; justify-content:space-between; padding:12px; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; font-weight:bold; border-radius:6px; font-size:1.15rem; margin-top:8px;"><span>المجموع النهائي:</span><span>' + invoice.total.toFixed(2) + ' ج.م</span></div>' +
        '</div></div>';

    let notesHTML = invoice.notes ? '<div style="background:#fff9c4; padding:18px; border-radius:10px; border-right:5px solid #e67e22; margin-bottom:25px; border:2px solid #e67e2240;">' +
        '<p style="margin:0; font-weight:bold; margin-bottom:10px; color:#0f172a;">ملاحظات وشروط:</p>' +
        '<p style="margin:0; color:#555; white-space:pre-wrap; font-size:0.95rem;">' + invoice.notes + '</p></div>' : '';

    let taxNumHTML = invoice.taxNumber ? '<p style="margin:6px 0; color:#666; font-size:0.9rem;">الرقم الضريبي: <strong>' + invoice.taxNumber + '</strong></p>' : '';
    let payHTML = invoice.paymentMethod ? '<p style="margin:6px 0; color:#666; font-size:0.9rem;">طريقة الدفع: <strong>' + invoice.paymentMethod + '</strong></p>' : '';
    let logoHTML = invoice.storeLogo ? '<img src="' + invoice.storeLogo + '" style="max-height:70px; max-width:140px; object-fit:contain;" onerror="this.style.display=\'none\'">' : '<p style="margin:0; font-size:3rem;">STORE</p>';
    let signatureHTML = invoice.storeSignature ? '<img src="' + invoice.storeSignature + '" style="max-height:70px; max-width:200px; object-fit:contain;" onerror="this.style.display=\'none\'">' : '<p style="border-bottom:2px solid #000; height:60px; margin-bottom:8px;"></p>';

    modal.innerHTML = '<div style="background:white; width:950px; max-width:100%; padding:30px; border-radius:12px; position:relative; box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
        '<button onclick="document.getElementById(\'invoice-modal-main\').style.display=\'none\'" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer; color:#999;">X</button>' +
        '<div id="invoice-content" style="border:3px solid #0f172a; padding:35px; font-family:\'Cairo\',sans-serif; color:#000; background:white;">' +
        '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:4px solid #0f172a; padding-bottom:25px; margin-bottom:30px;">' +
        '<div style="flex:1;">' +
        '<h1 style="margin:0; color:#0f172a; font-size:2.2rem; font-weight:900;">فاتورة</h1>' +
        '<p style="margin:8px 0; color:#666; font-size:0.95rem;"><strong>رقم الفاتورة:</strong> <span style="color:#0f172a; font-weight:bold; font-family:monospace;">' + invoice.invoiceNumber + '</span></p>' +
        '<p style="margin:5px 0; color:#666; font-size:0.95rem;"><strong>التاريخ:</strong> ' + new Date(invoice.date).toLocaleDateString('ar-EG') + '</p>' +
        payHTML +
        '</div>' +
        '<div style="text-align:center; flex:1;">' +
        logoHTML +
        '<p style="margin:5px 0; font-weight:bold; color:#0f172a; font-size:1.1rem;">' + (invoice.storeName || 'متجر مشالى') + '</p>' +
        '<p style="margin:3px 0; color:#e67e22; font-size:0.9rem; font-weight:600;">الإلكترونيات والتكنولوجيا</p>' +
        '<p contenteditable="true" style="margin:3px 0; color:#666; font-size:0.8rem;">' + (invoice.storeAddress || '') + '</p>' +
        '<p contenteditable="true" style="margin:3px 0; color:#666; font-size:0.8rem;">' + (invoice.storePhone || '') + '</p>' +
        '</div>' +
        '<div id="invoice-qr" style="text-align:center; flex:1;"></div>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:30px;">' +
        '<div style="background:linear-gradient(135deg,#667eea15 0%,#764ba215 100%); padding:18px; border-radius:10px; border:2px solid #667eea40;">' +
        '<p style="margin:0; font-weight:bold; color:#0f172a; margin-bottom:10px; font-size:1.05rem;">فاتورة إلى:</p>' +
        '<p style="margin:6px 0; color:#0f172a; font-weight:600; font-size:1.05rem;">' + invoice.client.name + '</p>' +
        '<p style="margin:5px 0; color:#666; font-size:0.9rem;">' + invoice.client.phone + '</p>' +
        '<p style="margin:5px 0; color:#666; font-size:0.9rem;">' + invoice.client.email + '</p>' +
        '<p style="margin:5px 0; color:#666; font-size:0.9rem;">' + invoice.client.address + '</p>' +
        '</div>' +
        '<div style="background:linear-gradient(135deg,#f093fb15 0%,#f5576c15 100%); padding:18px; border-radius:10px; border:2px solid #f5576c40; text-align:right;">' +
        '<p style="margin:0; font-weight:bold; color:#0f172a; margin-bottom:10px; font-size:1.05rem;">من:</p>' +
        '<p style="margin:6px 0; font-weight:600; color:#0f172a; font-size:1.05rem;">' + (invoice.storeName || 'متجر مشالى') + '</p>' +
        taxNumHTML +
        (invoice.commercial ? '<p style="margin:6px 0; color:#666; font-size:0.9rem;">السجل التجاري: <strong>' + invoice.commercial + '</strong></p>' : '') +
        '<p style="margin:6px 0; color:#666; font-size:0.9rem;">التاريخ: <strong>' + new Date(invoice.date).toLocaleDateString('ar-EG') + '</strong></p>' +
        '</div>' +
        '</div>' +
        '<table style="width:100%; border-collapse:collapse; margin-bottom:25px;">' +
        '<thead><tr style="background:linear-gradient(135deg,#0f172a 0%,#1a2332 100%); color:white;">' +
        '<th style="border:1px solid #ddd; padding:14px; text-align:right;">البند</th>' +
        '<th style="border:1px solid #ddd; padding:14px; text-align:center;">الكمية</th>' +
        '<th style="border:1px solid #ddd; padding:14px; text-align:right;">السعر الواحد</th>' +
        '<th style="border:1px solid #ddd; padding:14px; text-align:right;">الإجمالي</th>' +
        '</tr></thead><tbody>' + itemsHTML + '</tbody></table>' +
        fin + notesHTML +
        '<div style="margin-top:35px; display:flex; justify-content:space-between; align-items:flex-end; padding-top:25px; border-top:2px solid #ddd;">' +
        '<div style="text-align:center; width:200px;">' + signatureHTML + '<p style="margin:0; font-size:0.95rem; color:#0f172a; font-weight:bold;">توقيع المسؤول</p></div>' +
        '<div style="text-align:center; flex:1;"><p style="margin:0; color:#0f172a; font-weight:bold; font-size:1.1rem;">شكراً لتعاملكم معنا</p>' +
        '<p style="margin:8px 0; color:#999; font-size:0.85rem;">نتمنى لكم تجربة تسوق ممتعة وخدمة على أعلى مستوى</p></div>' +
        '</div></div>' +
        '<div style="display:flex; gap:12px; justify-content:center; margin-top:25px; flex-wrap:wrap;">' +
        '<button class="btn btn-primary" onclick="printInvoiceWindow()"><i class="fas fa-print"></i> طباعة</button>' +
        '<button class="btn btn-success" onclick="downloadInvoicePDFDirect()"><i class="fas fa-file-pdf"></i> PDF</button>' +
        '<button class="btn" style="background:#e67e22; color:white;" onclick="downloadInvoiceJPEGDirect()"><i class="fas fa-image"></i> JPEG</button>' +
        '<button class="btn btn-info" onclick="sendInvoiceWhatsApp(\'' + invoice.invoiceNumber + '\',\'' + invoice.client.phone + '\',' + invoice.total + ')"><i class="fab fa-whatsapp"></i> واتس (نص)</button>' +
        '<button class="btn" style="background:#25d366; color:white;" onclick="shareInvoiceAsImage()"><i class="fab fa-whatsapp"></i> واتس (صورة)</button>' +
        '<button class="btn" style="background:#128C7E; color:white;" onclick="shareInvoiceAsPDF()"><i class="fab fa-whatsapp"></i> واتس (PDF)</button>' +
        '<button class="btn btn-secondary" onclick="document.getElementById(\'invoice-modal-main\').style.display=\'none\'"><i class="fas fa-times"></i> إغلاق</button>' +
        '</div></div>';

    modal.style.display = 'flex';
    window.currentInvoice = invoice;

    setTimeout(function () {
        const qr = document.getElementById('invoice-qr');
        if (qr && qr.children.length === 0 && typeof QRCode !== 'undefined') {
            try {
                new QRCode(qr, {
                    text: 'Invoice: ' + invoice.invoiceNumber + '|Client: ' + invoice.client.name + '|Amount: ' + invoice.total + '|Date: ' + invoice.date,
                    width: 130, height: 130, colorDark: '#0f172a', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
                });
            } catch (e) { console.log('QR failed'); }
        }
    }, 100);
}

// ===== إرسال نص على واتساب =====
function sendInvoiceWhatsApp(invoiceNumber, clientPhone, totalAmount) {
    if (!clientPhone) { alert('رقم هاتف العميل غير موجود'); return; }
    const inv = window.currentInvoice;
    if (!inv) return;
    let phone = clientPhone.replace(/^0/, '2');
    let itemsList = inv.items.map(i => i.name + ' x' + i.quantity + ' = ' + i.total.toFixed(2) + ' ج.م').join('%0A');
    let msg = 'فاتورة من متجر مشالى%0A%0A';
    msg += 'رقم الفاتورة: ' + invoiceNumber + '%0A';
    msg += 'العميل: ' + inv.client.name + '%0A%0A';
    msg += 'البيانات:%0A' + itemsList + '%0A%0A';
    msg += 'الملخص المالي:%0A';
    msg += 'الإجمالي الفرعي: ' + inv.subtotal.toFixed(2) + ' ج.م%0A';
    if (inv.discountRate > 0) msg += 'الخصم (' + inv.discountRate + '%): -' + inv.discount.toFixed(2) + ' ج.م%0A';
    if (inv.feesRate > 0) msg += 'الرسوم (' + inv.feesRate + '%): +' + inv.fees.toFixed(2) + ' ج.م%0A';
    msg += 'الضريبة (' + inv.taxRate + '%): ' + inv.tax.toFixed(2) + ' ج.م%0A%0A';
    msg += 'المجموع النهائي: ' + inv.total.toFixed(2) + ' ج.م%0A%0A';
    msg += 'شكراً لتعاملكم معنا';
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
}

// ===== طباعة =====
function printInvoice(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => printInvoiceWindow(), 500);
}
function printInvoiceWindow() { window.print(); }

// ===== تحميل PDF =====
function downloadInvoicePDF(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => downloadInvoicePDFDirect(), 500);
}
function downloadInvoicePDFDirect() {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') { alert('مكتبات PDF غير محمّلة'); return; }
    html2canvas(content, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save((window.currentInvoice?.invoiceNumber || 'invoice') + '.pdf');
    });
}

// ===== تحميل JPEG =====
function downloadInvoiceJPEG(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    displayInvoiceModal(invoice);
    setTimeout(() => downloadInvoiceJPEGDirect(), 500);
}
function downloadInvoiceJPEGDirect() {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    if (typeof html2canvas === 'undefined') { alert('مكتبة الصور غير محمّلة'); return; }
    html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = (window.currentInvoice?.invoiceNumber || 'invoice') + '.jpeg';
        link.click();
    });
}

// ===== مشاركة الصورة عبر واتساب (مع تحميل احتياطي) =====
function shareInvoiceAsImage() {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    if (typeof html2canvas === 'undefined') { alert('مكتبة الصور غير محمّلة'); return; }
    html2canvas(content, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
        canvas.toBlob(blob => {
            const file = new File([blob], (window.currentInvoice?.invoiceNumber || 'invoice') + '.jpeg', { type: 'image/jpeg' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                navigator.share({ files: [file], title: 'فاتورة', text: 'فاتورة من متجر مشالى' }).catch(() => {});
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = file.name;
                link.click();
                alert('تم تحميل الصورة. افتح واتساب وأرفقها يدوياً.');
            }
        }, 'image/jpeg', 0.95);
    });
}

// ===== مشاركة PDF عبر واتساب (مع تحميل احتياطي) =====
function shareInvoiceAsPDF() {
    const content = document.getElementById('invoice-content');
    if (!content) return;
    if (typeof html2canvas === 'undefined' || typeof jsPDF === 'undefined') { alert('مكتبات PDF غير محمّلة'); return; }
    html2canvas(content, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        const blob = pdf.output('blob');
        const file = new File([blob], (window.currentInvoice?.invoiceNumber || 'invoice') + '.pdf', { type: 'application/pdf' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ files: [file], title: 'فاتورة', text: 'فاتورة من متجر مشالى' }).catch(() => {});
        } else {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = file.name;
            link.click();
            alert('تم تحميل الـ PDF. افتح واتساب وأرفقه يدوياً.');
        }
    });
}

// ===== حفظ بيانات المتجر (تثبيت البيانات الأساسية) =====
function saveStoreInfo() {
    const storeInfo = {
        storeName: document.getElementById('invoice-store-name')?.value.trim() || 'متجر مشالى',
        storeAddress: document.getElementById('invoice-store-address')?.value.trim() || '',
        storePhone: document.getElementById('invoice-store-phone')?.value.trim() || '',
        commercial: document.getElementById('invoice-commercial')?.value.trim() || '',
        storeLogo: document.getElementById('invoice-store-logo')?.value.trim() || '',
        storeSignature: document.getElementById('invoice-store-signature')?.value.trim() || ''
    };
    localStorage.setItem('storeInvoiceSettings', JSON.stringify(storeInfo));
    alert('✅ تم حفظ بيانات المتجر بنجاح!');
}

// ===== تهيئة تبويب الفواتير =====
function initInvoiceTab() {
    displayInvoicesList();
    resetInvoiceForm();
}
