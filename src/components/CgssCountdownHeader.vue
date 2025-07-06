<template>
  <div class="cgss-countdown" @click="handleCgssCountdownClick">
    <div class="cgss-countdown-container">
      <div>
        <span>距离《偶像大师灰姑娘 星光舞台》10周年剩余时间：</span>
        <el-countdown format="DD天HH:mm:ss" :value="cgss10thAnniversaryTime"></el-countdown>
      </div>
      <div>
        <span>距离《偶像大师灰姑娘 星光舞台》翻唱曲下线剩余时间：</span>
        <el-countdown format="DD天HH:mm:ss" :value="coverSongOfflineTime"></el-countdown>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const coverSongOfflineTime = new Date('2025-08-31T23:00:00+08:00').getTime();
const cgss10thAnniversaryTime = new Date('2025-09-03T23:00:00+08:00').getTime();

function handleCgssCountdownClick() {
  window.open('https://x.com/imascg_stage/status/1940289454801027512', '_blank');
}
</script>

<style lang="scss" scoped>
.cgss-countdown {
  cursor: pointer;
  background-color: #2581c7;

  .cgss-countdown-container {
    padding: 0.5em;
    width: 100%;
    text-align: center;

    > div {
      padding: 0.25em 0;
    }

    * {
      color: white;
      font-size: var(--el-font-size-base);
    }
  }

  :deep(.el-statistic) {
    display: inline-block;
  }
}
</style>
