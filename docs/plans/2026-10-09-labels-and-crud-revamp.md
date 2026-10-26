# Implementação: Sistema de Etiquetas (Labels Trello) e Revamp dos CRUDs

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema completo de etiquetas coloridas (estilo Trello) no Kanban e nos cards, além de reformular completamente os CRUDs de Médicos, Hospitais e Membros eliminando padrões genéricos de "AI Slop" em favor de uma experiência médica e bioética de alto nível.

**Architecture:** 
- Backend: Endpoints REST para criação, exclusão e associação de `BoardLabel` a quadros e cartões no Prisma, integrados nas consultas de `BoardService`.
- Frontend Kanban: Card preview exibindo barras/pílulas de cor vibrante com contraste adequado; CardModal com popover de seleção de etiquetas e criador de novas etiquetas com paleta de 10 cores estilo Trello.
- Frontend CRUDs: Reformulação com seções estruturadas, cartões seletivos para níveis cooperativos, atalhos de 1-clique para criação de visitas no Kanban a partir de médicos/hospitais, máscaras e filtros rápidos.

**Tech Stack:** React 18, TypeScript, Tailwind CSS (Neumorphism Design System), Express, Prisma, SQLite, Vitest.

---

### Task 1: Backend - Endpoints e Serviços de Etiquetas (Labels)

**Files:**
- Modify: `server/src/modules/boards/board.schemas.ts`
- Modify: `server/src/modules/boards/board.service.ts`
- Modify: `server/src/modules/boards/board.controller.ts`
- Modify: `server/src/modules/boards/board.routes.ts`
- Create: `server/tests/labels.test.ts`

**Steps:**
- [x] Adicionar schemas de validação para `createLabelSchema` (`title?: string`, `color: string`) em `board.schemas.ts`.
- [x] Implementar métodos em `BoardService`:
  - `createBoardLabel(workspaceId, boardId, userId, data)`
  - `deleteBoardLabel(workspaceId, labelId, userId)`
  - `attachLabelToCard(workspaceId, cardId, labelId, userId)`
  - `detachLabelFromCard(workspaceId, cardId, labelId, userId)`
  - Atualizar `getBoardById` para incluir `labels: true` no `board` e `labels: true` nos `cards`.
  - Atualizar `getCardById` para incluir `labels: true`.
- [x] Adicionar métodos correspondentes em `BoardController`.
- [x] Registrar rotas em `board.routes.ts`:
  - `POST /:boardId/labels`
  - `DELETE /labels/:labelId`
  - `POST /cards/:cardId/labels/:labelId`
  - `DELETE /cards/:cardId/labels/:labelId`
- [x] Criar teste automatizado em `server/tests/labels.test.ts` e verificar com `npm test`.

---

### Task 2: Frontend - Tipagem e Visualização de Cores no Kanban

**Files:**
- Modify: `client/src/types/index.ts`
- Modify: `client/src/pages/boards/BoardKanbanPage.tsx`

**Steps:**
- [x] Atualizar tipagem `BoardLabel` e incluir `labels?: BoardLabel[]` em `Board` e `Card` no `client/src/types/index.ts`.
- [x] Atualizar o componente de exibição do card no `BoardKanbanPage.tsx` para renderizar pílulas/barras coloridas com a cor de cada etiqueta no topo do cartão, no estilo Trello.
- [x] Passar as etiquetas do quadro (`board.labels`) para o `CardModal`.
- [x] Atualizar o estado local quando etiquetas forem alteradas para refletir em tempo real no Kanban.

---

### Task 3: Frontend - Popover de Etiquetas no Modal do Cartão (CardModal)

**Files:**
- Modify: `client/src/pages/boards/CardModal.tsx`

**Steps:**
- [x] Criar o popover/dropdown de Etiquetas acionado pelo botão "Etiquetas" da barra lateral e pelo clique na seção de etiquetas.
- [x] Listar as etiquetas existentes no quadro com checkbox para vincular/desvincular do cartão via API.
- [x] Implementar o formulário inline de "Criar nova etiqueta":
  - Campo de título da etiqueta (opcional ou descritivo, ex: "PBM", "Alta Prioridade").
  - Paleta com 10 cores sólidas e vibrantes estilo Trello (Esmeralda, Azul, Âmbar, Vermelho, Violeta, Rosa, Laranja, Ciano, etc.).
  - Botão de salvar que persiste no backend e já associa ao cartão.
- [x] Renderizar as etiquetas ativas na seção superior do cartão com suas respectivas cores, contraste legível e opção de desvincular.

---

### Task 4: Frontend - Revamp do CRUD de Médicos (Zero AI Slop)

**Files:**
- Modify: `client/src/pages/doctors/DoctorsPage.tsx`

**Steps:**
- [x] Estruturar o modal de cadastro/edição em 3 seções temáticas:
  1. *Identificação*: Nome completo, CRM e UF (select com os 27 estados do Brasil).
  2. *Vínculo & Contatos*: Especialidade médica com chips rápidos de sugestão, Hospital de vínculo, WhatsApp/Telefone e E-mail.
  3. *Posicionamento Clínico & Bioética*: Cartões selecionáveis com descrição clara para cada **Nível Cooperativo** (Cooperativo, Consultivo, Restrito, Em Contato), toggle tátil para aceitação de PBM (cirurgias sem sangue) e observações clínicas.
- [x] Reformular os cartões de médicos na listagem:
  - Header com nome, especialidade e badge de nível cooperativo com cores semânticas.
  - Vínculo hospitalar com ícone e CRM com badge de UF.
  - Ação rápida de 1-clique: "Agendar Visita" (abre o modal de criar cartão no Kanban já pré-selecionando o médico).
  - Botão de copiar CRM e link direto para WhatsApp.
- [x] Adicionar barra de filtros rápidos: busca inteligente, filtro por hospital, especialidade e por nível de cooperação.

---

### Task 5: Frontend - Revamp do CRUD de Hospitais e Membros

**Files:**
- Modify: `client/src/pages/hospitals/HospitalsPage.tsx`
- Modify: `client/src/pages/members/MembersPage.tsx`

**Steps:**
- [x] Reformular `HospitalsPage.tsx`:
  - Modal com seleção tátil do tipo de hospital (Público/SUS, Privado, Filantrópico, Universitário) com ícones e descrições.
  - Campo com destaque neumórfico exclusivo para Telefone de Plantão / Emergência.
  - Cards com telefone de plantão em destaque, cópia com 1 clique, contagem de médicos associados e endereço formatado.
- [x] Refinar `MembersPage.tsx` com visual de equipe médica/comissão COLIH, descrição clara das funções e botões de ação direta.

---

### Task 6: Validação Integrada, Build e Testes Finais

**Files:**
- Run test suites e verificar compilador.

**Steps:**
- [x] Executar `npm test` no `server` e garantir que todos os 20 testes passem.
- [x] Executar `npm run build` no `client` e garantir 0 erros de compilação.
- [x] Validar fluxo de ponta a ponta em tempo real.
