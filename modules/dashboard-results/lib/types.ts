

export interface DialogueMessage {
  id: string;
  time: string;
  content: string;
  isOwn: boolean;
  isRead?: boolean;
  role?: 'user' | 'assistant';
  bought?: boolean;
  purchased?: boolean;
  boughtTag?: boolean;
  price?: string;
}

export interface Dialogue {
  id: string;
  title: string;
  date: string;
  score: number;
  messages: DialogueMessage[];
}

export interface TestResultState {
  candidateName: string;
  overallScore: number;
  date: string;
  duration: string;
  parameters: Array<{
    name: string;
    score: number;
    comment: string;
    icon: React.ReactNode;
    color: string;
  }>;
  recommendations: string[];
  pricingEvaluation: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    level?: string;
    details?: string;
  };
  salesPerformance: {
    introduction: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
    warmup: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
    sales: {
      score: number;
      conversionRate: number;
      strengths: string[];
      weaknesses: string[];
    };
  };
  dialogues: Dialogue[];
}

export interface DialogueMessageWithPurchaseInfo extends DialogueMessage {
  bought?: boolean;
  price?: string;
} 