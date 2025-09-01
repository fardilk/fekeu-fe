import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../atoms/Button';
import { UsernameInput, PasswordInput } from '../atoms/Input';
import { Checkbox } from '../atoms/Checkbox';
import { Link, useNavigate } from 'react-router-dom';
import { setAuthToken } from '../../lib/axio';
import { login } from '../../lib/api/keuangan';
import { useAuthStore, AuthState } from '../../store/authStore';
import { useToast } from '../../components/ui/ToastContext';

const SignInSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type SignInValues = z.infer<typeof SignInSchema>;

export const SignInForm: React.FC<{ onSubmit?: (data: SignInValues) => Promise<void> | void }> = ({ onSubmit }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInValues>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { username: '', password: '', remember: false }
  });
  const setUser = useAuthStore((s: AuthState) => s.setUser);
  const setToken = useAuthStore((s: AuthState) => s.setToken);
  const navigate = useNavigate();

    const toast = useToast();

    const submit = async (data: SignInValues) => {
      try {
        if (onSubmit) await onSubmit(data);
      const res = await login({ username: data.username, password: data.password });
  setAuthToken(res.token);
      // Backend didn't return user object; derive minimal user from form input.
      const user = { id: data.username, name: data.username };
      setUser(user as any);
  setToken(res.token);
      if (data.remember) {
        localStorage.setItem('auth.token', res.token);
        localStorage.setItem('auth.user', JSON.stringify(user));
      } else {
        localStorage.removeItem('auth.token');
        localStorage.removeItem('auth.user');
      }
        toast.showToast('Login Berhasil', 'success');
        navigate('/');
    } catch (e: any) {
      console.error('Login failed', e);
        toast.showToast('Login Gagal, Periksa Kembali Akun Anda', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="max-w-md w-full p-6 bg-white rounded shadow space-y-4">
      <div>
        <UsernameInput
          {...register('username')}
          aria-invalid={!!errors.username}
        />
        {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username.message}</p>}
      </div>
      <div>
        <PasswordInput
          {...register('password')}
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
      </div>
      <div className="flex items-center justify-between">
        <Checkbox label="Remember me" {...register('remember')} />
        <Link to="/forgot-password" className="text-sm text-blue-600">Forgot password?</Link>
      </div>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </div>
    </form>
  );
};

export default SignInForm;
