<template>
  <div class="key-generator">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/tools' }">开发者工具</el-breadcrumb-item>
      <el-breadcrumb-item>密钥生成器</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="al-divider"></div>

    <div class="key-generator-container">
      <!-- 设置面板 -->
      <el-card class="settings-panel" shadow="never">
        <div class="setting-row">
          <span>算法类型:</span>
          <el-radio-group v-model="algorithmType">
            <el-radio-button value="EdDSA">EdDSA (推荐)</el-radio-button>
            <el-radio-button value="ECDSA">ECDSA</el-radio-button>
            <el-radio-button value="RSA">RSA</el-radio-button>
            <el-radio-button value="AES">AES（对称密钥）</el-radio-button>
          </el-radio-group>
        </div>

        <div class="setting-row">
          <span>密钥参数:</span>
          <el-radio-group v-model="keyParams">
            <el-radio-button
              v-for="option in keyParamsOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="setting-row" v-if="supportsSshFormat()">
          <span>SSH 注释:</span>
          <el-input v-model="sshComment" placeholder="key@example.com" class="ssh-comment-input" />
        </div>

        <el-button
          type="primary"
          @click="generateKeyPair"
          :loading="isGenerating"
          class="generate-button"
        >
          {{ algorithmType === 'AES' ? '生成密钥' : '生成密钥对' }}
        </el-button>
      </el-card>

      <!-- AES 密钥输出 -->
      <div
        v-if="algorithmType === 'AES' && (isGenerating || hasAesKey)"
        v-loading="isGenerating"
        element-loading-text="正在生成密钥..."
      >
        <div class="key-output">
          <div class="output-header">
            <span class="output-label">AES 密钥 - 请妥善保管，切勿泄露</span>
            <el-button size="small" @click="copyAesKey" :icon="aesKeyCopyIcon">
              {{ aesKeyCopyText }}
            </el-button>
          </div>

          <el-tabs v-model="aesKeyTab">
            <el-tab-pane label="Hex" name="hex">
              <el-input
                :model-value="aesKeyHex"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
            <el-tab-pane label="Base64" name="base64">
              <el-input
                :model-value="aesKeyBase64"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
            <el-tab-pane label="JWK" name="jwk">
              <el-input
                :model-value="aesKeyJwk"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 非对称密钥输出 -->
      <div
        v-if="algorithmType !== 'AES' && (isGenerating || hasPublicKey)"
        v-loading="isGenerating"
        element-loading-text="正在生成密钥..."
      >
        <!-- 公钥输出 -->
        <div class="key-output">
          <div class="output-header">
            <span class="output-label">公钥 (Public Key)</span>
            <el-button size="small" @click="copyPublicKey" :icon="publicKeyCopyIcon">
              {{ publicKeyCopyText }}
            </el-button>
          </div>

          <el-tabs v-model="publicKeyTab">
            <el-tab-pane label="PEM" name="pem">
              <el-input
                :model-value="publicKeyPem"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
            <el-tab-pane label="SSH" name="ssh">
              <el-input
                :model-value="publicKeySsh"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
            <el-tab-pane label="JWK" name="jwk">
              <el-input
                :model-value="publicKeyJwk"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
          </el-tabs>
        </div>

        <!-- 私钥输出 -->
        <div class="key-output" v-if="isGenerating || hasPrivateKey">
          <div class="output-header">
            <span class="output-label">私钥 (Private Key) - 请妥善保管，切勿泄露</span>
            <el-button size="small" @click="copyPrivateKey" :icon="privateKeyCopyIcon">
              {{ privateKeyCopyText }}
            </el-button>
          </div>

          <el-tabs v-model="privateKeyTab">
            <el-tab-pane label="PEM" name="pem">
              <el-input
                :model-value="privateKeyPem"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
            <el-tab-pane label="JWK" name="jwk">
              <el-input
                :model-value="privateKeyJwk"
                type="textarea"
                :rows="10"
                readonly
                class="mono-output font-mono"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 安全提示 -->
      <el-alert title="安全提示" type="warning" :closable="false" class="security-alert">
        <ul class="security-tips">
          <li>私钥具有高度敏感性，请妥善保管，切勿泄露给他人</li>
          <li>建议将私钥保存到安全的密钥管理器或加密存储中</li>
          <li>此页面生成后不会存储任何密钥数据，刷新页面将丢失</li>
        </ul>
      </el-alert>
    </div>

    <!-- 说明信息 -->
    <div class="al-divider"></div>
    <div class="key-generator-info">
      <ul>
        <li>本功能不涉及远程请求，仅本地运行</li>
        <li>使用 Web Crypto API 浏览器原生密码学实现，安全可靠</li>
        <li><strong>Ed25519</strong>: 现代高效签名算法，SSH/Git/GPG 广泛使用，推荐使用</li>
        <li><strong>ECDSA</strong>: 椭圆曲线签名算法，TLS/SSL 证书常用</li>
        <li><strong>RSA</strong>: 传统签名算法，兼容性最广，但密钥较大</li>
        <li><strong>AES</strong>: 对称加密算法，用于数据加密/解密，推荐 256 位</li>
        <li><strong>PEM 格式</strong>: 标准格式，OpenSSL 兼容</li>
        <li><strong>SSH 格式</strong>: OpenSSH 兼容公钥格式，可直接添加到 authorized_keys</li>
        <li><strong>JWK 格式</strong>: JSON Web Key，适合 Web 应用</li>
        <li><strong>Hex/Base64 格式</strong>: AES 密钥常用格式，便于存储和传输</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch } from 'vue';
import { CopyDocument, Check } from '@element-plus/icons-vue';

type AlgorithmType = 'EdDSA' | 'ECDSA' | 'RSA' | 'AES';
type KeyParams = 'Ed25519' | 'P-256' | 'P-384' | 'P-521' | '2048' | '4096' | '128' | '192' | '256';

// 算法类型
const algorithmType = ref<AlgorithmType>('EdDSA');

// 密钥参数
const keyParams = ref<KeyParams>('Ed25519');

// SSH 注释
const sshComment = ref('key@example.com');

// Tab 状态
const publicKeyTab = ref('pem');
const privateKeyTab = ref('pem');

// 密钥参数选项
const keyParamsOptions = computed(() => {
  if (algorithmType.value === 'EdDSA') {
    return [{ label: 'Ed25519', value: 'Ed25519' }];
  } else if (algorithmType.value === 'ECDSA') {
    return [
      { label: 'P-256 (推荐)', value: 'P-256' },
      { label: 'P-384', value: 'P-384' },
      { label: 'P-521', value: 'P-521' },
    ];
  } else if (algorithmType.value === 'RSA') {
    return [
      { label: '2048 位', value: '2048' },
      { label: '4096 位 (推荐)', value: '4096' },
    ];
  } else if (algorithmType.value === 'AES') {
    return [
      { label: '128 位', value: '128' },
      { label: '192 位', value: '192' },
      { label: '256 位 (推荐)', value: '256' },
    ];
  }
  return [];
});

// 算法类型切换时，自动选择默认参数
watch(algorithmType, (newType) => {
  if (newType === 'EdDSA') {
    keyParams.value = 'Ed25519';
  } else if (newType === 'ECDSA') {
    keyParams.value = 'P-256';
  } else if (newType === 'RSA') {
    keyParams.value = '4096';
  } else if (newType === 'AES') {
    keyParams.value = '256';
  }
});

// 生成状态
const isGenerating = ref(false);

// 公钥输出
const publicKeyPem = ref('');
const publicKeyJwk = ref('');
const publicKeySsh = ref('');

// 私钥输出
const privateKeyPem = ref('');
const privateKeyJwk = ref('');

// AES 密钥输出
const aesKeyHex = ref('');
const aesKeyBase64 = ref('');
const aesKeyJwk = ref('');
const aesKeyTab = ref('hex');

// 是否有输出
const hasPublicKey = computed(() => publicKeyPem.value || publicKeyJwk.value || publicKeySsh.value);
const hasPrivateKey = computed(() => privateKeyPem.value || privateKeyJwk.value);
const hasAesKey = computed(() => aesKeyHex.value || aesKeyBase64.value || aesKeyJwk.value);

// 复制状态 - 公钥
const publicKeyCopyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const publicKeyCopyText = ref('复制');

// 复制状态 - 私钥
const privateKeyCopyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const privateKeyCopyText = ref('复制');

// 复制状态 - AES 密钥
const aesKeyCopyIcon = shallowRef<typeof CopyDocument>(CopyDocument);
const aesKeyCopyText = ref('复制');

// 是否支持 SSH 格式
function supportsSshFormat(): boolean {
  if (algorithmType.value === 'EdDSA') return true;
  if (algorithmType.value === 'ECDSA') return true; // P-256, P-384, P-521 都支持
  if (algorithmType.value === 'RSA') return true;
  return false; // AES 不支持 SSH 格式
}

// 检查浏览器是否支持 Ed25519
async function checkEd25519Support(): Promise<boolean> {
  try {
    await crypto.subtle.generateKey('Ed25519' as unknown as EcKeyGenParams, true, [
      'sign',
      'verify',
    ]);
    return true;
  } catch {
    return false;
  }
}

// 生成密钥对
async function generateKeyPair(): Promise<void> {
  isGenerating.value = true;

  // 不清空之前的输出，保持显示旧值 + loading 效果

  try {
    // AES 对称密钥
    if (algorithmType.value === 'AES') {
      const aesKey = await crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: parseInt(keyParams.value),
        },
        true,
        ['encrypt', 'decrypt'],
      );

      // 导出 Raw -> Hex
      const rawKey = await crypto.subtle.exportKey('raw', aesKey);
      const hexBytes = new Uint8Array(rawKey);
      aesKeyHex.value = Array.from(hexBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Raw -> Base64
      aesKeyBase64.value = arrayBufferToBase64(rawKey);

      // JWK
      const jwk = await crypto.subtle.exportKey('jwk', aesKey);
      aesKeyJwk.value = JSON.stringify(jwk, null, 2);

      // 重置复制状态
      aesKeyCopyIcon.value = CopyDocument;
      aesKeyCopyText.value = '复制';

      return;
    }

    // 非对称密钥
    let keyPair: CryptoKeyPair;
    let algorithmName: string;

    // 检查 Ed25519 支持
    if (keyParams.value === 'Ed25519') {
      const supported = await checkEd25519Support();
      if (!supported) {
        ElMessage.error('您的浏览器不支持 Ed25519，请使用 Chrome 113+ 或 Firefox 118+');
        return;
      }
      keyPair = (await crypto.subtle.generateKey('Ed25519' as unknown as EcKeyGenParams, true, [
        'sign',
        'verify',
      ])) as CryptoKeyPair;
      algorithmName = 'Ed25519';
    } else if (algorithmType.value === 'ECDSA') {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: keyParams.value,
        },
        true,
        ['sign', 'verify'],
      );
      algorithmName = `ECDSA_${keyParams.value.replace('-', '_')}`;
    } else {
      // RSA
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: parseInt(keyParams.value),
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify'],
      );
      algorithmName = `RSA${keyParams.value}`;
    }

    // 导出公钥 PEM
    const spkiBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    publicKeyPem.value = formatPem(spkiBuffer, 'PUBLIC KEY');

    // 导出公钥 JWK
    const pubJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    publicKeyJwk.value = JSON.stringify(pubJwk, null, 2);

    // 导出 SSH 公钥（如果支持）
    if (supportsSshFormat()) {
      publicKeySsh.value = await exportSshPublicKey(keyPair.publicKey, algorithmName);
    }

    // 导出私钥 PEM
    try {
      const pkcs8Buffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      privateKeyPem.value = formatPem(pkcs8Buffer, 'PRIVATE KEY');
    } catch {
      privateKeyPem.value = '此算法的私钥 PEM 格式在此浏览器中不受支持，请使用 JWK 格式';
    }

    // 导出私钥 JWK
    const privJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    privateKeyJwk.value = JSON.stringify(privJwk, null, 2);

    // 重置复制状态
    publicKeyCopyIcon.value = CopyDocument;
    publicKeyCopyText.value = '复制';
    privateKeyCopyIcon.value = CopyDocument;
    privateKeyCopyText.value = '复制';
  } catch (error) {
    console.error('Key generation error:', error);
    ElMessage.error('密钥生成失败，请检查浏览器是否支持所选算法');
  } finally {
    isGenerating.value = false;
  }
}

// 复制公钥
function copyPublicKey(): void {
  let text = '';
  if (publicKeyTab.value === 'pem' && publicKeyPem.value) {
    text = publicKeyPem.value;
  } else if (publicKeyTab.value === 'ssh' && publicKeySsh.value) {
    text = publicKeySsh.value;
  } else if (publicKeyTab.value === 'jwk' && publicKeyJwk.value) {
    text = publicKeyJwk.value;
  }

  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      publicKeyCopyIcon.value = Check;
      publicKeyCopyText.value = '已复制!';
      setTimeout(() => {
        publicKeyCopyIcon.value = CopyDocument;
        publicKeyCopyText.value = '复制';
      }, 2000);
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
}

// 复制私钥
function copyPrivateKey(): void {
  let text = '';
  if (privateKeyTab.value === 'pem' && privateKeyPem.value) {
    text = privateKeyPem.value;
  } else if (privateKeyTab.value === 'jwk' && privateKeyJwk.value) {
    text = privateKeyJwk.value;
  }

  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      privateKeyCopyIcon.value = Check;
      privateKeyCopyText.value = '已复制!';
      setTimeout(() => {
        privateKeyCopyIcon.value = CopyDocument;
        privateKeyCopyText.value = '复制';
      }, 2000);
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
}

// 复制 AES 密钥
function copyAesKey(): void {
  let text = '';
  if (aesKeyTab.value === 'hex' && aesKeyHex.value) {
    text = aesKeyHex.value;
  } else if (aesKeyTab.value === 'base64' && aesKeyBase64.value) {
    text = aesKeyBase64.value;
  } else if (aesKeyTab.value === 'jwk' && aesKeyJwk.value) {
    text = aesKeyJwk.value;
  }

  if (!text) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      aesKeyCopyIcon.value = Check;
      aesKeyCopyText.value = '已复制!';
      setTimeout(() => {
        aesKeyCopyIcon.value = CopyDocument;
        aesKeyCopyText.value = '复制';
      }, 2000);
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制');
    });
}

// 格式化 PEM
function formatPem(buffer: ArrayBuffer, label: string): string {
  const base64 = arrayBufferToBase64(buffer);
  const lines = base64.match(/.{1,64}/g) || [];
  return `-----BEGIN ${label}-----\n${lines.join('\n')}\n-----END ${label}-----`;
}

// ArrayBuffer 转 Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

// 导出 SSH 公钥格式
async function exportSshPublicKey(publicKey: CryptoKey, algorithm: string): Promise<string> {
  const spkiBuffer = await crypto.subtle.exportKey('spki', publicKey);
  const spkiBytes = new Uint8Array(spkiBuffer);

  let keyType: string;
  let keyData: Uint8Array;

  if (algorithm === 'Ed25519') {
    keyType = 'ssh-ed25519';
    keyData = spkiBytes.slice(-32);
  } else if (algorithm === 'ECDSA_P_256') {
    keyType = 'ecdsa-sha2-nistp256';
    const jwk = await crypto.subtle.exportKey('jwk', publicKey);
    keyData = extractEcdsaPublicKey(jwk, 'nistp256');
  } else if (algorithm === 'ECDSA_P_384') {
    keyType = 'ecdsa-sha2-nistp384';
    const jwk = await crypto.subtle.exportKey('jwk', publicKey);
    keyData = extractEcdsaPublicKey(jwk, 'nistp384');
  } else if (algorithm === 'ECDSA_P_521') {
    keyType = 'ecdsa-sha2-nistp521';
    const jwk = await crypto.subtle.exportKey('jwk', publicKey);
    keyData = extractEcdsaPublicKey(jwk, 'nistp521');
  } else if (algorithm.startsWith('RSA')) {
    keyType = 'ssh-rsa';
    keyData = extractRsaPublicKey(spkiBytes);
  } else {
    return '此算法不支持 SSH 格式';
  }

  const encoder = new TextEncoder();
  const keyTypeBytes = encoder.encode(keyType);

  const ssb = new Array<number>();
  writeUint32(ssb, keyTypeBytes.length);
  ssb.push(...keyTypeBytes);
  writeUint32(ssb, keyData.length);
  ssb.push(...keyData);

  const sshBytes = new Uint8Array(ssb);
  const base64Key = arrayBufferToBase64(sshBytes.buffer);

  // 添加注释
  const comment = sshComment.value.trim() || 'key@example.com';
  return `${keyType} ${base64Key} ${comment}`;
}

// 写入 32 位大端序整数
function writeUint32(arr: number[], value: number): void {
  arr.push((value >> 24) & 0xff);
  arr.push((value >> 16) & 0xff);
  arr.push((value >> 8) & 0xff);
  arr.push(value & 0xff);
}

// 从 JWK 提取 ECDSA 公钥
function extractEcdsaPublicKey(jwk: JsonWebKey, curveId: string): Uint8Array {
  const x = base64UrlToUint8Array(jwk.x!);
  const y = base64UrlToUint8Array(jwk.y!);

  const encoder = new TextEncoder();
  const curveBytes = encoder.encode(curveId);

  const result = new Array<number>();
  writeUint32(result, curveBytes.length);
  result.push(...curveBytes);
  const pointData = new Uint8Array(1 + x.length + y.length);
  pointData[0] = 0x04;
  pointData.set(x, 1);
  pointData.set(y, 1 + x.length);
  writeUint32(result, pointData.length);
  result.push(...pointData);

  return new Uint8Array(result);
}

// 从 SPKI 提取 RSA 公钥
function extractRsaPublicKey(spki: Uint8Array): Uint8Array {
  let offset = 0;

  if (spki[offset] === 0x30) {
    offset++;
    offset += getLengthBytes(spki, offset);
  }

  if (spki[offset] === 0x30) {
    offset++;
    const algoLen = getLengthValue(spki, offset);
    offset += getLengthBytes(spki, offset) + algoLen;
  }

  if (spki[offset] === 0x03) {
    offset++;
    offset += getLengthBytes(spki, offset);
    offset++;

    const rsaN = extractRsaComponent(spki, offset, 0);
    const rsaE = extractRsaComponent(spki, offset, 1);

    if (rsaN && rsaE) {
      return encodeRsaSsh(rsaN, rsaE);
    }
  }

  return new Uint8Array(0);
}

// 获取 ASN.1 长度字节数
function getLengthBytes(arr: Uint8Array, offset: number): number {
  if (arr[offset]! < 0x80) return 1;
  return (arr[offset]! & 0x7f) + 1;
}

// 获取 ASN.1 长度值
function getLengthValue(arr: Uint8Array, offset: number): number {
  if (arr[offset]! < 0x80) return arr[offset]!;
  const lenBytes = arr[offset]! & 0x7f;
  let len = 0;
  for (let i = 0; i < lenBytes; i++) {
    len = (len << 8) | arr[offset + 1 + i]!;
  }
  return len;
}

// 提取 RSA 组件
function extractRsaComponent(
  spki: Uint8Array,
  seqOffset: number,
  index: number,
): Uint8Array | null {
  let offset = seqOffset;

  if (spki[offset] !== 0x30) return null;
  offset++;
  offset += getLengthBytes(spki, offset);

  for (let i = 0; i < index; i++) {
    if (spki[offset] === 0x02) {
      offset++;
      const len = getLengthValue(spki, offset);
      offset += getLengthBytes(spki, offset) + len;
    }
  }

  if (spki[offset] === 0x02) {
    offset++;
    const len = getLengthValue(spki, offset);
    offset += getLengthBytes(spki, offset);

    if (spki[offset] === 0x00 && len > 1) {
      return spki.slice(offset + 1, offset + len);
    }
    return spki.slice(offset, offset + len);
  }

  return null;
}

// 编码 RSA SSH 公钥
function encodeRsaSsh(n: Uint8Array, e: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const keyTypeBytes = encoder.encode('ssh-rsa');

  const result = new Array<number>();
  writeUint32(result, keyTypeBytes.length);
  result.push(...keyTypeBytes);
  writeUint32(result, e.length);
  result.push(...e);
  const nWithZero = n[0]! & 0x80 ? [0, ...n] : [...n];
  writeUint32(result, nWithZero.length);
  result.push(...nWithZero);

  return new Uint8Array(result);
}

// Base64URL 转 Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  const paddedBase64 = padding ? base64 + '='.repeat(4 - padding) : base64;
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
</script>

<style lang="scss" scoped>
.key-generator {
  .el-breadcrumb {
    margin-top: 0.5em;
  }
}

.key-generator-container {
  margin-top: 1em;
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

  .ssh-comment-input {
    flex: 1;
    max-width: 300px;
  }
}

.generate-button {
  margin-top: 8px;
}

.key-output {
  margin-top: 1.5em;

  .output-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5em;

    .output-label {
      font-weight: bold;
    }
  }

  .mono-output {
    :deep(textarea) {
      font-family: var(--font-mono, monospace);
      font-size: 13px;
    }
  }
}

.security-alert {
  margin-top: 1em;

  .security-tips {
    padding-left: 1.5em;
    margin: 0.5em 0 0 0;

    li {
      margin-bottom: 0.3em;
    }
  }
}

.key-generator-info {
  line-height: 1.5em;

  ul {
    padding-left: 1.5em;
  }

  li {
    margin-bottom: 0.3em;
  }
}
</style>
