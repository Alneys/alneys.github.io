<script setup lang="ts"></script>

<template>
  <div id="view-home">
    <div class="title-block">
      <h1 class="view-title">Alneys - GitHub Pages</h1>
      <div class="al-divider"></div>
      <p>At last nothing exists, you see.</p>
    </div>

    <div class="main">
      <router-link to="/mltd/anniversary-calc">
        <el-card shadow="hover">偶像大师百万现场 周年活动计算器</el-card>
      </router-link>
      <router-link to="/mltd/event-parking">
        <el-card shadow="hover">偶像大师百万现场 活动控分计算器</el-card>
      </router-link>
      <router-link to="/gakuen-imas/rank-calc">
        <el-card shadow="hover">学园偶像大师 评级计算器</el-card>
      </router-link>
      <router-link to="/about">
        <el-card shadow="hover">关于</el-card>
      </router-link>
      <!-- <router-link to="/404test">
        <el-card shadow="hover">404 Page Test</el-card>
      </router-link> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
#view-home {
  > .title-block {
    margin-bottom: 32px;
    text-align: center;
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
  #view-home {
    > .main {
      grid-template-columns: 1fr;
    }
  }
}
</style>
