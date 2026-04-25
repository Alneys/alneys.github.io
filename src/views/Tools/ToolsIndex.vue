<script setup lang="ts"></script>

<template>
  <div id="view-tools">
    <h1 class="view-title">开发者工具</h1>
    <div class="al-divider"></div>
    <div class="main">
      <router-link to="/tools/password-generator">
        <el-card shadow="hover">随机密码生成器</el-card>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#view-tools {
  > .main {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    a {
      text-decoration: none;
    }
  }
}

@media screen and (max-width: 991px) {
  #view-tools {
    > .main {
      grid-template-columns: 1fr;
    }
  }
}
</style>
