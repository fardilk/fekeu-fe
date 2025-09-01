import React from 'react';
import { Navbar } from '../organisms/Navbar';

export const DashboardLayout: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="container mx-auto p-4">{children}</main>
  </div>
);
