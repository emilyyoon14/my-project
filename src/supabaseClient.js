import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvhgjphnpdmnmqjlmygn.supabase.co'
const supabaseKey = 'sb_publishable_YJlX-ERaSFQ-r1YyNZsxpA_GKU5ue-r'

export const supabase = createClient(supabaseUrl, supabaseKey)