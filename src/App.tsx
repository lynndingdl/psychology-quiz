import { useState, useEffect, useCallback } from 'react'
import './styles/App.css'
import {
  type KnowledgePoint,
  type ReviewProgress,
  getKnowledgePoints,
  getReviewProgress,
  getOrCreateReviewProgress,
  updateReviewProgress,
  seedKnowledgePoints
} from './lib/supabase'
import { calculateNextReview, type AnswerResult } from './lib/algorithm'
import { QuizCard } from './components/QuizCard'
import { ResultBadge } from './components/ResultBadge'

const QUESTIONS_PER_SESSION = 20

// Sample psychology knowledge points for seeding
const SAMPLE_POINTS = [
  { title: '感觉的定义', question_type: '名词解释', answer_content: '感觉是人脑对直接作用于感觉器官的客观事物个别属性的反映。它是最简单、最基本的心理现象，是认识的起点。感觉分为外部感觉（视觉、听觉、嗅觉、味觉、皮肤感觉）和内部感觉（运动觉、平衡觉、机体觉）。' },
  { title: '知觉的基本特征', question_type: '简答题', answer_content: '知觉的基本特征包括：选择性（人在知觉过程中把知觉对象从背景中区分出来的特性）、理解性（人在知觉过程中用已有的知识经验来理解当前事物的特性）、整体性（人脑把直接作用于感觉器官的客观事物的部分属性整合为整体机能）、恒常性（当知觉条件在一定范围内改变时人们对事物的知觉保持相对稳定的特性）。' },
  { title: '记忆的定义', question_type: '名词解释', answer_content: '记忆是在头脑中积累和保存个体经验的过程。从信息加工论的观点看，记忆就是人脑对外界输入的信息进行编码、存储和提取的过程。记忆包括感觉记忆、短时记忆和长时记忆三个子系统。' },
  { title: '遗忘的规律', question_type: '简答题', answer_content: '遗忘的规律是德国心理学家艾宾浩斯提出的"遗忘曲线"。研究表明，遗忘进程是不均衡的，在识记后的短时间内遗忘很快，之后逐渐减慢。遗忘的进程先快后慢，先多后少，呈负加速趋势。' },
  { title: '思维的定义', question_type: '名词解释', answer_content: '思维是人脑对客观事物本质特征和规律性联系的反应，是认识的高级形式。思维具有间接性（通过其他媒介来认识事物）和概括性（从大量事物中抽取共同特征）两个特点。思维包括直观动作思维、具体形象思维和抽象逻辑思维三种形式。' },
  { title: '想象的功能', question_type: '简答题', answer_content: '想象是对头脑中已有的表象进行加工改造，创造出新形象的心理过程。想象的功能包括：预见作用（预见活动的结果，调整行为方向）、补充作用（弥补记忆表象的不足）、替代作用（满足现实中无法满足的需要）、调节作用（调节机体的生理活动）。' },
  { title: '注意的定义', question_type: '名词解释', answer_content: '注意是心理活动对一定对象的指向和集中。它是伴随着其他心理过程而产生的一种意识活动状态。注意具有指向性（选择一定对象）和集中性（对对象的聚集和坚持）两个基本特征。注意分为无意注意（不随意注意）和有意注意（随意注意）。' },
  { title: '情绪的定义', question_type: '名词解释', answer_content: '情绪是人对客观事物是否符合需要而产生的主观体验和外在表现。情绪的基本形式包括心境（微弱而持久的情绪状态）、激情（强烈的、短暂的情绪状态）和应激（对意外刺激产生的适应性反应）。情绪由认知、主观体验、生理反应和行为表现四部分组成。' },
  { title: '动机的定义', question_type: '名词解释', answer_content: '动机是推动人从事某种活动，并朝一定方向前进的内部动力。是需要、兴趣、理想、世界观等心理成分支配的表现。动机可以激发活动、维持活动和调节活动。动机的功能包括：激活功能、指向功能、强化功能。' },
  { title: '马斯洛需要层次理论', question_type: '简答题', answer_content: '马斯洛需要层次理论把人的需要按其发展顺序分为七个层次：生理需要、安全需要、归属和爱的需要、尊重需要、认知需要、审美需要、自我实现需要。其中前四个层次为基本需要（匮乏性需要），后三个层次为成长需要（自我实现的需要）。一般只有较低层次的需要得到基本满足后，较高层次的需要才会出现。' },
  { title: '能力的定义', question_type: '名词解释', answer_content: '能力是直接影响活动效率，使活动顺利完成的个性心理特征。它包含两层含义：一是指个人现在所能做到的，即实际能力；二是指个人可能做到的，即潜能。能力的分类包括：一般能力和特殊能力、模仿能力和创造能力、流体能力和晶体能力。' },
  { title: '人格的定义', question_type: '名词解释', answer_content: '人格是指一个人整体的精神面貌，是具有一定倾向性的心理特征的总和。人格包括性格（对现实态度和行为方式中稳定的核心因素）和气质（心理活动的动力特征）两个方面。人格具有整体性、稳定性、独特性和社会性四个特征。' },
  { title: '皮亚杰认知发展阶段理论', question_type: '简答题', answer_content: '皮亚杰将儿童认知发展分为四个阶段：感知运动阶段（0-2岁，通过感觉和动作认识世界）、前运算阶段（2-7岁，象征性功能开始发展）、具体运算阶段（7-11岁，初步逻辑思维）、形式运算阶段（11岁以后，抽象逻辑思维）。' },
  { title: '维果茨基"最近发展区"概念', question_type: '名词解释', answer_content: '维果茨基的"最近发展区"是指儿童现有发展水平与在成人指导下或在有能力的同伴合作下所达到的解决问题水平之间的差距。它表明儿童发展可能性的状态，是教学改进的基础。教学应走在发展的前面，着眼于学生的最近发展区。' },
  { title: '社会化的定义', question_type: '名词解释', answer_content: '社会化是个体在与社会相互作用过程中，通过社会文化来学习和掌握知识、技能、语言、社会规范等，使自己成为合格社会成员的过程。社会化的内容包括：生活劳动技能、社会规范、行为方式、角色观念、人生目标。' },
  { title: '从众的定义', question_type: '名词解释', answer_content: '从众是个体在群体压力下，不顾事实和逻辑，放弃自己的意见，采取与大多数人一致的行为的现象。从众的类型包括：真从众（表面从众，内心也接受）、假从众（表面从众，内心怀疑）和不顺从（表面不从众，内心也不接受）。' },
  { title: '服从的定义', question_type: '名词解释', answer_content: '服从是个体在权威或团体规范影响下，放弃自己的意见而采取相反的行为的现象。服从与从众的主要区别在于：服从是个体对特定指令或权威的顺从，而从众是个体对群体一般性影响的接受。影响服从的因素包括：权威性、他人支持、正义感等。' },
  { title: '认知失调理论', question_type: '简答题', answer_content: '认知失调理论由费斯廷格提出，指个体认识到自己的态度之间或态度与行为之间存在不一致。当出现认知失调时，个体会产生不愉快体验，并试图减少这种不协调。减少认知失调的方式包括：改变态度、改变行为、增加认知（找理由解释）。' },
  { title: '归因理论', question_type: '简答题', answer_content: '归因是指个体根据外部信息或行为特征对他人或自己的行为原因进行推测和判断。海德提出归因的内外因素，维纳进一步发展了归因理论，将其分为：因素来源（内部/外部）、稳定性（稳定/不稳定）、可控性（可控/不可控）。' },
  { title: '自我效能感', question_type: '名词解释', answer_content: '自我效能感由班杜拉提出，是指个体对自己是否有能力完成某一行为进行的推测与判断。自我效能感的形成因素包括：直接经验（成败体验）、替代经验、言语说服、情绪唤醒。自我效能感影响活动的选择、努力程度、坚持性和思维模式。' },
  { title: '应激的定义', question_type: '名词解释', answer_content: '应激是指个体由于生活和工作中的突发事件、环境改变或重大压力事件引起的情绪反应。应激反应包括生理反应（肾上腺素分泌增加、血压升高等）和心理反应（紧张、焦虑、愤怒等）。适度的应激有助于提高警觉，但长期的应激会损害身心健康。' },
  { title: '心理防御机制', question_type: '简答题', answer_content: '心理防御机制是自我面对超我要求和本我欲望时产生焦虑，为解除紧张感而采取的心理策略。常见的防御机制包括：压抑（把令人痛苦的想法排除在意识外）、投射（把自己的问题归咎于他人）、否认（拒绝承认现实）、退行（返回早期发展阶段）、合理化（为不合理行为找合理理由）、升华（将痛苦转化为社会认可的行为）。' },
  { title: '经典条件反射', question_type: '名词解释', answer_content: '经典条件反射由巴甫洛夫提出，是将非条件刺激与条件刺激配对，使条件刺激单独引起条件反应的过程。经典条件反射的规律包括：习得、消退、自然恢复、刺激泛化、刺激分化。' },
  { title: '操作条件反射', question_type: '名词解释', answer_content: '操作条件反射由斯金纳提出，是通过强化（正强化或负强化）来增加行为发生概率的过程。强化分为正强化（呈现愉快刺激增加行为）和负强化（撤销厌恶刺激增加行为）。强化的程序包括连续强化和间歇强化。' },
  { title: '学习迁移的定义', question_type: '名词解释', answer_content: '学习迁移是指一种学习经验对另一种学习的影响。迁移的分类包括：正迁移（一种学习促进另一种学习）、负迁移（一种学习干扰另一种学习）、零迁移（两种学习没有影响）；按迁移方向可分为顺向迁移和逆向迁移。' },
  { title: '问题解决的过程', question_type: '简答题', answer_content: '问题解决是一个复杂的认知过程，包括：发现问题（认识到问题存在）、明确问题（分析问题特征和条件）、提出假设（提出可能的解决方案）、检验假设（验证假设是否正确）。问题解决的策略包括算法式策略和启发式策略。' },
  { title: '创造性思维的特征', question_type: '简答题', answer_content: '创造性思维是产生新颖而有价值想法的思维过程。其特征包括：流畅性（思路丰富，短时间内产生大量想法）、灵活性（思路灵活多变，能从不同角度思考）、独特性（想法新颖独特）、变通性（能触类旁通，举一反三）。' },
  { title: '依恋理论', question_type: '简答题', answer_content: '依恋是婴儿与照看者之间形成的情感纽带。鲍尔比提出依恋理论，安斯沃斯通过陌生情境研究将依恋分为：安全依恋（婴儿将照看者作为安全基地）、焦虑-矛盾型依恋（婴儿对分离极度焦虑）、回避型依恋（婴儿对分离不表现出明显情绪）。依恋类型影响儿童日后的人际关系模式。' },
  { title: '自我意识的发展', question_type: '简答题', answer_content: '自我意识是个体对自己以及自己与周围关系的认识。包括自我认识（自我观察、自我评价）、自我体验（自尊、自信、自卑等情绪）和自我监控（自我调节、自我控制）三个方面。青春期是自我意识发展的关键期，表现为自我意识的独立性和批判性增强。' },
  { title: '印象形成的效应', question_type: '简答题', answer_content: '印象形成是个体在社会交往中对他人形成整体印象的过程。主要效应包括：首因效应（第一印象的作用）、晕轮效应（以点概面的倾向）、近因效应（最近印象的影响）、刻板印象（对某群体的固定看法）、投射效应（以己度人的倾向）。' },
]

interface SessionQuestion {
  point: KnowledgePoint
  progress: ReviewProgress
}

function App() {
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<SessionQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionStats, setSessionStats] = useState({ correct: 0, partial: 0, wrong: 0 })
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null)
  const [seeding, setSeeding] = useState(false)
  const [needsSeed, setNeedsSeed] = useState(false)

  const loadQuestions = useCallback(async () => {
    try {
      // Get all knowledge points
      const points = await getKnowledgePoints()
      
      if (points.length === 0) {
        setNeedsSeed(true)
        setLoading(false)
        return
      }

      // Get review progress for all points
      const allProgress = await getReviewProgress()
      const progressMap = new Map(allProgress.map(p => [p.point_id, p]))

      // For each point, get or create progress
      const sessionQuestions: SessionQuestion[] = []
      const now = new Date()

      for (const point of points) {
        let progress = progressMap.get(point.id)
        
        if (!progress) {
          const newProgress = await getOrCreateReviewProgress(point.id)
          if (!newProgress) continue
          progress = newProgress
        }

        // Sort by next_review_time, prioritize due questions
        sessionQuestions.push({ point, progress })
      }

      // Sort by next_review_time
      sessionQuestions.sort((a, b) => {
        const timeA = new Date(a.progress.next_review_time).getTime()
        const timeB = new Date(b.progress.next_review_time).getTime()
        // Prioritize overdue questions (time < now)
        const overdueA = timeA < now.getTime() ? -Infinity : timeA
        const overdueB = timeB < now.getTime() ? -Infinity : timeB
        return overdueA - overdueB
      })

      // Take up to 20 questions
      setQuestions(sessionQuestions.slice(0, QUESTIONS_PER_SESSION))
      setCurrentIndex(0)
      setSessionStats({ correct: 0, partial: 0, wrong: 0 })
      setLastResult(null)
      setLoading(false)
    } catch (error) {
      console.error('Error loading questions:', error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuestions()
  }, [loadQuestions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || questions.length === 0) return
      
      const currentQ = questions[currentIndex]
      if (!currentQ) return

      // These shortcuts work when answer buttons are visible
      if (e.key === '1') {
        // Simulate click on first answer button
        const btn = document.querySelector('.btn-correct') as HTMLButtonElement
        if (btn) btn.click()
      } else if (e.key === '2') {
        const btn = document.querySelector('.btn-partial') as HTMLButtonElement
        if (btn) btn.click()
      } else if (e.key === '3') {
        const btn = document.querySelector('.btn-wrong') as HTMLButtonElement
        if (btn) btn.click()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [loading, questions, currentIndex])

  const handleAnswer = useCallback(async (result: AnswerResult) => {
    const currentQ = questions[currentIndex]
    if (!currentQ) return

    const { newRound, nextReviewTime, historyEntry } = calculateNextReview(
      currentQ.progress.current_round,
      result
    )

    // Update local stats
    setSessionStats(prev => ({
      ...prev,
      [result]: prev[result] + 1
    }))
    setLastResult(result)

    // Update in Supabase
    await updateReviewProgress(currentQ.progress.id, {
      current_round: newRound,
      correct_count: result === 'correct' ? currentQ.progress.correct_count + 1 : currentQ.progress.correct_count,
      partial_count: result === 'partial' ? currentQ.progress.partial_count + 1 : currentQ.progress.partial_count,
      wrong_count: result === 'wrong' ? currentQ.progress.wrong_count + 1 : currentQ.progress.wrong_count,
      next_review_time: nextReviewTime.toISOString(),
      history: (currentQ.progress.history || '') + historyEntry
    })

    // Move to next question after a delay
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1)
      }
    }, 1000)
  }, [questions, currentIndex])

  const handleSeed = useCallback(async () => {
    setSeeding(true)
    try {
      await seedKnowledgePoints(SAMPLE_POINTS)
      await loadQuestions()
    } catch (error) {
      console.error('Error seeding data:', error)
    }
    setSeeding(false)
  }, [loadQuestions])

  const handleRestart = useCallback(() => {
    loadQuestions()
  }, [loadQuestions])

  const progressPercent = questions.length > 0 
    ? ((currentIndex + 1) / questions.length) * 100 
    : 0

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading-spinner"></div>
          <div className="loading-text">加载中...</div>
        </div>
      </div>
    )
  }

  if (needsSeed) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">心理学知识复习</h1>
          <p className="app-subtitle">基于艾宾浩斯记忆曲线</p>
        </header>
        
        <div className="seed-section">
          <p style={{ marginBottom: '12px', color: '#666' }}>
            数据库暂无题目，需要先导入题目数据。
          </p>
          <button 
            className="seed-btn" 
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? '导入中...' : '导入题目'}
          </button>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">心理学知识复习</h1>
          <p className="app-subtitle">基于艾宾浩斯记忆曲线</p>
        </header>
        
        <div className="empty-state">
          <h2 className="empty-title">暂无待复习题目</h2>
          <p className="empty-text">所有题目都已复习完毕，稍后再来！</p>
        </div>
      </div>
    )
  }

  // Session complete
  if (currentIndex >= questions.length) {
    return (
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">心理学知识复习</h1>
          <p className="app-subtitle">基于艾宾浩斯记忆曲线</p>
        </header>
        
        <div className="session-complete">
          <h2 className="complete-title">本轮复习完成！</h2>
          <p className="complete-subtitle">共 {questions.length} 题</p>
          
          <div className="complete-stats">
            <div className="complete-stat">
              <div className="complete-stat-value correct">{sessionStats.correct}</div>
              <div className="complete-stat-label">掌握</div>
            </div>
            <div className="complete-stat">
              <div className="complete-stat-value partial">{sessionStats.partial}</div>
              <div className="complete-stat-label">模糊</div>
            </div>
            <div className="complete-stat">
              <div className="complete-stat-value wrong">{sessionStats.wrong}</div>
              <div className="complete-stat-label">忘记</div>
            </div>
          </div>
          
          <button className="complete-btn" onClick={handleRestart}>
            再来一轮
          </button>
        </div>
      </div>
    )
  }

  const currentQ = questions[currentIndex]

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">心理学知识复习</h1>
        <p className="app-subtitle">基于艾宾浩斯记忆曲线</p>
      </header>

      <div className="progress-bar">
        <div className="progress-info">
          <span className="progress-text">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="progress-track">
          <div 
            className="progress-fill" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {lastResult && (
        <div className="last-result">
          <ResultBadge result={lastResult} />
          <span className="last-result-text">上一题</span>
        </div>
      )}

      <QuizCard
        point={currentQ.point}
        progress={currentQ.progress}
        onAnswer={handleAnswer}
      />

      <div className="keyboard-hint">
        按 1 掌握 / 2 模糊 / 3 忘记
      </div>
    </div>
  )
}

export default App
