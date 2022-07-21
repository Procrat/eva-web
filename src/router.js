import * as VueRouter from 'vue-router';

import Schedule from '@/components/Schedule.vue';
import TimeSegments from '@/components/TimeSegments.vue';

const routes = [
  {
    name: 'home',
    path: '/',
    component: Schedule,
  },
  {
    name: 'time-segments',
    path: '/time-segments',
    component: TimeSegments,
  },
];

export default VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});
