import type { AnswerResult } from '../lib/algorithm'

interface ResultBadgeProps {
  result: AnswerResult
  message?: string
}

export function ResultBadge({ result, message }: ResultBadgeProps) {
  const config = {
    correct: { icon: '✓', text: '掌握', className: 'badge-correct' },
    partial: { icon: '~', text: '模糊', className: 'badge-partial' },
    wrong: { icon: '✗', text: '忘记', className: 'badge-wrong' }
  }

  const { icon, text, className } = config[result]

  return (
    <div className={`result-badge ${className}`}>
      <span className="badge-icon">{icon}</span>
      <span className="badge-text">{message || text}</span>
    </div>
  )
}

export default ResultBadge
