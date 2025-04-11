// subWorker.js
self.onmessage = function(e) {
  const { type, data, width, height, startX, startY, chunkWidth, chunkHeight } = e.data;
  
  if (type === 'processChunk') {
    try {
      // Create a canvas for the chunk
      const canvas = new OffscreenCanvas(chunkWidth, chunkHeight);
      const ctx = canvas.getContext('2d');
      
      // Create ImageData from the chunk data
      const imageData = new ImageData(new Uint8ClampedArray(data), chunkWidth, chunkHeight);
      ctx.putImageData(imageData, 0, 0);
      
      // Process the chunk based on the operation type
      const processedData = processChunk(imageData.data, chunkWidth, chunkHeight, e.data.operation);
      
      // Send the processed chunk back to the main worker
      self.postMessage({
        type: 'chunkProcessed',
        data: processedData,
        startX,
        startY,
        chunkWidth,
        chunkHeight
      });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.toString()
      });
    }
  }
};

function processChunk(data, width, height, operation) {
  switch (operation) {
    case 'denoise':
      return denoiseChunk(data, width, height);
    case 'sharpen':
      return sharpenChunk(data, width, height);
    case 'autoEnhance':
      return autoEnhanceChunk(data, width, height);
    default:
      return data;
  }
}

function denoiseChunk(data, width, height) {
  const tempData = new Uint8ClampedArray(data);
  const radius = 1;
  
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      let sumR = 0, sumG = 0, sumB = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const index = ((y + dy) * width + (x + dx)) * 4;
          sumR += tempData[index];
          sumG += tempData[index + 1];
          sumB += tempData[index + 2];
          count++;
        }
      }
      
      data[pixelIndex] = sumR / count;
      data[pixelIndex + 1] = sumG / count;
      data[pixelIndex + 2] = sumB / count;
    }
  }
  
  return data;
}

function sharpenChunk(data, width, height) {
  const tempData = new Uint8ClampedArray(data);
  const kernel = [
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pixelIndex = (y * width + x) * 4;
      
      let sumR = 0, sumG = 0, sumB = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const index = ((y + ky) * width + (x + kx)) * 4;
          const weight = kernel[ky + 1][kx + 1];
          
          sumR += tempData[index] * weight;
          sumG += tempData[index + 1] * weight;
          sumB += tempData[index + 2] * weight;
        }
      }
      
      data[pixelIndex] = Math.min(255, Math.max(0, sumR));
      data[pixelIndex + 1] = Math.min(255, Math.max(0, sumG));
      data[pixelIndex + 2] = Math.min(255, Math.max(0, sumB));
    }
  }
  
  return data;
}

function autoEnhanceChunk(data, width, height) {
  // Calculate average brightness
  let totalBrightness = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  const avgBrightness = totalBrightness / (data.length / 4);
  
  // Adjust brightness to target (128)
  const brightnessFactor = 128 / avgBrightness;
  
  // Apply brightness adjustment
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * brightnessFactor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * brightnessFactor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * brightnessFactor));
  }
  
  return data;
} 