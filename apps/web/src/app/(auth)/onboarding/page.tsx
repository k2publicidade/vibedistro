'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateWhiteLabelOnboarding } from '@/lib/hooks/use-onboarding';

const onboardingSchema = z.object({
  tenantName: z.string().min(2, 'Minimo 2 caracteres').max(120),
  tenantSlug: z
    .string()
    .min(3, 'Minimo 3 caracteres')
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minusculas, numeros e hifens'),
  ownerEmail: z.string().email('Email invalido'),
  ownerFirstName: z.string().max(80).optional(),
  ownerLastName: z.string().max(80).optional(),
  password: z.string().min(10, 'Minimo 10 caracteres').max(128),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use um hexadecimal como #ff6a00'),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const defaultValues: OnboardingFormData = {
  tenantName: '',
  tenantSlug: '',
  ownerEmail: '',
  ownerFirstName: '',
  ownerLastName: '',
  password: '',
  primaryColor: '#ff6a00',
};

export default function OnboardingPage() {
  const router = useRouter();
  const createOnboarding = useCreateWhiteLabelOnboarding();
  const [provisioningStatus, setProvisioningStatus] = useState<string | null>(
    null,
  );

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues,
  });

  async function onSubmit(data: OnboardingFormData) {
    setProvisioningStatus(null);

    try {
      const result = await createOnboarding.mutateAsync({
        ...data,
        accountType: 'label',
      });

      localStorage.setItem('token', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      document.cookie = `token=${result.tokens.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      if (result.provisioningStatus !== 'ACTIVE') {
        setProvisioningStatus(result.provisioningStatus);
        toast.warning(`Provisionamento: ${result.provisioningStatus}`);
      } else {
        toast.success('Onboarding concluido');
      }

      router.push('/dashboard');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao criar onboarding',
      );
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Criar white label
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure a conta principal e o tenant para iniciar o painel.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Dados da conta</CardTitle>
            <CardDescription>
              A conta sera criada como label owner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tenantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do tenant</FormLabel>
                        <FormControl>
                          <Input placeholder="Minha Label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tenantSlug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="minha-label" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email do owner</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="owner@label.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="ownerFirstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input autoComplete="given-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ownerLastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sobrenome</FormLabel>
                        <FormControl>
                          <Input autoComplete="family-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor primaria</FormLabel>
                        <FormControl>
                          <Input type="color" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {provisioningStatus && (
                  <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                    Provisionamento Revelator: {provisioningStatus}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={createOnboarding.isPending}
                >
                  {createOnboarding.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Criar e entrar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
