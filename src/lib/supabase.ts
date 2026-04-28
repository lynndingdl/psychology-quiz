import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ymneuimkwnvjnokfrjia.supabase.co'
const supabaseKey = 'sb_publishable_WyUIqstiv43EcTMphzCl_w_jM6n6gQb'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface KnowledgePoint {
  id: string
  title: string
  question_type: string
  answer_content: string
  created_at: string
}

export interface ReviewProgress {
  id: string
  point_id: string
  current_round: number
  correct_count: number
  partial_count: number
  wrong_count: number
  next_review_time: string
  history: string
  created_at: string
  updated_at: string
}

export async function getKnowledgePoints(): Promise<KnowledgePoint[]> {
  const { data, error } = await supabase
    .from('knowledge_points')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching knowledge points:', error)
    return []
  }
  return data || []
}

export async function getReviewProgress(): Promise<ReviewProgress[]> {
  const { data, error } = await supabase
    .from('review_progress')
    .select('*')
  
  if (error) {
    console.error('Error fetching review progress:', error)
    return []
  }
  return data || []
}

export async function getOrCreateReviewProgress(pointId: string): Promise<ReviewProgress | null> {
  const { data: existing } = await supabase
    .from('review_progress')
    .select('*')
    .eq('point_id', pointId)
    .single()
  
  if (existing) return existing
  
  const { data, error } = await supabase
    .from('review_progress')
    .insert({ point_id: pointId })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating review progress:', error)
    return null
  }
  return data
}

export async function updateReviewProgress(
  progressId: string,
  updates: Partial<ReviewProgress>
): Promise<boolean> {
  const { error } = await supabase
    .from('review_progress')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', progressId)
  
  if (error) {
    console.error('Error updating review progress:', error)
    return false
  }
  return true
}

export async function seedKnowledgePoints(points: Omit<KnowledgePoint, 'id' | 'created_at'>[]): Promise<boolean> {
  const { error } = await supabase
    .from('knowledge_points')
    .upsert(points, { onConflict: 'title' })
  
  if (error) {
    console.error('Error seeding knowledge points:', error)
    return false
  }
  return true
}
