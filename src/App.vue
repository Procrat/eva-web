<template>
  <div id="app">
    <el-row class="header">
      <router-link to="/">
        <img src="@/assets/logo.png">
      </router-link>
      <router-link
        to="/time-segments"
        class="time-segments-link"
      >
        ⚙
      </router-link>
    </el-row>

    <el-row
      :gutter="20"
      class="content"
    >
      <el-col
        id="sidebar"
        :span="5"
      >
        <TaskAddForm :bus="bus" />
      </el-col>

      <el-col :span="19">
        <router-view />
      </el-col>
    </el-row>
  </div>
</template>


<script>
import Vue from 'vue';
import VueRouter from 'vue-router';
import VueGtag from 'vue-gtag';

import Schedule from '@/components/Schedule.vue';
import TaskAddForm from '@/components/TaskAddForm.vue';
import TimeSegments from '@/components/TimeSegments.vue';

const bus = new Vue();
const router = new VueRouter({
  routes: [
    {
      name: 'home',
      path: '/',
      component: Schedule,
      props: { bus },
    },
    {
      name: 'time-segments',
      path: '/time-segments',
      component: TimeSegments,
      props: { bus },
    },
  ],
});

Vue.use(VueGtag, { config: { id: 'UA-166000011-1' } }, router);

export default {
  name: 'App',

  components: {
    TaskAddForm,
  },

  constants: {
    bus,
  },

  router,
};
</script>


<style lang="sass">
@import '@/assets/reset.sass'

img
  display: block

body
  font-family: "Helvetica Neue", Helvetica,
    "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑",
    Arial, sans-serif
  font-size: 14px

h1
  font-size: 20px
  margin-bottom: 30px
h2
  font-size: 18px
h3
  font-size: 16px

.el-message
  top: 25px
</style>

<style lang="sass" scoped>
@import '@/assets/colors.sass'

.header
  margin: 20px
  width: calc(100% - 40px)
  background-color: $accent-color
  border: 1px solid $accent-color
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.12), 0 0 6px 0 rgba(0,0,0,.04)
  border-radius: 6px
  img
    margin-top: -16px
    float: left
  a.time-segments-link
    margin: 7px 7px 0 0
    float: right
    font-size: 40px
    color: white
    text-decoration: none

.content
  margin: 10px !important
</style>
