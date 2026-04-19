# Sistema de Reserva de Salas — Plano de Desenvolvimento

## Resumo de Lacunas (Gap Summary)

| Área | Requisito dos Docs | Backend | Frontend |
|---|---|---|---|
| Esquema DB | Segue o diagrama ER | 10 tabelas ausentes, múltiplas lacunas de campos | — |
| Roteadores ativos | 11 módulos | 5 implementados | — |
| Enums | ~15 tipos de enum em PT-BR | 4 enums existentes em inglês a renomear + 6 novos a criar | 4 types/interfaces em inglês a renomear + 7 novos a criar |
| RBAC | Verificação de roles em todos os endpoints | Apenas autenticação, sem verificação de roles | Menu role-based básico (admin/user) |
| Ciclo de vida da reserva | Máquina de 10 estados | Sem máquina de estados | Sem UI de reserva |
| Detecção de conflitos | Verificação de disponibilidade com buffer | Não implementado | — |
| Fluxo de aprovação | Auto/manual baseado em criticidade | Não implementado | Sem UI de aprovação |
| Check-in/check-out | Embutido na linha da reserva | Tabelas separadas, sem lógica | Sem UI de operações |
| Automação de penalidades | Aplicação automática em no-show/atraso | Não implementado | Sem UI de penalidades |
| Tipos de reserva | SIMPLES, RECORRENTE, COMPOSTA | Sem campo de tipo | — |
| Calendário | Visualização diária/semanal/mensal | Sem endpoint de disponibilidade | Sem calendário |
| Notificações | Aprovação, cancelamento, penalidade | Não implementado | — |
| Testes | Unitários + integração | Nenhum | — |

---

## Fase 1 — Completude de Enums e Registro de Módulos

**Objetivo:** Tornar todos os módulos acessíveis e padronizar os enums de domínio em ambas as camadas.

> **Decisão:** Todo o código (enums, nomes de rotas, interfaces do frontend, campos de payload) deve estar em PT-BR. Os 4 enums existentes em inglês e os prefixos de rota em inglês (`/environments`, `/locations`, `/resources`, `/users`) devem ser migrados para PT-BR junto com a Fase 1.

### Backend

**`backend/app/shared/enums.py`** — Renomear os 4 enums existentes para PT-BR e adicionar novos:

| Enum existente (EN) | Enum renomeado (PT-BR) | Valores PT-BR |
|---|---|---|
| `EnvironmentType` | `TipoAmbiente` | `SALA_AULA`, `LABORATORIO`, `AUDITORIO`, `SALA_REUNIAO`, `ESTUDIO`, `MULTIPROPOSITO` |
| `EnvironmentCriticality` | `CriticidadeAmbiente` | `COMUM`, `CONTROLADO`, `RESTRITO` |
| `ResourceType` | `TipoRecurso` | `EQUIPAMENTO`, `MOBILIARIO`, `LICENCA_SOFTWARE`, `CHAVE`, `SUPRIMENTO`, `KIT` |
| `ReservationPurpose` | `FinalidadeReserva` | `AULA`, `REUNIAO`, `PESQUISA`, `EVENTO`, `MANUTENCAO`, `TREINAMENTO` |

| Enum novo | Valores |
|---|---|
| `StatusReserva` | `RASCUNHO`, `AGUARDANDO_APROVACAO`, `APROVADA`, `REJEITADA`, `AGUARDANDO_CHECKIN`, `EM_USO`, `AGUARDANDO_CHECKOUT`, `CONCLUIDA`, `CANCELADA`, `NAO_COMPARECEU` |
| `TipoReserva` | `SIMPLES`, `RECORRENTE`, `COMPOSTA` |
| `StatusAprovacao` | `PENDENTE`, `APROVADO`, `REJEITADO` |
| `TipoBloqueioCalendario` | `MANUTENCAO`, `FERIADO`, `EVENTO`, `RESERVA_ADMIN` |
| `TipoPenalidade` | `ADVERTENCIA`, `SUSPENSAO`, `BLOQUEIO` |
| `AcaoAuditoria` | `CRIACAO`, `ATUALIZACAO`, `EXCLUSAO`, `MUDANCA_STATUS`, `LOGIN`, `LOGOUT` |
| `TipoBuffer` | `PRE`, `POS` |
| `TipoSuporte` | `TECNICO`, `LIMPEZA`, `SEGURANCA` |
| `PapelUsuario` | `ADMIN`, `GERENTE`, `TECNICO`, `SOLICITANTE` |
| `TipoVinculo` | `ALUNO`, `PROFESSOR`, `FUNCIONARIO`, `EXTERNO` |
| `VinculoRecurso` | `FIXO`, `MOVEL` |

**`backend/app/modules/reservations/models.py`** (Fase 1, apenas models) — Criar modelo `Aprovacao` com campo `status` usando `SAEnum(StatusAprovacao)`. A lógica de endpoints fica na Fase 3.

**`backend/app/main.py`** — Renomear prefixos existentes para PT-BR e registrar 6 roteadores faltantes:

| Módulo | Prefixo antigo (EN) | Prefixo novo (PT-BR) |
|---|---|---|
| `environments` | `/api/v1/environments` | `/api/v1/ambientes` |
| `locations` | `/api/v1/locations` | `/api/v1/localizacoes` |
| `resources` | `/api/v1/resources` | `/api/v1/recursos` |
| `users` | `/api/v1/users` | `/api/v1/usuarios` |
| `auth` | `/api/v1/auth` | `/api/v1/auth` *(mantém)* |
| `organizational_units` | *(novo)* | `/api/v1/unidades-organizacionais` |
| `reservations` | *(novo)* | `/api/v1/reservas` |
| `qualifications` | *(novo)* | `/api/v1/qualificacoes` |
| `operations` | *(novo)* | `/api/v1/operacoes` |
| `governance` | *(novo)* | `/api/v1/governanca` |
| `audit` | *(novo)* | `/api/v1/auditoria` |

**`backend/app/modules/reservations/models.py`** — Substituir campos `String` raw por enums (`SAEnum`) nos models `Aprovacao`, `BloqueioCalendario`, `BufferExecucao`, `SuporteReserva`.

### Frontend

**`frontend/app/services/api.ts`** — Renomear interfaces e tipos existentes para PT-BR e adicionar novos enums:

| Interface/type existente (EN) | Renomeado (PT-BR) | Campos renomeados |
|---|---|---|
| `EnvironmentType` | `TipoAmbiente` | valores: `SALA_AULA`, `LABORATORIO`, `AUDITORIO`, `SALA_REUNIAO`, `ESTUDIO`, `MULTIPROPOSITO` |
| `EnvironmentCriticality` | `CriticidadeAmbiente` | valores: `COMUM`, `CONTROLADO`, `RESTRITO` |
| `Environment` / `EnvironmentCreate` | `Ambiente` / `AmbienteCreate` | `name`→`nome`, `type`→`tipo`, `criticality`→`criticidade`, `capacity`→`capacidade`, `location_id`→`localizacao_id`, `operating_hours`→`horario_funcionamento`, `requires_approval`→`requer_aprovacao` |
| `Location` | `Localizacao` | `building`→`predio`, `floor`→`andar` |
| `Resource` / `ResourceCreate` | `Recurso` / `RecursoCreate` | `name`→`nome`, `tipo`, `categoria`, `tipo_vinculo` (`FIXO`\|`MOVEL`), `ativo`; remover `resource_code`, `availability_notes`, `is_active`, `created_at`, `updated_at` |
| `User` / `UserCreate` / `UserUpdate` | `Usuario` / `UsuarioCriar` / `UsuarioAtualizar` | `name`→`nome`, `is_active`→`ativo`, `roles`→`papeis`, `password`→`senha` |
| `Purpose` / `PurposeCreate` | `Finalidade` / `FinalidadeCreate` | `is_active`→`ativo` |

URLs atualizadas: `/environments`→`/ambientes`, `/locations`→`/localizacoes`, `/resources`→`/recursos`, `/users`→`/usuarios`, `/purposes`→`/finalidades`.

Adicionar novos enums: `StatusReserva`, `TipoReserva`, `StatusAprovacao`, `TipoPenalidade`, `AcaoAuditoria`, `TipoBuffer`, `PapelUsuario`. Adicionar helpers `hasRole()`, `isAdmin()`, `isGerente()`, `isTecnico()`.

**`frontend/app/routes.ts`** — Registrar rotas: `reservas`, `calendario`, `aprovacoes`, `operacoes`, `penalidades`, `auditoria`, `localizacoes`, `qualificacoes`, `organizacoes`, `manutencao`.

**`frontend/app/root.tsx`** — Reestruturar navegação: menu principal (Reservas, Calendário, Ambientes, Recursos, Finalidades) + dropdown "Administração" para itens administrativos baseado em roles.

**`frontend/app/components/StatusBadge.tsx`** *(novo)* — Chip compartilhado que mapeia `StatusReserva` para cores e labels em português.

### Verificação da Fase 1
- Backend: servidor sobe sem erros e `/docs` lista os 11 módulos com prefixos PT-BR
- Backend: nenhuma referência aos enums antigos em inglês (`EnvironmentType`, `EnvironmentCriticality`, etc.)
- Frontend: `tsc --noEmit` sem erros; rotas registradas sem 404; navegação renderiza corretamente por papel
- Frontend: nenhuma chamada de API apontando para URLs em inglês (`/environments`, `/locations`, `/resources`, `/users`)

---

## Fase 2 — Core de Reservas e Detecção de Conflitos

**Objetivo:** Implementar o ciclo de vida da reserva com verificação rigorosa de disponibilidade.

### Backend

**`backend/app/services/conflict_checker.py`** *(novo)*:
- Verificar sobreposições no mesmo ambiente considerando buffers (`buffer_antes_min`, `buffer_depois_min`)
- Verificar `disponibilidade_recurso` para recursos móveis
- Verificar bloqueios de manutenção e `buffer_execucao` ativos

**`backend/app/services/state_machine.py`** *(novo)*:
- Gerenciar transições de status (ex: `APROVADA` → `EM_USO` via check-in)
- Cada transição registra entrada em `historico_status_reserva`
- Transições inválidas retornam erro 422

**`backend/app/modules/reservations/router.py`** — Endpoints completos:
- `POST /reservas` — cria reserva, executa conflict checker, aplica aprovação automática para COMUM
- `GET /reservas` — lista com filtros de status, ambiente_id, paginação
- `GET /reservas/{id}` — detalhe completo
- `POST /reservas/{id}/cancelar` — cancela com motivo obrigatório

### Frontend

**Padrão de arquivos** (seguir a estrutura de `environments/`):

```
frontend/app/routes/
  reservas.tsx
  reservas/
    types.ts
    use-reservas-data.ts
    use-reserva-wizard.ts
    use-reservas-management.ts
    reservas-table.tsx
    reserva-wizard-dialog.tsx
    cancel-reserva-dialog.tsx
```

**`reservas.tsx`** — Filtro por status (chips), tabela de reservas, botão "Nova Reserva", wizard de criação, dialog de cancelamento.

**`reserva-wizard-dialog.tsx`** — Wizard com MUI Stepper em 4 etapas:
1. DATETIME — data, hora_inicio, hora_fim, num_participantes
2. AMBIENTE — cards clicáveis de ambientes disponíveis (CONTROLADO/RESTRITO com chip de aviso)
3. DETALHES — propósito, responsável, recursos (checkbox)
4. REVISÃO — resumo + aviso de aprovação manual se ambiente não for COMUM

**Ações na tabela por status:**
- APROVADA + dentro da janela (±15min) → "Check-in"
- EM_USO → "Check-out"
- AGUARDANDO_APROVACAO / APROVADA (não iniciada) → "Cancelar"

### Verificação da Fase 2
- `POST /reservas` retorna 409 em caso de conflito
- Wizard cria reserva e ela aparece na lista
- Cancelamento exige motivo

---

## Fase 3 — Fluxo de Aprovação e Qualificações

**Objetivo:** Lógica de aprovação auto/manual e validação de pré-requisitos do usuário.

### Backend

- **Ambientes COMUNS:** Aprovação automática se dentro da política de reserva (`PoliticaReserva`)
- **Ambientes CONTROLADOS/RESTRITOS:** Status `AGUARDANDO_APROVACAO`, notifica admin
- **Qualificações:** Validar se o usuário possui certificações exigidas pelo ambiente antes de criar reserva
- `GET /aprovacoes` — lista pendentes
- `POST /aprovacoes/{id}/aprovar` — aprova com comentário opcional
- `POST /aprovacoes/{id}/rejeitar` — rejeita com comentário obrigatório

### Frontend

**Arquivos em `frontend/app/routes/aprovacoes/`:**
- `aprovacoes.tsx` — badge de contagem pendente, filtros, tabela, dialog de decisão (acesso: admin e gerente)
- `aprovacoes-table.tsx` — colunas: Solicitante, Ambiente, Data/Hora, Criticidade, Ações ("Aprovar" / "Rejeitar")
- `aprovacao-decision-dialog.tsx` — rejeição exige `comentarios` obrigatório; submit desabilitado se vazio

### Verificação da Fase 3
- Reserva em ambiente CONTROLADO fica `AGUARDANDO_APROVACAO`
- Admin aprova → status muda para `APROVADA`
- Rejeição exige comentário

---

## Fase 4 — Operações (Check-in / Check-out / No-Show)

**Objetivo:** Implementar o ciclo operacional diário.

### Backend

- **Check-in:** `POST /reservas/{id}/checkin` — valida janela de tolerância (±15 min); muda status para `EM_USO`
- **Check-out:** `POST /reservas/{id}/checkout` — define fim real; cria `BufferExecucao` de tipo POS; muda status para `AGUARDANDO_CHECKOUT`
- **No-Show:** Tarefa em segundo plano que penaliza reservas sem check-in após a tolerância → status `NAO_COMPARECEU`
- **Liberação Antecipada:** `POST /buffers/{id}/liberar` — libera buffer de limpeza antes do previsto

### Frontend

**`frontend/app/routes/operacoes.tsx`** (padrão flat — acesso: admin e tecnico):
- Seção "Aguardando Check-in" — botão "Check-in" habilitado apenas dentro de ±15min
- Seção "Em Uso" — botões "Check-out" e "Não Compareceu"
- Carrega ambos os grupos com `Promise.all()`
- Contador regressivo para janela de check-in (useEffect, intervalo 60s)

### Verificação da Fase 4
- Check-in fora da janela retorna erro 422
- Job de no-show cria penalidade automaticamente
- Check-out cria buffer de pós-uso no calendário

---

## Fase 5 — Governança (Penalidades e Recursos)

**Objetivo:** Sistema de punição configurável com mecanismo de apelo.

### Backend

- **Escalonamento:** 3 no-shows em 30 dias → bloqueio de novas reservas por 30 dias
- **Apelos:** `POST /penalidades/{id}/apelar` — usuário contesta para revisão do admin
- **Configurabilidade:** Thresholds e durações configuráveis via tabela de configurações

### Frontend

**`frontend/app/routes/penalidades.tsx`** (padrão flat):
- Usuário comum: suas próprias penalidades + botão "Apelar" para não apeladas
- Admin: todas as penalidades + "Aplicar Penalidade" com dialog (usuario, reserva_id, tipo, descrição, duração)

### Verificação da Fase 5
- Usuário com 3 no-shows fica bloqueado para novas reservas
- Apelo registrado aparece na fila do admin

---

## Fase 6 — Calendário e Tipos Avançados de Reserva

### Backend

- **Reservas Recorrentes:** Gerar ocorrências baseadas em RRULE (iCal); falha atômica se houver conflito em qualquer data
- **Reservas Compostas:** Agrupar múltiplas reservas (ex: várias salas para um evento); cancelamento de item crítico alerta o grupo
- **Gestão de Manutenção:** `POST /manutencao` — bloqueia ambientes/recursos para reparo
- **Endpoint de Disponibilidade:** `GET /ambientes/{id}/disponibilidade?start=&end=` — retorna slots livres/ocupados considerando buffers e manutenções

### Frontend

**Calendário** — arquivos em `frontend/app/routes/calendario/`:
- `calendario.tsx` — toggle Dia/Semana/Mês, setas de navegação, filtro de ambiente
- `calendario-grid.tsx` — grade visual com blocos coloridos absolutos por tipo de slot
- `use-calendario-data.ts` — fetch de reservas + bloqueios do período visível

**Esquema de cores:**
- Reserva APROVADA/EM_USO → `primary.light`
- Aguardando aprovação → `warning.light`
- Buffer → `grey[200]` com padrão diagonal CSS
- Manutenção → `warning.main` com opacidade reduzida

**Manutenção** — `frontend/app/routes/manutencao.tsx` (padrão flat, acesso: admin/gerente):
- Dialog com ambiente (Select), data_inicio, data_fim, motivo
- Alerta frontend se o bloco sobrepõe reservas aprovadas existentes

### Verificação da Fase 6
- Reserva recorrente com conflito em uma data rejeita todo o lote
- Cancelamento de item crítico de reserva composta alerta dependentes
- Blocos de manutenção aparecem em laranja no calendário

---

## Fase 7 — Aplicação de RBAC

**Objetivo:** Restringir endpoints baseados em roles.

### Backend

Aplicar decoradores de verificação de role em todos os endpoints conforme a tabela:

| Endpoint | Roles permitidos |
|---|---|
| `POST /ambientes` | ADMIN |
| `POST /reservas` | ADMIN, GERENTE, SOLICITANTE |
| `POST /aprovacoes/{id}/aprovar` | ADMIN, GERENTE |
| `POST /reservas/{id}/checkin` | ADMIN, TECNICO, SOLICITANTE |
| `GET /auditoria` | ADMIN |
| `POST /penalidades` | ADMIN |

### Frontend

O controle por role no frontend já está coberto pela reestruturação da navegação da Fase 1. Nesta fase, adicionar guards explícitos nas rotas que redirecionam usuários sem permissão para `/`.

### Verificação da Fase 7
- Usuário comum recebe 403 ao tentar criar ambientes
- Frontend redireciona não-admins que acessam `/auditoria` diretamente pela URL

---

## Fase 8 — Entidades de Suporte e Auditoria

### Backend

Endpoints completos para entidades auxiliares ainda sem CRUD:
- `GET/POST/PUT/DELETE /localizacoes`
- `GET/POST/DELETE /qualificacoes` e `/qualificacoes/usuario`
- `GET/POST/PUT/DELETE /unidades-organizacionais`
- `GET /auditoria` com filtros (tipo_entidade, acao, data_inicio, data_fim) + `GET /auditoria/export?format=csv`

### Frontend

Todos seguem o padrão flat de `purposes.tsx`:

| Rota | Arquivo | Campos |
|---|---|---|
| `/localizacoes` | `localizacoes.tsx` | campus, predio, andar |
| `/qualificacoes` | `qualificacoes.tsx` | nome, descrição + painel de atribuição a usuários com data de validade |
| `/organizacoes` | `organizacoes.tsx` | nome, tipo |
| `/auditoria` | `auditoria.tsx` | filtros; colunas: Data/Hora, Ação (Chip), Entidade, ID, Realizado Por, Antes/Depois (JSON com toggle); botão "Exportar CSV" |

### Verificação da Fase 8
- Localização criada em `/localizacoes` aparece no Select do form de ambiente
- Export de auditoria gera download de CSV com os filtros aplicados

---

## Fase 9 — Notificações

**Objetivo:** Implementar `NotificationService` para eventos críticos do sistema.

### Backend

Registrar eventos no `AuditLog` e saída padrão para: aprovação de reserva, rejeição, cancelamento, no-show, penalidade aplicada. Preparar interface para integração futura com e-mail/push (abstrair o canal de entrega desde o início).

### Frontend

Dashboard enriquecido — `frontend/app/routes/home.tsx`:
- 4 cards de estatísticas (2×2): Reservas Ativas, Próxima Reserva, Aprovações Pendentes (admin), Penalidades Ativas
- Tabela compacta "Reservas Recentes" (5 linhas) com link "Ver todas"
- Para admin: lista "Aprovações Recentes"
- Botões de ação rápida: "Nova Reserva", "Ver Calendário"
- `Promise.all()` para todos os fetches; falha parcial mostra `--` sem quebrar o dashboard

### Verificação da Fase 9
- Cards do dashboard carregam sem bloquear a renderização da página
- Log de auditoria registra aprovação com estado anterior e posterior

---

## Fase 10 — Testes

Prioridades:
1. Detecção de conflitos (sobreposição com e sem buffer)
2. Transições da máquina de estados (casos válidos e inválidos)
3. Validação de lead time por papel
4. Ciclo completo de vida da reserva (E2E): criação → aprovação → check-in → check-out → buffer → conclusão
5. Escalonamento de penalidades (3 no-shows → bloqueio)

---

## Dependências entre Fases

```
Fase 1 (enums + módulos + navegação)
    ↓
Fase 2 (reservas core) — depende dos enums e roteadores da Fase 1
    ↓
Fase 3 (aprovação) — depende do ciclo de vida da Fase 2
Fase 4 (operações) — depende dos endpoints de checkin/checkout da Fase 2
    ↓
Fase 5 (penalidades) — depende do no-show da Fase 4
Fase 6 (calendário + tipos avançados) — depende dos tipos da Fase 2
    ↓
Fase 7 (RBAC) — pode ser aplicada incrementalmente desde a Fase 2
Fase 8 (entidades de suporte + auditoria) — maioria independente
    ↓
Fase 9 (notificações + dashboard) — depende de todos os clientes de API existirem
    ↓
Fase 10 (testes) — executados continuamente, mas cobertura completa ao final
```

Fases 5, 6 e 8 podem ser desenvolvidas em paralelo por diferentes desenvolvedores após a Fase 4.
