import { toast } from 'react-hot-toast';

export const useToast = () => ({
  showToast: (msg: string, type: 'error' | 'info' | 'success' = 'info') => {
    if (type === 'error') toast.error(msg);
    else if (type === 'success') toast.success(msg);
    else toast(msg);
  }
});

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    {children}
    {/* react-hot-toast renders its portal here */}
  </>
);