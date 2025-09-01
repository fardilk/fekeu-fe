import React from 'react';

export const CheckboxGroup: React.FC<{ label?: string; options: { label: string; value: string }[]; name?: string }> = ({ label = 'Checkboxes', options = [], name }) => (
  <fieldset className="mb-3">
    <legend className="text-sm font-medium mb-1">{label}</legend>
    <div className="space-y-2">
      {options.map((o) => (
        <label key={o.value} className="flex items-center space-x-2">
          <input type="checkbox" name={name} value={o.value} />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  </fieldset>
);
