<template>
  <div class="manual-container">
    <div class="header">
      <h2>用户手册</h2>
    </div>
    <el-container class="main-container">
      <!-- 左侧目录 -->
      <el-aside width="300px" class="sidebar">
        <el-tree
          v-if="treeData.length > 0"
          :data="treeData"
          :props="defaultProps"
          @node-click="handleNodeClick"
          :default-expanded-keys="defaultExpandedKeys"
          :highlight-current="true"
        ></el-tree>
        <div v-else class="loading-tree">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载目录中...</span>
        </div>
      </el-aside>
      
      <!-- 右侧文档内容 -->
      <el-main class="content-area">
        <div v-if="loading" class="loading-content">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载文档中...</span>
        </div>
        <div v-else-if="error" class="error-message">
          <el-alert
            title="加载文档失败"
            type="error"
            :description="error"
            show-icon
          />
        </div>
        <div 
          v-else 
          class="document-content"
          v-html="documentContent"
        ></div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { parseDocx, convertToTreeData } from '../utils/docxParser'

const documentContent = ref('')
const documentStructure = ref([])
const treeData = ref([])
const loading = ref(true)
const error = ref(null)
const defaultExpandedKeys = ref([])

const defaultProps = {
  children: 'children',
  label: 'label'
}

const loadDocument = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 解析文档，获取内容和结构
    const docPath = '/docs/a.docx'
    const result = await parseDocx(docPath)
    debugger
    documentContent.value = result.content
    documentStructure.value = result.structure
    
    // 转换为树形控件数据
    treeData.value = convertToTreeData(result.structure)
    
    // 设置默认展开的节点
    if (treeData.value.length > 0) {
      defaultExpandedKeys.value = [treeData.value[0].id]
    }
    
    loading.value = false
  } catch (err) {
    console.error('加载文档失败', err)
    error.value = err.message || '加载文档失败'
    loading.value = false
  }
}

const handleNodeClick = (data) => {
  // 点击树节点，滚动到对应内容区域
  const element = document.getElementById(data.id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  loadDocument()
})
</script>

<style scoped>
.manual-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 10px 20px;
  border-bottom: 1px solid #eee;
}

.main-container {
  flex: 1;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.sidebar {
  border-right: 1px solid #eee;
  padding: 10px;
  overflow-y: auto;
}

.content-area {
  padding: 20px;
  overflow-y: auto;
}

.loading-tree,
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.document-content {
  line-height: 1.6;
}

.document-content img {
  max-width: 100%;
  height: auto;
}

.document-content h1,
.document-content h2,
.document-content h3,
.document-content h4,
.document-content h5,
.document-content h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
}
</style> 