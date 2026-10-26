import { z } from 'zod';

export const addMemberSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').toLowerCase().trim(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST'], {
    errorMap: () => ({ message: 'A função deve ser ADMIN, MEMBER ou GUEST.' }),
  }),
  title: z.string().optional(),
  congregation: z.string().optional(),
  password: z.string().min(6, 'A senha provisória deve ter pelo menos 6 caracteres.').optional(),
  isFacilitator: z.boolean().optional(),
});

export const inviteMemberSchema = addMemberSchema;

export const updateMemberSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST'], {
    errorMap: () => ({ message: 'A função deve ser ADMIN, MEMBER ou GUEST.' }),
  }).optional(),
  title: z.string().optional().nullable(),
});

export const updateMemberRoleSchema = updateMemberSchema;
