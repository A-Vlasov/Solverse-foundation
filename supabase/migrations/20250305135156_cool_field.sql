/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (bigint, primary key)
      - `user_id` (uuid, references users)
      - `ai_character` (text, not null)
      - `message` (text, not null)
      - `role` (text, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to:
      - Insert their own messages
      - Read their own messages

  3. Indexes
    - Create index on user_id for faster lookups
    - Create index on created_at for chronological sorting
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can insert their own messages'
  ) THEN
    DROP POLICY "Users can insert their own messages" ON chat_messages;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can read their own messages'
  ) THEN
    DROP POLICY "Users can read their own messages" ON chat_messages;
  END IF;
END $$;

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id bigint PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  ai_character text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'AI')),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

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