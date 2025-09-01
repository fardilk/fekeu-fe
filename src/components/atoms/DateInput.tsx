import React from 'react';

export const DateInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Date', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="date" className="border px-3 py-2 rounded w-full" {...props} />
  </label>
);
