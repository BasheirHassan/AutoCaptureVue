<template>
  <div class="container-fluid parent-div">


    <el-row :gutter="24">
      <el-col :xs="24" :sm="24" :md="20" :lg="20" :xl="20">
        <div class="card h-100 w-100" style="min-height: 500px">
          <div class="card-header d-flex justify-content-end align-items-center">
            <el-row :gutter="20" class="w-100">
              <el-col :span="10">
                <el-space>
                  <el-button :disabled="isDisable" @click="startAutoCounter" icon="Clock"
                    :type="isStartAutoCounter ? 'danger' : 'success'">
                    <template #default>
                      <vue-countdown ref='refAutoCounter' @end="finishedAutoCounter" :auto-start="false"
                        :time="formConfig.auto_counter * 1000" v-slot="{ totalSeconds }">ثانية /
                        {{ totalSeconds }}
                      </vue-countdown>
                    </template>
                  </el-button>

                </el-space>

              </el-col>
              <el-col :span="6">
                <el-row :gutter="20" class="w-100">
                  <el-col :span="6">
                    <el-button @click="DialogSetting = true" type="primary" title="اعدادات كاميرا" :disabled="isDisable"
                      :icon="Setting" circle />
                  </el-col>
                  <el-col :span="6">
                    <el-badge :value="formConfig.hotkey" class="item">

                      <el-button :disabled="isDisable" @click="takePicture" type="primary" :icon="Camera" circle />
                    </el-badge>
                  </el-col>


                </el-row>

              </el-col>
              <el-col :span="4">
                <div class="float-end">
                  <el-row :gutter="20" class="w-100">
                    <el-col :span="24">
                      <el-switch :disabled="isDisable" v-model="autoCapture" class="ml-2" size="large" inline-prompt
                        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                        active-text="تفعيل كشف ورقة" inactive-text="ايقاف كشف ورقة" />
                    </el-col>
                  </el-row>
                </div>
              </el-col>
              <el-col :span="4">
                <div class="float-end">
                  <el-row :gutter="20" class="w-100">
                    <el-col :span="24">
                      <el-button @click="formConfig.enable_cropping = !formConfig.enable_cropping"
                        :type="formConfig.enable_cropping ? 'success' : 'danger'"><i role="button" class="bi bi-crop"
                          title="تفعيل اقتصاص حسب حجم الصورة"></i></el-button>
                    </el-col>
                  </el-row>
                </div>
              </el-col>
            </el-row>


          </div>
          <div class="card-body x-card-body" v-loading="isLoading.status || GlobalVars.isLoadingCapture" ref="refCard"
            :element-loading-text="isLoading.msg">
            <div id="videoContainer" style="position: relative;">
              <video id="video" ref="refVideo" autoplay style="display: none;"></video>
              <canvas v-show="isStartInit" id="canvas" ref="refCanvas" style=" width: 100%; height: 100%"></canvas>
              <!-- مربع أحمر يظهر عند الكشف عن حركة اليد -->
              <div v-show="detectedHand.isHand" class="red-square"></div>
            </div>
          </div>

        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="4" :lg="4" :xl="4">
        <div class="container-fluid">
          <el-alert title="عدد صور" type="info" center :close-text="xID" v-if="xID > 0" />
          <el-scrollbar class="x-scrollbar" :max-height="scrollbarHeight - 200">
            <div class="card mt-2" v-for="img in (collect(imagesList.items) as Collection<ImageItem>).reverse()"
              :key="img.id">
              <div class="card-header size-card d-flex justify-content-between">
                <el-button @click="deleteImage(img)" icon="Delete" type="danger" circle size="small"></el-button>
                <el-tag size="small" effect="dark" type="primary"> {{ img.id }} </el-tag>
              </div>

              <div style="padding: unset!important">
                <el-image :preview-src-list="[img.src]" style="width: 100%; height: 150px" :src="img.src" fit="fill">
                </el-image>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </el-col>
    </el-row>

  </div>
  <el-footer class="d-flex justify-content-between">
    <div>
      <el-tag class="ml-2" size="large" effect="light" type="info">
        <el-space>
          <el-text>الاصدار :</el-text>
          <el-tag v-if="appVersion" effect="dark" type="warning">{{ appVersion }}</el-tag>
        </el-space>
      </el-tag>
    </div>
  </el-footer>

  <el-dialog v-model="DialogSetting" title="اعدادات" width="600" align-center draggable>
    <el-form label-position="left" label-width="auto" :model="formConfig">
      <el-form-item label="حفظ صور بقاعدة البيانات" label-position="right">
        <el-switch v-model="formConfig.save_db" @change="saveConfig" :active-value="'1'" :inactive-value="'0'" />
      </el-form-item>

      <el-form-item label="اقتصاص الصورة" label-position="right">
        <el-switch v-model="formConfig.enable_cropping" @change="saveConfig" :active-value="'1'"
          :inactive-value="'0'" />
      </el-form-item>


      <el-form-item label="مجلد الحفظ" label-position="right">
        <el-input v-model="formConfig.path_folder_to_save_image" disabled>
          <template #append>
            <el-button @click="setFolderPathToSave" :icon="Folder"></el-button>
          </template>
        </el-input>

      </el-form-item>

      <el-form-item label="سطوع " label-position="right">
        <el-slider v-model="formConfig.video_brights" @change="saveConfig" @input="testSliderFilterVedio" :min="0"
          :max="100" :step="1" />
      </el-form-item>

      <el-form-item label="Contrast" label-position="right">
        <el-slider v-model="formConfig.video_contrast" @change="saveConfig" @input="testSliderFilterVedio" :min="0"
          :max="100" :step="1" />
      </el-form-item>

      <el-form-item label="اختصار التقاط صورة" label-position="right">
        <el-input v-model="formConfig.hotkey" @keydown="addShortCutKey($event.code, true)" @change="saveConfig" />
      </el-form-item>

      <el-form-item label="عداد الي التقاط صورة" label-position="right">
        <el-input-number v-model="formConfig.auto_counter" :min="0" :max="999999" @change="saveConfig" />
      </el-form-item>

      <el-form-item label="فترة تاخير التقاط صورة / الي" label-position="right">
        <el-input-number v-model="formConfig.time_late_take_picture" @change="saveConfig" />
      </el-form-item>

      <el-form-item label="عدد عرض صور جانبيه" label-position="right">
        <el-input-number v-model="formConfig.slider_img_show" @change="saveConfig" />
      </el-form-item>


      <el-form-item label="جودة الفيديو" label-position="right">
        <el-select-v2 v-model="valueCommonResolutions" :options="optionsCommonResolutions" placeholder="Please select"
          @change="saveConfig" style="width: 240px" value-key="width">
          <template #default="{ item }">
            <span style="margin-right: 8px">{{ item.label }}</span>
            <span style="color: var(--el-text-color-secondary); font-size: 13px">
              {{ item.value.width }} x {{ item.value.height }}
            </span>
          </template>
        </el-select-v2>

      </el-form-item>


      <el-form-item label="نوع حفظ الصورة" label-position="right">
        <el-select-v2 v-model="formConfig.image_type" :options="optionsImageTypeSave" placeholder="Please select"
          @change="saveConfig" style="width: 240px" value-key="value">
        </el-select-v2>
      </el-form-item>

      <el-form-item label="جودة الصورة" label-position="right" v-if="formConfig.image_type !== 'png'">
        <el-slider v-model="formConfig.image_quality" @change="saveConfig" :min="50" :max="100" :step="5"
          :format-tooltip="formatQualityTooltip" />
      </el-form-item>

      <el-form-item label="تحسين حدة الصورة" label-position="right">
        <el-slider v-model="formConfig.sharpen_level" @change="saveConfig" :min="0" :max="5" :step="1"
          :format-tooltip="formatSharpenTooltip" />
      </el-form-item>

      <el-form-item label="إزالة الضوضاء" label-position="right">
        <el-switch v-model="formConfig.denoise" @change="saveConfig" :active-value="true" :inactive-value="false" />
      </el-form-item>

      <el-form-item label="تحسين تلقائي للصورة" label-position="right">
        <el-switch v-model="formConfig.auto_enhance" @change="saveConfig" :active-value="true"
          :inactive-value="false" />
      </el-form-item>

      <el-form-item label="ضبط السطوع" label-position="right">
        <el-slider v-model="formConfig.brightness_adjust" @change="saveConfig" :min="-50" :max="50" :step="5" />
      </el-form-item>

      <el-form-item label="ضبط التباين" label-position="right">
        <el-slider v-model="formConfig.contrast_adjust" @change="saveConfig" :min="-50" :max="50" :step="5" />
      </el-form-item>

      <el-form-item label="ضبط التشبع" label-position="right">
        <el-slider v-model="formConfig.saturation_adjust" @change="saveConfig" :min="-50" :max="50" :step="5" />
      </el-form-item>

      <el-form-item label="Api Key" label-position="right">
        <el-input v-model="formConfig.api_key" @keydown="addShortCutKey($event.code, true)" @change="saveConfig" />
      </el-form-item>


      <el-form-item label="كاميرا" label-position="right">
        <el-select-v2 v-model="formConfig.camera_id" :options="cameraNames" placeholder="Please select"
          @change="saveConfig" style="width: 100%" value-key="value">
        </el-select-v2>

      </el-form-item>


      <el-form-item label="اتجاه كاميرا" label-position="right">

        <el-select-v2 v-model="formConfig.facing_mode" :options="cameraFacingMode" placeholder="تحديد اتجاه كاميرا"
          @change="saveConfig" style="width: 100%" value-key="value">
        </el-select-v2>

      </el-form-item>

    </el-form>
  </el-dialog>

</template>

<script setup lang="ts">
import { onBeforeMount, onMounted, onUnmounted, reactive, ref } from "vue";
import { collect, Collection } from "collect.js";
import MysqlAsyncClass from "@/assets/MysqlAsyncClass";
import { Camera, Folder, Setting } from "@element-plus/icons-vue";
import { ipcRenderer } from "electron";
import { helpersNotification, stringToBoolean } from "@/assets/Helpers";
import { imageClass } from "@/assets/ImageClass";
import { useEventListener } from "@vueuse/core";
import router from "@/router";
import MigrateClass from "@assets/MigrateClass";
import handBg from '@/assets/icons/hand.png';
import $ from "jquery";
import path from "node:path";
import { ipcEventEnum } from "@assets/ipcEvents";

import { startVideoProcessing } from "@assets/videoProcessor";
import { GlobalVars } from "@/assets/GlobalVars";

const worker = new Worker('./worker.js', { type: 'module' });

const DialogSetting = ref(false)

interface FormConfig {
  version: string | null;
  hotkey: string;
  image_type: string;
  image_quality: number;
  time_late_take_picture: number;
  path_folder_to_save_image: string;
  save_db: boolean;
  resolution: number;
  video_brights: number;
  video_contrast: number;
  auto_counter: number;
  slider_img_show: number;
  api_key: string;
  camera_id: string;
  facing_mode: string;
  enable_cropping: boolean;
  sharpen_level: number;
  denoise: boolean;
  auto_enhance: boolean;
  brightness_adjust: number;
  contrast_adjust: number;
  saturation_adjust: number;
}

const formConfig = reactive<FormConfig>({
  version: null,
  hotkey: 'F3',
  image_type: "png",
  image_quality: 95,
  time_late_take_picture: 2000,
  path_folder_to_save_image: "",
  save_db: true,
  resolution: 2,
  video_brights: 60,
  video_contrast: 60,
  auto_counter: 10,
  slider_img_show: 10,
  api_key: "",
  camera_id: "",
  facing_mode: "environment",
  enable_cropping: false,
  sharpen_level: 2,
  denoise: true,
  auto_enhance: true,
  brightness_adjust: 0,
  contrast_adjust: 0,
  saturation_adjust: 0
});

const isLoading = reactive({ status: false, msg: "جاري التقاط الصورة" });               // يشير إلى ما إذا كانت عملية التقاط الصورة جارية حاليًا
const msgCapture = ref("جاري التقاط الصورة ...");               // يشير إلى ما إذا كانت عملية التقاط الصورة جارية حاليًا
const msgLoading = ref("جاري تحميل ....");               // يشير إلى ما إذا كانت عملية التقاط الصورة جارية حاليًا // يحمل مصدر الصورة الملتقطة (الرابط)
const imagesList = reactive<{ items: ImageItem[] }>({ items: [] });       // كائن تفاعلي لتخزين قائمة الصور الملتقطة
const captuerInitNumber = ref(0);                 // عدد المحاولات الأولية لالتقاط الورقة
const xID = ref(0);                               // معرف تسلسلي لكل صورة ملتقطة
const autoCapture = ref(false);                   // علم لتفعيل أو تعطيل الالتقاط التلقائي للصور
const mysqlClass = new MysqlAsyncClass();         // كائن من فئة MysqlAsyncClass لتنفيذ العمليات غير المتزامنة مع قاعدة البيانات
const valueCommonResolutions = ref({ width: 1920, height: 1080 });  // دقة الصورة الافتراضية (عرض × ارتفاع)
const refVideo = ref();                           // مرجع إلى عنصر الفيديو لعرض تدفق الفيديو
const refCanvas = ref();                          // مرجع إلى عنصر الـ canvas لالتقاط الإطارات من الفيديو
const refAutoCounter = ref();                          // مرجع إلى عنصر الـ canvas لالتقاط الإطارات من الفيديو
const refCard = ref();                          // مرجع إلى عنصر الـ canvas لالتقاط الإطارات من الفيديو
const ctx = ref();                                // مرجع إلى سياق الرسم ثنائي الأبعاد الخاص بالـ canvas
const videoIsReadyState = ref(false);             // علم للتحقق من أن تدفق الفيديو جاهز للعمل
const streamVideo = ref();                        // يخزن كائن تدفق الوسائط للفيديو
const isDisable = ref(true);
const isStartInit = ref(false);
const scrollbarHeight = ref<number>(300);
const isStartAutoCounter = ref(false); // علم لتشغيل التقاط التلقائي للصور التقاط التلقائي للصوr
const sampleRate = 30;
const appVersion = ref("");
const detectedHand = reactive({ isHand: false });

interface ImageItem {
  id: number;
  idDB: any;
  fullPath: string;
  src: string;
}

interface CameraDevice {
  label: string;
  deviceId: string;
  value: string;
}

const cameraNames = ref<CameraDevice[]>([]);
const cameraFacingMode = ref([{ label: 'كاميرا خلفية', value: 'environment' }, { label: 'كاميرا امامية', value: 'user' }]);

// Format quality tooltip to show percentage
function formatQualityTooltip(val: any) {
  return `${val}%`;
}

// Format sharpen tooltip to show level
function formatSharpenTooltip(val: any) {
  const levels = ['لا تحسين', 'خفيف', 'متوسط', 'قوي', 'قوي جداً', 'أقصى'];
  return levels[val] || `مستوى ${val}`;
}


const paperBounds = reactive({
  minX: 0,
  minY: 0,
  maxX: 0,
  maxY: 0,
  tempCanvas: null as HTMLCanvasElement | null // Initialize as null
});



const optionsImageTypeSave = ref([
  { value: 'png', label: 'png' },
  { value: 'jpg', label: 'jpg' },
  { value: 'jpeg', label: 'jpeg' },
])  // تسلسل الصور

/**
 * تحديد خيار جودة الفيدو
 */

const optionsCommonResolutions = ref([
  { value: { width: 2560, height: 1080 }, label: '2560x1080 HD' },// 21:9
  { value: { width: 2048, height: 1080 }, label: '2048x1080 HD' },  // 21:9
  { value: { width: 1920, height: 1080 }, label: '1920x1080 HD' }, // 16:9
  { value: { width: 3840, height: 2160 }, label: '3840x2160 4K' }, // 16:9
  { value: { width: 1280, height: 1080 }, label: '1280x1080' },  // 16:9
  { value: { width: 1024, height: 768 }, label: '1024x768' },  // 4:3
  { value: { width: 800, height: 600 }, label: '800x600' },   // 4:3
  { value: { width: 640, height: 480 }, label: '640x480' },   // 4:3
]);


onBeforeMount(async () => {
  isLoading.status = true;
  isLoading.msg = msgLoading.value;
  await new MigrateClass().checkNeedUpdate().then(res => {
    console.log(res.status, 'checkNeedUpdate')
    if (res.status) {
      router.push('/migrateDB');
    }
  });

})


onMounted(async () => {
  appVersion.value = await ipcRenderer.invoke("getAppVersion", null);

  isLoading.status = true;
  isLoading.msg = msgLoading.value;
  const configs = await mysqlClass.getConfig();


  collect(formConfig).each((it: any, key: any) => {
    let filter = collect(configs).filter((x: any) => x.key == key).first();
    if (filter) {
      //@ts-ignore
      formConfig[key] = filter.value;
    }
  })

  formConfig.video_brights = Number(formConfig.video_brights);
  formConfig.video_contrast = Number(formConfig.video_contrast);
  formConfig.brightness_adjust = Number(formConfig.brightness_adjust || 0);
  formConfig.contrast_adjust = Number(formConfig.contrast_adjust || 0);
  formConfig.saturation_adjust = Number(formConfig.saturation_adjust || 0);
  formConfig.sharpen_level = Number(formConfig.sharpen_level || 2);
  formConfig.auto_counter = Number(formConfig.auto_counter || 10);
  formConfig.slider_img_show = Number(formConfig.slider_img_show || 10);
  formConfig.time_late_take_picture = Number(formConfig.time_late_take_picture || 2000);
  formConfig.image_quality = Number(formConfig.image_quality || 95);

  // تحويل القيم المنطقية
  formConfig.denoise = stringToBoolean(formConfig.denoise);
  formConfig.auto_enhance = stringToBoolean(formConfig.auto_enhance);
  formConfig.enable_cropping = stringToBoolean(formConfig.enable_cropping);
  formConfig.save_db = stringToBoolean(formConfig.save_db);

  GlobalVars.timeToLateCapture = formConfig.time_late_take_picture;

  valueCommonResolutions.value = optionsCommonResolutions.value[formConfig.resolution].value;
  ctx.value = refCanvas.value.getContext('2d');
  await main();


  // استخدام الدالة
  await getAvailableCameras();
  addShortCutKey(formConfig.hotkey);
  videoMaxSize();


  worker.onmessage = async (event) => {
    if (event.data.type === 'imageSaved') {
      await imageClass.saveImageToFolder(event.data.imgName, event.data.imagePath, event.data.base64Data);
      let result = await imageClass.saveImageToDataBase(event.data.base64Data);
      imagesList.items.push({
        id: xID.value,
        idDB: result,
        fullPath: path.join(event.data.imagePath, event.data.imgName),
        src: event.data.base64Data
      });
      imagesList.items = collect(imagesList.items).slice(-formConfig.slider_img_show, formConfig.slider_img_show).all();
      console.log('Image saved successfully in worker:');
    } else if (event.data.type === 'error') {
      console.error('Error saving image in worker:', event.data.message);
    }
  };
})


onUnmounted(() => {
  worker.terminate();
});


async function getAvailableCameras() {
  console.log('Load Camera')
  try {
    // تحقق من دعم المتصفح للـ API
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      throw new Error("Your browser does not support enumerateDevices.");
    }

    // جلب قائمة الأجهزة
    const devices = await navigator.mediaDevices.enumerateDevices();

    // تصفية الأجهزة للحصول على الكاميرات فقط
    const videoDevices = devices.filter(device => device.kind === "videoinput");

    // عرض أسماء الكاميرات
    cameraNames.value = videoDevices.map((device, index) => ({
      label: device.label || `Camera ${index + 1}`, // إذا كان الاسم غير متوفر
      deviceId: device.deviceId,
      value: device.deviceId
    }));

    return cameraNames;
  } catch (error) {
    console.error("Error fetching cameras:", error);
    helpersNotification(false, "Error:" + error)
    throw error;
  }
}


async function setupCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Your browser does not support getUserMedia.");
  }

  try {
    streamVideo.value = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: formConfig.facing_mode,
        deviceId: { exact: formConfig.camera_id },
        width: { ideal: valueCommonResolutions.value.width },
        height: { ideal: valueCommonResolutions.value.height },
        aspectRatio: { ideal: valueCommonResolutions.value.width / valueCommonResolutions.value.height },
      }
    });

    refVideo.value.srcObject = streamVideo.value;

    return new Promise((resolve) => {
      refVideo.value.onloadedmetadata = () => {
        isLoading.status = true;
        isLoading.msg = msgLoading.value;
        videoIsReadyState.value = true;
        isDisable.value = false;
        resolve(refVideo.value);
      };
    });
  } catch (error) {
    console.error("Error accessing camera:", error);
    helpersNotification(false, " تاكد من وجود الكاميرا او اعطاء الصلاحية Error accessing camera:" + error)
    isLoading.status = false;
    DialogSetting.value = true
    throw error;
  }
}


// دالة لتحويل RGB إلى HSV// دالة لتحويل RGB إلى HSV


// Initialize the tempCanvas with high-quality settings
function initTempCanvas() {
  if (!paperBounds.tempCanvas) {
    paperBounds.tempCanvas = document.createElement('canvas');
  }

  // Set canvas dimensions to match video resolution for best quality
  paperBounds.tempCanvas.width = valueCommonResolutions.value.width;
  paperBounds.tempCanvas.height = valueCommonResolutions.value.height;

  const tempCtx = paperBounds.tempCanvas.getContext('2d');
  if (tempCtx) {
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
  }
}

async function main() {
  try {
    await setupCamera();
    refVideo.value.play();

    // Initialize tempCanvas with high-quality settings
    initTempCanvas();

    startVideoProcessing(refVideo, refCanvas, ctx, paperBounds, detectedHand, autoCapture, isLoading, takePicture);
    await changeVideoResultion();
    isStartInit.value = true;
  } catch (e) {
    console.log(e)
    helpersNotification(false, e);
  }
}


/**
 * التقاط صورة
 */

async function takePicture() {
  console.log('takePicture');
  xID.value++;
  isLoading.status = true;
  isLoading.msg = msgCapture.value;
  captuerInitNumber.value++;

  // إخفاء الإطار قبل التقاط الصورة مباشرة
  GlobalVars.isLoadingCapture = true;
  GlobalVars.showBorders = false;

  // تأخير صغير للتأكد من إخفاء الإطار
  await new Promise(resolve => setTimeout(resolve, 100));

  // تحديد منطقة الاقتصاص
  let cropX = 0;
  let cropY = 0;
  let cropWidth = 0;
  let cropHeight = 0;

  // التحقق من صحة حدود الاقتصاص
  const isValidBounds =
    paperBounds.minX >= 0 &&
    paperBounds.minY >= 0 &&
    paperBounds.maxX > paperBounds.minX &&
    paperBounds.maxY > paperBounds.minY;

  if (stringToBoolean(formConfig.enable_cropping) && isValidBounds) {
    // استخدام الحدود المكتشفة للاقتصاص
    cropX = paperBounds.minX;
    cropY = paperBounds.minY;
    cropWidth = paperBounds.maxX - paperBounds.minX;
    cropHeight = paperBounds.maxY - paperBounds.minY;

    // التأكد من أن أبعاد الاقتصاص ليست صفرية أو سالبة
    if (cropWidth <= 0 || cropHeight <= 0) {
      console.warn("Invalid crop dimensions, using full image instead");
      cropX = 0;
      cropY = 0;
      cropWidth = refCanvas.value.width;
      cropHeight = refCanvas.value.height;
    }
  } else {
    // استخدام الصورة كاملة إذا كان الاقتصاص غير مفعل أو الحدود غير صالحة
    cropWidth = refCanvas.value.width;
    cropHeight = refCanvas.value.height;
  }

  let imageXID = imageClass.creatImageXID(formConfig.path_folder_to_save_image, xID.value, formConfig.image_type);

  // التحقق من تهيئة tempCanvas
  if (!paperBounds.tempCanvas) {
    initTempCanvas();
    return;
  }
  const tempCtx = paperBounds.tempCanvas.getContext('2d');
  if (!tempCtx) {
    console.error('Failed to get 2D context');
    return;
  }

  // تطبيق إعدادات الجودة العالية على الـ temporary canvas
  tempCtx.imageSmoothingEnabled = true;
  tempCtx.imageSmoothingQuality = 'high';

  // رسم الإطار الحالي من الفيديو على الـ temporary canvas بجودة عالية
  tempCtx.drawImage(refVideo.value, 0, 0, paperBounds.tempCanvas.width, paperBounds.tempCanvas.height);

  try {
    if (!paperBounds.tempCanvas || !tempCtx) {
      console.error('Canvas or context not available');
      return;
    }

    // تحويل الجودة من نسبة مئوية إلى عدد عشري (0-1)
    const qualityDecimal = formConfig.image_quality / 100;

    // التأكد من أن قيم التشبع والتباين والسطوع أرقام
    const brightnessAdjust = Number(formConfig.brightness_adjust || 0);
    const contrastAdjust = Number(formConfig.contrast_adjust || 0);
    const saturationAdjust = Number(formConfig.saturation_adjust || 0);
    const sharpenLevel = Number(formConfig.sharpen_level || 2);
    const denoise = stringToBoolean(formConfig.denoise);
    const autoEnhance = stringToBoolean(formConfig.auto_enhance);

    // تعديل نسب الاقتصاص إذا كانت أبعاد الـ canvas مختلفة عن أبعاد الفيديو
    const scaleX = paperBounds.tempCanvas.width / refCanvas.value.width;
    const scaleY = paperBounds.tempCanvas.height / refCanvas.value.height;

    const scaledCropX = cropX * scaleX;
    const scaledCropY = cropY * scaleY;
    const scaledCropWidth = cropWidth * scaleX;
    const scaledCropHeight = cropHeight * scaleY;

    // إرسال بيانات الصورة إلى العامل مع إعدادات تحسين الجودة
    worker.postMessage({
      type: 'saveImage',
      imgName: imageXID.imgName,
      imgPath: formConfig.path_folder_to_save_image,
      cropX: scaledCropX,
      cropY: scaledCropY,
      cropWidth: scaledCropWidth,
      cropHeight: scaledCropHeight,
      width: paperBounds.tempCanvas.width,
      height: paperBounds.tempCanvas.height,
      imageData: tempCtx.getImageData(0, 0, paperBounds.tempCanvas.width, paperBounds.tempCanvas.height).data.buffer,
      imageType: formConfig.image_type,
      imageQuality: qualityDecimal,
      sharpenLevel: sharpenLevel,
      denoise: denoise,
      autoEnhance: autoEnhance,
      brightnessAdjust: brightnessAdjust,
      contrastAdjust: contrastAdjust,
      saturationAdjust: saturationAdjust
    }, [tempCtx.getImageData(0, 0, paperBounds.tempCanvas.width, paperBounds.tempCanvas.height).data.buffer]);

    await imageClass.playSound();
  } finally {
    // إعادة تعيين الحالة وإظهار الإطار بعد اكتمال العملية
    setTimeout(() => {
      isLoading.status = false;
      GlobalVars.isLoadingCapture = false;
      GlobalVars.showBorders = true;
    }, 500);
  }
}

/**
 * تحيد مجلد حفظ الصور
 */
async function setFolderPathToSave() {
  let setPath = await ipcRenderer.invoke('set-folder-pathe-to-save', null);
  if (setPath) {
    formConfig.path_folder_to_save_image = setPath;
    saveConfig();
  }

}

/**
 * تغيير حجم الفيديو
 */
async function changeVideoResultion() {

  if (!videoIsReadyState.value || !refVideo.value.videoWidth || !refVideo.value.videoHeight) {
    return;
  }
  refVideo.value.style.filter = `brightness(${formConfig.video_brights / 50}) contrast(${formConfig.video_contrast / 50}) `;
  console.log(formConfig.video_brights / 50)
  isLoading.status = true;
  isLoading.msg = msgLoading.value;
  const videoTrack = streamVideo.value.getVideoTracks()[0];
  await videoTrack.applyConstraints({
    width: { ideal: valueCommonResolutions.value.width },
    height: { ideal: valueCommonResolutions.value.height },
    aspectRatio: { ideal: valueCommonResolutions.value.width / valueCommonResolutions.value.height },
    sampleRate: sampleRate// Change the width after starting the stream
  });

  // Update tempCanvas dimensions when video resolution changes
  if (paperBounds.tempCanvas) {
    paperBounds.tempCanvas.width = valueCommonResolutions.value.width;
    paperBounds.tempCanvas.height = valueCommonResolutions.value.height;
  }

  isLoading.status = false;
}


function addShortCutKey(keyCode: any, isInit: boolean = false) {
  if (!keyCode) {
    console.error('keyCode is null or undefined');
    return;
  }
  if (isInit) {
    formConfig.hotkey = keyCode;
    saveConfig();
    return;
  }

  console.log(isInit, 'isInit')
  useEventListener(document, 'keydown', (e) => {
    if (!e) {
      console.error('Event is null or undefined');
      return;
    }
    console.log(formConfig.hotkey)
    if (e.code == formConfig.hotkey?.trim() && isDisable.value == false) {
      isLoading.status = true;
      isLoading.msg = msgLoading.value;
      if (!isInit) {
        takePicture();
      }

    }
  })

  formConfig.hotkey = keyCode;

}


function testSliderFilterVedio() {

  refVideo.value.style.filter = `brightness(${formConfig.video_brights / 50}) contrast(${formConfig.video_contrast / 50}) `;
  refCanvas.value.style.filter = `brightness(${formConfig.video_brights / 50}) contrast(${formConfig.video_contrast / 50}) `;
  console.log(formConfig, 'video_brights')
  videoMaxSize();
}

function videoMaxSize() {
  const staticSize = 300; // Size for header and other UI elements
  const videoContainer = document.getElementById('videoContainer');
  const videoParent = $(refVideo.value)?.[0];
  const canvasParent = $(refCanvas.value);

  // Get the available space in the card body
  const cardBody = $(".x-card-body");
  const cardBodyWidth = cardBody?.width() ?? 0;
  const cardBodyHeight = cardBody?.height() ?? 0;

  // Calculate dimensions with padding
  const padding = 20;
  const videoWidth = cardBodyWidth - (padding * 2);
  const videoHeight = cardBodyHeight - (padding * 2);

  // Set video container size
  if (videoContainer) {
    videoContainer.style.width = `${videoWidth}px`;
    videoContainer.style.height = `${videoHeight}px`;
    videoContainer.style.padding = `${padding}px`;
  }

  // Set video element size
  if (videoParent) {
    $(videoParent).attr('width', videoWidth + 'px');
    $(videoParent).attr('height', videoHeight + 'px');
  }

  // Set canvas size
  if (canvasParent) {
    $(canvasParent).attr('width', videoWidth + 'px');
    $(canvasParent).attr('height', videoHeight + 'px');
  }

  // Update scrollbar height
  const docHeight = $(document)?.height() ?? 0;
  $(".x-scrollbar")?.attr('height', docHeight - staticSize + 'px');
  scrollbarHeight.value = docHeight;

  // Update parent div height
  const documentHeight = docHeight;
  $(".parent-div")?.attr('height', documentHeight - staticSize + 'px');
}

/**
 * حفظ الاعدادات في قاعدة البيانات
 */
async function saveConfig() {
  // تحديد مؤشر الدقة المختارة في قائمة الدقة
  formConfig.resolution = optionsCommonResolutions.value.findIndex(i => i.value.width === valueCommonResolutions.value.width);

  // تحويل كائن الإعدادات إلى مصفوفة من الأزواج (المفتاح والقيمة)
  const configs = collect(formConfig).map((it: any, key: string) => {
    const value = key === 'brightness_adjust' || key === 'contrast_adjust' || key === 'saturation_adjust' ||
      key === 'sharpen_level' || key === 'video_brights' || key === 'video_contrast' ||
      key === 'auto_counter' || key === 'slider_img_show' || key === 'time_late_take_picture' ||
      key === 'image_quality'
      ? Number(it)
      : key === 'denoise' || key === 'auto_enhance' || key === 'enable_cropping' || key === 'save_db'
        ? stringToBoolean(it)
        : it;
    return { key, value };
  }).toArray();

  // إعادة تهيئة الكاميرا والفيديو بالإعدادات الجديدة
  await main();
  videoMaxSize();

  // تحديث وقت التأخير في المتغير العام
  GlobalVars.timeToLateCapture = formConfig.time_late_take_picture;

  // تطبيق إعدادات السطوع والتباين على الفيديو والكانفاس
  refVideo.value.style.filter = `brightness(${formConfig.video_brights / 50}) contrast(${formConfig.video_contrast / 50}) `;
  refCanvas.value.style.filter = `brightness(${formConfig.video_brights / 50}) contrast(${formConfig.video_contrast / 50}) `;

  // حفظ الإعدادات في قاعدة البيانات
  try {
    await mysqlClass.saveConfig(configs);
    helpersNotification(true, 'تم حفظ الإعدادات بنجاح');
    await changeVideoResultion();
  } catch (err) {
    console.log(err);
    helpersNotification(false, err instanceof Error ? err.message : String(err));
  }
}

window.addEventListener('resize', () => {
  console.log('rezie');
  videoMaxSize();
});


async function deleteImage(img: ImageItem) {
  try {
    // التحقق من وجود مسار الصورة
    if (!img || !img.fullPath) {
      console.error("مسار الصورة غير محدد");
      return;
    }

    // التحقق من وجود الصورة في نظام الملفات قبل محاولة حذفها
    const fileExists = await ipcRenderer.invoke('check-file-exists', img.fullPath);

    if (!fileExists) {
      console.warn("الصورة غير موجودة في المسار المحدد:", img.fullPath);
      // حذف من قائمة الصور في الواجهة على أي حال
      imagesList.items = imagesList.items.filter(i => i.idDB !== img.idDB);
      // حذف من قاعدة البيانات
      await mysqlClass.deleteImageByID(img.idDB);
      return;
    }

    // حذف الصورة من نظام الملفات
    const deleteResult = await ipcRenderer.invoke('delete-image', img.fullPath);

    if (!deleteResult) {
      console.error("فشل في حذف الصورة من نظام الملفات");
      return;
    }

    // حذف الصورة من قائمة الصور في الواجهة
    imagesList.items = imagesList.items.filter(i => i.idDB !== img.idDB);

    // حذف الصورة من قاعدة البيانات
    await mysqlClass.deleteImageByID(img.idDB);

    console.log("تم حذف الصورة بنجاح:", img.fullPath);
  } catch (e) {
    // تسجيل الخطأ في وحدة التحكم
    console.error("حدث خطأ أثناء حذف الصورة:", e);
  }
}

function finishedAutoCounter() {
  takePicture();
  if (isStartAutoCounter.value) {
    refAutoCounter.value.restart();
  }

}


function startAutoCounter() {
  if (isStartAutoCounter.value) {
    refAutoCounter.value.abort();
  } else {
    refAutoCounter.value.restart();
  }
  isStartAutoCounter.value = !isStartAutoCounter.value;

}


ipcRenderer.on(ipcEventEnum["exportImages"], async (event, arg) => {
  const patheExport = await ipcRenderer.invoke('set-folder-pathe-to-save', null);
  console.log(patheExport)
  if (patheExport) {
    helpersNotification(true, 'جاري تصدير الصور');
    await imageClass.exportImagesToFolder(patheExport);
    helpersNotification(true, 'تم تصدير الصور بنجاح');
  }
});


</script>


<style>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.el-image-viewer__canvas {
  background-color: #6f42c1 !important;
}


.scrollbar-flex-content {
  height: 100%;
}

.scrollbar-demo-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
}


.red-square {
  position: absolute;
  top: 10px;
  /* المسافة من الأعلى */
  left: 10px;
  /* المسافة من اليسار */
  width: 100px;
  /* عرض المربع */
  height: 100px;
  /* ارتفاع المربع */
  z-index: 2;
  /* تأكد من أنه فوق الفيديو */
  background-image: v-bind("`url('${handBg}')`");
  background-repeat: no-repeat;
}

.my-badge {
  position: absolute !important;
  top: 5% !important;
  right: 50% !important;
  width: 30px !important;
  height: 30px !important;
}

.el-footer {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 40px;
  background-color: #f2f2f2;
  color: white;
  text-align: center;
}

.size-card {
  height: 30px !important;
}

.card-header {
  /* Optional: if additional centering for the container is needed */
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}

#videoContainer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

#videoContainer video,
#videoContainer canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.x-card-body {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  height: calc(100vh - 300px);
  min-height: 500px;
  background-color: #000;
}

#videoContainer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
  border-radius: 8px;
}

#videoContainer video,
#videoContainer canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .x-card-body {
    height: calc(100vh - 400px);
  }

  #videoContainer {
    padding: 10px;
  }
}
</style>
