import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/ui/ToastContext';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <App />
      <Toaster position="top-center" />
    </ToastProvider>
  </StrictMode>
);
