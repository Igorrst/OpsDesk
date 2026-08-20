# Design da API

## Convenções

- Base local: `http://localhost:3333`
- Conteúdo: `application/json`
- Respostas bem-sucedidas usam a propriedade `data`
- Erros usam `error.code` e `error.message`
- Validações podem incluir `error.details`
- Rotas protegidas recebem `Authorization: Bearer <access_token>`

## Autenticação

### POST /auth/register

Cria uma organização e seu primeiro usuário com papel `ADMIN`. Retorna access token e usuário autenticado, além de definir o refresh token em cookie.

Campos:

- `organizationName`
- `organizationSlug`
- `adminName`
- `email`
- `password`

### POST /auth/login

Autentica por `organizationSlug`, `email` e `password`. Retorna uma nova sessão sem revelar qual credencial estava incorreta em caso de falha.

### POST /auth/refresh

Rotaciona o refresh token recebido por cookie e retorna um novo access token. Reutilizar um token já rotacionado revoga toda a família da sessão.

### POST /auth/logout

Revoga a família do refresh token e remove o cookie. A resposta não possui conteúdo.

### GET /auth/me

Retorna o usuário da sessão atual. Exige access token válido e combina `userId` com `organizationId` na consulta.

## Códigos HTTP

- `200`: operação concluída
- `201`: recurso criado
- `204`: operação concluída sem conteúdo
- `400`: entrada inválida
- `401`: autenticação ausente ou inválida
- `403`: conta, papel ou origem sem permissão
- `404`: rota inexistente
- `409`: conflito de unicidade
- `429`: limite de requisições excedido
- `500`: erro interno não exposto ao cliente
