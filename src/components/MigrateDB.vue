<template xmlns="http://www.w3.org/1999/html">


  <div class="d-flex justify-content-md-center align-items-center vh-100">
    <el-card class="mt-5 m-4 w-100" >
      <template #header>
        <div class="card-header">
          <span>تحديث قاعدة البيانات</span>
          <el-progress v-if="progress" :percentage="100"  :indeterminate="true" />
          <el-button class="m-lg-2" @click.once="migrateDB" type="success">تحديث</el-button>
        </div>
      </template>

      <el-space v-if="dbVersionOld">
        <el-tag type="warning">{{ dbVersionOld }}</el-tag>
        <el-tag> الاصدار الحالي</el-tag>
      </el-space>

      <el-space>
        <el-tag type="warning">{{ dbVersionNow }}</el-tag>
        <el-tag> الاصدار الجديد</el-tag>
        <el-tag v-if="errors" type="danger">{{ errors }}</el-tag>
      </el-space>
    </el-card>
  </div>
</template>

<script setup>
import {nextTick, onMounted, ref} from "vue";
import MigrateClass from "@assets/MigrateClass";
import {useRouter} from "vue-router";
import {postErrorLog} from "@assets/ipcHandel";


const dbVersionOld = ref(0);
const dbVersionNow = ref(0);
const isLoading = ref(false);
const progress = ref(false);
const errors = ref('');
const router = useRouter()


onMounted(async () => {


  await new MigrateClass().checkNeedUpdate().then(v => {
    dbVersionNow.value = v.versionNow;
    dbVersionOld.value = v.versionOld;
  })

})


async function migrateDB() {
  isLoading.value = true;
  progress.value = true;
  await new MigrateClass().checkFolderDBExists();

  await nextTick(async () => {
    let migrate = new MigrateClass();
    await migrate.migrate().then(async () => {
      console.log('don!')
      let up = migrate.updateVersion();
      isLoading.value = false;
      setTimeout(()=>{
        router.push('/')
      },2000)
    }).catch((err)=>{
      postErrorLog(err)
      errors.value = err
    }).finally(()=>{
        console.log('seed Ok!')
    });
  })


}




</script>
