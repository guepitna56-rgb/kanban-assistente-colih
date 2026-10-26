import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { AuditLog } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { ShieldCheck, Clock, User, FileCode } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/audit`);
      setLogs(res.data.data.logs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [workspaceId]);

  if (isLoading) {
    return <LoadingSpinner message="Carregando logs de auditoria..." className="py-24" />;
  }

  if (error) {
    return <ErrorAlert message={error} onRetry={loadAuditLogs} />;
  }

  const parseDetails = (jsonStr?: string | null) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch {
      return jsonStr;
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Auditoria e Rastreabilidade</h1>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Histórico imutável de todas as alterações, cadastros e acessos sensíveis no workspace
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma atividade registrada neste workspace até o momento."
          description="Os logs de auditoria serão gerados automaticamente conforme os membros realizarem ações no sistema."
        />
      ) : (
        <div className="neu-panel p-2 overflow-hidden">
          <div className="divide-y divide-slate-300/40">
            {logs.map((log) => {
              const details = parseDetails(log.detailsJson);
              return (
                <div key={log.id} className="p-5 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 neu-badge bg-neu-bg text-brand-700">
                        {log.action}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Entidade: <strong className="text-slate-800">{log.entityType}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.user?.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {details && (
                    <div className="mt-3.5 neu-panel p-3.5">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        <FileCode className="w-3.5 h-3.5 text-brand-600" /> Detalhes do Evento
                      </div>
                      <pre className="text-xs font-mono text-slate-700 overflow-x-auto whitespace-pre-wrap">
                        {typeof details === 'object'
                          ? JSON.stringify(details, null, 2)
                          : details}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
