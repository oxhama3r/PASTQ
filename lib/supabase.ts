import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export type Programme = {
  id: number
  name: string
  created_at: string
}

export type Level = {
  id: number
  name: string
}

export type Session = {
  id: number
  name: string
}

export type Course = {
  id: number
  course_code: string
  title: string
  programme_id: number
  level_id: number
}

export type PastQuestion = {
  id: number
  course_id: number
  session_id: number
  pdf_url: string
  download_count: number
  uploaded_at: string
  course?: Course
  session?: Session
}
