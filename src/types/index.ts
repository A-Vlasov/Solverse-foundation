/**
 * Типы данных для всего приложения
 */

// Типы для сотрудников
export interface Employee {
  id: string;
  first_name: string;
  department?: string;
  level?: string;
  status?: string;
  success?: number;
  improvement?: string;
  trend?: string;
  created_at?: string;
  updated_at?: string;
}

// Типы для форм кандидатов
export interface CandidateForm {
  id: string;
  employee_id: string;
  telegram_tag?: string;
  shift?: string;
  experience?: string;
  motivation?: string;
  about_me?: string;
  created_at?: string;
  updated_at?: string;
}

// Типы для тестовых сессий
export interface TestSession {
  id: string;
  employee_id: string;
  employee_name?: string;
  completed: boolean;
  created_at?: string;
  completed_at?: string;
  chat_1_status?: ChatStatus;
  chat_2_status?: ChatStatus;
  chat_3_status?: ChatStatus;
  chat_4_status?: ChatStatus;
}

// Типы для статуса чата
export interface ChatStatus {
  isTyping?: boolean;
  unreadCount?: number;
  lastMessageId?: string;
}

// Типы для сообщений чата
export interface ChatMessage {
  id?: string;
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
  isTyping?: boolean;
  error?: boolean;
  errorDetails?: string;
  imageUrl?: string;
  price?: string;
  bought?: boolean;
  imageComment?: string;
}

// Типы для чатов тестовой сессии
export interface TestSessionChat {
  chat_number: 1 | 2 | 3 | 4;
  messages: ChatMessage[];
}

// Типы для сообщений Grok
export type MessageRole = 'user' | 'assistant' | 'system';

export interface GrokMessage {
  role: MessageRole;
  content: string;
}

export interface GrokConversation {
  conversationId: string;
  parentResponseId: string;
  chatLink?: string;
}

export interface GrokResponse {
  response: string;
  conversation_id: string;
  parent_response_id: string;
  chat_link?: string;
  error?: string;
}

// Типы для результатов анализа диалогов
export interface DialogMetric {
  score: number;
  verdict: string;
  strengths?: string[];
  improvements?: string[];
}

export interface DialogMetrics {
  engagement: DialogMetric;
  charm_and_tone: DialogMetric;
  creativity: DialogMetric;
  adaptability: DialogMetric;
  self_promotion: DialogMetric;
  pricing_policy: DialogMetric;
}

export interface DialogAnalysis {
  metrics: DialogMetrics;
  overall_conclusion: string;
}

export interface DialogAnalysisResult {
  dialog_analysis: DialogAnalysis;
}

// Типы для результатов теста
export interface TestResult {
  id?: string;
  test_session_id: string;
  employee_id: string;
  raw_prompt?: string;
  analysis_result?: DialogAnalysisResult;
  engagement_score?: number;
  charm_score?: number;
  creativity_score?: number;
  adaptability_score?: number;
  self_promotion_score?: number;
  pricing_policy_score?: number;
  created_at?: string;
  updated_at?: string;
}

// Типы для изображений
export interface CustomImage {
  id: string;
  name?: string;
  url: string;
  thumbnail: string;
  description?: string;
  prompt?: string;
  size?: number;
  type?: string;
}

// Типы для API-ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 