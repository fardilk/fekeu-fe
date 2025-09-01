import React from 'react';

export const LongAnswer: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label = 'Long Answer', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <textarea className="border px-3 py-2 rounded w-full" {...props} />
  </label>
);
