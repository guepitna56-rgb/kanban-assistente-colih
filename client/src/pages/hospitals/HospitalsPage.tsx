import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { Hospital, HospitalType } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { ErrorAlert } from '../../components/ui/ErrorAlert.js';
import { Modal } from '../../components/ui/Modal.js';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.js';
import {
  Building2,
  Plus,
  Search,
  PhoneCall,
  Edit2,
  Trash2,
  ArrowUpDown,
  Download,
  MoreVertical,
} from 'lucide-react';

const HOSPITAL_TYPES: Record<
  HospitalType,
  { label: string; desc: string }
> = {
  PUBLICO: { label: 'Público / SUS', desc: 'Unidade com atendimento público.' },
  PRIVADO: { label: 'Privado', desc: 'Hospital particular ou rede conveniada.' },
  FILANTROPICO: { label: 'Filantrópico / Santa Casa', desc: 'Instituição filantrópica ou beneficente.' },
  UNIVERSITARIO: { label: 'Universitário / Ensino', desc: 'Hospital escola com corpo docente.' },
};

export const HospitalsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'NAME_ASC' | 'NAME_DESC' | 'DATE_DESC'>('NAME_ASC');

  // Estado de exportação por hospital
  const [exportSelected, setExportSelected] = useState<Record<string, boolean>>({});

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    type: 'PUBLICO' as HospitalType,
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingHospital, setDeletingHospital] = useState<Hospital | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHospitals = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/hospitals`);
      setHospitals(res.data.data.hospitals || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [workspaceId]);

  const handleOpenCreate = () => {
    setEditingHospital(null);
    setFormData({
      name: '',
      legalName: '',
      type: 'PUBLICO',
      address: '',
      city: '',
      state: 'SP',
      zipCode: '',
      phone: '',
      emergencyPhone: '',
      email: '',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hosp: Hospital) => {
    setEditingHospital(hosp);
    setFormData({
      name: hosp.name,
      legalName: hosp.legalName || '',
      type: hosp.type,
      address: hosp.address || '',
      city: hosp.city,
      state: hosp.state,
      zipCode: hosp.zipCode || '',
      phone: hosp.phone || '',
      emergencyPhone: hosp.emergencyPhone || '',
      email: hosp.email || '',
      notes: hosp.notes || '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingHospital) {
        await api.put(`/workspaces/${workspaceId}/hospitals/${editingHospital.id}`, formData);
      } else {
        await api.post(`/workspaces/${workspaceId}/hospitals`, formData);
      }
      setIsModalOpen(false);
      await loadHospitals();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId || !deletingHospital) return;
    setIsDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/hospitals/${deletingHospital.id}`);
      setDeletingHospital(null);
      await loadHospitals();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleExport = (hospId: string) => {
    setExportSelected((prev) => ({ ...prev, [hospId]: !prev[hospId] }));
  };

  // Filtragem e Ordenação
  const filteredHospitals = hospitals
    .filter((hosp) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm.trim() === '' ||
        hosp.name.toLowerCase().includes(q) ||
        hosp.city.toLowerCase().includes(q) ||
        (hosp.address && hosp.address.toLowerCase().includes(q)) ||
        (hosp.phone && hosp.phone.includes(q));

      const matchesType = selectedType === 'ALL' || hosp.type === selectedType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortOrder === 'NAME_DESC') return b.name.localeCompare(a.name);
      if (sortOrder === 'DATE_DESC') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Página com Botões Pílula estilo Foto 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Hospitais
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
                  ? `${selectedCount} hospital(is) marcado(s) para exportação.`
                  : 'Selecione os hospitais para exportar.'
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
            onClick={() => loadHospitals()}
            className="px-4 py-1.5 rounded-full border border-[#1F619E] text-[#1F619E] bg-white hover:bg-sky-50 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Atualizar lista"
          >
            <MoreVertical className="w-3.5 h-3.5" />
            <span>Opções</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros com Fundo Cinza-Azulado (#F4F3F7) */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-3 bg-[#F4F3F7] border border-transparent focus:border-[#1F619E] focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all font-medium"
          >
            <option value="ALL">Filtro de tipos de hospital</option>
            <option value="PUBLICO">Público / SUS</option>
            <option value="PRIVADO">Privado</option>
            <option value="FILANTROPICO">Filantrópico / Santa Casa</option>
            <option value="UNIVERSITARIO">Universitário / Ensino</option>
          </select>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome ou cidade"
              className="w-full pl-4 pr-11 py-3 bg-[#F4F3F7] border border-transparent focus:border-[#1F619E] focus:bg-white rounded-xl text-sm text-slate-700 outline-none transition-all font-medium placeholder-slate-400"
            />
            <Search className="w-5 h-5 absolute right-4 top-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Cabeçalho da Tabela: Nome e Opções */}
      <div className="flex items-center justify-between px-2 pt-2 text-xs font-bold text-slate-600">
        <span>Nome do Hospital</span>
        <span>Opções</span>
      </div>

      {/* Lista de Fichas Hospitalares */}
      {isLoading ? (
        <LoadingSpinner message="Carregando hospitais..." className="py-20" />
      ) : error ? (
        <ErrorAlert message={error} onRetry={loadHospitals} />
      ) : filteredHospitals.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hospitals.length === 0 ? 'Nenhum hospital cadastrado.' : 'Nenhum hospital corresponde aos filtros.'}
          description="Cadastre centros médicos para coordenar visitas de facilitadores da COLIH."
          action={hospitals.length === 0 ? { label: '+ Novo Hospital', onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredHospitals.map((hosp) => {
            const isExported = !!exportSelected[hosp.id];
            const typeConfig = HOSPITAL_TYPES[hosp.type] || HOSPITAL_TYPES.PUBLICO;

            return (
              <div
                key={hosp.id}
                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300"
              >
                {/* Faixa Superior Azul Claro (#DDE5EE) */}
                <div className="bg-[#DDE5EE] px-5 py-3 flex items-center justify-between border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight uppercase">
                    {hosp.name}
                  </h3>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleExport(hosp.id)}
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

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(hosp)}
                      className="p-1.5 text-slate-600 hover:text-[#1F619E] rounded-lg transition-colors"
                      title="Editar Hospital"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingHospital(hosp)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg transition-colors"
                      title="Excluir Hospital"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Corpo da Ficha */}
                <div className="p-5 sm:p-6 bg-[#FAF9FD]/40 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Classificação / Tipo
                      </span>
                      <span className="text-sm font-semibold text-slate-900 mt-0.5 block">
                        {typeConfig.label} ({typeConfig.desc})
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Localização
                      </span>
                      <span className="text-xs text-slate-800 mt-0.5 block font-semibold">
                        {hosp.city} - {hosp.state}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pb-3 border-b border-slate-100">
                    <div className="sm:col-span-8">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Endereço Completo
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        {hosp.address || 'Não cadastrado'} {hosp.zipCode ? `• CEP ${hosp.zipCode}` : ''}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Telefone Principal
                      </span>
                      <span className="text-xs text-slate-800 font-medium mt-0.5 block">
                        {hosp.phone || 'Não informado'}
                      </span>
                    </div>
                  </div>

                  {hosp.emergencyPhone && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall className="w-4 h-4 text-rose-600" />
                        <div>
                          <span className="text-[10px] font-bold text-rose-700 uppercase block">
                            Plantão / Urgência 24h
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {hosp.emergencyPhone}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`tel:${hosp.emergencyPhone.replace(/\D/g, '')}`}
                        className="px-3 py-1 rounded-full bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700"
                      >
                        Ligar
                      </a>
                    </div>
                  )}

                  {hosp.notes && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Observações da Comissão
                      </span>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {hosp.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastrar / Editar Hospital */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHospital ? 'Editar Hospital' : 'Cadastrar Novo Hospital'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-red-100 text-red-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Nome da Unidade Hospitalar *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Santa Casa de Misericórdia de Marília"
              className="w-full px-3.5 py-2.5 neu-input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Tipo / Natureza *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as HospitalType })}
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              >
                <option value="PUBLICO">Público / SUS</option>
                <option value="PRIVADO">Privado</option>
                <option value="FILANTROPICO">Filantrópico / Santa Casa</option>
                <option value="UNIVERSITARIO">Universitário / Ensino</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Cidade *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Marília"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Ex: Av. Vicente Ferreira, 828"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                UF *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                placeholder="SP"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Telefone Recepção
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(14) 3402-5555"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                Telefone Plantão / Urgência
              </label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="(14) 3402-5500"
                className="w-full px-3.5 py-2.5 neu-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
              Observações
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Instruções para acesso de facilitadores, horários de visita..."
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
              {isSubmitting ? 'Salvando...' : editingHospital ? 'Atualizar Hospital' : 'Cadastrar Hospital'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!deletingHospital}
        onClose={() => setDeletingHospital(null)}
        onConfirm={handleDelete}
        title="Excluir Hospital"
        message={`Deseja realmente excluir ${deletingHospital?.name || 'este hospital'}? Médicos e visitas associadas perderão o vínculo.`}
        confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir Hospital'}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};
