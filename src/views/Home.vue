<template>
  <div class="home">
    <el-card class="welcome-card">
      <h2>欢迎使用文档预览系统</h2>
      <p>本系统可以预览Word文档内容，包括文字和图片。</p>
      <el-button type="primary" @click="goToManual">查看用户手册</el-button>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToManual = () => {
  router.push('/manual')
}
</script>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}
.welcome-card {
  max-width: 600px;
  text-align: center;
}
</style> 