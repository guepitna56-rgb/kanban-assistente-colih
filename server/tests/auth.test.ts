import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Módulo de Autenticação Real', () => {
  const testUser = {
    name: 'Dr. Roberto Teste',
    email: `roberto_${Date.now()}@teste.com`,
    password: 'SenhaForte123@',
    phone: '11999998888',
  };

  afterAll(async () => {
    // Limpeza dos dados gerados no teste
    await prisma.user.deleteMany({
      where: { email: { contains: 'roberto_' } },
    });
  });

  it('deve registrar um novo usuário com sucesso e retornar token JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Nunca vazar hash
    expect(res.body.data.token).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('deve rejeitar cadastro com e-mail duplicado com status 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('APP_ERROR');
    expect(res.body.message).toContain('já está cadastrado');
  });

  it('deve rejeitar login com senha incorreta com status 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'SenhaTotalmenteErrada!',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Credenciais incorretas');
  });

  it('deve autenticar com sucesso usando credenciais corretas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.token).toBeDefined();
  });

  it('deve recuperar dados do usuário autenticado via /api/auth/me', async () => {
    // Faz login primeiro
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.name).toBe(testUser.name);
    expect(meRes.body.data.user.email).toBe(testUser.email);
  });
});
