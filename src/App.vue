<template>
  <div id="app">
    <el-container class="main-container">
      <el-header height="60px" class="header">
        <div class="logo">文档预览系统</div>
        <el-menu
          :default-active="activeIndex"
          class="main-menu"
          mode="horizontal"
          router
          @select="handleSelect"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/manual">用户手册</el-menu-item>
        </el-menu>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const activeIndex = ref('/home')
const route = useRoute()

watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
})

onMounted(() => {
  activeIndex.value = route.path
})

const handleSelect = (key) => {
  activeIndex.value = key
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

#app {
  height: 100vh;
}

.main-container {
  height: 100%;
}

.header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  background-color: #fff;
}

.logo {
  font-size: 20px;
  font-weight: bold;
  margin-right: 40px;
  color: #409EFF;
}

.main-menu {
  border-bottom: none;
}

.main-content {
  padding: 0;
  height: calc(100% - 60px);
  overflow: hidden;
}
</style>
