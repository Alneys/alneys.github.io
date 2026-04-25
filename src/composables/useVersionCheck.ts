import { ref, onMounted, onUnmounted, h } from 'vue';
import { ElButton } from 'element-plus';

/**
 * 版本检测配置
 */
const VERSION_ENDPOINT = '/version.json';
const FIRST_CHECK_DELAY = 10_000; // 首次检测延迟：10 秒
const CHECK_INTERVAL = 30 * 60 * 1000; // 定时轮询间隔：30 分钟
const CHECK_COOLDOWN = 60_000; // 检测冷却时间：60 秒

/**
 * 版本信息结构
 */
export interface VersionInfo {
  buildId: string;
  publishedAt: string;
}

/**
 * 版本检测 composable
 *
 * 检测逻辑：
 * 1. 页面加载后延迟 10 秒进行首次检测
 * 2. 每 30 分钟定时检测一次
 * 3. 页面重新可见时检测（visibilitychange）
 * 4. 检测冷却时间 60 秒，避免频繁请求
 */
export function useVersionCheck() {
  const currentBuildId = ref('');
  const latestBuildId = ref('');
  const latestPublishedAt = ref('');

  let dismissedBuildId = '';
  let checkTimer: ReturnType<typeof setInterval> | null = null;
  let firstCheckTimer: ReturnType<typeof setTimeout> | null = null;
  let checking = false;
  let lastCheckAt = 0;
  let notificationInstance: ReturnType<typeof ElNotification> | null = null;

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
    const local = getLocalVersion();
    if (local) {
      currentBuildId.value = local.buildId;
      console.log('[version-check] 初始化，本地版本:', local.buildId);
    }

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
        '[version-check] 已启动，首次检测延迟:',
        FIRST_CHECK_DELAY / 1000,
        '秒，轮询间隔:',
        CHECK_INTERVAL / 60000,
        '分钟',
      );
    }
  });

  onUnmounted(() => {
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
    if (import.meta.env.DEV) {
      console.log('[version-check] 已停止');
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
