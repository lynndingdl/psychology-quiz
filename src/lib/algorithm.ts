// Ebbinghaus + weighted intervals algorithm

// 15 rounds with base intervals (in hours)
export const INTERVALS: Record<number, number> = {
  1: 0.3,   // 20 minutes
  2: 1,     // 1 hour
  3: 2,     // 2 hours
  4: 4,     // 4 hours
  5: 8,     // 8 hours
  6: 16,    // 16 hours
  7: 32,    // 32 hours
  8: 48,    // 48 hours
  9: 64,    // 64 hours
  10: 96,   // 96 hours
  11: 120,  // 120 hours
  12: 168,  // 168 hours (7 days)
  13: 228,  // 228 hours
  14: 288,  // 288 hours
  15: 360,  // 360 hours (15 days)
}

// Weighted offsets based on round range
export const WEIGHTED_OFFSETS = {
  CORRECT: {
    1: 4,   // rounds 1-5: +4h
    6: 24,  // rounds 6-10: +24h
    11: 120 // rounds 11-15: +120h
  },
  WRONG: {
    1: -2,  // rounds 1-5: -2h
    6: -8,  // rounds 6-10: -8h
    11: -24 // rounds 11-15: -24h
  }
}

export type AnswerResult = 'correct' | 'partial' | 'wrong'

export interface ReviewUpdate {
  newRound: number
  nextReviewTime: Date
  historyEntry: string
}

function getOffsetRange(round: number): 1 | 6 | 11 {
  if (round <= 5) return 1
  if (round <= 10) return 6
  return 11
}

export function calculateNextReview(
  currentRound: number,
  result: AnswerResult,
  currentTime: Date = new Date()
): ReviewUpdate {
  let newRound: number
  let baseInterval: number
  let offset: number

  switch (result) {
    case 'correct':
      // Advance round, max 15
      newRound = Math.min(currentRound + 1, 15)
      baseInterval = INTERVALS[newRound]
      const correctOffsetRange = getOffsetRange(currentRound)
      offset = WEIGHTED_OFFSETS.CORRECT[correctOffsetRange]
      break
    
    case 'wrong':
      // Demote round, min 1
      newRound = Math.max(currentRound - 1, 1)
      baseInterval = INTERVALS[newRound]
      const wrongOffsetRange = getOffsetRange(currentRound)
      offset = WEIGHTED_OFFSETS.WRONG[wrongOffsetRange]
      break
    
    case 'partial':
      // Keep round
      newRound = currentRound
      baseInterval = INTERVALS[newRound]
      offset = 0
      break
  }

  // Calculate interval in milliseconds
  const intervalHours = Math.max(baseInterval + offset, 0.3) // min 20 minutes
  const intervalMs = intervalHours * 60 * 60 * 1000
  
  const nextReviewTime = new Date(currentTime.getTime() + intervalMs)

  const historyEntry = `${new Date().toISOString()}:${result}`

  return {
    newRound,
    nextReviewTime,
    historyEntry
  }
}

export function formatTimeUntil(targetDate: Date): string {
  const now = new Date()
  const diffMs = targetDate.getTime() - now.getTime()
  
  if (diffMs <= 0) return '现在'
  
  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时`
  const minutes = Math.floor(diffMs / (60 * 1000))
  return `${minutes}分钟`
}

export function sortByNextReview<T extends { next_review_time: string }>(items: T[]): T[] {
  return items.sort((a, b) => 
    new Date(a.next_review_time).getTime() - new Date(b.next_review_time).getTime()
  )
}
