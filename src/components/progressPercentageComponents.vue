<template>
  <el-progress v-if="_percentage>0"
      :percentage="_percentage"
      :stroke-width="5"
      striped
      striped-flow
      :duration="10"
  />
</template>
<script setup lang="ts">

import {ref, watch} from "vue";

const _percentage = ref(0);

const props = defineProps({
  totalItems: {type: Number, requires: false, default: 0},
  percentage: {type: Number, requires: false, default: 0},
})


// watch(()=>props.totalItems, (val) => {
//   console.log('totalItems',val)
//   if (val) {
//     percentageCalc(val);
//   }
//
// }, {immediate: true})

watch(()=>props.percentage, (val) => {
  console.log('percentage',val)
  if (val) {
    percentageCalc(val);
  }

}, {immediate: true})

function percentageCalc(value:number) {
  console.log(props)
  _percentage.value = Math.round((100 * value) / props.totalItems);
  if (_percentage.value === 100) {
    setTimeout(() => {
      _percentage.value = 0;
    }, 3000);
  }
}


</script>


