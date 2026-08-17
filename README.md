# OpsDesk

Plataforma SaaS para gestão de suporte, chamados e operações.

## Estrutura

- `apps/web`: aplicação web com Next.js
- `apps/api`: API REST com Express

## Requisitos

- Node.js 24 ou superior
- Corepack habilitado

## Desenvolvimento

```bash
corepack pnpm install
corepack pnpm dev
```

O Front-End fica disponível em `http://localhost:3000` e a API em `http://localhost:3333`.

## Qualidade

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```
