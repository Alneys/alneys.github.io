<script setup lang="ts"></script>

<template>
  <header id="layout-header">
    <div class="container">
      <a href="/" class="title"> Alneys.github.io </a>
    </div>
  </header>
</template>

<style lang="scss">
#layout-header {
  background-color: var(--im-color-miya);
  > .container {
    display: flex;
    justify-content: space-between;
    padding: 16px 32px;

    .title {
      color: white;
      font-weight: bold;
      font-size: 1.5em;
      text-decoration: none;
    }
  }
}
</style>
