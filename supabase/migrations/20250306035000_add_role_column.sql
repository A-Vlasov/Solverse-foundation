/*
  # Add role column to chat_messages table if it doesn't exist

  1. Changes:
    - Add role column to chat_messages table
    - Set default value to 'user'
    - Add check constraint to ensure role is either 'user' or 'AI'
*/

-- Add role column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_messages' AND column_name = 'role'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'AI'));
  END IF;
END
$$; 