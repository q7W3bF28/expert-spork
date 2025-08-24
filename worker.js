// Web Worker用于在后台生成PDF，避免阻塞主线程

// 引入jsPDF库
importScripts('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

self.onmessage = function(event) {
    const { images, pageSize, margin, orientation, imageFit, quality, filename } = event.data;
    const { jsPDF } = self.jspdf;
    
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
        
        let processed = 0;
        
        const processNextImage = () => {
            if (processed >= images.length) {
                // 所有图片处理完成
                const pdfOutput = doc.output('arraybuffer');
                self.postMessage({ 
                    type: 'result', 
                    pdf: pdfOutput,
                    filename: filename ? `${filename}.pdf` : '漫画.pdf'
                });
                return;
            }
            
            const imgData = images[processed];
            
            // 直接使用传递过来的图片数据，不再创建Image对象
            const imgWidth = imgData.width || 0;
            const imgHeight = imgData.height || 0;
            
            if (imgWidth === 0 || imgHeight === 0) {
                // 跳过无效图片
                processed++;
                self.postMessage({ 
                    type: 'progress', 
                    value: (processed / images.length) * 100,
                    message: `跳过无效图片: ${processed}`
                });
                
                if (processed < images.length) {
                    setTimeout(processNextImage, 0);
                } else {
                    const pdfOutput = doc.output('arraybuffer');
                    self.postMessage({ 
                        type: 'result', 
                        pdf: pdfOutput,
                    });
                }
                return;
            }
            
            // 计算图片缩放比例和位置
            let x, y, width, height;
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
            self.postMessage({ 
                type: 'progress', 
                value: (processed / images.length) * 100,
                message: `正在处理第 ${processed} / ${images.length} 张图片...`
            });
            
            // 如果不是最后一张图片，添加新页
            if (processed < images.length) {
                doc.addPage();
                setTimeout(processNextImage, 0);
            } else {
                const pdfOutput = doc.output('arraybuffer');
                self.postMessage({ 
                    type: 'result', 
                    pdf: pdfOutput,
                    filename: filename ? `${filename}.pdf` : '漫画.pdf'
                });
            }
        };
        
        // 开始处理
        processNextImage();
    } catch (error) {
        self.postMessage({ type: 'error', message: error.message });
    }
};
