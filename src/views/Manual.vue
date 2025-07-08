<template>
  <div class="manual-container">
    <div class="header">
      <h2>正在预览: {{ fileName }}</h2>
    </div>
    <el-container class="main-container">
      <!-- 左侧目录 (对DOCX和PDF都可见) -->
      <el-aside width="300px" class="sidebar">
        <el-tree
          v-if="treeData.length > 0"
          :data="treeData"
          :props="defaultProps"
          @node-click="handleNodeClick"
          :default-expanded-keys="defaultExpandedKeys"
          :highlight-current="true"
          node-key="id"
        ></el-tree>
        <div v-else-if="loading" class="loading-tree">
          <i class="el-icon-loading"></i>
          <span>加载目录中...</span>
        </div>
        <div v-else class="no-toc-message">
          <span>无可用目录</span>
        </div>
      </el-aside>
      
      <!-- 右侧文档内容 -->
      <el-main class="content-area">
        <div v-if="loading" class="loading-content">
          <i class="el-icon-loading"></i>
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
        <!-- DOCX 内容 -->
        <div 
          v-else-if="fileType === 'docx'"
          class="document-content"
          v-html="documentContent"
        ></div>
        <!-- PDF 内容 -->
        <div v-else-if="fileType === 'pdf'" ref="pdfContainer" class="pdf-container"></div>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { parseDocx, convertToTreeData } from '../utils/docxParser';
import * as pdfjsLib from 'pdfjs-dist/es5/build/pdf.js';

export default {
  name: 'Manual',
  props: {
    fileName: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      fileType: '', // 将在 mounted 中根据 fileName 设置
      documentContent: '',
      treeData: [],
      loading: true,
      error: null,
      defaultExpandedKeys: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      pdfDoc: null, // 存储加载的PDF文档对象
    }
  },
  watch: {
    // 监听 fileName 的变化，以便在同一页面切换不同文档时重新加载
    fileName: {
      handler: 'loadDocument',
      immediate: true
    }
  },
  methods: {
    async loadDocument() {
      // 从文件名推断文件类型
      const extension = this.fileName.split('.').pop().toLowerCase();
      if (extension === 'docx') {
        this.fileType = 'docx';
      } else if (extension === 'pdf') {
        this.fileType = 'pdf';
      } else {
        this.error = '不支持的文件类型';
        this.loading = false;
        return;
      }

      try {
        this.loading = true;
        this.error = null;
        // 清理旧内容
        this.documentContent = '';
        this.treeData = [];
        this.pdfDoc = null; // 清理pdf文档对象
        if (this.$refs.pdfContainer) {
          this.$refs.pdfContainer.innerHTML = '';
        }

        // 确保清理操作的DOM更新完成
        await this.$nextTick();
        
        if (this.fileType === 'docx') {
          await this.loadDocx();
        }
        
        // 无论何种文件类型，都在这里将loading设置为false
        this.loading = false;

        // 如果是PDF，在DOM更新后（loading消失，pdfContainer出现）再渲染
        if (this.fileType === 'pdf') {
          await this.$nextTick();
          await this.renderPdf();
        }

      } catch (err) {
        console.error('加载文档失败', err);
        this.error = err.message || '加载文档失败';
        this.loading = false;
      }
    },
    async loadDocx() {
      // --- 这里是修改点 ---
      const docPath = `${process.env.BASE_URL}docs/${this.fileName}`;
      const result = await parseDocx(docPath);
      
      this.documentContent = result.content;
      this.treeData = convertToTreeData(result.structure);
      
      if (this.treeData.length > 0) {
        this.defaultExpandedKeys = [this.treeData[0].id];
      }
    },
    async renderPdf() {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.BASE_URL}pdfjs/pdf.worker.js`;
      // --- 这里是修改点 ---
      const pdfPath = `${process.env.BASE_URL}docs/${this.fileName}`;
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;
      this.pdfDoc = pdf; // 存储PDF文档对象以供导航使用

      const container = this.$refs.pdfContainer;
      container.innerHTML = ''; // 清空之前的内容

      // 获取并处理PDF大纲以生成目录
      const outline = await pdf.getOutline();
      if (outline) {
        this.treeData = this.convertPdfOutlineToTreeData(outline);
        if (this.treeData.length > 0) {
          this.defaultExpandedKeys = [this.treeData[0].id];
        }
      }

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.3 });
        
        const canvas = document.createElement('canvas');
        canvas.id = `pdf-page-${i}`; // 为每个页面添加ID以便导航
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.marginBottom = '20px';

        container.appendChild(canvas);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }
    },
    async handleNodeClick(data) {
      if (!this.pdfDoc || !data.dest) return;

      try {
        let dest = data.dest;
        if (typeof dest === 'string') {
          dest = await this.pdfDoc.getDestination(dest);
        }
        if (!Array.isArray(dest)) return;

        const pageRef = dest[0];
        const pageIndex = await this.pdfDoc.getPageIndex(pageRef);
        if (pageIndex === -1) return;

        const pageNum = pageIndex + 1;
        const page = await this.pdfDoc.getPage(pageNum);
        const pageElement = document.getElementById(`pdf-page-${pageNum}`);
        if (!pageElement) return;

        const destType = dest[1].name;
        let top = null;

        if (destType === 'XYZ') {
          top = dest[3];
        } else if (destType === 'FitH' || destType === 'FitBH') {
          top = dest[2];
        }

        const scroller = this.$el.querySelector('.content-area');
        if (!scroller) return;

        // --- 核心逻辑：使用 getBoundingClientRect 进行绝对定位 ---

        if (typeof top !== 'number') {
          // 对于没有 top 坐标的目标，简单滚动到页面顶部
          const scrollerRect = scroller.getBoundingClientRect();
          const pageRect = pageElement.getBoundingClientRect();
          scroller.scrollTop += pageRect.top - scrollerRect.top - 20; // -20 作为缓冲
          return;
        }

        // 对于有 top 坐标的目标，执行精确计算
        const pdfPageHeight = page.view[3] - page.view[1];
        const canvasHeight = pageElement.clientHeight;
        const scale = canvasHeight / pdfPageHeight;
        
        // 目标位置在 Canvas 内部的像素偏移（从 Canvas 顶部算起）
        const offsetInCanvas = (pdfPageHeight - top) * scale;
        
        // 获取滚动容器和目标 Canvas 相对于视口的绝对位置
        const scrollerRect = scroller.getBoundingClientRect();
        const pageRect = pageElement.getBoundingClientRect();
        
        // 计算最终的 scrollTop 值
        // scrollTop 的增量 = (Canvas顶部 相对于 视口的位置) - (滚动容器顶部 相对于 视口的位置) + (在Canvas内部的偏移)
        const scrollTopDelta = pageRect.top - scrollerRect.top + offsetInCanvas;

        // -20px 作为视觉缓冲，让标题不会紧贴顶部
        scroller.scrollTop += scrollTopDelta - 20;

      } catch (error) {
        console.error("处理PDF导航时出错:", error);
      }
    },
    /**
     * 将PDF的outline结构转换为Element UI树控件所需的格式
     */
    convertPdfOutlineToTreeData(outline, counter = { val: 0 }) {
      return outline.map(item => {
        const nodeId = `pdf-outline-${counter.val++}`;
        const node = {
            id: nodeId,
            label: item.title,
            dest: item.dest, // 保留目标信息用于导航
            children: []
        };

        if (item.items && item.items.length > 0) {
            node.children = this.convertPdfOutlineToTreeData(item.items, counter);
        }

        return node;
      });
    }
  }
}
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
  display: flex;
  align-items: center;
  gap: 20px;
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
  /* 让内容区域居中显示，适合阅读 */
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f5f5; /* 添加背景色以区分内容和白边 */
}

/* 关键样式修改 */
.pdf-container >>> canvas {
  /* 让 canvas 宽度撑满容器，同时保持其原始宽高比 */
  max-width: 100%;
  height: auto;
  /* 添加阴影和边框，使其看起来像真实的纸张 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border: 1px solid #dcdcdc;
  /* 增加页间距 */
  margin-bottom: 20px; 
}
.loading-tree,
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 16px;
}

.no-toc-message {
  color: #909399;
  text-align: center;
  padding-top: 20px;
}

.document-content,
.pdf-container {
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
}

.pdf-container {
  display: flex;
  flex-direction: column;
  align-items: center;
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