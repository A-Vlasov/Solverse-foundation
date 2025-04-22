import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BackButton } from '../components/atoms/BackButton';
import { Loader } from '../components/atoms/Loader';
import { ErrorMessage } from '../components/atoms/ErrorMessage';
import { ParametersSection } from '../components/organisms/ParametersSection';
import { RecommendationsSection } from '../components/organisms/RecommendationsSection';
import { TestResultState, Dialogue } from '../lib/types';
import { formatDate, calculateTestDuration, debug } from '../lib/utils';
import { MessageCircle, Smile, Lightbulb, RefreshCw, Star } from 'lucide-react';

function calculateOverallScore(metrics: any) {
  const scores = [
    metrics.engagement.score,
    metrics.charm_and_tone.score,
    metrics.creativity.score,
    metrics.adaptability.score,
    metrics.self_promotion.score
  ];
  if (metrics.pricing_policy && metrics.pricing_policy.score) {
    scores.push(metrics.pricing_policy.score);
  }
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

function formatDialogues(chatHistory: any[]): Dialogue[] {
  if (!chatHistory || chatHistory.length === 0) return [];
  const characterNames = ['Marcus', 'Shrek', 'Oliver', 'Alex'];
  const dialogues: Dialogue[] = chatHistory.map((chat: any) => ({
    id: chat.id,
    title: `Диалог с ${characterNames[chat.chat_number - 1] || 'Unknown'}`,
    date: formatDate(chat.created_at || ''),
    score: 85, 
    messages: Array.isArray(chat.messages)
      ? chat.messages.map((msg: any, msgIndex: number) => ({
          id: `msg-${msgIndex}`,
          time: new Date(msg.time || chat.created_at || Date.now()).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          content: msg.content || '',
          isOwn: Boolean(msg.isOwn),
          isRead: Boolean(msg.isRead),
          role: Boolean(msg.isOwn) ? 'user' : 'assistant',
          bought: msg.bought,
          purchased: msg.purchased,
          boughtTag: msg.boughtTag,
          price: msg.price,
        }))
      : [],
  }));
  dialogues.sort((a, b) => {
    const aNumber = characterNames.indexOf(a.title.split(' с ')[1]);
    const bNumber = characterNames.indexOf(b.title.split(' с ')[1]);
    return aNumber - bNumber;
  });
  return dialogues;
}

function processTestResults(
  testResult: any,
  candidateName: string,
  testDate: string,
  testDuration: string,
  dialogues: Dialogue[]
): TestResultState {
  const formattedCandidateName = candidateName;
  if (!testResult || !testResult.analysis_result || !testResult.analysis_result.analysisResult) {
    return {
      candidateName: formattedCandidateName,
      overallScore: 0,
      date: testDate,
      duration: testDuration,
      parameters: [],
      recommendations: [],
      pricingEvaluation: {
        score: 0,
        strengths: [],
        weaknesses: [],
        level: 'Не определен',
        details: 'Информация отсутствует',
      },
      salesPerformance: {
        introduction: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
        warmup: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
        sales: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
      },
      dialogues: dialogues || [],
    };
  }
  try {
    const analysisData = testResult.analysis_result.analysisResult.dialog_analysis;
    const metrics = analysisData.metrics;
    const overallScore = calculateOverallScore(metrics);
    const parameters = [
      {
        name: 'Вовлеченность',
        score: metrics.engagement.score,
        comment: metrics.engagement.verdict,
        icon: <MessageCircle className="w-5 h-5" />,
        color: 'blue',
      },
      {
        name: 'Обаяние и тон',
        score: metrics.charm_and_tone.score,
        comment: metrics.charm_and_tone.verdict,
        icon: <Smile className="w-5 h-5" />,
        color: 'yellow',
      },
      {
        name: 'Креативность',
        score: metrics.creativity.score,
        comment: metrics.creativity.verdict,
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'purple',
      },
      {
        name: 'Адаптивность',
        score: metrics.adaptability.score,
        comment: metrics.adaptability.verdict,
        icon: <RefreshCw className="w-5 h-5" />,
        color: 'green',
      },
      {
        name: 'Самопродвижение',
        score: metrics.self_promotion.score,
        comment: metrics.self_promotion.verdict,
        icon: <Star className="w-5 h-5" />,
        color: 'pink',
      },
    ];
    const recommendationsArray: string[] = [];
    if (analysisData.overall_conclusion) {
      recommendationsArray.push(analysisData.overall_conclusion);
    }
    const recommendationsText = analysisData.result_summary || '';
    if (recommendationsText) {
      const splitRecommendations = recommendationsText
        .split('.')
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 10 && !r.includes('Рекомендации:'));
      recommendationsArray.push(...splitRecommendations);
    }
    const pricingScore = metrics.pricing_policy?.score || 0;
    const pricingEvaluation = {
      score: pricingScore,
      strengths: metrics.pricing_policy?.strengths || [],
      weaknesses: metrics.pricing_policy?.improvements || [],
      level:
        pricingScore >= 4
          ? 'Высокая'
          : pricingScore >= 3
          ? 'Средняя'
          : pricingScore > 0
          ? 'Низкая'
          : 'Не определен',
      details: metrics.pricing_policy?.verdict || 'Информация отсутствует',
    };
    const salesPerformance = {
      introduction: {
        score: metrics.sales_stages?.introduction?.score || 0,
        conversionRate: Math.round((metrics.sales_stages?.introduction?.score || 0) * 20),
        strengths: metrics.sales_stages?.introduction?.strengths || [],
        weaknesses: metrics.sales_stages?.introduction?.weaknesses || [],
      },
      warmup: {
        score: metrics.sales_stages?.warmup?.score || 0,
        conversionRate: Math.round((metrics.sales_stages?.warmup?.score || 0) * 20),
        strengths: metrics.sales_stages?.warmup?.strengths || [],
        weaknesses: metrics.sales_stages?.warmup?.weaknesses || [],
      },
      sales: {
        score: metrics.sales_stages?.closing?.score || 0,
        conversionRate: Math.round((metrics.sales_stages?.closing?.score || 0) * 20),
        strengths: metrics.sales_stages?.closing?.strengths || [],
        weaknesses: metrics.sales_stages?.closing?.weaknesses || [],
      },
    };
    return {
      candidateName: formattedCandidateName,
      overallScore,
      date: testDate,
      duration: testDuration,
      parameters,
      recommendations: recommendationsArray,
      pricingEvaluation,
      salesPerformance,
      dialogues: dialogues || [],
    };
  } catch (error) {
    return {
      candidateName: formattedCandidateName,
      overallScore: 0,
      date: testDate,
      duration: testDuration,
      parameters: [],
      recommendations: [],
      pricingEvaluation: {
        score: 0,
        strengths: [],
        weaknesses: [],
        level: 'Не определен',
        details: 'Ошибка при обработке данных',
      },
      salesPerformance: {
        introduction: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
        warmup: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
        sales: { score: 0, conversionRate: 0, strengths: [], weaknesses: [] },
      },
      dialogues: dialogues || [],
    };
  }
}

const DashboardResultPage = () => {
  const params = useParams() as { sessionId?: string };
  const sessionId = params?.sessionId || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResultState | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Не указан ID сессии.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const fetchData = async () => {
      try {
        const sessionRes = await fetch(`/api/test-sessions/${sessionId}`);
        if (!sessionRes.ok) throw new Error('Ошибка загрузки сессии');
        const sessionData = await sessionRes.json();
        const session = sessionData.session;
        const chats = sessionData.chats || [];
        const resultRes = await fetch(`/api/test-results/${sessionId}`);
        let testResultData = null;
        if (resultRes.ok) {
          testResultData = await resultRes.json();
        }
        const candidateName = session.employee && session.employee.first_name
          ? `${session.employee.first_name} ${session.employee.last_name || ''}`.trim()
          : 'Неизвестный кандидат';
        const testDate = formatDate(session.created_at);
        const testDuration = calculateTestDuration(session.start_time, session.end_time);
        const dialogues = formatDialogues(chats);
        const processedResults = processTestResults(
          testResultData,
          candidateName,
          testDate,
          testDuration,
          dialogues
        );
        setTestResult(processedResults);
        setLoading(false);
      } catch (e: any) {
        setError(e.message || 'Ошибка загрузки данных');
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  let content = <div className="text-center py-20 text-gray-400">Нет данных для отображения</div>;
  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader />
        <p className="text-gray-400 mt-4">Загрузка результатов...</p>
      </div>
    );
  } else if (error) {
    content = <ErrorMessage message={error} />;
  } else if (testResult) {
    content = (
      <>
        <div className="mb-8">
          <p className="text-gray-400">
            <span className="font-medium text-white">Кандидат:</span> {testResult.candidateName || 'Неизвестный кандидат'} | 
            <span className="font-medium text-white ml-2">Дата:</span> {testResult.date || 'Не указана'}
          </p>
        </div>
        <ParametersSection
          parameters={testResult.parameters}
          getParameterBgClass={() => ''} 
          getScoreColorClass={() => ''} 
          renderStars={() => null} 
        />
        <div className="mt-8">
          <RecommendationsSection recommendations={testResult.recommendations} />
        </div>
        {}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-100">
      <div className="mx-auto py-8 px-4">
        <div className="mb-8 flex items-center gap-4">
          <BackButton onClick={() => window.history.back()} />
          <div>
            <h1 className="text-2xl font-bold">Результаты тестирования</h1>
            <p className="text-gray-400">Детальный анализ диалогов</p>
          </div>
        </div>
        {content}
      </div>
    </div>
  );
};

export default DashboardResultPage; 