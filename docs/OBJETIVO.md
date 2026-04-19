# Descrição Detalhada do Sistema

## Sistema de Reserva de Salas e Laboratórios

O sistema de reserva de salas e laboratórios tem como objetivo gerenciar centralmente o uso de espaços físicos (salas de aula, auditórios, salas de reunião, laboratórios, estúdios, salas multiuso) e seus recursos associados (projetores, computadores, kits, mobiliário, ar-condicionado, chaves, insumos, softwares licenciados). Ele organiza o ciclo completo de disponibilidade, solicitação, aprovação, uso e encerramento das reservas, com rastreabilidade administrativa e regras para prevenir conflitos de agendamento e uso indevido.

Cada espaço é tratado como um ativo organizacional com atributos operacionais: localização (campus, prédio, andar), capacidade, acessibilidade, finalidade permitida, horário de funcionamento, regras de preparação e encerramento, necessidades de suporte (TI, audiovisual, técnico de laboratório), requisitos de segurança e — no caso de laboratórios — requisitos de qualificação do solicitante. O sistema também vincula os espaços a um conjunto de restrições e políticas, como bloqueios recorrentes (aulas fixas, manutenção), janelas mínimas de antecedência, tolerância a atraso, tempo de preparação e limpeza (buffer) e limites de reserva por pessoa/unidade.

A lógica de reserva deve suportar solicitações simples (uma sala por 2 horas) e cenários mais complexos, como reservas recorrentes (semanais), reservas encadeadas (sala + laboratório + auditório no mesmo dia), alocação preferencial por unidade e aprovação obrigatória para espaços controlados. Além de gerenciar o calendário, o sistema deve estabelecer um mecanismo de responsabilização pelo uso, registrando o solicitante, o responsável pelo evento/atividade, participantes esperados, recursos necessários, termos de responsabilidade aceitos e — quando aplicável — check-in/check-out e registros de incidentes (danos, atrasos, ocorrências).

# Regras de Negócio

## **1) Cadastro e Classificação de Ambientes e Recursos**

1.1. Todo ambiente deve ter identificador único, tipo, localização e capacidade.
1.2. Os ambientes devem ser classificados por criticidade, como comum, controlado ou restrito, o que impacta regras de aprovação, modificação e uso.
1.3. Os ambientes podem exigir atributos obrigatórios conforme o tipo, incluindo responsável técnico, regras de segurança e restrições operacionais.
1.4. Os recursos vinculados aos ambientes podem ser fixos ou móveis.
1.5. Recursos móveis ou compartilhados devem manter calendário independente de disponibilidade.
1.6. A logística de recursos deve ser considerada, incluindo tempo de transferência entre locais quando aplicável.

---

## **2) Disponibilidade, Calendário, Buffers e Conflitos**

2.1. As reservas não devem conflitar entre si, considerando buffers de preparação, limpeza e logística.
2.2. Buffers são bloqueios gerados pelo sistema e não podem ser modificados por usuários comuns.
2.3. Apenas perfis administrativos ou técnicos podem ajustar buffers após validação operacional.
2.4. Cancelamentos tardios em ambientes críticos não devem remover buffers de segurança obrigatórios.
2.5. Bloqueios administrativos têm prioridade sobre todas as reservas.
2.6. Uma reserva só é válida se ambiente, recursos necessários e suporte estiverem todos disponíveis simultaneamente.
2.7. Fechamentos institucionais invalidam reservas, salvo autorização explícita.

---

## **3) Estrutura de Reserva e Cenários Complexos**

3.1. O sistema deve suportar reservas simples, recorrentes e compostas.
3.2. Reservas compostas devem seguir estrutura pai-filho com um identificador mestre e múltiplas reservas filhas.
3.3. Dependências entre reservas devem ser aplicadas automaticamente.
3.4. O cancelamento de uma reserva pré-requisito deve acionar revisão das reservas dependentes.
3.5. Cancelamento parcial exige que o solicitante confirme a continuidade ou reagende os segmentos restantes.

---

## **4) Estados e Ciclo de Vida da Reserva**

4.1. As reservas devem seguir estados de ciclo de vida definidos.
4.2. Apenas reservas aprovadas bloqueiam o calendário, exceto quando houver pré-bloqueio temporário configurado.
4.3. Qualquer modificação significativa em reserva aprovada deve reverter seu status para pendente.
4.4. Ambientes controlados sempre exigem reaprovação manual após alterações.
4.5. Cancelamentos devem registrar motivo e responsável.
4.6. O sistema deve manter histórico completo de versões das reservas.

---

## **5) Regras de Solicitação, Antecedência e Modificações**

5.1. As reservas devem respeitar restrições de antecedência mínima e máxima.
5.2. Podem existir janelas de prioridade para unidades organizacionais específicas.
5.3. Solicitações fora do horário de funcionamento exigem autorização explícita.
5.4. Reservas de longa duração exigem justificativa e podem requerer aprovação adicional.
5.5. Toda modificação deve preservar o estado anterior para fins de auditoria.
5.6. Alterações em ambientes comuns sem conflitos podem ser aprovadas automaticamente.

---

## **6) Elegibilidade, Autorização e Responsabilização**

6.1. Ambientes controlados ou restritos exigem usuários qualificados.
6.2. Laboratórios podem exigir certificações, treinamentos ou vínculo com projeto.
6.3. Toda reserva deve incluir tanto um solicitante quanto um responsável.
6.4. Atividades de alto risco exigem aceite formal de responsabilidade e um supervisor técnico.

---

## **7) Recursos, Suporte e Capacidade Operacional**

7.1. Recursos móveis devem ter validação independente de disponibilidade.
7.2. Reservas que exigem suporte só são válidas se a equipe de suporte estiver disponível.
7.3. O sistema deve aplicar limites com base na equipe de suporte disponível.
7.4. Se o suporte estiver indisponível, a reserva deve permanecer pendente.
7.5. Recursos que exigem retirada física devem rastrear responsabilidade e prazos de devolução.

---

## **8) Capacidade, Finalidade e Conformidade**

8.1. O número de participantes não deve exceder a capacidade do ambiente.
8.2. A finalidade da reserva deve estar alinhada ao tipo de ambiente.
8.3. É proibida a transferência não autorizada da titularidade ou do uso da reserva.

---

## **9) Uso, Check-in, Sensores e Encerramento**

9.1. O status de em uso deve ser acionado pelo primeiro evento válido.
9.2. Eventos válidos incluem check-in digital, retirada de chave ou ativação de acesso eletrônico.
9.3. Integração com sensores pode marcar automaticamente uma reserva como no-show se nenhuma atividade for detectada dentro da tolerância.
9.4. Atraso na chegada pode resultar em status de no-show.
9.5. Prorrogações só são permitidas se não houver conflitos e as regras forem respeitadas.
9.6. O encerramento pode exigir checklist obrigatório.
9.7. Ausência de check-out deve acionar verificação operacional antes da liberação do ambiente.

---

## **10) Penalidades, Responsabilidade e Recorrência**

10.1. Penalidades operacionais se aplicam ao solicitante.
10.2. Penalidades de segurança e danos se aplicam ao responsável.
10.3. Violações recorrentes podem resultar em restrições temporárias para indivíduos ou unidades organizacionais.
10.4. Penalidades devem ser configuráveis e permitir recurso administrativo.
10.5. Ambientes críticos podem exigir cauções ou garantias adicionais.

---

## **11) Auditoria, Rastreabilidade e Governança**

11.1. Todas as ações administrativas relevantes devem ser auditáveis.
11.2. O sistema deve manter registros de antes e depois para todas as alterações.
11.3. Relatórios devem refletir dados operacionais e gerenciais consolidados.
11.4. O sistema deve suportar análise de utilização, demanda, incidentes e desempenho.
