import React from 'react';
import { Input } from './Input';

export const ShortAnswer: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label = 'Short Answer', ...props }) => (
  <label className="block">
    <span className="text-sm font-medium mb-1 block">{label}</span>
    <Input type="text" {...props} />
  </label>
);
