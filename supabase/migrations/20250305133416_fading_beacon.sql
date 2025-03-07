/*
  # Fix Users Table Schema

  1. Changes
    - Drop existing users table if exists
    - Create new users table with correct column names:
      - id (uuid, primary key)
      - first_name (text)
      - last_name (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for:
      - Reading own data
      - Creating own records
      - Public read access for testing
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct columns
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$ 
BEGIN
  -- Users can read their own data
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

  -- Users can create their own records
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

  -- Allow public read access for testing
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

  -- Allow public insert access for testing
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
END $$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_updated_at_idx ON users(updated_at);