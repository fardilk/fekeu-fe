import React from 'react';
import { SignInForm } from '../components/molecules/SignInForm';

const LoginPage: React.FC = () => {
  return (
  <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-teal-400 via-teal-500 to-emerald-600 dark:from-teal-700 dark:via-teal-800 dark:to-emerald-900">
      <div className="w-full max-w-md space-y-6">
  <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">Welcome to SnapCash!</h1>
        <SignInForm />
      </div>
    </div>
  );
};

export default LoginPage;
