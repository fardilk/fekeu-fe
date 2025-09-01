import React from 'react';

export const Toggle: React.FC<{ label?: string; checked?: boolean; onChange?: (v: boolean) => void }> = ({ label = 'Toggle', checked, onChange }) => (
  <label className="flex items-center space-x-3">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} />
  </label>
);
