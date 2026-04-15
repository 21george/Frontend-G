export interface Coach {
  id: string
  name: string
  surname?: string
  email: string
  phone?: string
  language: 'en' | 'de'
  currency?: string
  profile_photo?: string
  social_media?: {
    linkedin?: string
    instagram?: string
    website?: string
  }
  subscription_tier?: SubscriptionTier
  subscription_status?: SubscriptionStatus
  trial_ends_at?: string | null
  max_clients?: number
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  language: 'en' | 'de'
  address?: string
  city?: string
  postal_code?: string
  nationality?: string
  occupation?: string
  profile_photo_url?: string
  notes?: string
  active: boolean
  created_at: string
}

export interface Exercise {
  name: string
  sets: number
  reps: string
  rest_seconds: number
  notes?: string
  demo_video_url?: string
}

export interface WorkoutDay {
  day: string
  exercises: Exercise[]
}

export type WorkoutPlanType = 'individual' | 'group' | 'team'

export interface WorkoutPlan {
  id: string
  plan_type?: WorkoutPlanType
  client_id?: string
  client_ids?: string[]
  group_name?: string
  title: string
  week_start: string
  status: 'active' | 'completed' | 'draft'
  days: WorkoutDay[]
  notes?: string
  created_at: string
}

export interface SetLog {
  set_number: number
  reps: number
  kg: number
}

export interface ExerciseLog {
  name: string
  sets_completed: SetLog[]
}

export interface WorkoutLog {
  id: string
  workout_plan_id: string
  day: string
  exercises: ExerciseLog[]
  notes?: string
  completed_at: string
  media_count: number
}

export interface Meal {
  meal_name: string
  time: string
  foods: {
    name: string
    quantity: string
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }[]
}

export interface NutritionDay {
  day: string
  meals: Meal[]
}

export interface NutritionPlan {
  id: string
  client_id: string
  title: string
  week_start: string
  daily_totals: {
    calories: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  days: NutritionDay[]
  notes?: string
  created_at: string
}

export interface CheckinMeeting {
  id: string
  client_id: string
  scheduled_at: string
  type: 'call' | 'video' | 'chat'
  meeting_link?: string
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  client_response: 'pending' | 'accepted' | 'declined' | 'reschedule_requested'
  client_response_note?: string | null
  client_responded_at?: string | null
  proposed_scheduled_at?: string | null
}

export interface Message {
  id: string
  content: string
  sender_role: 'coach' | 'client'
  read: boolean
  sent_at: string
  media_url?: string
  media_type?: 'image' | 'file'
  media_filename?: string
}

export interface MediaUpload {
  id: string
  type: 'video' | 'photo'
  url: string
  uploaded_at: string
}

export interface BodyMeasurement {
  id: string
  weight_kg: number
  chest_cm: number
  waist_cm: number
  hips_cm: number
  arms_cm: number
  legs_cm: number
  body_fat_pct: number
  notes?: string
  recorded_at: string
}

export interface AnalyticsData {
  completion_rate: Array<{
    week: string
    total_days: number
    completed: number
    rate: number
  }>
  exercise_progress: Record<string, Array<{
    date: string
    max_kg: number
  }>>
  measurements: Array<{
    date: string | null
    weight_kg: number | null
    chest_cm: number | null
    waist_cm: number | null
    hips_cm: number | null
    body_fat_pct: number | null
  }>
  photos: Array<{
    id: string
    uploaded_at: string | null
    s3_key: string | null
    url?: string | null
  }>
  current_streak: number
  total_workouts: number
  total_volume?: number
  total_sets?: number
  total_reps?: number
  personal_records?: Array<{
    exercise: string
    max_kg: number
    date: string | null
  }>
  weekly_volume?: Array<{
    week: string
    volume: number
    sessions: number
  }>
}

export interface WorkoutLogDetailed {
  id: string
  workout_plan_id: string
  plan_title: string | null
  day: string
  exercises: Array<{
    name: string
    sets_completed: Array<{ set_number: number; reps_done?: number; reps?: number; kg: number }>
  }>
  planned_exercises: Array<{
    name: string
    sets: number
    reps: string
    rest_seconds: number
    notes?: string
    demo_video_url?: string
  }>
  notes: string | null
  completed_at: string
  media_count: number
  media: Array<{
    id: string
    type: 'video' | 'photo'
    s3_key: string | null
    url: string | null
    uploaded_at: string | null
  }>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: { total: number; page: number; per_page: number; total_pages: number }
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export type LiveTrainingCategory = 'strength' | 'cardio' | 'hiit' | 'yoga' | 'pilates' | 'stretching' | 'functional' | 'other'
export type LiveTrainingLevel = 'beginner' | 'intermediate' | 'advanced'
export type LiveTrainingStatus = 'upcoming' | 'live' | 'ended'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected'

export interface LiveTrainingSession {
  id: string
  coach_id: string
  title: string
  description: string
  category: LiveTrainingCategory
  level: LiveTrainingLevel
  duration_min: number
  scheduled_at: string | null
  max_participants: number
  requires_approval: boolean
  meeting_link: string
  status: LiveTrainingStatus
  participant_count: number
  started_at: string | null
  ended_at: string | null
  created_at: string | null
  // Client-specific fields
  is_participant?: boolean
  join_status?: JoinRequestStatus | null
}

export interface LiveTrainingRequest {
  id: string
  session_id: string
  client_id: string
  client_name: string
  client_photo: string | null
  status: JoinRequestStatus
  created_at: string | null
}

export interface LiveTrainingParticipant {
  id: string
  name: string
  photo: string | null
}

export interface LiveTrainingChatMessage {
  id: string
  sender_id: string
  sender_name: string
  sender_role: 'coach' | 'client'
  content: string
  sent_at: string | null
}

// ── Subscription ──────────────────────────────────────────────────────────────
export type SubscriptionTier = 'free' | 'pro' | 'business'
export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'cancelled'

export interface SubscriptionInfo {
  tier: SubscriptionTier
  status: SubscriptionStatus
  client_limit: number
  client_count: number
  trial_ends_at: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_customer_id: string | null
}
