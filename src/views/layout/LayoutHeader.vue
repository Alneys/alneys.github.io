<script setup lang="ts"></script>

<template>
  <header id="layout-header">
    <div class="container">
      <router-link to="/" class="title"><h1>Alneys.github.io</h1></router-link>
    </div>
  </header>
</template>

<style lang="scss" scoped>
#layout-header {
  background-color: var(--im-color-miya);
  > .container {
    display: flex;
    justify-content: space-between;

    .title {
      color: white;
      text-decoration: none;
      h1 {
        margin: 0;
      }
    }
  }
}
</style>
