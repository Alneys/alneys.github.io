import { ref, onMounted, onUnmounted } from 'vue';

const VERSION_ENDPOINT = '/version.json';
const FIRST_CHECK_DELAY = 10_000;
const CHECK_INTERVAL = 30 * 60 * 1000;
const CHECK_COOLDOWN = 60_000;

export interface VersionInfo {
  buildId: string;
  publishedAt: string;
}

export function useVersionCheck() {
  const showUpdatePrompt = ref(false);
  const currentBuildId = ref('');
  const latestBuildId = ref('');
  const latestPublishedAt = ref('');

  let dismissedBuildId = '';
  let checkTimer: ReturnType<typeof setInterval> | null = null;
  let firstCheckTimer: ReturnType<typeof setTimeout> | null = null;
  let checking = false;
  let lastCheckAt = 0;

  const getLocalVersion = (): VersionInfo | null => {
    const globalVersion = (window as unknown as { __APP_VERSION__?: VersionInfo }).__APP_VERSION__;
    if (globalVersion && globalVersion.buildId) {
      return globalVersion;
    }
    return null;
  };

  const fetchLatestVersion = async (): Promise<VersionInfo | null> => {
    try {
      const url = new URL(VERSION_ENDPOINT, window.location.href);
      url.searchParams.set('t', String(Date.now()));
      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data || !data.buildId) return null;
      return data as VersionInfo;
    } catch {
      return null;
    }
  };

  const shouldShowPrompt = (remote: VersionInfo): boolean => {
    if (!remote.buildId) return false;
    if (remote.buildId === currentBuildId.value) return false;
    if (remote.buildId === dismissedBuildId) return false;
    return true;
  };

  const checkForUpdate = async (force = false) => {
    if (checking) return;
    const now = Date.now();
    if (!force && now - lastCheckAt < CHECK_COOLDOWN) return;

    checking = true;
    lastCheckAt = now;

    try {
      const local = getLocalVersion();
      if (local) {
        currentBuildId.value = local.buildId;
      }

      const remote = await fetchLatestVersion();
      if (!remote) return;

      if (shouldShowPrompt(remote)) {
        latestBuildId.value = remote.buildId;
        latestPublishedAt.value = remote.publishedAt || '';
        showUpdatePrompt.value = true;
      }
    } finally {
      checking = false;
    }
  };

  const reload = () => {
    showUpdatePrompt.value = false;
    window.location.reload();
  };

  const dismiss = () => {
    dismissedBuildId = latestBuildId.value;
    showUpdatePrompt.value = false;
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForUpdate(false);
    }
  };

  onMounted(() => {
    const local = getLocalVersion();
    if (local) {
      currentBuildId.value = local.buildId;
    }

    firstCheckTimer = setTimeout(() => {
      firstCheckTimer = null;
      checkForUpdate(true);
    }, FIRST_CHECK_DELAY);

    checkTimer = setInterval(() => {
      checkForUpdate(false);
    }, CHECK_INTERVAL);

    document.addEventListener('visibilitychange', handleVisibilityChange);
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
  });

  return {
    showUpdatePrompt,
    currentBuildId,
    latestBuildId,
    latestPublishedAt,
    reload,
    dismiss,
  };
}
