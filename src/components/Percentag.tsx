import React from 'react';

interface PercentageCircleProps {
  percentage: number;
}

const PercentageCircle: React.FC<PercentageCircleProps> = ({ percentage }): React.ReactNode => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage);

  return (
    <div className="inline-block align-middle mr-1" title={`${percentage * 100}%`}>
      <svg className="w-4 h-4" viewBox="0 0 50 50">
        <circle
          className="text-gray-200 stroke-current"
          strokeWidth="7"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
        />
        <circle
          className="text-blue-500 stroke-current"
          strokeWidth="7"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
    </div>
  );
};


interface PercentageInfoProps {
  used: number;
  total: number;
  unit: string;
}

export const PercentageInfo: React.FC<Partial<PercentageInfoProps>> = ({ used = 0, total = 0, unit = 'G' }): React.ReactNode => {
  return (
    <div className="flex justify-left items-center">
      <PercentageCircle percentage={(used / total)}></PercentageCircle>
      <span>{`${(used / 1).toFixed(2)}/${(total / 1).toFixed(2)}${unit}`}</span>
    </div>
  );
};
