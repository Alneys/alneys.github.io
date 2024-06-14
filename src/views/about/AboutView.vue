<script setup lang="ts">
import { ref } from 'vue';
const count = ref(0);

function increment() {
  count.value++;
}
</script>

<template>
  <div>
    <h1 class="view-title">关于</h1>
    <div class="al-divider"></div>
    <h2>Alneys</h2>
    <p>
      <el-link type="" href="https://github.com/Alneys" target="_blank"> GitHub @Alneys </el-link>
    </p>
    <p>
      <el-link type="" href="https://twitter.com/Alneys_Al" target="_blank">
        X / Twitter @Alneys_Al
      </el-link>
    </p>
  </div>
</template>

<style lang="scss" scoped></style>
