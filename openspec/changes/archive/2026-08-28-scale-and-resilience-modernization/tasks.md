## 1. Infraestrutura e Docker de Produção

- [x] 1.1 Atualizar `docker-compose.yml` adicionando serviço `redis:7-alpine`, rede isolada `app-network`, volumes nomeados e healthchecks
- [x] 1.2 Criar multi-stage `backend/Dockerfile` otimizado com `uv`, non-root user (`appuser`) e healthcheck interno
- [x] 1.3 Criar multi-stage `frontend/Dockerfile` de produção com Nginx Alpine, compressão Gzip e roteamento SPA
- [x] 1.4 Criar `docker-compose.prod.yml` com limites de memória/CPU e configurações de restart policies

## 2. Backend: Concorrência, Cache e Resiliência

- [x] 2.1 Adicionar dependência `redis>=5.0` no `backend/pyproject.toml`
- [x] 2.2 Implementar cliente e pool do Redis com fallback gracioso em `backend/app/core/redis.py`
- [x] 2.3 Implementar utilitários de cache e distributed locking (`lock:env:{id}:{date}`) em `backend/app/core/cache.py`
- [x] 2.4 Ajustar configuração do pool de conexões SQLAlchemy (`pool_size`, `max_overflow`, `pool_pre_ping`) em `backend/app/core/config.py` e `backend/app/db/session.py`
- [x] 2.5 Criar migração Alembic para índices compostos temporais em `reservations` e `calendar_blocks` (`idx_res_env_dates_status`)
- [x] 2.6 Integrar lock transacional `SELECT ... FOR UPDATE` e lock distribuído Redis no método de criação de reservas em `backend/app/modules/reservations/service.py`
- [x] 2.7 Implementar cache de leitura com invalidação automática em `environments`, `resources` e `qualifications` services

## 3. Backend: Observabilidade, Rate Limiting e Healthchecks

- [x] 3.1 Implementar endpoint detalhado `GET /health` em `backend/app/main.py` com sondagem ativa de PostgreSQL, Redis e Scheduler
- [x] 3.2 Implementar middleware de logging estruturado em JSON com `request_id`, latência e código HTTP
- [x] 3.3 Implementar middleware de Rate Limiting distribuído no Redis para rotas de login e agendamento

## 4. Frontend: Otimização de Performance, Skeletons e Acessibilidade

- [x] 4.1 Configurar code-splitting e lazy loading para rotas pesadas em `frontend/app/routes.ts`
- [x] 4.2 Implementar componentes Skeleton para carregamento de listas e tabelas em `frontend/app/ui/`
- [x] 4.3 Otimizar tabelas com paginação e carregamento eficiente para auditoria e histórico de reservas
- [x] 4.4 Adicionar feedback visual e toasts resilientes para quedas temporárias de rede
- [x] 4.5 Auditar e aplicar conformidade de acessibilidade (labels ARIA, navegação por teclado, contraste WCAG)

## 5. Verificação e Testes

- [x] 5.1 Executar testes de concorrência simultânea para validação anti-double-booking
- [x] 5.2 Executar testes de degradação graciosa com Redis offline
- [x] 5.3 Validar lint e typecheck do backend (`ruff check`) e frontend (`npm run typecheck`, `npm run lint`)
- [x] 5.4 Validar build e subida limpa dos containers via `docker compose up --build`
