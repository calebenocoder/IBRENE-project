import { supabase } from "./src/lib/supabase"; supabase.from("site_posts").select("content").then(res => console.log(res.data[0].content));
