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

  let isHiding = false;

  let pendingShow: (() => void) | null = null;

  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const safeClearTimeout = (timer: ReturnType<typeof setTimeout> | undefined) => {
    if (timer !== undefined) clearTimeout(timer);
  };

  const onBeforeHide = () => {
    isHiding = true;
  };

  const onHide = () => {
    isHiding = false;
    // hide 完成后，如果暂存了 show 请求则立即执行
    if (pendingShow) {
      pendingShow();
      pendingShow = null;
    }
  };

  const show = (c: CgssCardSkillTableItem, el: HTMLElement, underlines: UnderlineProps) => {
    safeClearTimeout(hideTimer);
    safeClearTimeout(showTimer);

    // 如果正在 before-hide → hide 区间内，暂存请求，等 hide 后再触发
    if (isHiding) {
      pendingShow = () => {
        card.value = c;
        triggerElement.value = el;
        underlineProps.vocal = underlines.vocal;
        underlineProps.dance = underlines.dance;
        underlineProps.visual = underlines.visual;
        showTimer = setTimeout(() => {
          visible.value = true;
        }, 100);
      };
      return;
    }

    card.value = c;
    triggerElement.value = el;
    underlineProps.vocal = underlines.vocal;
    underlineProps.dance = underlines.dance;
    underlineProps.visual = underlines.visual;
    showTimer = setTimeout(() => {
      visible.value = true;
    }, 300);
  };

  const hide = () => {
    safeClearTimeout(showTimer);
    safeClearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      visible.value = false;
    }, 300);
  };

  const dispose = () => {
    safeClearTimeout(showTimer);
    safeClearTimeout(hideTimer);
    pendingShow = null;
  };

  return {
    visible,
    card,
    triggerElement,
    underlineProps,
    show,
    hide,
    dispose,
    onBeforeHide,
    onHide,
  };
}
