import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  level: string;
  success: number;
  trend: 'up' | 'down';
  improvement: string;
  status: string;
  avatar: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  created_at?: string;
}

export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating employee: ${error.message}`);
  }

  return data;
}

export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error fetching employees: ${error.message}`);
  }

  return data;
}

export async function updateEmployee(id: string, updates: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating employee: ${error.message}`);
  }

  return data;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting employee: ${error.message}`);
  }
}

export async function createUser(firstName: string, lastName: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([{ 
      first_name: firstName, 
      last_name: lastName 
    }])
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(`Error creating user: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from user creation');
  }

  return data;
}

export async function getUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }

  if (!data) {
    throw new Error('User not found');
  }

  return data;
}