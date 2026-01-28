-- Force disable RLS on viewing_passes to allow Custom Auth to read/write without Supabase Auth Token
ALTER TABLE viewing_passes DISABLE ROW LEVEL SECURITY;

-- Force disable RLS on viewing_history
ALTER TABLE viewing_history DISABLE ROW LEVEL SECURITY;

-- Ensure public access (since we are handling auth at application level)
GRANT ALL ON viewing_passes TO anon;
GRANT ALL ON viewing_passes TO authenticated;
GRANT ALL ON viewing_history TO anon;
GRANT ALL ON viewing_history TO authenticated;
GRANT ALL ON viewing_passes TO service_role;
GRANT ALL ON viewing_history TO service_role;

-- Verify 
COMMENT ON TABLE viewing_passes IS 'RLS Disabled for Custom Auth compatibility';
