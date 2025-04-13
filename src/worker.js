import { imageClass } from './assets/ImageClass';
import { MysqlAsyncClass } from './assets/MysqlAsyncClass';

const mysqlClass = new MysqlAsyncClass();

// Function to process image data
async function processImageData(imageData, options) {
  const { 
    width, 
    height, 
    cropX, 
    cropY, 
    cropWidth, 
    cropHeight,
    sharpenLevel,
    denoise,
    autoEnhance,
    brightnessAdjust,
    contrastAdjust,
    saturationAdjust
  } = options;

  // Create a temporary canvas for processing
  const tempCanvas = new OffscreenCanvas(width, height);
  const ctx = tempCanvas.getContext('2d');
  
  // Create ImageData from the received buffer
  const imageDataObj = new ImageData(
    new Uint8ClampedArray(imageData),
    width,
    height
  );

  // Draw the image data to canvas
  ctx.putImageData(imageDataObj, 0, 0);

  // Apply image processing filters
  if (denoise) {
    // Apply denoise filter
    const denoisedData = applyDenoiseFilter(ctx, width, height);
    ctx.putImageData(denoisedData, 0, 0);
  }

  if (sharpenLevel > 0) {
    // Apply sharpen filter based on level
    const sharpenedData = applySharpenFilter(ctx, width, height, sharpenLevel);
    ctx.putImageData(sharpenedData, 0, 0);
  }

  if (autoEnhance) {
    // Apply auto enhancement
    const enhancedData = applyAutoEnhancement(ctx, width, height);
    ctx.putImageData(enhancedData, 0, 0);
  }

  // Apply manual adjustments
  if (brightnessAdjust !== 0 || contrastAdjust !== 0 || saturationAdjust !== 0) {
    const adjustedData = applyManualAdjustments(
      ctx, 
      width, 
      height, 
      brightnessAdjust, 
      contrastAdjust, 
      saturationAdjust
    );
    ctx.putImageData(adjustedData, 0, 0);
  }

  // Crop the image if needed
  if (cropWidth && cropHeight) {
    const croppedData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    ctx.putImageData(croppedData, 0, 0);
  }

  return tempCanvas;
}

// Image processing filters
function applyDenoiseFilter(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Simple denoise algorithm
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Apply median filter
    const neighbors = getNeighbors(data, i, width);
    data[i] = median(neighbors.map(n => n.r));
    data[i + 1] = median(neighbors.map(n => n.g));
    data[i + 2] = median(neighbors.map(n => n.b));
  }
  
  return imageData;
}

function applySharpenFilter(ctx, width, height, level) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const kernel = getSharpenKernel(level);
  
  // Apply convolution
  for (let i = 0; i < data.length; i += 4) {
    const neighbors = getNeighbors(data, i, width);
    const r = applyKernel(neighbors.map(n => n.r), kernel);
    const g = applyKernel(neighbors.map(n => n.g), kernel);
    const b = applyKernel(neighbors.map(n => n.b), kernel);
    
    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
  
  return imageData;
}

function applyAutoEnhancement(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Calculate histogram
  const histogram = calculateHistogram(data);
  
  // Apply histogram equalization
  const equalized = equalizeHistogram(histogram);
  
  // Apply the equalized values
  for (let i = 0; i < data.length; i += 4) {
    data[i] = equalized[data[i]];
    data[i + 1] = equalized[data[i + 1]];
    data[i + 2] = equalized[data[i + 2]];
  }
  
  return imageData;
}

function applyManualAdjustments(ctx, width, height, brightness, contrast, saturation) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Apply brightness and contrast
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  for (let i = 0; i < data.length; i += 4) {
    // Brightness and contrast
    data[i] = clamp(factor * (data[i] - 128) + 128 + brightness);
    data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brightness);
    data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brightness);
    
    // Saturation
    if (saturation !== 0) {
      const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];
      data[i] = clamp(gray + (data[i] - gray) * (1 + saturation / 100));
      data[i + 1] = clamp(gray + (data[i + 1] - gray) * (1 + saturation / 100));
      data[i + 2] = clamp(gray + (data[i + 2] - gray) * (1 + saturation / 100));
    }
  }
  
  return imageData;
}

// Helper functions
function getNeighbors(data, index, width) {
  const neighbors = [];
  const row = Math.floor(index / (width * 4));
  const col = (index % (width * 4)) / 4;
  
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newRow = row + i;
      const newCol = col + j;
      if (newRow >= 0 && newRow < width && newCol >= 0 && newCol < width) {
        const newIndex = (newRow * width + newCol) * 4;
        neighbors.push({
          r: data[newIndex],
          g: data[newIndex + 1],
          b: data[newIndex + 2]
        });
      }
    }
  }
  
  return neighbors;
}

function median(arr) {
  const sorted = arr.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getSharpenKernel(level) {
  const baseKernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
  return baseKernel.map(row => 
    row.map(val => val * (1 + level * 0.2))
  );
}

function applyKernel(values, kernel) {
  let sum = 0;
  let weight = 0;
  
  for (let i = 0; i < values.length; i++) {
    const row = Math.floor(i / 3);
    const col = i % 3;
    sum += values[i] * kernel[row][col];
    weight += kernel[row][col];
  }
  
  return sum / weight;
}

function calculateHistogram(data) {
  const histogram = new Array(256).fill(0);
  
  for (let i = 0; i < data.length; i += 4) {
    histogram[data[i]]++;
    histogram[data[i + 1]]++;
    histogram[data[i + 2]]++;
  }
  
  return histogram;
}

function equalizeHistogram(histogram) {
  const total = histogram.reduce((a, b) => a + b, 0);
  const cdf = new Array(256);
  let sum = 0;
  
  for (let i = 0; i < 256; i++) {
    sum += histogram[i];
    cdf[i] = Math.round((sum / total) * 255);
  }
  
  return cdf;
}

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, ...data } = event.data;

  if (type === 'saveImage') {
    try {
      // Process the image
      const processedCanvas = await processImageData(data.imageData, data);
      
      // Convert to blob
      const blob = await processedCanvas.convertToBlob({
        type: `image/${data.imageType}`,
        quality: data.imageQuality
      });

      // Convert blob to base64
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Save to database
      const result = await mysqlClass.saveImageToDataBase(base64Data);

      // Send success message back to main thread
      self.postMessage({
        type: 'imageSaved',
        imgName: data.imgName,
        imagePath: data.imgPath,
        base64Data,
        result
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
}; 