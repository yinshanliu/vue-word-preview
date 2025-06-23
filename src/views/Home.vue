<template>
  <div class="home-container">
    <h1>文档列表</h1>
    <p>点击下方的文件名即可开始预览。</p>
    <el-card class="file-list-card">
      <div slot="header" class="clearfix">
        <span>可用文档</span>
      </div>
      <el-table :data="files" style="width: 100%" @row-click="handleRowClick" v-loading="loading">
        <el-table-column prop="name" label="文件名">
          <template slot-scope="scope">
            <i :class="scope.row.icon"></i>
            <span style="margin-left: 10px">{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120"></el-table-column>
      </el-table>
       <div v-if="error" class="error-message">
        <el-alert
          title="加载文档列表失败"
          type="error"
          :description="error"
          show-icon
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Home',
  data() {
    return {
      files: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    try {
      const response = await axios.get('/docs/manifest.json');
      this.files = response.data
        .filter(name => name.endsWith('.docx') || name.endsWith('.pdf'))
        .map(name => {
          const isDocx = name.endsWith('.docx');
          return {
            name,
            type: isDocx ? 'Word 文档' : 'PDF 文档',
            icon: isDocx ? 'el-icon-document' : 'el-icon-collection'
          };
        });
    } catch (err) {
      console.error("加载文档列表失败:", err);
      this.error = err.message || '无法获取文档列表。';
    } finally {
      this.loading = false;
    }
  },
  methods: {
    handleRowClick(row) {
      // 点击行时，跳转到预览页面
      this.$router.push({ name: 'Manual', params: { fileName: row.name } });
    }
  }
}
</script>

<style scoped>
.home-container {
  padding: 20px;
  text-align: center;
}
.file-list-card {
  max-width: 800px;
  margin: 20px auto;
  text-align: left;
}
.el-table {
  cursor: pointer;
}
.error-message {
  margin-top: 20px;
}
</style> 