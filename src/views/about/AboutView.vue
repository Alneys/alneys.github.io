<script setup lang="ts">
import { fa } from 'element-plus/es/locale/index.mjs';
</script>

<template>
  <div>
    <h1 class="view-title">关于</h1>
    <div class="al-divider"></div>
    <h2>Alneys</h2>
    <div class="shields-io-collections">
      <a href="https://github.com/Alneys" target="_blank">
        <img src="https://img.shields.io/badge/Alneys-181717?style=flat-square&logo=github" />
      </a>
      <a href="https://x.com/Alneys_Al" target="_blank">
        <img src="https://img.shields.io/badge/Alneys__Al-000000?style=flat-square&logo=x" />
      </a>
      <a href="https://space.bilibili.com/13775737" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys-00A1D6?style=flat-square&logo=bilibili&labelColor=555"
        />
      </a>
      <a href="https://weibo.com/u/2794029901" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys__Al-E6162D?style=flat-square&logo=sinaweibo"
        />
      </a>
      <a href="https://github.com/Alneys/alneys.github.io" target="_blank">
        <img
          src="https://img.shields.io/badge/alneys.github.io-222222?style=flat-square&logo=githubpages"
        />
      </a>
    </div>
    <div v-show="false">
      <p>
        <el-link type="default" href="https://github.com/Alneys" target="_blank">
          GitHub @Alneys
        </el-link>
      </p>
      <p>
        <el-link type="default" href="https://twitter.com/Alneys_Al" target="_blank">
          X / Twitter @Alneys_Al
        </el-link>
      </p>
      <p>
        <el-link type="default" href="https://space.bilibili.com/13775737" target="_blank">
          BiliBili @Alneys
        </el-link>
      </p>
      <p>
        <el-link type="default" href="https://weibo.com/u/2794029901" target="_blank">
          Weibo @Alneys_Al
        </el-link>
      </p>
    </div>

    <div class="al-divider"></div>
    <h3>开发环境与工具</h3>
    <div class="shields-io-collections">
      <a href="https://vuejs.org" target="_blank">
        <img
          src="https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&labelColor=555&logo=vuedotjs"
        />
      </a>
      <a href="https://element-plus.org/" target="_blank">
        <img src="https://img.shields.io/badge/Element_Plus-409EFF?style=flat-square" />
      </a>
      <a href="https://www.mozilla.org/firefox/new/" target="_blank">
        <img
          src="https://img.shields.io/badge/FireFox-FF7139?style=flat-square&labelColor=555&logo=firefoxbrowser"
        />
      </a>
      <a href="https://pages.github.com/" target="_blank">
        <img
          src="https://img.shields.io/badge/GitHub Pages-222222?style=flat-square&labelColor=555&logo=githubpages"
        />
      </a>
    </div>

    <div class="al-divider"></div>
    <h3>可能的开发计划（？）</h3>
    <p>偶像大师百万现场 周年计算器</p>
    <p>偶像大师百万现场 活动控分计算器</p>
  </div>
</template>

<style lang="scss" scoped>
.shields-io-collections {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  img {
    height: 24px;
  }
}
</style>
