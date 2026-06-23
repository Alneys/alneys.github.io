import type { Directive } from 'vue';

const inputmodeDirective: Directive = {
  mounted(el: Element, binding, _vnode, _prevVnode) {
    try {
      if (el.tagName.toLowerCase() !== 'input') {
        el = el.getElementsByTagName('input')[0]!;
        if (!el) {
          throw 'Input element not found';
        }
      }
      if (binding.value) {
        el.setAttribute('inputmode', binding.value);
      }
    } catch (error) {
      console.error('v-inputmode error: ', error);
    }
  },
};

export default inputmodeDirective;
