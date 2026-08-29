# Observabilidade e Saúde do Sistema

## Purpose
Prover monitoramento abrangente de saúde do sistema, métricas de performance e rate limiting distribuído para operação resiliente em produção e alta escala.

## Requirements

### Requirement: Health Checks Profundos de Infraestrutura
O sistema SHALL expor um endpoint `/health` que verifica ativamente a conectividade e o tempo de resposta do PostgreSQL, do Redis e dos serviços essenciais, retornando status `healthy`, `degraded` ou `unhealthy`.

#### Scenario: Todos os componentes operacionais
- **GIVEN** o banco de dados PostgreSQL e o Redis em funcionamento normal
- **WHEN** uma sonda de orquestração ou monitoramento envia uma requisição `GET /health`
- **THEN** o sistema responde HTTP 200 com JSON contendo o status detalhado e latência de cada dependência (db, redis, background scheduler)

#### Scenario: Falha de conexão com banco de dados
- **GIVEN** uma falha de rede ou queda da instância de banco de dados
- **WHEN** o endpoint `/health` é consultado
- **THEN** o sistema responde HTTP 503 (Service Unavailable) com detalhes do componente em falha

### Requirement: Rate Limiting Distribuído
O sistema SHALL limitar o número de requisições por IP e por usuário autenticado (JWT) em endpoints críticos (como login e criação de reservas) utilizando Redis como backend compartilhado de contadores.

#### Scenario: Limite de requisições excedido
- **GIVEN** um cliente que ultrapassou a cota configurada de requisições
- **WHEN** envia uma nova requisição na mesma janela temporal
- **THEN** o sistema bloqueia temporariamente a requisição respondendo HTTP 429 (Too Many Requests) com cabeçalho `Retry-After`
