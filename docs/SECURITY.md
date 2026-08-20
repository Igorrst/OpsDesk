# Segurança

## Senhas

Senhas são processadas com Argon2id e nunca são persistidas ou registradas em texto puro. A API exige pelo menos 12 caracteres, letras maiúsculas e minúsculas, número e caractere especial.

Erros de login não revelam se a organização, o e-mail ou a senha estão incorretos. Uma verificação de hash também é executada quando o usuário não existe para reduzir diferenças de tempo observáveis.

## Sessões

O access token é um JWT assinado com `HS256`, possui emissor, audiência e expiração de 15 minutos. Ele é enviado no cabeçalho `Authorization` usando o esquema `Bearer`.

O refresh token é um valor aleatório opaco com validade de 30 dias. Apenas seu hash SHA-256 é persistido. O valor original fica em cookie `httpOnly`, `secure` em produção e limitado ao caminho `/auth`.

Cada renovação revoga o refresh token anterior e cria outro na mesma família. A reutilização de um token revogado invalida toda a família, reduzindo o impacto de roubo de sessão.

O logout revoga a família da sessão e remove o cookie do cliente.

## CSRF e origem

Rotas de autenticação que alteram estado rejeitam origens diferentes de `CORS_ORIGIN`. Requisições sem cabeçalho `Origin` continuam permitidas para clientes não executados em navegadores.

Em produção, o cookie utiliza `SameSite=None` para permitir a comunicação entre Front-End e API hospedados em domínios diferentes. Por isso, a validação de origem não deve ser removida.

## Autorização e tenant

O access token contém `userId`, `organizationId` e papel. O middleware de autenticação valida assinatura, algoritmo, emissor, audiência e expiração.

O RBAC é aplicado no Back-End pelo middleware de autorização. Ocultar elementos no Front-End não substitui essa validação.

Consultas de recursos devem combinar o identificador do recurso com o `organizationId` obtido do token validado. O cliente não escolhe o tenant da requisição.

## Segredos

`JWT_SECRET` deve possuir pelo menos 32 caracteres e ser diferente em cada ambiente. Arquivos `.env` não são versionados; somente `.env.example` faz parte do repositório.
