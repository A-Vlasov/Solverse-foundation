/*
  # Create chat messages table and policies

  1. New Tables
    - `chat_messages`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `ai_character` (text)
      - `message` (text)
      - `role` (text) - either 'user' or 'AI'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `chat_messages` table
    - Add policies for authenticated users to:
      - Read their own messages
      - Create new messages

  3. Indexes
    - On user_id for faster user-specific queries
    - On created_at for chronological sorting
*/

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ai_character text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'AI')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can read their own messages'
  ) THEN
    CREATE POLICY "Users can read their own messages"
      ON chat_messages
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Users can create messages'
  ) THEN
    CREATE POLICY "Users can create messages"
      ON chat_messages
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);