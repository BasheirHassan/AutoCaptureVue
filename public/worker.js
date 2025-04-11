self.onmessage = async (event) => {
  if (event.data.type === 'saveImage') {
    try {
      const { 
        imgName, 
        imgPath, 
        cropX, 
        cropY, 
        cropWidth, 
        cropHeight, 
        width, 
        height, 
        imageData, 
        imageType, 
        imageQuality,
        sharpenLevel = 2, // مستوى حدة الصورة (0 = بدون تحسين)
        denoise = true,   // إزالة الضوضاء
        autoEnhance = false, // تحسين تلقائي للصورة
        brightnessAdjust = 0, // ضبط السطوع
        contrastAdjust = 0, // ضبط التباين
        saturationAdjust = 0 // ضبط التشبع
      } = event.data;
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const imageDataArray = new Uint8ClampedArray(imageData);
      const imgData = new ImageData(imageDataArray, width, height);
      ctx.putImageData(imgData, 0, 0);

      const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
      const croppedCtx = croppedCanvas.getContext('2d');
      
      // Use high-quality image scaling
      croppedCtx.imageSmoothingEnabled = true;
      croppedCtx.imageSmoothingQuality = 'high';
      
      croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      
      // تطبيق تعديلات السطوع والتباين والتشبع إذا كانت مطلوبة
      if (brightnessAdjust !== 0 || contrastAdjust !== 0 || saturationAdjust !== 0) {
        applyColorAdjustments(croppedCanvas, brightnessAdjust, contrastAdjust, saturationAdjust);
      }
      
      // تطبيق تحسين تلقائي للصورة إذا كان مطلوبًا
      if (autoEnhance) {
        applyAutoEnhance(croppedCanvas);
      }
      
      // تطبيق تحسين الحدة إذا كان مطلوبًا
      if (sharpenLevel > 0) {
        applySharpening(croppedCanvas, sharpenLevel);
      }
      
      // تطبيق إزالة الضوضاء إذا كان مطلوبًا
      if (denoise) {
        applyDenoising(croppedCanvas);
      }
      
      // Set appropriate MIME type and quality options based on image type
      let mimeType = 'image/png';
      let encoderOptions = undefined;
      
      switch (imageType.toLowerCase()) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          encoderOptions = imageQuality || 0.95; // Use specified quality or default to 0.95 (higher quality)
          break;
        case 'webp':
          mimeType = 'image/webp';
          encoderOptions = imageQuality || 0.95;
          break;
        case 'png':
        default:
          mimeType = 'image/png';
          // PNG is lossless, quality doesn't apply
          break;
      }
      
      croppedCanvas.convertToBlob({ type: mimeType, quality: encoderOptions }).then(blob => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          self.postMessage({
            type: 'imageSaved',
            imgName: imgName,
            imagePath: imgPath,
            base64Data: reader.result,
            imageSize: blob.size, // إضافة حجم الصورة للمعلومات
            imageType: mimeType
          });
        }
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.toString()
      });
    }
  }
}

// دالة لتطبيق تحسين حدة الصورة
function applySharpening(canvas, level) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // نسخة من البيانات الأصلية
  const originalData = new Uint8ClampedArray(data);
  
  // تطبيق مرشح لابلاسيان للحدة
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) { // معالجة RGB فقط، ليس Alpha
        const current = originalData[idx + c];
        
        // حساب متوسط القيم المحيطة
        const top = originalData[((y - 1) * width + x) * 4 + c];
        const bottom = originalData[((y + 1) * width + x) * 4 + c];
        const left = originalData[(y * width + (x - 1)) * 4 + c];
        const right = originalData[(y * width + (x + 1)) * 4 + c];
        
        // تطبيق مرشح لابلاسيان
        const laplacian = current * 5 - (top + bottom + left + right);
        
        // تطبيق التحسين بناءً على المستوى المحدد
        data[idx + c] = Math.max(0, Math.min(255, current + (laplacian * level / 10)));
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// دالة لتطبيق تعديلات السطوع والتباين والتشبع
function applyColorAdjustments(canvas, brightnessAdjust, contrastAdjust, saturationAdjust) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // تحويل القيم من النطاق -50 إلى 50 إلى نطاق مناسب للمعالجة
  const brightness = 1 + (brightnessAdjust / 100); // نطاق 0.5 إلى 1.5
  const contrast = 1 + (contrastAdjust / 100); // نطاق 0.5 إلى 1.5
  const saturation = 1 + (saturationAdjust / 100); // نطاق 0.5 إلى 1.5
  
  for (let i = 0; i < data.length; i += 4) {
    // تطبيق السطوع
    data[i] = data[i] * brightness;
    data[i + 1] = data[i + 1] * brightness;
    data[i + 2] = data[i + 2] * brightness;
    
    // تطبيق التباين
    data[i] = ((data[i] - 128) * contrast) + 128;
    data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
    data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
    
    // تطبيق التشبع (تحويل إلى HSL وتعديل S ثم العودة إلى RGB)
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // حساب قيمة الرمادي (متوسط RGB)
    const gray = 0.3 * r + 0.59 * g + 0.11 * b;
    
    // تطبيق التشبع (مزج بين اللون الأصلي والرمادي)
    data[i] = gray + saturation * (r - gray);
    data[i + 1] = gray + saturation * (g - gray);
    data[i + 2] = gray + saturation * (b - gray);
    
    // التأكد من أن القيم في النطاق 0-255
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// دالة لتطبيق تحسين تلقائي للصورة
function applyAutoEnhance(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // حساب القيم الدنيا والقصوى لكل قناة
  let minR = 255, minG = 255, minB = 255;
  let maxR = 0, maxG = 0, maxB = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    minR = Math.min(minR, r);
    minG = Math.min(minG, g);
    minB = Math.min(minB, b);
    
    maxR = Math.max(maxR, r);
    maxG = Math.max(maxG, g);
    maxB = Math.max(maxB, b);
  }
  
  // تطبيق تمديد التباين لكل قناة
  for (let i = 0; i < data.length; i += 4) {
    // تمديد قناة R
    if (maxR > minR) {
      data[i] = 255 * (data[i] - minR) / (maxR - minR);
    }
    
    // تمديد قناة G
    if (maxG > minG) {
      data[i + 1] = 255 * (data[i + 1] - minG) / (maxG - minG);
    }
    
    // تمديد قناة B
    if (maxB > minB) {
      data[i + 2] = 255 * (data[i + 2] - minB) / (maxB - minB);
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}

// دالة لتطبيق إزالة الضوضاء المتقدمة
function applyDenoising(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  const height = canvas.height;
  
  // نسخة من البيانات الأصلية
  const originalData = new Uint8ClampedArray(data);
  
  // تطبيق مرشح متوسط 3×3 لإزالة الضوضاء مع الحفاظ على التفاصيل
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      for (let c = 0; c < 3; c++) { // معالجة RGB فقط، ليس Alpha
        let sum = 0;
        let weights = 0;
        
        // حساب متوسط موزون للقيم المحيطة 3×3
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const currentIdx = ((y + dy) * width + (x + dx)) * 4 + c;
            const currentValue = originalData[currentIdx];
            const centerValue = originalData[idx + c];
            
            // حساب الوزن بناءً على التشابه مع القيمة المركزية
            const diff = Math.abs(currentValue - centerValue);
            const weight = Math.exp(-(diff * diff) / 100); // معامل غاوسي
            
            sum += currentValue * weight;
            weights += weight;
          }
        }
        
        // تطبيق المتوسط الموزون
        data[idx + c] = Math.round(sum / weights);
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}
