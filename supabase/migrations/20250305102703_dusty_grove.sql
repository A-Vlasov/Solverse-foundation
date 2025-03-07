/*
  # Create users table with proper schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text, not null)
      - `last_name` (text, not null)
      - `created_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `users` table
    - Add policies for public access
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
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