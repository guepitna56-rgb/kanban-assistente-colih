# ADR 0005: Armazenamento e Acesso Seguro de Anexos

## Status
Aprovado

## Contexto
O sistema precisa suportar upload de documentos, diretrizes e laudos médicos vinculados a casos e cartões, sem depender de URLs fictícias e sem deixar arquivos expostos publicamente na internet sem autenticação.

## Decisão
1. **Armazenamento Físico:** Arquivos são salvos em `server/uploads/` com nomes gerados por UUID para evitar colisão e ataques de *directory traversal*.
2. **Metadados no Banco de Dados:** A tabela `Attachment` armazena o nome original, MIME type, tamanho em bytes, usuário que fez upload, data e vínculo opcional a `patientCaseId` ou `cardId`.
3. **Download Protegido:** Nenhuma pasta estática de uploads é servida diretamente pelo Express sem autenticação. O download ocorre via rota autenticada que verifica se o solicitante pertence ao workspace correspondente.
4. **Validações:** Tamanho máximo de 15MB e bloqueio de executáveis (.exe, .sh, .bat).

## Consequências
- **Positivas:**
  - Sigilo dos arquivos anexados.
  - Vínculo real entre anexos e entidades do sistema.
