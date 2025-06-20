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

    // 解析文档内容
    const result = await mammoth.convertToHtml({ arrayBuffer })
    const content = result.value
    
    // 创建一个临时容器来存放内容，以便提取结构
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // 提取文档结构
    const structure = extractStructure(tempDiv)
    
    return {
      content,
      structure
    }
  } catch (error) {
    console.error('解析Word文档时出错:', error)
    throw error
  }
}

/**
 * 从DOM元素中提取文档结构
 * @param {HTMLElement} container - 包含文档内容的DOM元素
 * @returns {Array} 文档结构数组
 */
function extractStructure(container) {
  // 查找所有标题元素
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  
  // 构建结构树
  const structure = []
  let currentLevel = 0
  let currentPath = [structure]
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.substring(1))
    const title = heading.textContent.trim()
    const id = `heading-${index}`
    
    // 给标题元素添加ID，便于导航
    heading.id = id
    
    const node = {
      id,
      title,
      level,
      children: []
    }
    
    // 根据标题级别调整当前路径
    if (level > currentLevel) {
      // 进入下一级
      if (currentPath[currentPath.length - 1].length > 0) {
        currentPath.push(currentPath[currentPath.length - 1][currentPath[currentPath.length - 1].length - 1].children)
      } else {
        // 如果没有父节点，直接添加到当前路径
        currentPath[currentPath.length - 1].push(node)
        return
      }
    } else if (level < currentLevel) {
      // 返回上级，可能需要返回多级
      const steps = currentLevel - level
      for (let i = 0; i < steps; i++) {
        if (currentPath.length > 1) {
          currentPath.pop()
        }
      }
    }
    
    // 添加到当前路径
    currentPath[currentPath.length - 1].push(node)
    currentLevel = level
  })
  
  return structure
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