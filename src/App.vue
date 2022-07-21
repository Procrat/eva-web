<script setup>
import { Setting as SettingIcon } from '@element-plus/icons-vue';

import bus from '@/bus';
import TaskAddForm from '@/components/TaskAddForm.vue';
</script>

<template>
  <el-container class="page">
    <el-header>
      <router-link to="/">
        <img src="@/assets/logo.png">
      </router-link>
      <router-link
        to="/time-segments"
        class="time-segments-link"
      >
        <el-icon>
          <setting-icon />
        </el-icon>
      </router-link>
    </el-header>

    <el-container direction="horizontal">
      <el-aside>
        <TaskAddForm :bus="bus" />
      </el-aside>

      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'App',
};
</script>

<!-- eslint-disable max-len -->
<style lang="sass">
@import "@csstools/normalize.css/opinionated"

body
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif
  font-size: 14px

h1
  font-size: 20px
  margin-bottom: 30px
h2
  font-size: 18px
h3
  font-size: 16px

table
  border-collapse: collapse

.el-message
  top: 25px
</style>

<style lang="sass" scoped>
@import '@/assets/colors.sass'

.page
  margin: 20px

.el-container
  gap: 20px

.el-header
  --el-header-padding: 8px
  display: flex
  justify-content: space-between
  background-color: $accent-color
  border: 1px solid $accent-color
  box-shadow: 0 2px 4px 0 rgba(0,0,0,.12), 0 0 6px 0 rgba(0,0,0,.04)
  border-radius: 6px
  img
    margin-top: -24px
    margin-left: -8px
  a.time-segments-link
    color: white
    font-size: 40px

.el-aside
  --el-aside-width: 250px
  // Allow shadow of el-card to show through
  padding: 12px
  margin: -12px

.el-main
  // Allow shadow of el-card to show through
  --el-main-padding: 12px
  margin: -12px
</style>
