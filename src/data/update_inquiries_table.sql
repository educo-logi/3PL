-- Inquiries Table (1:1 문의)
CREATE TABLE public.inquiries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, resolved
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_member BOOLEAN DEFAULT false,
    user_id UUID -- Optional, link to user if logged in
);

-- RLS Policy for Inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert inquiries (public access for contact form)
CREATE POLICY "Enable insert for all" ON public.inquiries FOR INSERT WITH CHECK (true);

-- Allow admins or specific users to read (simplified for MVP)
CREATE POLICY "Enable read for all" ON public.inquiries FOR SELECT USING (true);
