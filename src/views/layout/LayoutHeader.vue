<script setup lang="ts"></script>

<template>
  <header id="layout-header">
    <div class="container">
      <a href="/" class="title"> Alneys.github.io </a>
    </div>
  </header>
</template>

<style lang="scss" scoped>
#layout-header {
  background-color: var(--im-color-miya);
  > .container {
    display: flex;
    justify-content: space-between;
    margin: 0 auto;
    padding: 16px 32px;
    max-width: 1864px;

    .title {
      color: white;
      font-weight: bold;
      font-size: 1.5em;
      text-decoration: none;
    }
  }
}
</style>
