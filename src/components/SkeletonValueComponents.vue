<template>
  <div>
    <el-skeleton
      v-if="isLoading"
      animated
      :rows="rows"
      :count="1"
    />
    <template v-else>
      <slot />
      <div>{{ value }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: string | number;
  isLoading: boolean;
  rows?: number;
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
  isLoading: true,
  rows: 0
})
</script>