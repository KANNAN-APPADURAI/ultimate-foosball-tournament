import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://leobuvhktdocbxggmett.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlb2J1dmhrdGRvY2J4Z2dtZXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyODM5OTcsImV4cCI6MjA4OTg1OTk5N30.jTb_DzHJ3EQTWxjACrgDqF5wNTLFd_vPJTYF7a2uVM0";

const supabase = createClient(supabaseUrl, supabaseKey);

// expose globally so other scripts can use it
window.supabase = supabase;