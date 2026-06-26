/**
 * 单例 Tooltip 状态管理
 * 供 CgssUnitViewerTooltipPortal 与表格组件共享状态
 */

import { ref, reactive } from 'vue';

import type { CgssCardSkillTableItem } from '../CgssUnitViewerTypes';

/** 下划线属性标记 */
export interface UnderlineProps {
  vocal: boolean;
  dance: boolean;
  visual: boolean;
}

export function useCardTooltip() {
  const visible = ref(false);
  const card = ref<CgssCardSkillTableItem | null>(null);
  const triggerElement = ref<HTMLElement | null>(null);
  const underlineProps = reactive<UnderlineProps>({
    vocal: false,
    dance: false,
    visual: false,
  });

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const safeClearTimeout = (timer: ReturnType<typeof setTimeout> | undefined) => {
    if (timer !== undefined) clearTimeout(timer);
  };

  const show = (c: CgssCardSkillTableItem, el: HTMLElement, underlines: UnderlineProps) => {
    safeClearTimeout(hideTimer);
    safeClearTimeout(showTimer);
    card.value = c;
    triggerElement.value = el;
    underlineProps.vocal = underlines.vocal;
    underlineProps.dance = underlines.dance;
    underlineProps.visual = underlines.visual;
    // 640ms 延迟显示（替代 el-tooltip 的 show-after，受控模式下不生效）
    showTimer = setTimeout(() => {
      visible.value = true;
    }, 640);
  };

  const hide = () => {
    safeClearTimeout(showTimer);
    // 短暂延迟防止从图标移出时闪烁
    hideTimer = setTimeout(() => {
      visible.value = false;
    }, 100);
  };

  const dispose = () => {
    safeClearTimeout(showTimer);
    safeClearTimeout(hideTimer);
  };

  return { visible, card, triggerElement, underlineProps, show, hide, dispose };
}
