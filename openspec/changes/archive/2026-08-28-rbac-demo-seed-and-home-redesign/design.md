# Design Técnico: Seeder de Contas RBAC, Restrições de Perfil e Redesign da Home

## Context
Atualmente, após inicializar o banco de dados, é necessário cadastrar manualmente usuários para testar o sistema. Além disso, a página inicial carece de um Hero banner com identidade visual impactante, e o usuário comum (Aluno) visualiza opções de navegação de governança e auditoria que não pertencem ao seu fluxo de uso. Ver `proposal.md` para motivação e escopo.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      FLUXOS POR PAPEL DE USUÁRIO (RBAC)                       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   [ ADMIN / GESTOR ]                                                          │
│   ├─ Início (Visão Geral de Ocupação, Métricas Globais, Notificações)         │
│   ├─ Gestão de Ambientes, Bloqueios de Calendário, Recursos                   │
│   ├─ Aprovações de Reservas Críticas, Governança, Penalidades, Auditoria      │
│                                                                               │
│   [ PROFESSOR ]                                                               │
│   ├─ Início (Minhas Aulas, Agendamentos de Laboratórios)                      │
│   ├─ Solicitação de Reservas Recorrentes e Compostas                          │
│   └─ Consulta de Disponibilidade e Notificações                               │
│                                                                               │
│   [ ALUNO / USUÁRIO COMUM ]                                                   │
│   ├─ Início (Hero Acolhedor, Ações Rápidas, Minhas Reservas)                  │
│   ├─ Consulta de Salas e Laboratórios Disponíveis                             │
│   └─ Solicitação de Reserva Simples + Acompanhamento de Status                │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- **Seeder Idempotente**: Criar migração e script de seed com 4 contas padrão (`admin@reservas.com`, `professor@reservas.com`, `aluno@reservas.com`, `tecnico@reservas.com`) com senhas seguras em Argon2 e dados de exemplo (prédios, salas, recursos).
- **Restrição de Menus para Alunos**: Ajustar `NavConfig.ts` e `AppShell.tsx` para que o papel `STUDENT` veja apenas rotas pertinentes ao seu escopo.
- **Redesign da Home**: Criar uma página inicial envolvente com Hero banner na paleta terrosa, botões de ação rápida, cards de resumo e atalho visual de credenciais de teste para desenvolvedores.

**Non-Goals:**
- Alterar as regras da máquina de estados de reservas ou modificar o modelo de banco de dados existente.

## Decisions

### Decisão 1: Seeder Automatizado e Idempotente
- **Escolha**: Criar uma migração Alembic dedicada (`2026_08_28_1900-seed_demo_accounts_and_data.py`) que verifica se o e-mail ou código já existe antes de inserir (`ON CONFLICT DO NOTHING` ou verificação condicional).
- **Contas Padrão**:
  - `admin@reservas.com` / `admin123` (Papel: `ADMIN`)
  - `professor@reservas.com` / `prof123` (Papel: `PROFESSOR`)
  - `aluno@reservas.com` / `aluno123` (Papel: `STUDENT`)
  - `tecnico@reservas.com` / `tec123` (Papel: `TECHNICIAN`)

### Decisão 2: Filtragem Rigorosa de Menus e Rotas (RBAC)
- **Escolha**: Utilizar a matriz de permissões do `NavConfig.ts` (`allowedRoles`) para filtrar automaticamente a barra de navegação e o `CommandPalette`, garantindo que usuários com papel `STUDENT` tenham uma interface limpa e despoluída.

### Decisão 3: Identidade Visual e Componentes da Home
- **Hero Section**: Background com gradiente terroso quente (`#3b2d20` a `#231a12`), tipografia destacada, saudação dinâmica baseada no horário e nome do usuário.
- **Quick Actions**: Grade responsiva de cartões com ícones para "Solicitar Sala", "Verificar Horários", "Minhas Reservas", "Suporte".
- **Demo Switcher**: Caixa de destaque informando as credenciais de teste com botões de cópia rápida para facilitar testes locais e demonstrações.

## Risks / Trade-offs

- **[Risco: Conflito de IDs no seed se o banco já tiver dados]** → **Mitigação**: O seeder pesquisa por e-mail/código único em vez de forçar IDs fixos na inserção.

## Migration Plan

1. **Backend**: Criar migração Alembic com o seed de contas e dados demonstrativos.
2. **Frontend UI**: Atualizar `NavConfig.ts` com as permissões refinadas por papel.
3. **Frontend Home**: Reformular `frontend/app/routes/home.tsx` e `login.tsx` com o Hero banner, Quick Actions e o seletor de contas demonstrativas.
