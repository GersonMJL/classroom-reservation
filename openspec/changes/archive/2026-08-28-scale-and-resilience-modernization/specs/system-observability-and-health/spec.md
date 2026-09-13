## Purpose
Prover monitoramento abrangente de saúde do sistema, métricas de performance e rate limiting distribuído para operação resiliente em produção e alta escala.

## ADDED Requirements

### Requirement: Health Checks Profundos de Infraestrutura
O sistema SHALL expor um endpoint `/health` que verifica ativamente a conectividade e o tempo de resposta do PostgreSQL, do Redis e dos serviços essenciais, retornando status `healthy`, `degraded` ou `unhealthy`.

#### Scenario: Todos os componentes operacionais
- **WHEN** uma sonda de orquestração ou monitoramento envia uma requisição `GET /health`
- **THEN** o sistema responde HTTP 200 com JSON contendo o status detalhado e latência de cada dependência (db, redis, background scheduler)

#### Scenario: Falha de conexão com banco de dados
- **WHEN** o banco de dados PostgreSQL estiver indisponível ou inacessível
- **THEN** o endpoint `/health` responde HTTP 503 (Service Unavailable) com detalhes do componente em falha

### Requirement: Rate Limiting Distribuído
O sistema SHALL limitar o número de requisições por IP e por usuário autenticado (JWT) em endpoints críticos (como login e criação de reservas) utilizando Redis como backend compartilhado de contadores.

#### Scenario: Limite de requisições excedido
- **WHEN** um cliente excede o número máximo de requisições permitidas na janela de 1 minuto
- **THEN** o sistema bloqueia temporariamente a requisição respondendo HTTP 429 (Too Many Requests) com cabeçalho `Retry-After`
