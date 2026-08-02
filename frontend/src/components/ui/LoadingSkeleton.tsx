import React from 'react';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-12 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/60 rounded-xl border border-slate-700/40 ${className}`} />
  );
};
