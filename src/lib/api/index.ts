/**
 * API service layer — barrel export.
 *
 * Import the configured axios instance:
 *   import api from '@/lib/api'
 *
 * Import domain services:
 *   import { clientsApi, workoutPlansApi } from '@/lib/api'
 */
export { default } from './client'
export { clientsApi } from './services/clients'
export { workoutPlansApi } from './services/workout-plans'
export { nutritionPlansApi } from './services/nutrition-plans'
export { checkinsApi } from './services/checkins'
export { messagesApi } from './services/messages'
export { mediaApi } from './services/media'
export { analyticsApi } from './services/analytics'
export { liveTrainingApi } from './services/live-training'
export { subscriptionApi } from './services/subscription'

