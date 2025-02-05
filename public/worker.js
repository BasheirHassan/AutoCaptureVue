self.onmessage = async (event) => {
  if (event.data.type === 'saveImage') {
    const { imgName, imgPath, cropX, cropY, cropWidth, cropHeight, width, height, imageData, imageType } = event.data;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imageDataArray = new Uint8ClampedArray(imageData);
    const imgData = new ImageData(imageDataArray, width, height);
    ctx.putImageData(imgData, 0, 0);

    const croppedCanvas = new OffscreenCanvas(cropWidth, cropHeight);
    const croppedCtx = croppedCanvas.getContext('2d');
    croppedCtx.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    const base64Data = croppedCanvas.convertToBlob({type: `image/${imageType}`}).then(blob => {
      // console.log(blob);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        self.postMessage({
          type: 'imageSaved',
          imgName: imgName,
          imagePath: imgPath,
          base64Data: reader.result
        });
      }
    });
  }
}




