/*
  # Create users table with proper column names

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `Имя` (text, not null) - First name in Russian
      - `Фамилия` (text, not null) - Last name in Russian
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `users` table
    - Add policies for:
      - Public insert access
      - Public read access
*/

-- Create users table with Russian column names
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "Имя" text NOT NULL,
  "Фамилия" text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public insert access"
  ON users
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public read access"
  ON users
  FOR SELECT
  TO public
  USING (true);