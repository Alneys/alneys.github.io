import { createRouter, createWebHistory } from 'vue-router';
import LayoutIndex from '@/views/layout/LayoutIndex.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'LayoutIndex',
      component: LayoutIndex,
      children: [
        {
          path: '/gakuen-imas/rank-calc',
          name: 'gakuen-imas-rank-calc',
          component: () => import('@/views/gakuen/GakuenRankCalc.vue'),
        },
        {
          path: '',
          name: 'home',
          alias: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: '/404',
          name: 'NotFound',
          component: () => import('@/views/NotFoundView.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)',
      redirect: '/404',
    },
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue'),
    // },
  ],
});

export default router;
