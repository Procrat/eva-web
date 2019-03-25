import Vue from 'vue';
import VueConstants from 'vue-constants';

import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  Loading,
  Message,
  Option,
  Row,
  Select,
  Slider,
  Table,
  TableColumn,
  TimeSelect,
} from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale';
import english from 'element-ui/lib/locale/lang/en';

import App from '@/App.vue';
import Api from '@/api';
import error500 from '@/error-500';

locale.use(english);

Vue.use(Alert);
Vue.use(Button);
Vue.use(Card);
Vue.use(Col);
Vue.use(DatePicker);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Input);
Vue.use(Option);
Vue.use(Row);
Vue.use(Select);
Vue.use(Slider);
Vue.use(Table);
Vue.use(TableColumn);
Vue.use(TimeSelect);
Vue.use(Loading.directive);
Vue.prototype.$loading = Loading.service;
Vue.prototype.$message = Message;

Vue.use(VueConstants);

Vue.config.productionTip = false;


const body = document.getElementsByTagName('body')[0];
body.insertAdjacentHTML('afterbegin', '<div id="app"></div>');

Api().then((api) => {
  Vue.use({
    install(vue, _options) {
      vue.prototype.$api = api;
    },
  });

  const vm = new Vue({ render: h => h(App) });

  vm.$mount('#app');
}).catch(reason => error500(reason));
