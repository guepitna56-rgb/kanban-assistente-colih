import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().min(2, 'O nome do médico deve ter pelo menos 2 caracteres.'),
  crm: z.string().min(3, 'O número de CRM/registro de classe é obrigatório.'),
  crmState: z.string().min(2, 'O estado do CRM é obrigatório.').max(2),
  specialty: z.string().min(2, 'A especialidade médica é obrigatória.'),
  phone: z.string().optional().nullable(),
  email: z.string().email('E-mail inválido.').optional().nullable().or(z.literal('')),
  hospitalId: z.string().uuid('ID de hospital inválido.').optional().nullable(),
  cooperativeLevel: z.enum(['COOPERATIVO', 'CONSULTIVO', 'RESTRITO', 'EM_CONTATO'], {
    errorMap: () => ({ message: 'Nível deve ser COOPERATIVO, CONSULTIVO, RESTRITO ou EM_CONTATO.' }),
  }).default('EM_CONTATO'),
  acceptsBloodless: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const updateDoctorSchema = createDoctorSchema.partial();
