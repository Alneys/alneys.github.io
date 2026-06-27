<template>
  <div id="view-endfield-trial-of-swordmancy">
    <div class="view-title-row">
      <h1 class="view-title">Endfield Trial Of Swordmancy</h1>
      <a href="https://space.bilibili.com/13775737" target="_blank">
        <img
          src="https://img.shields.io/badge/Alneys-00A1D6?style=flat-square&logo=bilibili&labelColor=eee"
          alt="BiliBili"
          style="height: 20px"
        />
      </a>
      <el-button class="view-tour-btn" :size="compSize" @click="tourOpen = true">
        页面引导
      </el-button>
    </div>
    <div class="al-divider"></div>

    <el-row :gutter="16">
      <el-col :span="24" :lg="15" :xs="24">
        <ConfigPanel />
        <div class="al-divider hidden-xs-only"></div>
        <GamePanel />
      </el-col>

      <div class="al-divider hidden-xs-only hidden-lg-and-up" style="width: 100%"></div>

      <el-col :span="24" :lg="9" :xs="24">
        <AnalysisPanel />
      </el-col>
    </el-row>
  </div>

  <el-tour v-model="tourOpen">
    <el-tour-step
      target="[data-tour='daily']"
      title="今日状态"
      description="操作前，先管理今日铭牌库分布，剩余结算/翻倍/放弃次数，以获得正确结果，点击「设为单次模拟」快速测试单局情况"
    />
    <el-tour-step
      target="[data-tour='game-state']"
      title="当前游戏状态"
      description="已抽铭牌、铭牌库、奖励状态"
    />
    <el-tour-step
      target="[data-tour='manual-input']"
      title="手动设置铭牌点数"
      description="可通过输入框手动设置已抽铭牌的点数，方便模拟指定情况"
    />
    <el-tour-step
      target="[data-tour='pool']"
      title="铭牌库模拟抽取"
      description="点击铭牌库中的等级可直接模拟抽取对应铭牌"
    />
    <el-tour-step
      target="[data-tour='actions']"
      title="操作按钮"
      description="核心操作区：抽取铭牌、开启翻倍、放弃本局、结算进入下一局、重置今日状态"
    />
    <el-tour-step
      target="[data-tour='result']"
      title="策略分析"
      description="基于动态规划求解器的行动建议，高亮最优行动，对比原始期望与期望效用模型期望，并且显示本局最优行动的战力点概率分布表"
      :scroll-into-view-options="{ block: isMobile ? 'start' : 'end' }"
    />
    <el-tour-step
      target="[data-tour='expected-utility']"
      title="期望效用模型"
      description="通过溢出接受值和固定心理落差微调策略决策，预设方案可快速切换"
    />
    <el-tour-step
      target="[data-tour='config']"
      title="基础参数配置"
      description="调整基础参数，铭牌库配置和奖励对照表"
    />
  </el-tour>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

import { useResponsive } from '@/composables/useResponsive';

import AnalysisPanel from './AnalysisPanel.vue';
import ConfigPanel from './ConfigPanel.vue';
import GamePanel from './GamePanel.vue';

const { isMobile } = useResponsive();
const compSize = computed(() => (isMobile.value ? 'small' : 'default'));
const tourOpen = ref(false);
</script>

<style lang="scss" scoped>
#view-endfield-trial-of-swordmancy {
  .view-title-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  .view-title {
    flex: 1;
  }

  .view-tour-btn {
    flex-shrink: 0;
  }

  // ── 响应式：小屏幕 ──
  @media (max-width: 767px) {
    .view-title-row {
      // Ensure proper spacing on mobile
    }
  }
}
</style>
