import React from 'react';
import { ParameterCard } from '../molecules/ParameterCard';
import { TestResultState } from '../../lib/types';

type ParametersSectionProps = {
  parameters: TestResultState['parameters'];
  getParameterBgClass: (color: string) => string;
  getScoreColorClass: (score: number) => string;
  renderStars: (score: number) => React.ReactNode;
};

export const ParametersSection: React.FC<ParametersSectionProps> = ({ parameters, getParameterBgClass, getScoreColorClass, renderStars }) => (
  <div className="space-y-6">
    {parameters.map((param, index) => (
      <ParameterCard
        key={index}
        icon={param.icon}
        name={param.name}
        score={param.score}
        comment={param.comment}
        colorClass={getParameterBgClass(param.color)}
        scoreColorClass={getScoreColorClass(param.score)}
        renderStars={renderStars}
      />
    ))}
  </div>
); 