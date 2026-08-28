# Proposta: Seeder de Perfis RBAC, Restrição de Usuários Comuns e Redesign da Home

## Why
Ao inicializar o sistema para testes e demonstração, os usuários necessitam de contas pré-configuradas com diferentes papéis (`ADMIN`, `PROFESSOR`, `STUDENT`, `TECHNICIAN`) para validar permissões de forma rápida e segura. Além disso, usuários comuns (alunos/solicitantes básicos) devem ter visão restrita apenas a solicitar salas e acompanhar suas próprias reservas, enquanto a página inicial (`home.tsx`) precisa de uma identidade visual marcante, acolhedora e funcional que transmita o valor do sistema de reservas acadêmico.

## What Changes
- **Seeder de Dados e Contas Pré-configuradas**:
  - Script e migração de seed para criar usuários padrão de teste com senhas conhecidas:
    - **Administrador**: `admin@reservas.com` / `admin123` (`ADMIN`)
    - **Professor**: `professor@reservas.com` / `prof123` (`PROFESSOR`)
    - **Aluno / Usuário Comum**: `aluno@reservas.com` / `aluno123` (`STUDENT`)
    - **Técnico de Suporte**: `tecnico@reservas.com` / `tec123` (`TECHNICIAN`)
  - Cadastro de dados contextuais para demonstração (departamentos, locais, salas com criticidades comum/controlada/restrita, recursos e qualificações).
- **Restrição e Experiência do Usuário Comum (RBAC)**:
  - Ocultação no menu lateral e restrição de rotas de gestão administrativa (unidades, penalidades, bloqueios, auditoria, configurações) para usuários com papel `STUDENT`.
  - Foco na jornada do aluno/solicitante: busca de salas disponíveis, solicitação rápida e acompanhamento do status da sua reserva.
- **Redesign da Página Home (`home.tsx`)**:
  - Nova identidade visual alinhada ao design system terroso:
    - **Hero Section Premium**: Banner acolhedor com saudação dinâmica, busca rápida de ambientes e status do dia.
    - **Ações Rápidas (Quick Actions)**: Botões de acesso direto ("Nova Solicitação", "Consultar Disponibilidade", "Minhas Reservas Ativas").
    - **Cartões de Demonstração / Alternador de Contas**: Seletor rápido de 1 clique para login de teste no ambiente de desenvolvimento.
    - **Métricas e Salas em Destaque**: Espaços livres agora, total de agendamentos e avisos institucionais.

## Capabilities

### New Capabilities
- `home-and-navigation-experience`: Identidade visual da página inicial, Hero interativo, ações rápidas e navegação condicional por perfil.

### Modified Capabilities
- `auth-users`: Adição de seeder oficial de contas com perfis RBAC pré-definidos e garantia de restrição de menus/ações para usuários com papel `STUDENT`.

## Impact
- **Backend**: Script/migration de seed executado automaticamente na subida (`start.sh` / Alembic) para popular usuários e dados essenciais.
- **Frontend**: Reformulação completa de [`frontend/app/routes/home.tsx`](file:///Users/vinicastrolima_dev/github/tcc/frontend/app/routes/home.tsx), ajustes no [`frontend/app/ui/NavConfig.ts`](file:///Users/vinicastrolima_dev/github/tcc/frontend/app/ui/NavConfig.ts) e suporte a preenchimento rápido de login na tela de autenticação.
