import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { WorkspaceMember, Role } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  CheckCircle2,
  ArrowUpDown,
  Download,
  Copy,
  Check,
  MessageCircle,
  Stethoscope,
  Shield,
  ShieldCheck,
  Eye,
  AlertCircle,
} from 'lucide-react';

const ROLE_INFO: Record<Role, { label: string; badgeClass: string; icon: any }> = {
  OWNER: {
    label: 'Coordenador Geral',
    badgeClass: 'bg-blue-100 text-[#1F619E] border-blue-200',
    icon: ShieldCheck,
  },
  ADMIN: {
    label: 'Secretário / Admin',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Shield,
  },
  MEMBER: {
    label: 'Facilitador de Visitas',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Stethoscope,
  },
  GUEST: {
    label: 'Visualizador',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Eye,
  },
};

const SUGGESTED_TITLES = [
  'Facilitador de Visitas Hospitalares',
  'Facilitador de Campo',
  'Plantonista de Emergência 24h',
  'Secretário Executivo',
  'Coordenador de Visitas Médicas',
  'Liaison de Protocolos HLC-31',
  'Apoio de Secretaria',
];

export const MembersPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME' | 'RECENT'>('NAME');

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Novo Membro
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MEMBER' | 'GUEST'>('MEMBER');
  const [formTitle, setFormTitle] = useState('Facilitador de Visitas Hospitalares');
  const [isFacilitator, setIsFacilitator] = useState(true);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal Editar Membro
  const [editingMember, setEditingMember] = useState<WorkspaceMember | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'MEMBER' | 'GUEST'>('MEMBER');
  const [editTitle, setEditTitle] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Exclusão
  const [deletingMember, setDeletingMember] = useState<WorkspaceMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadMembers = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data.data.members || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [workspaceId]);

  const handleCopyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setIsSubmittingAdd(true);
    setAddError(null);

    try {
      await api.post(`/workspaces/${workspaceId}/members`, {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase(),
        phone: formPhone.trim() || undefined,
        role: formRole,
        title: formTitle.trim() || undefined,
        isFacilitator,
      });

      setIsAddModalOpen(false);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormTitle('Facilitador de Visitas Hospitalares');
      setIsFacilitator(true);
      await loadMembers();
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleOpenEdit = (m: WorkspaceMember) => {
    setEditingMember(m);
    setEditName(m.user.name || '');
    setEditPhone(m.user.phone || '');
    setEditRole(m.role as 'ADMIN' | 'MEMBER' | 'GUEST');
    setEditTitle(m.title || '');
    setEditError(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !editingMember) return;
    setIsUpdating(true);
    setEditError(null);

    try {
      await api.patch(`/workspaces/${workspaceId}/members/${editingMember.id}`, {
        name: editName.trim(),
        phone: editPhone.trim() || null,
        role: editRole,
        title: editTitle.trim() || null,
      });

      setEditingMember(null);
      await loadMembers();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId || !deletingMember) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${deletingMember.id}`);
      setDeletingMember(null);
      await loadMembers();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members
      .filter((m) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          m.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.user.phone && m.user.phone.includes(searchQuery)) ||
          (m.title && m.title.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesRole =
          selectedRoleFilter === 'ALL' ||
          (selectedRoleFilter === 'FACILITATORS' &&
            (m.role === 'MEMBER' || (m.title && m.title.toLowerCase().includes('facilitador')))) ||
          m.role === selectedRoleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        if (sortOrder === 'NAME') {
          return a.user.name.localeCompare(b.user.name, 'pt-BR');
        }
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      });
  }, [members, searchQuery, selectedRoleFilter, sortOrder]);

  if (isLoading) {
    return <LoadingSpinner message="Carregando integrantes e facilitadores da comissão..." />;
  }

  return (
    <div className="space-y-6 text-slate-800 pb-16 font-sans">
      {/* Barra de Ações Superior estilo Assistente COLIH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Botões Pílula */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="px-5 py-2 rounded-full bg-[#1F619E] hover:bg-[#1A5285] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>

          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'NAME' ? 'RECENT' : 'NAME')}
            className="px-4 py-2 rounded-full border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                ['Nome,Email,Telefone,Funcao,Papel,DataIngresso']
                  .concat(
                    filteredMembers.map(
                      (m) =>
                        `"${m.user.name}","${m.user.email}","${m.user.phone || ''}","${m.title || ''}","${m.role}","${m.joinedAt}"`
                    )
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `integrantes_colih_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-4 py-2 rounded-full border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Totalizadores e Subtítulo */}
        <div className="text-xs sm:text-sm text-slate-500 font-medium self-start sm:self-auto">
          Exibindo <strong className="text-slate-800">{filteredMembers.length}</strong> de{' '}
          <strong className="text-slate-800">{members.length}</strong> integrantes cadastrados
        </div>
      </div>

      {/* Barra de Filtros com Fundo Cinza Suave #F4F3F7 */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Select de Função */}
        <div className="sm:col-span-3">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
          >
            <option value="ALL">Todas as Funções</option>
            <option value="FACILITATORS">Facilitadores de Visitas</option>
            <option value="ADMIN">Secretaria / Admins</option>
            <option value="MEMBER">Membros de Campo</option>
            <option value="GUEST">Visualizadores</option>
          </select>
        </div>

        {/* Select de Ordenação */}
        <div className="sm:col-span-3">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
          >
            <option value="NAME">Ordem Alfabética (A-Z)</option>
            <option value="RECENT">Data de Ingresso (Mais recentes)</option>
          </select>
        </div>

        {/* Campo de Pesquisa com Lupa à Direita */}
        <div className="sm:col-span-6 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, WhatsApp ou e-mail..."
            className="w-full pl-4 pr-11 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadMembers} />}

      {/* Lista de Membros e Facilitadores em Fichas com Faixa Superior #DDE5EE */}
      {filteredMembers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum integrante encontrado"
          description={
            searchQuery
              ? 'Nenhum integrante corresponde aos critérios de pesquisa.'
              : 'Nenhum integrante cadastrado nesta comissão. Clique no botão "+ Novo" acima para cadastrar.'
          }
          action={{
            label: 'Cadastrar Integrante',
            onClick: () => {
              setAddError(null);
              setIsAddModalOpen(true);
            },
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((m) => {
            const roleDef = ROLE_INFO[m.role] || ROLE_INFO.MEMBER;
            const isFacil =
              m.role === 'MEMBER' || (m.title && m.title.toLowerCase().includes('facilitador'));
            const cleanPhone = m.user.phone ? m.user.phone.replace(/\D/g, '') : '';
            const whatsappUrl = cleanPhone
              ? `https://wa.me/55${cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone}`
              : null;
            const formattedDate = new Date(m.joinedAt).toLocaleDateString('pt-BR');

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300"
              >
                {/* Faixa Superior Azul Claro (#DDE5EE) com Nome e Opções */}
                <div className="bg-[#DDE5EE] px-5 py-3 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      {m.user.name}
                    </h3>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleDef.badgeClass}`}
                    >
                      {roleDef.label}
                    </span>
                    {isFacil && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-emerald-600" />
                        Visitas Hospitalares
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(m)}
                      className="p-1.5 text-slate-600 hover:text-[#1F619E] rounded-lg transition-colors"
                      title="Editar Integrante"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {m.role !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => setDeletingMember(m)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                        title="Remover Integrante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Corpo da Ficha com Dados em Grade Conforme o Design Assistente COLIH */}
                <div className="p-5 sm:p-6 bg-[#FAF9FD]/40 space-y-4 text-xs">
                  {/* Linha 1: Função na Comissão e Data de Ingresso */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Função na Comissão
                      </span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {m.title || (isFacil ? 'Facilitador de Visitas Hospitalares' : 'Membro da Comissão')}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Data de Ingresso
                      </span>
                      <span className="text-xs text-slate-700 mt-0.5 block font-mono">
                        {formattedDate}
                      </span>
                    </div>
                  </div>

                  {/* Linha 2: WhatsApp e E-mail / Google Calendar */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Telefone / WhatsApp
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {m.user.phone || 'Sem telefone informado'}
                        </span>
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition-all"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        E-mail &amp; Google Agenda
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-800 font-medium truncate">
                          {m.user.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyEmail(m.user.email, m.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Copiar e-mail"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Linha 3: Status de Integração Mobile */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Cadastrado no Sistema Integrado COLIH</span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Alertas de visita enviados para smartphone via Google Agenda</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Cadastrar Novo Integrante (Horizontal, espaçoso, sem campo de senha) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Cadastrar Novo Integrante / Facilitador COLIH"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5">
          {addError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{addError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Nome Completo do Irmão *
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                E-mail (Google Calendar) *
              </label>
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="carlos.silva@exemplo.com"
                className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                WhatsApp / Celular com DDD *
              </label>
              <input
                type="tel"
                required
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="(14) 99876-5432"
                className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
              />
            </div>
          </div>

          {/* Toggle de Facilitador de Campo */}
          <div
            onClick={() => {
              const nextVal = !isFacilitator;
              setIsFacilitator(nextVal);
              if (nextVal) {
                setFormRole('MEMBER');
                setFormTitle('Facilitador de Visitas Hospitalares');
              }
            }}
            className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
              isFacilitator
                ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  isFacilitator ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block">
                  Designar como Facilitador de Visitas Hospitalares
                </span>
                <span className="text-xs text-slate-500">
                  Irmão designado para atuar diretamente no campo visitando médicos e hospitais.
                </span>
              </div>
            </div>
            <div
              className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                isFacilitator
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 bg-white'
              }`}
            >
              {isFacilitator && <Check className="w-4 h-4" />}
            </div>
          </div>

          {/* Título / Função na Comissão */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Função Local na Comissão
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Ex: Facilitador de Visitas Hospitalares"
              className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
            />
            {/* Sugestões Rápidas de Título */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGGESTED_TITLES.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFormTitle(st)}
                  className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  + {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-5 py-2 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="px-6 py-2 rounded-full bg-[#1F619E] hover:bg-[#1A5285] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60"
            >
              {isSubmittingAdd ? 'Cadastrando...' : 'Cadastrar Integrante'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Membro */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        title="Editar Integrante da Comissão"
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Telefone / WhatsApp com DDD
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Função na Comissão
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Papel no Sistema (Privilégios)
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-[#F4F3F7] border border-slate-200/90 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1F619E]"
            >
              <option value="MEMBER">Facilitador / Membro de Campo</option>
              <option value="ADMIN">Secretário / Administrador</option>
              <option value="GUEST">Visualizador (Leitura)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="px-5 py-2 rounded-full border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2 rounded-full bg-[#1F619E] hover:bg-[#1A5285] text-white font-bold text-sm shadow-sm transition-all disabled:opacity-60"
            >
              {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogo de Exclusão */}
      <ConfirmDialog
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDelete}
        title="Remover Integrante"
        message={`Deseja realmente remover ${deletingMember?.user.name} da comissão? O histórico de visitas realizadas será preservado.`}
        confirmLabel={isDeleting ? 'Removendo...' : 'Remover Integrante'}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
