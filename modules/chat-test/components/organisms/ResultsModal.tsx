
import React from 'react';
import { X, Loader, AlertCircle } from 'lucide-react';
import { useLocale } from '../../contexts/LocaleContext';



interface DialogAnalysis {
  errors?: string[];
  strengths?: string[];
  areas_for_improvement?: string[];
  engagement_score?: number;
  tone_score?: number;
  summary?: string;
}
interface AnalysisResult {
  overall_score: number;
  overall_feedback: string;
  dialogs: { [userId: string]: DialogAnalysis };
}

interface ResultsModalProps {
  show: boolean;
  calculating: boolean;
  analysisResult: AnalysisResult | null;
  analysisError?: string | null; 
  sessionId?: string | null; 
  onClose: () => void;
  onNavigateToDetails?: (sessionId: string) => void; 
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  show,
  calculating,
  analysisResult,
  analysisError,
  sessionId,
  onClose,
  onNavigateToDetails,
}) => {
  const { t } = useLocale(); 

  if (!show) {
    return null;
  }

  const analysisComplete = !calculating && (!!analysisResult || !!analysisError);

  const handleDetailsClick = () => {
    if (onNavigateToDetails && sessionId) {
      onNavigateToDetails(sessionId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-30 p-4">
      <div className="bg-white rounded-lg p-6 md:p-8 max-w-2xl w-full shadow-xl text-center relative animate-fade-in-up">
          {}
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={24} />
          </button>
          
          {}
          <h2 className="text-2xl font-bold text-green-600 mb-4">{t('congratulations')}</h2>
          <p className="text-gray-700 mb-6">{t('testCompletedSuccessfully')}</p>
          
          {}
          {calculating && (
            <div className="flex flex-col items-center justify-center text-gray-600 py-6">
              <Loader size={40} className="animate-spin mb-4 text-blue-500" />
              <p className="font-semibold mb-2">{t('calculatingResults')}</p>
              <p className="text-sm">{t('itWillTakeSeconds')}</p>
            </div>
          )}
          
          {}
          {!calculating && analysisResult && (
            <div className="mt-6 text-left border-t pt-6">
              <h3 className="text-xl font-semibold mb-4 text-center text-gray-800">Результаты анализа</h3> {}
                {} 
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-lg text-blue-800">Общая оценка: {analysisResult.overall_score}/100</p> {}
                  <p className="text-sm text-blue-700 mt-1">{analysisResult.overall_feedback}</p>
                </div>
              {}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-l-4 border-transparent scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-gray-100">
                {Object.entries(analysisResult.dialogs).map(([userId, dialogAnalysis]) => (
                  <details key={userId} className="bg-gray-50 p-3 rounded-lg border border-gray-200 group">
                    <summary className="font-semibold text-gray-700 cursor-pointer hover:text-blue-600 list-none flex justify-between items-center">
                      <span>Анализ диалога с {userId}</span> {} 
                      <span className="text-blue-500 group-open:rotate-90 transform transition-transform duration-200">▶</span>
                    </summary>
                    <div className="mt-3 pl-4 border-l-2 border-blue-200 space-y-2 text-sm text-gray-600">
                      {dialogAnalysis.errors && dialogAnalysis.errors.length > 0 && <p><strong>Ошибки:</strong> {dialogAnalysis.errors.join(', ')}</p>} {}
                      {dialogAnalysis.strengths && dialogAnalysis.strengths.length > 0 && <p><strong>Сильные стороны:</strong> {dialogAnalysis.strengths.join(', ')}</p>} {}
                      {dialogAnalysis.areas_for_improvement && dialogAnalysis.areas_for_improvement.length > 0 && <p><strong>Области для улучшения:</strong> {dialogAnalysis.areas_for_improvement.join(', ')}</p>} {}
                      {dialogAnalysis.engagement_score && <p><strong>Оценка вовлеченности:</strong> {dialogAnalysis.engagement_score}/10</p>} {}
                      {dialogAnalysis.tone_score && <p><strong>Оценка тона:</strong> {dialogAnalysis.tone_score}/10</p>} {}
                      {dialogAnalysis.summary && <p><strong>Комментарий:</strong> {dialogAnalysis.summary}</p>} {}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
          
            {}
            {!calculating && analysisError && (
              <div className="mt-6 text-center text-red-600 py-6">
                  <AlertCircle size={32} className="mx-auto mb-2"/>
                  <p>Не удалось загрузить результаты анализа.</p> {} 
                  <p className="text-sm text-red-500 mt-1">({analysisError})</p>
              </div>
            )} 
            
            {} 
            {analysisComplete && sessionId && onNavigateToDetails && (
                <div className="mt-8">
                    <button 
                        onClick={handleDetailsClick} 
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition-colors text-sm"
                    >
                        Посмотреть детальный отчет {} 
                    </button>
                </div>
            )}
      </div>
    </div>
  );
};

export default ResultsModal; 