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

// Создаем экземпляр сервиса для использования другими сервисами
const apiService = new ApiService();
export default apiService;

// Специализированные сервисы
export const employeeService = {
  getAll: () => apiService.get<any[]>('/api/employees'),
  getById: (id: string) => apiService.get<any>(`/api/employees?id=${id}`),
  create: (data: any) => apiService.post<any>('/api/employees/create', data),
  getProfile: (id: string) => apiService.get<any>(`/api/profile?id=${id}`),
};

export const testSessionService = {
  getAll: (limit?: number) => apiService.get<any[]>('/api/test-sessions', limit ? { limit } : {}),
  getById: async (id: string) => {
    console.log('TestSessionService: Fetching session by ID:', id);
    const apiUrl = `/api/test-sessions/${id}`;
    console.log('TestSessionService: API URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TestSessionService: API request failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('TestSessionService: Raw API response:', data);
      return data;
    } catch (error) {
      console.error('TestSessionService: Error in getById:', error);
      throw error;
    }
  },
  create: (employeeId: string) => apiService.post<any>('/api/test-sessions', { employeeId }),
  complete: (id: string) => apiService.patch<any>('/api/test-sessions', { action: 'complete' }, { id }),
  addMessage: (id: string, chatId: number, message: any) => 
    apiService.patch<any>('/api/test-sessions', { action: 'addMessage', chatId, message }, { id }),
  getChats: (sessionId: string) => apiService.get<any[]>('/api/chat-history', { sessionId }),
  updateStatus: (sessionId: string, chatNumber: number, statusData: any) => 
    apiService.patch<any>('/api/chat-history/status', { sessionId, chatNumber, ...statusData }),
  getRemainingTime: (sessionId: string) => apiService.get<{ remainingTime: number }>('/api/test-sessions/timer', { sessionId }),
  extendTime: (sessionId: string, additionalSeconds: number) => 
    apiService.patch<{ remainingTime: number }>('/api/test-sessions/timer', { action: 'extend', additionalSeconds }, { sessionId }),
};

export const chatService = {
  sendMessage: (sessionId: string, message: string, employeeId: string, chatNumber: number, conversationDetails?: any) =>
    apiService.post<any>('/api/chat', { sessionId, message, employeeId, chatNumber, conversationDetails }),
  getHistory: (sessionId: string) => apiService.get<any[]>('/api/chat', { sessionId }),
  updateStatus: (sessionId: string, chatNumber: number, statusData: any) => 
    apiService.patch<any>('/api/chat/status', { sessionId, chatNumber, ...statusData }),
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
    apiService.post<any>('/api/test-results', { 
      sessionId: sessionId.trim().toLowerCase(), 
      employeeId: employeeId.trim().toLowerCase(), 
      analyzeNow: true 
    }),
  getAnalysis: (sessionId: string) => apiService.get<any>('/api/test-results/analysis', { sessionId }),
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

// Сервис для работы с Grok API
export const grokService = {
  generateResponse: (messages: any[], conversationDetails?: any) => 
    apiService.post<any>('/api/grok/chat', { messages, conversationDetails }),
  analyzeDialogs: (prompt: string) => 
    apiService.post<any>('/api/grok/analyze', { prompt }),
};

// Сервис для работы с Gemini API
export const geminiService = {
  generateResponse: (messages: any[], conversationDetails?: any) => 
    apiService.post<any>('/api/gemini/chat', { messages, conversationDetails }),
  analyzeDialogs: (prompt: string) => 
    apiService.post<any>('/api/gemini/analyze', { prompt }),
}; 