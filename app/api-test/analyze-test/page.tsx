'use client';

import React, { useState, useEffect } from 'react';
import { grokService, geminiService } from '../../../src/services/api';

interface ApiTestResult {
  api: string;
  status: 'loading' | 'success' | 'error';
  response?: any;
  error?: string;
  latency?: number;
}

export default function AnalyzeTestPage() {
  const [testResults, setTestResults] = useState<ApiTestResult[]>([]);
  const [prompt, setPrompt] = useState<string>('Проанализируй следующий диалог:\n\nПользователь: Привет! Хочу купить твои фото. Сколько стоит подписка?\nМодель: Привет! Рада, что ты заинтересовался. Подписка стоит $10 в месяц, а также есть VIP за $25 с эксклюзивным контентом.\nПользователь: А можно скидку?\nМодель: Для новых подписчиков у меня сейчас акция - первый месяц со скидкой 20%, так что будет $8 вместо $10.');
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
      const grokResponse = await grokService.analyzeDialogs(prompt);
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
      const geminiResponse = await geminiService.analyzeDialogs(prompt);
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
      <h1 className="text-2xl font-bold mb-6">Тестирование функции анализа диалогов</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Текст диалога для анализа:</label>
        <div className="flex flex-col gap-4">
          <textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)}
            className="border rounded-md px-3 py-2 h-40" 
            placeholder="Введите диалог для анализа"
          />
          <button 
            onClick={runApiTests}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 w-full md:w-auto self-end"
          >
            {isLoading ? 'Проверка...' : 'Запустить анализ'}
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
            <h2 className="text-xl font-semibold mb-2">{result.api} API (Анализ)</h2>
            
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
                  <strong>Анализ:</strong>
                  {result.response?.analysisResult ? (
                    <div className="mt-2 p-3 bg-white border rounded-md">
                      <h3 className="font-medium mb-2">Метрики:</h3>
                      <ul className="list-disc pl-5 mb-3">
                        {result.response.analysisResult.dialog_analysis?.metrics && Object.entries(result.response.analysisResult.dialog_analysis.metrics).map(([key, value]: [string, any]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value.score} - {value.verdict}
                          </li>
                        ))}
                      </ul>
                      <h3 className="font-medium mb-2">Итог:</h3>
                      <p className="text-sm">
                        {result.response.analysisResult.dialog_analysis?.overall_conclusion || 'Нет итога'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-white border rounded-md whitespace-pre-wrap">
                      {JSON.stringify(result.response, null, 2)}
                    </div>
                  )}
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
          Нажмите "Запустить анализ" для проверки функционала
        </div>
      )}
    </div>
  );
} 