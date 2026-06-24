// Supabase client — used only for file storage (we still use Firebase
// for auth and the database). This keeps the two services cleanly separated:
// Firebase = login + data records, Supabase = where the actual files live.
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DOCUMENTS_BUCKET = "documents";
