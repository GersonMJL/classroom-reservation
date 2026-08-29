# Design Técnico: Modernização Fullstack para Alta Escala e Resiliência

## Context
O sistema opera atualmente com backend FastAPI síncrono conectado diretamente ao PostgreSQL, sem cache intermediário e sem locks explícitos contra concorrência simultânea. A infraestrutura Docker atual é básica para desenvolvimento local. Ver `proposal.md` para motivação e escopo.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      TOPOLOGIA DE PRODUÇÃO EM ALTA ESCALA                     │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   [ Client Browser ]                                                          │
│           │                                                                   │
│           ▼                                                                   │
│   [ Nginx Reverse Proxy / Frontend Container (Port 80/443) ]                  │
│           │                                                                   │
│           ├───────────────────────────────┐                                   │
│           ▼ (Static SPA Assets)           ▼ (/api/v1/...)                     │
│     [ Vite Build Dist ]        [ FastAPI App Instances (uvicorn workers) ]    │
│                                           │               │                   │
│                                ┌──────────┴──────┐ ┌──────┴──────────┐        │
│                                ▼                 ▼ ▼                 ▼        │
│                        [ Redis 7-Alpine ]    [ PostgreSQL 16 Cluster ]       │
│                        - Distributed Locks   - Connection Pool (tuned)       │
│                        - Catalog Cache       - Composite Temporal Indices     │
│                        - Rate Limit Counters - Relational Consistency         │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- **Infraestrutura**: Multi-stage Dockerfiles seguros (non-root, cache de camadas com `uv` e `npm`), Docker Compose com profiles (`dev`, `prod`), limites de recursos (CPU/Memory) e healthchecks.
- **Cache & Concorrência**: Integração com Redis para caching de catálogos estáticos, rate limiting distribuído e locks transacionais (`SELECT ... FOR UPDATE`) no agendamento para prevenir double-booking.
- **Banco de Dados**: Otimização do pool de conexões do SQLAlchemy e índices compostos em `(environment_id, start_time, end_time, status)`.
- **Observabilidade**: Endpoint `/health` detalhado, logs estruturados em JSON e métricas de sistema.
- **Frontend & UX**: Code-splitting com lazy loading, virtualização de tabelas longas, skeletons de carregamento e conformidade de acessibilidade WCAG 2.1 AA.

**Non-Goals:**
- Reescrever a lógica de negócios ou alterar enums canônicos existentes.
- Migrar para Kubernetes (manter Docker Compose e imagens prontas para qualquer orquestrador OCI).
- Substituir o banco relacional PostgreSQL.

## Decisions

### Decisão 1: Redis para Cache Distribuído, Locks e Rate Limiting
- **Escolha**: Utilizar Redis 7 Alpine como camada de memória para caching de leitura (ambientes, recursos), contadores de rate limiting por IP/token e locks distribuídos para operações atômicas.
- **Alternativas consideradas**:
  - *Cache em memória local (Python dict/lru_cache)*: Não escala horizontalmente para múltiplas réplicas do container backend.
  - *Memcached*: Falta suporte nativo a estruturas de dados ricas e expiração avançada necessárias para rate limiting e locks.

### Decisão 2: Prevenção de Concorrência e Double-Booking
- **Escolha**: Combinar transação atômica do banco com bloqueio pessimista no momento da alocação de horário (`SELECT ... FOR UPDATE` nas reservas sobrepostas) e lock distribuído em chave composta `lock:env:{env_id}:{date}` no Redis.
- **Alternativas consideradas**:
  - *Optimistic Locking puro*: Sob altíssima concorrência no início de semestre, resultaria em muitas exceções de retry desnecessárias para o usuário.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                      FLUXO DE ALOCAÇÃO CONCORRENTE SEGURA                     │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Requisição de Reserva                                                        │
│           │                                                                   │
│           ▼                                                                   │
│  1. Adquire Lock Distribuído Redis: `lock:env:{id}:{date}` (TTL 5s)           │
│           │                                                                   │
│           ▼                                                                   │
│  2. Inicia Transação DB (BEGIN)                                               │
│           │                                                                   │
│           ▼                                                                   │
│  3. Executa ConflictChecker com `SELECT ... FOR UPDATE`                       │
│           │                                                                   │
│     [ Conflito? ] ─── SIM ───▶ Rollback DB + Libera Lock ──▶ Retorna HTTP 409 │
│           │                                                                   │
│          NÃO                                                                  │
│           ▼                                                                   │
│  4. Insere Reserva + Gera Buffers + Cria Snapshot                             │
│           │                                                                   │
│           ▼                                                                   │
│  5. Commit DB + Libera Lock Redis                                             │
│           │                                                                   │
│           ▼                                                                   │
│  6. Invalida Cache de Disponibilidade + Retorna HTTP 201                      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Decisão 3: Multi-Stage Dockerfiles & Produção Otimizada
- **Backend**:
  - Stage 1 (Builder): Instala `uv`, compila dependências em virtualenv `/app/.venv`.
  - Stage 2 (Runner): Imagem base Python 3.14-slim, copia `.venv`, cria usuário `appuser` sem privilégios root, define `HEALTHCHECK` via curl/python.
- **Frontend**:
  - Stage 1 (Builder): Node.js 22 alpine, executa `npm ci` e `npm run build`.
  - Stage 2 (Runner): Nginx alpine servindo arquivos estáticos com compressão Gzip/Brotli, cache de assets imutáveis e roteamento SPA.

### Decisão 4: Observabilidade com Logs Estruturados e Healthchecks
- **Escolha**: Middleware de logging que gera payloads JSON contendo `request_id`, `method`, `path`, `status_code`, `latency_ms` e `user_id`. Endpoint `/health` executando `SELECT 1` no banco e `PING` no Redis com timeouts estritos de 2 segundos.

### Decisão 5: Performance e UX no Frontend
- **Escolha**: Implementar code-splitting automático via `React.lazy` / React Router 7 nas rotas de administração, auditoria e penalidades. Utilizar componentes Skeleton e feedback tátil padronizado em botões e diálogos.

## Risks / Trade-offs

- **[Risco: Queda temporária do Redis]** → **Mitigação**: O cliente de cache deve conter fallback de degradabilidade graciosa — se o Redis falhar, o serviço registra warning no log e consulta diretamente o PostgreSQL sem interromper a aplicação.
- **[Risco: Deadlock em reservas compostas multi-ambiente]** → **Mitigação**: Ordenar sempre os IDs dos ambientes de forma crescente antes de solicitar locks ou queries de bloqueio.
- **[Risco: Invalidação incorreta de cache]** → **Mitigação**: Padrão de invalidação explícito no `service.py` após qualquer operação de escrita (CRUD).

## Migration Plan

1. **Infraestrutura**: Atualizar `docker-compose.yml` com o serviço `redis:7-alpine`, rede `app-network`, volumes e healthchecks.
2. **Dependências Backend**: Adicionar `redis>=5.0` no `pyproject.toml` e configurar pool de conexões e cache layer.
3. **Migrações**: Gerar migração Alembic para índices compostos em `reservations` e `calendar_blocks`.
4. **Backend Modules**: Implementar middleware de rate limit, lock distribuído no `service.py` de reservas e endpoint `/health`.
5. **Frontend**: Otimizar builds, adicionar skeletons e lazy loading nas rotas.
