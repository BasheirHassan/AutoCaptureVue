
// worker.js
self.onmessage = function(e) {
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

      // Create canvas and context
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Draw the original image data
      const imgData = new ImageData(new Uint8ClampedArray(imageData), width, height);
      ctx.putImageData(imgData, 0, 0);

      // Create a new canvas for the cropped image
      const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
      const croppedCtx = croppedCanvas.getContext('2d');

      // Draw the cropped portion
      croppedCtx.drawImage(canvas,
          cropX, cropY, cropWidth, cropHeight,  // Source rectangle
          0, 0, cropWidth, cropHeight           // Destination rectangle
      );

      // Apply image enhancements if needed
      if (denoise || autoEnhance || sharpenLevel > 0 ||
          brightnessAdjust !== 0 || contrastAdjust !== 0 || saturationAdjust !== 0) {
        applyImageEnhancements(
            croppedCtx,
            cropWidth,
            cropHeight,
            sharpenLevel,
            denoise,
            autoEnhance,
            brightnessAdjust,
            contrastAdjust,
            saturationAdjust
        );
      }

      // Convert to blob
      let mimeType = 'image/png';
      if (imageType === 'jpg' || imageType === 'jpeg') {
        mimeType = 'image/jpeg';
      }

      // Convert to base64 - properly handle the Promise
      croppedCanvas.convertToBlob({ type: mimeType, quality: imageQuality })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // Send the processed image back to the main thread after conversion is complete
            self.postMessage({
              type: 'imageSaved',
              imgName: imgName,
              imagePath: imgPath,
              base64Data: reader.result
            });
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          self.postMessage({
            type: 'error',
            message: 'Error converting image: ' + error.toString()
          });
        });
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.toString()
      });
    }
  }
};

// Function to apply image enhancements
function applyImageEnhancements(ctx, width, height, sharpenLevel, denoise, autoEnhance,
                                brightnessAdjust, contrastAdjust, saturationAdjust) {
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply auto enhance if enabled
  if (autoEnhance) {
    autoEnhanceImage(data, width, height);
  }

  // Apply brightness adjustment
  if (brightnessAdjust !== 0) {
    adjustBrightness(data, brightnessAdjust);
  }

  // Apply contrast adjustment
  if (contrastAdjust !== 0) {
    adjustContrast(data, contrastAdjust);
  }

  // Apply saturation adjustment
  if (saturationAdjust !== 0) {
    adjustSaturation(data, saturationAdjust);
  }

  // Apply denoise if enabled
  if (denoise) {
    denoiseImage(data, width, height);
  }

  // Apply sharpening based on level
  if (sharpenLevel > 0) {
    sharpenImage(data, width, height, sharpenLevel);
  }

  // Put the modified image data back
  ctx.putImageData(imageData, 0, 0);
}


// Image enhancement functions
function autoEnhanceImage(data, width, height) {
  // Auto enhance algorithm (adjust levels, etc.)
  // Implementation depends on specific requirements
}

function adjustBrightness(data, value) {
  const factor = 1 + value / 100;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] * factor));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
  }
}

function adjustContrast(data, value) {
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
}

function adjustSaturation(data, value) {
  const factor = 1 + value / 100;
  for (let i = 0; i < data.length; i += 4) {
    // Convert RGB to HSL, adjust saturation, convert back to RGB
    // Simplified implementation
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
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

    // Adjust saturation
    s = Math.min(1, Math.max(0, s * factor));

    // Convert back to RGB
    // Simplified implementation
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
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}

function denoiseImage(data, width, height) {
  // Simple box blur for denoising
  // For a more sophisticated approach, consider implementing a median filter or bilateral filter
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

      // Average the surrounding pixels
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
}

function sharpenImage(data, width, height, level) {
  // Unsharp masking for sharpening
  // Create a blurred version and subtract it from the original
  const tempData = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i++) {
    tempData[i] = data[i];
  }

  // Apply a blur to the temp data
  denoiseImage(tempData, width, height);

  // Strength of sharpening based on level (0-5)
  const strength = 0.2 + (level * 0.16); // Maps 0-5 to 0.2-1.0

  // Apply unsharp mask
  for (let i = 0; i < data.length; i += 4) {
    // For each RGB channel
    for (let j = 0; j < 3; j++) {
      // Calculate the difference between original and blurred
      const diff = data[i + j] - tempData[i + j];
      // Add a portion of the difference back to the original
      data[i + j] = Math.min(255, Math.max(0, data[i + j] + diff * strength));
    }
  }
}
