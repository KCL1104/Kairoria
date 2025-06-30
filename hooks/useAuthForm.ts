"use client";

import { useState } from 'react';
import useUnifiedAuth from '@/hooks/use-unified-auth';

interface UseAuthFormProps {
  mode: 'login' | 'register';
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useAuthForm({ mode, onSuccess, onError }: UseAuthFormProps) {
  const {
    isLoading: unifiedLoading,
    error: unifiedError,
    loginWithPassword,
    clearError,
  } = useUnifiedAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isLoading = unifiedLoading || localLoading;
  const error = unifiedError || localError;

  const clearAllErrors = () => {
    clearError();
    setLocalError(null);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearAllErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();

    if (!formData.email || !formData.password) {
      const errorMsg = 'Please enter both email and password';
      setLocalError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    if (mode === 'register') {
      if (!formData.fullName) {
        const errorMsg = 'Please enter your full name';
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        const errorMsg = 'Passwords do not match';
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (formData.password.length < 6) {
        const errorMsg = 'Password must be at least 6 characters long';
        setLocalError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      setLocalLoading(true);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: formData.fullName,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          setLocalError(result.message);
          onError?.(result.message);
        } else {
          onSuccess?.({
            user: result.user,
            needsEmailVerification: result.user.needsEmailVerification,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Registration failed';
        setLocalError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLocalLoading(false);
      }
    } else {
      const result = await loginWithPassword(formData.email, formData.password);
      if (result.success && result.user) {
        onSuccess?.(result.user);
      } else {
        onError?.(result.message);
      }
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
  };
}