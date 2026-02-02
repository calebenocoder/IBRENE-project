-- Create a private bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'site-assets' );

-- Policy: Only admins can upload/update/delete
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );

CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'site-assets' AND auth.role() = 'authenticated' );
