import { createClient } from '@supabase/supabase-js';

// Обновляем доступ к переменным окружения на формат Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', supabaseUrl);

// Создаем клиента с расширенными опциями
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
});

// Проверяем соединение при инициализации
(async () => {
  if (typeof window !== 'undefined') {
    try {
      const { data, error } = await supabase.from('admin_users').select('count').limit(1);
      if (error) {
        console.error('Supabase initialization error:', error);
      } else {
        console.log('Supabase initialized successfully');
      }
    } catch (err) {
      console.error('Error during Supabase initialization:', err);
    }
  }
})();

export interface Employee {
  id: string;
  first_name: string;
  department?: string;
  level?: string;
  success?: number;
  improvement?: string;
  trend?: string;
  status?: string;
  created_at?: string;
}

export interface CandidateToken {
  id: string;
  employee_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  is_used: boolean;
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
  };
  chats?: Chat[];
}

// Интерфейс для результатов анализа диалогов
export interface DialogAnalysisResult {
  dialog_analysis: {
    metrics: {
      engagement: {
        score: number;
        verdict: string;
      };
      charm_and_tone: {
        score: number;
        verdict: string;
      };
      creativity: {
        score: number;
        verdict: string;
      };
      adaptability: {
        score: number;
        verdict: string;
      };
      self_promotion: {
        score: number;
        verdict: string;
      };
      pricing_policy: {
        score: number;
        verdict: string;
        strengths?: string[];
        improvements?: string[];
      };
      // Добавляем оценку по трем этапам продаж
      sales_stages?: {
        introduction: {
          score: number;
          strengths: string[];
          weaknesses: string[];
        };
        warmup: {
          score: number;
          strengths: string[];
          weaknesses: string[];
        };
        closing: {
          score: number;
          strengths: string[];
          weaknesses: string[];
        };
      };
    };
    overall_conclusion: string;
    result_summary?: string;
  };
}

// Интерфейс для результатов тестирования
export interface TestResult {
  id?: string;
  test_session_id: string;
  employee_id: string;
  raw_prompt?: string;
  analysis_result?: DialogAnalysisResult;
  engagement_score?: number;
  charm_tone_score?: number;
  creativity_score?: number;
  adaptability_score?: number;
  self_promotion_score?: number;
  pricing_policy_score?: number;
  overall_score?: number;
  created_at?: string;
  updated_at?: string;
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
}

// Интерфейс для данных анкеты соискателя
export interface CandidateFormData {
  id: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
  created_at: string;
  employee_id: string;
}

export interface User {
  id: string;
  first_name: string;
  email: string;
  phone: string;
  created_at?: string;
}

// Employee functions
export async function createEmployee(employeeData: {
  first_name: string;
  department?: string;
  level?: string;
  success?: number;
  improvement?: string;
  trend?: string;
  status?: string;
}): Promise<Employee> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert([
        {
          first_name: employeeData.first_name,
          department: employeeData.department || 'Candidates',
          level: employeeData.level || 'Candidate',
          success: employeeData.success !== undefined ? employeeData.success : 0,
          improvement: employeeData.improvement || '0%',
          trend: employeeData.trend || 'up',
          status: employeeData.status || 'Новый сотрудник',
        },
      ])
      .select();

    if (error) {
      console.error('Error creating employee:', error);
      throw new Error('Failed to create employee');
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from the database');
    }

    return data[0];
  } catch (error) {
    console.error('Error in createEmployee:', error);
    throw error;
  }
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

export async function updateEmployee(
  id: string,
  employeeData: {
    first_name?: string;
    department?: string;
    level?: string;
    success?: number;
    improvement?: string;
    trend?: string;
    status?: string;
  }
): Promise<Employee> {
  try {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating employee:', error);
      throw new Error('Failed to update employee');
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from the database');
    }

    return data[0];
  } catch (error) {
    console.error('Error in updateEmployee:', error);
    throw error;
  }
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
    console.log('🔄 Creating test session:', { employeeId });
    
    // Проверяем, существуют ли уже активные сессии для этого сотрудника
    const { data: existingSessions, error: checkError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing sessions:', checkError);
    } else if (existingSessions && existingSessions.length > 0) {
      console.log('🔍 Found existing active session for employee:', existingSessions[0]);
      
      // Проверяем, существуют ли чаты для этой сессии
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('test_session_id', existingSessions[0].id)
        .order('chat_number');
      
      if (!chatError && existingChats && existingChats.length === 4) {
        console.log('✅ Using existing session with all 4 chats:', 
          existingChats.map(c => ({ id: c.id, chatNumber: c.chat_number })));
        return {
          ...existingSessions[0],
          chats: existingChats
        };
      } else if (!chatError && existingChats && existingChats.length > 0) {
        console.warn('⚠️ Found session with incomplete chats:', existingChats.length);
        console.log('➕ Creating missing chats...');
        
        // Находим, каких чатов не хватает
        const existingChatNumbers = existingChats.map(c => c.chat_number);
        const missingChatNumbers = [1, 2, 3, 4].filter(num => !existingChatNumbers.includes(num));
        
        if (missingChatNumbers.length > 0) {
          console.log('🔍 Missing chat numbers:', missingChatNumbers);
          
          // Создаем недостающие чаты
          const additionalChatResults = await Promise.all(missingChatNumbers.map(chatNumber => 
            supabase
              .from('chats')
              .insert([{
                test_session_id: existingSessions[0].id,
                chat_number: chatNumber,
                messages: []
              }])
              .select()
              .single()
          ));
          
          const allChats = [...existingChats];
          let additionalChatsCreated = true;
          
          // Проверяем, что все дополнительные чаты созданы успешно
          for (let i = 0; i < additionalChatResults.length; i++) {
            const { data, error } = additionalChatResults[i];
            if (error) {
              console.error(`❌ Error creating missing chat ${missingChatNumbers[i]}:`, error);
              additionalChatsCreated = false;
            } else {
              console.log(`✅ Missing chat ${missingChatNumbers[i]} created successfully`);
              allChats.push(data);
            }
          }
          
          if (additionalChatsCreated) {
            console.log('✅ All missing chats created, using existing session with complete chats');
            return {
              ...existingSessions[0],
              chats: allChats
            };
          }
        }
      }
      
      console.log('⚠️ Existing session has incomplete chats, proceeding to create new session');
    }
    
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
      console.error('❌ Failed to create test session:', sessionError);
      throw sessionError || new Error('No data returned from test session creation');
    }

    console.log('✅ Test session created:', { 
      id: session.id, 
      employeeId: session.employee_id 
    });

    // Создаем 4 пустых чата для сессии
    console.log('🔄 Creating 4 chats for session:', session.id);
    
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
    const chatErrors = [];
    const createdChats = [];
    
    for (let i = 0; i < chatResults.length; i++) {
      const { data, error } = chatResults[i];
      if (error) {
        console.error(`❌ Error creating chat ${i+1}:`, error);
        chatErrors.push({ chatNumber: i+1, error: error.message });
      } else {
        console.log(`✅ Chat ${i+1} created successfully:`, { 
          id: data.id, 
          test_session_id: data.test_session_id,
          chat_number: data.chat_number
        });
        createdChats.push(data);
      }
    }
    
    if (chatErrors.length > 0) {
      console.error('❌ Failed to create all chats:', chatErrors);
      
      // Если хоть какие-то чаты созданы, продолжаем с ними
      if (createdChats.length > 0) {
        console.warn(`⚠️ Continuing with ${createdChats.length} created chats instead of 4`);
      } else {
        throw new Error('Failed to create any chats for test session');
      }
    }

    // Повторно получаем созданные чаты для большей надежности
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', session.id)
      .order('chat_number');

    if (chatsError) {
      console.error('❌ Error fetching created chats:', chatsError);
      // Используем те чаты, которые мы уже создали
      if (createdChats.length > 0) {
        console.warn('⚠️ Using directly created chats instead of fetched ones');
        return {
          ...session,
          chats: createdChats
        };
      }
      throw new Error('Failed to fetch created chats');
    }

    // Проверяем, что у нас есть все 4 чата
    if (!chats || chats.length < 4) {
      console.warn(`⚠️ Only ${chats?.length || 0} chats found instead of 4, attempting repair`);
      
      // Находим, каких чатов не хватает
      const existingChatNumbers = chats?.map(c => c.chat_number) || [];
      const missingChatNumbers = [1, 2, 3, 4].filter(num => !existingChatNumbers.includes(num));
      
      // Создаем недостающие чаты
      if (missingChatNumbers.length > 0) {
        console.log('➕ Creating missing chat numbers:', missingChatNumbers);
        
        const repairResults = await Promise.all(missingChatNumbers.map(chatNumber => 
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
        
        // Добавляем восстановленные чаты к существующим
        const repairedChats = [...(chats || [])];
        for (const { data, error } of repairResults) {
          if (!error && data) {
            repairedChats.push(data);
            console.log(`✅ Successfully repaired missing chat ${data.chat_number}`);
          }
        }
        
        // Используем восстановленные чаты
        if (repairedChats.length > (chats?.length || 0)) {
          console.log('✅ Chat repair successful, now have', repairedChats.length, 'chats');
          return {
            ...session,
            chats: repairedChats
          };
        }
      }
    }

    console.log('✅ All chats created and fetched successfully:', {
      sessionId: session.id,
      employeeId: session.employee_id,
      chatCount: chats ? chats.length : 0,
      chatNumbers: chats ? chats.map(c => c.chat_number) : []
    });
    
    return {
      ...session,
      chats: chats || []
    };
  } catch (error) {
    console.error('❌ Error in createTestSession:', error);
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
    console.log('🔄 Completing test session:', { sessionId });
    
    // Проверим существование сессии перед обновлением
    const { data: existingSession, error: checkError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (checkError) {
      console.error('❌ Error checking session existence:', checkError);
      throw new Error(`Failed to find session: ${checkError.message}`);
    }
    
    if (!existingSession) {
      console.error('❌ Session not found:', sessionId);
      throw new Error('Session not found');
    }
    
    console.log('✓ Found session to complete:', { 
      id: existingSession.id, 
      completed: existingSession.completed,
      employee_id: existingSession.employee_id
    });
    
    // Если сессия уже завершена, просто возвращаем её
    if (existingSession.completed) {
      console.log('ℹ️ Session already completed:', existingSession);
      return existingSession;
    }
    
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
      console.error('❌ Error completing test session:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ No data returned from test session completion');
      throw new Error('No data returned from test session completion');
    }

    console.log('✅ Test session completed successfully:', data);
    
    // Проверяем, доступен ли localStorage (только на клиенте)
    const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;
    
    // Обновление кэша в localStorage для немедленного отражения изменений, если он доступен
    if (isLocalStorageAvailable) {
      try {
        const cacheKey = `test_session_${sessionId}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          ...data,
          cached_at: new Date().toISOString()
        }));
        console.log('✅ Session cache updated in localStorage');
      } catch (cacheError) {
        console.warn('⚠️ Failed to update local cache:', cacheError);
        // Игнорируем ошибку кэширования, это некритично
      }
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error in completeTestSession:', error);
    throw error;
  }
}

export async function getRecentTestSessions(limit: number = 20): Promise<TestSession[]> {
  try {
    console.log('🔍 Fetching recent test sessions, limit:', limit);
    
    // Проверяем, доступен ли localStorage (только на клиенте)
    const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;
    
    // Сначала проверим кэш в localStorage, если он доступен
    if (isLocalStorageAvailable) {
      try {
        const cacheKey = 'recent_test_sessions';
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const { sessions, timestamp } = JSON.parse(cachedData);
          const cacheAge = Date.now() - new Date(timestamp).getTime();
          
          // Если кэш не старше 5 секунд (5000 мс), используем его
          if (cacheAge < 5000 && Array.isArray(sessions) && sessions.length > 0) {
            console.log('📋 Using cached test sessions, age:', Math.round(cacheAge / 1000), 'seconds');
            return sessions;
          }
        }
      } catch (cacheError) {
        console.warn('⚠️ Cache error:', cacheError);
        // Продолжаем без использования кэша
      }
    }
    
    const { data, error } = await supabase
      .from('test_sessions')
      .select(`
        *,
        employee:employees (
          first_name
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
      console.error('❌ Error fetching recent test sessions:', error);
      throw error;
    }

    // Проверяем наличие данных
    if (!data || data.length === 0) {
      console.warn('⚠️ No test sessions found');
      return [];
    }

    console.log('📊 Raw test sessions:', data.map(s => ({ 
      id: s.id, 
      employee_id: s.employee_id, 
      completed: s.completed,
      end_time: s.end_time
    })));
    
    // Проверяем каждую сессию на корректность данных
    const validSessions = data.filter(session => {
      if (!session.id || !session.employee_id) {
        console.warn('⚠️ Invalid session data:', session);
        return false;
      }
      return true;
    });
    
    // Группируем сессии по employee_id - для каждого сотрудника берем самую последнюю сессию
    const latestSessionByEmployee: { [key: string]: TestSession } = {};
    
    validSessions.forEach(session => {
      const employeeId = session.employee_id;
      
      // Проверяем, правильно ли установлен флаг completed
      // Если есть end_time, но completed = false, корректируем это
      if (session.end_time && !session.completed) {
        console.warn('⚠️ Session has end_time but completed=false, fixing:', session.id);
        session.completed = true;
      }
      
      // Если у нас уже есть сессия для этого сотрудника, берем более новую
      if (latestSessionByEmployee[employeeId]) {
        const existingDate = new Date(latestSessionByEmployee[employeeId].created_at).getTime();
        const currentDate = new Date(session.created_at).getTime();
        
        if (currentDate > existingDate) {
          latestSessionByEmployee[employeeId] = session;
        }
      } else {
        latestSessionByEmployee[employeeId] = session;
      }
    });
    
    // Преобразуем объект обратно в массив и сортируем по времени создания (от новых к старым)
    const uniqueSessions = Object.values(latestSessionByEmployee)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log('📋 Filtered sessions:', uniqueSessions.map(s => ({ 
      id: s.id, 
      employee_id: s.employee_id, 
      completed: s.completed,
      messages_count: s.chats?.reduce((total, chat) => total + (chat.messages?.length || 0), 0) || 0
    })));
    
    // Кэшируем результат в localStorage, если он доступен
    if (isLocalStorageAvailable) {
      try {
        const cacheKey = 'recent_test_sessions';
        localStorage.setItem(cacheKey, JSON.stringify({
          sessions: uniqueSessions,
          timestamp: new Date().toISOString()
        }));
        console.log('✅ Sessions cached in localStorage');
      } catch (cacheError) {
        console.warn('⚠️ Failed to cache sessions:', cacheError);
        // Игнорируем ошибку кэширования
      }
    }
    
    return uniqueSessions;
  } catch (error) {
    console.error('❌ Error in getRecentTestSessions:', error);
    throw error;
  }
}

export async function getEmployeeTestSessions(employeeId: string): Promise<TestSession[]> {
  if (!employeeId) {
    console.error('[getEmployeeTestSessions] Ошибка: Пустой ID сотрудника');
    return [];
  }
  
  console.log('[getEmployeeTestSessions] Запрос сессий для сотрудника:', employeeId);
  
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*, employee:employees(*)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[getEmployeeTestSessions] Ошибка при получении сессий:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('[getEmployeeTestSessions] Сессии не найдены для сотрудника:', employeeId);
      return [];
    }
    
    console.log('[getEmployeeTestSessions] Успешно получено сессий:', data.length);
    
    return data;
  } catch (error) {
    console.error('[getEmployeeTestSessions] Критическая ошибка:', error);
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

    // Проверка существования сессии перед добавлением сообщения
    try {
      const session = await getTestSession(sessionId);
      console.log('Found session for message:', { 
        sessionId, 
        employeeId: session.employee_id,
        completed: session.completed
      });
    } catch (sessionError) {
      console.error('Session validation error:', sessionError);
      // Продолжаем выполнение, так как ошибка может быть только в логировании
    }
    
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
      
      // Дополнительная проверка существования чатов для сессии
      const { data: existingChats, error: chatsError } = await supabase
        .from('chats')
        .select('id, chat_number')
        .eq('test_session_id', sessionId);
        
      if (chatsError) {
        console.error('Error checking existing chats:', chatsError);
      } else {
        console.log('Existing chats for session:', existingChats);
      }
      
      throw new Error('Chat not found');
    }

    console.log('Found chat:', { chatId: chat.id, existingMessages: chat.messages?.length || 0 });

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

    console.log('Message added successfully:', { 
      chatId: updatedChat.id, 
      messageCount: updatedChat.messages.length,
      latestMessage: updatedChat.messages[updatedChat.messages.length - 1]
    });
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

export async function getChatHistory(sessionId: string): Promise<Chat[]> {
  try {
    console.log('Fetching chat history for session:', sessionId);
    
    if (!sessionId) {
      console.error('Empty sessionId provided to getChatHistory');
      return [];
    }
    
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', sessionId)
      .order('chat_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
    
    console.log(`Fetched ${data.length} chats for session:`, sessionId);
    return data;
  } catch (error) {
    console.error('Error in getChatHistory:', error);
    throw error;
  }
}

export async function getTestSession(sessionId: string): Promise<TestSession | null> {
  if (!sessionId) {
    console.error('[getTestSession] Ошибка: Пустой ID сессии');
    return null;
  }
  
  // Проверка валидности UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
    console.error('[getTestSession] Ошибка: Невалидный формат UUID:', sessionId);
    return null;
  }
  
  console.log('[getTestSession] Запрос сессии:', sessionId);
  
  try {
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*, employee:employees(*)')
      .eq('id', sessionId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[getTestSession] Сессия не найдена:', sessionId);
        return null;
      }
      console.error('[getTestSession] Ошибка при получении сессии:', error);
      throw error;
    }
    
    if (!data) {
      console.log('[getTestSession] Сессия не найдена (пустые данные):', sessionId);
      return null;
    }
    
    console.log('[getTestSession] Сессия успешно получена:', data.id);
    console.log('[getTestSession] Данные сотрудника:', data.employee ? 
      `ID=${data.employee.id}, имя=${data.employee.first_name}` : 'отсутствуют');
    
    return data;
  } catch (error) {
    console.error('[getTestSession] Критическая ошибка:', error);
    throw error;
  }
}

/**
 * Completes all active test sessions for an employee
 */
export async function completeAllEmployeeTestSessions(employeeId: string): Promise<void> {
  try {
    console.log('Completing all active test sessions for employee:', employeeId);
    
    // Получаем все активные сессии для сотрудника
    const { data: activeSessions, error: fetchError } = await supabase
      .from('test_sessions')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('completed', false);
      
    if (fetchError) {
      console.error('Error fetching active sessions:', fetchError);
      throw fetchError;
    }
    
    if (!activeSessions || activeSessions.length === 0) {
      console.log('No active sessions found for employee:', employeeId);
      return;
    }
    
    console.log(`Found ${activeSessions.length} active sessions to complete`);
    
    // Завершаем каждую сессию
    const currentTime = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('test_sessions')
      .update({
        end_time: currentTime,
        completed: true,
        updated_at: currentTime
      })
      .eq('employee_id', employeeId)
      .eq('completed', false);
      
    if (updateError) {
      console.error('Error completing sessions:', updateError);
      throw updateError;
    }
    
    console.log(`Successfully completed ${activeSessions.length} sessions for employee:`, employeeId);
  } catch (error) {
    console.error('Error in completeAllEmployeeTestSessions:', error);
    throw error;
  }
}

/**
 * Сохраняет результаты тестирования в базу данных
 */
export async function saveTestResult(testResult: Omit<TestResult, 'id' | 'created_at' | 'updated_at'>): Promise<TestResult> {
  try {
    console.log('Checking for existing test result:', testResult.test_session_id);
    
    // Проверяем, существуют ли уже результаты для этой сессии
    const { data: existingResults, error: checkError } = await supabase
      .from('test_results')
      .select('id')
      .eq('test_session_id', testResult.test_session_id)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking existing results:', checkError);
      // Продолжаем выполнение, даже если произошла ошибка при проверке
    } else if (existingResults && existingResults.length > 0) {
      console.log('Found existing result, updating instead of creating new:', existingResults[0].id);
      
      // Обновляем существующую запись
      const { data: updatedData, error: updateError } = await supabase
        .from('test_results')
        .update({
          ...testResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingResults[0].id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating test result:', updateError);
        throw updateError;
      }
      
      console.log('Test result updated successfully:', updatedData);
      return updatedData;
    }
    
    // Если результат не найден, создаем новый
    const { data, error } = await supabase
      .from('test_results')
      .insert([testResult])
      .select()
      .single();
      
    if (error) {
      console.error('Error saving test result:', error);
      throw error;
    }
    
    console.log('New test result saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in saveTestResult:', error);
    throw error;
  }
}

/**
 * Получает результаты тестирования для сессии
 */
export async function getTestResultForSession(sessionId: string): Promise<TestResult | null> {
  try {
    console.log('[getTestResultForSession] Начало запроса для сессии:', sessionId);
    
    if (!sessionId) {
      console.error('[getTestResultForSession] Ошибка: Пустой ID сессии');
      return null;
    }
    
    // Проверка валидности UUID
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId)) {
      console.error('[getTestResultForSession] Ошибка: Невалидный формат UUID:', sessionId);
      return null;
    }
    
    console.log('[getTestResultForSession] Выполняем запрос к базе данных...');
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_session_id', sessionId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Результат не найден
        console.log('[getTestResultForSession] Результат теста не найден для сессии:', sessionId);
        return null;
      }
      console.error('[getTestResultForSession] Ошибка при получении результата теста:', error);
      throw error;
    }
    
    if (!data) {
      console.log('[getTestResultForSession] Результат теста не найден (пустые данные) для сессии:', sessionId);
      return null;
    }
    
    console.log('[getTestResultForSession] Результат успешно получен. ID результата:', data.id);
    console.log('[getTestResultForSession] Проверка анализа:', 
      data.analysis_result ? 'Анализ доступен' : 'Анализ отсутствует');
    
    return data;
  } catch (error) {
    console.error('[getTestResultForSession] Критическая ошибка:', error);
    throw error;
  }
}

/**
 * Получает все результаты тестирования для сотрудника
 */
export async function getTestResultsForEmployee(employeeId: string): Promise<TestResult[]> {
  try {
    console.log('Fetching test results for employee:', employeeId);
    
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching test results:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} test results for employee:`, employeeId);
    return data || [];
  } catch (error) {
    console.error('Error in getTestResultsForEmployee:', error);
    throw error;
  }
}

/**
 * Собирает все сообщения из чатов сессии в единый промпт
 */
export async function generateAnalysisPrompt(sessionId: string): Promise<string> {
  try {
    console.log('Generating analysis prompt for session:', sessionId);
    
    // Получаем все чаты для сессии
    const chats = await getTestSessionChats(sessionId);
    
    // Получаем информацию о сессии
    const session = await getTestSession(sessionId);
    
    if (!chats || chats.length === 0) {
      throw new Error('No chats found for session');
    }
    
    // Формируем заголовок промпта
    const promptHeader = `Ты — Grok 3, созданный xAI. Я предоставлю тебе текстовый диалог между тестируемой моделью (соискателем на роль администратора моей страницы OnlyFans) и AI-клиентом OnlyFans. Твоя задача — проанализировать диалог и оценить модель по следующим 6 критериям:

Вовлеченность (Engagement): Насколько активно модель поддерживает интерес клиента, отвечает ли вовремя и удерживает ли внимание.
Обаяние и тон (Charm and Tone): Насколько модель дружелюбна, привлекательна и использует ли подходящий тон общения.
Креативность (Creativity): Насколько модель предлагает оригинальные идеи, разнообразит общение и избегает шаблонности.
Адаптивность (Adaptability): Насколько модель гибко подстраивается под настроение и запросы клиента.
Умение продавать себя (Self-Promotion): Насколько эффективно модель подчеркивает свои сильные стороны и вызывает желание продолжить общение.
Ценовая политика (Pricing Policy): Насколько эффективно модель управляет вопросами цены, обосновывает ценность своих услуг и работает с возражениями по цене.

Для каждого критерия:
Выставь оценку от 0 до 5 (где 0 — минимально, 5 — идеально).
Дай подробный вердикт (комментарий), объясняющий оценку, включая сильные стороны и области для улучшения.

Для критерия "Ценовая политика" дополнительно:
Предоставь список сильных сторон (strengths) и областей, требующих улучшения (improvements).

Дополнительно проанализируй эффективность продаж по трем этапам:
1. Знакомство (Introduction): Насколько эффективно модель устанавливает контакт и создает первое впечатление.
2. Прогрев (Warmup): Насколько эффективно модель подогревает интерес и создает предпосылки для продажи.
3. Продажа/Закрытие (Closing): Насколько эффективно модель закрывает сделку и преодолевает возражения.

Для каждого этапа:
Выставь оценку от 0 до 5 (где 0 — минимально, 5 — идеально).
Предоставь список сильных сторон (strengths) и слабых сторон (weaknesses).

Нжуно сделать результаты более строгими вот наводящие правила чтобы понижать балл

-тест идёт 20 минут
-нужно при оценке учитывать и обьем сообщений чтоб с каждым собеседником было минимум по 6 сообщений
-каждый диалог должен примерно содержать 3 стадии, иначе оценка низкая:
1)Стадия знакомства знакомиться: 5 -10 сообщений они должны быть в большинстве своем последовательны и не пошлые
2)Cтадия прогрева: по диалогу понятно что модель менее заинтересована чем клиент,модель должна не задавать много вопросов, показывать тизовый контент и намеки через подтекст ненавязчиво
3)Стадия продаж: нужен баланс между пошлым повествованием и перегрузом контентом без водводящих сообщений, сообщения примерно строятся как два наводящих сообщения по покупке контента намекающих на изображения контента чем больше продаж тем лучше
-также нужно учитывать чтоб модель не упрашивала приобрести контент, не выглядела как шлюха, работала на глубину чека и эмоциональную привязанность, высокий бал если клиент оставит чаевые, также учитывать уровень английского и то что она держит контекст всего диалога, сообщения последовательны

ВАЖНО: ВСЕ РЕЗУЛЬТАТЫ АНАЛИЗА ДОЛЖНЫ БЫТЬ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ, ВКЛЮЧАЯ ВСЕ ВЕРДИКТЫ, ЗАКЛЮЧЕНИЯ, СПИСКИ СИЛЬНЫХ И СЛАБЫХ СТОРОН. НЕ ИСПОЛЬЗОВАТЬ АНГЛИЙСКИЙ ЯЗЫК НИ В КАКИХ ЧАСТЯХ ОТВЕТА.

СТРОГО ОТВЕЧАЙ ТОЛЬКО В JSON ФОРМАТЕ, БЕЗ ДОПОЛНИТЕЛЬНОГО ТЕКСТА ДО ИЛИ ПОСЛЕ JSON.

Предоставь результат анализа в формате JSON:

{
  "dialog_analysis": {
    "metrics": {
      "engagement": {
        "score": ,
        "verdict": ""
      },
      "charm_and_tone": {
        "score": ,
        "verdict": ""
      },
      "creativity": {
        "score": ,
        "verdict": ""
      },
      "adaptability": {
        "score": ,
        "verdict": ""
      },
      "self_promotion": {
        "score": ,
        "verdict": ""
      },
      "pricing_policy": {
        "score": ,
        "verdict": "",
        "strengths": [],
        "improvements": []
      },
      "sales_stages": {
        "introduction": {
          "score": ,
          "strengths": [],
          "weaknesses": []
        },
        "warmup": {
          "score": ,
          "strengths": [],
          "weaknesses": []
        },
        "closing": {
          "score": ,
          "strengths": [],
          "weaknesses": []
        }
      }
    },
    "overall_conclusion": "",
    "result_summary": ""
  }
}

"result_summary" - это краткое (до 200 слов) резюме результатов анализа, включающее общую оценку соискателя, его основные сильные стороны и рекомендации по улучшению. Этот текст будет показан пользователю как итоговый вывод анализа.

Вот диалоги для анализа:
`;
    
    // Формируем части промпта из каждого чата
    const chatPrompts = chats.map(chat => {
      const chatNumber = chat.chat_number;
      let characterType = '';
      
      switch(chatNumber) {
        case 1:
          characterType = 'Страстный клиент (Marcus)';
          break;
        case 2:
          characterType = 'Капризный клиент (Shrek)';
          break;
        case 3:
          characterType = 'Экономный клиент, торгующийся о цене (Oliver)';
          break;
        case 4:
          characterType = 'Провокационный клиент, проверяющий границы (Alex)';
          break;
        default:
          characterType = `Клиент ${chatNumber}`;
      }
      
      const messages = chat.messages || [];
      if (messages.length === 0) {
        return `\n\n--- Чат ${chatNumber} (${characterType}) ---\nНет сообщений`;
      }
      
      const formattedMessages = messages.map(msg => {
        const roleLabel = msg.isOwn ? 'Соискатель' : `AI-клиент (${characterType})`;
        return `${roleLabel}: ${msg.content}`;
      }).join('\n');
      
      return `\n\n--- Чат ${chatNumber} (${characterType}) ---\n${formattedMessages}`;
    }).join('');
    
    // Собираем полный промпт
    const fullPrompt = promptHeader + chatPrompts;
    
    console.log('Analysis prompt generated successfully, length:', fullPrompt.length);
    return fullPrompt;
  } catch (error) {
    console.error('Error generating analysis prompt:', error);
    throw error;
  }
}

export async function saveCandidateForm(userId: string, formData: Record<string, any>) {
  try {
    console.log('Saving candidate form data for user:', userId, formData);
    
    // Получаем ID сотрудника из параметра
    const employeeId = userId;
    
    if (!employeeId) {
      throw new Error('ID сотрудника не найден. Пожалуйста, начните процесс регистрации заново.');
    }
    
    // Обновляем имя сотрудника в таблице employees
    if (formData.first_name) {
      const { error: nameUpdateError } = await supabase
        .from('employees')
        .update({ first_name: formData.first_name })
        .eq('id', employeeId);
        
      if (nameUpdateError) {
        console.error('Error updating employee name:', nameUpdateError);
        // Продолжаем процесс даже при ошибке обновления имени
      }
    }
    
    // Проверяем, существует ли уже анкета для этого сотрудника
    const { data: existingForm, error: checkError } = await supabase
      .from('candidate_forms')
      .select('id')
      .eq('employee_id', employeeId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 - запись не найдена
      console.error('Error checking existing form:', checkError);
      // Продолжаем процесс даже при ошибке
    }
    
    // Подготавливаем данные анкеты
    const formDataToSave = {
      telegram_tag: formData.telegram_tag,
      shift: formData.shift,
      experience: formData.experience,
      motivation: formData.motivation,
      about_me: formData.about_me,
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    // Если анкета уже существует, обновляем её
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
      
      result = data;
    } else {
      // Иначе создаем новую анкету
      console.log('Creating new candidate form for employee:', employeeId);
      
      // Добавляем employee_id к данным анкеты
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
      
      result = data;
    }
    
    console.log('Candidate form saved successfully:', result);
    
    // Очищаем sessionStorage после успешного сохранения
    sessionStorage.removeItem('candidateFormData');
    
    // Сохраняем employee_id в возвращаемых данных для последующего использования
    return {
      ...result,
      employee_id: employeeId
    };
  } catch (error) {
    console.error('Error in saveCandidateForm:', error);
    throw error;
  }
}

// Функция для получения данных анкеты соискателя по id сотрудника
export async function getCandidateFormByEmployeeId(employeeId: string): Promise<CandidateFormData | null> {
  try {
    const { data, error } = await supabase
      .from('candidate_forms')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      console.error('Error fetching candidate form:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getCandidateFormByEmployeeId:', error);
    return null;
  }
}

export async function createUser(userData: {
  first_name: string;
  email: string;
  phone: string;
}): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          first_name: userData.first_name,
          email: userData.email,
          phone: userData.phone,
        },
      ])
      .select();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from the database');
    }

    return data[0];
  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
}

/**
 * Создает и сохраняет токен для доступа кандидата к форме регистрации
 */
export async function createCandidateToken(employeeId: string): Promise<string> {
  try {
    console.log('Creating candidate token for employee:', employeeId);
    
    // Генерируем уникальный токен
    const token = Math.random().toString(36).substring(2, 10) + 
                 Date.now().toString(36) + 
                 Math.random().toString(36).substring(2, 10);
    
    // Устанавливаем срок действия токена (7 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Деактивируем все предыдущие токены для этого сотрудника
    try {
      await supabase
        .from('candidate_tokens')
        .update({ is_used: true })
        .eq('employee_id', employeeId)
        .eq('is_used', false);
        
      console.log('Deactivated previous tokens for employee:', employeeId);
    } catch (deactivateError) {
      console.warn('Error deactivating previous tokens:', deactivateError);
      // Продолжаем выполнение даже при ошибке
    }
    
    // Сохраняем новый токен в базе данных
    const { data, error } = await supabase
      .from('candidate_tokens')
      .insert([
        {
          employee_id: employeeId,
          token: token,
          expires_at: expiresAt.toISOString(),
          is_used: false
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating candidate token:', error);
      throw new Error(`Failed to create candidate token: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('No data returned from candidate token creation');
    }
    
    console.log('Token created successfully:', data.token);
    return data.token;
  } catch (error) {
    console.error('Error in createCandidateToken:', error);
    throw error;
  }
}

/**
 * Проверяет валидность токена кандидата и возвращает ID сотрудника
 */
export async function validateCandidateToken(token: string): Promise<string | null> {
  try {
    console.log('Validating candidate token:', token);
    
    // Получаем токен из базы данных
    const { data, error } = await supabase
      .from('candidate_tokens')
      .select('id, employee_id, expires_at, is_used')
      .eq('token', token)
      .single();
    
    if (error) {
      console.error('Error validating token:', error);
      return null;
    }
    
    // Проверяем, не истек ли срок действия токена
    const expiresAt = new Date(data.expires_at);
    const now = new Date();
    
    if (expiresAt < now) {
      console.error('Token has expired:', {
        token: token,
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString()
      });
      return null;
    }
    
    // Помечаем токен как использованный
    const { error: updateError } = await supabase
      .from('candidate_tokens')
      .update({ 
        is_used: true,
        last_used_at: new Date().toISOString(),
        ip_address: window.location.hostname,
        user_agent: navigator.userAgent
      })
      .eq('id', data.id);
    
    if (updateError) {
      console.warn('Error updating token usage status:', updateError);
      // Продолжаем даже если обновление статуса не удалось
    }
    
    console.log('Token validated successfully for employee:', data.employee_id);
    return data.employee_id;
    
  } catch (error) {
    console.error('Exception in validateCandidateToken:', error);
    return null;
  }
}

export async function getCandidateForm(employeeId: string) {
  try {
    if (!employeeId) {
      console.error('No employee ID provided for getCandidateForm');
      return null;
    }

    const { data, error } = await supabase
      .from('candidate_forms')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    if (error) {
      console.error('Error fetching candidate form:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getCandidateForm:', error);
    return null;
  }
}

// Функция для обновления статуса чата (печатание, прочитано и т.д.)
export async function updateChatStatus(sessionId: string, chatNumber: 1 | 2 | 3 | 4, status: { isTyping?: boolean, unreadCount?: number }) {
  try {
    console.log('Updating chat status:', { sessionId, chatNumber, status });
    
    // Получаем сессию для проверки её существования
    const session = await getTestSession(sessionId);
    
    if (!session) {
      throw new Error('Сессия не найдена');
    }
    
    if (session.completed) {
      throw new Error('Невозможно обновить статус для завершенной сессии');
    }
    
    // Находим чат по номеру
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('*')
      .eq('test_session_id', sessionId)
      .eq('chat_number', chatNumber);
    
    if (chatsError) {
      console.error('Error fetching chat:', chatsError);
      throw chatsError;
    }
    
    if (!chats || chats.length === 0) {
      console.warn('Chat not found, creating a new one');
      
      // Если чата нет, создаем новый
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert({
          test_session_id: sessionId,
          chat_number: chatNumber,
          messages: [],
          metadata: status // Сохраняем статус в метаданных
        })
        .select();
      
      if (createError) {
        console.error('Error creating chat:', createError);
        throw createError;
      }
      
      return newChat?.[0] || null;
    }
    
    // Обновляем метаданные чата
    const chat = chats[0];
    const existingMetadata = chat.metadata || {};
    
    const { data: updatedChat, error: updateError } = await supabase
      .from('chats')
      .update({
        metadata: {
          ...existingMetadata,
          ...status
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', chat.id)
      .select();
    
    if (updateError) {
      console.error('Error updating chat metadata:', updateError);
      throw updateError;
    }
    
    console.log('Chat status updated successfully');
    return updatedChat?.[0] || null;
  } catch (error) {
    console.error('Error in updateChatStatus:', error);
    throw error;
  }
}