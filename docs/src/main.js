import Vue from 'vue'
import VueConstants from 'vue-constants'

import ElementUI from 'element-ui'
import 'element-ui/lib/theme-default/index.css'
import locale from 'element-ui/lib/locale/lang/en'

import App from './App.vue'
import Api from './api'


Vue.use(ElementUI, { locale });
Vue.use(VueConstants);

Api().then(api => {
  Vue.use({
    install(Vue, _options) {
      Vue.prototype.$api = api;
    }
  });

  new Vue({
    el: '#app',
    render(h) {
      return h(App);
    },
  })
}).catch(reason =>
  console.error("Loading API failed:", reason)
);
