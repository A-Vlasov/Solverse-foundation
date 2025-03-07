/*
  # Create users table with proper column order

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `Имя` (text)
      - `Фамилия` (text)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Имя" text NOT NULL,
  "Фамилия" text NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read their own data'
  ) THEN
    CREATE POLICY "Users can read their own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can create their own records'
  ) THEN
    CREATE POLICY "Users can create their own records"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;