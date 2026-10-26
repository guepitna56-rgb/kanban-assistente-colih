import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data?.message) {
      if (Array.isArray(data.details)) {
        const detailsStr = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        return `${data.message} (${detailsStr})`;
      }
      return data.message;
    }
    if (error.response?.status === 404) return 'Recurso não encontrado.';
    if (error.response?.status === 403) return 'Acesso negado. Você não tem permissão para esta ação.';
    if (error.response?.status === 401) return 'Sessão expirada. Faça login novamente.';
    if (error.response?.status === 500) return 'Erro interno do servidor. Tente novamente mais tarde.';
  }
  return 'Ocorreu um erro inesperado ao se comunicar com o servidor.';
}
