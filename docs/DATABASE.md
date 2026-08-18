# Banco de dados

## Tecnologia

O OpsDesk utiliza PostgreSQL com Prisma ORM. Em desenvolvimento, o banco é executado pelo Docker Compose e fica disponível em `localhost:5432`.

O Prisma Client utiliza o adapter `pg`. A URL de conexão é lida exclusivamente da variável `DATABASE_URL`.

## Modelos iniciais

### Organization

Representa o tenant da plataforma. O `slug` é único e será usado para identificar a organização durante a autenticação.

### User

Pertence obrigatoriamente a uma organização. O e-mail é único dentro da organização, permitindo que o mesmo endereço seja utilizado em tenants diferentes.

Papéis disponíveis:

- `ADMIN`
- `MANAGER`
- `ANALYST`
- `USER`

Estados disponíveis:

- `ACTIVE`
- `INVITED`
- `SUSPENDED`

E-mails devem ser normalizados para letras minúsculas pela camada de serviço antes de serem persistidos.

### RefreshToken

Armazena somente o hash do token. O vínculo utiliza `userId` e `organizationId` em conjunto para impedir associações entre tenants diferentes. O `familyId` permitirá rotação e revogação de uma cadeia completa de tokens.

## Isolamento entre tenants

As consultas de negócio devem sempre receber o `organizationId` obtido da sessão autenticada. Identificadores fornecidos pelo cliente nunca são suficientes para autorizar acesso.

Relacionamentos que atravessam recursos da organização devem utilizar chaves compostas com `organizationId` quando isso impedir referências entre tenants.

## Comandos

```bash
corepack pnpm db:generate
corepack pnpm --filter @opsdesk/api exec prisma migrate dev --name migration_name
corepack pnpm db:seed
corepack pnpm db:studio
```

Migrations são versionadas no repositório. Alterações manuais no banco não fazem parte do fluxo de desenvolvimento.
