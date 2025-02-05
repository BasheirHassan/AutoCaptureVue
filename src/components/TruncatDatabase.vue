<template xmlns="http://www.w3.org/1999/html">


  <div class="d-flex justify-content-md-center align-items-center vh-100">
    <el-card class="mt-5 w-100">
      <template #header>
        <div class="card-header">
          <span>مسح البيانات</span>
          <el-progress v-if="progress" :percentage="100" :indeterminate="true"/>
        </div>
      </template>

      <el-button class="m-lg-2" @click="trncatDB" type="danger">مسح كامل البيانات</el-button>

    </el-card>
  </div>

</template>

<script setup>
import {ref} from "vue";
import MysqlAsyncClass from "@assets/MysqlAsyncClass";
import {restartApp} from "@assets/ipcHandel";


const isLoading = ref(false);
const progress = ref(false);


async function trncatDB() {
  isLoading.value = true;
  progress.value = true;

  let mysqlAsyncClass = new MysqlAsyncClass();
  let truncate = await mysqlAsyncClass.trncatDB();
  console.log(truncate)
  isLoading.value = false;
  progress.value = false;
  await restartApp();
}


</script>
