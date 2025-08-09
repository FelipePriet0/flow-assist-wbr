import { createClient } from '@supabase/supabase-js'

// Atenção: Esta é uma chave pública (anon) e pode ficar no frontend.
// Em produção com Lovable + Supabase, considere usar a integração nativa e secrets.
const SUPABASE_URL = 'https://juxpvvpogpolspxnecsf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1eHB2dnBvZ3BvbHNweG5lY3NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MTA5OTIsImV4cCI6MjA3MDI4Njk5Mn0.sWhfCj4wT2pa3sU9o5kiE5lVhm67Emxft7eTA4qkdtQ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
