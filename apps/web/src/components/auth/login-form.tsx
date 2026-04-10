'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message ?? 'Credenciais invalidas');
      }

      const { user, tokens } = await res.json();
      localStorage.setItem('token', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Set cookie for middleware auth check (httpOnly not needed - just for route protection)
      document.cookie = `token=${tokens.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      toast.success('Login realizado com sucesso');
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={cn(
            'w-full rounded-lg border bg-secondary/40 px-3.5 py-2.5 text-sm transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-secondary/60',
            'placeholder:text-muted-foreground/50',
            form.formState.errors.email && 'border-destructive focus:ring-destructive/30',
          )}
          placeholder="admin@vibedistro.com"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium" htmlFor="password">Senha</label>
          <button type="button" className="text-xs text-primary hover:text-primary/80 transition-colors">
            Esqueceu?
          </button>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={cn(
              'w-full rounded-lg border bg-secondary/40 px-3.5 py-2.5 pr-10 text-sm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-secondary/60',
              'placeholder:text-muted-foreground/50',
              form.formState.errors.password && 'border-destructive focus:ring-destructive/30',
            )}
            placeholder="••••••••"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white',
          'hover:bg-primary/90 active:scale-[0.98] transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'flex items-center justify-center gap-2',
          'glow-orange'
        )}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {isLoading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
