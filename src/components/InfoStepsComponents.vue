<template>
  <div class="container-fluid" dir="ltr">
    <div class="row pb-3">
      <div class="col">
        <el-steps :active="active" align-center finish-status="success">
          <template v-for="(item, index) in itemSteps">
            <el-step    :title="item.title || item.ID "  :status='statUsElSteps[item.ID]?.status' :is-loading="true" :icon="statUsElSteps[item.ID]?.icon || 'Loading' "/>
          </template>
        </el-steps>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">


import {reactive, ref, toRaw, onMounted, watch, nextTick} from 'vue';
import { collect } from 'collect.js';



const props = defineProps({
  dataStep: {type: Object, requires: false, default: null},
})

watch(props.dataStep, (newValue) => {
  if (newValue) {
    toRaw(newValue).forEach((element:any) => {
      // console.log(element.numberID,'newValue.month');
      statUsElSteps[element.numberID] = {"status": "success", "icon": "SuccessFilled"}
    });
  }

}, {immediate: true})

    const statUsElSteps = reactive([]);
    const active = ref(0);
    const itemSteps = ref<Object>(0);

    onMounted(() => {
      const countMonth = 12;

      nextTick(() => {
        itemSteps.value = creatArrayByTotal(countMonth).map(item=>{
          return {ID:item,status:"success"}
        });

      });
    })

    function Loading() {
      return Loading
    }

    function Upload() {
      return Upload
    }

    function isSetInData(k) {
      let keys = toRaw(props.dataStep);
      let getX = collect(keys).where('month', k.toString());
      if (getX.count() > 0) {
        return 'error'
      } else {
        return 'success'
      }
    }

    function creatArrayByTotal(t) {
      let item = [];
      for (let i = 0; i < t; i++) {
        item.push(i + 1)
      }
      return collect(item);
    }






</script>

