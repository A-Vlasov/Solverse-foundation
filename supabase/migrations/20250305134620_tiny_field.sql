/*
  # Create chat messages table

  1. New Tables
    - `chat_messages`
      - `id` (bigint, primary key)
      - `user_id` (uuid)
      - `ai_character` (text)
      - `message` (text)
      - `role` (text)
      - `created_at` (timestamptz)

  2. Indexes
    - Index on user_id for faster lookups
    - Index on created_at for sorting
    
  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create chat_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT PRIMARY KEY,
  user_id UUID,
  ai_character TEXT NOT NULL,
  message TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can insert their own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
    
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
END $$;