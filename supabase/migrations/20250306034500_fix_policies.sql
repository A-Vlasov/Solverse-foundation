/*
  # Fix conflicting RLS policies for users table

  1. Changes:
    - Drop conflicting INSERT policy that requires auth.uid() = id
    - Keep the policy that allows public INSERT access
*/

-- Drop conflicting policy
DROP POLICY IF EXISTS "Users can create their own records" ON users;

-- Make sure we have the correct policies
DO $$
BEGIN
  -- Check and create insert policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access"
      ON users
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  -- Check and create select policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON users
      FOR SELECT
      TO public
      USING (true);
  END IF;
END
$$; 