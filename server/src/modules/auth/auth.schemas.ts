import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.').toLowerCase().trim(),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  phone: z.string().optional(),
  congregation: z.string().optional(),
  roleInterest: z.string().optional(),
  workspaceId: z.string().optional(),
  newWorkspace: z
    .object({
      name: z.string().min(3, 'Nome da comissão deve ter no mínimo 3 caracteres.'),
      city: z.string().min(2, 'Cidade é obrigatória.'),
      state: z.string().min(2, 'UF é obrigatória.').max(2),
      description: z.string().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido.').toLowerCase().trim(),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url('URL do avatar inválida.').optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'A senha atual é obrigatória.'),
  newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
});
