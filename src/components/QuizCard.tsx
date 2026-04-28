import { useState, useEffect, useCallback } from 'react'
import type { KnowledgePoint, ReviewProgress } from '../lib/supabase'
import { maskText, revealText, type MaskedText } from '../lib/word-masking'
import type { AnswerResult } from '../lib/algorithm'

interface QuizCardProps {
  point: KnowledgePoint
  progress: ReviewProgress
  onAnswer: (result: AnswerResult) => void
}

export function QuizCard({ point, progress, onAnswer }: QuizCardProps) {
  const [masked, setMasked] = useState<MaskedText | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<AnswerResult | null>(null)

  useEffect(() => {
    const maskedResult = maskText(point.answer_content, 4, 0.3)
    setMasked(maskedResult)
    setRevealed(false)
    setSelected(null)
  }, [point.id, point.answer_content])

  const handleReveal = useCallback(() => {
    if (masked) {
      setRevealed(true)
    }
  }, [masked])

  const handleAnswer = useCallback((result: AnswerResult) => {
    if (selected) return
    setSelected(result)
    onAnswer(result)
  }, [selected, onAnswer])

  const displayText = masked 
    ? (revealed ? revealText(masked.masked, masked.maskedWords) : masked.masked)
    : point.answer_content

  const roundDisplay = `${progress.current_round}/15`
  const statsDisplay = `答对${progress.correct_count} 答错${progress.wrong_count} 部分${progress.partial_count}`

  return (
    <div className="quiz-card">
      <div className="quiz-header">
        <span className="quiz-title">{point.title}</span>
      </div>
      
      <div className="quiz-meta">
        <span className="quiz-round">{roundDisplay}</span>
        <span className="quiz-stats">{statsDisplay}</span>
      </div>
      
      <div className="quiz-content">
        <div 
          className={`quiz-answer ${revealed ? 'revealed' : ''}`}
          dangerouslySetInnerHTML={{ 
            __html: displayText.replace(/\n/g, '<br/>') 
          }}
        />
        
        {masked && masked.maskedWords.length > 0 && !revealed && (
          <div className="mask-hint">
            提示：{masked.maskedWords.length} 个关键词已隐藏
          </div>
        )}
      </div>
      
      {!revealed && !selected && (
        <div className="quiz-actions">
          <button 
            className="btn btn-reveal"
            onClick={handleReveal}
          >
            显示答案
          </button>
        </div>
      )}
      
      {revealed && !selected && (
        <div className="quiz-actions">
          <button 
            className="btn btn-correct"
            onClick={() => handleAnswer('correct')}
          >
            <span className="btn-icon">✓</span>
            <span className="btn-text">掌握</span>
            <span className="btn-hint">1</span>
          </button>
          <button 
            className="btn btn-partial"
            onClick={() => handleAnswer('partial')}
          >
            <span className="btn-icon">~</span>
            <span className="btn-text">模糊</span>
            <span className="btn-hint">2</span>
          </button>
          <button 
            className="btn btn-wrong"
            onClick={() => handleAnswer('wrong')}
          >
            <span className="btn-icon">✗</span>
            <span className="btn-text">忘记</span>
            <span className="btn-hint">3</span>
          </button>
        </div>
      )}
      
      {selected && (
        <div className={`quiz-result quiz-result-${selected}`}>
          {selected === 'correct' && <span>✓ 掌握！</span>}
          {selected === 'partial' && <span>~ 模糊</span>}
          {selected === 'wrong' && <span>✗ 忘记</span>}
        </div>
      )}
    </div>
  )
}

export default QuizCard
