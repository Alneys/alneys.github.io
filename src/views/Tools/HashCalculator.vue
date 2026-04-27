<template>
  <div class="hash-calculator">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/tools' }">开发者工具</el-breadcrumb-item>
      <el-breadcrumb-item>哈希值计算器</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>

    <div class="hash-calculator-container">
      <!-- 输入方式选择 -->
      <el-radio-group v-model="inputMode" class="input-mode-switch">
        <el-radio-button value="text">文本输入</el-radio-button>
        <el-radio-button value="file">文件上传</el-radio-button>
      </el-radio-group>

      <!-- 文本输入区 -->
      <div v-show="inputMode === 'text'" class="input-section">
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="4"
          placeholder="请输入要计算哈希值的文本..."
          class="text-input"
        />
      </div>

      <!-- 文件上传区 -->
      <div v-show="inputMode === 'file'" class="input-section">
        <el-upload
          drag
          :auto-upload="false"
          :show-file-list="false"
          @change="handleFileChange"
          class="file-upload"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处，或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip" v-if="selectedFile">
              已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
            </div>
            <div class="el-upload__tip" v-else>最大支持 100MB 文件</div>
          </template>
        </el-upload>
      </div>

      <!-- 设置面板 -->
      <el-card class="settings-panel" shadow="never">
        <div class="setting-row">
          <span>哈希算法:</span>
          <el-select v-model="selectedAlgorithm" placeholder="选择算法" class="algorithm-select">
            <el-option-group label="常用算法">
              <el-option label="SHA-256" value="SHA256" />
              <el-option label="SHA-512" value="SHA512" />
              <el-option label="SHA3-256" value="SHA3_256" />
              <el-option label="MD5" value="MD5" />
            </el-option-group>
            <el-option-group label="SHA 系列">
              <el-option label="SHA-1" value="SHA1" />
              <el-option label="SHA-384" value="SHA384" />
            </el-option-group>
            <el-option-group label="SHA-3 系列">
              <el-option label="SHA3-224" value="SHA3_224" />
              <el-option label="SHA3-256" value="SHA3_256" />
              <el-option label="SHA3-384" value="SHA3_384" />
              <el-option label="SHA3-512" value="SHA3_512" />
            </el-option-group>
            <el-option-group label="国密算法">
              <el-option label="SM3" value="SM3" />
            </el-option-group>
          </el-select>
        </div>

        <div class="setting-row">
          <el-checkbox v-model="options.uppercase">大写输出</el-checkbox>
        </div>

        <el-button
          type="primary"
          @click="calculateHash"
          :loading="isCalculating"
          class="calculate-button"
        >
          计算哈希值
        </el-button>
      </el-card>

      <!-- 计算结果区 -->
      <div class="hash-result" v-if="hashResult">
        <div class="result-label">计算结果 ({{ selectedAlgorithmLabel }}):</div>
        <el-input :model-value="hashResult" readonly class="hash-output font-mono">
          <template #append>
            <el-button @click="copyToClipboard" :icon="copyIcon">
              {{ copyButtonText }}
            </el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 说明信息 -->
    <div class="al-divider"></div>
    <div class="hash-calculator-info">
      <ul>
        <li>本功能不涉及远程请求，仅本地运行</li>
        <li>支持文本和文件两种输入方式</li>
        <li><strong>MD5/SHA-1</strong>: 已不安全，仅适用于历史结果校验</li>
        <li><strong>SHA-2 系列</strong>: 广泛使用的安全哈希算法</li>
        <li><strong>SHA-3 系列</strong>: 新一代哈希标准，安全性更高</li>
        <li><strong>SM3</strong>: 中国国家密码管理局发布的国密算法</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, computed, watch } from 'vue';
import { UploadFilled, CopyDocument, Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import type { UploadFile } from 'element-plus';
import CryptoJS from 'crypto-js';
import { sm3 } from 'sm-crypto';

// 文件大小限制：100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type Algorithm =
  | 'MD5'
  | 'SHA1'
  | 'SHA256'
  | 'SHA384'
  | 'SHA512'
  | 'SHA3_224'
  | 'SHA3_256'
  | 'SHA3_384'
  | 'SHA3_512'
  | 'SM3';

type InputMode = 'text' | 'file';

// 算法标签映射
const algorithmLabels: Record<Algorithm, string> = {
  MD5: 'MD5',
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
  SHA3_224: 'SHA3-224',
  SHA3_256: 'SHA3-256',
  SHA3_384: 'SHA3-384',
  SHA3_512: 'SHA3-512',
  SM3: 'SM3',
};

// 输入模式
const inputMode = ref<InputMode>('text');

// 文本输入
const inputText = ref('');

// 文件上传
const selectedFile = ref<File | null>(null);

// 选中的算法
const selectedAlgorithm = ref<Algorithm>('SHA256');

// 选项
const options = reactive({
  uppercase: false,
});

// 计算结果
const hashResult = ref('');

// 计算状态
const isCalculating = ref(false);

// 复制状态
const copyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const copyButtonText = ref('复制');

// 算法标签
const selectedAlgorithmLabel = computed(() => algorithmLabels[selectedAlgorithm.value]);

// crypto-js 算法映射
type HashInput = string | CryptoJS.lib.WordArray;
const cryptoAlgoMap: Record<
  Exclude<Algorithm, 'SM3'>,
  (msg: HashInput) => CryptoJS.lib.WordArray
> = {
  MD5: CryptoJS.MD5,
  SHA1: CryptoJS.SHA1,
  SHA256: CryptoJS.SHA256,
  SHA384: CryptoJS.SHA384,
  SHA512: CryptoJS.SHA512,
  SHA3_224: (msg) => CryptoJS.SHA3(msg, { outputLength: 224 }),
  SHA3_256: (msg) => CryptoJS.SHA3(msg, { outputLength: 256 }),
  SHA3_384: (msg) => CryptoJS.SHA3(msg, { outputLength: 384 }),
  SHA3_512: (msg) => CryptoJS.SHA3(msg, { outputLength: 512 }),
};

// 计算哈希值（文本）
function calculateHashFromText(text: string, algorithm: Algorithm): string {
  let result: string;

  if (algorithm === 'SM3') {
    // SM3 使用 sm-crypto，需要转 hex
    const wordArray = CryptoJS.enc.Utf8.parse(text);
    const hexInput = CryptoJS.enc.Hex.stringify(wordArray);
    result = sm3(hexInput);
  } else {
    const algo = algorithm as Exclude<Algorithm, 'SM3'>;
    result = cryptoAlgoMap[algo](text).toString();
  }

  return options.uppercase ? result.toUpperCase() : result;
}

// 计算哈希值（文件）
function calculateHashFromFile(file: File, algorithm: Algorithm): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer));

        let result: string;
        if (algorithm === 'SM3') {
          const hexInput = CryptoJS.enc.Hex.stringify(wordArray);
          result = sm3(hexInput);
        } else {
          const algo = algorithm as Exclude<Algorithm, 'SM3'>;
          result = cryptoAlgoMap[algo](wordArray).toString();
        }

        resolve(options.uppercase ? result.toUpperCase() : result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 主计算函数（仅按钮触发）
async function calculateHash(): Promise<void> {
  // 验证输入
  if (inputMode.value === 'text' && !inputText.value.trim()) {
    return;
  }
  if (inputMode.value === 'file' && !selectedFile.value) {
    return;
  }

  isCalculating.value = true;

  try {
    if (inputMode.value === 'text') {
      hashResult.value = calculateHashFromText(inputText.value, selectedAlgorithm.value);
    } else {
      hashResult.value = await calculateHashFromFile(selectedFile.value!, selectedAlgorithm.value);
    }

    // 重置复制状态
    copyIcon.value = CopyDocument;
    copyButtonText.value = '复制';
  } finally {
    isCalculating.value = false;
  }
}

// 文件选择处理
function handleFileChange(uploadFile: UploadFile): void {
  if (uploadFile.raw) {
    if (uploadFile.raw.size > MAX_FILE_SIZE) {
      ElMessage.warning(`文件过大，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`);
      selectedFile.value = null;
      return;
    }
    selectedFile.value = uploadFile.raw;
  } else {
    selectedFile.value = null;
  }
  // 清空之前的计算结果
  hashResult.value = '';
}

// 切换输入模式时清空结果
watch(inputMode, () => {
  hashResult.value = '';
});

// 切换算法时清空结果
watch(selectedAlgorithm, () => {
  hashResult.value = '';
});

// 文件大小格式化
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

// 复制到剪贴板
function copyToClipboard(): void {
  if (!hashResult.value) return;

  navigator.clipboard
    .writeText(hashResult.value)
    .then(() => {
      copyIcon.value = Check;
      copyButtonText.value = '已复制!';

      setTimeout(() => {
        copyIcon.value = CopyDocument;
        copyButtonText.value = '复制';
      }, 2000);
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
}
</script>

<style lang="scss" scoped>
.hash-calculator {
  .el-breadcrumb {
    margin-top: 0.5em;
  }
}

.hash-calculator-container {
  margin-top: 1em;
}

.input-mode-switch {
  margin-bottom: 1em;
}

.input-section {
  margin-top: 1em;
  margin-bottom: 1em;
}

.text-input {
  :deep(textarea) {
    font-family: var(--font-mono, monospace);
  }
}

.file-upload {
  width: 100%;

  :deep(.el-upload-dragger) {
    width: 100%;
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

  .algorithm-select {
    flex: 1;
    max-width: 200px;
  }
}

.calculate-button {
  margin-top: 8px;
}

.hash-result {
  margin-top: 1em;

  .result-label {
    margin-bottom: 0.5em;
    font-weight: 500;
  }

  .hash-output {
    :deep(.el-input-group__append) {
      background-color: var(--im-color-miya);
      border-color: var(--im-color-miya);

      .el-button {
        color: white;
        border: none;
      }
    }
  }
}

.hash-calculator-info {
  line-height: 1.5em;

  ul {
    padding-left: 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
}
</style>
