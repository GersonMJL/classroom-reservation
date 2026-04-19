Esta etapa transforma o "o quê" (requisitos) no "como" (processo), garantindo que a lógica de buffers, conflitos e permissões seja respeitada.

## **UC01: Cadastrar e Gerenciar Ambientes**

**Objetivo:** Permitir que o Administrador registre, configure e mantenha os espaços físicos disponíveis para reserva no sistema.

* **Atores:** Administrador, Sistema.  
* **Pré-condição:** Administrador autenticado com permissões de gestão de ambientes (RNF02).  
* **Pós-condição:** Ambiente cadastrado/atualizado no sistema com ID único, criticidade definida e buffers configurados; disponível para consulta e reserva.

### **Fluxo Principal**

1. O Administrador acessa a funcionalidade de "Gestão de Ambientes".  
2. O **Sistema** exibe a lista de ambientes existentes.  
3. O Administrador seleciona a opção "Novo Ambiente".  
4. O Administrador informa: ID único, nome, tipo (sala, auditório, laboratório), localização, capacidade máxima.  
5. O Administrador define a **criticidade** do ambiente (Comum, Controlado ou Restrito).  
6. O Administrador configura os **buffers** de limpeza e setup: tempo antes e depois da reserva.  
7. O Administrador vincula recursos fixos ao ambiente (RF02).  
8. O **Sistema** valida se o ID único não existe (RF01).  
9. O **Sistema** persiste o ambiente e exibe confirmação.

### **Fluxos Alternativos**

* **A1: Edição de Ambiente:** No passo 2, o Administrador seleciona um ambiente existente. O sistema carrega os dados e permite alteração de capacidade, buffers ou criticidade.  
* **A2: Desativação Temporária:** No passo 2, o Administrador seleciona "Desativar" para manutenção. O **Sistema** bloqueia novas reservas para datas futuras, mantendo as existentes.

### **Fluxos de Exceção**

* **E1: ID Duplicado:** Se no passo 8 o ID já existir, o **Sistema** exibe erro e solicita novo identificador.  
* **E2: Reservas Existentes na Alteração:** Se no A1 o Administrador tentar reduzir capacidade abaixo de reservas já confirmadas, o **Sistema** alerta sobre conflitos.

---

## **UC02: Gerenciar Recursos e Disponibilidade**

**Objetivo:** Permitir o cadastro e controle de recursos móveis e fixos, garantindo rastreabilidade de disponibilidade independente dos ambientes.

* **Atores:** Administrador, Técnico de Suporte, Sistema.  
* **Pré-condição:** Administrador autenticado (para cadastro) ou Técnico autenticado (para disponibilidade); ambiente de referência cadastrado (se recurso fixo).  
* **Pós-condição:** Recurso cadastrado com calendário de disponibilidade; vinculado a ambiente (fixo) ou disponível para alocação móvel; log de alterações registrado (RF10).

### **Fluxo Principal (Cadastro de Recurso)**

1. O Administrador acessa "Gestão de Recursos".  
2. O **Sistema** exibe recursos existentes categorizados (TI, Audiovisual, Laboratório).  
3. O Administrador seleciona "Novo Recurso".  
4. O Administrador informa: ID único, nome, tipo, categoria.  
5. O Administrador define se o recurso é **fixo** (vinculado a ambiente) ou **móvel** (transportável).  
6. Se fixo: o Administrador seleciona o ambiente de instalação permanente.  
7. Se móvel: o Técnico de Suporte configura a escala de disponibilidade (dias/horários de operação).  
8. O **Sistema** valida conflitos de vinculação (RF08).  
9. O **Sistema** persiste o recurso e atualiza o calendário de disponibilidade.

### **Fluxos Alternativos**

* **A1: Atualização de Status de Manutenção:** O Técnico de Suporte acessa um recurso móvel e marca como "Em Manutenção" para período específico. O **Sistema** bloqueia reservas nesse intervalo.  
* **A2: Transferência de Recurso Móvel:** O Técnico altera a localização física de um recurso móvel. O **Sistema** atualiza o rastreamento para futuras reservas.

### **Fluxos de Exceção**

* **E1: Conflito de Vinculação Fixa:** Se no passo 6 o ambiente selecionado já possuir recurso do mesmo tipo com capacidade esgotada, o **Sistema** alerta sobre redundância.  
* **E2: Escala de Suporte Indisponível:** Se no passo 7 o Técnico tentar configurar escala em horário sem profissionais cadastrados, o **Sistema** exibe indisponibilidade de suporte.

---

## **UC03: Solicitar Reserva de Ambiente/Recurso**

**Objetivo:** Permitir que o Solicitante reserve um espaço e recursos necessários para uma atividade.

* **Atores:** Solicitante, Sistema.  
* **Pré-condição:** Usuário autenticado; ambiente e recursos previamente cadastrados e ativos (RF01, RF02).  
* **Pós-condição:** Reserva criada com status "Pendente" ou "Aprovada"; calendário bloqueado; buffers gerados.

### **Fluxo Principal**

1. O Solicitante informa a data, horário, localidade e o tipo de ambiente desejado.  
2. O **Sistema** consulta a disponibilidade (RF03) considerando os **buffers** de limpeza e setup.  
3. O Solicitante seleciona um ambiente disponível na lista.  
4. O Solicitante seleciona os recursos (fixos ou móveis) desejados.  
5. O Solicitante informa o **Responsável** pela reserva e a finalidade.  
6. O Solicitante aceita os termos de responsabilidade e confirma a solicitação.  
7. O **Sistema** valida se há conflitos de horário ou de suporte técnico.  
8. O **Sistema** registra a reserva e encaminha para o **UC02 (Processar Aprovação)**.

### **Fluxos Alternativos e de Exceção**

* **A1: Reserva Recorrente:** No passo 1, o usuário opta por recorrência. O sistema valida a disponibilidade de todos os slots da série.  
* **E1: Conflito de Disponibilidade:** Se no passo 7 houver conflito, o sistema impede a reserva e sugere horários alternativos.  
* **E2: Violação de Lead Time:** Se a data solicitada estiver fora da janela mínima/máxima permitida, o sistema exibe mensagem de erro.

---

## **UC04: Processar Aprovação de Reserva**

**Objetivo:** Determinar se a reserva pode ser efetivada automaticamente ou se exige intervenção humana.

* **Atores:** Sistema, Administrador.  
* **Pré-condição:** Solicitação de reserva realizada (UC01).  
* **Pós-condição:** Status da reserva atualizado para "Confirmada" ou "Rejeitada".

### **Fluxo Principal**

1. O **Sistema** analisa a criticidade do ambiente solicitado.  
2. Se o ambiente for **Comum** e não houver conflitos técnicos, o **Sistema** aprova automaticamente.  
3. Se o ambiente for **Controlado/Restrito**, o **Sistema** notifica o Administrador e altera o status para "Em Análise".  
4. O Administrador revisa a solicitação e as qualificações do Solicitante.  
5. O Administrador aprova a solicitação.  
6. O **Sistema** dispara notificação de confirmação para o Solicitante.

### **Fluxos Alternativos e de Exceção**

* **A1: Reprovação Manual:** No passo 5, o Administrador rejeita a reserva informando o motivo.  
* **E1: Suporte Indisponível:** Se a reserva exige técnico e não há escala disponível, o sistema mantém a reserva como "Pendente de Suporte" e notifica o Técnico.

---

## **UC05: Realizar Check-in e Gerenciar No-Show**

**Objetivo:** Registrar o início efetivo do uso do espaço e gerenciar a ociosidade.

* **Atores:** Solicitante, Sistema (Automático).  
* **Pré-condição:** Reserva aprovada e dentro do horário previsto.  
* **Pós-condição:** Reserva alterada para "Em Uso" ou cancelada por "No-Show".

### **Fluxo Principal**

1. O Solicitante realiza o check-in (via aplicativo ou chave) dentro da janela de tolerância.  
2. O **Sistema** altera o status da reserva para "Em Uso".  
3. O **Sistema** registra o timestamp para fins de auditoria (RNF03).

### **Fluxos de Exceção**

* **E1: No-Show Automático:** Se o check-in não ocorrer até X minutos após o início previsto, o **Sistema** cancela a reserva automaticamente, libera o ambiente e aplica penalidade ao Solicitante.

---

## **UC06: Gerenciar Buffers de Limpeza/Setup**

**Objetivo:** Garantir que o intervalo operacional entre reservas seja respeitado.

* **Atores:** Sistema, Técnico de Suporte.  
* **Pré-condição:** Reserva finalizada ou cancelada.  
* **Pós-condição:** Espaço liberado para a próxima reserva após o tempo de buffer.

### **Fluxo Principal**

1. Ao término do horário da reserva (ou após o check-out), o **Sistema** ativa o buffer de limpeza/setup definido no cadastro do ambiente.  
2. O **Sistema** bloqueia novas reservas para este intervalo.  
3. Após o término do tempo de buffer, o **Sistema** altera o status do ambiente para "Livre".

### **Fluxos Alternativos**

* **A1: Liberação Antecipada:** Um Técnico de Suporte informa ao sistema que a limpeza foi concluída antes do previsto. O **Sistema** reduz o buffer e antecipa a disponibilidade do ambiente.

---

## **UC07: Realizar Reserva Composta (Mestra e Filhas)**

**Objetivo:** Permitir a criação de um evento que dependa de múltiplos espaços ou recursos encadeados, mantendo a integridade do conjunto.

* **Atores:** Solicitante, Sistema.  
* **Pré-condição:** Ambientes e recursos disponíveis para todos os slots solicitados; Solicitante habilitado para os tipos de ambiente escolhidos.  
* **Pós-condição:** Criada uma Reserva Mestra (Parent) com múltiplas Reservas Filhas (Children) vinculadas; Calendário bloqueado para todo o conjunto.

### **Fluxo Principal**

1. O Solicitante inicia o processo de "Reserva Composta".  
2. O Solicitante adiciona o primeiro item (ex: Auditório das 14h às 16h).  
3. O Solicitante adiciona itens subsequentes ou dependentes (ex: Sala de Apoio das 13h às 17h para o staff).  
4. O **Sistema** gera um **Identificador Mestre** único para o grupo.  
5. O **Sistema** valida a disponibilidade de todos os itens simultaneamente, incluindo buffers individuais.  
6. O Solicitante confirma a reserva do conjunto.  
7. O **Sistema** regista as dependências: se uma reserva filha for um pré-requisito (ex: sala de preparação antes do laboratório), esta é marcada como "Crítica".

### **Fluxos Alternativos e de Exceção**

* **A1: Cancelamento Parcial:** O Solicitante cancela apenas uma das salas do grupo. O **Sistema** solicita confirmação se o restante do evento ainda é viável ou se requer re-agendamento.  
* **E1: Quebra de Dependência:** Se uma reserva de pré-requisito for cancelada pelo Administrador (ex: manutenção de emergência), o **Sistema** automaticamente coloca as reservas "filhas" em status de "Revisão Obrigatória" e notifica o Solicitante.  
* **E2: Conflito em Item Único:** Se um dos 5 ambientes de uma reserva composta estiver ocupado, o **Sistema** impede a finalização de todo o conjunto para evitar reservas incompletas.

---

## **UC08: Gerir Penalidades e Restrições**

**Objetivo:** Aplicar sanções automáticas ou manuais por uso indevido do sistema, garantindo a disciplina operacional.

* **Atores:** Sistema (Automático), Administrador, Solicitante (Notificado).  
* **Pré-condição:** Ocorrência de um evento gatilho (No-show, atraso no check-out, danos relatados).  
* **Pós-condição:** Penalidade registada no perfil do usuário; Restrição de novas reservas aplicada se atingido o limite.

### **Fluxo Principal (Gatilho Automático)**

1. O **Sistema** deteta um "No-Show" (conforme UC03) ou falta de check-out.  
2. O **Sistema** consulta a tabela de penalidades configurada.  
3. O **Sistema** aplica a penalidade operacional ao **Solicitante** (ex: perda de pontos ou suspensão por 7 dias).  
4. O **Sistema** envia uma notificação automática ao usuário informando a infração e a sanção aplicada.  
5. O Perfil do Usuário é atualizado com a flag de "Restrição Ativa".

### **Fluxos Alternativos e de Exceção**

* **A1: Penalidade por Danos Físicos:** O Administrador, após vistoria, regista manualmente um incidente de danos no ambiente. O **Sistema** aplica a penalidade diretamente ao **Responsável Técnico** indicado na reserva.  
* **A2: Recurso Administrativo:** O Solicitante submete uma justificativa para o atraso/no-show. O Administrador analisa e, se aprovado, o **Sistema** remove a penalidade e limpa o histórico de infrações recentes.  
* **E1: Bloqueio por Recorrência:** Se o usuário atingir 3 no-shows no mês, o **Sistema** bloqueia automaticamente qualquer nova solicitação por 30 dias, independentemente do tipo de ambiente.

---

## **UC09: Consultar Histórico e Auditoria**

**Objetivo:** Permitir rastreamento completo de ações no sistema, garantindo transparência e conformidade com requisitos não-funcionais de rastreabilidade.

* **Atores:** Administrador, Sistema.  
* **Pré-condição:** Administrador autenticado com permissão de auditoria (RNF02); existência de logs de operações no sistema.  
* **Pós-condição:** Relatório de auditoria gerado ou visualização de histórico específico exibida; dados de timestamp e identificador de usuário apresentados (RNF03).

### **Fluxo Principal**

1. O Administrador acessa "Auditoria e Logs".  
2. O **Sistema** apresenta filtros: tipo de entidade (reserva, ambiente, recurso, usuário), período, tipo de ação (criação, modificação, cancelamento).  
3. O Administrador seleciona os filtros desejados.  
4. O **Sistema** consulta o banco de logs (RF10).  
5. O **Sistema** exibe lista cronológica: timestamp, identificador do usuário, ação executada, valores anteriores/novos (para modificações).  
6. O Administrador seleciona um registro específico.  
7. O **Sistema** exibe detalhes completos da versão/alteração.

### **Fluxos Alternativos**

* **A1: Exportação de Relatório:** No passo 5, o Administrador seleciona "Exportar". O **Sistema** gera arquivo (PDF/CSV) com os logs filtrados para arquivo externo.  
* **A2: Comparação de Versões:** No passo 6, o Administrador solicita "Comparar Versões". O **Sistema** exibe diff visual entre duas versões de uma mesma reserva.

### **Fluxos de Exceção**

* **E1: Período Excessivo:** Se no passo 3 o Administrador solicitar auditoria superior a 12 meses, o **Sistema** alerta sobre performance (RNF05) e sugere arquivamento.  
* **E2: Log Corrompido/Inacessível:** Se no passo 4 algum registro estiver comprometido, o **Sistema** marca entrada como "Indisponível" e notifica equipe técnica.

