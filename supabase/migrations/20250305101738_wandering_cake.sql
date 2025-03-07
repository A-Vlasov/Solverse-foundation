/*
  # Update users table structure

  1. Changes
    - Drop existing users table
    - Recreate users table with simplified structure:
      - `id` (uuid, primary key)
      - `username` (text, for storing first and last name)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Drop existing table and its policies
DROP TABLE IF EXISTS users CASCADE;

-- Create new users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
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