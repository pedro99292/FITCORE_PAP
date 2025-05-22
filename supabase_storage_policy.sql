-- Run these SQL commands in Supabase SQL Editor to set up proper permissions for the useravatars bucket

-- Allow public read access to all files in the useravatars bucket
CREATE POLICY "Public Access Policy" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'useravatars');

-- Allow authenticated users to upload to useravatars bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'useravatars' AND 
  auth.role() = 'authenticated'
);

-- Allow users to update their own uploaded files
CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'useravatars' AND 
  auth.uid() = owner
);

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'useravatars' AND 
  auth.uid() = owner
); 