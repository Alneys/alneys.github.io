<template>
  <div id="view-tools">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>开发者工具</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>
    <div class="main">
      <router-link to="/tools/password-generator">
        <el-card shadow="hover">随机密码生成器</el-card>
      </router-link>
      <router-link to="/tools/uuid-generator">
        <el-card shadow="hover">UUID 生成器</el-card>
      </router-link>
      <router-link to="/tools/hash-calculator">
        <el-card shadow="hover">哈希值计算器</el-card>
      </router-link>
      <router-link to="/tools/hmac-calculator">
        <el-card shadow="hover">HMAC 消息验证码计算器</el-card>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
#view-tools {
  .el-breadcrumb {
    margin-top: 0.5em;
  }

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
