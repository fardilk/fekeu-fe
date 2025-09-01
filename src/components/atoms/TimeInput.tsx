import React from 'react';

export const TimeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Time', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="time" className="border px-3 py-2 rounded w-full" {...props} />
  </label>
);
