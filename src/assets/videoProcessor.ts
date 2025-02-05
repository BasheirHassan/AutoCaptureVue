import consola from 'consola';
import { GlobalVars } from '@assets/GlobalVars';
import cv from '@techstark/opencv-js';

export function startVideoProcessing(
  refVideo: any,
  refCanvas: any,
  ctx: any,
  paperBounds: any,
  detectedHand: any,
  autoCapture: any,
  isLoading: any,
  takePicture: any
) {
  let paperDetected = false;
  let entryCounter = 0;
  let exitCounter = 0;
  let captureInProgress = false;

  paperBounds.tempCanvas = document.createElement('canvas');
  paperBounds.tempCanvas.width = refCanvas.value.width;
  paperBounds.tempCanvas.height = refCanvas.value.height;

  const processFrame = () => {
    if (refVideo.value && refVideo.value.readyState === 4) {
      const canvasWidth = refCanvas.value.width;
      const canvasHeight = refCanvas.value.height;
      const ctxValue = ctx.value;

      ctxValue.drawImage(refVideo.value, 0, 0, canvasWidth, canvasHeight);
      let src = cv.imread(refCanvas.value);
      let hsv = new cv.Mat();
      cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV, 0);

      let lowerBound = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 0, 180, 0]);
      let upperBound = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 80, 255, 255]);

      let mask = new cv.Mat();
      cv.inRange(hsv, lowerBound, upperBound, mask);

      let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
      cv.morphologyEx(mask, mask, cv.MORPH_OPEN, kernel);
      cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);

      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let maxContour: any = null;
      for (let i = 0; i < contours.size(); i++) {
        let cnt = contours.get(i);
        let area = cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
          maxContour = cnt;
        }
      }

      if (maxContour && maxArea > (canvasWidth * canvasHeight * 0.1)) {
        const rotatedRect = cv.minAreaRect(maxContour);
        const boxPoints = cv.RotatedRect.points(rotatedRect);

        // رسم الحدود فقط إذا كان showBorders صحيحاً وليست هناك عملية التقاط جارية
        if (GlobalVars.showBorders && !captureInProgress) {
          for (let i = 0; i < 4; i++) {
            let pt1 = new cv.Point(boxPoints[i].x, boxPoints[i].y);
            let pt2 = new cv.Point(boxPoints[(i + 1) % 4].x, boxPoints[(i + 1) % 4].y);
            cv.line(src, pt1, pt2, new cv.Scalar(255, 0, 0, 255), 2);
          }
        }

        const xs = boxPoints.map(pt => pt.x);
        const ys = boxPoints.map(pt => pt.y);
        paperBounds.minX = Math.min(...xs);
        paperBounds.minY = Math.min(...ys);
        paperBounds.maxX = Math.max(...xs);
        paperBounds.maxY = Math.max(...ys);
        paperBounds.tempCanvas = refCanvas.value;

        if (!paperDetected) {
          paperDetected = true;
          entryCounter++;
          if (autoCapture.value && !isLoading.status) {
            setTimeout(() => {
              GlobalVars.isLoadingCapture = true;
              captureInProgress = true; // تعيين حالة التقاط الصورة
              GlobalVars.showBorders = false; // إخفاء الحدود
            }, 200);

            if (entryCounter > 1) {
              setTimeout(() => {
                takePicture();
                setTimeout(() => {
                  GlobalVars.isLoadingCapture = false;
                  captureInProgress = false; // إعادة تعيين حالة التقاط الصورة
                  GlobalVars.showBorders = true; // إعادة إظهار الحدود
                }, 500); // انتظر نصف ثانية قبل إعادة إظهار الحدود
              }, GlobalVars.timeToLateCapture);
            }
          }
        }
        detectedHand.isHand = true;
      } else {
        if (paperDetected) {
          paperDetected = false;
          exitCounter++;
        }
        detectedHand.isHand = false;
      }

      cv.imshow(refCanvas.value, src);

      src.delete();
      hsv.delete();
      lowerBound.delete();
      upperBound.delete();
      mask.delete();
      kernel.delete();
      contours.delete();
      hierarchy.delete();
      if (maxContour) {
        maxContour.delete();
      }
    }
    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);
}