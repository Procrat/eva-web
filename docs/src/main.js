import Vue from 'vue'
import App from './App.vue'
import Api from './api'

Api().then(api =>
  new Vue({
    el: '#app',
    render (h) {
      return h(App, {
        props: {
          api: api,
        },
      });
    },
  })
).catch(reason =>
  console.error("Loading API failed:", reason)
);
