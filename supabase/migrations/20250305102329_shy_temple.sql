/*
  # Create users table with first and last name

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `users` table
    - Add policies for public access to allow user creation and reading
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can insert their own data" ON users;
    DROP POLICY IF EXISTS "Users can read their own data" ON users;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create new policies
CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO public
  USING (true);