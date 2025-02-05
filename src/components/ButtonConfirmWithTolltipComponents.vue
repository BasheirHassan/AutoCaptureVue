<template>
  <el-tooltip :content="tooltipTitle" placement="top">
  <div>
  <el-popconfirm
      width="220"
      confirm-button-text="نعم"
      cancel-button-text="لا"
      icon="InfoFilled"
      @confirm="confirmEmit"
      icon-color="#626AEF"
      :title="tooltipTitle"
  >
    <template #reference>
        <el-button  :type="buttonType" :icon="icon" circle/>
    </template>
  </el-popconfirm>
  </div>

  </el-tooltip>

</template>

<script setup lang="ts">

import { PropType } from 'vue'

 enum TypeButton{
  primary,
  success,
  warning,
  danger,
  info
}





const props = defineProps({
  tooltipTitle: {type: String, requires: false, default: null},
  icon: {type: String, requires: false, default: 'Delete'},
  buttonType: {type:String as PropType<keyof typeof TypeButton>, requires: false, default: 'danger'},
})

const emit = defineEmits(['confirm'])

const confirmEmit = () => {
  emit("confirm");
};
</script>

