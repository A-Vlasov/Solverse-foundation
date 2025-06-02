import { NextResponse } from 'next/server';
import {
  getTestResultForSession,
  getTestResultsForEmployee,
  generateAnalysisPrompt
} from '../../../src/lib/supabase';
import { analyzeDialogs } from '../../../src/services/gemini';
import { supabase } from '../../../src/lib/supabase';

// GET /api/test-results - получить результаты теста по sessionId или employeeId
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const employeeId = url.searchParams.get('employeeId');
    
    // Должен быть указан либо sessionId, либо employeeId
    if (!sessionId && !employeeId) {
      return NextResponse.json(
        { error: 'Необходимо указать sessionId или employeeId' },
        { status: 400 }
      );
    }
    
    let results;
    
    if (sessionId) {
      results = await getTestResultForSession(sessionId);
    } else if (employeeId) {
      results = await getTestResultsForEmployee(employeeId);
    }
    
    if (!results) {
      return NextResponse.json(
        { error: 'Результаты теста не найдены' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении результатов теста' },
      { status: 500 }
    );
  }
}

// POST /api/test-results - сохранить результаты теста
export async function POST(request: Request) {
  try {
    // Проверяем, что тело запроса не пустое
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Требуется Content-Type: application/json' },
        { status: 400 }
      );
    }

    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { error: 'Пустое тело запроса' },
        { status: 400 }
      );
    }
    
    console.log('[API] POST /api/test-results: Получено тело запроса:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[API] POST /api/test-results: Ошибка парсинга JSON:', parseError);
      return NextResponse.json(
        { error: 'Невалидный JSON в теле запроса' },
        { status: 400 }
      );
    }
    
    const { test_session_id, sessionId, employee_id, employeeId, analyzeNow, ...resultData } = data;
    
    // Нормализация и валидация ID
    const normalizedSessionId = test_session_id || sessionId;
    const normalizedEmployeeId = employee_id || employeeId;
    
    if (!normalizedSessionId || !normalizedSessionId.trim()) {
      return NextResponse.json(
        { error: 'Не указан ID сессии (test_session_id или sessionId)' },
        { status: 400 }
      );
    }
    
    if (!normalizedEmployeeId || !normalizedEmployeeId.trim()) {
      return NextResponse.json(
        { error: 'Не указан ID сотрудника (employee_id или employeeId)' },
        { status: 400 }
      );
    }
    
    console.log('[API] POST /api/test-results: Обработка запроса:', { 
      normalizedSessionId, 
      normalizedEmployeeId, 
      analyzeNow: !!analyzeNow,
      hasResultData: Object.keys(resultData).length > 0 
    });
    
    // Если указан параметр analyzeNow, выполняем анализ диалогов
    if (analyzeNow) {
      try {
        console.log(`[API] Запрос анализа диалогов для сессии ${normalizedSessionId}`);
        
        // Генерируем промпт для анализа
        const prompt = await generateAnalysisPrompt(normalizedSessionId);
        
        if (!prompt) {
          console.error(`[API] Не удалось сгенерировать промпт для сессии ${normalizedSessionId}`);
          return NextResponse.json(
            { error: 'Не удалось сгенерировать промпт для анализа' },
            { status: 500 }
          );
        }
        
        console.log(`[API] Отправляем промпт на анализ для сессии ${normalizedSessionId} (длина промпта: ${prompt.length})`);
        
        // Отправляем промпт на анализ
        const analysisResult = await analyzeDialogs(prompt);
        
        if (!analysisResult) {
          console.error(`[API] Пустой результат анализа для сессии ${normalizedSessionId}`);
          return NextResponse.json(
            { error: 'Ошибка при анализе диалогов: пустой результат' },
            { status: 500 }
          );
        }
        
        console.log(`[API] Анализ успешно выполнен для сессии ${normalizedSessionId}, сохраняем результаты`);
        
        // Используем UPSERT для сохранения результатов - это гарантирует отсутствие дубликатов
        const { data: existingResults, error: checkError } = await supabase
          .from('test_results')
          .select('id')
          .eq('test_session_id', normalizedSessionId.trim().toLowerCase())
          .eq('employee_id', normalizedEmployeeId.trim().toLowerCase());
          
        if (checkError) {
          console.error(`[API] Ошибка при проверке существующих результатов:`, checkError);
          return NextResponse.json(
            { error: `Ошибка при проверке существующих результатов: ${checkError.message}` },
            { status: 500 }
          );
        }
        
        let savedResult;
        
        // Запускаем транзакцию для гарантии атомарности операции
        const { data: transaction, error: txError } = await supabase.rpc('begin_transaction');
        
        if (txError) {
          console.warn(`[API] Транзакции не поддерживаются, используем обычный UPSERT:`, txError);
          
          // Если транзакции не поддерживаются, используем UPSERT через match
          if (existingResults && existingResults.length > 0) {
            // Обновляем существующую запись
            const { data, error } = await supabase
              .from('test_results')
              .update({
                analysis_result: analysisResult,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingResults[0].id)
              .select()
              .single();
              
            if (error) {
              console.error(`[API] Ошибка при обновлении результатов:`, error);
              return NextResponse.json(
                { error: `Ошибка при обновлении результатов: ${error.message}` },
                { status: 500 }
              );
            }
            
            savedResult = data;
          } else {
            // Создаем новую запись
            const { data, error } = await supabase
              .from('test_results')
              .insert([{
                test_session_id: normalizedSessionId.trim().toLowerCase(),
                employee_id: normalizedEmployeeId.trim().toLowerCase(),
                analysis_result: analysisResult,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select()
              .single();
              
            if (error) {
              console.error(`[API] Ошибка при сохранении результатов:`, error);
              
              // Проверяем на нарушение уникальности (возможно, параллельный запрос создал запись)
              if (error.code === '23505') { // код PostgreSQL для нарушения уникальности
                console.log(`[API] Обнаружен конфликт уникальности, пробуем получить существующий результат`);
                
                // Повторно проверяем наличие записи
                const { data: retryData, error: retryError } = await supabase
                  .from('test_results')
                  .select('*')
                  .eq('test_session_id', normalizedSessionId.trim().toLowerCase())
                  .eq('employee_id', normalizedEmployeeId.trim().toLowerCase())
                  .single();
                  
                if (retryError || !retryData) {
                  return NextResponse.json(
                    { error: `Ошибка при повторном получении результатов: ${retryError?.message || 'Запись не найдена'}` },
                    { status: 500 }
                  );
                }
                
                // Обновляем найденную запись
                const { data: updatedData, error: updateError } = await supabase
                  .from('test_results')
                  .update({
                    analysis_result: analysisResult,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', retryData.id)
                  .select()
                  .single();
                  
                if (updateError) {
                  return NextResponse.json(
                    { error: `Ошибка при обновлении существующих результатов: ${updateError.message}` },
                    { status: 500 }
                  );
                }
                
                savedResult = updatedData;
              } else {
                return NextResponse.json(
                  { error: `Ошибка при сохранении результатов: ${error.message}` },
                  { status: 500 }
                );
              }
            } else {
              savedResult = data;
            }
          }
        } else {
          // Используем UPSERT в транзакции через ON CONFLICT
          const upsertQuery = `
            INSERT INTO test_results (
              test_session_id, employee_id, analysis_result, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5
            )
            ON CONFLICT (test_session_id, employee_id) DO UPDATE SET
              analysis_result = $3,
              updated_at = $5
            RETURNING *;
          `;
          
          const { data, error } = await supabase.rpc('execute_query', {
            query_text: upsertQuery,
            params: [
              normalizedSessionId.trim().toLowerCase(),
              normalizedEmployeeId.trim().toLowerCase(),
              analysisResult,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          });
          
          await supabase.rpc('commit_transaction');
          
          if (error) {
            console.error(`[API] Ошибка при UPSERT результатов в транзакции:`, error);
            return NextResponse.json(
              { error: `Ошибка при сохранении результатов анализа: ${error.message}` },
              { status: 500 }
            );
          }
          
          savedResult = data && data.length > 0 ? data[0] : null;
        }
        
        if (!savedResult) {
          console.error(`[API] Не удалось получить сохраненный результат`);
          return NextResponse.json(
            { error: 'Ошибка при сохранении результатов: не удалось получить сохраненный результат' },
            { status: 500 }
          );
        }
        
        console.log(`[API] Результаты анализа сохранены для сессии ${normalizedSessionId}, ID результата: ${savedResult.id}`);
        
        return NextResponse.json({
          success: true,
          analysisResult,
          savedResult
        });
      } catch (analysisError) {
        const errorMessage = analysisError instanceof Error ? analysisError.message : 'Неизвестная ошибка';
        console.error(`[API] Ошибка при анализе диалогов для сессии ${normalizedSessionId}:`, analysisError);
        return NextResponse.json(
          { error: `Ошибка при анализе диалогов: ${errorMessage}` },
          { status: 500 }
        );
      }
    }
    
    // Если не указан analyzeNow, просто сохраняем данные результатов с помощью UPSERT
    console.log(`[API] Сохраняем результаты теста для сессии ${normalizedSessionId} и сотрудника ${normalizedEmployeeId}`);
    console.log(`[API] Данные для сохранения:`, JSON.stringify({
      test_session_id: normalizedSessionId.trim().toLowerCase(),
      employee_id: normalizedEmployeeId.trim().toLowerCase(),
      ...resultData
    }));
    
    try {
      // Проверяем наличие существующей записи
      const { data: existingResults, error: checkError } = await supabase
        .from('test_results')
        .select('id')
        .eq('test_session_id', normalizedSessionId.trim().toLowerCase())
        .eq('employee_id', normalizedEmployeeId.trim().toLowerCase());
        
      if (checkError) {
        console.error(`[API] Ошибка при проверке существующих результатов:`, checkError);
        return NextResponse.json(
          { error: `Ошибка при проверке существующих результатов: ${checkError.message}` },
          { status: 500 }
        );
      }
      
      let savedResult;
      
      if (existingResults && existingResults.length > 0) {
        // Обновляем существующую запись
        const { data, error } = await supabase
          .from('test_results')
          .update({
            ...resultData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingResults[0].id)
          .select()
          .single();
          
        if (error) {
          console.error(`[API] Ошибка при обновлении результатов:`, error);
          return NextResponse.json(
            { error: `Ошибка при обновлении результатов: ${error.message}` },
            { status: 500 }
          );
        }
        
        savedResult = data;
      } else {
        // Создаем новую запись
        const { data, error } = await supabase
          .from('test_results')
          .insert([{
            test_session_id: normalizedSessionId.trim().toLowerCase(),
            employee_id: normalizedEmployeeId.trim().toLowerCase(),
            ...resultData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();
          
        if (error) {
          console.error(`[API] Ошибка при сохранении результатов:`, error);
          
          // Проверяем на нарушение уникальности (возможно, параллельный запрос создал запись)
          if (error.code === '23505') { // код PostgreSQL для нарушения уникальности
            console.log(`[API] Обнаружен конфликт уникальности, пробуем получить существующий результат`);
            
            // Повторно проверяем наличие записи
            const { data: retryData, error: retryError } = await supabase
              .from('test_results')
              .select('*')
              .eq('test_session_id', normalizedSessionId.trim().toLowerCase())
              .eq('employee_id', normalizedEmployeeId.trim().toLowerCase())
              .single();
              
            if (retryError || !retryData) {
              return NextResponse.json(
                { error: `Ошибка при повторном получении результатов: ${retryError?.message || 'Запись не найдена'}` },
                { status: 500 }
              );
            }
            
            // Обновляем найденную запись
            const { data: updatedData, error: updateError } = await supabase
              .from('test_results')
              .update({
                ...resultData,
                updated_at: new Date().toISOString()
              })
              .eq('id', retryData.id)
              .select()
              .single();
              
            if (updateError) {
              return NextResponse.json(
                { error: `Ошибка при обновлении существующих результатов: ${updateError.message}` },
                { status: 500 }
              );
            }
            
            savedResult = updatedData;
          } else {
            return NextResponse.json(
              { error: `Ошибка при сохранении результатов: ${error.message}` },
              { status: 500 }
            );
          }
        } else {
          savedResult = data;
        }
      }
      
      console.log(`[API] Результаты теста успешно сохранены, ID: ${savedResult.id}`);
      
      return NextResponse.json({
        success: true,
        result: savedResult
      });
    } catch (saveError) {
      console.error(`[API] Ошибка при сохранении результатов:`, saveError);
      const errorMessage = saveError instanceof Error ? saveError.message : 'Неизвестная ошибка';
      const errorStack = saveError instanceof Error ? saveError.stack : 'Нет стека';
      return NextResponse.json(
        { 
          error: `Ошибка при сохранении результатов теста: ${errorMessage}`,
          stack: errorStack
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    const errorStack = error instanceof Error ? error.stack : 'Нет стека';
    console.error('[API] Ошибка при обработке запроса POST /api/test-results:', error);
    console.error('[API] Стек ошибки:', errorStack);
    return NextResponse.json(
      { 
        error: `Ошибка при сохранении результатов теста: ${errorMessage}`,
        stack: errorStack
      },
      { status: 500 }
    );
  }
} 