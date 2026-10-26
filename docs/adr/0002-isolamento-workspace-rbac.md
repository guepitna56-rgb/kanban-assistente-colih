# ADR 0002: Modelo de Isolamento Multi-tenant e RBAC

## Status
Aprovado

## Contexto
O sistema atenderá diferentes comissões hospitalares (Workspaces), e usuários podem pertencer a um ou mais workspaces com responsabilidades diferentes. A segurança não pode depender de apenas ocultar botões na interface do usuário; cada requisição deve ser auditada e autorizada no backend.

## Decisão
1. **Isolamento por Workspace:** Toda entidade de negócio (Hospital, Doctor, PatientCase, Board, Card, Attachment, AuditLog) possui uma chave estrangeira obrigatória `workspaceId`.
2. **Pertença Obrigatória:** Para acessar qualquer rota sob `/api/workspaces/:workspaceId/*`, o middleware `requireWorkspaceMember` valida a presença do usuário autenticado na tabela `WorkspaceMember`.
3. **Níveis de Acesso (RBAC):**
   - `OWNER`: Administrador supremo do workspace. Pode excluir o workspace e gerenciar papéis de membros.
   - `ADMIN`: Gestão operacional, convites e cadastros gerais.
   - `MEMBER`: Operação cotidiana (gestão de casos, cartões, comentários, contatos de médicos e hospitais).
   - `GUEST`: Leitura restrita dos dados autorizados, sem permissão de exclusão ou edição cadastral.
4. **Validação de Propriedade:** Alterar IDs na URL para acessar dados de outro workspace resulta imediatamente em `403 Forbidden` ou `404 Not Found`.

## Consequências
- **Positivas:**
  - Isolamento estrito de dados médicos e administrativos sensíveis.
  - Testabilidade simples através de testes de integração com múltiplos usuários em diferentes workspaces.
- **Negativas:**
  - Toda consulta no backend deve obrigatoriamente incluir `workspaceId` no filtro `where`.
