<script setup lang="ts"></script>

<template>
  <main id="layout-main">
    <div class="container">
      <div class="banner">
        <h1>Alneys - GitHub Pages</h1>
        <div class="divider"></div>
        <p>At last nothing exists, you see.</p>
      </div>
    </div>
  </main>
</template>

<style lang="scss">
#layout-main {
  > .container {
    padding: 16px 32px;
    .banner {
      text-align: center;
      h1 {
        font-size: 1.5em;
      }
      .divider {
        border-bottom: 2px solid var(--im-color-miya);
      }
    }
  }
}
</style>
