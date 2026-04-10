import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import { Disc3 } from 'lucide-react';

export const metadata: Metadata = { title: 'Login' };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-black items-center justify-center overflow-hidden">
        {/* Gradient orb */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] -top-40 -left-40" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-orange-600/10 blur-[100px] bottom-20 right-10" />

        <div className="relative z-10 max-w-lg px-16 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center glow-orange-strong">
              <Disc3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Vibe<span className="text-primary">Distro</span>
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Distribua sua musica<br />
              <span className="text-gradient">para o mundo</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed">
              Plataforma completa de distribuicao musical. Gerencie artistas,
              releases, royalties e analytics em um so lugar.
            </p>
          </div>

          <div className="flex items-center gap-6 pt-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">DSPs conectadas</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="space-y-1">
              <p className="text-2xl font-bold text-white">24h</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Tempo de entrega</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">100%</p>
              <p className="text-xs text-white/40 uppercase tracking-wider">Seus royalties</p>
            </div>
          </div>
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-orange">
              <Disc3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              Vibe<span className="text-primary">Distro</span>
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground/60">
            Nao tem uma conta?{' '}
            <span className="text-primary hover:underline cursor-pointer">Fale conosco</span>
          </p>
        </div>
      </div>
    </div>
  );
}
