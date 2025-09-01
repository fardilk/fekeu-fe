import React from 'react';

export const ColorInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Color', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <input type="color" className="w-12 h-8 p-0 border-0" {...props} />
  </label>
);
