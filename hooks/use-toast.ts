// Simplified toast hook for static export
import { useState } from 'react';

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  return {
    toasts,
    toast: (props: Omit<ToastProps, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prevToasts) => [...prevToasts, { id, ...props }]);
      
      // Auto dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      }, 5000);
      
      return id;
    },
    dismiss: (toastId: string) => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    },
  };
}