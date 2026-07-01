<template>
  <div id="view-404">
    <div class="view-title">
      <h1>404 Not Found</h1>
    </div>
    <div class="al-divider"></div>
    <el-link @click="router.push('/')">Back to home</el-link>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style lang="scss" scoped></style>
