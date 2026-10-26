import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().min(3, 'O nome da comissão/workspace deve ter pelo menos 3 caracteres.'),
  description: z.string().optional(),
  city: z.string().min(2, 'A cidade é obrigatória.'),
  state: z.string().min(2, 'O estado (UF) é obrigatório.').max(2, 'Utilize a sigla do estado com 2 letras.'),
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(3, 'O nome da comissão/workspace deve ter pelo menos 3 caracteres.').optional(),
  description: z.string().optional().nullable(),
  city: z.string().min(2, 'A cidade é obrigatória.').optional(),
  state: z.string().min(2, 'O estado (UF) é obrigatório.').max(2).optional(),
});
