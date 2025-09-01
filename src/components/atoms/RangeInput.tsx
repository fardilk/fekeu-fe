import React from 'react';

export const RangeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; min?: number; max?: number }> = ({ label = 'Range', min = 0, max = 100, ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="range" min={min} max={max} className="w-full" {...props} />
  </label>
);
