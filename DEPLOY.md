# VibeDistro — Guia de Deploy em Produção

**Stack:** Next.js (Vercel) + NestJS (Railway) + Worker BullMQ (Railway) + Postgres (Supabase) + Redis (Upstash) + R2 (Cloudflare)

**Domínio web:** https://vibedistro.vercel.app

---

## Ordem de execução

1. Provisionar Supabase (Postgres)
2. Provisionar Upstash (Redis)
3. Provisionar Cloudflare R2 (Storage)
4. Deploy API + Worker no Railway
5. Deploy Web no Vercel
6. Configurar webhook Revelator
7. Smoke test

---

## 1. Supabase — Postgres

1. Acessar https://supabase.com → New Project
   - Name: `vibedistro`
   - Region: `South America (São Paulo)` (mais próxima do Vercel/Railway)
   - Database Password: gerar e guardar
2. Após provisionado: **Settings → Database → Connection string → URI**
   - Copiar string `postgresql://postgres:[YOUR-PASSWORD]@db.[ref].supabase.co:5432/postgres`
   - Substituir `[YOUR-PASSWORD]` pela senha real
3. **IMPORTANTE:** usar a connection string **com pooler** para serverless: `Connection string → Transaction (port 6543)` — para a API use Session (port 5432) por causa das transactions do Prisma.
4. Salvar como `DATABASE_URL`.

**Rodar migrations** (após Railway provisionar o serviço, ou local apontando para Supabase):
```bash
DATABASE_URL="postgresql://..." npx -w packages/database prisma migrate deploy
```

---

## 2. Upstash — Redis

1. Acessar https://upstash.com → Create Database
   - Name: `vibedistro-redis`
   - Type: **Regional** (não Global — BullMQ precisa)
   - Region: `us-east-1` (mais próximo do Railway)
   - Eviction: **disabled**
2. Após criado: copiar **Endpoints → Redis URL** (formato `rediss://default:[token]@[host]:[port]`)
3. Salvar como `REDIS_URL`.

> ⚠️ BullMQ exige `maxRetriesPerRequest: null`. Se der erro de connection, adicionar query string `?family=0` ou usar TLS-only Upstash endpoint.

---

## 3. Cloudflare R2 — Storage

1. Acessar https://dash.cloudflare.com → R2 Object Storage → Create bucket
   - Name: `vibedistro-assets`
   - Location: Automatic
2. **Settings do bucket → Public Access**: habilitar (R2.dev subdomain) — guardar URL pública (`https://pub-[hash].r2.dev`)
3. **R2 → Manage R2 API Tokens → Create API Token**
   - Permissions: Object Read & Write
   - Bucket: `vibedistro-assets`
   - TTL: forever
   - Copiar **Access Key ID**, **Secret Access Key**, **endpoint** (`https://[account-id].r2.cloudflarestorage.com`)
4. Salvar como:
   ```
   STORAGE_PROVIDER=r2
   STORAGE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
   STORAGE_REGION=auto
   STORAGE_BUCKET=vibedistro-assets
   STORAGE_ACCESS_KEY_ID=...
   STORAGE_SECRET_ACCESS_KEY=...
   STORAGE_PUBLIC_URL=https://pub-[hash].r2.dev
   ```

---

## 4. Railway — API + Worker

1. Acessar https://railway.app → New Project → Deploy from GitHub repo
2. Escolher repo `vibedistro` (autorizar GitHub se necessário)
3. **Criar dois serviços a partir do mesmo repo:**

### Service 1: `api`
- Settings → **Source**: root directory `/` (monorepo)
- Settings → **Build**: Dockerfile path `apps/api/Dockerfile`
- Settings → **Networking**: Generate Domain → copiar URL gerada (ex: `vibedistro-api-production.up.railway.app`)
- Variables (copiar tudo):
  ```
  NODE_ENV=production
  PORT=3001
  DATABASE_URL=<Supabase Session URL port 5432>
  REDIS_URL=<Upstash URL>
  JWT_SECRET=<gerar com: openssl rand -hex 32>
  JWT_REFRESH_SECRET=<gerar outro>
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_EXPIRES_IN=7d
  ALLOWED_ORIGINS=https://vibedistro.vercel.app,*.vercel.app
  STORAGE_PROVIDER=r2
  STORAGE_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
  STORAGE_REGION=auto
  STORAGE_BUCKET=vibedistro-assets
  STORAGE_ACCESS_KEY_ID=<R2>
  STORAGE_SECRET_ACCESS_KEY=<R2>
  STORAGE_PUBLIC_URL=<R2 pub URL>
  REVELATOR_ENABLED=true
  REVELATOR_ENVIRONMENT=sandbox
  REVELATOR_API_URL=https://api.revelator.com
  REVELATOR_PARTNER_API_KEY=53ad6a23-5436-4461-a523-0d3b90b82701
  REVELATOR_PARTNER_USER_ID=XASKz2yXy8VBFz8Oe8Adlz1Vl3Dt4k
  REVELATOR_ENTERPRISE_ID=893945
  REVELATOR_WEBHOOK_SECRET=<gerar com: openssl rand -hex 32>
  ```

### Service 2: `worker`
- Mesmo repo, Dockerfile path `apps/worker/Dockerfile`
- **Sem domínio** (worker não recebe HTTP)
- Variables: copiar **as mesmas** do service `api` (mesma DB/Redis/Revelator), exceto `PORT` e `JWT_*` (worker não precisa).

### Migration
Após API subir pela 1ª vez, abrir Railway shell do `api` e rodar:
```bash
npx -w packages/database prisma migrate deploy
npx -w packages/database prisma db seed   # opcional, se houver seed
```

---

## 5. Vercel — Web

1. Acessar https://vercel.com → Add New → Project → Import Git Repo `vibedistro`
2. Configure:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js (auto-detect)
   - **Build/Install/Output:** já estão no `vercel.json` na raiz, não tocar
3. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://<railway-api-domain>
   NEXT_PUBLIC_APP_URL=https://vibedistro.vercel.app
   NEXT_PUBLIC_APP_NAME=VibeDistro
   NEXT_PUBLIC_REVELATOR_ENVIRONMENT=sandbox
   ```
4. Deploy. Após primeiro deploy:
   - Settings → Domains → confirmar `vibedistro.vercel.app` (domínio default)

---

## 6. Webhook Revelator

1. Acessar dashboard Revelator (sandbox)
2. Configurar webhook URL: `https://<railway-api-domain>/api/v1/webhooks/revelator`
3. Secret: usar o mesmo `REVELATOR_WEBHOOK_SECRET` definido na API
4. Eventos: assinar todos (release.status, royalty.report, etc.)

---

## 7. Smoke Test (fluxo end-to-end)

1. Abrir https://vibedistro.vercel.app/login
2. Login (criar primeiro tenant via seed ou endpoint de bootstrap)
3. `/artists` → criar artista
4. `/releases/new` → wizard:
   - Step 1: metadados
   - Step 2: upload cover (verificar que sobe pra R2 — checar bucket)
   - Step 3: adicionar tracks + upload audio
   - Step 4: revisar e submeter
5. Verificar em `/releases/[id]` que status mudou para SUBMITTED
6. Verificar em `/integrations` que sync rodou
7. Em Revelator sandbox: confirmar release recebido
8. Aguardar webhook chegar e validar status atualizou

---

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| 503 / timeout no login | Cold start Railway | Esperar 30s, depois funciona |
| CORS error no browser | `ALLOWED_ORIGINS` errado | Conferir env var na Railway |
| `prisma` erro `P1001` | DATABASE_URL com pooler errado | Usar Session (5432), não Transaction (6543), para migrations |
| Upload falha 500 | R2 credenciais erradas | Conferir `STORAGE_*` vars |
| Worker não processa job | Redis URL errada ou sem TLS | `rediss://` (com 2 's') no Upstash |
| Build Vercel falha "module not found @vibedistro/types" | Build sem turbo | `vercel.json` deve ter `cd ../.. && npx turbo run build` |

---

## Custos esperados (free tier)

| Serviço | Free tier | Quando vira pago |
|---|---|---|
| Supabase | 500MB DB, 2GB transfer | >500MB de dados |
| Upstash Redis | 10k commands/dia | uso intenso de jobs |
| Cloudflare R2 | 10GB storage, sem egress | >10GB assets |
| Railway | $5 trial, depois ~$5/mês cada serviço | sempre pago após trial |
| Vercel | Hobby grátis | uso comercial / >100GB transfer |

**Total mês 1:** ~$10-15 (só Railway dos 2 serviços).
