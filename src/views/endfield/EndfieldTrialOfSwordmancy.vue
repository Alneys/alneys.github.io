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
        <el-collapse
          v-model="activeCollapse"
          class="config-panel"
          style="--el-collapse-header-font-size: 16px"
          data-tour="config"
        >
          <el-collapse-item title="基础参数配置" name="config">
            <div class="config-reward-section">
              <div class="config-reward-header">铭牌库配置</div>
              <div v-if="poolQuickConfigMode" class="config-otp-row">
                <span class="config-label">铭牌库分布</span>
                <el-input-otp
                  v-model="otpConfigValue"
                  :length="5"
                  inputmode="numeric"
                  :validator="onlyConfigDigit"
                />
              </div>
              <div v-else class="config-grid">
                <div v-for="level in 5" :key="level" class="config-item">
                  <span class="config-label">点数 {{ level }}</span>
                  <el-input
                    v-model.number="config[`level${level}` as keyof PlaqueConfig]"
                    :size="compSize"
                    type="number"
                    :min="0"
                    :max="99"
                  />
                </div>
              </div>
              <div class="config-buttons">
                <el-button :size="compSize" type="primary" @click="toggleQuickMode">
                  {{ '快速输入：' + (poolQuickConfigMode ? '开' : '关') }}
                </el-button>
                <el-button class="config-reset-btn" :size="compSize" @click="resetConfig">
                  重置铭牌库
                </el-button>
              </div>
            </div>

            <el-divider style="margin: 8px 0" />
            <div class="config-reward-section">
              <div class="config-reward-header">奖励对照表</div>
              <div class="config-reward-hint">JSON 数组格式，战力点 0~10 依次对应 11 项奖励值</div>
              <el-input
                v-model="rewardTableText"
                :size="compSize"
                type="textarea"
                :rows="6"
                class="config-reward-textarea"
              />
              <div v-if="rewardTableError" class="config-reward-error">{{ rewardTableError }}</div>
              <div class="config-reward-buttons">
                <el-button :size="compSize" type="primary" @click="applyRewardTable"
                  >应用奖励表</el-button
                >
                <el-button :size="compSize" @click="resetRewardTable">重置奖励表</el-button>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>

        <el-row :gutter="16" class="game-section">
          <el-col :span="24">
            <el-card class="expected-utility-card" data-tour="expected-utility">
              <template #header>
                <span>期望效用模型</span>
              </template>
              <div class="expected-utility-body">
                <el-alert type="info" :closable="false" show-icon>
                  基于期望效用理论设计，调整公式：奖励 × 溢出接受值<sup>k</sup> − k ×
                  固定心理落差（k = 总战力 ÷ 11，向下取整），可为负
                </el-alert>
                <div class="expected-utility-grid">
                  <div class="expected-utility-item">
                    <span class="expected-utility-label">溢出接受值</span>
                    <el-slider
                      v-model="aversionFactor"
                      :size="compSize"
                      :min="0"
                      :max="1"
                      :step="0.05"
                      show-input
                      class="expected-utility-slider"
                    />
                  </div>
                  <div class="expected-utility-item">
                    <span class="expected-utility-label">固定心理落差</span>
                    <el-input-number
                      v-model="fixedPenalty"
                      :size="compSize"
                      :min="0"
                      :max="1000000"
                      :step="5000"
                      class="expected-utility-input"
                    />
                  </div>
                </div>
                <div class="expected-utility-presets">
                  <el-button
                    :size="compSize"
                    :type="isPresetActive(1.0, 0) ? 'primary' : ''"
                    @click="setEuParams(1.0, 0)"
                  >
                    最大化收益
                  </el-button>
                  <el-button
                    :size="compSize"
                    :type="isPresetActive(0.5, 30000) ? 'primary' : ''"
                    @click="setEuParams(0.5, 30000)"
                  >
                    均衡
                  </el-button>
                  <el-button
                    :size="compSize"
                    :type="isPresetActive(0.01, 0) ? 'primary' : ''"
                    @click="setEuParams(0.01, 0)"
                  >
                    厌恶溢出
                  </el-button>
                  <el-button
                    :size="compSize"
                    :type="isPresetActive(0.01, 400000) ? 'primary' : ''"
                    @click="setEuParams(0.01, 400000)"
                  >
                    禁止溢出
                  </el-button>
                </div>
              </div>
            </el-card>
          </el-col>

          <el-col :span="24">
            <el-card class="daily-card" data-tour="daily">
              <template #header>
                <span>今日状态</span>
              </template>
              <div class="daily-grid">
                <div v-if="poolQuickConfigMode" class="config-otp-row">
                  <span class="daily-label">铭牌库分布</span>
                  <el-input-otp
                    v-model="otpConfigValue"
                    :length="5"
                    inputmode="numeric"
                    :validator="onlyConfigDigit"
                  />
                </div>
                <div v-else class="config-grid">
                  <div v-for="level in 5" :key="level" class="config-item">
                    <span class="daily-label">点数 {{ level }}</span>
                    <el-input
                      v-model.number="config[`level${level}` as keyof PlaqueConfig]"
                      :size="compSize"
                      type="number"
                      :min="0"
                      :max="99"
                    />
                  </div>
                </div>
                <div class="config-buttons">
                  <el-button :size="compSize" type="primary" @click="toggleQuickMode">
                    {{ '快速输入：' + (poolQuickConfigMode ? '开' : '关') }}
                  </el-button>
                </div>
                <el-divider style="margin: 4px 0" />
                <div class="daily-item">
                  <span class="daily-label">剩余游玩</span>
                  <el-input-number
                    v-model="remainingGames"
                    :size="compSize"
                    :min="0"
                    :max="4"
                    class="daily-input"
                  />
                </div>
                <div class="daily-item">
                  <span class="daily-label">剩余翻倍</span>
                  <el-input-number
                    v-model="remainingDoubles"
                    :size="compSize"
                    :min="0"
                    :max="2"
                    class="daily-input"
                  />
                </div>
                <div class="daily-item">
                  <span class="daily-label">剩余放弃</span>
                  <el-input-number
                    v-model="remainingAbandons"
                    :size="compSize"
                    :min="0"
                    :max="3"
                    class="daily-input"
                  />
                </div>
                <el-button class="daily-single-btn" :size="compSize" @click="setSingleSimulation">
                  模拟单次
                </el-button>
                <el-button
                  class="daily-reset-btn"
                  :size="compSize"
                  type="danger"
                  @click="resetToday"
                >
                  重置
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div class="al-divider hidden-xs-only"></div>

        <div data-tour="game-state">
          <el-row :gutter="16" class="game-section">
            <el-col :span="18" :xs="24">
              <el-card class="drawn-card">
                <template #header>
                  <span>已抽铭牌</span>
                </template>
                <div class="drawn-slots hidden-xs-only">
                  <div
                    v-for="slotIndex in MAX_DRAWS"
                    :key="slotIndex"
                    class="drawn-slot"
                    :class="{
                      filled: drawnCards[slotIndex - 1] != null,
                      'drawn-slot-warning': hasWarning && drawnCards[slotIndex - 1] != null,
                    }"
                  >
                    <div v-if="drawnCards[slotIndex - 1]" class="drawn-slot-inner">
                      <span class="drawn-slot-lv">Lv</span>
                      <span class="drawn-slot-num">{{ drawnCards[slotIndex - 1]?.level }}</span>
                    </div>
                    <div v-else class="drawn-slot-inner">
                      <span class="drawn-slot-lv">Lv</span>
                      <span class="drawn-slot-q">?</span>
                    </div>
                  </div>
                </div>
                <el-divider class="hidden-xs-only" style="margin: 16px 0" />
                <div class="drawn-manual-input" data-tour="manual-input">
                  <div class="drawn-manual-left">
                    <div class="drawn-manual-label hidden-xs-only">手动设置铭牌点数</div>
                    <el-input-otp
                      v-model="otpValue"
                      :length="5"
                      inputmode="numeric"
                      :validator="onlyLevel"
                      @update:model-value="handleOtpChange"
                    />
                  </div>
                  <el-button class="drawn-undo-btn" :size="compSize" @click="undoLastDraw">
                    撤销
                  </el-button>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6" :xs="24"
              ><el-card class="pool-card" data-tour="pool">
                <template #header>
                  <span>铭牌库剩余 {{ pool.length }} 张（点击可抽取）</span>
                </template>
                <div class="pool-list">
                  <div
                    v-for="level in 5"
                    :key="level"
                    class="pool-level-row"
                    :class="{ 'pool-level-clickable': getPoolCount(level) > 0 }"
                    :style="getPoolCount(level) > 0 ? 'cursor: pointer' : 'cursor:not-allowed'"
                    @click="simulateDrawFromPool(level)"
                  >
                    <span class="pool-level-label">Lv.{{ level }}</span>
                    <span class="pool-level-count">{{ getPoolCount(level) }} 张</span>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="game-section">
            <el-col :span="24">
              <el-card class="reward-card">
                <template #header>
                  <span>奖励状态</span>
                </template>
                <div class="reward-point-section" :class="{ 'reward-penalty': totalPower > 10 }">
                  <span class="reward-label">战力点</span>
                  <el-segmented
                    v-model="rewardIndex"
                    :size="compSize"
                    :options="powerPointOptions"
                    block
                    :class="{
                      'reward-penalty': totalPower > 10,
                      'reward-success': rewardIndex === 10,
                    }"
                  />
                  <span class="reward-xs-value hidden-sm-and-up">{{ rewardIndex }}</span>
                </div>
                <div class="reward-tier-section" :class="{ 'reward-penalty': totalPower > 10 }">
                  <span class="reward-label">奖励</span>
                  <el-segmented
                    v-model="rewardIndex"
                    :size="compSize"
                    :options="rewardOptions"
                    block
                    :class="{
                      'reward-penalty': totalPower > 10,
                      'reward-success': rewardIndex === 10,
                    }"
                  />
                  <span class="reward-xs-value hidden-sm-and-up">{{
                    formatRewardShort(finalReward)
                  }}</span>
                </div>
                <div
                  class="reward-eu-section"
                  :class="{
                    'reward-eu-disabled': !showEuColumn,
                    'reward-penalty': showEuColumn && totalPower > 10,
                  }"
                >
                  <span class="reward-label">溢出期望效用</span>
                  <el-segmented
                    v-model="euSelectedValue"
                    :size="compSize"
                    :options="euOptions"
                    :disabled="!showEuColumn"
                    block
                    class="reward-eu-segmented"
                  />
                  <span class="reward-xs-value hidden-sm-and-up">{{ euDisplayValue }}</span>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="16" class="game-section" data-tour="actions">
          <el-col :span="24">
            <div class="action-row">
              <div class="action-row-left">
                <el-popconfirm
                  title="确认重置游戏状态和今日状态？"
                  placement="bottom-end"
                  width="200px"
                  @confirm="resetToday"
                >
                  <template #reference>
                    <el-button :size="compSize" type="danger" class="action-btn">
                      重置所有
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
              <div class="action-row-right">
                <el-button
                  class="action-btn"
                  :size="compSize"
                  :disabled="!canDraw || remainingGames === 0 || hasWarning"
                  type="primary"
                  @click="drawCard"
                >
                  抽取铭牌
                </el-button>
              </div>
            </div>
          </el-col>

          <el-col :span="24" class="hidden-sm-and-up">
            <div class="action-row-center">
              <div class="action-switch-group">
                <span class="action-switch-label"
                  ><span class="action-switch-remaining">（剩余{{ remainingDoubles }}次）</span
                  ><span class="action-switch-warning">奖励翻倍</span></span
                >
                <el-switch
                  v-model="doubled"
                  :size="compSize"
                  :disabled="!canToggleDouble || hasWarning"
                  inactive-text="关"
                  active-text="开"
                  class="action-switch"
                  @change="handleDoubleSwitch"
                />
              </div>
            </div>
          </el-col>

          <el-col :span="24">
            <div class="action-row">
              <div class="action-row-left">
                <el-button
                  class="action-btn"
                  :size="compSize"
                  :disabled="!canAbandon || hasWarning"
                  type="danger"
                  @click="abandonGame"
                >
                  放弃本局 / 剩余{{ remainingAbandons }}次
                </el-button>
              </div>
              <div class="action-row-right">
                <div class="action-switch-group hidden-xs-only">
                  <span class="action-switch-label"
                    ><span class="action-switch-remaining">（剩余{{ remainingDoubles }}次）</span
                    ><span class="action-switch-warning">奖励翻倍</span></span
                  >
                  <el-switch
                    v-model="doubled"
                    :size="compSize"
                    :disabled="!canToggleDouble || hasWarning"
                    inactive-text="关"
                    active-text="开"
                    class="action-switch"
                    @change="handleDoubleSwitch"
                  />
                </div>
                <el-button
                  class="action-btn"
                  :size="compSize"
                  :disabled="remainingGames === 0 || activeDrawCount === 0 || hasWarning"
                  type="info"
                  @click="activeDrawCount > 0 ? endGame() : resetGame()"
                >
                  结算本局 / 剩余{{ remainingGames }}次
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-col>

      <div class="al-divider hidden-xs-only hidden-lg-and-up" style="width: 100%"></div>

      <el-col :span="24" :lg="9" :xs="24">
        <el-row :gutter="16" class="game-section" data-tour="result">
          <el-col :span="15" :xs="24" :lg="24">
            <el-card class="advice-card">
              <template #header>
                <span>策略分析</span>
              </template>
              <div v-if="hasWarning" class="advice-content">
                <div class="advice-decision advice-abandon">错误：铭牌库不足</div>
              </div>
              <div v-else-if="currentAdvice && euAdvice" class="advice-content">
                <div
                  class="advice-decision"
                  :class="{
                    'advice-continue':
                      decisionAction === 'continue' || decisionAction === 'must_continue',
                    'advice-stop': decisionAction === 'stop' || decisionAction === 'must_stop',
                    'advice-double': decisionAction === 'double',
                    'advice-abandon': decisionAction === 'abandon',
                  }"
                >
                  <template v-if="decisionAction === 'double'">
                    {{ decisionPrefix }}开启翻倍
                  </template>
                  <template v-else-if="decisionAction === 'abandon'">
                    {{ decisionPrefix }}放弃本局
                  </template>
                  <template v-else-if="decisionAction === 'continue'">
                    {{ decisionPrefix }}抽取铭牌
                  </template>
                  <template v-else-if="decisionAction === 'stop'">
                    {{ decisionPrefix }}结算本局
                  </template>
                  <template v-else-if="decisionAction === 'must_continue'">
                    {{ decisionPrefix }}必须抽取铭牌
                  </template>
                  <template v-else>{{ decisionPrefix }}结算本局</template>
                </div>
                <el-divider style="margin: 4px 0" />
                <div class="advice-row advice-header">
                  <span class="advice-label" />
                  <span class="advice-value">奖励期望</span>
                  <span class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">期望效用</span>
                </div>
                <div class="advice-row">
                  <span class="advice-label">本局当前奖励</span>
                  <span class="advice-value">{{ formatDecimal(euAdvice.rewardCurrent) }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    formatDecimal(euAdvice.euCurrentReward)
                  }}</span>
                </div>
                <div class="advice-row">
                  <span class="advice-label">本局最优期望</span>
                  <span class="advice-value">{{ formatDecimal(euAdvice.rewardRound) }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    euAdvice ? formatDecimal(euAdvice.euRound) : '—'
                  }}</span>
                </div>

                <el-divider style="margin: 4px 0" />
                <div class="advice-row">
                  <span class="advice-label">各行动今日总期望：</span>
                  <span class="advice-value" />
                </div>
                <div
                  class="advice-row"
                  :class="{
                    'advice-row-optimal': isRawOptOnly('continue', 'must_continue'),
                    'advice-row-optimal-adjusted':
                      isAdjOpt('continue') || isAdjOpt('must_continue'),
                  }"
                >
                  <span class="advice-label">抽取铭牌</span>
                  <span class="advice-value">{{
                    euAdvice.rewardDraw != null ? formatDecimal(euAdvice.rewardDraw) : '—'
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    euAdvice.euDraw != null ? formatDecimal(euAdvice.euDraw) : '—'
                  }}</span>
                </div>
                <div v-for="item in perLevelAdvice" :key="item.level" class="advice-row">
                  <span class="advice-label" style="text-indent: 1.5em"
                    >铭牌点数 {{ item.level }}</span
                  >
                  <span class="advice-value" :class="diffClass(item.ev)">{{
                    item.ev != null ? formatDiff(item.ev) : '—'
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span
                    v-if="showEuColumn"
                    class="advice-value advice-adjusted"
                    :class="diffClass(item.evAdjusted)"
                    >{{ item.evAdjusted != null ? formatDiff(item.evAdjusted) : '—' }}</span
                  >
                  <span class="advice-sep">|</span>
                  <span class="advice-value advice-prob">{{ (item.prob * 100).toFixed(1) }}%</span>
                </div>
                <div
                  class="advice-row"
                  :class="{
                    'advice-row-optimal': isRawOptOnly('double'),
                    'advice-row-optimal-adjusted': isAdjOpt('double'),
                  }"
                >
                  <span class="advice-label">开启翻倍</span>
                  <span class="advice-value">{{
                    euAdvice.rewardDouble != null ? formatDecimal(euAdvice.rewardDouble) : '—'
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    euAdvice.euDouble != null ? formatDecimal(euAdvice.euDouble) : '—'
                  }}</span>
                </div>
                <div
                  class="advice-row"
                  :class="{
                    'advice-row-optimal': isRawOptOnly('abandon'),
                    'advice-row-optimal-adjusted': isAdjOpt('abandon'),
                  }"
                >
                  <span class="advice-label">放弃本局</span>
                  <span class="advice-value">{{
                    euAdvice.rewardAbandon != null ? formatDecimal(euAdvice.rewardAbandon) : '—'
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    euAdvice.euAbandon != null ? formatDecimal(euAdvice.euAbandon) : '—'
                  }}</span>
                </div>
                <div
                  class="advice-row"
                  :class="{
                    'advice-row-optimal': isRawOptOnly('stop', 'must_stop'),
                    'advice-row-optimal-adjusted': isAdjOpt('stop') || isAdjOpt('must_stop'),
                  }"
                >
                  <span class="advice-label">结算本局</span>
                  <span class="advice-value">{{
                    euAdvice.rewardStop != null ? formatDecimal(euAdvice.rewardStop) : '—'
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    euAdvice.euStop != null ? formatDecimal(euAdvice.euStop) : '—'
                  }}</span>
                </div>
                <div class="advice-row">
                  <span class="advice-label" style="text-indent: 1em">结算本局后的期望</span>
                  <span class="advice-value">{{ formatDecimal(euAdvice.rewardAfterStop) }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-adjusted">{{
                    formatDecimal(euAdvice.euAfterStop)
                  }}</span>
                </div>
                <el-divider style="margin: 4px 0" />
                <div class="advice-row">
                  <span class="advice-label">今日总期望</span>
                  <span class="advice-value advice-today-value">{{
                    formatDecimal(euAdvice.rewardToday)
                  }}</span>
                  <span v-if="showEuColumn" class="advice-sep">|</span>
                  <span v-if="showEuColumn" class="advice-value advice-today-adjusted">{{
                    formatDecimal(euAdvice.euToday)
                  }}</span>
                </div>
              </div>
              <div v-else class="advice-content" />
            </el-card>
          </el-col>

          <el-col :span="9" :xs="24" :lg="24">
            <el-card class="distribution-card">
              <template #header>
                <span>战力点概率分布</span>
              </template>
              <template v-if="!hasWarning">
                <el-table
                  v-if="distributionTableData.length > 0"
                  :size="compSize"
                  :data="distributionTableData"
                  height="auto"
                  :row-class-name="distributionRowClassName"
                  style="width: 100%"
                >
                  <el-table-column label="" width="56">
                    <template #default="{ row }">
                      <span v-if="row.isAbandon" class="distribution-abandon-label">放弃</span>
                      <span
                        v-else
                        class="distribution-value"
                        :class="{ 'distribution-current-value': row.isCurrent }"
                      >
                        {{ row.value }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="概率" width="96">
                    <template #default="{ row }">
                      <span
                        class="distribution-prob"
                        :class="{ 'distribution-prob-abandon': row.isAbandon }"
                      >
                        {{ (row.prob * 100).toFixed(2) + '%' }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column label="分布条">
                    <template #default="{ row }">
                      <el-progress
                        :percentage="Math.max(Math.round(row.prob * 100), 0)"
                        :stroke-width="20"
                        :show-text="false"
                        :color="
                          row.isAbandon
                            ? 'var(--el-color-danger)'
                            : row.isCurrent
                              ? 'var(--el-color-primary)'
                              : 'var(--el-color-primary-light-5)'
                        "
                      />
                    </template>
                  </el-table-column>
                </el-table>
                <div v-else class="distribution-empty" />
              </template>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>

  <el-tour v-model="tourOpen">
    <el-tour-step
      target="[data-tour='daily']"
      title="今日状态"
      description="操作前，先管理今日铭牌库分布，剩余游玩/翻倍/放弃次数，以获得正确结果，点击「设为单次模拟」快速测试单局情况"
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
import { reactive, ref, computed, watch } from 'vue';
import { useResponsive } from '@/composables/useResponsive';
import {
  getCurrentAdvice,
  clearSolverCache,
  DEFAULT_REWARDS,
  DEFAULT_DECK_CONFIG,
} from './EndfieldTrialSwordmancySolver';
import type { AdviceResult, ExpectedUtilityParams } from './EndfieldTrialSwordmancySolver';

const { isMobile } = useResponsive();
const compSize = computed(() => (isMobile.value ? 'small' : 'default'));

const tourOpen = ref(false);

/** 最多抽取张数 */
const MAX_DRAWS = 5;

/** 各铭牌点数数量配置 */
interface PlaqueConfig {
  level1: number;
  level2: number;
  level3: number;
  level4: number;
  level5: number;
}

/** 单张铭牌 */
interface Plaque {
  id: number;
  level: number;
  power: number;
}

/** 当前生效的奖励表 */
const rewardValues = ref<number[]>([...DEFAULT_REWARDS]);
/** textarea 中的 JSON 字符串 */
const rewardTableText = ref(JSON.stringify(DEFAULT_REWARDS, null, 2));
/** 解析错误信息，空表示无错误 */
const rewardTableError = ref('');

const config = reactive<PlaqueConfig>({
  level1: 5,
  level2: 5,
  level3: 5,
  level4: 8,
  level5: 6,
});

const debouncedDeckConfig = ref<number[]>([...DEFAULT_DECK_CONFIG]);

const activeCollapse = ref<string[]>([]);

let nextId = 0;

function createPlaque(level: number): Plaque {
  return { id: nextId++, level, power: level };
}

/** 根据当前配置构建初始铭牌库 */
function buildPool(): Plaque[] {
  const result: Plaque[] = [];
  const entries: [number, number][] = [
    [1, config.level1],
    [2, config.level2],
    [3, config.level3],
    [4, config.level4],
    [5, config.level5],
  ];
  for (const [level, count] of entries) {
    for (let i = 0; i < count; i++) {
      result.push(createPlaque(level));
    }
  }
  return result;
}

/** 清空已抽槽位 */
function initDrawnCards() {
  drawnCards.value = [null, null, null, null, null];
  for (let i = 0; i < 5; i++) slotWarnings[i] = false;
}

/** 应用铭牌库配置并重置游戏状态 */
function applyConfig() {
  for (const key of ['level1', 'level2', 'level3', 'level4', 'level5'] as const) {
    if (config[key] > 99) config[key] = 99;
    if (config[key] < 0) config[key] = 0;
  }
  clearSolverCache();
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
  ElMessage.success('已应用铭牌库配置');
}

/** 重置铭牌分布为默认值，并应用配置 */
function resetConfig() {
  clearSolverCache();
  config.level1 = DEFAULT_DECK_CONFIG[0]!;
  config.level2 = DEFAULT_DECK_CONFIG[1]!;
  config.level3 = DEFAULT_DECK_CONFIG[2]!;
  config.level4 = DEFAULT_DECK_CONFIG[3]!;
  config.level5 = DEFAULT_DECK_CONFIG[4]!;
  // applyConfig();
}

/** 快速配置模式（OTP 式单格输入+自动跳转） */
const poolQuickConfigMode = ref(true);

function toggleQuickMode() {
  poolQuickConfigMode.value = !poolQuickConfigMode.value;
  if (poolQuickConfigMode.value) {
    ([1, 2, 3, 4, 5] as const).forEach((level) => {
      const k = `level${level}` as keyof PlaqueConfig;
      if (config[k] > 9) config[k] = 9;
    });
  }
}

const otpConfigValue = computed({
  get: () =>
    [config.level1, config.level2, config.level3, config.level4, config.level5]
      .map((v) => (v > 9 ? 9 : v))
      .join(''),
  set: (val: string) => {
    const s = val.padEnd(5, '0').slice(0, 5);
    config.level1 = Number(s[0]) || 0;
    config.level2 = Number(s[1]) || 0;
    config.level3 = Number(s[2]) || 0;
    config.level4 = Number(s[3]) || 0;
    config.level5 = Number(s[4]) || 0;
  },
});

function onlyConfigDigit(value: string): boolean {
  return value === '' || (value >= '0' && value <= '9');
}

let applyConfigTimer: ReturnType<typeof setTimeout> | undefined;
watch(
  config,
  () => {
    if (applyConfigTimer) clearTimeout(applyConfigTimer);
    applyConfigTimer = setTimeout(() => {
      applyConfig();
      debouncedDeckConfig.value = [
        config.level1,
        config.level2,
        config.level3,
        config.level4,
        config.level5,
      ];
    }, 1000);
  },
  { deep: true },
);

/** 解析 textarea 中的 JSON 并应用奖励表 */
function applyRewardTable() {
  rewardTableError.value = '';
  try {
    const parsed = JSON.parse(rewardTableText.value);
    if (!Array.isArray(parsed)) {
      rewardTableError.value = '必须是一个 JSON 数组';
      return;
    }
    if (parsed.length !== 11) {
      rewardTableError.value = `数组长度必须为 11，当前为 ${parsed.length}`;
      return;
    }
    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== 'number' || isNaN(parsed[i])) {
        rewardTableError.value = `索引 ${i} 的值不是有效数字`;
        return;
      }
    }
    rewardValues.value = [...parsed];
    clearSolverCache();
    ElMessage.success('已应用奖励表');
  } catch (e) {
    rewardTableError.value = `JSON 格式错误：${(e as Error).message}`;
  }
}

/** 重置奖励表为默认值并生效 */
function resetRewardTable() {
  rewardTableText.value = JSON.stringify(DEFAULT_REWARDS, null, 2);
  rewardTableError.value = '';
  rewardValues.value = [...DEFAULT_REWARDS];
  clearSolverCache();
  ElMessage.success('已应用奖励表');
}

/** 铭牌库（剩余未抽的铭牌） */
const pool = ref<Plaque[]>([]);
/** 已抽的 5 个槽位 */
const drawnCards = ref<(Plaque | null)[]>([null, null, null, null, null]);
/** 是否已开启奖励翻倍 */
const doubled = ref(false);
/** 今日剩余游玩次数 */
const remainingGames = ref(3);
/** 今日剩余翻倍次数 */
const remainingDoubles = ref(2);
/** 今日剩余放弃次数 */
const remainingAbandons = ref(3);
/** 手动设置时铭牌库不足的警告标记 */
const slotWarnings = reactive<boolean[]>([false, false, false, false, false]);

/** 各点数已抽数量（索引 0-4 对应点数 1-5） */
const drawnCounts = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card) counts[card.level - 1]!++;
  }
  return counts;
});

pool.value = buildPool();

const poolByLevel = computed(() => {
  const groups: Record<number, Plaque[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const plaque of pool.value) {
    groups[plaque.level]!.push(plaque);
  }
  return groups;
});

const aversionFactor = ref(1.0);
const fixedPenalty = ref(0);

const euParams = computed<ExpectedUtilityParams | undefined>(() => {
  // 默认参数等同于不启用期望效用模型
  if (aversionFactor.value === 1.0 && fixedPenalty.value === 0) return undefined;
  return { aversionFactor: aversionFactor.value, fixedPenalty: fixedPenalty.value };
});

const showEuColumn = computed(() => euParams.value !== undefined);

function setEuParams(af: number, fp: number) {
  aversionFactor.value = af;
  fixedPenalty.value = fp;
}

function isPresetActive(af: number, fp: number): boolean {
  return aversionFactor.value === af && fixedPenalty.value === fp;
}

const activeDrawCount = computed(() => drawnCards.value.filter(Boolean).length);

const totalPower = computed(() => drawnCards.value.reduce((sum, c) => sum + (c?.power ?? 0), 0));

/** 实际战力点 → 奖励索引
 *  0-10 直接映射；超过 10 则模 11 循环 */
const rewardIndex = computed(() => {
  if (totalPower.value > 10) {
    return totalPower.value % 11;
  }
  return totalPower.value;
});

/** 翻倍前的基础奖励 */
const baseReward = computed(() => rewardValues.value[rewardIndex.value] ?? 0);

/** 最终奖励（含翻倍） */
const finalReward = computed(() => {
  return doubled.value ? baseReward.value * 2 : baseReward.value;
});

const powerPointOptions = Array.from({ length: 11 }, (_, i) => ({
  label: String(i),
  value: i,
}));

const rewardOptions = computed(() =>
  Array.from({ length: 11 }, (_, i) => ({
    label: formatRewardShort(doubled.value ? rewardValues.value[i]! * 2 : rewardValues.value[i]!),
    value: i,
  })),
);

/** 溢出期望效用档位：实际战力点 11~21 经期望效用模型调整后的奖励，供玩家对比参考 */
const euOptions = computed(() => {
  const params = euParams.value;
  const mul = doubled.value ? 2 : 1;
  return Array.from({ length: 11 }, (_, i) => {
    const power = 11 + i;
    const s = power % 11;
    const raw = rewardValues.value[s] ?? 0;
    let label: string;
    if (params) {
      const adjusted = (raw * Math.pow(params.aversionFactor, 1) - 1 * params.fixedPenalty) * mul;
      label = formatRewardShort(adjusted);
    } else {
      label = formatRewardShort(raw * mul);
    }
    return { label, value: power };
  });
});

/** 当前总战力对应的溢出点（11~21），未溢出时不选中任何挡位 */
const euSelectedValue = computed(() => {
  if (totalPower.value >= 11 && totalPower.value <= 21) return totalPower.value;
  return undefined;
});

/** 小屏幕时溢出期望效用显示的数值（格式化后的奖励值，如"-30K"） */
const euDisplayValue = computed(() => {
  const params = euParams.value;
  const mul = doubled.value ? 2 : 1;
  if (totalPower.value >= 11 && totalPower.value <= 21) {
    const s = totalPower.value % 11;
    const raw = rewardValues.value[s] ?? 0;
    let adjusted: number;
    if (params) {
      adjusted = (raw * Math.pow(params.aversionFactor, 1) - 1 * params.fixedPenalty) * mul;
    } else {
      adjusted = raw * mul;
    }
    return formatRewardShort(adjusted);
  }
  return '—';
});

const canDraw = computed(() => {
  return activeDrawCount.value < MAX_DRAWS && pool.value.length > 0;
});

/** 可翻倍条件：本局未翻倍、今日有剩余次数 */
const canDouble = computed(() => {
  return !doubled.value && remainingDoubles.value > 0;
});

/** 开关可用条件：已翻倍 或 今日有剩余次数 */
const canToggleDouble = computed(() => {
  return doubled.value || remainingDoubles.value > 0;
});

/** 可放弃条件：已抽至少一张牌、有剩余游玩次数 */
const canAbandon = computed(() => {
  return activeDrawCount.value > 0 && remainingGames.value > 0;
});

/** 随机抽取一张铭牌 */
function drawCard() {
  if (!canDraw.value) return;
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) return;
  const index = Math.floor(Math.random() * pool.value.length);
  const plaque = pool.value.splice(index, 1)[0]!;
  drawnCards.value[emptyIndex] = plaque;
}

/** 点击铭牌库等级行时模拟抽取对应点数的铭牌 */
function simulateDrawFromPool(level: number) {
  const emptyIndex = drawnCards.value.findIndex((c) => c == null);
  if (emptyIndex === -1) {
    return;
  }
  const plaque = takeFromPool(level);
  if (!plaque) {
    return;
  }
  drawnCards.value[emptyIndex] = plaque;
}

/** 从铭牌库中取出一张指定铭牌点数的牌（返回 null 表示铭牌库不足） */
function takeFromPool(level: number): Plaque | null {
  const idx = pool.value.findIndex((p) => p.level === level);
  if (idx === -1) return null;
  return pool.value.splice(idx, 1)[0]!;
}

/** 撤销上一次抽牌：将最后一张已抽铭牌放回铭牌库 */
function undoLastDraw() {
  let lastIndex = -1;
  for (let i = drawnCards.value.length - 1; i >= 0; i--) {
    if (drawnCards.value[i] != null) {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex === -1) return;
  const card = drawnCards.value[lastIndex];
  drawnCards.value[lastIndex] = null;
  slotWarnings[lastIndex] = false;
  if (card && card.id >= 0) pool.value.push(card);
}

function toggleDouble() {
  if (!canDouble.value) return;
  doubled.value = true;
}

function handleDoubleSwitch(val: string | number | boolean) {
  if (val) {
    if (!doubled.value) toggleDouble();
  } else {
    if (doubled.value) doubled.value = false;
  }
}

/** 放弃本局：有剩余放弃次数时不消耗游玩次数；无剩余放弃次数时消耗一次游玩次数，本局收益为 0，不消耗翻倍次数 */
function abandonGame() {
  if (!canAbandon.value) return;
  if (remainingAbandons.value > 0) {
    remainingAbandons.value--;
  } else {
    remainingGames.value--;
  }
  resetGame();
}

/** 重置本局铭牌库/已抽/翻倍 */
function resetGame() {
  nextId = 0;
  pool.value = buildPool();
  initDrawnCards();
  doubled.value = false;
}

/** 结算本局，进入下一局（消耗一次游玩次数，翻倍次数在结算时实际扣除） */
function endGame() {
  if (remainingGames.value <= 0) return;
  if (doubled.value) remainingDoubles.value--;
  remainingGames.value--;
  resetGame();
}

/** 重置今日全部状态 */
function resetToday() {
  remainingGames.value = 3;
  remainingDoubles.value = 2;
  remainingAbandons.value = 3;
  resetGame();
}

/** 设置为单次模拟（P=1, D=0, A=0） */
function setSingleSimulation() {
  remainingGames.value = 1;
  remainingDoubles.value = 0;
  remainingAbandons.value = 0;
}

/** 格式化数值为固定两位小数 */
function formatDecimal(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDiff(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return prefix + formatDecimal(value);
}

function diffClass(value: number | null): string {
  if (value == null) return '';
  if (value > 0) return 'advice-diff-positive';
  if (value < 0) return 'advice-diff-negative';
  return '';
}

/** 获取铭牌库中指定等级的剩余张数（含透支） */
function getPoolCount(level: number): number {
  return (poolByLevel.value[level]?.length ?? 0) - (overdraftByLevel.value[level - 1] ?? 0);
}

/** 格式化奖励数字（显示为简短格式） */
function formatRewardShort(value: number): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1000000) {
    formatted = `${(abs / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (abs >= 100000) {
    formatted = `${Math.round(abs / 1000)}K`;
  } else if (abs >= 10000 && value < 0) {
    formatted = `${Math.round(abs / 1000)}K`;
  } else if (abs >= 1000) {
    formatted = `${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  } else {
    formatted = String(abs);
  }
  return value < 0 ? `-${formatted}` : formatted;
}

/** OTP 输入框的字符串值（按抽取顺序排列，空位为 ''） */
const otpValue = computed(() => drawnCards.value.map((c) => c?.level ?? '').join(''));

const hasWarning = computed(() => slotWarnings.some(Boolean));

/** 各级铭牌的透支数量（手动输入超过铭牌库限制的部分） */
const overdraftByLevel = computed(() => {
  const counts = [0, 0, 0, 0, 0];
  for (const card of drawnCards.value) {
    if (card && card.id < 0) counts[card.level - 1]!++;
  }
  return counts;
});

/** OTP 输入校验：只允许 1-5 和空 */
function onlyLevel(value: string): boolean {
  return value === '' || (value >= '1' && value <= '5');
}

function handleOtpChange(val: string | number) {
  const s = String(val);
  for (const card of drawnCards.value) {
    if (card && card.id >= 0) pool.value.push(card);
  }
  initDrawnCards();
  for (let i = 0; i < MAX_DRAWS; i++) {
    const ch = s[i];
    if (ch && ch >= '1' && ch <= '5') {
      const level = Number(ch);
      const plaque = takeFromPool(level);
      if (plaque) {
        drawnCards.value[i] = plaque;
      } else {
        drawnCards.value[i] = { id: -1, level, power: level };
        slotWarnings[i] = true;
      }
    }
  }
}

/** 将配置对象转为数组形式供求解器使用 */
const deckConfigArray = computed(() => debouncedDeckConfig.value);

/** 当前状态的最优行动建议（含多局/翻倍，原始） */
const currentAdvice = computed<AdviceResult | null>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardValues.value;
  if (deck.some((c) => c < 0)) return null;
  return getCurrentAdvice(
    deck,
    rewards,
    drawnCounts.value,
    doubled.value,
    remainingGames.value,
    remainingDoubles.value,
    remainingAbandons.value,
  );
});

/** 调整后的最优行动建议（含期望效用模型） */
const euAdvice = computed<AdviceResult | null>(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardValues.value;
  if (deck.some((c) => c < 0) || !euParams.value) return currentAdvice.value;
  return getCurrentAdvice(
    deck,
    rewards,
    drawnCounts.value,
    doubled.value,
    remainingGames.value,
    remainingDoubles.value,
    remainingAbandons.value,
    euParams.value,
  );
});

/** 下一张抽到各等级后的概率与期望（通过调用 getCurrentAdvice 获取） */
const perLevelAdvice = computed(() => {
  const deck = deckConfigArray.value;
  const rewards = rewardValues.value;
  const dc = drawnCounts.value;
  if (deck.some((c) => c < 0)) return [];
  if (!canDraw.value) {
    return [1, 2, 3, 4, 5].map((level) => ({
      level,
      prob: 0,
      ev: null as number | null,
      evAdjusted: null as number | null,
    }));
  }
  const remaining = deck.map((d, i) => d - dc[i]!);
  const totalRemaining = remaining.reduce((a, b) => a + b, 0);
  const result: { level: number; prob: number; ev: number | null; evAdjusted: number | null }[] =
    [];
  // 左列基线 = 原始奖励期望（遵循 EU 策略），右列基线 = EU 调整期望
  const currentExp = euAdvice.value?.rewardToday ?? 0;
  const currentExpAdj = euAdvice.value?.euToday ?? currentExp;
  for (let i = 0; i < 5; i++) {
    if (remaining[i]! > 0) {
      const prob = remaining[i]! / totalRemaining;
      const nextDrawn = [...dc];
      nextDrawn[i]!++;
      // 一次调用同时获取原始奖励期望和 EU 调整期望
      const nextResult = getCurrentAdvice(
        deck,
        rewards,
        nextDrawn,
        doubled.value,
        remainingGames.value,
        remainingDoubles.value,
        remainingAbandons.value,
        euParams.value,
      );
      result.push({
        level: i + 1,
        prob: Math.round(prob * 10000) / 10000,
        ev: nextResult ? Math.round((nextResult.rewardToday - currentExp) * 100) / 100 : null,
        evAdjusted: nextResult
          ? Math.round((nextResult.euToday - currentExpAdj) * 100) / 100
          : null,
      });
    } else {
      result.push({
        level: i + 1,
        prob: 0,
        ev: null,
        evAdjusted: null,
      });
    }
  }
  return result;
});

const distributionTableData = computed(() => {
  const result = euAdvice.value;
  if (!result) return [];
  const { distribution: dist, abandonProb } = result;
  const currentS = rewardIndex.value;
  const rows = dist.map((p, i) => ({
    value: i,
    prob: p,
    isCurrent: i === currentS,
    isAbandon: false,
  }));
  rows.push({
    value: -1,
    prob: abandonProb,
    isCurrent: false,
    isAbandon: true,
  });
  return rows;
});

/** 分布表行高亮回调 */
function distributionRowClassName({ row }: { row: any }) {
  if (row.isCurrent) return 'distribution-row-highlight';
  return '';
}

/** 原始最优且调整后非最优时才高亮原始色，避免与调整后高亮冲突 */
function isRawOptOnly(...actions: string[]): boolean {
  if (!currentAdvice.value) return false;
  const rawIs = actions.includes(currentAdvice.value.optimalAction);
  if (!rawIs) return false;
  if (!euAdvice.value) return true;
  return !actions.includes(euAdvice.value.optimalAction);
}

/** 调整后最优则优先使用调整后高亮色 */
function isAdjOpt(...actions: string[]): boolean {
  if (!euAdvice.value) return false;
  return actions.includes(euAdvice.value.optimalAction);
}

/** 决策动作优先采用期望效用模型建议，无模型时回退原始 */
const decisionAction = computed(
  () => euAdvice.value?.optimalAction ?? currentAdvice.value?.optimalAction ?? 'stop',
);

/** 仅期望效用模型激活时在决策文字前显示标注 */
const decisionPrefix = computed(() => (showEuColumn.value ? '期望效用模型应用后最优：' : '最优：'));
</script>

<style lang="scss" scoped>
// ── 布局与通用 ──
#view-endfield-trial-of-swordmancy {
  .view-title-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .view-title {
    flex: 1;
  }

  .view-tour-btn {
    flex-shrink: 0;
  }

  .config-panel {
    margin-bottom: 16px;
  }

  .config-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 4px;
  }

  .config-item {
    display: flex;
    align-items: center;
    gap: 8px;

    :deep(.el-input) {
      width: 80px;
    }
  }

  .config-label,
  .daily-label,
  .expected-utility-label,
  .drawn-manual-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .config-otp-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .config-buttons,
  .config-reward-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }

  .config-reward-section {
    margin-top: 4px;
  }

  .config-reward-header {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;
  }

  .config-reward-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  .config-reward-textarea {
    width: 100%;
    :deep(textarea) {
      font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.5;
    }
  }

  .config-reward-error {
    color: var(--el-color-danger);
    font-size: 12px;
    margin-top: 4px;
  }

  // ── 所有卡片统一 padding ──
  .expected-utility-card,
  .drawn-card,
  .pool-card,
  .reward-card,
  .daily-card,
  .advice-card,
  .distribution-card {
    :deep(.el-card__header) {
      font-weight: bold;
      padding: 12px 16px;
    }
    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    @media (max-width: 767px) {
      :deep(.el-card__header) {
        padding: 8px 12px;
      }
      :deep(.el-card__body) {
        padding: 8px 12px;
      }
    }
  }

  // ── 期望效用模型参数 ──

  .expected-utility-body,
  .expected-utility-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .expected-utility-grid {
    margin-bottom: 8px;
  }

  .expected-utility-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .expected-utility-slider {
    flex: 1;
  }

  .expected-utility-input {
    width: 140px;
  }

  .expected-utility-presets {
    display: flex;
    flex-wrap: wrap;
  }

  .game-section {
    row-gap: 8px;
    margin-bottom: 8px;

    :deep(.el-col) {
      display: flex;
    }

    :deep(.el-card) {
      width: 100%;
    }
  }

  // ── 已抽铭牌区域 ──

  .drawn-card {
    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
    }
  }

  .drawn-slots {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .drawn-slot {
    width: 72px;
    height: 100px;
    border-radius: 8px;
    border: 2px solid var(--el-border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color-light);
    transition: all 0.3s;
    user-select: none;

    &.filled {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .drawn-slot-warning {
    border-color: var(--el-color-danger) !important;
    background: var(--el-color-danger-light-9) !important;

    .drawn-slot-num {
      color: var(--el-color-danger) !important;
    }
  }

  .drawn-slot-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .drawn-slot-lv {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .drawn-slot-num,
  .drawn-slot-q {
    font-size: 32px;
    font-weight: bold;
    line-height: 1;
  }
  .drawn-slot-num {
    color: var(--el-color-primary);
  }
  .drawn-slot-q {
    color: var(--el-text-color-placeholder);
  }

  .drawn-manual-input {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .drawn-manual-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .drawn-undo-btn {
    flex-shrink: 0;
  }

  // ── 铭牌库展示 ──

  .pool-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pool-level-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    background: var(--el-fill-color);
  }

  .pool-level-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 32px;
  }

  .pool-level-count {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
  }

  .reward-label {
    font-size: 14px;
    font-weight: bold;
  }

  .reward-point-section,
  .reward-tier-section,
  .reward-eu-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    .reward-label {
      width: 64px;
      white-space: nowrap;
    }

    .el-segmented {
      flex-grow: 1;
      --el-border-radius-base: 0px;
    }
  }

  .reward-eu-section {
    margin-bottom: 0;
    .reward-eu-segmented {
      --el-segmented-item-selected-bg-color: var(--el-color-danger);
      --el-segmented-item-selected-disabled-bg-color: var(--el-color-danger);
    }
    &.reward-eu-disabled {
      opacity: 0.4;
      .reward-label {
        color: var(--el-text-color-placeholder);
      }
    }
  }

  .reward-penalty {
    &.el-segmented {
      --el-segmented-item-selected-bg-color: var(--el-color-danger);
    }
  }

  .reward-success {
    &.el-segmented {
      --el-segmented-item-selected-bg-color: var(--el-color-success);
      color: var(--el-text-color-primary);
    }
    color: var(--el-color-success);
  }

  // ── 今日状态 ──

  .daily-grid {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    .config-otp-row {
      margin-bottom: 0;
    }
    .config-grid {
      margin-bottom: 0;
    }
    .config-buttons {
      margin-top: 0;
    }
  }

  .daily-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .daily-input {
    width: 108px;
  }

  .daily-single-btn {
    margin-left: auto;
  }

  .daily-reset-btn {
    margin-left: 0;
  }

  // ── 策略分析 ──

  .advice-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .advice-row {
    display: flex;
    align-items: center;
    font-size: 14px;
    gap: 4px;
  }

  .advice-label {
    color: var(--el-text-color-secondary);
    min-width: 144px;
  }

  .advice-row-optimal,
  .advice-row-optimal-adjusted {
    font-weight: bold;
    border-radius: 4px;
  }
  .advice-row-optimal {
    background: var(--el-fill-color);
  }
  .advice-row-optimal-adjusted {
    background: var(--el-color-primary-light-8);
  }

  .advice-value {
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    min-width: 88px;
    text-align: right;

    &.advice-diff-positive {
      color: var(--el-color-success);
    }

    &.advice-diff-negative {
      color: var(--el-color-danger);
    }
  }

  .advice-sep {
    color: var(--el-border-color);
    font-weight: normal;
  }

  .advice-adjusted {
    color: var(--el-text-color-primary);
  }

  .advice-prob {
    min-width: 48px;
  }

  .advice-header {
    font-size: 14px;

    .advice-value {
      font-weight: bold;
    }
  }

  .advice-today-adjusted {
    color: var(--el-text-color-primary);
    font-weight: bold;
  }

  .advice-decision {
    text-align: center;
    font-size: 16px;
    font-weight: bold;
    padding: 8px 0;
    border-radius: 4px;

    &.advice-continue {
      color: var(--el-color-success);
    }

    &.advice-double {
      color: var(--el-color-primary);
    }

    &.advice-stop {
      color: var(--el-text-color-primary);
    }

    &.advice-abandon {
      color: var(--el-color-danger);
    }
  }

  // ── 战力点概率分布 ──

  .distribution-empty {
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    padding: 12px 0;
  }

  .distribution-value {
    font-weight: bold;
    font-variant-numeric: tabular-nums;
  }

  .distribution-current-value {
    color: var(--el-color-primary);
    font-weight: bold;
  }

  .distribution-prob {
    font-variant-numeric: tabular-nums;
  }

  .distribution-prob-abandon {
    color: var(--el-color-danger);
  }

  .distribution-abandon-label {
    color: var(--el-color-danger);
  }

  :deep(.distribution-card .el-progress) {
    width: 100%;
  }

  :deep(.distribution-row-highlight) {
    background: var(--el-color-primary-light-9);
    font-weight: bold;
  }

  :deep(.el-table__body .distribution-row-highlight:hover .el-table__cell) {
    background: var(--el-color-primary-light-9);
  }

  // ── 操作按钮 ──

  .action-rows {
    margin: 8px 0;
  }

  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .action-row-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
  }

  .action-row-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
  }

  .action-btn {
    min-width: 168px;
  }

  .action-switch-label {
    font-size: 14px;
    white-space: nowrap;
  }

  .action-switch-remaining {
    color: var(--el-text-color-secondary);
  }

  .action-switch-warning {
    color: var(--el-color-warning);
  }

  .action-switch {
    min-width: 100px;
    justify-content: center;
  }

  .action-switch-group {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }

  .action-row-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  // ── 响应式：小屏幕 ──
  @media (max-width: 767px) {
    .game-section {
      row-gap: 0;
    }

    .game-section {
      :deep(.el-col + .el-col) {
        margin-top: 8px;
      }
    }

    .action-row {
      .action-row-left,
      .action-row-right {
        flex: 1;
      }
    }

    .daily-input {
      width: 80px;
    }

    .action-switch-label {
      white-space: nowrap;
    }

    .action-row-left {
      justify-content: stretch;
    }

    .action-btn {
      width: 100%;
    }

    .pool-list {
      flex-direction: row;
    }

    .pool-level-row {
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
    }

    .pool-level-count {
      font-size: 14px;
    }

    .reward-point-section,
    .reward-tier-section,
    .reward-eu-section {
      flex: 1;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px 4px;
      margin-bottom: 0;
      background: var(--el-fill-color);
      border-radius: 4px;

      &.reward-penalty {
        background: var(--el-color-danger-light-7);
      }

      .el-segmented {
        display: none;
      }

      .reward-label {
        width: auto;
        margin-bottom: 0;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }

      .reward-xs-value {
        font-size: 16px;
        font-weight: bold;
      }
    }

    .reward-eu-section.reward-eu-disabled {
      opacity: 0.5;
    }

    .reward-card :deep(.el-card__body) {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }
}
</style>
