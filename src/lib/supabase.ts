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

export interface ChatMessage {
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
}

export interface Chat {
  id: string;
  test_session_id: string;
  chat_number: 1 | 2 | 3 | 4;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface TestSession {
  id: string;
  employee_id: string;
  start_time: string;
  end_time?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
  };
  chats?: Chat[];
}

// Employee functions
export async function createEmployee(employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('employees')
    .insert([employee])
    .select()
    .single();

  if (error) {
    console.error('Error creating employee:', error);
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
    console.error('Error fetching employees:', error);
    throw new Error(`Error fetching employees: ${error.message}`);
  }

  return data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching employee:', error);
    throw new Error(`Error fetching employee: ${error.message}`);
  }

  if (!data) {
    throw new Error('Employee not found');
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
    console.error('Error updating employee:', error);
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
    console.error('Error deleting employee:', error);
    throw new Error(`Error deleting employee: ${error.message}`);
  }
}

// Test session functions
export async function createTestSession(
  employeeId: string
): Promise<TestSession> {
  try {
    console.log('Creating test session:', { employeeId });
    
    // Создаем тестовую сессию
    const { data: session, error: sessionError } = await supabase
      .from('test_sessions')
      .insert([{
        employee_id: employeeId,
        start_time: new Date().toISOString(),
        completed: false
      }])
      .select()
      .single();

    if (sessionError || !session) {
      throw sessionError || new Error('No data returned from test session creation');
    }

    // Создаем 4 пустых чата для сессии
    const chatResults = await Promise.all([1, 2, 3, 4].map(chatNumber => 
      supabase
        .from('chats')
        .insert([{
          test_session_id: session.id,
          chat_number: chatNumber,
          messages: []
        }])
        .select()
        .single()
    ));

    // Проверяем, что все чаты созданы успешно
    for (const { error } of chatResults) {
      if (error) {
        console.error('Error creating chat:', error);
        throw new Error('Failed to create all chats');
      }
    }

    // Получаем созданные чаты
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', session.id)
      .order('chat_number');

    if (chatsError) {
      console.error('Error fetching created chats:', chatsError);
      throw new Error('Failed to fetch created chats');
    }

    console.log('Test session and chats created successfully:', { session, chats });
    return {
      ...session,
      chats
    };
  } catch (error) {
    console.error('Error in createTestSession:', error);
    throw error;
  }
}

export async function updateTestSession(
  sessionId: string, 
  updates: Partial<TestSession>
): Promise<TestSession> {
  try {
    console.log('Updating test session:', { sessionId, updates });
    
    const { data, error } = await supabase
      .from('test_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating test session:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from test session update');
    }

    console.log('Test session updated successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in updateTestSession:', error);
    throw error;
  }
}

export async function completeTestSession(
  sessionId: string
): Promise<TestSession> {
  try {
    console.log('Completing test session:', { sessionId });
    
    const { data, error } = await supabase
      .from('test_sessions')
      .update({
        end_time: new Date().toISOString(),
        completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error completing test session:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from test session completion');
    }

    console.log('Test session completed successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in completeTestSession:', error);
    throw error;
  }
}

export async function getRecentTestSessions(limit: number = 10): Promise<TestSession[]> {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select(`
        *,
        employee:employees (
          first_name,
          last_name
        ),
        chats (
          id,
          chat_number,
          messages
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent test sessions:', error);
      throw error;
    }

    // Убираем дубликаты по employee_id, оставляя только самую последнюю сессию
    const uniqueSessions = data?.reduce((acc: TestSession[], current) => {
      const existingSession = acc.find(session => session.employee_id === current.employee_id);
      if (!existingSession) {
        acc.push(current);
      }
      return acc;
    }, []) || [];

    console.log('Unique test sessions:', uniqueSessions);
    return uniqueSessions;
  } catch (error) {
    console.error('Error in getRecentTestSessions:', error);
    throw error;
  }
}

export async function getEmployeeTestSessions(employeeId: string): Promise<TestSession[]> {
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select(`
        *,
        employee:employees (
          first_name,
          last_name
        ),
        chats (
          id,
          chat_number,
          messages
        )
      `)
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employee test sessions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEmployeeTestSessions:', error);
    throw error;
  }
}

export async function addMessageToTestSession(
  sessionId: string,
  chatNumber: 1 | 2 | 3 | 4,
  message: ChatMessage
): Promise<Chat> {
  try {
    console.log('Adding message to session:', { sessionId, chatNumber, message });
    
    // Получаем чат напрямую через single()
    const { data: chat, error: fetchError } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', sessionId)
      .eq('chat_number', chatNumber)
      .single();

    if (fetchError) {
      console.error('Error fetching chat:', fetchError);
      throw new Error(`Failed to fetch chat: ${fetchError.message}`);
    }

    if (!chat) {
      console.error('Chat not found for session:', sessionId, 'and number:', chatNumber);
      throw new Error('Chat not found');
    }

    // Преобразуем существующие сообщения из JSONB
    const existingMessages = chat.messages || [];
    const updatedMessages = [...existingMessages, message];

    // Обновляем сообщения в чате
    const { data: updatedChat, error: updateError } = await supabase
      .from('chats')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString()
      })
      .eq('id', chat.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating chat:', updateError);
      throw updateError;
    }

    if (!updatedChat) {
      throw new Error('Failed to update chat');
    }

    console.log('Message added successfully:', updatedChat);
    return updatedChat;
  } catch (error) {
    console.error('Error in addMessageToTestSession:', error);
    throw error;
  }
}

// Новая функция для получения всех чатов тестовой сессии
export async function getTestSessionChats(sessionId: string): Promise<Chat[]> {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', sessionId)
      .order('chat_number');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTestSessionChats:', error);
    throw error;
  }
}

export async function getChatHistory(testSessionId: string): Promise<Chat[]> {
  try {
    console.log('Fetching chat history for session:', testSessionId);
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', testSessionId)
      .order('chat_number', { ascending: true });

    if (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }

    if (!data) {
      console.log('No chat history found');
      return [];
    }

    console.log('Chat history fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    throw error;
  }
}