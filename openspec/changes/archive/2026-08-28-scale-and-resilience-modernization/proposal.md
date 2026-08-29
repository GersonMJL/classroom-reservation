# Proposta: Modernização Fullstack para Alta Escala, Resiliência e Produção

## Why
O sistema de reservas atual possui a modelagem e regras de negócio estruturadas, porém opera com configurações básicas de desenvolvimento, acoplamento síncrono de tarefas pesadas, ausência de camada de cache distribuído, risco de double-booking em concorrência extrema e infraestrutura Docker sem profiles de produção, limites de recursos ou observabilidade.

Para suportar múltiplos campi universitários com milhares de usuários simultâneos, picos de matrículas/início de semestre e alta disponibilidade 24/7, é imperativo modernizar a infraestrutura, implementar concorrência segura, cache distribuído com Redis, background workers desacoplados, observabilidade abrangente e otimizações de performance e UX no frontend.

## What Changes
- **Infraestrutura e Docker**:
  - Multi-stage Dockerfiles otimizados para Backend (`uv`, non-root user, dependências em camadas) e Frontend (Nginx alpine de produção + Vite build enxuto).
  - Configuração do Docker Compose com profiles (`dev`, `prod`), redes isoladas, volumes nomeados, limites de memória/CPU e healthchecks robustos.
  - Integração do **Redis** para caching, rate limiting e filas de background jobs.
- **Backend e Concorrência**:
  - Mecanismo de lock contra concorrência estrita (`SELECT ... FOR UPDATE` / lock distribuído) no núcleo de reservas para prevenir double-booking em picos simultâneos.
  - Otimização do pool de conexões do SQLAlchemy (`pool_size`, `max_overflow`, `pool_pre_ping`, `pool_recycle`).
  - Criação de índices de alta performance no PostgreSQL para queries de sobreposição temporal e status.
  - Caching inteligente de catálogo de ambientes, recursos e qualificações com invalidação por eventos.
  - Desacoplamento do scheduler e processamento assíncrono de no-show, penalidades e notificações.
  - Middleware de observabilidade: métricas Prometheus, logs estruturados em JSON e endpoint profundo de `/health`.
  - Rate limiting distribuído baseado em IP e Token JWT para proteção de endpoints críticos.
- **Frontend e UX**:
  - Code-splitting e lazy loading de rotas administrativas e pesadas.
  - Estados de carregamento refinados com Skeleton screens, feedback tátil padronizado e tratamento gracioso de falhas de rede.
  - Virtualização de listas e tabelas densas (auditoria, reservas, catálogo de recursos).
  - Conformidade de acessibilidade (WCAG 2.1 AA), navegação por teclado e semântica ARIA completa.

## Capabilities

### New Capabilities
- `system-observability-and-health`: Monitoramento centralizado de integridade (Postgres, Redis, Scheduler), métricas de performance e rate limiting.
- `distributed-caching-and-queues`: Camada de cache distribuído com Redis, locks de concorrência e processamento desacoplado em segundo plano.

### Modified Capabilities
- `reservations-lifecycle`: Adição de requisito estrito de proteção contra concorrência simultânea (double-booking) e transações atômicas de reserva.
- `conflict-and-approval`: Adição de requisito de consulta acelerada com índices temporais e cache de catálogo de disponibilidade.

## Impact
- **Arquitetura & Infraestrutura**: Novo container Redis no Docker Compose, scripts de inicialização de produção e variáveis de ambiente adicionais (`REDIS_URL`, `LOG_LEVEL`, `RATE_LIMIT_PER_MINUTE`).
- **Banco de Dados**: Nova migração Alembic para índices compostos em tabelas de reservas, bloqueios de calendário e recursos.
- **Backend APIs**: Novos endpoints `/health` detalhado e `/metrics`; inclusão de rate limiting automático em rotas `/api/v1/auth/login` e `/api/v1/reservas`.
- **Frontend**: Otimização do bundle Vite, melhoria de tempos de carregamento (LCP/INP) e resiliência de rede.
