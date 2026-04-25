import { ref } from 'vue';
import type { CgssCardSkillTableItem } from '../CgssUnitViewerTypes';

const data = ref<CgssCardSkillTableItem[] | null>(null);
const loading = ref(false);
const error = ref<Error | null>(null);
let loadingPromise: Promise<void> | null = null;

export function useCardSkillData() {
  const loadData = async () => {
    if (data.value !== null || loadingPromise) {
      return loadingPromise;
    }

    loading.value = true;
    loadingPromise = fetch('/static/data/cgss_extracted_card_skill_table_ssr.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: CgssCardSkillTableItem[]) => {
        data.value = json;
      })
      .catch((e) => {
        error.value = e;
      })
      .finally(() => {
        loading.value = false;
      });

    return loadingPromise;
  };

  const reset = () => {
    data.value = null;
    loading.value = false;
    error.value = null;
    loadingPromise = null;
  };

  return {
    data,
    loading,
    error,
    loadData,
    reset,
  };
}
