import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { Doctor, Hospital, CooperativeLevel, Board, WorkspaceMember } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  ArrowUpDown,
  Download,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';

const COMMON_SPECIALTIES = [
  'Cirurgia Geral',
  'Mastologia',
  'Ortopedia & Traumatologia',
  'Cardiologia & Cirurgia Cardíaca',
  'Ginecologia & Obstetrícia',
  'Anestesiologia',
  'Hematologia & Hemoterapia',
  'Oncologia Cirúrgica',
  'Medicina Intensiva (UTI)',
  'Urologia',
  'Neurocirurgia',
  'Cirurgia Vascular',
  'Pediatria',
];

export const DoctorsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros conforme o layout da foto 2
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'DATE_DESC'>('NAME_ASC');

  // Estado de exportação por médico
  const [exportSelected, setExportSelected] = useState<Record<string, boolean>>({});

  // Modais de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Exclusão
  const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Agendamento Rápido de Visita
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitingDoctor, setVisitingDoctor] = useState<Doctor | null>(null);
  const [visitHospitalId, setVisitHospitalId] = useState('');
  const [visitMemberId, setVisitMemberId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [isSubmittingVisit, setIsSubmittingVisit] = useState(false);
  const [visitSuccessMsg, setVisitSuccessMsg] = useState<string | null>(null);

  // Campos do Formulário
  const [name, setName] = useState('');
  const [crm, setCrm] = useState('');
  const [crmState, setCrmState] = useState('SP');
  const [specialty, setSpecialty] = useState('Cirurgia Geral');
  const [hospitalId, setHospitalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cooperativeLevel, setCooperativeLevel] = useState<CooperativeLevel>('COOPERATIVO');
  const [acceptsBloodless, setAcceptsBloodless] = useState(true);
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [docRes, hospRes, memRes, boardRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/doctors`),
        api.get(`/workspaces/${workspaceId}/hospitals`),
        api.get(`/workspaces/${workspaceId}/members`),
        api.get(`/workspaces/${workspaceId}/boards`),
      ]);
      setDoctors(docRes.data.data.doctors || []);
      setHospitals(hospRes.data.data.hospitals || []);
      setMembers(memRes.data.data.members || []);
      setBoards(boardRes.data.data.boards || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleOpenCreate = () => {
    setEditingDoctor(null);
    setName('');
    setCrm('');
    setCrmState('SP');
    setSpecialty('Cirurgia Geral');
    setHospitalId(hospitals[0]?.id || '');
    setPhone('');
    setEmail('');
    setCooperativeLevel('COOPERATIVO');
    setAcceptsBloodless(true);
    setNotes('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setCrm(doc.crm);
    setCrmState(doc.crmState);
    setSpecialty(doc.specialty);
    setHospitalId(doc.hospitalId || '');
    setPhone(doc.phone || '');
    setEmail(doc.email || '');
    setCooperativeLevel(doc.cooperativeLevel);
    setAcceptsBloodless(doc.acceptsBloodless);
    setNotes(doc.notes || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      name,
      crm,
      crmState,
      specialty,
      hospitalId: hospitalId || undefined,
      phone: phone || undefined,
      email: email || undefined,
      cooperativeLevel,
      acceptsBloodless,
      notes: notes || undefined,
    };

    try {
      if (editingDoctor) {
        await api.put(`/workspaces/${workspaceId}/doctors/${editingDoctor.id}`, payload);
      } else {
        await api.post(`/workspaces/${workspaceId}/doctors`, payload);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setModalError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId || !deletingDoctor) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/doctors/${deletingDoctor.id}`);
      setDeletingDoctor(null);
      await loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleExport = (docId: string) => {
    setExportSelected((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  // Agendamento direto de visita para o médico
  const handleOpenVisitModal = (doc: Doctor) => {
    setVisitingDoctor(doc);
    setVisitHospitalId(doc.hospitalId || hospitals[0]?.id || '');
    setVisitMemberId(members[0]?.id || '');
    setVisitDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setVisitNotes(`Apresentação institucional COLIH e alinhamento de conduta PBM com Dr(a). ${doc.name}.`);
    setVisitSuccessMsg(null);
    setIsVisitModalOpen(true);
  };

  const handleCreateVisitCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !visitingDoctor) return;
    setIsSubmittingVisit(true);
    setVisitSuccessMsg(null);

    try {
      let targetBoard = boards[0];
      if (!targetBoard) {
        const bRes = await api.get(`/workspaces/${workspaceId}/boards`);
        targetBoard = bRes.data.data.boards[0];
      }

      const boardDetailRes = await api.get(`/workspaces/${workspaceId}/boards/${targetBoard.id}`);
      const lists = boardDetailRes.data.data.board.lists || [];
      const targetList = lists.find((l: any) => l.title.toLowerCase().includes('visita')) || lists[0];

      if (!targetList) {
        throw new Error('Nenhuma coluna disponível no quadro operacional.');
      }

      const hosp = hospitals.find((h) => h.id === visitHospitalId);
      const hospitalTag = hosp ? hosp.name.slice(0, 7).toUpperCase().replace(/\s+/g, '-') : 'COLIH';

      await api.post(`/workspaces/${workspaceId}/boards/cards`, {
        listId: targetList.id,
        title: visitingDoctor.name.startsWith('Dr') ? visitingDoctor.name : `Dr(a). ${visitingDoctor.name}`,
        description: `${visitingDoctor.specialty} • ${hosp ? hosp.name : 'Hospital'}\n\n${visitNotes}`,
        priority: 'ALTA',
        dueDate: visitDate ? new Date(visitDate).toISOString() : null,
        assignedMemberId: visitMemberId || null,
        hospitalId: visitHospitalId || null,
        doctorId: visitingDoctor.id,
        tag: hospitalTag,
        statusBadge: 'Visita Agendada',
        checklistTitle: 'Protocolo de 4 Etapas COLIH',
        checklistDone: false,
        cardCategory: 'VISITA',
      });

      setVisitSuccessMsg('Visita agendada com sucesso no Quadro de Ações e Google Calendar!');
      setTimeout(() => {
        setIsVisitModalOpen(false);
      }, 1200);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSubmittingVisit(false);
    }
  };

  // Filtragem e Ordenação
  const filteredDoctors = doctors
    .filter((doc) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm.trim() === '' ||
        doc.name.toLowerCase().includes(q) ||
        doc.crm.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        (doc.phone && doc.phone.includes(q)) ||
        (doc.email && doc.email.toLowerCase().includes(q));

      const matchesSpecialty =
        selectedSpecialty === '' || doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();

      const matchesTag =
        selectedTag === '' ||
        (selectedTag === 'Cooperador' && doc.cooperativeLevel === 'COOPERATIVO') ||
        (selectedTag === 'Consultor' && doc.cooperativeLevel === 'CONSULTIVO') ||
        (selectedTag === 'Triagem' && doc.cooperativeLevel === 'EM_CONTATO') ||
        (selectedTag === 'Restrito' && doc.cooperativeLevel === 'RESTRITO');

      return matchesSearch && matchesSpecialty && matchesTag;
    })
    .sort((a, b) => {
      if (sortOrder === 'NAME_DESC') return b.name.localeCompare(a.name);
      if (sortOrder === 'DATE_DESC') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Página com Botões Pílula Exatamente como na Foto 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Médicos
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão + Novo */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-1.5 rounded-full border border-[#1F619E] text-[#1F619E] bg-white hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>

          {/* Botão ≡ Ordenar */}
          <button
            type="button"
            onClick={() => {
              setSortOrder((prev) => (prev === 'NAME_ASC' ? 'DATE_DESC' : prev === 'DATE_DESC' ? 'NAME_DESC' : 'NAME_ASC'));
            }}
            className="px-4 py-1.5 rounded-full border border-[#1F619E] text-[#1F619E] bg-white hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title={`Ordenar: ${sortOrder === 'NAME_ASC' ? 'Alfabética (A-Z)' : sortOrder === 'DATE_DESC' ? 'Recentes' : 'Alfabética (Z-A)'}`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar</span>
          </button>

          {/* Botão ⤓ Exportar */}
          <button
            type="button"
            onClick={() => {
              const selectedCount = Object.values(exportSelected).filter(Boolean).length;
              alert(
                selectedCount > 0
                  ? `${selectedCount} médico(s) marcados para exportação.`
                  : 'Selecione os médicos pelo botão "Exportar" em cada ficha para gerar o arquivo.'
              );
            }}
            className="px-4 py-1.5 rounded-full border border-slate-300 text-slate-500 bg-white hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          {/* Botão ⋮ Opções */}
          <button
            type="button"
            onClick={() => loadData()}
            className="px-4 py-1.5 rounded-full border border-[#1F619E] text-[#1F619E] bg-white hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Atualizar lista"
          >
            <MoreVertical className="w-3.5 h-3.5" />
            <span>Opções</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros com Fundo Cinza-Azulado (#F4F3F7) da Foto 2 */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Dropdown 1: Filtro de Especialidades */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="w-full px-4 py-3 bg-[#F4F3F7] border border-transparent focus:border-[#1F619E] focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all font-medium"
          >
            <option value="">Filtro de especialidades</option>
            {COMMON_SPECIALTIES.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>

          {/* Dropdown 2: Filtro de Tags */}
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full px-4 py-3 bg-[#F4F3F7] border border-transparent focus:border-[#1F619E] focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all font-medium"
          >
            <option value="">Filtro de tags</option>
            <option value="Cooperador">Cooperador</option>
            <option value="Consultor">Consultor</option>
            <option value="Triagem">Em Triagem</option>
            <option value="Restrito">Restrito</option>
          </select>
        </div>

        {/* Campo de Pesquisa com Ícone de Lupa à Direita */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar"
            className="w-full pl-4 pr-11 py-3 bg-[#F4F3F7] border border-transparent focus:border-[#1F619E] focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all font-medium placeholder-slate-400"
          />
          <Search className="w-5 h-5 absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Cabeçalho da Tabela: Nome e Opções */}
      <div className="flex items-center justify-between px-2 pt-2 text-xs font-bold text-slate-600">
        <span>Nome</span>
        <span>Opções</span>
      </div>

      {/* Lista de Fichas Médicas no Formato Oficial da Foto 2 */}
      {isLoading ? (
        <LoadingSpinner message="Carregando relação de médicos..." className="py-20" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadData} />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={doctors.length === 0 ? 'Nenhum médico cadastrado.' : 'Nenhum médico corresponde aos filtros.'}
          description="Cadastre profissionais de saúde para acompanhar o ciclo de visitas e estratégias PBM."
          action={doctors.length === 0 ? { label: '+ Novo Médico', onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredDoctors.map((doc) => {
            const isExported = !!exportSelected[doc.id];
            const updatedDateStr = new Date(doc.updatedAt).toLocaleString('pt-BR');
            const fullHosp = hospitals.find((h) => h.id === doc.hospitalId);
            const hospName = fullHosp?.name || doc.hospital?.name || 'Não vinculado a hospital';
            const hospAddress = fullHosp?.address
              ? `${fullHosp.address} - ${fullHosp.city || ''}, ${fullHosp.state || ''}`
              : doc.hospital?.city
              ? `${doc.hospital.name} (${doc.hospital.city})`
              : 'Endereço em levantamento';

            // Tags baseadas no nível cooperativo
            const tagLabel =
              doc.cooperativeLevel === 'COOPERATIVO'
                ? 'Cooperador, Consultor'
                : doc.cooperativeLevel === 'CONSULTIVO'
                ? 'Consultor'
                : doc.cooperativeLevel === 'RESTRITO'
                ? 'Restrito'
                : 'Triagem';

            return (
              <div
                key={doc.id}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300"
              >
                {/* Faixa Superior Azul Claro (#DDE5EE) com Nome e Opções */}
                <div className="bg-[#DDE5EE] px-5 py-3 flex items-center justify-between border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {doc.name}
                  </h3>

                  <div className="flex items-center gap-3">
                    {/* Botão Alternador "Exportar" */}
                    <button
                      type="button"
                      onClick={() => handleToggleExport(doc.id)}
                      className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900"
                    >
                      <span
                        className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${
                          isExported ? 'bg-[#1F619E] justify-end' : 'bg-slate-400 justify-start'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                      </span>
                      <span>Exportar</span>
                    </button>

                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(doc)}
                      className="p-1.5 text-slate-600 hover:text-[#1F619E] rounded-lg transition-colors"
                      title="Editar Médico"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Excluir */}
                    <button
                      type="button"
                      onClick={() => setDeletingDoctor(doc)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                      title="Excluir Médico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Corpo da Ficha com Dados em Grade conforme Foto 2 */}
                <div className="p-5 sm:p-6 bg-[#FAF9FD]/40 space-y-4 text-xs">
                  {/* Linha 1: Especialidades e Última Atualização */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Especialidades
                      </span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {doc.specialty}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Última Atualização
                      </span>
                      <span className="text-xs text-slate-700 mt-0.5 block font-mono">
                        {updatedDateStr}
                      </span>
                    </div>
                  </div>

                  {/* Linha 2: Telefones e E-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Telefone Consult.
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        {doc.phone || 'Não informado'}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Telefone Partic.
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        -
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        E-Mail
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block truncate">
                        {doc.email ? (
                          <a href={`mailto:${doc.email}`} className="text-[#1F619E] hover:underline">
                            {doc.email}
                          </a>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Linha 3: Hospitais e Convênios */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Hospitais
                      </span>
                      <span className="text-xs font-semibold text-slate-900 mt-0.5 block uppercase">
                        {hospName}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Convênios
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        Unimed, Bradesco Saúde, Particular
                      </span>
                    </div>
                  </div>

                  {/* Linha 4: Endereço e Tags */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Endereço
                      </span>
                      <span className="text-xs text-slate-700 mt-0.5 block">
                        {hospAddress}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Tags
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        {tagLabel}
                      </span>
                    </div>
                  </div>

                  {/* Linha 5: Observações e Observações Restritas (Histórico COLIH) */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Observação
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {doc.notes || 'Sem observações gerais registradas.'}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                          Observação Restrita / Histórico de Contato
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenVisitModal(doc)}
                          className="px-3 py-1 rounded-full bg-[#1F619E] hover:bg-[#184E7F] text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Agendar Visita</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed font-sans">
                        <p className="text-slate-600">
                          • CRM {doc.crm}/{doc.crmState} — Manejo Clínico Bioético (PBM) ativo.
                        </p>
                        <p className="text-slate-600">
                          • Contato realizado e informações seguem atualizadas pela comissão.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastrar / Editar Médico */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDoctor ? 'Editar Cadastro do Médico' : 'Cadastrar Novo Médico'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-semibold">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Dr. Wellerson de Aguiar Miranda"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Especialidade *
              </label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: Mastologia"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                CRM *
              </label>
              <input
                type="text"
                required
                value={crm}
                onChange={(e) => setCrm(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                UF do CRM *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={crmState}
                onChange={(e) => setCrmState(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Telefone Consultório
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(14) 3432-2299"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="medico@exemplo.com"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Hospital Principal Vinculado
            </label>
            <select
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            >
              <option value="">Nenhum hospital selecionado</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.city ? `(${h.city}/${h.state})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Nível Cooperativo (Tags)
            </label>
            <select
              value={cooperativeLevel}
              onChange={(e) => setCooperativeLevel(e.target.value as CooperativeLevel)}
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            >
              <option value="COOPERATIVO">Cooperador (Atende sem sangue e apoia PBM)</option>
              <option value="CONSULTIVO">Consultor (Aberto ao diálogo caso a caso)</option>
              <option value="EM_CONTATO">Em Triagem (Primeiro contato em andamento)</option>
              <option value="RESTRITO">Restrito (Apresenta restrições técnicas)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Observações Gerais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas gerais sobre o médico, secretária, preferências de literatura..."
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-full bg-[#1F619E] hover:bg-[#184E7F] text-white text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : editingDoctor ? 'Atualizar Médico' : 'Cadastrar Médico'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Agendar Visita Direta */}
      <Modal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        title={`Agendar Visita com Dr(a). ${visitingDoctor?.name || ''}`}
      >
        <form onSubmit={handleCreateVisitCard} className="space-y-4">
          {visitSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{visitSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Data Prevista da Visita *
            </label>
            <input
              type="date"
              required
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-3.5 py-2.5 neu-input text-sm font-bold text-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Esta visita será automaticamente sincronizada com o Google Agenda no celular do facilitador responsável!
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Facilitador Responsável
            </label>
            <select
              value={visitMemberId}
              onChange={(e) => setVisitMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            >
              <option value="">Selecione o membro...</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.user.name} ({m.title || m.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Hospital / Local do Encontro
            </label>
            <select
              value={visitHospitalId}
              onChange={(e) => setVisitHospitalId(e.target.value)}
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            >
              <option value="">Selecione o hospital...</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Objetivo e Pauta da Visita
            </label>
            <textarea
              rows={3}
              value={visitNotes}
              onChange={(e) => setVisitNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsVisitModalOpen(false)}
              className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingVisit}
              className="px-5 py-2 rounded-full bg-[#1F619E] hover:bg-[#184E7F] text-white text-xs font-bold disabled:opacity-50"
            >
              {isSubmittingVisit ? 'Criando e Sincronizando...' : 'Confirmar e Sincronizar Agenda'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!deletingDoctor}
        onClose={() => setDeletingDoctor(null)}
        onConfirm={handleDelete}
        title="Excluir Médico"
        message={`Deseja realmente excluir ${deletingDoctor?.name || 'este médico'} da base da comissão? Esta ação não pode ser desfeita.`}
        confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir Médico'}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
