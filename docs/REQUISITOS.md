# **1\. Identificação de Atores**

Os atores representam os diferentes papéis que interagem com o sistema.

| Ator | Descrição |
| :---- | :---- |
| **Solicitante** | Usuário que busca e solicita a reserva de espaços e recursos. Pode ser um professor, aluno ou funcionário. |
| **Responsável** | Pessoa vinculada à reserva que assume a responsabilidade técnica e legal pelo uso do espaço (pode ser o próprio Solicitante). |
| **Administrador** | Responsável pela gestão dos ambientes, configuração de regras, buffers, aprovação de reservas críticas e gestão de penalidades. |
| **Técnico de Suporte** | Profissional que gerencia a disponibilidade de recursos móveis e presta suporte técnico (TI, Audiovisual, Laboratório). |
| **Sistema (Automático)** | Responsável por validações de conflitos, disparos de notificações e cancelamentos automáticos por no-show. |

---

# **2\. Requisitos Funcionais (RF)**

Estes requisitos descrevem **o que** o sistema deve fazer para atender às regras de negócio.

| ID | Requisito | Descrição | Atores | Status | Prioridade |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **RF01** | Cadastro de Ambientes | Permitir o registro de espaços com ID único, tipo, localização, capacidade e criticidade. | Administrador | Importante | Alta |
| **RF02** | Gestão de Recursos | Vincular recursos fixos ou móveis a ambientes, com calendários de disponibilidade independentes. | Administrador, Técnico | Importante | Alta |
| **RF03** | Consulta de Disponibilidade | Visualizar o calendário de ambientes e recursos em tempo real, considerando buffers de limpeza/setup. | Solicitante, Administrador | Importante | Alta |
| **RF04** | Solicitação de Reserva | Criar pedidos de reserva (simples ou recorrentes), informando solicitante, responsável e finalidade. | Solicitante | Importante | Alta |
| **RF05** | Fluxo de Aprovação | Sistema de aprovação manual para ambientes controlados/restritos e automática para ambientes comuns. | Administrador, Sistema | Importante | Alta |
| **RF06** | Bloqueio de Buffers | Geração automática de períodos de tempo antes e depois da reserva para manutenção/logística. | Sistema | Importante | Média |
| **RF07** | Check-in e Check-out | Registro do início e fim do uso do espaço para fins de prestação de contas e liberação de buffers. | Solicitante, Sistema | Importante | Média |
| **RF08** | Gestão de Conflitos | Impedir reservas simultâneas para o mesmo espaço/recurso ou quando não houver suporte técnico disponível. | Sistema | Importante | Alta |
| **RF09** | Cancelamento e No-Show | Permitir cancelamentos com registro de motivo e marcar "no-show" caso o check-in não ocorra na tolerância. | Solicitante, Sistema | Desejável | Média |
| **RF10** | Auditoria de Alterações | Manter histórico de versões e log de alterações para todas as reservas e ações administrativas. | Sistema, Administrador | Importante | Alta |

---

# **3\. Requisitos Não Funcionais (RNF)**

Estes requisitos descrevem as **qualidades** e **restrições** técnicas do sistema.

| ID | Requisito | Descrição | Atores | Status | Prioridade |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **RNF01** | Integridade de Dados | O sistema deve garantir que duas reservas nunca ocupem o mesmo slot de tempo para o mesmo recurso (concorrência). | Sistema | Importante | Alta |
| **RNF02** | Controle de Acesso (RBAC) | Restringir funcionalidades com base no papel do ator (ex: apenas Admin ajusta buffers). | Todos | Importante | Alta |
| **RNF03** | Rastreabilidade | Todas as ações de modificação devem ser gravadas com timestamp e identificador do usuário (Logs). | Sistema | Importante | Alta |
| **RNF04** | Usabilidade | A interface de consulta de calendário deve ser intuitiva, permitindo visão diária, semanal e mensal. | Solicitante, Admin | Desejável | Média |
| **RNF05** | Performance de Busca | Consultas de disponibilidade em períodos de até 30 dias devem retornar resultados em menos de 2 segundos. | Solicitante | Desejável | Baixa |

---

