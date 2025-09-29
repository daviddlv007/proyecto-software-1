import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://znhevlcnkwzalnpmetfb.supabase.co'; // copia de tu panel
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaGV2bGNua3d6YWxucG1ldGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjE3OTEsImV4cCI6MjA3NDMzNzc5MX0.78FvMHVMWNDI1HxYS7l8o9AhFEOQZlRZ0BCsYGd4FGk'; // copia de tu panel

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
