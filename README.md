# OpsDesk

Plataforma SaaS para gestão de suporte, chamados e operações.

## Estrutura

- `apps/web`: aplicação web com Next.js
- `apps/api`: API REST com Express

## Requisitos

- Node.js 24 ou superior
- Corepack habilitado
- Docker com Docker Compose

## Infraestrutura local

Crie o arquivo de variáveis locais e inicie PostgreSQL e Redis:

```powershell
Copy-Item .env.example .env
docker compose up -d
docker compose ps
```

Configure também as variáveis da API:

```powershell
Copy-Item apps/api/.env.example apps/api/.env
```

Para interromper os serviços sem remover os dados:

```bash
docker compose down
```

## Desenvolvimento

```bash
corepack pnpm install
corepack pnpm dev
```

O Front-End fica disponível em `http://localhost:3000` e a API em `http://localhost:3333`.

## Banco de dados

Com o PostgreSQL em execução, aplique as migrations e execute o seed:

```bash
corepack pnpm db:migrate
corepack pnpm db:seed
```

As decisões de modelagem estão em [`docs/DATABASE.md`](docs/DATABASE.md).

## Qualidade

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```
