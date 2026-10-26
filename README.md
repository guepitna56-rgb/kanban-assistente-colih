# Assistente COLIH - Quadro de Ações & Demandas (Kanban)

Módulo web operacional focado no fluxo de visitas médicas, protocolos HLC, gestão de facilitadores e projetos hospitalares das **Comissões de Ligação com Hospitais (COLIH)**.

Este sistema foi projetado para operar tanto de forma autônoma quanto integrado como micro-frontend em sistemas de gestão já existentes, eliminando barreiras de autenticação interna e disponibilizando imediatamente o fluxo de trabalho Kanban.

---

## 🎯 Principais Funcionalidades

- **Quadro de Ações & Demandas (Kanban Operacional):**
  - Colunas pré-estruturadas: *Agendamento & Triagem*, *Visitas Encaminhadas*, *HLC-31 & Protocolos*, *Envio de E-mail HLC-37*, *Facilitadores & Redes* e *Projetos Hospitalares*.
  - Drag & drop de cartões fluido e responsivo.
  - Criação rápida de visitas e demandas com associação de facilitadores, hospitais e médicos.
  - Etiquetas personalizadas com cores oficiais do sistema.
  - Gestão de prazos e checklists dinâmicos com barra de progresso.
  - Anexos de documentos e arquivos diretamente nos cartões.
- **Sincronização com Google Calendar:**
  - Conexão OAuth 2.0 com a API do Google Calendar.
  - Sincronização direta de visitas na agenda pessoal dos facilitadores no smartphone/dispositivo móvel.
- **Pronto para Integração:**
  - Sem barreiras de login ou restrições de permissões internas.
  - Suporta headers `x-user-id` e `x-user-email` do sistema hospedeiro.
- **Identidade Visual Assistente COLIH:**
  - Paleta com Azul Institucional (`#1F619E`), Fundo Claro (`#FAF9FD`), Bordas Suaves (`#DDE5EE`) e botões estilo pill arredondados.

---

## 🛠️ Tecnologias Utilizadas

### Backend (`server/`)
- **Runtime:** Node.js com TypeScript
- **Framework Web:** Express.js
- **ORM & Banco de Dados:** Prisma ORM com SQLite
- **Integração Externa:** Google APIs (`googleapis`) para Google Calendar OAuth 2.0
- **Upload Seguro:** Multer com armazenamento local

### Frontend (`client/`)
- **Framework:** React 18+ com Vite e TypeScript
- **Estilização:** Tailwind CSS (responsivo para Desktop e Mobile)
- **Ícones:** Lucide React
- **Navegação:** React Router DOM v6
- **Comunicação:** Axios

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js (v18+)
- npm

### 2. Configurar o Backend
```bash
cd server
npm install
cp .env.example .env
npm run prisma:push
npm run dev
```
O servidor backend estará disponível em `http://localhost:3001`.

### 3. Configurar o Frontend
```bash
cd client
npm install
npm run dev
```
Acesse no navegador: `http://localhost:5173`.

---

## 📦 Estrutura do Repositório

```
├── client/              # Aplicação Frontend em React + Vite + Tailwind
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis e layouts
│   │   ├── pages/boards # Quadro Kanban, modais de cartões, listas e etiquetas
│   │   ├── api/         # Configuração de chamadas HTTP
│   │   └── types/       # Definições TypeScript
├── server/              # API Backend em Express + Prisma
│   ├── src/
│   │   ├── modules/     # Módulos: boards, calendar, hospitals, doctors
│   │   └── middlewares/ # Autenticação e middlewares de integração
│   └── prisma/          # Esquema do banco de dados relacional
└── docs/                # Documentação técnica e ADRs
```
