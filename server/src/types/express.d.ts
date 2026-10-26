export interface AuthUserPayload {
  id: string;
  email: string;
  name: string;
}

export interface WorkspaceContextPayload {
  workspaceId: string;
  memberId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
      workspaceContext?: WorkspaceContextPayload;
    }
  }
}
