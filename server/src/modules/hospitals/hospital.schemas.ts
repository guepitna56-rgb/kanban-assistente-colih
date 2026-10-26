import { z } from 'zod';

export const createHospitalSchema = z.object({
  name: z.string().min(2, 'O nome da instituição/hospital deve ter pelo menos 2 caracteres.'),
  legalName: z.string().optional().nullable(),
  type: z.enum(['PUBLICO', 'PRIVADO', 'FILANTROPICO', 'UNIVERSITARIO'], {
    errorMap: () => ({ message: 'Tipo inválido. Deve ser PUBLICO, PRIVADO, FILANTROPICO ou UNIVERSITARIO.' }),
  }),
  address: z.string().optional().nullable(),
  city: z.string().min(2, 'A cidade é obrigatória.'),
  state: z.string().min(2, 'O estado (UF) é obrigatório.').max(2),
  zipCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  emergencyPhone: z.string().optional().nullable(),
  email: z.string().email('E-mail institucional inválido.').optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

export const updateHospitalSchema = createHospitalSchema.partial();
