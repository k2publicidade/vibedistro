'use client';

import { useState } from 'react';
import {
  Settings,
  Building2,
  Palette,
  Globe,
  Key,
  Save,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// ---- Page ----

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Placeholder tenant data — will be replaced with real API call
  const tenant = {
    name: 'VibeDist Label',
    slug: 'vibedist-label',
    plan: 'PRO',
    maxArtists: 100,
    maxReleases: 500,
    maxStorageGb: 50,
    platformFeePercent: 15,
    defaultLanguage: 'pt-BR',
    defaultTerritory: 'BR',
    apiKey: 'vd_live_sk_1234567890abcdef',
    webhookUrl: '',
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(tenant.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracoes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie as configuracoes do seu tenant
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            Distribuicao
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-1.5">
            <Key className="h-3.5 w-3.5" />
            API & Webhooks
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="card-elevated rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Informacoes do Tenant</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Nome da Empresa
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      defaultValue={tenant.name}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Slug
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/40 border border-border/20">
                    <span className="text-sm text-muted-foreground font-mono">
                      {tenant.slug}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Plano</h3>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  {tenant.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {tenant.maxArtists} artistas • {tenant.maxReleases} releases •{' '}
                  {tenant.maxStorageGb}GB storage
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button className="gap-2 glow-orange">
                <Save className="h-4 w-4" />
                Salvar Alteracoes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Distribution */}
        <TabsContent value="distribution">
          <div className="card-elevated rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Configuracoes de Distribuicao</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Taxa da Plataforma (%)
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                    <input
                      type="number"
                      defaultValue={tenant.platformFeePercent}
                      min={0}
                      max={100}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Idioma Padrao
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      defaultValue={tenant.defaultLanguage}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Territorio Padrao
                  </label>
                  <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      defaultValue={tenant.defaultTerritory}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Limites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                  <span className="text-xs text-muted-foreground">Max Artistas</span>
                  <span className="text-sm font-medium">{tenant.maxArtists}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                  <span className="text-xs text-muted-foreground">Max Releases</span>
                  <span className="text-sm font-medium">{tenant.maxReleases}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/20">
                  <span className="text-xs text-muted-foreground">Storage</span>
                  <span className="text-sm font-medium">{tenant.maxStorageGb}GB</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button className="gap-2 glow-orange">
                <Save className="h-4 w-4" />
                Salvar Alteracoes
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* API & Webhooks */}
        <TabsContent value="api">
          <div className="card-elevated rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4">Chave de API</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-mono text-muted-foreground">
                    {showApiKey ? tenant.apiKey : '••••••••••••••••••••••'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleCopyApiKey}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use esta chave para autenticar chamadas à API. Nunca compartilhe em
                repositorios publicos.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-4">Webhook URL</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 border border-border/30 focus-within:border-primary/30 transition-all">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="url"
                    placeholder="https://seu-servidor.com/webhooks/vibedist"
                    defaultValue={tenant.webhookUrl}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Receba notificacoes em tempo real sobre mudancas de status de releases,
                  novos royalties e eventos do sistema.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <Button className="gap-2 glow-orange">
                <Save className="h-4 w-4" />
                Salvar Alteracoes
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
