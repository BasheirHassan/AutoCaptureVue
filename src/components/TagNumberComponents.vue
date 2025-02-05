<template>

    <el-tooltip v-if="show" class="box-item"
                effect="light"
                :visible="visible"
                :content="props.tooltip + (props.tooltip?' - ' :'') +toArabicWord(parseNumber(value))   "
                placement="top-start">
      <el-space>
        <el-text>{{ label }}</el-text>
        <el-tag v-if="isAutoCounter" :effect="effect" :type="parseNumber(value)>0?'success' : 'danger'" @mouseenter="visible = true"
                @mouseleave="visible = false">
          <count-up ref="countupRef" :end-val="value"></count-up>
        </el-tag>


         <el-tag v-else :effect="effect" :type="parseNumber(value)>0?'success' : 'danger'" @mouseenter="visible = true"
                @mouseleave="visible = false">
              {{value}}
        </el-tag>

      </el-space>


    </el-tooltip>
</template>
<script setup lang="ts">
//@ts-ignore
import {parseNumber} from "@assets/Helpers";
import CountUp from "vue-countup-v3";
import {nextTick, onMounted, PropType, ref} from "vue";
//@ts-ignore
import {toArabicWord} from "number-to-arabic-words/dist/index-node.js";

enum effectTag {
  dark,
  light,
  plain,
}


const props = defineProps({
  value: {type: Number || String, requires: true, default: 0},
  mantissa: {type: Number, requires: false, default: 2},
  effect: {type: String as PropType<keyof typeof effectTag>, requires: false, default: 2},
  show: {type: Boolean, requires: false, default: false},
  tooltip: {type: String, requires: false, default: ""},
  label: {type: String, requires: false, default: ""},
  isAutoCounter: {type: Boolean, requires: false, default: true},
})






const countupRef = ref(null)
const showSkletion = ref(true);
const visible = ref(false)


onMounted(() => {
  nextTick(() => {
    showSkletion.value = false
    countupRef.value?.restart();
  })
})


</script>
