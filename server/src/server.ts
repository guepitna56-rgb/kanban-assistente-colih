import { app } from './app.js';
import { env } from './config/env.js';

const PORT = parseInt(env.PORT, 10) || 3001;

app.listen(PORT, () => {
  console.log(`[COLIH API] Servidor rodando com sucesso na porta ${PORT}`);
  console.log(`[COLIH API] Ambiente: ${env.NODE_ENV}`);
  console.log(`[COLIH API] Banco de dados: SQLite (${env.DATABASE_URL})`);
});
