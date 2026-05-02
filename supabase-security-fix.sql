-- Fix storage upload policy: restrict to own user folder only
-- Run in: https://supabase.com/dashboard/project/nunygjzicawqvskxnawf/sql

DROP POLICY IF EXISTS "Authenticated upload item images" ON storage.objects;

CREATE POLICY "Owner upload item images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'item-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Also lock updates to own folder
DROP POLICY IF EXISTS "Owner update item images" ON storage.objects;
CREATE POLICY "Owner update item images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
