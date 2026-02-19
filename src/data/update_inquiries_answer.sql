-- Add answer column to inquiries table
ALTER TABLE public.inquiries 
ADD COLUMN IF NOT EXISTS answer TEXT,
ADD COLUMN IF NOT EXISTS answered_at TIMESTAMP WITH TIME ZONE;
