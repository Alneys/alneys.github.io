<script setup lang="ts"></script>

<template>
  <div id="view-home">
    <div class="title">
      <h1>Alneys - GitHub Pages</h1>
      <div class="al-divider"></div>
      <p>At last nothing exists, you see.</p>
    </div>

    <div class="main">
      <router-link to="/">
        <el-card shadow="hover">Under construction</el-card>
      </router-link>
      <router-link to="/">
        <el-card shadow="hover">Under construction</el-card>
      </router-link>
      <router-link to="/">
        <el-card shadow="hover">Under construction</el-card>
      </router-link>
    </div>
  </div>
</template>

<style lang="scss" scoped>
#view-home {
  > .title {
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

@media screen and (max-width: 767px) {
  #view-home {
    > .title > h1 {
      margin-top: 0;
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
