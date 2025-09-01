import React from 'react';

export const SearchInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Search', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="search" className="border px-3 py-2 rounded w-full" {...props} />
  </label>
);
