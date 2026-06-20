<template>
  <div class="uuid-generator">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/tools' }">开发者工具</el-breadcrumb-item>
      <el-breadcrumb-item>UUID 生成器</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>

    <div class="uuid-generator-container">
      <!-- UUID 显示区域 -->
      <div class="uuid-display">
        <el-input
          v-model="displayOutput"
          readonly
          type="textarea"
          :rows="computedRows"
          class="uuid-input font-mono"
        />
        <el-button type="primary" @click="copyToClipboard" :icon="copyIcon" class="copy-button">
          {{ copyButtonText }}
        </el-button>
      </div>

      <!-- 设置面板 -->
      <el-card class="settings-panel" shadow="never">
        <div class="setting-row">
          <span>UUID 版本:</span>
          <el-radio-group v-model="options.version">
            <el-radio-button value="v4">v4 (随机)</el-radio-button>
            <el-radio-button value="v7">v7 (时间排序)</el-radio-button>
            <el-radio-button value="nil">NIL (空 UUID)</el-radio-button>
          </el-radio-group>
        </div>

        <div class="setting-row" v-show="options.version !== 'nil'">
          <span>生成数量:</span>
          <el-slider v-model="options.count" :min="1" :max="100" show-input class="count-slider" />
        </div>

        <div class="setting-row" v-show="options.version !== 'nil'">
          <el-checkbox v-model="options.withHyphens">带连字符</el-checkbox>
        </div>

        <div class="setting-row" v-show="options.version !== 'nil'">
          <el-checkbox v-model="options.uppercase">大写字母</el-checkbox>
        </div>

        <div class="setting-row" v-show="options.version !== 'nil'">
          <el-checkbox v-model="options.jsonFormat">JSON 格式输出</el-checkbox>
        </div>

        <el-button type="primary" @click="generateUuids" class="generate-button">
          生成 UUID
        </el-button>
      </el-card>
    </div>

    <div class="al-divider"></div>
    <div class="uuid-generator-info">
      <ul>
        <li>本功能不涉及远程请求，仅本地运行</li>
        <li>使用 <code>crypto.getRandomValues</code> 密码学安全的随机数生成器</li>
        <li><strong>v4</strong>: 随机生成，符合 RFC 4122 标准</li>
        <li><strong>v7</strong>: 基于时间戳，符合 RFC 9562 标准，适合数据库主键</li>
        <li><strong>NIL</strong>: 全零 UUID，用于特殊标识</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, shallowRef } from 'vue';
import { CopyDocument, Check } from '@element-plus/icons-vue';

type UuidVersion = 'v4' | 'v7' | 'nil';

// 选项
const options = reactive({
  version: 'v4' as UuidVersion,
  count: 1,
  withHyphens: true,
  uppercase: false,
  jsonFormat: false,
});

// 生成的 UUID 列表
const generatedUuids = ref<string[]>([]);

// 复制状态
const copyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const copyButtonText = ref('复制');

// 格式化字节为 UUID 字符串
function formatBytes(bytes: Uint8Array, withHyphens: boolean): string {
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

  if (!withHyphens) {
    return hex;
  }

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// 生成 UUID v4
function generateUuidV4(): Uint8Array {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // 版本 4: 第6字节高4位为 0100
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  // 变体: 第8字节高2位为 10
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  return bytes;
}

// 生成 UUID v7
function generateUuidV7(): Uint8Array {
  const bytes = new Uint8Array(16);

  // 48位时间戳（毫秒），大端序
  const timestamp = Date.now();
  const timestampBigInt = BigInt(timestamp);

  // 写入前6字节的时间戳
  bytes[0] = Number((timestampBigInt >> BigInt(40)) & BigInt(0xff));
  bytes[1] = Number((timestampBigInt >> BigInt(32)) & BigInt(0xff));
  bytes[2] = Number((timestampBigInt >> BigInt(24)) & BigInt(0xff));
  bytes[3] = Number((timestampBigInt >> BigInt(16)) & BigInt(0xff));
  bytes[4] = Number((timestampBigInt >> BigInt(8)) & BigInt(0xff));
  bytes[5] = Number(timestampBigInt & BigInt(0xff));

  // 后10字节随机
  crypto.getRandomValues(bytes.subarray(6));

  // 版本 7: 第6字节高4位为 0111
  bytes[6] = (bytes[6]! & 0x0f) | 0x70;
  // 变体: 第8字节高2位为 10
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  return bytes;
}

// 生成 NIL UUID
function generateNilUuid(): Uint8Array {
  return new Uint8Array(16); // 全零
}

// 生成单个 UUID
function generateSingleUuid(): string {
  let bytes: Uint8Array;

  switch (options.version) {
    case 'v4':
      bytes = generateUuidV4();
      break;
    case 'v7':
      bytes = generateUuidV7();
      break;
    case 'nil':
      bytes = generateNilUuid();
      break;
  }

  let uuid = formatBytes(bytes, options.withHyphens);

  if (options.uppercase) {
    uuid = uuid.toUpperCase();
  }

  return uuid;
}

// 生成 UUID
function generateUuids(): void {
  // NIL 只生成一个
  const count = options.version === 'nil' ? 1 : options.count;

  const uuids: string[] = [];
  for (let i = 0; i < count; i++) {
    uuids.push(generateSingleUuid());
  }

  generatedUuids.value = uuids;
  copyIcon.value = CopyDocument;
  copyButtonText.value = '复制';
}

// 显示输出
const displayOutput = computed(() => {
  if (generatedUuids.value.length === 0) {
    return '';
  }

  if (options.jsonFormat) {
    return JSON.stringify(generatedUuids.value, null, 2);
  }

  return generatedUuids.value.join('\n');
});

// 计算文本框行数
const computedRows = computed(() => {
  if (options.jsonFormat) {
    return Math.min(generatedUuids.value.length + 2, 20);
  }
  return Math.min(generatedUuids.value.length || 1, 20);
});

// 复制到剪贴板
function copyToClipboard(): void {
  if (!displayOutput.value) return;

  navigator.clipboard.writeText(displayOutput.value).then(() => {
    copyIcon.value = Check;
    copyButtonText.value = '已复制!';

    setTimeout(() => {
      copyIcon.value = CopyDocument;
      copyButtonText.value = '复制';
    }, 2000);
  });
}

// 监听选项变化自动重新生成
watch(
  options,
  () => {
    if (generatedUuids.value.length > 0) {
      generateUuids();
    }
  },
  { deep: true },
);

// 组件挂载时生成初始 UUID
onMounted(() => {
  generateUuids();
});
</script>

<style lang="scss" scoped>
.uuid-generator {
  .el-breadcrumb {
    margin-top: 0.5em;
  }
}

.uuid-generator-container {
  margin-top: 1em;
}

.uuid-display {
  display: flex;
  align-items: flex-start;
  margin-bottom: 1em;
  gap: 0.5em;

  .uuid-input {
    flex: 1;
  }

  .copy-button {
    flex-shrink: 0;
  }
}

.settings-panel {
  :deep(.el-card__body) {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 0.5em;

  .count-slider {
    flex: 1;
    margin-left: 1em;
  }
}

.generate-button {
  margin-top: 8px;
}

.uuid-generator-info {
  line-height: 1.5em;

  ul {
    padding-left: 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
}
</style>
