<template>


  <div class="vh-100">

    <el-card class="mb-4" v-loading.fullscreen.lock="fullscreenLoading" element-loading-text="تحميل ........">
      <template #header>
        <div class="card-header">
          <ProgressPercentage :percentage="percentage" :totalItems="multipleSelection.length"></ProgressPercentage>

          <el-space>
            <el-tag type="danger" effect="dark" class="justify-content-end">{{ countImages }}</el-tag>
            <div class="d-flex  float-end justify-content-end">
              <el-input
                  v-model="searchValue"
                  style="width: 240px"
                  @change="searchImage"
                  placeholder="بحث في الصور"
                  clearable
                  :suffix-icon="isSearch ?  Loading: Search"
              >
              </el-input>

            </div>
            <el-pagination
                background
                :hide-on-single-page="true"
                @current-change="changeCurrentChange"
                layout="prev, pager, next"
                :total="totalPagention"
                :page-size="percintPagention"
            />


          </el-space>
          <div class="d-flex justify-content-end ">
            <el-space>
              <button-confirm-with-tolltip-components @confirm="deleteAllImages" tooltip-title="حذف كافة الصور">حذف كافة
                الصور
              </button-confirm-with-tolltip-components>
              <el-button type="success" @click="reloadAll" icon="Refresh" circle title="تحديث"/>
              <el-button type="primary" :disabled="multipleSelection.length == 0" @click="setFolderPathToSave"
                         icon="Download" title="تحميل الصور المحددة" circle/>
              <el-button circle type="success" icon="EditPen" :disabled="multipleSelection.length == 0"
                         title="مستخرج النص" @click="extractTextSelectionImages"/>

            </el-space>


          </div>


        </div>

        <div>

        </div>

      </template>
      <el-table :highlight-current-row="true" ref="refTable" :border="true" stripe :data="allDate"
                @selection-change="addSelctions">
        <el-table-column type="selection" :selectable="(row:any) => !isLoading"/>
        <el-table-column prop="id" label="#" width="100">
          <template #default="scope">
            <SkeletonValueComponents :is-loading="isLoading" :value="scope.row.id"/>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="تاريخ" width="200">
          <template #default="scope">
            <SkeletonValueComponents :is-loading="isLoading">
            <template #default>
            <el-space >
              <el-tag>{{ moment(scope.row.date).format('YYYY-MM-DD') }}</el-tag>
              <el-tag>{{ moment(scope.row.date).format('HH:MM:ss') }}</el-tag>
            </el-space>
            </template>
            </SkeletonValueComponents>
          </template>
        </el-table-column>
        <el-table-column prop="isChecked" label="صور" width="250">
          <template #default="scope">

            <SkeletonValueComponents :is-loading="isLoading" variant="image">
              <template #default>
                <el-image  role="button" @click="showImageDilog(scope.row)" fit="cover"
                           :src="'data:image/png;base64,' +blobToImage(scope.row.image)" lazy/>
              </template>
            </SkeletonValueComponents>

          </template>
        </el-table-column>
        <el-table-column prop="ocr_text" label="نص مستخرج">
          <template #default="scope">
            <SkeletonValueComponents :is-loading="isLoading" :value="scope.row.ocr_text"/>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="#">
          <template #default="scopeX">
            <SkeletonValueComponents :is-loading="isLoading">
              <template #default="scope">
                <el-space>
                  <button-confirm-with-tolltip-components v-if="!isLoading" icon="Delete" button-type="danger"
                                                          tooltip-title="هل تريد الحذف"
                                                          @confirm="deleteImageByID(scopeX.row.id)"/>
                  <el-button v-show="!isLoading" circle icon="Download" type="success"
                             @click="downloadImage(scopeX.row)"/>
                  <el-button v-show="!isLoading" circle icon="EditPen" title="مستخرج النص" type="success"
                             @click="extractText(scopeX.row)"/>
                </el-space>
              </template>
            </SkeletonValueComponents>

          </template>
        </el-table-column>
      </el-table>


    </el-card>
  </div>


  <el-dialog v-model="dialogFormVisible" width="80%" center :title="dialogID">
    <el-image :src="'data:image/png;base64,' +dialogImage" lazy/>
  </el-dialog>


</template>

<script setup lang="ts">

import {collect} from 'collect.js';
import {nextTick, onMounted, ref} from "vue";
// @ts-ignore
import MysqlAsyncClass from "@/assets/MysqlAsyncClass";
import ButtonConfirmWithTolltipComponents from "@/components/ButtonConfirmWithTolltipComponents.vue";
import moment from "moment";
import fs from "fs";
import path from "path";
import ProgressPercentage from "@components/progressPercentageComponents.vue";
import Compressor from "compressorjs";
import SkeletonValueComponents from "@components/SkeletonValueComponents.vue";
import { Loading, Search} from "@element-plus/icons-vue";

const {ipcRenderer} = require('electron');
const allDate = ref([]);
const isLoading = ref(false);
const isSearch = ref(false);
const fullscreenLoading = ref(false);
const totalPagention = ref(0);
const percintPagention = ref(50);
const curruntPagention = ref(1);
const countImages = ref(0);
const dialogFormVisible = ref(false);
const dialogImage = ref(null);
const dialogID = ref(null);
const pathDownload = ref(null);
const refTable = ref();
const multipleSelection = ref([]);
const mysqlClass = new MysqlAsyncClass();
const percentage = ref(0);
const apiUrl = ref("https://api.ocr.space/parse/image");
const apikey = ref("K83424083688957");
const language = ref("ara");
const detectOrientation = ref(true);
const searchValue = ref("");

onMounted(async () => {

  const configs = await mysqlClass.getConfig();
  apikey.value = collect(configs).filter((x: any) => x.key == 'api_key').first().value;

  await nextTick(async () => {
    await reloadAll();
  })


  ipcRenderer.on('update-data', async (event: any, arg: any) => {
    await reloadAll();
  });


});


async function loadData() {
  isLoading.value = true;
  const result = await mysqlClass.getImages(percintPagention.value, curruntPagention.value);
  console.log(result.data, ' result.data')
  allDate.value = result.data
  setTimeout(() => {
    isLoading.value = false;
  }, 500)

}


function blobToImage(blob: any) {
  return new Buffer(blob, 'binary').toString('base64');
}


async function deleteImageByID(d) {
  console.log(d);
  await mysqlClass.deleteImageByID(d);
  allDate.value = collect(allDate.value).where('id', '!=', d).all();
  countImages.value -= 1;
}


/**
 * change Page
 * @param val
 * @returns {Promise<void>}
 */
const changeCurrentChange = async (val) => {
  curruntPagention.value = val;
  await loadData();
}


function showImageDilog(id) {
  dialogImage.value = blobToImage(id.image)
  dialogID.value = id.id
  dialogFormVisible.value = true;
}

async function deleteAllImages() {
  isLoading.value = true;
  await mysqlClass.deleteAllImages();
  allDate.value = [];
  isLoading.value = false;
  totalPagention.value = 0;
  countImages.value = 0;
}

async function reloadAll() {
  const countPage = await mysqlClass.getImagesTotal();
  totalPagention.value = countPage.count;
  countImages.value = countPage.count;
  await loadData();
}


async function downloadImage(row) {

  pathDownload.value = await ipcRenderer.invoke('set-folder-pathe-to-save', null);

  let newPath = path.join(pathDownload.value, row.id + '.png');
  console.log(newPath)
  fs.writeFile(
      newPath,
      row.image,
      "base64",
      function (err, data) {
        if (err) {
          console.log("err", err);
        }
        console.log("success");
      }
  );
}

async function setFolderPathToSave() {
  let setPath = await ipcRenderer.invoke('set-folder-pathe-to-save', null);
  if (setPath) {
    saveSelectionImages(setPath);
    console.log(setPath)
  }

}

function saveSelectionImages(imagePath: any) {
  collect(multipleSelection.value).each((it) => {
    console.log(it)
    fs.writeFile(path.join(imagePath, it.id + '.png'), it.image, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('تم حفظ الصورة بنجاح');
        percentage.value++;
      }
    });
  })
}


function addSelctions(val: any) {
  multipleSelection.value = val
}


function extractTextSelectionImages() {
  percentage.value = 0;
  collect(multipleSelection.value).each((it) => {
    console.log(it)
    it.ocr_text = "معالجة ..... ";
    extractText(it);
  })
}

async function extractText(row: any) {
  // استرجاع الصورة من قاعدة البيانات
  const getDataFromDB = await mysqlClass.getImageByID(row.id);
  row.ocr_text = 'جاري المعالجة ....'
// التأكد من وجود الصورة
  if (getDataFromDB && getDataFromDB.image) {
    // تحويل الصورة إلى Blob
    const imageBlob = new Blob([getDataFromDB.image], {type: 'image/jpeg'});

    // استخدام Compressor.js لضغط الصورة
    new Compressor(imageBlob, {
      quality: 0.6,  // تحديد جودة الصورة المضغوطة (من 0 إلى 1)
      success: (compressedImage) => {
        const formData = new FormData();
        formData.append('image', compressedImage, 'image.jpg'); // إضافة الصورة المضغوطة
        formData.append('apikey', apikey.value);  // إضافة مفتاح الـ API
        formData.append('language', language.value);  // إضافة اللغة
        formData.append('detectOrientation', detectOrientation.value.toString());  // إضافة اتجاه الكشف
        // إرسال الصورة المضغوطة إلى الـ API
        fetch(apiUrl.value, {
          method: 'POST',
          body: formData,
        })
            .then(response => response.json())
            .then(data => {
              if (data.ParsedResults && data.ParsedResults.length > 0) {
                row.ocr_text = data.ParsedResults[0].ParsedText
                updateOcrText(row)
              } else {
                row.ocr_text = 'لم يتم العثور على نص.'

              }
            })
            .catch(error => {
              console.error('حدث خطأ:', error);
              row.ocr_text = 'حدث خطأ أثناء معالجة الصورة.'
            });
      },
      error: (err) => {
        console.log('حدث خطأ أثناء ضغط الصورة:', err);
        row.ocr_text = 'حدث خطأ أثناء ضغط الصورة:'
      }
    });
  } else {
    console.log('لم يتم العثور على الصورة في قاعدة البيانات.');
  }
  percentage.value++;

}


async function updateOcrText(row: any) {
  console.log(row)
  await mysqlClass.updateOcrText({ocr_text: row.ocr_text}, row.id);
}


function searchImage() {
  console.log(searchValue.value);
  if (searchValue.value === "") {
    reloadAll();
    return;
  }
  isSearch.value = true;
  isLoading.value = true;
  Object.assign(allDate.value, {})
  mysqlClass.searchImage(searchValue.value).then((result: any) => {
    console.log(result, ' result')
    allDate.value = result;
    countImages.value = result.length
    console.log(result, ' result');
    totalPagention.value = 0;
  }).catch((err) => {
    console.log(err)
  }).finally(() => {
    isSearch.value = false;
    isLoading.value = false;
  })

}
</script>


<style>
#spreadsheet tbody tr:nth-child(even) {
  background-color: #C9EEFF;
}


</style>
