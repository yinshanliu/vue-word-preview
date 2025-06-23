import mammoth from 'mammoth'
import axios from 'axios'

/**
 * 解析Word文档
 * @param {string} docxPath - docx文件路径
 * @returns {Promise<{content: string, structure: Array}>} 解析结果，包含内容和结构
 */
export async function parseDocx(docxPath) {
  try {
    // 获取Word文档
    const response = await axios.get(docxPath, { 
      responseType: 'arraybuffer',
      // 添加baseURL以确保从正确路径获取文件
      baseURL: window.location.origin
    })
    const arrayBuffer = response.data

    // 定义样式映射，将Word中的标题映射到HTML标签
    // 同时兼容中英文Word的标题样式
    const styleMap = [
      "p[style-name='Heading 1'] => h1:fresh",
      "p[style-name='标题 1'] => h1:fresh",
      "p[style-name='Heading 2'] => h2:fresh",
      "p[style-name='标题 2'] => h2:fresh",
      "p[style-name='Heading 3'] => h3:fresh",
      "p[style-name='标题 3'] => h3:fresh",
      "p[style-name='Heading 4'] => h4:fresh",
      "p[style-name='标题 4'] => h4:fresh",
      "p[style-name='Heading 5'] => h5:fresh",
      "p[style-name='标题 5'] => h5:fresh",
      "p[style-name='Heading 6'] => h6:fresh",
      "p[style-name='标题 6'] => h6:fresh",
    ];

    // 解析文档内容，并应用样式映射
    const result = await mammoth.convertToHtml({ arrayBuffer }, { styleMap });
    let content = result.value
    
    // 创建一个临时容器来存放内容，以便提取结构
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // 提取文档结构
    const structure = extractStructure(tempDiv)
    
    // 返回处理后的HTML，其中包含了为每个标题添加的ID
    return {
      content: tempDiv.innerHTML,
      structure
    }
  } catch (error) {
    console.error('解析Word文档时出错:', error)
    throw error
  }
}

/**
 * 从DOM元素中提取文档结构 (重写以提高健壮性)
 * @param {HTMLElement} container - 包含文档内容的DOM元素
 * @returns {Array} 文档结构数组
 */
function extractStructure(container) {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) return []

  const root = { level: 0, children: [] }
  const path = [root]

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1), 10)
    const title = heading.textContent.trim()
    const id = `heading-${index}`
    heading.id = id

    const node = {
      id,
      title,
      level,
      children: []
    }
    
    while (path[path.length - 1].level >= level) {
      path.pop()
    }

    path[path.length - 1].children.push(node)
    path.push(node)
  })

  return root.children
}

/**
 * 将结构树转换为Element UI树控件所需的格式
 * @param {Array} structure - 文档结构
 * @returns {Array} Element UI树控件所需格式
 */
export function convertToTreeData(structure) {
  function convert(nodes) {
    return nodes.map(node => {
      const result = {
        id: node.id,
        label: node.title,
        level: node.level
      }
      
      if (node.children && node.children.length > 0) {
        result.children = convert(node.children)
      }
      
      return result
    })
  }
  
  return convert(structure)
} 