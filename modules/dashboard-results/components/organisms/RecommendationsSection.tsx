import React from 'react';
import { RecommendationCard } from '../molecules/RecommendationCard';

type RecommendationsSectionProps = {
  recommendations: string[];
};

export const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => (
  <div className="space-y-4">
    {recommendations.map((rec, idx) => (
      <RecommendationCard key={idx} text={rec} />
    ))}
  </div>
); 