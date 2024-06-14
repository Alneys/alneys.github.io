<script setup lang="ts"></script>

<template>
  <header id="layout-header">
    <div class="layout-max-width-container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
    </div>
  </header>
</template>

<style lang="scss" scoped>
#layout-header {
  position: sticky;
  top: 0;
  z-index: 1000000;
  background-color: var(--im-color-miya);
  > div {
    display: flex;
    justify-content: space-between;

    .title {
      color: white;
      text-decoration: none;
      h1 {
        line-height: 1.25;
        margin: 0;
      }
    }
  }
}
</style>
