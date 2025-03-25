/**
 * Утилиты для серверного рендеринга и загрузки данных в клиентских компонентах
 * 
 * Эти функции помогают предварительно загружать данные на сервере и
 * передавать их в клиентские компоненты, чтобы избежать прямых обращений к базе данных
 */

import { cache } from 'react';
import { getEmployee, getTestResultsForEmployee, getCandidateFormByEmployeeId } from './supabase';
import { getTestSession, getTestResultForSession } from './supabase';
import { getTestSessionChats } from './supabase';

/**
 * Загружает данные профиля сотрудника
 * @param id ID сотрудника
 * @returns Объект с данными профиля
 */
export const loadEmployeeProfile = cache(async (id: string) => {
  const employee = await getEmployee(id);
  if (!employee) {
    return null;
  }
  
  const testResults = await getTestResultsForEmployee(id);
  const candidateForm = await getCandidateFormByEmployeeId(id);
  
  return {
    ...employee,
    test_results: testResults || [],
    candidate_form: candidateForm || null
  };
});

/**
 * Загружает данные тестовой сессии
 * @param sessionId ID сессии
 * @returns Объект с данными сессии
 */
export const loadTestSession = cache(async (sessionId: string) => {
  return await getTestSession(sessionId);
});

/**
 * Загружает результаты теста
 * @param sessionId ID сессии
 * @returns Объект с результатами теста
 */
export const loadTestResult = cache(async (sessionId: string) => {
  return await getTestResultForSession(sessionId);
});

/**
 * Загружает сообщения чата для сессии
 * @param sessionId ID сессии
 * @returns Массив чатов с сообщениями
 */
export const loadChatMessages = cache(async (sessionId: string) => {
  return await getTestSessionChats(sessionId);
}); 