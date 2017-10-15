<template>
  <div id="app">
    <ElRow class="logo">
      <img src="src/assets/logo.png"/>
    </ElRow>

    <ElRow :gutter="20" class="content">
      <ElCol id="sidebar" :span="5">
        <TaskAddForm :bus="bus"/>
      </ElCol>

      <ElCol :span="19">
        <Schedule :bus="bus"/>
      </ElCol>
    </ElRow>
  </div>
</template>


<script>
import Vue from 'vue';

import Schedule from '@/components/Schedule.vue';
import TaskAddForm from '@/components/TaskAddForm.vue';

export default {
  name: 'App',

  components: {
    Schedule,
    TaskAddForm,
  },

  constants: {
    bus: new Vue(),
  }
}
</script>


<style lang="sass">

@import './assets/reset.sass'

$accent-colour: #00AEEF

img
  display: block

html, body, div, span, applet, object, iframe, h1, h2, h3, h4, h5, h6, p,
blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn, em, img,
ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i,
center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption,
tbody, tfoot, thead, tr, th, td, article, aside, canvas, details, embed,
figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section,
summary, time, mark, audio, video
  font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif

.logo
  margin: 20px
  width: calc(100% - 40px)
  background-color: $accent-colour
  border: 1px solid $accent-colour
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.12), 0 0 6px 0 rgba(0,0,0,.04);
  border-radius: 6px
  img
    margin-top: -16px

.content
  margin: 10px !important

.el-message
  top: 29px
</style>
