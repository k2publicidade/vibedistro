# VibeDistro — Runbook de Deploy (Render + Vercel + Supabase + Upstash + R2)

Este runbook assume que voce ira **executar os comandos pessoalmente** no seu
terminal. Siga na ordem: cada passo depende do anterior.

Repo: `https://github.com/k2publicidade/vibedistro` (branch `main`)
Web alvo: `https://vibedistro.vercel.app`

---

## Passo 0 — Pre-requisitos (instalar uma vez)

```bash
# Node 20+ e npm 10+
node -v && npm -v

# CLIs
npm i -g vercel@latest
# Render nao precisa CLI — deploy e via blueprint no dashboard
# Prisma ja esta no repo via npx
```

Garanta que o repo esta atualizado:

```bash
cd /caminho/para/vibedistro
git pull origin main
```

---

## Passo 1 — Cloudflare R2 (criar bucket + credenciais)

1. Acesse https://dash.cloudflare.com -> **R2 Object Storage** -> **Create bucket**
   - Name: `vibedistro-assets`
   - Location: `Automatic`
   - Default storage class: `Standard`
   - Clique **Create bucket**.
2. Abra o bucket -> aba **Settings** -> secao **Public access**:
   - Em **R2.dev subdomain**, clique **Allow Access** e confirme.
   - Copie a URL que aparece (algo como `https://pub-<hash>.r2.dev`).
3. Menu lateral R2 -> **Manage R2 API Tokens** -> **Create API Token**:
   - Token name: `vibedistro-api`
   - Permissions: **Object Read & Write**
   - Specify bucket: `vibedistro-assets`
   - TTL: **Forever**
   - Clique **Create API Token**.
   - Copie: **Access Key ID**, **Secret Access Key**, **Endpoint for S3 clients**.
4. Guarde (vai colar na Render e no `.env.production`):

```
STORAGE_PROVIDER=r2
STORAGE_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=vibedistro-assets
STORAGE_ACCESS_KEY_ID=<...>
STORAGE_SECRET_ACCESS_KEY=<...>
STORAGE_PUBLIC_URL=https://pub-<hash>.r2.dev
```

5. Validar com CLI (opcional):

```bash
# Precisa do aws-cli instalado
aws --endpoint-url=https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
    s3 ls s3://vibedistro-assets \
    --region auto \
    --profile r2   # configure r2 antes com aws configure --profile r2
```

---

## Passo 2 — Supabase migration

Seu `.env.production` ja tem `DATABASE_URL` apontando pra Supabase. Rode o
schema push de onde voce estiver (sua maquina), apontando pro banco remoto:

```bash
cd /caminho/para/vibedistro

export DATABASE_URL='postgresql://postgres:Vibedistro%402026@db.esfswikxzujkojiiioui.supabase.co:5432/postgres'

# Generate Prisma client (local)
npx -w packages/database prisma generate

# Push schema para Supabase (cria todas as tabelas)
npx -w packages/database prisma db push --skip-generate

# Seed inicial (cria primeiro tenant/usuario admin)
npx -w packages/database prisma db seed
```

**Verificar:** abra Supabase Dashboard -> Table Editor. Deve ver `User`,
`Tenant`, `Artist`, `Release`, `Track`, etc.

Se aparecer `P1001: Cannot reach database`, confirme porta **5432**
(Session) e que a senha no URL esta URL-encoded (`@` = `%40`).

---

## Passo 3 — Render (API NestJS)

1. Acesse https://dashboard.render.com -> **New** -> **Blueprint**.
2. **Connect a repository** -> autorize GitHub -> escolha `k2publicidade/vibedistro`.
3. Render detecta o `render.yaml` na raiz. Clique **Apply**.
4. Render ira pedir os secrets `sync: false`. Preencha:

```
DATABASE_URL               = postgresql://postgres:Vibedistro%402026@db.esfswikxzujkojiiioui.supabase.co:5432/postgres
REDIS_URL                  = rediss://default:gQAAAAAAAYBuAAIncDI5OGU1YzJkNWUyNTY0ZGI1YjBhZmM2OTkwZjY4NGJjOHAyOTg0MTQ@more-camel-98414.upstash.io:6379
STORAGE_ENDPOINT           = https://<ACCOUNT_ID>.r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID      = <do passo 1>
STORAGE_SECRET_ACCESS_KEY  = <do passo 1>
STORAGE_PUBLIC_URL         = https://pub-<hash>.r2.dev
```

5. Clique **Apply**. Render vai buildar o Docker (~6-10 min primeira vez).
6. Quando status = **Live**: copie a URL publica (ex.
   `https://vibedistro-api.onrender.com`). Salve como `RENDER_API_URL`.
7. Teste healthcheck:

```bash
curl https://<seu-servico>.onrender.com/api/v1/health
# Deve retornar { "status": "ok" } ou similar
```

> Free tier da Render **dorme apos 15 min de inatividade**. Primeira chamada
> apos idle demora ~30-60s pra cold start. E aceitavel pra homolog/demo.

**Importante sem worker:** jobs BullMQ (sync release, webhook replay,
analytics) **nao sao processados** neste setup. Releases vao ficar em
`SUBMITTED` mas nao vao propagar pra Revelator ate voce ativar um worker
($7/mes na Render). Para demo/validacao do fluxo web, esta ok.

---

## Passo 4 — Vercel (Web Next.js)

Faca login na Vercel CLI e importe o projeto:

```bash
cd /caminho/para/vibedistro

vercel login           # abre browser, autentica com k2publicidade2@gmail.com
vercel link            # "Link to existing project?" -> N; novo projeto
                       # Project name: vibedistro
                       # Root directory: ./ (NAO mudar — o vercel.json ja filtra)

# Adicione as envs de producao
vercel env add NEXT_PUBLIC_API_URL production
# Quando pedir valor: https://<seu-servico>.onrender.com

vercel env add NEXT_PUBLIC_APP_URL production
# Valor: https://vibedistro.vercel.app

vercel env add NEXT_PUBLIC_APP_NAME production
# Valor: VibeDistro

vercel env add NEXT_PUBLIC_REVELATOR_ENVIRONMENT production
# Valor: sandbox

# Deploy producao
vercel --prod
```

Quando terminar, Vercel imprime a URL (`https://vibedistro-xxx.vercel.app`).

### Ajustar CORS na API (se a URL da Vercel for diferente do esperado)

Se o projeto Vercel nao virou `vibedistro.vercel.app`, atualize o env na
Render:

1. Render -> servico `vibedistro-api` -> **Environment** -> editar
   `ALLOWED_ORIGINS` -> adicionar a URL real separada por virgula. Ex:

```
ALLOWED_ORIGINS=https://vibedistro.vercel.app,https://vibedistro-xxx.vercel.app
```

2. **Manual Deploy** -> **Deploy latest commit** (reinicia com a nova env).

---

## Passo 5 — Webhook Revelator (opcional nesta fase)

So faz sentido **apos** ter um worker ativo, pois sem worker os webhooks
entrariam na fila BullMQ e nunca processariam. Pule por enquanto.

Quando ativar worker:

1. Render -> `vibedistro-api` -> **Environment** -> copie o valor de
   `REVELATOR_WEBHOOK_SECRET`.
2. Dashboard Revelator sandbox -> Webhooks -> Add:
   - URL: `https://<seu-servico>.onrender.com/api/v1/webhooks/revelator`
   - Secret: colar o valor acima
   - Eventos: marcar todos relevantes (release.status, royalty.report, ...)

---

## Passo 6 — Smoke test end-to-end

```bash
WEB=https://vibedistro.vercel.app          # ajustar se diferente
API=https://<seu-servico>.onrender.com

# 1. API viva
curl -sS "$API/api/v1/health"

# 2. Web carrega
curl -sS -o /dev/null -w "%{http_code}\n" "$WEB/login"   # esperar 200

# 3. Login (use credencial criada pelo seed — ver packages/database/prisma/seed.ts)
curl -sS -X POST "$API/api/v1/auth/login" \
  -H 'content-type: application/json' \
  -d '{"email":"admin@vibedistro.com","password":"<senha-do-seed>"}'
```

Pelo browser:

1. Abra `$WEB/login` -> logue com o usuario do seed.
2. `/dashboard` -> checar que carrega metricas zeradas sem erro.
3. `/artists` -> **New Artist** -> criar "Teste Artista".
4. `/releases/new` -> wizard:
   - metadados -> cover upload (conferir bucket R2 recebeu o arquivo).
   - tracks -> audio upload.
   - submit -> release aparece em `/releases` com status `SUBMITTED`.
5. `/integrations` -> conferir Revelator listado.

Tudo verde? Deploy concluido.

---

## Troubleshooting rapido

| Sintoma | Causa | Fix |
|---|---|---|
| `P1001` no `prisma db push` | DATABASE_URL errada/porta errada | Session port 5432, senha url-encoded |
| Build Render falha `@vibedistro/*` not found | turbo nao rodou | Dockerfile ja faz `turbo run build --filter=@vibedistro/api`; confirme `dockerContext: .` no render.yaml |
| CORS no browser | ALLOWED_ORIGINS nao inclui URL Vercel | Editar env na Render e redeploy |
| 502/timeout primeira req | Render free dormindo | Esperar 60s, retry |
| Upload 500 | R2 creds erradas | Re-conferir STORAGE_* na Render |
| Login 401 sempre | Seed nao rodou ou senha trocada | Rerun `prisma db seed` |

---

## Resumo do estado pos-deploy

- Web: `https://vibedistro.vercel.app`
- API: `https://<servico>.onrender.com` (dorme apos idle — free)
- DB: Supabase `esfswikxzujkojiiioui` (session 5432)
- Redis: Upstash `more-camel-98414`
- Storage: R2 bucket `vibedistro-assets`
- Worker: **OFF** (jobs enfileirados nao processam)
- Webhook Revelator: **nao configurado** (precisa worker)
