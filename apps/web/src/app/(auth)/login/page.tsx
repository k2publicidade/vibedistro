import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">VibeDistro</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
