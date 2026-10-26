# ADR 0004: Registro de Auditoria e Rastreabilidade

## Status
Aprovado

## Contexto
Operações com dados de pacientes, alterações de condutas médicas, movimentações de prazos de casos e mudanças de permissões de membros exigem transparência e trilha de auditoria completa. Nenhuma atividade exibida na interface pode ser simulada ou inventada.

## Decisão
1. **Entidade AuditLog:** Criar tabela dedicada `AuditLog` no banco com as colunas: `id`, `workspaceId`, `userId`, `action`, `entityType`, `entityId`, `detailsJson`, `createdAt`.
2. **Serviço Centralizado:** Toda mutação sensível (criação, edição, exclusão de Casos, Médicos, Cartões, Listas, Membros e Permissões) invoca o `auditService.log(...)` de forma síncrona ou em transação.
3. **Consulta na Interface:** A aba de "Auditoria / Histórico" do workspace lista estritamente registros reais do banco, ordenados de forma decrescente por data. Caso não haja logs, exibe estado vazio: *"Nenhuma atividade registrada neste workspace até o momento."*

## Consequências
- **Positivas:**
  - Conformidade com governança e responsabilidade operacional.
  - Histórico 100% verídico e auditável.
- **Negativas:**
  - Acréscimo marginal de I/O de escrita em cada transação de negócio.
