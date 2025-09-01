import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => (
  <nav className="p-4 bg-gray-800 text-white">
    <div className="container mx-auto flex items-center justify-between">
      <Link to="/" className="font-bold">Fekeu</Link>
      <div className="space-x-4">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
      </div>
    </div>
  </nav>
);
