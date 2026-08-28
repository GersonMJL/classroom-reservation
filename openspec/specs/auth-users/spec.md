# Autenticação e Gestão de Usuários

## Purpose
Prover mecanismos seguros de autenticação, geração de tokens JWT com hash Argon2 e gerenciamento de perfis de usuários (Admin, Professor, Aluno, Técnico de Suporte, Operador e Externo) no sistema de reservas.

## Requirements

### Requirement: Autenticação de Usuário e Emissão de Tokens
O sistema SHALL permitir o login de usuários cadastrados fornecendo e-mail e senha, retornando tokens de acesso (access token) e atualização (refresh token) assinados em formato JWT.

#### Scenario: Login com credenciais válidas
- **GIVEN** um usuário ativo no banco de dados com e-mail `admin@exemplo.com` e senha cadastrada
- **WHEN** o usuário envia uma requisição `POST /api/v1/auth/login` com as credenciais corretas
- **THEN** o sistema retorna código HTTP 200 contendo o token JWT de acesso, tipo de token Bearer e dados resumidos do usuário

#### Scenario: Falha de autenticação por credenciais inválidas
- **GIVEN** um usuário tentando se autenticar no sistema
- **WHEN** o usuário envia senha incorreta ou e-mail inexistente
- **THEN** o sistema retorna código HTTP 401 (Unauthorized) com mensagem informativa em pt-BR

### Requirement: Controle de Acesso Baseado em Papéis (RBAC)
O sistema SHALL aplicar guards de autorização baseados no papel (`Role`) do usuário para proteger rotas administrativas, operacionais e de solicitação comum.

#### Scenario: Usuário comum tenta acessar rota administrativa
- **GIVEN** um usuário autenticado com perfil `STUDENT` ou `PROFESSOR`
- **WHEN** o usuário tenta executar uma mutação restrita a administradores (ex: exclusão de unidade organizacional)
- **THEN** o sistema retorna código HTTP 403 (Forbidden)

### Requirement: Gestão de Cadastro de Usuários
O sistema SHALL permitir que administradores criem, consultem, atualizem e desativem usuários no sistema.

#### Scenario: Criação de novo usuário com hash de senha
- **GIVEN** um administrador autenticado
- **WHEN** envia `POST /api/v1/usuarios` com nome, e-mail único, papel e senha
- **THEN** o sistema persiste o registro criptografando a senha com Argon2 e retorna o ID do usuário criado
