import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Sistema de Etiquetas (Labels Trello) no Kanban', () => {
  let token: string;
  let workspaceId: string;
  let boardId: string;
  let listId: string;

  const timestamp = Date.now();

  beforeAll(async () => {
    // 1. Criar usuário e workspace
    const rAuth = await request(app).post('/api/auth/register').send({
      name: 'Gestor Etiquetas',
      email: `labels_${timestamp}@colih.org`,
      password: 'SenhaForte123@',
    });
    token = rAuth.body.data.token;

    const rWs = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `COLIH Teste Etiquetas ${timestamp}`,
        city: 'Curitiba',
        state: 'PR',
      });
    workspaceId = rWs.body.data.workspace.id;

    // 2. Criar quadro
    const rBoard = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Quadro de Teste de Etiquetas',
        description: 'Testando etiquetas coloridas',
      });
    boardId = rBoard.body.data.board.id;

    // 3. Criar lista
    const rList = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/${boardId}/lists`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Fazer',
      });
    listId = rList.body.data.list.id;
  });

  afterAll(async () => {
    if (workspaceId) {
      await prisma.workspace.delete({ where: { id: workspaceId } }).catch(() => {});
    }
  });

  it('deve criar uma nova etiqueta colorida vinculada ao quadro', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/${boardId}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Alta Prioridade',
        color: '#ef4444',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.label.title).toBe('Alta Prioridade');
    expect(res.body.data.label.color).toBe('#ef4444');
    expect(res.body.data.label.boardId).toBe(boardId);
  });

  it('deve listar as etiquetas do quadro dentro de getBoardById', async () => {
    // Cria uma segunda etiqueta
    await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/${boardId}/labels`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'PBM / Bloodless',
        color: '#10b981',
      });

    const res = await request(app)
      .get(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.board.labels).toBeDefined();
    expect(res.body.data.board.labels.length).toBeGreaterThanOrEqual(2);
    const titles = res.body.data.board.labels.map((l: any) => l.title);
    expect(titles).toContain('Alta Prioridade');
    expect(titles).toContain('PBM / Bloodless');
  });

  it('deve criar um cartão já com etiquetas associadas e retornar com labels', async () => {
    // Obter etiquetas
    const rBoard = await request(app)
      .get(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const labels = rBoard.body.data.board.labels;

    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        listId,
        title: 'Visita ao Diretor Clínico',
        description: 'Apresentar estratégias PBM',
        priority: 'ALTA',
        labelIds: [labels[0].id],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.card.labels).toBeDefined();
    expect(res.body.data.card.labels.length).toBe(1);
    expect(res.body.data.card.labels[0].id).toBe(labels[0].id);
  });

  it('deve vincular e desvincular etiquetas de um cartão dinamicamente', async () => {
    // Obter etiquetas e cartão
    const rBoard = await request(app)
      .get(`/api/workspaces/${workspaceId}/boards/${boardId}`)
      .set('Authorization', `Bearer ${token}`);
    const labels = rBoard.body.data.board.labels;
    const card = rBoard.body.data.board.lists[0].cards[0];

    // 1. Vincular a segunda etiqueta
    const rAttach = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${labels[1].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(rAttach.status).toBe(200);
    expect(rAttach.body.data.card.labels.length).toBe(2);

    // 2. Desvincular a primeira etiqueta
    const rDetach = await request(app)
      .delete(`/api/workspaces/${workspaceId}/boards/cards/${card.id}/labels/${labels[0].id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(rDetach.status).toBe(200);
    expect(rDetach.body.data.card.labels.length).toBe(1);
    expect(rDetach.body.data.card.labels[0].id).toBe(labels[1].id);
  });
});
