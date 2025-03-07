/*
  # Create employees table

  1. New Tables
    - `employees`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `department` (text)
      - `level` (text)
      - `success` (integer)
      - `trend` (text)
      - `improvement` (text)
      - `status` (text)
      - `avatar` (text)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `employees` table
    - Add policies for authenticated users to manage their own data
*/

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  department text NOT NULL,
  level text NOT NULL,
  success integer NOT NULL DEFAULT 0,
  trend text NOT NULL DEFAULT 'up',
  improvement text NOT NULL DEFAULT '0%',
  status text NOT NULL DEFAULT 'новый сотрудник',
  avatar text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create employees"
  ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update employees"
  ON employees
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete employees"
  ON employees
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();