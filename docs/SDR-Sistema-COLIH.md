# SDR - Especificação de Design do Sistema (System Design Requirements)
## Sistema de Gestão COLIH (Comissão de Ligação com Hospitais)

**Versão:** 1.0.0  
**Data:** 02 de Outubro de 2026  
**Status:** Aprovado para Implementação  
**Domínio:** Gestão Integrada de Comissões de Ligação com Hospitais (COLIH)  

---

### 1. Visão Geral do Sistema e Objetivos

O Sistema de Gestão COLIH é uma plataforma web multi-inquilino (*multi-tenant* por Workspace) concebida para atender às necessidades reais de gestão, acompanhamento hospitalar, bioética e cooperação médica das Comissões de Ligação com Hospitais.

O sistema elimina planilhas isoladas, anotações descentralizadas e fluxos não auditáveis, provendo:
- Isolamento estrito por comissão local/regional (Workspaces);
- Controle de acesso granular baseado em papéis (*RBAC* no backend);
- Gestão de Casos/Acompanhamentos de pacientes com sigilo e consentimento;
- Cadastro e qualificação de Rede Médica e Instituições de Saúde (Hospitais);
- Gestão de Ações, Demandas e Projetos via Quadros Kanban com persistência completa;
- Auditoria de operações sensíveis para conformidade e segurança da informação;
- Sistema de notificações reais para membros do workspace;
- Armazenamento controlado de documentos e anexos médicos/jurídicos.

---

### 2. Arquitetura Geral do Sistema

O sistema é dividido em duas camadas principais desacompladas, com persistência relacional e armazenamento local auditado:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (SPA - React + Vite)                   │
│  - Páginas (Login, Registro, Workspaces, Dashboard, Casos, Kanban, etc) │
│  - Componentes Reutilizáveis (UI, Modais, Tabelas, Estados Vazios)      │
│  - Camada de Serviços (API Client tipado via Axios/Fetch)              │
│  - Gerenciamento de Estado (Context API + TanStack React Query)        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP / REST / JSON + JWT HttpOnly
┌────────────────────────────────────▼───────────────────────────────────┐
│                        BACKEND (Node.js + Express + TS)                │
│  - Middlewares: Auth (JWT), Workspace Context, RBAC Guardian           │
│  - Controladores e Rotas RESTful tipadas com Zod                       │
│  - Camada de Serviços / Casos de Uso (Regras de Negócio Puras)         │
│  - Auditoria Automática (Audit Service) e Notificações                 │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
┌───────────────────▼──────────────┐   ┌─────────────▼───────────────────┐
│   DATABASE (Prisma ORM + SQLite) │   │ STORAGE (Serviço de Anexos)     │
│   - Persistência Relacional real │   │ - Filesystem isolado /uploads   │
│   - Integridade Referencial/FKs  │   │ - Metadados no Banco de Dados   │
│   - Transações e Índices         │   │ - Validação MIME e Tamanho      │
└──────────────────────────────────┘   └─────────────────────────────────┘
```

---

### 3. Especificação das Camadas

#### 3.1. Frontend
- **Framework:** React 18+ com TypeScript e Vite.
- **Estilização:** Tailwind CSS responsivo (Mobile, Tablet, Desktop).
- **Ícones:** Lucide React.
- **Roteamento:** React Router DOM v6 com proteção de rotas privadas e resolução de workspace ativo.
- **Comunicação:** Axios com interceptors de renovação de sessão e tratamento unificado de erros (401, 403, 404, 422, 500).
- **Feedback & Estados:** Componentes explícitos para `LoadingState`, `EmptyState`, `ErrorState`, e feedback de sucesso (Toasts e alertas sem dados fictícios).

#### 3.2. Backend
- **Ambiente:** Node.js com TypeScript e Express.
- **Validação de Entrada:** Zod schemas aplicados em todos os endpoints (`body`, `params`, `query`).
- **Autenticação:** Tokens JWT assinados com expiração, armazenados em cookies seguros `HttpOnly`, `SameSite=Lax`.
- **Criptografia de Senhas:** `bcryptjs` com salt rounds = 12.
- **Segurança Adicional:** Helmet, CORS restritivo, Rate Limiting contra força bruta.
- **Tratamento de Exceções:** Middleware centralizado com respostas estruturadas `{ status: 'error', message, code, details }`.

#### 3.3. Banco de Dados e Persistência
- **Engine:** SQLite através do Prisma ORM (`prisma/colih.db`), garantindo portabilidade, persistência em arquivo real e integridade transacional com chaves estrangeiras ativadas (`PRAGMA foreign_keys = ON`).
- **Migrações:** Prisma Migrate rastreando o schema declarativo.

#### 3.4. Armazenamento de Arquivos
- **Local:** Diretório seguro `server/uploads/` não exposto publicamente como pasta estática desprotegida.
- **Acesso:** Endpoint autenticado `/api/workspaces/:workspaceId/attachments/:id/download` que valida pertença ao workspace e perfil de acesso antes do streaming do arquivo.
- **Validação:** Checagem rigorosa de tamanho máximo (15MB) e extensões/MIME autorizados (PDF, DOCX, PNG, JPG, WEBP).

---

### 4. Modelo de Dados e Entidades Principais

1. **User (Usuário)**
   - `id`: UUID (PK)
   - `name`: String
   - `email`: String (Unique)
   - `passwordHash`: String
   - `phone`: String?
   - `avatarUrl`: String?
   - `isActive`: Boolean (default true)
   - `createdAt`, `updatedAt`

2. **Workspace (Comissão / Regional COLIH)**
   - `id`: UUID (PK)
   - `name`: String (ex: "COLIH São Paulo - Zona Sul", "COLIH Belo Horizonte")
   - `description`: String?
   - `city`: String
   - `state`: String
   - `ownerId`: UUID (FK -> User)
   - `createdAt`, `updatedAt`

3. **WorkspaceMember (Membro do Workspace)**
   - `id`: UUID (PK)
   - `workspaceId`: UUID (FK -> Workspace)
   - `userId`: UUID (FK -> User)
   - `role`: Enum (`OWNER`, `ADMIN`, `MEMBER`, `GUEST`)
   - `title`: String? (ex: "Coordenador", "Secretário", "Membro de Plantão")
   - `joinedAt`: DateTime
   - *Constraint:* Unique(`workspaceId`, `userId`)

4. **Hospital (Instituição de Saúde)**
   - `id`: UUID (PK)
   - `workspaceId`: UUID (FK -> Workspace)
   - `name`: String
   - `legalName`: String?
   - `type`: Enum (`PUBLICO`, `PRIVADO`, `FILANTROPICO`, `UNIVERSITARIO`)
   - `address`, `city`, `state`, `zipCode`
   - `phone`, `emergencyPhone`, `email`
   - `notes`: Text?
   - `createdAt`, `updatedAt`

5. **Doctor (Médico / Profissional de Saúde Colaborador)**
   - `id`: UUID (PK)
   - `workspaceId`: UUID (FK -> Workspace)
   - `name`: String
   - `crm`: String (Registro de classe)
   - `crmState`: String
   - `specialty`: String (ex: "Cirurgia Cardíaca", "Hematologia", "Obstetrícia")
   - `phone`, `email`
   - `hospitalId`: UUID? (FK -> Hospital)
   - `cooperativeLevel`: Enum (`COOPERATIVO`, `CONSULTIVO`, `RESTRITO`, `EM_CONTATO`)
   - `acceptsBloodless`: Boolean (Aplica estratégias de conservação de sangue/PBM)
   - `notes`: Text?
   - `createdAt`, `updatedAt`

6. **PatientCase (Caso de Paciente / Acompanhamento Hospitalar)**
   - `id`: UUID (PK)
   - `workspaceId`: UUID (FK -> Workspace)
   - `code`: String (Código identificador interno seguro para preservação de sigilo)
   - `patientName`: String
   - `patientAge`: Int?
   - `status`: Enum (`URGENTE`, `ATIVO`, `AGUARDANDO_CIRURGIA`, `ESTAVEL`, `ENCERRADO`)
   - `hospitalId`: UUID? (FK -> Hospital)
   - `doctorId`: UUID? (FK -> Doctor)
   - `assignedMemberId`: UUID? (FK -> WorkspaceMember)
   - `diagnosis`: Text?
   - `treatmentPlan`: Text? (Estratégias de PBM / Manejo Clínico)
   - `admissionDate`: DateTime?
   - `dischargeDate`: DateTime?
   - `createdAt`, `updatedAt`

7. **Board (Quadro de Demandas / Ações)**
   - `id`: UUID (PK)
   - `workspaceId`: UUID (FK -> Workspace)
   - `title`: String
   - `description`: String?
   - `createdAt`, `updatedAt`

8. **BoardList (Coluna / Lista do Quadro)**
   - `id`: UUID (PK)
   - `boardId`: UUID (FK -> Board)
   - `title`: String
   - `position`: Int (Ordem no quadro)
   - `createdAt`, `updatedAt`

9. **Card (Cartão de Demanda / Ação)**
   - `id`: UUID (PK)
   - `listId`: UUID (FK -> BoardList)
   - `title`: String
   - `description`: Text?
   - `position`: Int (Ordem na lista)
   - `priority`: Enum (`BAIXA`, `MEDIA`, `ALTA`, `CRITICA`)
   - `dueDate`: DateTime?
   - `assignedMemberId`: UUID? (FK -> WorkspaceMember)
   - `patientCaseId`: UUID? (FK -> PatientCase)
   - `createdAt`, `updatedAt`

10. **CardComment (Comentário no Cartão)**
    - `id`: UUID (PK)
    - `cardId`: UUID (FK -> Card)
    - `authorId`: UUID (FK -> WorkspaceMember)
    - `content`: Text
    - `createdAt`, `updatedAt`

11. **Attachment (Arquivo / Anexo)**
    - `id`: UUID (PK)
    - `workspaceId`: UUID (FK -> Workspace)
    - `filename`: String (Nome gerado seguro em disco)
    - `originalName`: String (Nome original do envio)
    - `mimeType`: String
    - `sizeBytes`: Int
    - `uploadedById`: UUID (FK -> User)
    - `cardId`: UUID? (FK -> Card)
    - `patientCaseId`: UUID? (FK -> PatientCase)
    - `createdAt`

12. **AuditLog (Log de Auditoria e Rastreabilidade)**
    - `id`: UUID (PK)
    - `workspaceId`: UUID (FK -> Workspace)
    - `userId`: UUID (FK -> User)
    - `action`: String (ex: `CASE_CREATED`, `CASE_UPDATED`, `CARD_MOVED`, `MEMBER_PROMOTED`)
    - `entityType`: String (ex: `PatientCase`, `Doctor`, `Card`, `WorkspaceMember`)
    - `entityId`: String
    - `detailsJson`: Text? (Diferenças antes/depois ou metadados da ação)
    - `createdAt`: DateTime (default now)

13. **Notification (Notificação Interna)**
    - `id`: UUID (PK)
    - `workspaceId`: UUID (FK -> Workspace)
    - `recipientUserId`: UUID (FK -> User)
    - `title`: String
    - `message`: String
    - `isRead`: Boolean (default false)
    - `link`: String?
    - `createdAt`: DateTime (default now)

---

### 5. Matriz de Autorização (RBAC)

| Ação / Módulo | OWNER | ADMIN | MEMBER | GUEST |
|---|---|---|---|---|
| Excluir Workspace | SIM | NÃO | NÃO | NÃO |
| Gerenciar Configurações do Workspace | SIM | SIM | NÃO | NÃO |
| Alterar Papéis de Membros | SIM | NÃO | NÃO | NÃO |
| Convidar/Remover Membros | SIM | SIM | NÃO | NÃO |
| Criar/Editar/Excluir Casos e Pacientes | SIM | SIM | SIM | NÃO |
| Visualizar Casos e Pacientes | SIM | SIM | SIM | SIM (se atribuído) |
| Criar/Editar/Mover Cartões no Kanban | SIM | SIM | SIM | NÃO |
| Visualizar Quadros e Cartões | SIM | SIM | SIM | SIM |
| Comentar em Cartões | SIM | SIM | SIM | SIM |
| Cadastrar/Editar Médicos e Hospitais | SIM | SIM | SIM | NÃO |
| Fazer Upload de Anexos | SIM | SIM | SIM | NÃO |
| Excluir Anexos | SIM | SIM | Autor | NÃO |
| Visualizar Logs de Auditoria | SIM | SIM | NÃO | NÃO |

---

### 6. Isolamento e Multi-tenancy

Cada requisição direcionada a recursos de um Workspace carrega o identificador na URL (`/api/workspaces/:workspaceId/...`).
O middleware de autorização do backend executa os seguintes passos obrigatórios:
1. Valida o token JWT e extrai o `userId`.
2. Consulta na tabela `WorkspaceMember` se existe registro ativo para o par `(workspaceId, userId)`.
3. Rejeita imediatamente com `403 Forbidden` se o usuário não for membro.
4. Anexa o `memberRole` e o `workspaceId` validados ao objeto `req.context`.
5. Garante em todas as queries subsequentes que `WHERE workspaceId = req.context.workspaceId` seja aplicado estritamente.

---

### 7. Estratégia de Testes

- **Testes Unitários e de Integração Backend:** Teste de autenticação, hashing de senhas, validações Zod, transações de movimentação de cards e controle de acesso RBAC.
- **Testes de Isolamento Multi-tenant:** Teste de tentativa de acesso cruzado (Usuário A tentando ler dados do Workspace B).
- **Testes de Estados de UI:** Verificação explícita dos estados de Carregando (Loading), Vazio (Empty) e Erro (Error), garantindo ausência total de dados inventados.
