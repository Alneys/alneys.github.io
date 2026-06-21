<template>
  <div class="password-generator">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/tools' }">开发者工具</el-breadcrumb-item>
      <el-breadcrumb-item>随机密码生成器</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>

    <div class="password-generator-container">
      <div class="password-display">
        <el-input
          v-model="generatedPassword"
          readonly
          ref="passwordInput"
          class="password-input font-mono"
        >
          <template #append>
            <el-button @click="copyPassword" :icon="copyIcon">
              {{ copyButtonText }}
            </el-button>
          </template>
        </el-input>
      </div>

      <el-card class="settings-panel" shadow="never">
        <div class="setting-row">
          <span>密码长度:</span>
          <el-slider
            v-model="options.length"
            :min="8"
            :max="128"
            show-input
            class="length-slider"
          />
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.includeUppercase"> 包含大写字母 (A-Z) </el-checkbox>
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.includeLowercase"> 包含小写字母 (a-z) </el-checkbox>
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.includeNumbers"> 包含数字 (0-9) </el-checkbox>
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.includeSymbols"> 包含特殊字符 </el-checkbox>
        </div>
        <div class="setting-row setting-indent" v-show="options.includeSymbols">
          <span class="setting-label">自定义字符:</span>
          <el-input
            v-model="customSymbols"
            placeholder="清空则恢复默认字符集"
            clearable
            class="symbols-input"
          />
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.excludeSimilar">
            排除相似字符 (i, l, 1, L, o, 0, O)
          </el-checkbox>
        </div>

        <el-button type="primary" @click="generatePassword" class="generate-button">
          生成密码
        </el-button>
      </el-card>
    </div>

    <div class="al-divider"></div>
    <div class="password-generator-info">
      <ul>
        <li>本功能不涉及远程请求，仅本地运行</li>
        <li>使用 <code>crypto.getRandomValues</code> 密码学安全的随机数生成器，保证安全性</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, shallowRef } from 'vue';
import { CopyDocument, Check } from '@element-plus/icons-vue';

// 定义字符集
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR_CHARS = /[il1Lo0O]/g;

// 密码学安全的随机整数生成（使用 Web Crypto API）
function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0]! % max;
}

// 复制图标状态 - 改为使用shallowRef避免组件被转换为reactive对象
const copyIcon = shallowRef<typeof CopyDocument>(CopyDocument);

// 密码选项
const options = reactive({
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false,
  excludeSimilar: false,
});

// 自定义特殊字符（默认使用标准字符集）
const customSymbols = ref(SYMBOLS);

// 生成的密码
const generatedPassword = ref('');

// 复制按钮文本
const copyButtonText = ref('复制');

// 密码输入框引用
const passwordInput = ref<HTMLInputElement | null>(null);

// 生成密码函数
function generatePassword() {
  // 获取实际使用的特殊字符集
  const effectiveSymbols = customSymbols.value.trim() || SYMBOLS;

  let charset = '';

  if (options.includeUppercase) charset += UPPERCASE;
  if (options.includeLowercase) charset += LOWERCASE;
  if (options.includeNumbers) charset += NUMBERS;
  if (options.includeSymbols) charset += effectiveSymbols;

  // 如果没有选择任何字符集，则默认使用字母和数字
  if (charset === '') {
    charset = LOWERCASE + UPPERCASE + NUMBERS;
    // options.includeUppercase = true;
    // options.includeLowercase = true;
    // options.includeNumbers = true;
  }

  // 排除相似字符
  if (options.excludeSimilar) {
    charset = charset.replace(SIMILAR_CHARS, '');
  }

  let password = '';
  const charsetLength = charset.length;

  // 保证至少有一个每种类型的字符
  if (options.includeUppercase) {
    password += getRandomChar(UPPERCASE, options.excludeSimilar);
  }
  if (options.includeLowercase) {
    password += getRandomChar(LOWERCASE, options.excludeSimilar);
  }
  if (options.includeNumbers) {
    password += getRandomChar(NUMBERS, options.excludeSimilar);
  }
  if (options.includeSymbols) {
    password += getRandomChar(effectiveSymbols, options.excludeSimilar);
  }

  // 填充剩余长度
  for (let i = password.length; i < options.length; i++) {
    password += charset.charAt(getSecureRandomInt(charsetLength));
  }

  // 打乱密码字符顺序
  generatedPassword.value = shuffleString(password);

  // 设置复制图标和按钮文本
  copyIcon.value = CopyDocument;
  copyButtonText.value = '复制';
}

// 获取随机字符
function getRandomChar(charset: string, excludeSimilar: boolean): string {
  if (excludeSimilar) {
    charset = charset.replace(SIMILAR_CHARS, '');
  }
  return charset.charAt(getSecureRandomInt(charset.length));
}

// 打乱字符串
function shuffleString(str: string): string {
  const array = str.split('');
  for (let i = array.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [array[i], array[j]] = [array[j]!, array[i]!];
  }
  return array.join('');
}

// 复制密码到剪贴板
function copyPassword() {
  if (!generatedPassword.value) return;

  navigator.clipboard.writeText(generatedPassword.value).then(() => {
    copyIcon.value = Check;
    copyButtonText.value = '已复制!';
  });
}

// 监听选项变化，自动重新生成密码
watch(
  options,
  () => {
    generatePassword();
  },
  { deep: true },
);

// 监听自定义特殊字符变化，自动重新生成密码
watch(customSymbols, (newValue) => {
  generatePassword();
});

// 组件挂载时生成初始密码
onMounted(() => {
  generatePassword();
});
</script>

<style lang="scss" scoped>
.password-generator {
  .el-breadcrumb {
    margin-top: 0.5em;
  }
}

.password-generator-container {
  margin-top: 1em;
}

.password-display {
  margin-bottom: 1em;

  .password-input {
    :deep(.el-input-group__append) {
      border-color: var(--im-color-ml-miya);
      background-color: var(--im-color-ml-miya);

      .el-button {
        border: none;
        color: white;
      }
    }
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
  gap: 0.5em;
  align-items: center;

  .length-slider {
    flex: 1;
    margin-left: 1em;
  }
}

.setting-indent {
  padding-left: 1.5em;

  .setting-label {
    flex-shrink: 0;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  .symbols-input {
    flex: 1;
    max-width: 300px;
  }
}

.generate-button {
  margin-top: 8px;
}

.password-generator-info {
  line-height: 1.5em;
}
</style>
