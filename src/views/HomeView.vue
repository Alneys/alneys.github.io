<script setup lang="ts"></script>

<template>
  <div id="view-home">
    <div class="title">
      <h1>Alneys - GitHub Pages</h1>
      <div class="al-divider"></div>
      <p>At last nothing exists, you see.</p>
    </div>

    <div class="main">
      <!-- TODO: router-link -->
      <a href="/">
        <el-card shadow="hover">Under construction</el-card>
      </a>
      <a href="/">
        <el-card shadow="hover">Under construction</el-card>
      </a>
      <a href="/">
        <el-card shadow="hover">Under construction</el-card>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#view-home {
  > .title {
    text-align: center;
    margin-bottom: 32px;
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
