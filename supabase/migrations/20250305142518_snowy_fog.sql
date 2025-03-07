/*
  # Create users and chat messages tables

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `chat_messages`
      - `id` (bigint, primary key)
      - `user_id` (uuid, foreign key to users)
      - `ai_character` (text)
      - `message` (text)
      - `role` (text, check constraint)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can create their own records" ON users;
  DROP POLICY IF EXISTS "Users can read their own data" ON users;
  DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ai_character text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'AI')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS users_created_at_idx ON users(created_at);
CREATE INDEX IF NOT EXISTS users_updated_at_idx ON users(updated_at);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for users
CREATE POLICY "Users can create their own records"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Add RLS policies for chat messages
CREATE POLICY "Users can insert their own messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();