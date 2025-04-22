


import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for candidate form module');
}


const supabase = createClient(supabaseUrl, supabaseAnonKey);



export interface CandidateFormInput {
  employee_id: string;
  first_name: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
}

export interface CandidateForm {
  id?: string;
  employee_id?: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
  created_at?: string;
  form_completed?: boolean; 
}

export interface CandidateFormData {
  id: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
  created_at: string;
  employee_id: string;
  form_completed?: boolean; 
}

export type TokenValidationResult = {
  success: boolean;
  employeeId?: string;
  errorCode?: 'INVALID_FORMAT' | 'NOT_FOUND' | 'EXPIRED' | 'ALREADY_USED' | 'UNKNOWN_ERROR';
};




/**
 * Marks a candidate token as used.
 */
export async function markTokenAsUsed(token: string): Promise<boolean> {
  try {
    console.log('Marking candidate token as used:', token);
    const { error } = await supabase
      .from('candidate_tokens')
      .update({ is_used: true, updated_at: new Date().toISOString() })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Exception in markTokenAsUsed:', error);
    return false;
  }
}

export async function saveCandidateForm(formData: CandidateFormInput): Promise<CandidateForm> {
  try {
    console.log('Saving candidate form data for user:', formData.employee_id, formData);
    
    const employeeId = formData.employee_id;
    
    if (!employeeId) {
      throw new Error('Employee ID not found. Please restart the registration process.');
    }
    
    
    if (formData.first_name) {
      const { error: nameUpdateError } = await supabase
        .from('employees')
        .update({ first_name: formData.first_name })
        .eq('id', employeeId);
        
      if (nameUpdateError) {
        console.error('Error updating employee name:', nameUpdateError);
        
      }
    }
    
    const { data: existingForm, error: checkError } = await supabase
      .from('candidate_forms')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { 
      console.error('Error checking existing form:', checkError);
      
    }
    
    const formDataToSave: Omit<CandidateForm, 'id' | 'employee_id' | 'created_at'> = {
      telegram_tag: formData.telegram_tag,
      shift: formData.shift,
      experience: formData.experience,
      motivation: formData.motivation,
      about_me: formData.about_me,
      form_completed: true, 
      
    };
    
    let resultData: CandidateForm | null = null;
    
    if (existingForm) {
      console.log('Updating existing candidate form:', existingForm.id);
      const { data, error } = await supabase
        .from('candidate_forms')
        .update(formDataToSave)
        .eq('id', existingForm.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating candidate form:', error);
        throw new Error(`Error updating candidate form: ${error.message}`);
      }
      resultData = data;
    } else {
      console.log('Creating new candidate form for employee:', employeeId);
      const newFormData = {
        ...formDataToSave,
        employee_id: employeeId,
      };
      const { data, error } = await supabase
        .from('candidate_forms')
        .insert([newFormData])
        .select()
        .single();
        
      if (error) {
        console.error('Error saving candidate form:', error);
        throw new Error(`Error saving candidate form: ${error.message}`);
      }
      resultData = data;
    }
    
    console.log('Candidate form saved successfully:', resultData);
    
    
    try {
      const { data: tokenData } = await supabase
        .from('candidate_tokens')
        .select('token')
        .eq('employee_id', employeeId)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(); 
        
      if (tokenData?.token) {
        await markTokenAsUsed(tokenData.token);
      } else {
         console.warn('No active token found to mark as used for employee:', employeeId);
      }
    } catch (tokenError) {
      console.warn('Error marking token as used after form save:', tokenError);
    }
        
    if (!resultData) { 
        throw new Error('Failed to save or retrieve candidate form data.');
    }

    return resultData;

  } catch (error) {
    console.error('Error in saveCandidateForm:', error);
    
    throw error instanceof Error ? error : new Error('An unexpected error occurred saving the candidate form');
  }
}

export async function getCandidateFormByEmployeeId(employeeId: string): Promise<CandidateFormData | null> {
  try {
    const { data, error } = await supabase
      .from('candidate_forms')
      .select('*') 
      .eq('employee_id', employeeId)
      .single();

    if (error) {
       if (error.code === 'PGRST116') { 
         console.log('No candidate form found for employeeId:', employeeId);
         return null;
       }
      console.error('Error fetching candidate form by employeeId:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Exception in getCandidateFormByEmployeeId:', error);
    throw error; 
  }
}

/**
 * Validates a candidate token and returns the associated employee ID.
 */
export async function validateCandidateToken(token: string): Promise<TokenValidationResult> {
  try {
    if (!token || typeof token !== 'string' || token.length < 5) {
      console.error('Invalid token format provided:', token);
      return { success: false, errorCode: 'INVALID_FORMAT' };
    }
    
    console.log('Validating candidate token:', token);
    
    const { data, error } = await supabase
      .from('candidate_tokens')
      .select('id, employee_id, expires_at, is_used')
      .eq('token', token)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.error('Candidate token not found:', token);
        return { success: false, errorCode: 'NOT_FOUND' };
      }
      console.error('Error fetching candidate token:', error);
      throw error;
    }
    
    if (!data) {
        console.error('No data returned for candidate token:', token);
        return { success: false, errorCode: 'NOT_FOUND' };
    }
    
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      console.error('Candidate token has expired:', token);
      return { success: false, errorCode: 'EXPIRED' };
    }
    
    if (data.is_used) {
      console.warn('Candidate token has already been used:', token);
      
      return { success: false, errorCode: 'ALREADY_USED', employeeId: data.employee_id };
    }
    
    
    return { success: true, employeeId: data.employee_id };

  } catch (error) {
    console.error('Exception during candidate token validation:', error);
    return { success: false, errorCode: 'UNKNOWN_ERROR' };
  }
}








