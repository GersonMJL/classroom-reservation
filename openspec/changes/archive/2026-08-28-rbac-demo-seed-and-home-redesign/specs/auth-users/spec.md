## ADDED Requirements

### Requirement: Contas Padrão de Demonstração e Seeder
O sistema SHALL disponibilizar contas de demonstração populadas por seeder/migração com e-mails e senhas padronizados para os papéis `ADMIN`, `PROFESSOR`, `STUDENT` e `TECHNICIAN`.

#### Scenario: Login com conta padrão de administrador
- **WHEN** o usuário envia as credenciais de seed `admin@reservas.com` e senha `admin123`
- **THEN** o sistema autentica com sucesso e concede permissões de nível `ADMIN`

#### Scenario: Login com conta padrão de aluno
- **WHEN** o usuário envia as credenciais de seed `aluno@reservas.com` e senha `aluno123`
- **THEN** o sistema autentica com sucesso atribuindo o papel `STUDENT`

### Requirement: Restrição de Acesso para Usuários Comuns (Alunos)
O sistema SHALL ocultar do menu de navegação e bloquear o acesso a rotas administrativas de gestão para usuários comuns (`STUDENT`), direcionando seu fluxo exclusivamente para consulta e solicitação de salas.

#### Scenario: Aluno acessa menu lateral
- **WHEN** um usuário com perfil `STUDENT` está autenticado
- **THEN** o menu lateral exibe apenas "Início", "Salas e Laboratórios" e "Minhas Reservas", ocultando módulos administrativos de auditoria, governança e gestão de unidades
