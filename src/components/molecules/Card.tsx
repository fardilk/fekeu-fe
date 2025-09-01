import React from 'react';

export const Card: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <div className="p-4 border rounded shadow-sm bg-white">
    {title && <h3 className="font-semibold mb-2">{title}</h3>}
    <div>{children}</div>
  </div>
);
