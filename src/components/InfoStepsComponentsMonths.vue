<template>
  <div class="container-fluid" dir="ltr">
    <div class="row pb-3">
      <div class="col">
        <el-steps :active="active" align-center finish-status="success">
          <template v-for="item in itemSteps">
            <el-step :title="item.ID" process-status="error" :description="item.desc" :icon="item.icon"/>
          </template>
        </el-steps>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

import {reactive, onMounted, watch, ref,nextTick} from 'vue';
import {collect} from 'collect.js';
import {findIndexOfObject} from "@assets/Helpers";

const active = ref(2)


const props = defineProps({
  dataStep: {type: Object, requires: false, default: null},
})

watch(props.dataStep, (newValue) => {
  if (newValue) {
    initStep(newValue)
  }
}, {immediate: false})


const itemSteps = reactive([]);

onMounted(() => {
  const countMonth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  collect(countMonth).each(item => {
    // console.log(item)
    itemSteps.push({ID: item, icon: 'Loading'})
  })

})

function initStep(items: any) {
  collect(items).each(async item => {

    await nextTick(() => {
      let getIndex = findIndexOfObject(itemSteps, 'ID', item.ID)
      // console.log(getIndex, 'getIndex')
      itemSteps[getIndex].value = item.ID
      itemSteps[getIndex].desc = item.desc
      active.value = getIndex
      if (item.value) {
        itemSteps[getIndex].icon = 'SuccessFilled'
      } else {
        itemSteps[getIndex].icon = 'Loading'
      }
    })


  })

}


</script>

