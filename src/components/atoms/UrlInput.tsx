import React from 'react';

export const UrlInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Website', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="url" className="border px-3 py-2 rounded w-full" {...props} />
  </label>
);
