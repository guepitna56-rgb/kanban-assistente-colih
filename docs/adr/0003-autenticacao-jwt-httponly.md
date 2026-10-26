# ADR 0003: Autenticação Segura com Tokens JWT em Cookies HttpOnly

## Status
Aprovado

## Contexto
Autenticação precisa ser real, persistente e segura contra ataques comuns da web (XSS e CSRF). O usuário não pode perder a sessão ao atualizar a página, e suas credenciais devem ser protegidas criptograficamente.

## Decisão
1. **Hash de Senhas:** Utilização de `bcryptjs` com custo de processamento (salt rounds) igual a 12.
2. **Tokens de Sessão:** JWT (JSON Web Token) emitido no login ou registro, assinado com chave secreta forte do servidor.
3. **Transporte e Armazenamento:** O token é enviado via Cookie HTTP com os atributos:
   - `HttpOnly: true` (impossibilita leitura por scripts maliciosos no navegador via XSS);
   - `SameSite: 'lax'` (proteção contra CSRF cross-origin);
   - `Path: '/'`;
   - `Max-Age: 7 dias`.
4. **Verificação de Sessão:** O frontend executa uma requisição `GET /api/auth/me` na inicialização para recuperar os dados reais do usuário logado (ID, nome, email, avatar, data de cadastro).

## Consequências
- **Positivas:**
  - Zero armazenamento de tokens em `localStorage`, prevenindo vazamentos por XSS.
  - Sessão transparente que persiste recarregamento de página e fechamento do navegador.
- **Negativas:**
  - Exige configuração correta de `credentials: 'include'` no cliente Axios e configuração de CORS com `credentials: true`.
