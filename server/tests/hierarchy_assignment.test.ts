import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Hierarquia de Designação de Tarefas entre Usuários (Owner, Admin, Membro, Guest)', () => {
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let guestToken: string;

  let ownerMemberId: string;
  let adminMemberId: string;
  let memberMemberId: string;
  let guestMemberId: string;

  let workspaceId: string;
  let boardId: string;
  let listId: string;

  const timestamp = Date.now();

  beforeAll(async () => {
    // 1. Cadastrar os 4 usuários
    const rOwner = await request(app).post('/api/auth/register').send({
      name: 'Dr. Coordenador Owner',
      email: `owner_${timestamp}@colih.org`,
      password: 'SenhaForte123@',
    });
    ownerToken = rOwner.body.data.token;

    const rAdmin = await request(app).post('/api/auth/register').send({
      name: 'Dr. Gestor Admin',
      email: `admin_${timestamp}@colih.org`,
      password: 'SenhaForte123@',
    });
    adminToken = rAdmin.body.data.token;
    const adminUserId = rAdmin.body.data.user.id;

    const rMember = await request(app).post('/api/auth/register').send({
      name: 'Irmão Liaison Membro',
      email: `member_${timestamp}@colih.org`,
      password: 'SenhaForte123@',
    });
    memberToken = rMember.body.data.token;
    const memberUserId = rMember.body.data.user.id;

    const rGuest = await request(app).post('/api/auth/register').send({
      name: 'Observador Convidado',
      email: `guest_${timestamp}@colih.org`,
      password: 'SenhaForte123@',
    });
    guestToken = rGuest.body.data.token;
    const guestUserId = rGuest.body.data.user.id;

    // 2. Owner cria o workspace
    const rWs = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: `COLIH Teste Hierarquia ${timestamp}`,
        city: 'São Paulo',
        state: 'SP',
      });
    workspaceId = rWs.body.data.workspace.id;

    // Obter memberId do Owner
    const mOwner = await prisma.workspaceMember.findFirst({
      where: { workspaceId, role: 'OWNER' },
    });
    ownerMemberId = mOwner!.id;

    // 3. Adicionar Admin, Member e Guest no workspace
    const mAdmin = await prisma.workspaceMember.create({
      data: { workspaceId, userId: adminUserId, role: 'ADMIN' },
    });
    adminMemberId = mAdmin.id;

    const mMember = await prisma.workspaceMember.create({
      data: { workspaceId, userId: memberUserId, role: 'MEMBER' },
    });
    memberMemberId = mMember.id;

    const mGuest = await prisma.workspaceMember.create({
      data: { workspaceId, userId: guestUserId, role: 'GUEST' },
    });
    guestMemberId = mGuest.id;

    // 4. Criar um Quadro e uma Lista
    const rBoard = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Quadro Operacional COLIH',
        useColihTemplate: true,
      });
    boardId = rBoard.body.data.board.id;
    const firstList = await prisma.boardList.findFirst({
      where: { boardId },
    });
    listId = firstList!.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { contains: `_${timestamp}@colih.org` },
      },
    });
  });

  it('1. OWNER deve conseguir designar tarefas para ADMIN e para MEMBER (Descendente)', async () => {
    // Owner designa para Admin
    const resAdmin = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        listId,
        title: 'Visita Técnica designada pelo Owner para o Admin',
        priority: 'ALTA',
        assignedMemberId: adminMemberId,
      });
    expect(resAdmin.status).toBe(201);
    expect(resAdmin.body.data.card.assignedMemberId).toBe(adminMemberId);

    // Owner designa para Member
    const resMember = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        listId,
        title: 'Visita de Apoio designada pelo Owner para o Membro',
        priority: 'MEDIA',
        assignedMemberId: memberMemberId,
      });
    expect(resMember.status).toBe(201);
    expect(resMember.body.data.card.assignedMemberId).toBe(memberMemberId);
  });

  it('2. ADMIN deve conseguir designar tarefas para MEMBER (Descendente) e para si mesmo (Lateral)', async () => {
    // Admin designa para Member
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        listId,
        title: 'Tarefa atribuída pelo Admin ao Membro',
        priority: 'MEDIA',
        assignedMemberId: memberMemberId,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.card.assignedMemberId).toBe(memberMemberId);

    // Admin designa para si mesmo
    const resSelf = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        listId,
        title: 'Tarefa auto-atribuída pelo Admin',
        priority: 'MEDIA',
        assignedMemberId: adminMemberId,
      });
    expect(resSelf.status).toBe(201);
    expect(resSelf.body.data.card.assignedMemberId).toBe(adminMemberId);
  });

  it('3. ADMIN NÃO DEVE conseguir designar tarefas para OWNER (Violação de Hierarquia)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        listId,
        title: 'Tentativa indevida de delegar para o Coordenador/Owner',
        priority: 'ALTA',
        assignedMemberId: ownerMemberId,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Violação de hierarquia');
    expect(res.body.message).toContain('Administrador');
    expect(res.body.message).toContain('Coordenador');
  });

  it('4. MEMBER deve conseguir designar tarefas para si mesmo ou outro MEMBER (Mesmo nível hierárquico)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        listId,
        title: 'Tarefa auto-atribuída pelo Membro de campo',
        priority: 'BAIXA',
        assignedMemberId: memberMemberId,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.card.assignedMemberId).toBe(memberMemberId);
  });

  it('5. MEMBER NÃO DEVE conseguir designar tarefas para ADMIN nem para OWNER', async () => {
    // Membro tenta designar para Admin
    const resAdmin = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        listId,
        title: 'Tentativa de designar tarefa para o Admin',
        priority: 'ALTA',
        assignedMemberId: adminMemberId,
      });
    expect(resAdmin.status).toBe(403);
    expect(resAdmin.body.message).toContain('Violação de hierarquia');

    // Membro tenta designar para Owner
    const resOwner = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        listId,
        title: 'Tentativa de designar tarefa para o Owner',
        priority: 'ALTA',
        assignedMemberId: ownerMemberId,
      });
    expect(resOwner.status).toBe(403);
    expect(resOwner.body.message).toContain('Violação de hierarquia');
  });

  it('6. Ninguém pode designar tarefas para GUEST (Visualizador não recebe tarefas)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        listId,
        title: 'Tentativa de designar tarefa para Convidado',
        priority: 'BAIXA',
        assignedMemberId: guestMemberId,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Visualizador (GUEST) não podem receber atribuição');
  });

  it('7. GUEST não possui permissão para criar cartões nem designar tarefas (403)', async () => {
    const res = await request(app)
      .post(`/api/workspaces/${workspaceId}/boards/cards`)
      .set('Authorization', `Bearer ${guestToken}`)
      .send({
        listId,
        title: 'Tentativa de criar cartão como Guest',
        priority: 'BAIXA',
      });

    expect(res.status).toBe(403);
  });
});
