export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  title?: string | null;
  joinedAt: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  city: string;
  state: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  userRole?: Role;
  userTitle?: string | null;
  owner?: { id: string; name: string; email: string };
  _count?: {
    members: number;
    patientCases?: number;
    hospitals?: number;
    doctors?: number;
    boards?: number;
  };
}

export type HospitalType = 'PUBLICO' | 'PRIVADO' | 'FILANTROPICO' | 'UNIVERSITARIO';

export interface Hospital {
  id: string;
  workspaceId: string;
  name: string;
  legalName?: string | null;
  type: HospitalType;
  address?: string | null;
  city: string;
  state: string;
  zipCode?: string | null;
  phone?: string | null;
  emergencyPhone?: string | null;
  email?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    doctors?: number;
    cards?: number;
  };
  doctors?: Doctor[];
}

export type CooperativeLevel = 'COOPERATIVO' | 'CONSULTIVO' | 'RESTRITO' | 'EM_CONTATO';

export interface Doctor {
  id: string;
  workspaceId: string;
  hospitalId?: string | null;
  name: string;
  crm: string;
  crmState: string;
  specialty: string;
  phone?: string | null;
  email?: string | null;
  cooperativeLevel: CooperativeLevel;
  acceptsBloodless: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  hospital?: { id: string; name: string; city?: string } | null;
  _count?: {
    cards?: number;
  };
}

export type CaseStatus = 'URGENTE' | 'ATIVO' | 'AGUARDANDO_CIRURGIA' | 'ESTAVEL' | 'ENCERRADO';

export interface PatientCase {
  id: string;
  workspaceId: string;
  code: string;
  patientName: string;
  patientAge?: number | null;
  status: CaseStatus;
  hospitalId?: string | null;
  doctorId?: string | null;
  assignedMemberId?: string | null;
  diagnosis?: string | null;
  treatmentPlan?: string | null;
  admissionDate?: string | null;
  dischargeDate?: string | null;
  createdAt: string;
  updatedAt: string;
  hospital?: { id: string; name: string; city?: string } | null;
  doctor?: { id: string; name: string; crm: string; specialty: string } | null;
  assignedMember?: {
    id: string;
    user: { id: string; name: string; email: string; phone?: string | null; avatarUrl?: string | null };
  } | null;
  attachments?: Attachment[];
  cards?: Array<{
    id: string;
    title: string;
    priority: CardPriority;
    dueDate?: string | null;
    list?: { id: string; title: string; boardId: string };
  }>;
  _count?: {
    attachments: number;
    cards: number;
  };
}

export type CardPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface BoardLabel {
  id: string;
  boardId: string;
  title?: string | null;
  name?: string | null;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description?: string | null;
  position: number;
  priority: CardPriority;
  startDate?: string | null;
  dueDate?: string | null;
  assignedMemberId?: string | null;
  patientCaseId?: string | null;
  hospitalId?: string | null;
  doctorId?: string | null;
  tag?: string | null;
  statusBadge?: string | null;
  checklistTitle?: string | null;
  checklistDone?: boolean;
  checklistItems?: CardChecklistItem[];
  cardCategory?: 'VISITA' | 'PROTOCOLO' | 'HLC_37' | 'FACILITADOR' | 'PROJETO';
  createdAt: string;
  updatedAt: string;
  list?: { id: string; title: string; boardId: string; board?: { title: string; workspaceId: string } };
  assignedMember?: {
    id: string;
    role?: Role;
    user: { id: string; name: string; email?: string; avatarUrl?: string | null };
  } | null;
  members?: WorkspaceMember[];
  labels?: BoardLabel[];
  patientCase?: { id: string; code: string; patientName: string; status?: CaseStatus } | null;
  hospital?: { id: string; name: string; city?: string } | null;
  doctor?: { id: string; name: string; specialty: string; crm: string; crmState?: string } | null;
  comments?: CardComment[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface CardChecklistItem {
  id: string;
  cardId: string;
  title: string;
  isDone: boolean;
  position: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardList {
  id: string;
  boardId: string;
  title: string;
  position: number;
  createdAt: string;
  cards: Card[];
}

export interface Board {
  id: string;
  workspaceId: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  lists?: BoardList[];
  labels?: BoardLabel[];
  _count?: {
    lists: number;
  };
}

export interface CardComment {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    user: { id: string; name: string; avatarUrl?: string | null };
  };
}

export interface Attachment {
  id: string;
  workspaceId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  cardId?: string | null;
  patientCaseId?: string | null;
  createdAt: string;
  uploadedBy?: { id: string; name: string };
}

export interface AuditLog {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  detailsJson?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface Notification {
  id: string;
  workspaceId: string;
  recipientUserId: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  cases: {
    total: number;
    urgent: number;
    active: number;
    waitingSurgery: number;
    stable: number;
    closed: number;
  };
  counts: {
    hospitals: number;
    doctors: number;
    members: number;
    boards: number;
  };
  recentCases: Array<{
    id: string;
    code: string;
    patientName: string;
    status: CaseStatus;
    createdAt: string;
    hospital?: { name: string } | null;
    assignedMember?: { user: { name: string } } | null;
  }>;
  recentAuditLogs: AuditLog[];
}
