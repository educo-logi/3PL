-- Payment History Table
CREATE TABLE public.payment_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Page Views Table (Simple Analytics)
CREATE TABLE public.page_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    page_path VARCHAR(255) NOT NULL,
    user_id UUID, -- Optional, null if guest
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Simplified for MVP)
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow insert for authenticated users (payments)
CREATE POLICY "Enable insert for users" ON public.payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Allow select for admins (conceptual, in MVP we might just allow all read if admin check is done in app)
CREATE POLICY "Enable read for all" ON public.payment_history FOR SELECT USING (true);

-- Allow insert for everyone (page views)
CREATE POLICY "Enable insert for all" ON public.page_views FOR INSERT WITH CHECK (true);
-- Allow select for all (for admin dashboard)
CREATE POLICY "Enable read for all" ON public.page_views FOR SELECT USING (true);
