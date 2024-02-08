import MainLayout from '@/layouts/MainLayout';
// import loggedInGuard from '@/shared/utils/loggedInGuard';
import store from '@/shared/store';

import storeModule from './store';

const CallCheckPage = () => import(/* webpackChunkName: "callCheck" */'./containers/CallCheckPage');

export default {
  path: '/callcheck',
  component: MainLayout,
  beforeEnter(to, from, next) {
    if (!store.state.callcheck) {
      store.registerModule('callcheck', storeModule);
    }

    // loggedInGuard(store, next);
    next();
  },
  children: [
    {
      path: '',
      name: 'callcheck',
      component: CallCheckPage,
    },
  ],
};
