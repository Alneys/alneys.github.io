import { ref, onMounted, onUnmounted } from 'vue';

/**
 * 响应式布局判断
 * 提供移动端和小屏幕检测
 */
export function useResponsive() {
  const isMobile = ref(window.innerWidth < 768);
  const isSmallScreen = ref(window.innerWidth < 1600);

  const handleResize = () => {
    isMobile.value = window.innerWidth < 768;
    isSmallScreen.value = window.innerWidth < 1600;
  };

  onMounted(() => {
    window.addEventListener('resize', handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
  });

  return {
    isMobile,
    isSmallScreen,
  };
}