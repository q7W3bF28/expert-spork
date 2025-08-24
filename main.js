// 全局变量
let uploadedImages = [];
let isOrdered = false;
let sortable = null;
let currentProcessCanceled = false;
let currentModalIndex = 0;

// DOM元素
const fileInput = document.getElementById('image-upload');
const uploadArea = document.getElementById('upload-area');
const imagePreviewArea = document.getElementById('image-preview-area');
const emptyState = document.getElementById('empty-state');
const pageSizeSelect = document.getElementById('page-size');
const marginInput = document.getElementById('margin-range');
const marginValue = document.getElementById('margin-value');
const orientationSelect = document.getElementById('orientation');
const imageFitSelect = document.getElementById('image-fit');
const qualityInput = document.getElementById('quality-range');
const qualityValue = document.getElementById('quality-value');
const filenameInput = document.getElementById('filename');
const generatePreviewBtn = document.getElementById('generate-preview');
const generatePdfBtn = document.getElementById('generate-pdf');
const pdfPreviewArea = document.getElementById('pdf-preview');
const pdfSection = document.getElementById('pdf-section');
const closePreviewBtn = document.getElementById('close-preview');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const progressDetail = document.getElementById('progress-detail');
const cancelProcessBtn = document.getElementById('cancel-process');
const imageCount = document.getElementById('image-count');
const orderAlert = document.getElementById('order-alert');
const orderMessage = document.getElementById('order-message');
const fixOrderBtn = document.getElementById('fix-order');
const ignoreOrderBtn = document.getElementById('ignore-order');
const clearAllBtn = document.getElementById('clear-all');
const autoSortBtn = document.getElementById('auto-sort');
const reverseOrderBtn = document.getElementById('reverse-order');
const addMoreBtn = document.getElementById('add-more');
const resetSettingsBtn = document.getElementById('reset-settings');
const toast = document.getElementById('toast');
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalFilename = document.getElementById('modal-filename');
const modalIndex = document.getElementById('modal-index');
const closeModalBtn = document.getElementById('close-modal');
const prevImageBtn = document.getElementById('prev-image');
const nextImageBtn = document.getElementById('next-image');
const viewButtons = document.querySelectorAll('.view-btn');
const showHelpBtn = document.getElementById('show-help');
const reportIssueBtn = document.getElementById('report-issue');

// 初始化
document.addEventListener('DOMContentLoaded', init);

function init() {
    // 设置事件监听器
    setupEventListeners();
    
    // 加载保存的设置
    loadSettings();
    
    // 更新范围输入的值显示
    updateRangeValues();
}

function setupEventListeners() {
    // 文件上传事件
    fileInput.addEventListener('change', handleFileUpload);
    
    // 拖放事件
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileUpload({ target: fileInput });
        }
    });
    
    // 点击上传区域触发文件选择
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || !e.target.closest('button')) {
            fileInput.click();
        }
    });
    
    // 范围输入和数字输入的同步
    marginInput.addEventListener('input', () => {
        marginValue.textContent = marginInput.value;
        saveSettings();
    });
    
    qualityInput.addEventListener('input', () => {
        qualityValue.textContent = qualityInput.value;
        saveSettings();
    });
    
    // 生成预览事件
    generatePreviewBtn.addEventListener('click', generatePreview);
    
    // 生成PDF事件
    generatePdfBtn.addEventListener('click', generatePDF);
    
    // 关闭预览
    closePreviewBtn.addEventListener('click', () => {
        pdfSection.style.display = 'none';
    });
    
    // 取消处理
    cancelProcessBtn.addEventListener('click', () => {
        currentProcessCanceled = true;
        hideProgress();
        showToast('生成已取消', 'warning');
    });
    
    // 清空所有图片
    clearAllBtn.addEventListener('click', clearAllImages);
    
    // 自动排序
    autoSortBtn.addEventListener('click', autoSortImages);
    
    // 反转顺序
    reverseOrderBtn.addEventListener('click', reverseImageOrder);
    
    // 添加更多图片
    addMoreBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    // 重置设置
    resetSettingsBtn.addEventListener('click', resetSettings);
    
    // 修正顺序
    fixOrderBtn.addEventListener('click', fixImageOrder);
    
    // 忽略顺序警告
    ignoreOrderBtn.addEventListener('click', () => {
        orderAlert.style.display = 'none';
        isOrdered = true;
        showToast('已忽略顺序警告', 'warning');
    });
    
    // 设置变化时保存
    pageSizeSelect.addEventListener('change', saveSettings);
    orientationSelect.addEventListener('change', saveSettings);
    imageFitSelect.addEventListener('change', saveSettings);
    filenameInput.addEventListener('change', saveSettings);
    
    // 图片查看模态框
    closeModalBtn.addEventListener('click', () => {
        hideModal(imageModal);
    });
    
    prevImageBtn.addEventListener('click', showPrevImage);
    nextImageBtn.addEventListener('click', showNextImage);
    
    // 点击模态框背景关闭
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            hideModal(imageModal);
        }
    });
    
    // 键盘导航
    document.addEventListener('keydown', (e) => {
        if (imageModal.classList.contains('show')) {
            if (e.key === 'Escape') {
                hideModal(imageModal);
            } else if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        }
    });
    
    // 视图切换
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const viewType = btn.dataset.view;
            imagePreviewArea.classList.toggle('list-view', viewType === 'list');
        });
    });
    
    // 页脚链接
    showHelpBtn.addEventListener('click', showHelp);
    reportIssueBtn.addEventListener('click', reportIssue);
}

function updateRangeValues() {
    marginValue.textContent = marginInput.value;
    qualityValue.textContent = qualityInput.value;
}

function handleFileUpload(e) {
    const files = e.target.files;
    if (files.length === 0) return;
    
    // 检查文件类型
    const validImageTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 
        'image/bmp', 'image/tiff', 'image/svg+xml', 
        'image/heic', 'image/heif', 'image/avif', 'image/jxl'
    ];
    
    const invalidFiles = Array.from(files).filter(file => {
        return !validImageTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|heic|heif|avif|jxl)$/i);
    });
    
    if (invalidFiles.length > 0) {
        showToast(`有 ${invalidFiles.length} 个文件不是有效的图片格式`, 'error');
    }
    
    const validFiles = Array.from(files).filter(file => {
        return validImageTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|heic|heif|avif|jxl)$/i);
    });
    
    if (validFiles.length === 0) return;
    
    // 隐藏空状态
    emptyState.style.display = 'none';
    
    // 显示加载提示
    showToast(`正在加载 ${validFiles.length} 张图片...`, 'info');
    
    // 读取上传的图片文件
    let processedCount = 0;
    const totalFiles = validFiles.length;
    
    for (const file of validFiles) {
        const reader = new FileReader();
        reader.onload = (event) => {
            processedCount++;
            
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const imageItem = createImageItem(img, file.name, uploadedImages.length + 1);
                imagePreviewArea.appendChild(imageItem);
                
                // 保存图片信息
                uploadedImages.push({
                    src: event.target.result,
                    name: file.name,
                    element: imageItem,
                    index: uploadedImages.length + 1,
                    file: file,
                    width: img.width,
                    height: img.height
                });
                
                // 更新图片计数
                updateImageCount();
                
                // 当所有图片都加载完成后，检测文件名顺序
                if (processedCount === totalFiles) {
                    checkFileNameOrder();
                    initSortable();
                    showToast(`成功加载 ${validFiles.length} 张图片`, 'success');
                }
            };
            
            img.onerror = () => {
                processedCount++;
                showToast(`图片 ${file.name} 加载失败`, 'error');
                
                // 即使有图片加载失败，也要继续处理其他图片
                if (processedCount === totalFiles) {
                    checkFileNameOrder();
                    initSortable();
                    
                    if (uploadedImages.length > 0) {
                        showToast(`成功加载 ${uploadedImages.length} 张图片，${totalFiles - uploadedImages.length} 张失败`, 'warning');
                    } else {
                        showToast('所有图片加载失败', 'error');
                        emptyState.style.display = 'block';
                    }
                }
            };
        };
        
        reader.onerror = () => {
            processedCount++;
            showToast(`读取文件 ${file.name} 时出错`, 'error');
            
            if (processedCount === totalFiles) {
                checkFileNameOrder();
                initSortable();
                
                if (uploadedImages.length > 0) {
                    showToast(`成功加载 ${uploadedImages.length} 张图片，${totalFiles - uploadedImages.length} 张失败`, 'warning');
                } else {
                    showToast('所有图片加载失败', 'error');
                    emptyState.style.display = 'block';
                }
            }
        };
        
        reader.readAsDataURL(file);
    }
    
    // 重置文件输入，允许再次选择相同文件
    e.target.value = '';
}

function createImageItem(img, filename, index) {
    const div = document.createElement('div');
    div.className = 'image-item';
    div.draggable = true;
    div.dataset.filename = filename;
    div.dataset.index = index;
    
    // 图片序号
    const numberDiv = document.createElement('div');
    numberDiv.className = 'image-number';
    numberDiv.textContent = index;
    
    // 控制按钮
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'image-controls';
    
    // 删除按钮
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'control-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = '删除图片';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage(div);
    });
    
    // 查看按钮
    const zoomBtn = document.createElement('button');
    zoomBtn.className = 'control-btn zoom';
    zoomBtn.innerHTML = '<i class="fas fa-search-plus"></i>';
    zoomBtn.title = '查看大图';
    zoomBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showImageModal(div);
    });
    
    // 拖拽按钮
    const dragBtn = document.createElement('button');
    dragBtn.className = 'control-btn drag';
    dragBtn.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    dragBtn.title = '拖拽调整顺序';
    
    controlsDiv.appendChild(zoomBtn);
    controlsDiv.appendChild(deleteBtn);
    controlsDiv.appendChild(dragBtn);
    
    const imgElement = document.createElement('img');
    imgElement.src = img.src;
    imgElement.alt = filename;
    
    const nameSpan = document.createElement('div');
    nameSpan.className = 'filename';
    nameSpan.textContent = filename;
    nameSpan.title = filename;
    
    // 双击查看大图
    div.addEventListener('dblclick', () => {
        showImageModal(div);
    });
    
    div.appendChild(numberDiv);
    div.appendChild(controlsDiv);
    div.appendChild(imgElement);
    div.appendChild(nameSpan);
    
    return div;
}

function showImageModal(element) {
    const imgElement = element.querySelector('img');
    const src = imgElement.src;
    const filename = element.dataset.filename;
    
    // 找到当前图片的索引
    currentModalIndex = Array.from(imagePreviewArea.querySelectorAll('.image-item')).indexOf(element);
    
    if (currentModalIndex === -1) return;
    
    // 设置模态框内容
    modalImage.src = src;
    modalFilename.textContent = filename;
    modalIndex.textContent = `${currentModalIndex + 1} / ${uploadedImages.length}`;
    
    // 显示模态框
    showModal(imageModal);
    
    // 更新导航按钮状态
    prevImageBtn.disabled = currentModalIndex === 0;
    nextImageBtn.disabled = currentModalIndex === uploadedImages.length - 1;
}

function showModal(modal) {
    modal.classList.add('show');
}

function hideModal(modal) {
    modal.classList.remove('show');
}

function showPrevImage() {
    if (currentModalIndex > 0) {
        currentModalIndex--;
        const imageItem = imagePreviewArea.querySelectorAll('.image-item')[currentModalIndex];
        showImageModal(imageItem);
    }
}

function showNextImage() {
    if (currentModalIndex < uploadedImages.length - 1) {
        currentModalIndex++;
        const imageItem = imagePreviewArea.querySelectorAll('.image-item')[currentModalIndex];
        showImageModal(imageItem);
    }
}

function removeImage(element) {
    const imgElement = element.querySelector('img');
    const src = imgElement.src;
    
    // 从数组中移除
    const imageIndex = uploadedImages.findIndex(img => img.src === src);
    uploadedImages.splice(imageIndex, 1);
    
    // 从DOM中移除
    element.remove();
    
    // 更新序号
    updateImageNumbers();
    
    // 更新计数
    updateImageCount();
    
    // 重新检查顺序
    if (uploadedImages.length > 0) {
        checkFileNameOrder();
    } else {
        orderAlert.style.display = 'none';
        emptyState.style.display = 'block';
    }
    
    showToast('图片已删除', 'warning');
}

function updateImageNumbers() {
    const items = imagePreviewArea.querySelectorAll('.image-item');
    items.forEach((item, index) => {
        const numberDiv = item.querySelector('.image-number');
        numberDiv.textContent = index + 1;
        item.dataset.index = index + 1;
        
        // 更新数组中的索引
        const imgElement = item.querySelector('img');
        const src = imgElement.src;
        const imageObj = uploadedImages.find(img => img.src === src);
        if (imageObj) {
            imageObj.index = index + 1;
        }
    });
}

function updateImageCount() {
    imageCount.textContent = uploadedImages.length;
}

function checkFileNameOrder() {
    if (uploadedImages.length <= 1) {
        isOrdered = true;
        orderAlert.style.display = 'none';
        return;
    }
    
    // 提取所有文件名
    const filenames = uploadedImages.map(img => img.name);
    
    // 尝试按自然顺序排序（考虑数字顺序）
    const sortedFilenames = filenames.slice().sort(naturalSort);
    
    // 检查排序后的顺序是否与原顺序一致
    isOrdered = filenames.every((name, index) => name === sortedFilenames[index]);
    
    if (!isOrdered) {
        // 显示警告信息
        orderAlert.style.display = 'flex';
        orderMessage.textContent = '检测到图片文件名顺序可能不正确';
    } else {
        orderAlert.style.display = 'none';
    }
}

function naturalSort(a, b) {
    // 提取文件名中的数字部分进行比较
    const aNumMatch = a.match(/\d+/g);
    const bNumMatch = b.match(/\d+/g);
    
    // 如果两个文件名都包含数字，按数字排序
    if (aNumMatch && bNumMatch) {
        // 比较每个数字部分
        for (let i = 0; i < Math.min(aNumMatch.length, bNumMatch.length); i++) {
            const aNum = parseInt(aNumMatch[i]);
            const bNum = parseInt(bNumMatch[i]);
            
            if (aNum !== bNum) {
                return aNum - bNum;
            }
        }
        
        // 如果数字部分相同，比较字符串部分
        return a.localeCompare(b, 'zh-CN', { numeric: true });
    }
    
    // 否则按字符串比较
    return a.localeCompare(b, 'zh-CN', { numeric: true });
}

function initSortable() {
    // 销毁现有的Sortable实例（如果存在）
    if (sortable) {
        sortable.destroy();
    }
    
    // 初始化Sortable实例
    sortable = Sortable.create(imagePreviewArea, {
        animation: 150,
        handle: '.control-btn.drag',
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        onStart: function() {
            document.body.style.cursor = 'grabbing';
        },
        onEnd: function() {
            document.body.style.cursor = '';
            
            // 当排序结束时，更新图片顺序
            const newOrder = [];
            const items = imagePreviewArea.querySelectorAll('.image-item');
            
            items.forEach((item, index) => {
                const imgElement = item.querySelector('img');
                const src = imgElement.src;
                
                // 找到对应的图片对象
                const imageObj = uploadedImages.find(img => img.src === src);
                if (imageObj) {
                    imageObj.index = index + 1;
                    newOrder.push(imageObj);
                }
            });
            
            uploadedImages = newOrder;
            updateImageNumbers();
            isOrdered = false; // 用户手动调整后，标记为无序
            
            // 显示提示
            showToast('图片顺序已手动调整', 'success');
            
            // 重新检查顺序
            checkFileNameOrder();
        }
    });
}

function autoSortImages() {
    if (uploadedImages.length === 0) {
        showToast('没有可排序的图片', 'warning');
        return;
    }
    
    // 按文件名自然排序
    uploadedImages.sort((a, b) => naturalSort(a.name, b.name));
    
    // 更新DOM
    imagePreviewArea.innerHTML = '';
    uploadedImages.forEach((img, index) => {
        img.index = index + 1;
        const imageItem = createImageItem(new Image(), img.name, img.index);
        imageItem.querySelector('img').src = img.src;
        imagePreviewArea.appendChild(imageItem);
    });
    
    // 重新初始化排序
    initSortable();
    
    // 更新状态
    isOrdered = true;
    orderAlert.style.display = 'none';
    
    showToast('图片已按文件名自动排序', 'success');
}

function reverseImageOrder() {
    if (uploadedImages.length === 0) {
        showToast('没有可排序的图片', 'warning');
        return;
    }
    
    // 反转数组顺序
    uploadedImages.reverse();
    
    // 更新DOM
    imagePreviewArea.innerHTML = '';
    uploadedImages.forEach((img, index) => {
        img.index = index + 1;
        const imageItem = createImageItem(new Image(), img.name, img.index);
        imageItem.querySelector('img').src = img.src;
        imagePreviewArea.appendChild(imageItem);
    });
    
    // 重新初始化排序
    initSortable();
    
    // 更新状态
    isOrdered = false;
    checkFileNameOrder();
    
    showToast('图片顺序已反转', 'success');
}

function fixImageOrder() {
    autoSortImages();
}

function clearAllImages() {
    if (uploadedImages.length === 0) {
        showToast('没有可清空的图片', 'warning');
        return;
    }
    
    if (confirm('确定要清空所有图片吗？此操作不可撤销。')) {
        uploadedImages = [];
        imagePreviewArea.innerHTML = '';
        pdfPreviewArea.innerHTML = '';
        pdfSection.style.display = 'none';
        orderAlert.style.display = 'none';
        emptyState.style.display = 'block';
        updateImageCount();
        fileInput.value = '';
        
        showToast('所有图片已清空', 'success');
    }
}

function generatePreview() {
    if (uploadedImages.length === 0) {
        showToast('请先上传图片！', 'error');
        return;
    }
    
    pdfPreviewArea.innerHTML = '';
    pdfSection.style.display = 'block';
    
    const pageSize = pageSizeSelect.value;
    const margin = parseInt(marginInput.value) || 10;
    const orientation = getOrientation();
    const imageFit = imageFitSelect.value;
    
    // 根据页面大小设置预览尺寸
    let pageWidth, pageHeight;
    
    switch (pageSize) {
        case 'a4':
            pageWidth = 210;
            pageHeight = 297;
            break;
        case 'letter':
            pageWidth = 216;
            pageHeight = 279;
            break;
        case 'a3':
            pageWidth = 297;
            pageHeight = 420;
            break;
        case 'a5':
            pageWidth = 148;
            pageHeight = 210;
            break;
        case 'b5':
            pageWidth = 176;
            pageHeight = 250;
            break;
        case 'comic':
            pageWidth = 170;
            pageHeight = 260;
            break;
        default:
            pageWidth = 210;
            pageHeight = 297;
    }
    
    // 创建预览页面
    uploadedImages.forEach((img, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'pdf-page';
        pageDiv.style.width = `${pageWidth / 2}px`;
        pageDiv.style.height = `${pageHeight / 2}px`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';
        contentDiv.style.backgroundImage = `url(${img.src})`;
        contentDiv.style.margin = `${margin / 2}px`;
        
        // 根据图片适配方式设置背景大小
        if (imageFit === 'contain') {
            contentDiv.style.backgroundSize = 'contain';
        } else if (imageFit === 'cover') {
            contentDiv.style.backgroundSize = 'cover';
        } else if (imageFit === 'fill') {
            contentDiv.style.backgroundSize = '100% 100%';
        } else if (imageFit === 'original') {
            contentDiv.style.backgroundSize = 'auto';
            contentDiv.style.backgroundPosition = 'center';
        }
        
        pageDiv.appendChild(contentDiv);
        pdfPreviewArea.appendChild(pageDiv);
    });
    
    // 滚动到预览区域
    pdfSection.scrollIntoView({ behavior: 'smooth' });
    
    showToast('预览已生成', 'success');
}

function getOrientation() {
    const selectedOrientation = orientationSelect.value;
    
    if (selectedOrientation === 'auto') {
        // 自动检测：如果图片宽度大于高度，使用横向，否则使用纵向
        if (uploadedImages.length > 0 && uploadedImages[0].width && uploadedImages[0].height) {
            return uploadedImages[0].width > uploadedImages[0].height ? 'landscape' : 'portrait';
        }
        return 'portrait';
    }
    
    return selectedOrientation;
}

function generatePDF() {
    if (uploadedImages.length === 0) {
        showToast('请先上传图片！', 'error');
        return;
    }
    
    if (!isOrdered) {
        // 不再阻止生成，只是提示
        showToast('注意：图片顺序可能不正确，请检查预览', 'warning');
    }
    
    const pageSize = pageSizeSelect.value;
    const margin = parseInt(marginInput.value) || 10;
    const orientation = getOrientation();
    const imageFit = imageFitSelect.value;
    const quality = parseInt(qualityInput.value) || 95;
    const filename = filenameInput.value || '漫画';
    
    // 重置取消标志
    currentProcessCanceled = false;
    
    // 显示进度条
    showProgress(0, '准备生成PDF...');
    
    // 在主线程生成PDF
    generatePDFInMainThread(pageSize, margin, orientation, imageFit, quality, filename);
}

function generatePDFInMainThread(pageSize, margin, orientation, imageFit, quality, filename) {
    const { jsPDF } = window.jspdf;
    
    try {
        // 初始化jsPDF实例
        const doc = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: pageSize
        });
        
        // 设置页边距
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const availableWidth = pageWidth - 2 * margin;
        const availableHeight = pageHeight - 2 * margin;
        
        // 处理每张图片
        let processed = 0;
        
        const processNextImage = () => {
            if (currentProcessCanceled) {
                hideProgress();
                return;
            }
            
            if (processed >= uploadedImages.length) {
                // 所有图片处理完成
                doc.save(`${filename}.pdf`);
                hideProgress();
                showToast('PDF生成成功！', 'success');
                return;
            }
            
            const imgData = uploadedImages[processed];
            const img = new Image();
            img.src = imgData.src;
            
            img.onload = () => {
                // 计算图片缩放比例和位置
                let x, y, width, height;
                
                // 使用主线程传递的尺寸或从图片获取
                const imgWidth = imgData.width || img.width;
                const imgHeight = imgData.height || img.height;
                const imgAspectRatio = imgWidth / imgHeight;
                const availableAspectRatio = availableWidth / availableHeight;
                
                if (imageFit === 'contain') {
                    // 适应页面，保持宽高比
                    if (imgAspectRatio > availableAspectRatio) {
                        // 图片更宽，按宽度缩放
                        width = availableWidth;
                        height = availableWidth / imgAspectRatio;
                        x = margin;
                        y = margin + (availableHeight - height) / 2;
                    } else {
                        // 图片更高，按高度缩放
                        height = availableHeight;
                        width = availableHeight * imgAspectRatio;
                        x = margin + (availableWidth - width) / 2;
                        y = margin;
                    }
                } else if (imageFit === 'cover') {
                    // 填充页面，保持宽高比
                    if (imgAspectRatio > availableAspectRatio) {
                        // 图片更宽，按高度缩放
                        height = availableHeight;
                        width = availableHeight * imgAspectRatio;
                        x = margin - (width - availableWidth) / 2;
                        y = margin;
                    } else {
                        // 图片更高，按宽度缩放
                        width = availableWidth;
                        height = availableWidth / imgAspectRatio;
                        x = margin;
                        y = margin - (height - availableHeight) / 2;
                    }
                } else if (imageFit === 'fill') {
                    // 拉伸填充
                    width = availableWidth;
                    height = availableHeight;
                    x = margin;
                    y = margin;
                } else if (imageFit === 'original') {
                    // 原始大小，居中显示
                    width = imgWidth * 0.264583; // 将像素转换为毫米 (1px = 0.264583mm)
                    height = imgHeight * 0.264583;
                    x = margin + (availableWidth - width) / 2;
                    y = margin + (availableHeight - height) / 2;
                }
                
                // 将图片添加到PDF中
                const compression = quality >= 90 ? 'NONE' : (quality >= 70 ? 'MEDIUM' : 'FAST');
                doc.addImage(imgData.src, 'JPEG', x, y, width, height, `img${processed}`, compression);
                
                // 更新进度
                processed++;
                showProgress((processed / uploadedImages.length) * 100, `正在处理第 ${processed} / ${uploadedImages.length} 张图片...`);
                
                // 如果不是最后一张图片，添加新页
                if (processed < uploadedImages.length) {
                    doc.addPage();
                }
                
                // 继续处理下一张图片（使用setTimeout避免阻塞UI）
                setTimeout(processNextImage, 0);
            };
            
            img.onerror = () => {
                // 图片加载失败，跳过这张图片
                processed++;
                showProgress((processed / uploadedImages.length) * 100, `跳过无法加载的图片: ${uploadedImages[processed-1].name}`);
                
                if (processed < uploadedImages.length) {
                    setTimeout(processNextImage, 0);
                } else {
                    doc.save(`${filename}.pdf`);
                    hideProgress();
                    showToast('PDF生成完成！（部分图片加载失败）', 'warning');
                }
            };
        };
        
        // 开始处理
        processNextImage();
    } catch (error) {
        hideProgress();
        showToast('生成PDF时出错: ' + error.message, 'error');
        console.error('PDF生成错误:', error);
    }
}

function showProgress(percent, message) {
    progressContainer.classList.add('show');
    progressBar.style.width = percent + '%';
    progressText.textContent = `处理中... ${Math.round(percent)}%`;
    if (message) {
        progressDetail.textContent = message;
    }
}

function hideProgress() {
    progressContainer.classList.remove('show');
}

function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = 'toast';
    
    // 添加图标
    let icon = 'info-circle';
    if (type === 'success') {
        icon = 'check-circle';
        toast.classList.add('success');
    } else if (type === 'error') {
        icon = 'exclamation-circle';
        toast.classList.add('error');
    } else if (type === 'warning') {
        icon = 'exclamation-triangle';
        toast.classList.add('warning');
    }
    
    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function saveSettings() {
    const settings = {
        pageSize: pageSizeSelect.value,
        margin: marginInput.value,
        orientation: orientationSelect.value,
        imageFit: imageFitSelect.value,
        quality: qualityInput.value,
        filename: filenameInput.value
    };
    
    localStorage.setItem('pdfSettings', JSON.stringify(settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem('pdfSettings');
    
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            pageSizeSelect.value = settings.pageSize || 'comic';
            marginInput.value = settings.margin || 10;
            orientationSelect.value = settings.orientation || 'auto';
            imageFitSelect.value = settings.imageFit || 'contain';
            qualityInput.value = settings.quality || 95;
            filenameInput.value = settings.filename || '漫画';
            
            // 更新范围值的显示
            updateRangeValues();
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
}

function resetSettings() {
    if (confirm('确定要恢复默认设置吗？')) {
        pageSizeSelect.value = 'comic';
        marginInput.value = 10;
        orientationSelect.value = 'auto';
        imageFitSelect.value = 'contain';
        qualityInput.value = 95;
        filenameInput.value = '漫画';
        
        updateRangeValues();
        saveSettings();
        
        showToast('设置已恢复为默认值', 'success');
    }
}

function showHelp() {
    alert("使用帮助：\n\n1. 上传图片：拖放图片到上传区域或点击选择文件\n2. 调整顺序：可以拖拽图片调整顺序，或使用智能排序\n3. 设置PDF参数：选择页面大小、边距、方向等\n4. 生成PDF：点击生成PDF按钮即可下载\n\n提示：使用有序的文件名可以获得更好的排序效果");
}

function reportIssue() {
    alert("问题反馈：\n\n如果您遇到任何问题或有改进建议，请通过以下方式联系我们：\n\nEmail: Y7TkQmhhUlcEtldu@outlook.com\n\n我们会尽快回复您！");
}

// 错误处理
window.addEventListener('error', (e) => {
    console.error('发生错误:', e.error);
    showToast('发生错误: ' + (e.error?.message || '未知错误'), 'error');
    hideProgress();
});

// 处理未处理的Promise拒绝
window.addEventListener('unhandledrejection', (e) => {
    console.error('未处理的Promise拒绝:', e.reason);
    showToast('发生错误: ' + (e.reason?.message || '未知错误'), 'error');
    hideProgress();
});
