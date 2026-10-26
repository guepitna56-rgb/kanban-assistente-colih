import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Isolamento Multi-tenant e RBAC de Workspaces', () => {
  let user1Token: string;
  let user2Token: string;
  let workspaceId: string;

  beforeAll(async () => {
    const timestamp = Date.now();

    // Cria Usuário 1 (Coordenador)
    const u1 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Coordenador Silva',
        email: `coord_${timestamp}@teste.com`,
        password: 'SenhaCoord123@',
      });
    user1Token = u1.body.data.token;

    // Cria Usuário 2 (Usuário Externo)
    const u2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Externo Souza',
        email: `externo_${timestamp}@teste.com`,
        password: 'SenhaExterno123@',
      });
    user2Token = u2.body.data.token;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'coord_' } },
          { email: { contains: 'externo_' } },
        ],
      },
    });
  });

  it('Usuário 1 deve criar um Workspace e se tornar OWNER automaticamente', async () => {
    const res = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'COLIH Regional Curitiba',
        city: 'Curitiba',
        state: 'PR',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.workspace.name).toBe('COLIH Regional Curitiba');
    workspaceId = res.body.data.workspace.id;

    // Verificar se o log de auditoria foi gerado
    const audit = await prisma.auditLog.findFirst({
      where: { workspaceId, action: 'WORKSPACE_CRIADO' },
    });
    expect(audit).toBeDefined();
  });

  it('Usuário 1 deve listar seu workspace', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.workspaces.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.workspaces[0].userRole).toBe('OWNER');
  });

  it('Usuário 2 (não membro) DEVE receber 403 Forbidden ao tentar acessar o workspace do Usuário 1', async () => {
    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Você não é membro deste workspace');
  });

  it('Usuário 2 não deve ver o workspace na sua listagem', async () => {
    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.workspaces.length).toBe(0);
  });
});
