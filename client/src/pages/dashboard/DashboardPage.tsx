import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { DashboardMetrics } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import {
  Building2,
  Stethoscope,
  HeartHandshake,
  ArrowRight,
  ChevronDown,
  FolderKanban,
} from 'lucide-react';
import { AssistenteColihLogo } from '../../components/brand/AssistenteColihLogo.js';
import { BoardKanbanPage } from '../boards/BoardKanbanPage.js';

export const DashboardPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(true);

  const loadMetrics = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/dashboard`);
      setMetrics(res.data.data.metrics);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [workspaceId]);

  if (isLoading) {
    return <LoadingSpinner message="Carregando Assistente COLIH..." className="py-24" />;
  }

  if (error || !metrics) {
    return <ErrorAlert message={error || 'Não foi possível carregar os dados.'} onRetry={loadMetrics} />;
  }

  return (
    <div className="space-y-6 text-slate-800">
      {/* Linha Superior: Card "Informações" exatamente como na foto 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-4">
          <button
            type="button"
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:text-[#1F619E] transition-colors w-full text-left"
          >
            <ChevronDown className={`w-5 h-5 text-slate-600 transition-transform ${isInfoOpen ? '' : '-rotate-90'}`} />
            <span>Informações</span>
          </button>

          {isInfoOpen && (
            <div className="pt-2 space-y-6 animate-in fade-in duration-200">
              {/* Logo horizontal Assistente COLIH com Estetoscópio e Livro da Foto 1 */}
              <div className="py-2">
                <AssistenteColihLogo variant="horizontal" />
              </div>

              {/* Últimas atualizações */}
              <div className="space-y-2">
                <p className="text-sm font-bold text-slate-800">Últimas atualizações:</p>
                <ul className="text-xs sm:text-sm text-slate-700 space-y-1.5 list-disc list-inside">
                  <li>Relatório de médicos por especialidade</li>
                  <li>Opção para retrair painéis na tela inicial</li>
                  <li>Sincronização automática com Google Agenda dos facilitadores</li>
                </ul>
              </div>

              {/* Mensagem de contato do desenvolvedor da foto */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                Caso encontre algum problema por favor entre em contato através do e-mail{' '}
                <a
                  href="mailto:alexpozzani@gmail.com"
                  className="text-[#1F619E] font-semibold underline hover:text-[#184E7F]"
                >
                  alexpozzani@gmail.com
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Resumo Rápido de Acesso */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          <Link
            to={`/workspaces/${workspaceId}/doctors`}
            className="bg-white hover:border-[#1F619E] border border-slate-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#1F619E]">
                Médicos
              </span>
              <div className="w-9 h-9 rounded-full bg-sky-50 text-[#1F619E] flex items-center justify-center">
                <Stethoscope className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.counts.doctors}</span>
              <span className="text-xs text-slate-500 block mt-0.5">profissionais cadastrados</span>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/hospitals`}
            className="bg-white hover:border-[#1F619E] border border-slate-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#1F619E]">
                Hospitais
              </span>
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.counts.hospitals}</span>
              <span className="text-xs text-slate-500 block mt-0.5">unidades cadastradas</span>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/facilitators`}
            className="bg-white hover:border-[#1F619E] border border-slate-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#1F619E]">
                Facilitadores
              </span>
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">{metrics.counts.members}</span>
              <span className="text-xs text-slate-500 block mt-0.5">ciclo de visitas ativo</span>
            </div>
          </Link>

          <Link
            to={`/workspaces/${workspaceId}/boards`}
            className="bg-white hover:border-[#1F619E] border border-slate-200 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-[#1F619E]">
                Quadro de Ações
              </span>
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-900">Visitas</span>
              <span className="text-xs text-slate-500 block mt-0.5">fluxo operacional</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Seção do Quadro Operacional de Demandas */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quadro de Ações da COLIH
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Fluxo em tempo real de visitas médicas, protocolos HLC-31 e ações em andamento
            </p>
          </div>

          <Link
            to={`/workspaces/${workspaceId}/boards`}
            className="px-4 py-1.5 rounded-full border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <span>Expandir Quadro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm overflow-hidden">
          <BoardKanbanPage embedded={true} />
        </div>
      </div>
    </div>
  );
};
