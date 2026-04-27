<template>
  <div class="hmac-calculator">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/tools' }">开发者工具</el-breadcrumb-item>
      <el-breadcrumb-item>HMAC 消息验证码计算器</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>

    <div class="hmac-calculator-container">
      <!-- 密钥输入区 -->
      <div class="key-section">
        <span class="section-label">密钥:</span>
        <div class="key-encoding-switch">
          <el-radio-group v-model="keyEncoding">
            <el-radio-button value="text">明文</el-radio-button>
            <el-radio-button value="hex">Hex</el-radio-button>
            <el-radio-button value="base64">Base64</el-radio-button>
          </el-radio-group>
        </div>

        <el-input
          v-model="keyInput"
          type="textarea"
          :rows="2"
          placeholder="请输入密钥..."
          class="key-input font-mono"
        />
      </div>

      <!-- 消息输入区 -->
      <div class="message-section">
        <span class="section-label">消息:</span>
        <div class="input-mode-switch">
          <el-radio-group v-model="inputMode">
            <el-radio-button value="text">文本输入</el-radio-button>
            <el-radio-button value="file">文件上传</el-radio-button>
          </el-radio-group>
        </div>

        <!-- 文本消息输入 -->
        <el-input
          v-show="inputMode === 'text'"
          v-model="inputText"
          type="textarea"
          :rows="4"
          placeholder="请输入要计算 HMAC 的消息..."
          class="text-input font-mono"
        />

        <!-- 文件上传 -->
        <el-upload
          v-show="inputMode === 'file'"
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
              <el-option label="HMAC-SHA-256" value="SHA256" />
              <el-option label="HMAC-SHA-512" value="SHA512" />
              <el-option label="HMAC-SHA3" value="SHA3" />
            </el-option-group>
            <el-option-group label="HMAC-SHA 系列">
              <el-option label="HMAC-SHA-1" value="SHA1" />
              <el-option label="HMAC-SHA-384" value="SHA384" />
            </el-option-group>
            <el-option-group label="其他">
              <el-option label="HMAC-MD5" value="MD5" />
              <el-option label="HMAC-SM3" value="SM3" />
            </el-option-group>
          </el-select>
        </div>

        <div class="setting-row checkboxes">
          <el-checkbox v-model="options.uppercase">大写输出</el-checkbox>
          <el-checkbox v-model="options.base64Output">Base64 输出</el-checkbox>
        </div>

        <el-button
          type="primary"
          @click="calculateHmac"
          :loading="isCalculating"
          class="calculate-button"
        >
          计算 HMAC
        </el-button>
      </el-card>

      <!-- 计算结果区 -->
      <div class="hmac-result" v-if="hmacResult">
        <div class="result-label">计算结果 ({{ selectedAlgorithmLabel }}):</div>
        <el-input :model-value="hmacResult" readonly class="hmac-output font-mono">
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
    <div class="hmac-calculator-info">
      <ul>
        <li>本功能不涉及远程请求，仅本地运行</li>
        <li>HMAC（Hash-based Message Authentication Code）是基于哈希的消息认证码</li>
        <li>需要输入密钥和消息两部分数据</li>
        <li><strong>密钥编码</strong>: 明文直接使用，Hex/Base64 会先解码再使用</li>
        <li><strong>HMAC-MD5/SHA-1</strong>: 已不安全，仅适用于历史结果校验</li>
        <li><strong>HMAC-SHA-2 系列</strong>: 广泛使用的安全算法</li>
        <li><strong>HMAC-SHA-3 系列</strong>: 新一代哈希标准，安全性更高</li>
        <li><strong>HMAC-SM3</strong>: 中国国家密码管理局发布的国密算法</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, computed, watch } from 'vue';
import { UploadFilled, CopyDocument, Check } from '@element-plus/icons-vue';
import type { UploadFile } from 'element-plus';
import CryptoJS from 'crypto-js';
import { sm3 } from 'sm-crypto';

// 文件大小限制：100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type Algorithm = 'MD5' | 'SHA1' | 'SHA256' | 'SHA384' | 'SHA512' | 'SHA3' | 'SM3';

type InputMode = 'text' | 'file';

type KeyEncoding = 'text' | 'hex' | 'base64';

// 算法标签映射
const algorithmLabels: Record<Algorithm, string> = {
  MD5: 'HMAC-MD5',
  SHA1: 'HMAC-SHA-1',
  SHA256: 'HMAC-SHA-256',
  SHA384: 'HMAC-SHA-384',
  SHA512: 'HMAC-SHA-512',
  SHA3: 'HMAC-SHA3',
  SM3: 'HMAC-SM3',
};

// 密钥输入
const keyInput = ref('');
const keyEncoding = ref<KeyEncoding>('text');

// 输入模式
const inputMode = ref<InputMode>('text');

// 文本消息输入
const inputText = ref('');

// 文件上传
const selectedFile = ref<File | null>(null);

// 选中的算法
const selectedAlgorithm = ref<Algorithm>('SHA256');

// 选项
const options = reactive({
  uppercase: false,
  base64Output: false,
});

// 计算结果
const hmacResult = ref('');

// 计算状态
const isCalculating = ref(false);

// 复制状态
const copyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const copyButtonText = ref('复制');

// 算法标签
const selectedAlgorithmLabel = computed(() => algorithmLabels[selectedAlgorithm.value]);

// CryptoJS HMAC 算法映射（SHA3 需要使用底层 API）
type HashInput = string | CryptoJS.lib.WordArray;

const cryptoHmacAlgoMap: Record<
  Exclude<Algorithm, 'SM3'>,
  (msg: HashInput, key: HashInput) => CryptoJS.lib.WordArray
> = {
  MD5: CryptoJS.HmacMD5,
  SHA1: CryptoJS.HmacSHA1,
  SHA256: CryptoJS.HmacSHA256,
  SHA384: CryptoJS.HmacSHA384,
  SHA512: CryptoJS.HmacSHA512,
  SHA3: CryptoJS.HmacSHA3,
};

// 解析密钥
function parseKey(key: string, encoding: KeyEncoding): CryptoJS.lib.WordArray | null {
  try {
    switch (encoding) {
      case 'text':
        return CryptoJS.enc.Utf8.parse(key);
      case 'hex':
        // 验证是否为有效的 hex 字符串
        if (!/^[0-9a-fA-F]*$/.test(key) || key.length % 2 !== 0) {
          return null;
        }
        return CryptoJS.enc.Hex.parse(key);
      case 'base64':
        return CryptoJS.enc.Base64.parse(key);
    }
  } catch {
    return null;
  }
}

// 格式化输出结果
function formatOutput(result: CryptoJS.lib.WordArray): string {
  let output: string;
  if (options.base64Output) {
    output = result.toString(CryptoJS.enc.Base64);
  } else {
    output = result.toString(CryptoJS.enc.Hex);
  }
  return options.uppercase ? output.toUpperCase() : output;
}

// 计算 HMAC（文本）
function calculateHmacFromText(
  message: string,
  key: CryptoJS.lib.WordArray,
  algorithm: Algorithm,
): string {
  const messageWordArray = CryptoJS.enc.Utf8.parse(message);

  if (algorithm === 'SM3') {
    // SM3-HMAC: sm-crypto 要求 hex 输入
    const messageHex = CryptoJS.enc.Hex.stringify(messageWordArray);
    const keyHex = CryptoJS.enc.Hex.stringify(key);
    let result = sm3(messageHex, { key: keyHex });
    if (options.base64Output) {
      // SM3 结果是 hex，需要转换为 Base64
      const wordArray = CryptoJS.enc.Hex.parse(result);
      result = CryptoJS.enc.Base64.stringify(wordArray);
    }
    return options.uppercase ? result.toUpperCase() : result;
  }

  const algo = algorithm as Exclude<Algorithm, 'SM3'>;
  const hmacResult = cryptoHmacAlgoMap[algo](messageWordArray, key);
  return formatOutput(hmacResult);
}

// 计算 HMAC（文件）
function calculateHmacFromFile(
  file: File,
  key: CryptoJS.lib.WordArray,
  algorithm: Algorithm,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const messageWordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer));

        if (algorithm === 'SM3') {
          const messageHex = CryptoJS.enc.Hex.stringify(messageWordArray);
          const keyHex = CryptoJS.enc.Hex.stringify(key);
          let result = sm3(messageHex, { key: keyHex });
          if (options.base64Output) {
            const wordArray = CryptoJS.enc.Hex.parse(result);
            result = CryptoJS.enc.Base64.stringify(wordArray);
          }
          resolve(options.uppercase ? result.toUpperCase() : result);
        } else {
          const algo = algorithm as Exclude<Algorithm, 'SM3'>;
          const hmacResult = cryptoHmacAlgoMap[algo](messageWordArray, key);
          resolve(formatOutput(hmacResult));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

// 主计算函数（仅按钮触发）
async function calculateHmac(): Promise<void> {
  // 验证密钥
  if (!keyInput.value.trim()) {
    ElMessage.warning('请输入密钥');
    return;
  }

  const key = parseKey(keyInput.value, keyEncoding.value);
  if (key === null) {
    if (keyEncoding.value === 'hex') {
      ElMessage.warning('密钥 Hex 格式无效，请输入有效的十六进制字符串');
    } else {
      ElMessage.warning('密钥格式无效');
    }
    return;
  }

  // 验证消息输入
  if (inputMode.value === 'text' && !inputText.value) {
    ElMessage.warning('请输入消息');
    return;
  }
  if (inputMode.value === 'file' && !selectedFile.value) {
    ElMessage.warning('请选择文件');
    return;
  }

  isCalculating.value = true;

  try {
    if (inputMode.value === 'text') {
      hmacResult.value = calculateHmacFromText(inputText.value, key, selectedAlgorithm.value);
    } else {
      hmacResult.value = await calculateHmacFromFile(
        selectedFile.value!,
        key,
        selectedAlgorithm.value,
      );
    }

    // 重置复制状态
    copyIcon.value = CopyDocument;
    copyButtonText.value = '复制';
  } catch (error) {
    ElMessage.error('计算失败，请检查输入');
    console.error('HMAC calculation error:', error);
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
  hmacResult.value = '';
}

// 切换输入模式时清空结果
watch(inputMode, () => {
  hmacResult.value = '';
});

// 切换算法时清空结果
watch(selectedAlgorithm, () => {
  hmacResult.value = '';
});

// 切换密钥编码时清空结果
watch(keyEncoding, () => {
  hmacResult.value = '';
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
  if (!hmacResult.value) return;

  navigator.clipboard
    .writeText(hmacResult.value)
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
.hmac-calculator {
  .el-breadcrumb {
    margin-top: 0.5em;
  }
}

.hmac-calculator-container {
  margin-top: 1em;
}

.key-section {
  margin-bottom: 1.5em;

  .section-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5em;
  }

  .key-encoding-switch {
    display: block;
    margin-bottom: 1em;
    margin-top: 1em;
  }

  .key-input {
    :deep(textarea) {
      font-family: var(--font-mono, monospace);
    }
  }
}

.message-section {
  margin-top: 1.5em;
  margin-bottom: 1.5em;

  .section-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5em;
  }

  .input-mode-switch {
    display: block;
    margin-bottom: 1em;
    margin-top: 0.5em;
  }
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

  &.checkboxes {
    gap: 1.5em;
  }
}

.calculate-button {
  margin-top: 8px;
}

.hmac-result {
  margin-top: 1em;

  .result-label {
    margin-bottom: 0.5em;
    font-weight: 500;
  }

  .hmac-output {
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

.hmac-calculator-info {
  line-height: 1.5em;

  ul {
    padding-left: 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
}
</style>
