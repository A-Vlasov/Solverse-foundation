import { NextResponse } from 'next/server';
import { 
  getTestSession, 
  getTestSessionChats, 
  getEmployee,
  getTestResultForSession,
  getChatHistory
} from '../../../src/lib/supabase';

// GET /api/test-debug - отладочный эндпоинт для проверки загрузки данных
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId в параметрах запроса' },
        { status: 400 }
      );
    }
    
    const debugInfo: Record<string, any> = {
      sessionId,
      timestamp: new Date().toISOString(),
      steps: []
    };
    
    // Шаг 1: Получение информации о сессии
    let session = null;
    try {
      console.log('Fetching session with ID:', sessionId);
      session = await getTestSession(sessionId);
      debugInfo.steps.push({
        step: 'getTestSession',
        success: true,
        data: {
          id: session?.id,
          employee_id: session?.employee_id,
          completed: session?.completed,
          hasEmployee: !!session?.employee
        }
      });
    } catch (error) {
      console.error('Error in getTestSession:', error);
      debugInfo.steps.push({
        step: 'getTestSession',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Шаг 2: Получение результатов тестирования
    let testResult = null;
    try {
      console.log('Fetching test result for session:', sessionId);
      testResult = await getTestResultForSession(sessionId);
      debugInfo.steps.push({
        step: 'getTestResultForSession',
        success: true,
        data: {
          id: testResult?.id,
          hasAnalysisResult: !!testResult?.analysis_result,
          metrics: testResult?.analysis_result ? 
            Object.keys(testResult.analysis_result.dialog_analysis.metrics) : []
        }
      });
    } catch (error) {
      console.error('Error in getTestResultForSession:', error);
      debugInfo.steps.push({
        step: 'getTestResultForSession',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Шаг 3: Получение сотрудника
    let employee = null;
    if (session?.employee_id || testResult?.employee_id) {
      try {
        const employeeId = session?.employee_id || testResult?.employee_id;
        console.log('Fetching employee with ID:', employeeId);
        employee = await getEmployee(testResult?.employee_id || session?.employee_id).catch(err => {
          console.error('Error in getEmployee:', err);
          return null;
        });
        
        debugInfo.steps.push({
          step: 'getEmployee',
          success: !!employee,
          data: employee ? {
            id: employee.id,
            name: employee.first_name
          } : null
        });
      } catch (error) {
        console.error('Error in getEmployee:', error);
        debugInfo.steps.push({
          step: 'getEmployee',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    // Шаг 4: Получение истории чатов через getTestSessionChats
    let chats = null;
    try {
      console.log('Fetching chats for session using getTestSessionChats:', sessionId);
      chats = await getTestSessionChats(sessionId).catch(err => {
        console.error('Error in getTestSessionChats:', err);
        return null;
      });
      
      debugInfo.steps.push({
        step: 'getTestSessionChats',
        success: !!chats,
        data: {
          count: chats?.length || 0,
          chatNumbers: chats?.map(c => c.chat_number) || [],
          messageCount: chats?.reduce((total, chat) => total + (chat.messages?.length || 0), 0) || 0
        }
      });
    } catch (error) {
      console.error('Error in getTestSessionChats:', error);
      debugInfo.steps.push({
        step: 'getTestSessionChats',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Шаг 5: Получение истории чатов через getChatHistory
    let chatHistory = null;
    try {
      console.log('Fetching chats for session using getChatHistory:', sessionId);
      chatHistory = await getChatHistory(sessionId).catch(err => {
        console.error('Error in getChatHistory:', err);
        return null;
      });
      
      debugInfo.steps.push({
        step: 'getChatHistory',
        success: !!chatHistory,
        data: {
          count: chatHistory?.length || 0,
          chatNumbers: chatHistory?.map(c => c.chat_number) || [],
          messageCount: chatHistory?.reduce((total, chat) => total + (chat.messages?.length || 0), 0) || 0
        }
      });
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      debugInfo.steps.push({
        step: 'getChatHistory',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    
    // Возвращаем полную отладочную информацию
    return NextResponse.json({
      sessionId,
      success: true,
      results: {
        session: session ? true : false,
        testResult: testResult ? true : false,
        employee: employee ? true : false,
        chats: chats && chats.length > 0,
        chatHistory: chatHistory && chatHistory.length > 0
      },
      debugInfo
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Ошибка при выполнении отладки', 
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 