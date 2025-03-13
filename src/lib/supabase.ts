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
  first_name: string;
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
  first_name: string;
  telegram_tag: string;
  shift: string;
  experience: string;
  motivation: string;
  about_me: string;
  created_at: string;
  employee_id: string;
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
    
    // Проверяем, существуют ли уже активные сессии для этого сотрудника
    const { data: existingSessions, error: checkError } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('completed', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (checkError) {
      console.error('Error checking existing sessions:', checkError);
    } else if (existingSessions && existingSessions.length > 0) {
      console.log('Found existing active session for employee:', existingSessions[0]);
      
      // Проверяем, существуют ли чаты для этой сессии
      const { data: existingChats, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('test_session_id', existingSessions[0].id)
        .order('chat_number');
      
      if (!chatError && existingChats && existingChats.length > 0) {
        console.log('Using existing session with chats:', existingChats.length);
        return {
          ...existingSessions[0],
          chats: existingChats
        };
      }
      
      console.log('Existing session has no chats, proceeding to create new session');
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
      throw sessionError || new Error('No data returned from test session creation');
    }

    // Создаем 4 пустых чата для сессии
    console.log('Creating 4 chats for session:', session.id);
    
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
    for (let i = 0; i < chatResults.length; i++) {
      const { data, error } = chatResults[i];
      if (error) {
        console.error(`Error creating chat ${i+1}:`, error);
        chatErrors.push({ chatNumber: i+1, error: error.message });
      } else {
        console.log(`Chat ${i+1} created successfully:`, { 
          id: data.id, 
          test_session_id: data.test_session_id,
          chat_number: data.chat_number
        });
      }
    }
    
    if (chatErrors.length > 0) {
      console.error('Failed to create all chats:', chatErrors);
      throw new Error('Failed to create all chats');
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

    console.log('All chats created and fetched successfully:', {
      sessionId: session.id,
      employeeId: session.employee_id,
      chatCount: chats ? chats.length : 0,
      chatNumbers: chats ? chats.map(c => c.chat_number) : []
    });
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

export async function getRecentTestSessions(limit: number = 20): Promise<TestSession[]> {
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

    console.log('Raw test sessions:', data?.map(s => ({ id: s.id, employee_id: s.employee_id, completed: s.completed })));
    
    // Группируем сессии по employee_id (это наиболее надежный способ определить уникальные тесты)
    const latestSessionByEmployee: { [key: string]: TestSession } = {};
    
    data?.forEach(session => {
      const employeeId = session.employee_id;
      
      // Если у нас уже есть сессия для этого сотрудника
      if (latestSessionByEmployee[employeeId]) {
        const existingDate = new Date(latestSessionByEmployee[employeeId].created_at).getTime();
        const currentDate = new Date(session.created_at).getTime();
        
        // Обновляем только если текущая сессия новее
        if (currentDate > existingDate) {
          latestSessionByEmployee[employeeId] = session;
        }
      } else {
        // Если это первая сессия для данного сотрудника
        latestSessionByEmployee[employeeId] = session;
      }
    });
    
    // Преобразуем объект обратно в массив и сортируем по времени создания
    const uniqueSessions = Object.values(latestSessionByEmployee)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    console.log('Filtered test sessions:', uniqueSessions.map(s => ({ id: s.id, employee_id: s.employee_id, completed: s.completed })));
    
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

export async function getTestSession(sessionId: string): Promise<TestSession> {
  try {
    console.log('Fetching test session:', { sessionId });
    
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*, employee:employee_id(*)')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching test session:', error);
      throw new Error(`Failed to fetch test session: ${error.message}`);
    }

    if (!data) {
      console.error('No test session found with ID:', sessionId);
      throw new Error('Test session not found');
    }

    console.log('Test session fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getTestSession:', error);
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
    console.log('Fetching test result for session:', sessionId);
    
    const { data, error } = await supabase
      .from('test_results')
      .select('*')
      .eq('test_session_id', sessionId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Результат не найден
        console.log('No test result found for session:', sessionId);
        return null;
      }
      console.error('Error fetching test result:', error);
      throw error;
    }
    
    console.log('Test result fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in getTestResultForSession:', error);
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
          characterType = 'Экономный клиент, торгующийся о цене (Olivia)';
          break;
        case 4:
          characterType = 'Провокационный клиент, проверяющий границы (Ava)';
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

export async function saveCandidateForm(formData: Omit<CandidateForm, 'id' | 'created_at'>): Promise<CandidateForm> {
  try {
    // Сначала создаем запись сотрудника
    const employee = await createEmployee({
      first_name: formData.first_name,
      last_name: '', // Оставляем пустым, так как в форме нет фамилии
      department: 'candidates', // Отдел для кандидатов
      level: 'candidate', // Уровень для кандидатов
      success: 0,
      trend: 'up',
      improvement: '',
      status: 'pending',
      avatar: '' // Оставляем пустым, так как в форме нет аватара
    });

    // Теперь создаем форму кандидата с employee_id
    const dbFormData = {
      employee_id: employee.id, // Используем ID созданного сотрудника
      first_name: formData.first_name,
      telegram_tag: formData.telegram_tag,
      shift: formData.shift,
      experience: formData.experience,
      motivation: formData.motivation,
      about_me: formData.about_me
    };

    const { data, error } = await supabase
      .from('candidate_forms')
      .insert([dbFormData])
      .select()
      .single();

    if (error) {
      console.error('Error saving candidate form:', error);
      throw new Error(`Error saving candidate form: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from candidate form creation');
    }

    // Сохраняем employee_id в возвращаемых данных для последующего использования
    return {
      ...data,
      employee_id: employee.id
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