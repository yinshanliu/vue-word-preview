<template>
  <div id="app">
    <el-header class="app-header">
      <router-link to="/" class="title-link">
        <h1>文档预览系统</h1>
      </router-link>
    </el-header>
    <el-main class="app-main">
      <router-view/>
    </el-main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      activeIndex: '/home'
    }
  },
  watch: {
    '$route.path'(newPath) {
      this.activeIndex = newPath
    }
  },
  created() {
    this.activeIndex = this.$route.path
  },
  methods: {
    handleSelect(key) {
      this.activeIndex = key
    }
  }
}
</script>

<style>
/* Global styles */
html, body, #app {
  height: 100%;
  margin: 0;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
}

#app {
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-header {
  flex-shrink: 0; /* 防止头部被压缩 */
  display: flex;
  align-items: center;
  justify-content: flex-start; /* 标题居左 */
  border-bottom: 1px solid #e6e6e6;
  padding: 0 20px;
  background-color: #fff;
  height: 60px !important; /* 确保高度一致 */
}

.title-link {
  text-decoration: none;
  color: #409EFF; /* 使用主题蓝色 */
}

.title-link h1 {
    margin: 0;
    font-size: 20px;
}

.app-main {
  flex-grow: 1; /* 主内容区占据剩余空间 */
  overflow-y: auto; /* 内容超出时可滚动 */
  padding: 0;
  background-color: #f5f7fa;
}
</style>
