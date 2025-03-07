/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (bigint, primary key)
      - `user_id` (uuid, foreign key to users)
      - `ai_character` (text)
      - `message` (text)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to:
      - Insert their own messages
      - Read their own messages
*/

-- Create chat_messages table if it doesn't exist
DO $$ BEGIN
  CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    ai_character TEXT NOT NULL,
    message TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  );
EXCEPTION
  WHEN duplicate_table THEN
    NULL;
END $$;

-- Create indexes if they don't exist
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
  DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Create new policies
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