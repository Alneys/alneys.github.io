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
          path: '',
          name: 'home',
          alias: 'home',
          component: () => import('@/views/HomeView.vue'),
        },
        {
          path: '/gakuen-imas/rank-calc',
          name: 'gakuen-imas-rank-calc',
          component: () => import('@/views/gakuen/GakuenRankCalc.vue'),
        },
        {
          path: '/mltd',
          children: [
            {
              path: 'anniversary-calc',
              name: 'mltd-anniversary-calc',
              component: () => import('@/views/mltd/MltdAnniversaryCalc.vue'),
            },
            {
              path: 'event-parking',
              name: 'mltd-event-parking',
              component: () => import('@/views/mltd/MltdEventParking.vue'),
            },
          ],
        },
        {
          path: '/about',
          name: 'about',
          component: () => import('@/views/about/AboutView.vue'),
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
