'use client';

import * as React from 'react';
import { cn, getRiskColor, getRiskLabel } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreRing({ score, size = 'md', showLabel = true, className }: ScoreRingProps) {
  const sizes = {
    sm: { ring: 80, stroke: 6, text: 'text-lg' },
    md: { ring: 120, stroke: 8, text: 'text-2xl' },
    lg: { ring: 160, stroke: 10, text: 'text-4xl' },
  };

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (score: number): string => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#eab308'; // yellow-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: ring, height: ring }}>
        <svg className="transform -rotate-90" width={ring} height={ring}>
          {/* Background circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="none"
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={ring / 2}
            cy={ring / 2}
            r={radius}
            stroke={getStrokeColor(score)}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold', text, getRiskColor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      {showLabel && (
        <span className={cn('mt-2 text-sm font-medium', getRiskColor(score))}>
          {getRiskLabel(score)}
        </span>
      )}
    </div>
  );
}
