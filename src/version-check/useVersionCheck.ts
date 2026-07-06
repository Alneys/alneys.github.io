import { ref, onMounted, onUnmounted, h } from 'vue';

/**
 * 版本检测配置
 */
const VERSION_ENDPOINT = '/version.json';
const FIRST_CHECK_DELAY = 10_000; // 首次检测延迟：10 秒
const CHECK_INTERVAL = 20 * 60 * 1000; // 定时轮询间隔：20 分钟
const CHECK_COOLDOWN = 60_000; // 检测冷却时间：60 秒

/**
 * 版本信息结构
 */
export interface VersionInfo {
  buildId: string;
  publishedAt: string;
}

// ============================================================================
// 模块级单例状态
// ============================================================================

/** 共享的响应式状态 */
const currentBuildId = ref('');
const latestBuildId = ref('');
const latestPublishedAt = ref('');

/** 定时器引用 */
let checkTimer: ReturnType<typeof setInterval> | null = null;
let firstCheckTimer: ReturnType<typeof setTimeout> | null = null;

/** 实例计数器，用于引用计数 */
let instanceCount = 0;

/** 轮询是否已启动 */
let isPollingStarted = false;

/** 检测状态锁，防止并发检测 */
let checking = false;

/** 上次检测时间戳，用于冷却时间控制 */
let lastCheckAt = 0;

/** 用户忽略的版本 ID */
let dismissedBuildId = '';

/** 通知实例 */
let notificationInstance: ReturnType<typeof ElNotification> | null = null;

// ============================================================================
// 版本检测组合式函数
// ============================================================================

/**
 * 版本检测组合式函数
 *
 * 检测逻辑：
 * 1. 页面加载后延迟 10 秒进行首次检测
 * 2. 每 20 分钟定时检测一次
 * 3. 页面重新可见时检测（visibilitychange）
 * 4. 检测冷却时间 60 秒，避免频繁请求
 *
 * 单例保证：
 * - 全局只启动一个轮询实例，多个组件调用共享同一状态
 */
export function useVersionCheck() {
  /**
   * 获取本地版本信息（构建时注入到 window.__APP_VERSION__）
   */
  const getLocalVersion = (): VersionInfo | null => {
    const globalVersion = (window as unknown as { __APP_VERSION__?: VersionInfo }).__APP_VERSION__;
    if (globalVersion && globalVersion.buildId) {
      return globalVersion;
    }
    return null;
  };

  /**
   * 从服务器获取最新版本信息
   */
  const fetchLatestVersion = async (): Promise<VersionInfo | null> => {
    try {
      const url = new URL(VERSION_ENDPOINT, window.location.href);
      url.searchParams.set('t', String(Date.now())); // 添加时间戳防止缓存
      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        console.warn('[version-check] 获取版本信息失败:', response.status);
        return null;
      }
      const data = await response.json();
      if (!data || !data.buildId) {
        console.warn('[version-check] 版本信息格式无效:', data);
        return null;
      }
      return data as VersionInfo;
    } catch (error) {
      console.warn('[version-check] 获取版本信息异常:', error);
      return null;
    }
  };

  /**
   * 判断是否应该显示更新提示
   */
  const shouldShowPrompt = (remote: VersionInfo): boolean => {
    if (!remote.buildId) return false;
    if (remote.buildId === currentBuildId.value) return false;
    if (remote.buildId === dismissedBuildId) return false;
    return true;
  };

  /**
   * 显示更新通知
   */
  const showUpdateNotification = () => {
    if (notificationInstance) {
      notificationInstance.close();
    }

    notificationInstance = ElNotification({
      title: '检测到新版本',
      message: h('div', [
        h('p', { style: { margin: '0 0 12px 0' } }, '建议刷新页面获取最新内容'),
        h(
          ElButton,
          {
            type: 'primary',
            onClick: reload,
          },
          () => '立即刷新',
        ),
      ]),
      position: 'top-right',
      duration: 0,
      showClose: true,
      customClass: 'version-check-notification',
    });
    if (import.meta.env.DEV) {
      console.log('[version-check] 已显示更新通知');
    }
  };

  /**
   * 执行版本检测
   * @param force 是否强制检测（忽略冷却时间）
   */
  const checkForUpdate = async (force = false) => {
    if (checking) {
      if (import.meta.env.DEV) {
        console.log('[version-check] 检测进行中，跳过');
      }
      return;
    }
    const now = Date.now();
    if (!force && now - lastCheckAt < CHECK_COOLDOWN) {
      if (import.meta.env.DEV) {
        console.log('[version-check] 冷却时间内，跳过检测');
      }
      return;
    }

    checking = true;
    lastCheckAt = now;
    console.log('[version-check] 开始检测版本更新...');

    try {
      const local = getLocalVersion();
      if (local) {
        currentBuildId.value = local.buildId;
        console.log('[version-check] 本地版本:', local.buildId);
      } else {
        console.log('[version-check] 未找到本地版本信息');
      }

      const remote = await fetchLatestVersion();
      if (!remote) return;

      console.log('[version-check] 远程版本:', remote.buildId);

      if (shouldShowPrompt(remote)) {
        console.log('[version-check] 检测到新版本，显示更新提示');
        latestBuildId.value = remote.buildId;
        latestPublishedAt.value = remote.publishedAt || '';
        showUpdateNotification();
      } else {
        console.log('[version-check] 版本已是最新');
      }
    } finally {
      checking = false;
    }
  };

  /**
   * 刷新页面加载新版本
   */
  const reload = () => {
    if (notificationInstance) {
      notificationInstance.close();
      notificationInstance = null;
    }
    window.location.reload();
  };

  /**
   * 忽略当前版本的更新提示
   */
  const dismiss = () => {
    dismissedBuildId = latestBuildId.value;
    if (notificationInstance) {
      notificationInstance.close();
      notificationInstance = null;
    }
    console.log('[version-check] 用户忽略版本:', dismissedBuildId);
  };

  /**
   * 页面可见性变化时触发检测
   */
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      if (import.meta.env.DEV) {
        console.log('[version-check] 页面重新可见，触发检测');
      }
      checkForUpdate(false);
    }
  };

  onMounted(() => {
    instanceCount++;

    // 初始化本地版本
    const local = getLocalVersion();
    if (local && !currentBuildId.value) {
      currentBuildId.value = local.buildId;
      console.log('[version-check] 初始化，本地版本:', local.buildId);
    }

    // 仅在首个实例时启动轮询
    if (!isPollingStarted) {
      isPollingStarted = true;

      // 延迟首次检测
      firstCheckTimer = setTimeout(() => {
        firstCheckTimer = null;
        checkForUpdate(true);
      }, FIRST_CHECK_DELAY);

      // 定时轮询检测
      checkTimer = setInterval(() => {
        checkForUpdate(false);
      }, CHECK_INTERVAL);

      // 页面可见性变化检测
      document.addEventListener('visibilitychange', handleVisibilityChange);

      if (import.meta.env.DEV) {
        console.log(
          '[version-check] 轮询已启动，首次检测延迟:',
          FIRST_CHECK_DELAY / 1000,
          '秒，轮询间隔:',
          CHECK_INTERVAL / 60000,
          '分钟',
        );
      }
    }

    if (import.meta.env.DEV) {
      console.log('[version-check] 实例挂载，当前实例数:', instanceCount);
    }
  });

  onUnmounted(() => {
    instanceCount--;

    if (import.meta.env.DEV) {
      console.log('[version-check] 实例卸载，当前实例数:', instanceCount);
    }

    // 只有当所有实例都卸载时才停止轮询
    if (instanceCount <= 0) {
      instanceCount = 0;

      if (checkTimer) {
        clearInterval(checkTimer);
        checkTimer = null;
      }
      if (firstCheckTimer) {
        clearTimeout(firstCheckTimer);
        firstCheckTimer = null;
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (notificationInstance) {
        notificationInstance.close();
        notificationInstance = null;
      }
      isPollingStarted = false;

      if (import.meta.env.DEV) {
        console.log('[version-check] 轮询已停止（所有实例已卸载）');
      }
    }
  });

  return {
    currentBuildId,
    latestBuildId,
    latestPublishedAt,
    checkForUpdate,
    reload,
    dismiss,
    showUpdateNotification,
  };
}
