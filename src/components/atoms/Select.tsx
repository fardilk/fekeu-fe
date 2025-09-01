import React from 'react';

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options?: { label: string; value: string }[] }> = ({ label = 'Select', options = [], ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <select className="border px-3 py-2 rounded w-full" {...props}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);
