## 1. Backend: Seeder de Contas e Dados de Demonstração

- [x] 1.1 Criar migração Alembic para criação idempotente dos usuários `admin@reservas.com`, `professor@reservas.com`, `aluno@reservas.com` e `tecnico@reservas.com` com hashes Argon2
- [x] 1.2 Incluir no seed dados contextuais (campus, blocos, salas de aula, laboratórios com criticidades variadas e recursos de exemplo)

## 2. Frontend: Restrição de Menus e Permissões (RBAC)

- [x] 2.1 Atualizar `frontend/app/ui/NavConfig.ts` com restrições explícitas por papel (`ADMIN`, `PROFESSOR`, `STUDENT`, `TECHNICIAN`)
- [x] 2.2 Garantir que usuários com perfil `STUDENT` vejam apenas Início, Salas e Minhas Reservas

## 3. Frontend: Redesign da Home e Seletor de Demonstração

- [x] 3.1 Criar Hero Banner acolhedor em `frontend/app/routes/home.tsx` com saudação contextual e status do dia
- [x] 3.2 Implementar cartões de Ações Rápidas (Quick Actions) para nova solicitação, busca de salas e histórico
- [x] 3.3 Implementar componente de Contas de Demonstração com preenchimento de 1-clique para teste no Login e na Home
- [x] 3.4 Exibir estatísticas resumidas e cartões de salas em destaque

## 4. Verificação e Testes

- [x] 4.1 Testar login e permissões com as contas `admin@reservas.com`, `professor@reservas.com` e `aluno@reservas.com`
- [x] 4.2 Validar que a navegação do aluno oculta módulos de administração
- [x] 4.3 Validar responsividade e design da nova página Home
