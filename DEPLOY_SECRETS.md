# GitHub Actions — setup de secrets para deploy automatico

Caminho no GitHub: **Settings -> Secrets and variables -> Actions**

---

## 1) Secrets (abas Secrets)

| Nome | Valor | Onde pegar |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:Vibedistro%402026@db.esfswikxzujkojiiioui.supabase.co:5432/postgres` | `.env.production` linha 13 |
| `VERCEL_TOKEN` | token pessoal | vercel.com -> Account Settings -> Tokens -> **Create** (scope: full account) |
| `VERCEL_ORG_ID` | `team_xxx` ou `user_xxx` | apos rodar `vercel link` -> ver `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `prj_xxx` | idem, `.vercel/project.json` |
| `RENDER_API_KEY` | `rnd_...` | dashboard.render.com -> Account Settings -> API Keys -> **Create** |
| `RENDER_API_SERVICE_ID` | `srv_...` | Render -> servico `vibedistro-api` -> URL da pagina contem o id |

## 2) Variables (aba Variables — nao sao secret)

| Nome | Valor |
|---|---|
| `PROD_WEB_URL` | `https://vibedistro.vercel.app` |
| `PROD_API_URL` | `https://vibedistro-api.onrender.com` |

---

## Passo-a-passo de setup (faz 1x)

### a) Criar projeto Vercel e obter ORG/PROJECT ID

```bash
cd /caminho/para/vibedistro
npm i -g vercel@latest
vercel login                  # autentica com k2publicidade2@gmail.com
vercel link                   # escolhe team, digite "vibedistro" como project name
                              # ACEITE as defaults do vercel.json
cat .vercel/project.json      # copia orgId e projectId
```

Agora no Vercel dashboard -> Project `vibedistro` -> Settings -> **Environment Variables** adicione (production):

```
NEXT_PUBLIC_API_URL            = https://vibedistro-api.onrender.com
NEXT_PUBLIC_APP_URL            = https://vibedistro.vercel.app
NEXT_PUBLIC_APP_NAME           = VibeDistro
NEXT_PUBLIC_REVELATOR_ENVIRONMENT = sandbox
```

### b) Aplicar Render blueprint e obter SERVICE ID

1. dashboard.render.com -> **New** -> **Blueprint** -> conectar repo `k2publicidade/vibedistro`.
2. Render detecta `render.yaml`. Clique **Apply**.
3. Preencha os secrets pedidos (`DATABASE_URL`, `REDIS_URL`, `STORAGE_*`).
4. Apos criar, a URL do servico sera tipo `https://dashboard.render.com/web/srv-abc123...` — copie o `srv-abc123...`.
5. Aguarde primeiro deploy completar (pode demorar ~10min). Copie a URL publica final.

### c) Criar bucket R2

Siga `RUNBOOK.md` Passo 1 (2 min). Cole os valores STORAGE_* no Render (servico `vibedistro-api` -> Environment).

### d) Gerar tokens e colar no GitHub

1. **Vercel**: vercel.com -> Account -> Tokens -> Create -> copia.
2. **Render**: dashboard.render.com -> Account Settings -> API Keys -> Create -> copia.
3. GitHub -> seu repo -> Settings -> Secrets and variables -> Actions -> **New repository secret** pra cada linha da tabela acima.
4. Na aba Variables, crie `PROD_WEB_URL` e `PROD_API_URL`.

### e) Rodar o deploy

Opcao 1 — push qualquer commit pra `main`:
```bash
git commit --allow-empty -m "deploy: trigger pipeline"
git push origin main
```

Opcao 2 — manual dispatch:
- GitHub -> Actions -> **Deploy** -> **Run workflow** -> Run.

O workflow faz:
1. `migrate` — prisma db push + seed no Supabase
2. `deploy-api` — triggera Render e aguarda ate ficar `live`
3. `deploy-web` — `vercel pull/build/deploy --prod`
4. `smoke` — curl no `/api/v1/health` e `/login`

---

## Debug

- Workflow falhou em `migrate`: rode localmente com a mesma `DATABASE_URL` pra ver o erro exato.
- `deploy-api` timeout: Render free tier as vezes demora >20min em cold build; aumente o `for i in $(seq 1 60)` para `1 120`.
- `deploy-web` com "No existing credentials": conferir `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`.
- Smoke test 502: Render free dormindo — aguarde 60s e rode manual dispatch de novo.
