// ==========================================
// 📤 نظام رفع الملفات إلى Google Drive
// ==========================================

// متغيرات عالمية
let uploadedImages = [];
let uploadedVideos = [];
let driveApiKey = '';

// ===== تهيئة منطقة الرفع (Drop Zone) =====
document.addEventListener('DOMContentLoaded', function() {
    initializeUploadZones();
});

function initializeUploadZones() {
    // منطقة رفع الصور
    const dropZone = document.getElementById('drop-zone');
    const imageInput = document.getElementById('image-upload-input');
    
    if(dropZone && imageInput) {
        // السحب والإفلات
        dropZone.addEventListener('dragover', handleDragOver);
        dropZone.addEventListener('dragleave', handleDragLeave);
        dropZone.addEventListener('drop', (e) => handleDrop(e, 'image'));
        
        // النقر
        dropZone.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', (e) => handleImageSelect(e));
    }
    
    // منطقة رفع الفيديوهات
    const videoDropZone = document.getElementById('video-drop-zone');
    const videoInput = document.getElementById('video-upload-input');
    
    if(videoDropZone && videoInput) {
        videoDropZone.addEventListener('dragover', handleDragOver);
        videoDropZone.addEventListener('dragleave', handleDragLeave);
        videoDropZone.addEventListener('drop', (e) => handleDrop(e, 'video'));
        
        videoDropZone.addEventListener('click', () => videoInput.click());
        videoInput.addEventListener('change', (e) => handleVideoSelect(e));
    }
    
    // تحميل مفتاح Google Drive من localStorage إذا كان موجوداً
    driveApiKey = localStorage.getItem('googleDriveApiKey') || '';
    const apiKeyInput = document.getElementById('drive-api-key');
    if(apiKeyInput && driveApiKey) {
        apiKeyInput.value = '*'.repeat(20); // إخفاء المفتاح
    }
    
    // حفظ المفتاح عند التغيير
    if(apiKeyInput) {
        apiKeyInput.addEventListener('change', (e) => {
            if(e.target.value.trim().length > 0) {
                driveApiKey = e.target.value.trim();
                localStorage.setItem('googleDriveApiKey', driveApiKey);
                showNotification('✅ تم حفظ مفتاح Google Drive!', 'success');
            }
        });
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '#e8f5e9';
    this.style.borderColor = '#4caf50';
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '';
    this.style.borderColor = '';
}

function handleDrop(e, type) {
    e.preventDefault();
    e.stopPropagation();
    this.style.background = '';
    this.style.borderColor = '';
    
    const files = e.dataTransfer.files;
    if(type === 'image') {
        handleImageSelect({ target: { files } });
    } else if(type === 'video') {
        handleVideoSelect({ target: { files } });
    }
}

async function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    for(const file of files) {
        if(!file.type.startsWith('image/')) {
            showNotification('❌ الملف يجب أن يكون صورة!', 'error');
            continue;
        }
        
        if(file.size > 10 * 1024 * 1024) { // 10MB
            showNotification('❌ حجم الصورة كبير جداً (حد أقصى 10MB)', 'error');
            continue;
        }
        
        // إضافة معاينة محلية أولاً
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageObj = {
                id: Date.now() + Math.random(),
                src: event.target.result,
                file: file,
                uploaded: false,
                url: ''
            };
            uploadedImages.push(imageObj);
            displayImagePreview(imageObj);
        };
        reader.readAsDataURL(file);
    }
}

async function handleVideoSelect(e) {
    const files = Array.from(e.target.files);
    for(const file of files) {
        if(!file.type.startsWith('video/')) {
            showNotification('❌ الملف يجب أن يكون فيديو!', 'error');
            continue;
        }
        
        if(file.size > 100 * 1024 * 1024) { // 100MB
            showNotification('❌ حجم الفيديو كبير جداً (حد أقصى 100MB)', 'error');
            continue;
        }
        
        // إضافة معاينة محلية أولاً
        const reader = new FileReader();
        reader.onload = function(event) {
            const videoObj = {
                id: Date.now() + Math.random(),
                file: file,
                uploaded: false,
                url: ''
            };
            uploadedVideos.push(videoObj);
            displayVideoPreview(videoObj);
        };
        reader.readAsArrayBuffer(file);
    }
}

function displayImagePreview(imageObj) {
    const previewContainer = document.getElementById('images-preview');
    if(!previewContainer) return;
    
    const imgElement = document.createElement('div');
    imgElement.style.cssText = `
        position: relative;
        width: 100px;
        height: 100px;
        border-radius: 8px;
        overflow: hidden;
        background: #f0f0f0;
    `;
    imgElement.id = `img-${imageObj.id}`;
    
    imgElement.innerHTML = `
        <img src="${imageObj.src}" style="width:100%; height:100%; object-fit:cover;">
        <div class="img-overlay" style="
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.7rem;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.3s;
        ">
            <div class="upload-status" style="text-align: center;">
                <div class="loading-spinner" style="display: none; width: 20px; height: 20px; border: 2px solid white; border-right: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
                <span class="status-text">انتظر...</span>
            </div>
            <button style="
                background: #ff6b6b;
                border: none;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.7rem;
            " onclick="removeImage('${imageObj.id}')">حذف</button>
        </div>
    `;
    
    imgElement.addEventListener('mouseenter', () => {
        imgElement.querySelector('.img-overlay').style.opacity = '1';
    });
    imgElement.addEventListener('mouseleave', () => {
        imgElement.querySelector('.img-overlay').style.opacity = '0';
    });
    
    previewContainer.appendChild(imgElement);
    
    // رفع الصورة تلقائياً إلى Google Drive
    uploadImageToGoogleDrive(imageObj);
}

function displayVideoPreview(videoObj) {
    const previewContainer = document.getElementById('videos-preview');
    if(!previewContainer) return;
    
    const videoElement = document.createElement('div');
    videoElement.style.cssText = `
        position: relative;
        width: 120px;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 2rem;
    `;
    videoElement.id = `vid-${videoObj.id}`;
    
    videoElement.innerHTML = `
        <i class="fas fa-film"></i>
        <div class="vid-overlay" style="
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.7rem;
            gap: 5px;
            opacity: 0;
            transition: opacity 0.3s;
        ">
            <div class="upload-status" style="text-align: center;">
                <div class="loading-spinner" style="display: none; width: 20px; height: 20px; border: 2px solid white; border-right: 2px solid transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></div>
                <span class="status-text">انتظر...</span>
            </div>
            <button style="
                background: #ff6b6b;
                border: none;
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.7rem;
            " onclick="removeVideo('${videoObj.id}')">حذف</button>
        </div>
    `;
    
    videoElement.addEventListener('mouseenter', () => {
        videoElement.querySelector('.vid-overlay').style.opacity = '1';
    });
    videoElement.addEventListener('mouseleave', () => {
        videoElement.querySelector('.vid-overlay').style.opacity = '0';
    });
    
    previewContainer.appendChild(videoElement);
    
    // رفع الفيديو تلقائياً إلى Google Drive
    uploadVideoToGoogleDrive(videoObj);
}

// ===== رفع الملفات إلى Google Drive =====
async function uploadImageToGoogleDrive(imageObj) {
    if(!driveApiKey) {
        showNotification('⚠️ يرجى إدخال مفتاح Google Drive API أولاً!', 'warning');
        return;
    }
    
    const overlay = document.querySelector(`#img-${imageObj.id} .img-overlay`);
    if(overlay) {
        overlay.querySelector('.loading-spinner').style.display = 'block';
        overlay.querySelector('.status-text').textContent = 'جاري الرفع...';
    }
    
    try {
        // استخدام متحول GoogleDriveAPI  (يتطلب إنشاء خادم وسيط)
        // للآن سنحفظ الرابط المحلي والمستخدم يمكنه مشاركة الملف
        const formData = new FormData();
        formData.append('file', imageObj.file);
        formData.append('name', `product-${Date.now()}-${imageObj.file.name}`);
        
        // ستحتاج إلى إنشاء نقطة نهاية (endpoint) على الخادم الخاص بك
        const response = await fetch('/api/upload-to-drive', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${driveApiKey}`
            }
        });
        
        if(response.ok) {
            const data = await response.json();
            imageObj.url = data.downloadUrl;
            imageObj.uploaded = true;
            
            // إضافة الرابط إلى حقل الصور
            const textarea = document.getElementById('product-image');
            if(textarea) {
                textarea.value = (textarea.value + '\n' + imageObj.url).trim();
            }
            
            showNotification('✅ تم رفع الصورة بنجاح!', 'success');
        } else {
            throw new Error('خطأ في الرفع');
        }
    } catch(error) {
        console.error('خطأ الرفع:', error);
        showNotification('❌ فشل رفع الصورة. استخدم رابط يدوي.', 'error');
        
        // في الوقت الحالي، يمكن حفظ الرابط المحلي
        imageObj.url = imageObj.src;
    }
    
    if(overlay) {
        overlay.querySelector('.loading-spinner').style.display = 'none';
        overlay.querySelector('.status-text').textContent = imageObj.uploaded ? '✅ مرفوعة' : '❌ فشل';
    }
}

async function uploadVideoToGoogleDrive(videoObj) {
    if(!driveApiKey) {
        showNotification('⚠️ يرجى إدخال مفتاح Google Drive API أولاً!', 'warning');
        return;
    }
    
    const overlay = document.querySelector(`#vid-${videoObj.id} .vid-overlay`);
    if(overlay) {
        overlay.querySelector('.loading-spinner').style.display = 'block';
        overlay.querySelector('.status-text').textContent = 'جاري الرفع...';
    }
    
    try {
        const formData = new FormData();
        formData.append('file', videoObj.file);
        formData.append('name', `product-video-${Date.now()}-${videoObj.file.name}`);
        
        const response = await fetch('/api/upload-to-drive', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${driveApiKey}`
            }
        });
        
        if(response.ok) {
            const data = await response.json();
            videoObj.url = data.downloadUrl;
            videoObj.uploaded = true;
            
            // إضافة الرابط إلى حقل الفيديوهات
            const textarea = document.getElementById('product-videos');
            if(textarea) {
                textarea.value = (textarea.value + '\n' + videoObj.url).trim();
            }
            
            showNotification('✅ تم رفع الفيديو بنجاح!', 'success');
        } else {
            throw new Error('خطأ في الرفع');
        }
    } catch(error) {
        console.error('خطأ الرفع:', error);
        showNotification('❌ فشل رفع الفيديو.', 'error');
    }
    
    if(overlay) {
        overlay.querySelector('.loading-spinner').style.display = 'none';
        overlay.querySelector('.status-text').textContent = videoObj.uploaded ? '✅ مرفوع' : '❌ فشل';
    }
}

function removeImage(imageId) {
    uploadedImages = uploadedImages.filter(img => img.id != imageId);
    const element = document.getElementById(`img-${imageId}`);
    if(element) element.remove();
}

function removeVideo(videoId) {
    uploadedVideos = uploadedVideos.filter(vid => vid.id != videoId);
    const element = document.getElementById(`vid-${videoId}`);
    if(element) element.remove();
}

function showNotification(message, type) {
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if(type === 'success') notif.style.background = '#4caf50';
    else if(type === 'error') notif.style.background = '#f44336';
    else if(type === 'warning') notif.style.background = '#ff9800';
    else notif.style.background = '#2196f3';
    
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// إضافة حالات CSS للتنبيهات
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
