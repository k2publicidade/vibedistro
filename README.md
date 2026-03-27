# VibeDistro

Plataforma white-label de distribuição musical com integração à API Revelator.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Monorepo | Turborepo |
| API | NestJS 10, Prisma, PostgreSQL |
| Web | Next.js 15, shadcn/ui, TanStack Query |
| Worker | BullMQ, Redis |
| Auth | JWT + Refresh Token rotation |
| Integração | Revelator API (sandbox/production) |
| Infra local | Docker Compose |

## Estrutura

```
vibedistro/
├── apps/
│   ├── api/          # NestJS REST API (porta 3001)
│   ├── web/          # Next.js 15 frontend (porta 3000)
│   └── worker/       # BullMQ job processor
├── packages/
│   ├── database/     # Prisma schema + cliente singleton
│   ├── config/       # Zod env schemas por app
│   ├── types/        # TypeScript interfaces compartilhadas
│   └── integrations/ # DistributionProvider + RevelatorProvider
├── docker-compose.yml
└── .env.example
```

## Setup rápido

### Pré-requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose

### 1. Clonar e instalar

```bash
git clone <repo>
cd vibedistro
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Subir infraestrutura (Postgres + Redis)

```bash
docker compose up postgres redis -d
```

### 4. Banco de dados

```bash
npm rundb:generate   # Gerar cliente Prisma
npm rundb:push       # Aplicar schema ao banco
npm rundb:seed       # Seed: permissões + roles do sistema
```

### 5. Desenvolvimento

```bash
npm rundev           # Inicia api + web + worker em paralelo
```

Acesse:
- Web: http://localhost:3000
- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/v1/docs (apenas em development)

## Scripts disponíveis

```bash
# Monorepo (raiz)
npm rundev             # Todos os apps em modo watch
npm runbuild           # Build de todos os packages + apps
npm runlint            # ESLint em todo o monorepo
npm runtypecheck       # tsc --noEmit em todo o monorepo
npm runtest            # Testes em todo o monorepo

# Banco de dados
npm rundb:generate     # prisma generate
npm rundb:push         # prisma db push (dev — sem migration file)
npm rundb:migrate      # prisma migrate dev (gera migration file)
npm rundb:studio       # Prisma Studio na porta 5555
npm rundb:seed         # ts-node seed.ts

# Por app
npm run dev --workspace=apps/api
npm run dev --workspace=apps/web
npm run dev --workspace=apps/worker
```

## Integração Revelator

### Arquitetura de desacoplamento

A integração segue o padrão de **Provider Interface + External Mapping**:

```
NestJS Services
      │
      ▼
ProviderRegistryService   ← único ponto de instanciação
      │
      ▼
DistributionProvider (interface)
      │
      ▼
RevelatorProvider         ← implementação concreta
      │
      ▼
RevelatorAdapter          ← mapeamento DTO ↔ wire format
      │
      ▼
Revelator API (sandbox / production)
```

Nenhum módulo de negócio importa `RevelatorProvider` diretamente. Trocar de provider no futuro exige apenas uma nova implementação da interface.

### Ambientes

O campo `REVELATOR_ENVIRONMENT` (sandbox | production) é propagado para:
- A URL da API utilizada
- O campo `environment` em cada registro `ExternalMapping`
- A chave de idempotência (`revelator:sandbox:release:...`)

Migrar de sandbox para produção = trocar 5 variáveis de ambiente. Os mappings de sandbox ficam preservados com `environment=SANDBOX`.

### Ativar integração

Por padrão `REVELATOR_ENABLED=false` — o sistema funciona sem chamar a API externa. Para ativar:

```env
REVELATOR_ENABLED=true
REVELATOR_ENVIRONMENT=sandbox
REVELATOR_CLIENT_ID=<seu client id>
REVELATOR_CLIENT_SECRET=<seu client secret>
REVELATOR_API_URL=https://api.sandbox.revelator.com/v1
REVELATOR_AUTH_URL=https://auth.sandbox.revelator.com/oauth/token
REVELATOR_WEBHOOK_SECRET=<seu webhook secret>
REVELATOR_ACCOUNT_ID=<seu account id>
```

### Fluxo de distribuição

```
1. Label cria Release (status: DRAFT)
2. Passa por editorial workflow (REVIEW → APPROVED)
3. POST /releases/:id/distribute → enqueue sync-release job
4. Worker: buildDTO → provider.submitRelease() → upsert ExternalMapping
5. Release.status → SUBMITTED
6. Revelator envia webhook → worker atualiza mapping + release
7. Release.status → LIVE
```

## RBAC

Permissões armazenadas no JWT como array `permissions[]`:

```
Format: resource:action[:scope]

Exemplos:
  release:create
  release:submit:tenant
  user:invite:tenant
  analytics:read
  royalty:read:own
```

Roles de sistema (seeded):
- `super_admin` — acesso irrestrito
- `label_owner` — gestão completa do tenant
- `catalog_manager` — gerencia catálogo e submissão
- `artist` — visualiza apenas seu próprio conteúdo

## Multi-tenancy

Isolamento por `tenantId` em todas as queries. Fluxo:

1. JWT payload contém `tenantId` e `permissions[]`
2. `TenantGuard` valida que `:tenantId` na URL bate com o JWT
3. Todos os services recebem `tenantId` do request context
4. Todas as queries incluem `where: { tenantId }`

## Filas BullMQ

| Fila | Propósito | Concorrência |
|------|-----------|-------------|
| `sync-release` | Submit/update/status-check releases na Revelator | 5 |
| `process-webhook` | Processar eventos recebidos de webhooks | 10 |
| `ingest-analytics` | Buscar streams e statements da Revelator | 3 |

## Deploy com Docker Compose (completo)

```bash
# Subir tudo
docker compose up -d

# Ver logs
docker compose logs -f api worker

# Parar
docker compose down

# Resetar volumes (apaga dados)
docker compose down -v
```

## Variáveis de ambiente obrigatórias

| Variável | Onde | Descrição |
|----------|------|-----------|
| `DATABASE_URL` | api, worker | Connection string PostgreSQL |
| `REDIS_URL` | api, worker | Connection string Redis |
| `JWT_SECRET` | api | Segredo para assinar access tokens |
| `JWT_REFRESH_SECRET` | api | Segredo para refresh tokens |

Ver `.env.example` para a lista completa com documentação.

## Próximas iterações

- [ ] Upload pipeline para assets de áudio e capa (S3/R2)
- [ ] Dashboard de analytics com gráficos de streams
- [ ] Módulo financeiro completo (splits, royalties, payouts)
- [ ] Sistema de aprovação multi-step para releases
- [ ] Portal de suporte (tickets)
- [ ] Notifications push / email
- [ ] Testes E2E com Playwright
