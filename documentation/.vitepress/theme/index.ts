import DefaultTheme from 'vitepress/theme';
import { onMounted } from 'vue';
import './custom.css';

export default {
  extends: DefaultTheme,
  setup() {
    onMounted(() => {
      // Keep links from the former Docsify site usable after migration.
      const old = window.location.hash.match(/^#\/(?:([\w-]+)(?:\.md)?)?(?:\?id=([^&]+))?$/);
      if (!old) return;
      const page = old[1]?.toLowerCase();
      const target = page === 'changelog' ? '/changelog.html'
        : page && page !== 'readme' ? null : '/getting-started.html';
      if (target) window.location.replace(target + (old[2] ? '#' + old[2] : ''));
    });
  },
};
