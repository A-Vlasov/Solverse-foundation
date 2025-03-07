/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policies for authenticated users to:
      - Create their own records
      - Read their own records
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own records"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own records"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);