# VibeDistro - deploy rapido para demo

Objetivo: colocar o painel online para apresentar ao cliente, sem configurar Docker local.

## Caminho recomendado: Render Blueprint

1. Acesse https://dashboard.render.com/blueprints.
2. Clique em **New Blueprint Instance**.
3. Conecte o GitHub e selecione `k2publicidade/vibedistro`.
4. Use o arquivo `render.yaml` da raiz.
5. Quando o Render pedir `REVELATOR_WHITE_LABEL_URL`, preencha a URL white label da Revelator se ja tiver. Para demo visual sem redirecionamento real, use `https://your-label.revelator.com`.
6. Crie o blueprint e aguarde os deploys.

O blueprint cria:

- `vibedistro-web`: painel Next.js
- `vibedistro-api`: API NestJS
- `vibedistro-db`: Postgres
- `vibedistro-redis`: Render Key Value compativel com Redis

As migrations do Prisma rodam automaticamente quando a API inicia.

## URLs esperadas

- Web: `https://vibedistro-web.onrender.com`
- API: `https://vibedistro-api.onrender.com/api/v1/health`

Se o Render alterar o subdominio por conflito de nome, ajuste estas variaveis no dashboard:

- API `ALLOWED_ORIGINS`
- API `API_URL`
- Web `NEXT_PUBLIC_API_URL`
- Web `NEXT_PUBLIC_APP_URL`

## Login para testar

Depois do deploy, crie um usuario pelo fluxo de cadastro/login do painel. Se preferir um usuario demo fixo, rode o seed da base ou crie um endpoint/admin seed temporario antes da apresentacao.

## Limitacoes desta demo

- Storage esta em modo `local`, entao uploads podem ser perdidos quando o container reiniciar.
- Worker de filas nao esta ligado. Sincronizacoes longas e jobs assíncronos devem ser ativados depois.
- Revelator esta em `sandbox`.
