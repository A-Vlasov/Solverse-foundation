/*
  # Create test_sessions table

  1. New Tables
    - `test_sessions`
      - `id` (uuid, primary key) - Unique test ID
      - `user_id` (uuid, foreign key) - Reference to users table
      - `ai_character` (text) - AI character name
      - `message` (text) - Message content
      - `role` (text) - Message sender (user/AI)
      - `test_status` (text) - Test status
      - `created_at` (timestamptz) - Message timestamp

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create test_sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  ai_character text NOT NULL,
  message text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'AI')),
  test_status text NOT NULL DEFAULT 'in_progress' CHECK (test_status IN ('in_progress', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own test sessions"
  ON test_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own test sessions"
  ON test_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX test_sessions_user_id_idx ON test_sessions(user_id);
CREATE INDEX test_sessions_created_at_idx ON test_sessions(created_at);