/*
  # Update users table and create chat messages

  1. Changes to Users Table
    - Ensure users table has first_name and last_name columns
    - Add proper constraints and defaults

  2. New Tables
    - `chat_messages`
      - `id` (bigint, primary key)
      - `user_id` (uuid, foreign key to users)
      - `ai_character` (text)
      - `message` (text)
      - `role` (text)
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on chat_messages table
    - Add policies for authenticated users to:
      - Insert their own messages
      - Read their own messages
*/

-- First ensure the users table has the correct columns
DO $$ BEGIN
  -- Add first_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name text NOT NULL;
  END IF;

  -- Add last_name if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name text NOT NULL;
  END IF;
END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ai_character text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'AI')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Add RLS policies
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