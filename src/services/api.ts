/**
 * API Service
 * This file contains service classes for interacting with the server API
 * instead of making direct database calls from client components.
 */

class ApiService {
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | null>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  }
  
  async patch<T>(endpoint: string, data: any, params?: Record<string, string | number | boolean | null>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  }
  
  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  }
  
  async delete<T>(endpoint: string, params?: Record<string, string | number | boolean | null>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    const response = await fetch(url.toString(), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  }
}

// Singleton экземпляр сервиса
export const apiService = new ApiService();

// Специализированные сервисы
export const employeeService = {
  getAll: () => apiService.get<any[]>('/api/employees'),
  getById: (id: string) => apiService.get<any>(`/api/employees?id=${id}`),
  create: (data: any) => apiService.post<any>('/api/employees/create', data),
  getProfile: (id: string) => apiService.get<any>(`/api/profile?id=${id}`),
};

export const testSessionService = {
  getAll: (limit?: number) => apiService.get<any[]>('/api/test-sessions', limit ? { limit } : {}),
  getById: (id: string) => apiService.get<any>(`/api/test-sessions?id=${id}`),
  create: (employeeId: string) => apiService.post<any>('/api/test-sessions', { employeeId }),
  complete: (id: string) => apiService.patch<any>('/api/test-sessions', { action: 'complete' }, { id }),
  addMessage: (id: string, chatId: number, message: any) => 
    apiService.patch<any>('/api/test-sessions', { action: 'addMessage', chatId, message }, { id }),
};

export const chatService = {
  getMessages: (sessionId: string) => apiService.get<any[]>('/api/chat', { sessionId }),
  sendMessage: (sessionId: string, message: string, employeeId: string, chatNumber: number) => 
    apiService.post<any>('/api/chat', { sessionId, message, employeeId, chatNumber }),
  completeSession: (sessionId: string) => 
    apiService.post<any>('/api/chat/complete', { sessionId }),
  analyzeChat: (sessionId: string) => 
    apiService.post<any>('/api/chat/analyze', { sessionId }),
  updateStatus: (sessionId: string, chatNumber: number, status: { isTyping?: boolean, unreadCount?: number }) => 
    apiService.post<any>('/api/chat/status', { sessionId, chatNumber, status }),
};

export const candidateFormService = {
  getById: (id: string) => apiService.get<any>('/api/candidate-form', { id }),
  getByEmployeeId: (employeeId: string) => apiService.get<any>('/api/candidate-form', { employeeId }),
  save: (data: any) => apiService.post<any>('/api/candidate-form', data),
};

export const testResultService = {
  getBySessionId: (sessionId: string) => apiService.get<any>('/api/test-results', { sessionId }),
  getByEmployeeId: (employeeId: string) => apiService.get<any>('/api/test-results', { employeeId }),
  analyze: (sessionId: string, employeeId: string) => 
    apiService.post<any>('/api/test-results', { sessionId, employeeId, analyzeNow: true }),
  save: (data: any) => apiService.post<any>('/api/test-results', data),
};

export const grokService = {
  generateResponse: (messages: any[], conversationDetails?: any) => 
    apiService.post<any>('/api/grok/generate', { messages, conversationDetails }),
  analyzeDialogs: (prompt: string) => apiService.put<any>('/api/grok/analyze', { prompt }),
};

// Сервис для работы с изображениями
export const imageService = {
  getAll: () => apiService.get<any[]>('/api/images'),
  getById: (id: string) => apiService.get<any>(`/api/images/${id}`),
  upload: async (file: File, metadata: { description?: string, prompt?: string } = {}) => {
    // Для загрузки файлов нам нужно использовать FormData вместо JSON
    const formData = new FormData();
    formData.append('file', file);
    
    // Добавляем метаданные
    if (metadata.description) {
      formData.append('description', metadata.description);
    }
    if (metadata.prompt) {
      formData.append('prompt', metadata.prompt);
    }
    
    // Отправляем запрос (не используя apiService, так как нам нужен multipart/form-data)
    const response = await fetch('/api/images', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `Ошибка ${response.status}`);
    }
    
    return response.json();
  },
  updateMetadata: (id: string, metadata: { description?: string, prompt?: string }) => 
    apiService.patch<any>(`/api/images/${id}`, metadata),
  delete: (id: string) => apiService.delete<any>(`/api/images/${id}`),
}; 