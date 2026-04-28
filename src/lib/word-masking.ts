// Word masking for Chinese text
// Uses simple segmentation based on common patterns

// Common words to exclude from masking
const EXCLUDE_WORDS = new Set([
  '的', '了', '和', '是', '在', '有', '我', '你', '他', '她', '它',
  '们', '的', '地', '得', '之', '与', '或', '但', '而', '所以',
  '因为', '如果', '虽然', '然而', '并且', '而且', '或者', '以及',
  '不是', '就是', '都是', '还是', '只有', '无论', '不管', '尽管',
  '通过', '经过', '根据', '按照', '为了', '对于', '关于', '由于',
  '这种', '那个', '这个', '那些', '这些', '什么', '怎么', '如何',
  '一个', '一些', '一种', '一样', '一起', '一定', '一般', '同时',
  '可以', '可能', '应该', '必须', '需要', '能够', '往往', '常常',
  '经常', '总是', '有时', '曾经', '已经', '正在', '将要', '曾经',
  '表现', '发展', '产生', '形成', '出现', '进行', '具有', '存在',
  '认为', '知道', '感到', '觉得', '发现', '提出', '表示', '达到',
  '得到', '看到', '听到', '利用', '使用', '采用', '开始', '继续',
  '包括', '涉及', '属于', '关于', '对于', '这种', '那个', '这个',
  '心理', '过程', '感觉', '知觉', '记忆', '思维', '想象', '注意',
  '情感', '意志', '动机', '需要', '人格', '能力', '性格', '气质',
  '社会', '文化', '教育', '发展', '学习', '行为', '认知', '情绪',
  '自我', '意识', '潜意识', '意识流', '认知', '表征', '编码', '存储',
  '提取', '再认', '回忆', '遗忘', '强化', '惩罚', '条件', '反射',
  '刺激', '反应', '强化', '泛化', '消退', '本能', '欲望', '需求',
])

// Words to prioritize for masking (nouns, verbs, adjectives with key meanings)
const PRIORITY_WORDS = [
  // Psychology terms
  '认知', '感觉', '知觉', '记忆', '思维', '想象', '注意', '情感', '意志',
  '动机', '需要', '人格', '能力', '性格', '气质', '自我', '意识',
  '认知失调', '心理防御', '应激反应', '焦虑', '抑郁', '强迫', '恐惧',
  '幻觉', '错觉', '遗忘', '错觉', '投射', '认同', '移情', '反移情',
  '顿悟', '学习', '强化', '惩罚', '强化物', '条件反射', '操作条件',
  // Key psychological concepts
  '自我效能', '归因', '认知', '情感', '意志', '气质', '性格',
  '思维', '推理', '判断', '决策', '问题解决', '创造力',
  '发展', '成熟', '敏感期', '关键期', '最近发展区',
  '依恋', '分离焦虑', '安全依恋', '不安全依恋',
  '社会化', '角色', '从众', '服从', '顺从', '认同',
  '态度', '偏见', '歧视', '刻板印象', '内群体', '外群体',
  '沟通', '人际', '吸引', '亲密', '关系', '冲突',
  // Common academic terms
  '研究', '方法', '实验', '变量', '控制', '测量', '数据', '结果',
  '理论', '模型', '假设', '检验', '分析', '对比', '发现',
  '影响', '因素', '作用', '机制', '原因', '结果', '效果',
  '程度', '水平', '状态', '特征', '表现', '规律', '现象',
]

export interface MaskedText {
  masked: string
  revealed: string
  maskedWords: string[]
}

// Simple Chinese word segmentation using patterns
function segmentChinese(text: string): string[] {
  // Remove markdown and special characters for analysis
  const cleanText = text.replace(/[\[\]{}（）【】()]/g, ' ')
  
  const words: string[] = []
  
  // Extract words in parentheses first
  const parenRegex = /[（(][^）)]*[）)]/g
  let match
  while ((match = parenRegex.exec(cleanText)) !== null) {
    const parenContent = match[0].slice(1, -1)
    if (parenContent.length > 0) {
      words.push(parenContent)
    }
  }
  
  // Simple bigram/trigram approach for Chinese
  // Look for common word patterns
  const patterns = [
    // 3-char words
    /[\u4e00-\u9fa5]{3}/g,
    // 2-char words  
    /[\u4e00-\u9fa5]{2}/g,
    // 4-char phrases
    /[\u4e00-\u9fa5]{4}/g,
  ]
  
  for (const pattern of patterns) {
    let m
    while ((m = pattern.exec(cleanText)) !== null) {
      const word = m[0]
      if (!EXCLUDE_WORDS.has(word) && word.length >= 2) {
        words.push(word)
      }
    }
  }
  
  return [...new Set(words)]
}

export function maskText(
  text: string,
  maxWords: number = 4,
  _maskRatio: number = 0.3
): MaskedText {
  // Extract words in parentheses first (highest priority)
  const parenRegex = /[（(][^）)]*[）)]/g
  const parenMatches: string[] = []
  let match
  let maskedText = text
  
  while ((match = parenRegex.exec(text)) !== null) {
    parenMatches.push(match[0].slice(1, -1))
  }
  
  // Get all potential words to mask
  const allWords = segmentChinese(text)
  
  // Filter and score words
  const scoredWords: { word: string; score: number }[] = []
  
  for (const word of allWords) {
    if (word.length < 2) continue
    if (EXCLUDE_WORDS.has(word)) continue
    
    let score = 0
    
    // Priority words get higher scores
    if (PRIORITY_WORDS.includes(word)) {
      score += 10
    } else if (word.length > 2) {
      score += word.length - 2 // longer words get slightly higher score
    }
    
    // Words in parentheses are highest priority
    if (parenMatches.includes(word)) {
      score += 20
    }
    
    // Check if word is a noun/verb/adjective (simplified check)
    if (/[\u4e00-\u9fa5]{2,}/.test(word)) {
      score += 1
    }
    
    if (score > 0) {
      scoredWords.push({ word, score })
    }
  }
  
  // Sort by score descending, then by length descending
  scoredWords.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.word.length - a.word.length
  })
  
  // Take top words based on maxWords
  const wordsToMask = scoredWords.slice(0, maxWords)
  
  // Sort by length descending to avoid partial replacements
  wordsToMask.sort((a, b) => b.word.length - a.word.length)
  
  // Replace words with underscores
  const maskedWords: string[] = []
  for (const { word } of wordsToMask) {
    const underscores = '█'.repeat(word.length)
    maskedText = maskedText.replace(word, underscores)
    maskedWords.push(word)
  }
  
  return {
    masked: maskedText,
    revealed: text,
    maskedWords
  }
}

// Show answer - reveal the masked text
export function revealText(masked: string, maskedWords: string[]): string {
  let revealed = masked
  
  // Sort by length descending to avoid partial replacement issues
  const sortedWords = [...maskedWords].sort((a, b) => b.length - a.length)
  
  for (const word of sortedWords) {
    const underscores = '█'.repeat(word.length)
    revealed = revealed.replace(underscores, word)
  }
  
  return revealed
}
