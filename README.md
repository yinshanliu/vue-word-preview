# vue-word-preview

一个基于 Vue.js、Element UI、mammoth.js 和 pdf.js 实现的文档预览应用。

## 功能特性

- **动态文件列表**: 自动加载并展示 `public/docs` 目录下的所有 Word 和 PDF 文档。
- **Word 文档预览**: 支持 `.docx` 文件预览，能够渲染文本、图片，并自动提取和显示文档目录。
- **PDF 文档预览**: 支持 `.pdf` 文件预览，能够渲染页面，并自动提取和显示 PDF 内嵌的书签目录。
- **统一的目录导航**: 无论是 Word 还是 PDF，都可以在左侧通过目录树进行快速导航。
- **内网/离线支持**: 核心功能不依赖外部CDN，可完全在内网或离线环境下部署和使用。
- **响应式布局**: 界面布局能够适应不同屏幕尺寸。

## 项目设置

### 安装依赖
```
npm install
```

### 启动开发服务器
```
npm run serve
```

### 编译并打包生产版本
```
npm run build
```

## 使用说明

### 管理文档

要在此应用中添加、删除或修改文档，请遵循以下步骤：

1.  **文件操作**:
    -   将您的 `.docx` 或 `.pdf` 文件直接放入 `public/docs` 文件夹中。

2.  **更新清单文件**:
    -   打开位于 `public/docs/` 目录下的 `manifest.json` 文件。
    -   这是一个简单的 JSON 数组，其中包含了所有要显示的文档的文件名。
    -   **添加文件**：在数组中新增一行，写入您的文件名，例如 `"new-document.docx"`。
    -   **删除文件**：从数组中移除相应的文件名。

**`manifest.json` 示例:**
```json
[
  "a.docx",
  "b.docx",
  "c.pdf",
  "new-document.pdf"
]
```

完成以上步骤后，重新加载应用主页，文档列表将会自动更新。

## 部署指南

### 1. 配置 `publicPath`

如果您需要将此应用部署到服务器的子目录（例如 `http://example.com/vue-word-preview/`），您必须先修改 `vue.config.js` 文件中的 `publicPath` 选项。

```javascript
// vue.config.js
module.exports = {
  // 将这里的路径修改为您将要部署的子目录
  publicPath: '/vue-word-preview/', 
  // ... 其他配置
}
```
如果您是部署到域名的根目录，请将其设置为 `'/'`。

### 2. 构建项目
修改完配置后，运行构建命令：
```
npm run build
```
这会生成一个 `dist` 文件夹，其中的所有资源路径都已根据您的 `publicPath` 设置好了。

### 3. Nginx 配置示例

将 `dist` 文件夹中的所有内容上传到您的服务器，并使用以下 Nginx 配置。此配置适用于部署在子目录的情况，并能正确处理前端路由。

```nginx
server {
    listen 9001;
    server_name your_server_ip_or_domain;

    location /vue-word-preview/ {
        # 'alias' 指向您服务器上 dist 文件夹的绝对路径
        alias /path/to/your/dist/;
        
        # 这一行是确保前端路由正常工作的关键
        try_files $uri $uri/ /vue-word-preview/index.html;
    }
}
```
修改配置后，请重启 Nginx 服务。

## 注意事项

- **Word 文档样式限制**: 由于 `mammoth.js` 库的设计理念，它主要关注内容的语义结构而非样式。因此，从 .docx 文件转换时，大部分格式（如 **字体颜色**、字号、段落间距等）不会被保留。
- **PDF 渲染**: PDF 的渲染清晰度与性能取决于 `pdf.js` 的配置和浏览器性能。对于特别大的 PDF 文件，初次加载可能会比较慢。

## 旧版浏览器兼容性适配（以 Firefox 52 为例）

为了让项目能够在不支持 ES6+ 现代 JavaScript 语法的旧版浏览器（如 Firefox 52）上运行，需要进行一系列的兼容性配置。核心问题在于，项目的依赖包（如 `axios`, `mammoth`, `pdfjs-dist`）可能包含了未被转译的现代语法。

以下是完整的适配步骤：

### 1. 修改 `package.json`

#### a. 指定浏览器范围

在 `package.json` 中，修改 `browserslist` 字段，明确告知 Babel 等工具需要兼容的目标浏览器版本。

```json
"browserslist": [
  "firefox >= 52",
  "not dead"
]
```

#### b. 降级并锁定 `pdfjs-dist` 版本

现代版本的 `pdfjs-dist` 已不再支持旧版浏览器。必须将其降级到一个已验证可行的旧版本。`2.6.347` 是一个稳定且兼容的选择。

```json
"dependencies": {
  "axios": "^1.10.0",
  "core-js": "^3.8.3",
  "element-ui": "^2.15.14",
  "mammoth": "^1.9.1",
  "pdfjs-dist": "2.6.347", // 锁定到兼容版本
  "vue": "^2.6.14",
  "vue-router": "^3.5.1"
}
```

### 2. 修改 `vue.config.js`

#### a. 强制转译依赖

在 `vue.config.js` 中，使用 `transpileDependencies` 选项，强制 Vue CLI 使用 Babel 转译指定的 `node_modules` 中的依赖。

#### b. 复制 `pdf.js` 的 Worker 文件

旧版浏览器需要使用 `pdfjs-dist` 提供的 ES5 兼容版本。我们需要使用 `CopyWebpackPlugin` 插件，将该版本的 `worker` 文件复制到最终的打包目录中。

完整的 `vue.config.js` 配置如下：

```javascript
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  publicPath: '/vue-word-preview/',
  transpileDependencies: ['pdfjs-dist', 'mammoth', 'axios'],
  configureWebpack: {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            // 确保复制的是 es5 版本的 worker
            from: 'node_modules/pdfjs-dist/es5/build/pdf.worker.js',
            to: 'pdfjs/pdf.worker.js'
          }
        ]
      })
    ]
  }
}
```

### 3. 修改 Vue 组件中的 `pdf.js` 用法

在实际使用 `pdfjs-dist` 的组件（本项目中为 `src/views/Manual.vue`）中，必须进行两处修改：

#### a. 显式导入 ES5 版本

将 `import` 语句直接指向 `pdfjs-dist` 的 ES5 版本，以确保加载的是包含所有兼容性补丁（Polyfill）的库。

```javascript
// 错误的方式: import * as pdfjsLib from 'pdfjs-dist';
// 正确的方式:
import * as pdfjsLib from 'pdfjs-dist/es5/build/pdf.js';
```

#### b. 设置 Worker 路径

在渲染 PDF 之前，正确设置 `worker` 的路径，使其指向我们在 `vue.config.js` 中配置复制的目标路径。

```javascript
// ... in methods ...
async renderPdf() {
  // BASE_URL 会被 Vue CLI 自动替换为 publicPath
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.BASE_URL}pdfjs/pdf.worker.js`;

  const pdfPath = `${process.env.BASE_URL}docs/${this.fileName}`;
  const pdf = await pdfjsLib.getDocument(pdfPath).promise;
  // ...
},
```

### 4. 重新构建

完成以上所有修改后，**务必删除 `node_modules` 和 `package-lock.json`**，然后重新执行 `npm install` 和 `npm run build`，以确保所有依赖都按照新的配置正确安装和打包。

### 调试技巧

如果在适配过程中仍然遇到打包后的代码报错，可以暂时在 `vue.config.js` 中禁用代码压缩，以便在浏览器控制台获得更清晰、未被压缩的错误信息，从而精确定位问题。

```javascript
// vue.config.js
module.exports = {
  // ... 其他配置
  chainWebpack: config => {
    config.optimization.minimize(false)
  }
}
```
问题解决后，记得移除此配置以保证生产环境代码的体积。
