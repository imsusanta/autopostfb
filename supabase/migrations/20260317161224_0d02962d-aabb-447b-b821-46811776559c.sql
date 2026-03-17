
-- Create the settings table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Allow authenticated users to read settings"
ON public.settings
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to manage settings
CREATE POLICY "Allow authenticated users to manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
