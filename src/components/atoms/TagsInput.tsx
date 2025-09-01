import React, { useState } from 'react';

export const TagsInput: React.FC<{ label?: string }> = ({ label = 'Tags' }) => {
  const [tags, setTags] = useState<string[]>([]);
  const [value, setValue] = useState('');
  const add = () => {
    if (value.trim()) {
      setTags((t) => [...t, value.trim()]);
      setValue('');
    }
  };
  return (
    <label className="block">
      <span className="text-sm font-medium mb-1 block">{label}</span>
      <div className="flex gap-2">
        <input value={value} onChange={(e) => setValue(e.target.value)} className="border px-3 py-2 rounded" />
  <button type="button" onClick={add} className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded cursor-pointer">Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <span key={i} className="px-2 py-1 bg-gray-200 rounded">{t}</span>
        ))}
      </div>
    </label>
  );
};
