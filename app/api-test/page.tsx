'use client';

import React, { useState, useEffect } from 'react';
import { grokService, geminiService } from '../../src/services/api';

interface ApiTestResult {
  api: string;
  status: 'loading' | 'success' | 'error';
  response?: any;
  error?: string;
  latency?: number;
}

export default function ApiTestPage() {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [message, setMessage] = useState<string>('Привет! Как дела?');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const runApiTests = async () => {
    setIsLoading(true);
    setTestResults([
      { api: 'Grok', status: 'loading' },
      { api: 'Gemini', status: 'loading' }
    ]);

    // Тестируем Grok API
    try {
      const startTimeGrok = Date.now();
      const grokResponse = await grokService.generateResponse([
        { role: 'user', content: message }
      ]);
      const endTimeGrok = Date.now();
      
      setTestResults(prev => prev.map(res => 
        res.api === 'Grok' 
          ? { 
              api: 'Grok', 
              status: 'success', 
              response: grokResponse, 
              latency: endTimeGrok - startTimeGrok 
            } 
          : res
      ));
    } catch (error) {
      setTestResults(prev => prev.map(res => 
        res.api === 'Grok' 
          ? { 
              api: 'Grok', 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
            } 
          : res
      ));
    }

    // Тестируем Gemini API
    try {
      const startTimeGemini = Date.now();
      const geminiResponse = await geminiService.generateResponse([
        { role: 'user', content: message }
      ]);
      const endTimeGemini = Date.now();
      
      setTestResults(prev => prev.map(res => 
        res.api === 'Gemini' 
          ? { 
              api: 'Gemini', 
              status: 'success', 
              response: geminiResponse, 
              latency: endTimeGemini - startTimeGemini 
            } 
          : res
      ));
    } catch (error) {
      setTestResults(prev => prev.map(res => 
        res.api === 'Gemini' 
          ? { 
              api: 'Gemini', 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
            } 
          : res
      ));
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Тестирование API Grok и Gemini</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Тестовое сообщение:</label>
        <div className="flex gap-4">
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 border rounded-md px-3 py-2" 
            placeholder="Введите тестовое сообщение"
          />
          <button 
            onClick={runApiTests}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isLoading ? 'Проверка...' : 'Проверить API'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testResults.map((result) => (
          <div 
            key={result.api} 
            className={`border rounded-md p-4 ${
              result.status === 'loading' ? 'bg-gray-100' :
              result.status === 'success' ? 'bg-green-50 border-green-200' :
              'bg-red-50 border-red-200'
            }`}
          >
            <h2 className="text-xl font-semibold mb-2">{result.api} API</h2>
            
            {result.status === 'loading' && (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <p>Загрузка...</p>
              </div>
            )}
            
            {result.status === 'success' && (
              <div>
                <div className="mb-2 text-green-700 font-medium">Успешно ✓</div>
                {result.latency && (
                  <p className="text-sm text-gray-600 mb-2">Время ответа: {result.latency}мс</p>
                )}
                <div className="mb-2">
                  <strong>ID беседы:</strong> {result.response?.conversation_id || 'N/A'}
                </div>
                <div className="mb-2">
                  <strong>ID родительского ответа:</strong> {result.response?.parent_response_id || 'N/A'}
                </div>
                <div>
                  <strong>Ответ:</strong>
                  <div className="mt-1 p-3 bg-white border rounded-md whitespace-pre-wrap">
                    {result.response?.response || 'Нет ответа'}
                  </div>
                </div>
              </div>
            )}
            
            {result.status === 'error' && (
              <div>
                <div className="mb-2 text-red-700 font-medium">Ошибка ✗</div>
                <div className="p-3 bg-white border border-red-100 rounded-md whitespace-pre-wrap text-red-600">
                  {result.error || 'Неизвестная ошибка'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {testResults.length === 0 && (
        <div className="text-center text-gray-500 my-8">
          Нажмите "Проверить API" для запуска тестов
        </div>
      )}
    </div>
  );
} 