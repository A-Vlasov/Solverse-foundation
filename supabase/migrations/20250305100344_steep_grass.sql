/*
  # Create users table and policies

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to manage their own data
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can insert their own data" ON users;
  DROP POLICY IF EXISTS "Users can read their own data" ON users;
END $$;

-- Create policies
CREATE POLICY "Users can insert their own data"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = id
  );

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO public
  USING (
    auth.uid() = id
  );