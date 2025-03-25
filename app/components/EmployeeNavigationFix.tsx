'use client';

import { useEffect } from 'react';

/**
 * Упрощенная функция для установки ID сотрудника
 */
export function createEmployeePathRedirector() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin/employee/')) {
      try {
        const pathParts = window.location.pathname.split('/');
        const employeeId = pathParts[pathParts.length - 1];
        
        // Устанавливаем только атрибут, без кэширования
        document.documentElement.dataset.currentEmployeeId = employeeId;
      } catch (error) {
        // Ошибки игнорируем для скорости
      }
    }
  }, []);
  
  return null;
}

/**
 * Максимально упрощенная функция получения ID
 */
export function getEmployeeIdFromPath(): string | null {
  try {
    // Проверяем быстрый доступ через data-атрибут
    const idFromAttribute = document.documentElement.dataset.currentEmployeeId;
    if (idFromAttribute) {
      return idFromAttribute;
    }
    
    // Если не найден, берем из URL
    if (window.location.pathname.startsWith('/admin/employee/')) {
      const pathParts = window.location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    }
  } catch (error) {
    // Игнорируем ошибки для скорости
  }
  
  return null;
} 