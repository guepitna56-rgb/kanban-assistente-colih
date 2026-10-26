# ADR 0001: Escolha da Stack Tecnológica (Node.js + Express + Prisma + React + Vite)

## Status
Aprovado

## Contexto
O sistema precisa ser uma aplicação real, persistente, multiusuário, sem dados fictícios ou simulações em memória/localStorage. O ambiente de execução é Windows com Node.js v24. O sistema necessita de separação explícita entre Frontend, Backend, Banco de Dados e Armazenamento, mantendo o código modular e com tipagem estrita de ponta a ponta.

## Decisão
Adotar:
1. **Backend:** Node.js com Express e TypeScript. Arquitetura em camadas (Controladores, Serviços de Domínio, Repositórios Prisma, Middlewares de Segurança). Validação de esquemas com Zod.
2. **Banco de Dados:** Prisma ORM com SQLite (`prisma/colih.db`). SQLite provê persistência atômica, isolada por arquivo no sistema de arquivos local, com suporte a chaves estrangeiras, migrações determinísticas e sem necessidade de infraestrutura pesada ou credenciais externas voláteis.
3. **Frontend:** React 18+ com Vite e TypeScript, Tailwind CSS para design responsivo e acessível, Lucide React para ícones semânticos, React Router DOM v6 para roteamento SPA, e Axios com interceptors de segurança.
4. **Armazenamento:** Módulo de upload em disco local protegido (`server/uploads/`) com download apenas autenticado via API do Workspace.

## Consequências
- **Positivas:**
  - Código desacoplado e fortemente tipado.
  - O banco de dados sobrevive a reinícios, fechamentos de navegador e logout/login.
  - Zero dependência de serviços externos pagos ou instáveis durante o desenvolvimento e produção local.
  - Rápida execução de testes automatizados com banco isolado.
- **Negativas:**
  - Para alta escala horizontal com múltiplos servidores de backend paralelos no futuro, será necessária a migração da connection string do Prisma para PostgreSQL (operação nativa com Prisma).
