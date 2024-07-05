<script setup lang="ts"></script>

<template>
  <div>
    <h1 class="view-title">关于</h1>
    <div class="al-divider"></div>
    <h2>Alneys</h2>
    <div class="shields-io-collections">
      <a href="https://github.com/Alneys" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys-181717?style=flat-square&logo=github"
          alt="GitHub"
        />
      </a>
      <a href="https://x.com/Alneys_Al" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys__Al-000000?style=flat-square&logo=x"
          alt="X / twitter"
        />
      </a>
      <a href="https://space.bilibili.com/13775737" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys-00A1D6?style=flat-square&logo=bilibili&labelColor=eee"
          alt="BiliBili"
        />
      </a>
      <a href="https://weibo.com/u/2794029901" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys__Al-E6162D?style=flat-square&logo=sinaweibo"
          alt="Weibo"
        />
      </a>
      <a href="https://steamcommunity.com/id/Alneys_Al/" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys__Al-000000?style=flat-square&logo=steam"
          alt="Steam"
        />
      </a>
    </div>
    <div v-if="false">
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
    <h3>开发环境/工具</h3>
    <div class="shields-io-collections">
      <a href="https://vuejs.org" target="_blank">
        <img
          src="https://img.shields.io/badge/Vue.js-4FC08D?style=flat-square&labelColor=555&logo=vuedotjs"
          alt="Vue.js"
        />
      </a>
      <a href="https://element-plus.org/" target="_blank">
        <img
          src="https://img.shields.io/badge/Element_Plus-409EFF?style=flat-square&labelColor=eee&logo=data:image/svg+xml;base64,PHN2ZyBpZD0i5Zu+5bGCXzEiIGRhdGEtbmFtZT0i5Zu+5bGCIDEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDQ0IDQ0Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6IzQwOWVmZjtmaWxsLXJ1bGU6ZXZlbm9kZDt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPmVsZW1lbnQgcGx1cy1sb2dvLXNtYWxsIOWJr+acrDwvdGl0bGU+PHBhdGggaWQ9ImVsZW1lbnRfcGx1cy1sb2dvLXNtYWxsIiBkYXRhLW5hbWU9ImVsZW1lbnQgcGx1cy1sb2dvLXNtYWxsIiBjbGFzcz0iY2xzLTEiIGQ9Ik0zNy40MSwzMi4zN2MwLDEuNTctLjgzLDEuOTMtLjgzLDEuOTNMMjEuNTEsNDNBMS42OSwxLjY5LDAsMCwxLDIwLDQzUzUuMiwzNC40LDQuNjYsMzRhMS4yOSwxLjI5LDAsMCwxLS41NS0xVjE1LjI0YzAtLjc4LDEtMS4zMywxLTEuMzNMMTkuODYsNS4zNmEyLDIsMCwwLDEsMS43OSwwbDE0LjQ2LDguNDFhMi4wNiwyLjA2LDAsMCwxLDEuMjUsMi4wNlYzMi4zN1ptLTUuOS0xN0wyMS4zNSw5LjVhMS41OSwxLjU5LDAsMCwwLTEuNDEsMEw4LjMzLDE2LjE1cy0uNzcuNDYtLjc2LDEuMDgsMCwxMy45MiwwLDEzLjkyQTEsMSwwLDAsMCw4LDMxLjljLjQzLjMsMTIsNywxMiw3YTEuMzEsMS4zMSwwLDAsMCwxLjE5LDBDMjEuOTEsMzguNSwzMywzMi4xMSwzMywzMi4xMXMuNjUtLjI4LjY1LTEuNTFWMjcuMTNsLTEzLDcuOVYzMmEzLjA1LDMuMDUsMCwwLDEsMS0yLjA3TDMzLjIsMjNhMi40NCwyLjQ0LDAsMCwwLC41NS0xLjQ2VjE4LjQzTDIwLjY0LDI2LjM1di0zLjJhMi4yMiwyLjIyLDAsMCwxLC44My0xLjc5Wk00MS4wNyw0LjIyYS4zOS4zOSwwLDAsMC0uMzctLjQySDM4VjEuMDZjMC0uMTYtLjI2LS4yMi0uNTMtLjIyTDM2LDEuMDhjLS4xOCwwLS4zMS4xMi0uMzEuMjNWMy44SDMzYS40LjQsMCwwLDAtLjM2LjM3djJoM1Y5YzAsLjE2LjI2LjI3LjU0LjIzbDEuNTEtLjI1Yy4xOCwwLC4yOS0uMTMuMjktLjIzVjYuMTRoM1oiLz48L3N2Zz4="
          alt="Element Plus"
        />
      </a>
      <a href="https://www.mozilla.org/firefox/new/" target="_blank">
        <img
          src="https://img.shields.io/badge/FireFox-FF7139?style=flat-square&labelColor=eee&logo=firefoxbrowser"
          alt="FireFox"
        />
      </a>
      <a href="https://pages.github.com/" target="_blank">
        <img
          src="https://img.shields.io/badge/GitHub Pages-222222?style=flat-square&labelColor=555&logo=githubpages"
          alt="GitHub Pages"
        />
      </a>
    </div>

    <p style="word-break: break-all">
      <span>项目地址：</span>
      <el-link href="https://github.com/Alneys/alneys.github.io" target="_blank">
        https://github.com/Alneys/alneys.github.io
      </el-link>
    </p>
    <div class="shields-io-collections">
      <img
        src="https://img.shields.io/github/last-commit/Alneys/alneys.github.io/main?style=flat-square"
        alt="Last commit"
      />
      <img
        src="https://img.shields.io/github/commits-difference/Alneys/alneys.github.io?base=main&head=dev"
        alt="GitHub commits difference between two branches/tags/commits"
      />

      <img
        src="https://img.shields.io/github/actions/workflow/status/Alneys/alneys.github.io/vite-gh-pages.yml?style=flat-square"
        alt="Workflow Status"
      />
    </div>

    <div class="al-divider"></div>
    <h3>已知问题</h3>
    <div class="list-p">
      <li>
        在input[type=number]输入框强行输入非数值时，点击清空按钮无法清空输入框：这是v-model.number与input[type=number]共同作用的结果。
      </li>
    </div>

    <div class="al-divider"></div>
    <h3>可能的开发计划（？）</h3>
    <div class="list-p">
      <li>偶像大师百万现场现场 周年活动计算器</li>
      <li>偶像大师百万现场现场 活动控分计算器</li>
      <li>自行开发的tampermonkey脚本列表</li>
      <li>常用网站列表</li>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.el-link {
  vertical-align: inherit;
}
.shields-io-collections {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
img[src^="https://img.shields.io"]
{
  height: 24px;
  vertical-align: text-bottom;
}
.list-p {
  li {
    margin-block: 1em;
  }
}
</style>
