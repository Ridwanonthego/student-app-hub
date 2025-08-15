import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseUrl = 'https://rwvmbgpbvfjpiktfruzg.supabase.co'
// The user has stated that env vars are pre-configured, but the key is not being loaded.
// Hardcoding the public anon key provided by the user to fix the initialization error.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dm1iZ3BidmZqcGlrdGZydXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTA5OTcsImV4cCI6MjA3MDY2Njk5N30.x7wQ3FwF5oERk0s9kAeBtN9yIdPh1y4d0gFEZUdM7eU' as string

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)