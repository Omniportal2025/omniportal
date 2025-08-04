import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://krrumlttvcgcnislqoxc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtycnVtbHR0dmNnY25pc2xxb3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2NzUxNjYsImV4cCI6MjA1NDI1MTE2Nn0.FlqXb5NLyKesUaNv3TnhdqGry1Dm3groxCwZ4cGsQLc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);