import * as Vue from 'vue';
import VueConstants from 'vue-constants';
import VueGtag from 'vue-gtag';

import {
  ElAlert,
  ElAside,
  ElButton,
  ElCard,
  ElCol,
  ElContainer,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElHeader,
  ElIcon,
  ElInput,
  ElLink,
  ElLoading,
  ElMain,
  ElMessage,
  ElOption,
  ElRadio,
  ElRow,
  ElSelect,
  ElSlider,
  ElTable,
  ElTableColumn,
  ElTimeSelect,
} from 'element-plus';
import 'element-plus/theme-chalk/index.css';

import Api from '@/api';
import App from '@/App.vue';
import error500 from '@/error-500';
import router from '@/router';

const app = Vue.createApp(App);

app.use(ElAlert);
app.use(ElAside);
app.use(ElButton);
app.use(ElCard);
app.use(ElCol);
app.use(ElContainer);
app.use(ElDatePicker);
app.use(ElForm);
app.use(ElFormItem);
app.use(ElHeader);
app.use(ElIcon);
app.use(ElInput);
app.use(ElLink);
app.use(ElLoading);
app.use(ElMain);
app.use(ElMessage);
app.use(ElOption);
app.use(ElRadio);
app.use(ElRow);
app.use(ElSelect);
app.use(ElSlider);
app.use(ElTable);
app.use(ElTableColumn);
app.use(ElTimeSelect);

app.use(VueConstants);

app.use(router);

app.use(VueGtag, { config: { id: 'UA-166000011-1' } }, router);

app.directive('focus', {
  inserted(_element, _binding, vnode) {
    vnode.componentInstance.focus();
  },
});

const body = document.getElementsByTagName('body')[0];
body.insertAdjacentHTML('afterbegin', '<div id="app"></div>');

Api().then((api) => {
  app.use({
    install(vue, _options) {
      // eslint-disable-next-line no-param-reassign
      vue.config.globalProperties.$api = api;
    },
  });

  app.mount('#app');
}).catch((reason) => error500(reason));
