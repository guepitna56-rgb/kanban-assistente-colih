import { z } from 'zod';

export const createBoardSchema = z.object({
  title: z.string().min(2, 'O título do quadro é obrigatório.').trim(),
  description: z.string().optional().nullable(),
  useColihTemplate: z.boolean().optional().default(false),
});

export const updateBoardSchema = createBoardSchema.partial();

export const createListSchema = z.object({
  title: z.string().min(1, 'O título da lista é obrigatório.').trim(),
  position: z.number().int().optional(),
});

export const updateListSchema = z.object({
  title: z.string().min(1).optional(),
  position: z.number().int().optional(),
});

export const createCardSchema = z.object({
  listId: z.string().uuid('ID da lista inválido.'),
  title: z.string().min(1, 'O título do cartão é obrigatório.').trim(),
  description: z.string().optional().nullable(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).default('MEDIA'),
  startDate: z.string().datetime().optional().nullable().or(z.literal('')),
  dueDate: z.string().datetime().optional().nullable().or(z.literal('')),
  assignedMemberId: z.string().uuid().optional().nullable(),
  patientCaseId: z.string().uuid().optional().nullable(),
  hospitalId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  tag: z.string().optional().nullable(),
  statusBadge: z.string().optional().nullable(),
  checklistTitle: z.string().optional().nullable(),
  checklistDone: z.boolean().optional().default(false),
  cardCategory: z.enum(['VISITA', 'PROTOCOLO', 'HLC_37', 'FACILITADOR', 'PROJETO']).default('VISITA'),
  labelIds: z.array(z.string()).optional(),
  checklistItems: z.array(z.string()).optional(),
});

export const updateCardSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']).optional(),
  startDate: z.string().datetime().optional().nullable().or(z.literal('')),
  dueDate: z.string().datetime().optional().nullable().or(z.literal('')),
  assignedMemberId: z.string().uuid().optional().nullable(),
  patientCaseId: z.string().uuid().optional().nullable(),
  hospitalId: z.string().uuid().optional().nullable(),
  doctorId: z.string().uuid().optional().nullable(),
  tag: z.string().optional().nullable(),
  statusBadge: z.string().optional().nullable(),
  checklistTitle: z.string().optional().nullable(),
  checklistDone: z.boolean().optional(),
  cardCategory: z.enum(['VISITA', 'PROTOCOLO', 'HLC_37', 'FACILITADOR', 'PROJETO']).optional(),
  labelIds: z.array(z.string()).optional(),
  checklistItems: z.array(z.string()).optional(),
});

export const toggleChecklistSchema = z.object({
  done: z.boolean(),
});

export const createChecklistItemSchema = z.object({
  title: z.string().min(1, 'O título da tarefa é obrigatório.').trim(),
});

export const updateChecklistItemSchema = z.object({
  title: z.string().min(1).optional(),
  isDone: z.boolean().optional(),
});

export const moveCardSchema = z.object({
  targetListId: z.string().uuid('ID da lista de destino inválido.'),
  newPosition: z.number().int().min(0, 'A posição deve ser maior ou igual a zero.'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'O comentário não pode ser vazio.').trim(),
});

export const createLabelSchema = z.object({
  title: z.string().optional().nullable(),
  color: z.string().min(1, 'A cor da etiqueta é obrigatória.').trim(),
});

export const updateLabelSchema = z.object({
  title: z.string().optional().nullable(),
  color: z.string().min(1).trim().optional(),
});

