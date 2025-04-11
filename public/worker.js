// worker.js

// Cache for processed images to prevent duplicate processing
const processedImageCache = new Map();
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache
const PROCESSING_TIMEOUT = 30000; // 30 seconds timeout for processing

// Function to manage cache size
function manageCache() {
  if (processedImageCache.size > MAX_CACHE_SIZE) {
    // Remove oldest entries
    const entriesToRemove = processedImageCache.size - MAX_CACHE_SIZE;
    const keys = Array.from(processedImageCache.keys()).slice(0, entriesToRemove);
    keys.forEach(key => processedImageCache.delete(key));
  }
}

// Function to process image in chunks for better performance
async function processImageInChunks(imageData, width, height, chunkSize = 100) {
  const chunks = [];
  for (let y = 0; y < height; y += chunkSize) {
    for (let x = 0; x < width; x += chunkSize) {
      const chunkWidth = Math.min(chunkSize, width - x);
      const chunkHeight = Math.min(chunkSize, height - y);
      chunks.push({ x, y, width: chunkWidth, height: chunkHeight });
    }
  }
  return chunks;
}

// Function to handle processing timeout
function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Processing timeout')), timeout)
    )
  ]);
}

self.onmessage = async function(e) {
  if (e.data.type === 'saveImage') {
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
        sharpenLevel,
        denoise,
        autoEnhance,
        brightnessAdjust,
        contrastAdjust,
        saturationAdjust
      } = e.data;

      // Check cache first
      const cacheKey = `${imgName}-${cropX}-${cropY}-${cropWidth}-${cropHeight}`;
      if (processedImageCache.has(cacheKey)) {
        self.postMessage({
          type: 'imageSaved',
          imgName: imgName,
          imagePath: imgPath,
          base64Data: processedImageCache.get(cacheKey)
        });
        return;
      }

      // Create canvas and context with error handling
      let canvas;
      try {
        canvas = new OffscreenCanvas(width, height);
        if (!canvas) throw new Error('Failed to create OffscreenCanvas');
      } catch (error) {
        throw new Error(`Canvas creation failed: ${error.message}`);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2D context');
      }

      // Draw the original image data with error handling
      try {
        const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
        ctx.putImageData(imgData, 0, 0);
      } catch (error) {
        throw new Error(`Failed to draw image data: ${error.message}`);
      }

      // Create a new canvas for the cropped image
      const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) {
        throw new Error('Failed to get cropped canvas context');
      }

      // Draw the cropped portion with error handling
      try {
        croppedCtx.drawImage(canvas,
          cropX, cropY, cropWidth, cropHeight,  // Source rectangle
          0, 0, cropWidth, cropHeight           // Destination rectangle
        );
      } catch (error) {
        throw new Error(`Failed to crop image: ${error.message}`);
      }

      // Apply image enhancements if needed
      if (denoise || autoEnhance || sharpenLevel > 0 ||
        brightnessAdjust !== 0 || contrastAdjust !== 0 || saturationAdjust !== 0) {
        try {
          // Process image in chunks for better performance
          const chunks = await processImageInChunks(
            croppedCtx.getImageData(0, 0, cropWidth, cropHeight),
            cropWidth,
            cropHeight
          );

          // Process chunks in parallel
          const processedChunks = await Promise.all(
            chunks.map(chunk => 
              withTimeout(
                processChunk(
                  croppedCtx,
                  chunk,
                  sharpenLevel,
                  denoise,
                  autoEnhance,
                  brightnessAdjust,
                  contrastAdjust,
                  saturationAdjust
                ),
                PROCESSING_TIMEOUT
              )
            )
          );

          // Combine processed chunks
          processedChunks.forEach(chunk => {
            croppedCtx.putImageData(chunk.data, chunk.x, chunk.y);
          });
        } catch (error) {
          console.warn(`Image enhancement failed: ${error.message}`);
          // Continue processing even if enhancement fails
        }
      }

      // Convert to blob with proper error handling
      let mimeType = 'image/png';
      if (imageType === 'jpg' || imageType === 'jpeg') {
        mimeType = 'image/jpeg';
      }

      // Convert to base64 with proper error handling
      try {
        const blob = await withTimeout(
          croppedCanvas.convertToBlob({ type: mimeType, quality: imageQuality }),
          PROCESSING_TIMEOUT
        );

        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onloadend = () => {
            resolve(reader.result);
          };

          reader.onerror = (error) => {
            reject(new Error(`FileReader error: ${error.message}`));
          };

          reader.readAsDataURL(blob);
        });

        // Cache the processed image
        processedImageCache.set(cacheKey, base64Data);
        manageCache();

        // Send the processed image back to the main thread
        self.postMessage({
          type: 'imageSaved',
          imgName: imgName,
          imagePath: imgPath,
          base64Data: base64Data
        });
      } catch (error) {
        throw new Error(`Error converting image: ${error.message}`);
      }
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.toString()
      });
    }
  }
};

// Function to process a single chunk of the image
async function processChunk(ctx, chunk, sharpenLevel, denoise, autoEnhance,
  brightnessAdjust, contrastAdjust, saturationAdjust) {
  try {
    const imageData = ctx.getImageData(chunk.x, chunk.y, chunk.width, chunk.height);
    const data = imageData.data;

    // Apply enhancements to the chunk
    if (autoEnhance) {
      await autoEnhanceImage(data, chunk.width, chunk.height);
    }

    if (brightnessAdjust !== 0) {
      await adjustBrightness(data, brightnessAdjust);
    }

    if (contrastAdjust !== 0) {
      await adjustContrast(data, contrastAdjust);
    }

    if (saturationAdjust !== 0) {
      await adjustSaturation(data, saturationAdjust);
    }

    if (denoise) {
      await denoiseImage(data, chunk.width, chunk.height);
    }

    if (sharpenLevel > 0) {
      await sharpenImage(data, chunk.width, chunk.height, sharpenLevel);
    }

    return {
      data: imageData,
      x: chunk.x,
      y: chunk.y
    };
  } catch (error) {
    throw new Error(`Chunk processing failed: ${error.message}`);
  }
}

// Image enhancement functions with error handling and async support
async function autoEnhanceImage(data, width, height) {
  try {
    // Auto enhance algorithm (adjust levels, etc.)
    // Implementation depends on specific requirements
  } catch (error) {
    throw new Error(`Auto enhance failed: ${error.message}`);
  }
}

async function adjustBrightness(data, value) {
  try {
    const factor = 1 + value / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * factor));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
    }
  } catch (error) {
    throw new Error(`Brightness adjustment failed: ${error.message}`);
  }
}

async function adjustContrast(data, value) {
  try {
    const factor = (259 * (value + 255)) / (255 * (259 - value));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
  } catch (error) {
    throw new Error(`Contrast adjustment failed: ${error.message}`);
  }
}

async function adjustSaturation(data, value) {
  try {
    const factor = 1 + value / 100;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      }

      s = Math.min(1, Math.max(0, s * factor));

      if (s === 0) {
        data[i] = data[i + 1] = data[i + 2] = l * 255;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        data[i] = hueToRgb(p, q, h + 1/3) * 255;
        data[i + 1] = hueToRgb(p, q, h) * 255;
        data[i + 2] = hueToRgb(p, q, h - 1/3) * 255;
      }
    }
  } catch (error) {
    throw new Error(`Saturation adjustment failed: ${error.message}`);
  }
}

async function denoiseImage(data, width, height) {
  try {
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }

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
  } catch (error) {
    throw new Error(`Denoise failed: ${error.message}`);
  }
}

async function sharpenImage(data, width, height, level) {
  try {
    const tempData = new Uint8ClampedArray(data.length);
    for (let i = 0; i < data.length; i++) {
      tempData[i] = data[i];
    }

    await denoiseImage(tempData, width, height);

    const strength = 0.2 + (level * 0.16);

    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const diff = data[i + j] - tempData[i + j];
        data[i + j] = Math.min(255, Math.max(0, data[i + j] + diff * strength));
      }
    }
  } catch (error) {
    throw new Error(`Sharpening failed: ${error.message}`);
  }
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

// Clean up cache periodically to prevent memory leaks
setInterval(() => {
  processedImageCache.clear();
}, 5 * 60 * 1000); // Clear cache every 5 minutes
