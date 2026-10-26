import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../api/client.js';
import { Doctor, Hospital, WorkspaceMember, Board } from '../../types/index.js';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.js';
import { Modal } from '../../components/ui/Modal.js';
import {
  RotateCcw,
  CheckCircle2,
  Calendar,
  Search,
  Building2,
  FolderKanban,
  AlertTriangle,
  FileCheck2,
  Send,
  Users,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  HeartHandshake,
  CalendarClock,
  Check,
  X,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Info,
  CalendarDays,
  UserCheck,
} from 'lucide-react';

interface KanbanCardSummary {
  id: string;
  title: string;
  listId: string;
  listTitle?: string;
  statusBadge?: string;
  completed?: boolean;
  dueDate?: string | null;
  startDate?: string | null;
  updatedAt: string;
  doctorId?: string | null;
  checklistItems?: { id: string; title: string; isDone: boolean }[];
  assignedMember?: {
    id: string;
    user: { id: string; name: string };
  } | null;
}

export const FacilitatorsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [cards, setCards] = useState<KanbanCardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Periodicidade do Ciclo (em meses)
  const [recurrenceMonths, setRecurrenceMonths] = useState<number>(() => {
    const saved = localStorage.getItem(`colih_recurrence_${workspaceId}`);
    return saved ? parseInt(saved, 10) : 6; // Padrão COLIH: 6 meses
  });
  const [isCustomRecurrenceOpen, setIsCustomRecurrenceOpen] = useState(false);
  const [customRecurrenceInput, setCustomRecurrenceInput] = useState<string>('6');

  // Filtros & Ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('ALL');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'DUE_SOON' | 'DUE_RESTART' | 'COMPLETED'>('ALL');
  const [sortBy, setSortBy] = useState<'URGENCY' | 'NAME' | 'SPECIALTY'>('URGENCY');

  // Modal de Reinício de Ciclo
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [targetDoctor, setTargetDoctor] = useState<Doctor | null>(null);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [visitDueDate, setVisitDueDate] = useState<string>('');
  const [visitNotes, setVisitNotes] = useState<string>('');
  const [isSubmittingRestart, setIsSubmittingRestart] = useState(false);
  const [restartSuccessMsg, setRestartSuccessMsg] = useState<string | null>(null);
  const [restartError, setRestartError] = useState<string | null>(null);

  // Modal Rápido de Alteração/Definição de Prazo da Visita
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [doctorForDueDate, setDoctorForDueDate] = useState<Doctor | null>(null);
  const [activeCardForDueDate, setActiveCardForDueDate] = useState<KanbanCardSummary | null>(null);
  const [editingDueDateVal, setEditingDueDateVal] = useState<string>('');
  const [isSavingDueDate, setIsSavingDueDate] = useState(false);
  const [dueDateSuccessMsg, setDueDateSuccessMsg] = useState<string | null>(null);
  const [dueDateError, setDueDateError] = useState<string | null>(null);

  // Feedback Toast Rápido
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Salvar preferência de recorrência
  const handleRecurrenceChange = (months: number) => {
    const valid = Math.max(1, months);
    setRecurrenceMonths(valid);
    setCustomRecurrenceInput(valid.toString());
    if (workspaceId) {
      localStorage.setItem(`colih_recurrence_${workspaceId}`, valid.toString());
    }
    showToast(`Periodicidade atualizada: renovação a cada ${valid} meses.`);
  };

  const loadData = async (silent = false) => {
    if (!workspaceId) return;
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const [docRes, hospRes, membRes, boardRes] = await Promise.all([
        api.get(`/workspaces/${workspaceId}/doctors`),
        api.get(`/workspaces/${workspaceId}/hospitals`),
        api.get(`/workspaces/${workspaceId}/members`),
        api.get(`/workspaces/${workspaceId}/boards`),
      ]);

      const loadedDoctors: Doctor[] = docRes.data.data.doctors || [];
      const loadedHospitals: Hospital[] = hospRes.data.data.hospitals || [];
      const loadedMembers: WorkspaceMember[] = membRes.data.data.members || [];
      const loadedBoards: Board[] = boardRes.data.data.boards || [];

      setDoctors(loadedDoctors);
      setHospitals(loadedHospitals);
      setMembers(loadedMembers);
      setBoards(loadedBoards);

      // Carregar cards de todos os quadros para mapear o ciclo ativo de cada médico
      const allCards: KanbanCardSummary[] = [];
      for (const b of loadedBoards) {
        try {
          const detailRes = await api.get(`/workspaces/${workspaceId}/boards/${b.id}`);
          const boardDetail = detailRes.data.data.board;
          if (boardDetail.lists) {
            for (const list of boardDetail.lists) {
              if (list.cards) {
                for (const c of list.cards) {
                  allCards.push({
                    id: c.id,
                    title: c.title,
                    listId: list.id,
                    listTitle: list.title,
                    statusBadge: c.statusBadge,
                    completed: c.completed || c.statusBadge?.toLowerCase().includes('conclu') || list.title.toLowerCase().includes('conclu'),
                    dueDate: c.dueDate,
                    startDate: c.startDate,
                    updatedAt: c.updatedAt,
                    doctorId: c.doctorId,
                    checklistItems: c.checklistItems,
                    assignedMember: c.assignedMember,
                  });
                }
              }
            }
          }
        } catch (err) {
          console.warn(`Falha ao ler cartões do quadro ${b.id}:`, err);
        }
      }
      setCards(allCards);

      if (loadedBoards.length > 0 && !selectedBoardId) {
        setSelectedBoardId(loadedBoards[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  // Cálculo Dinâmico do Estado do Ciclo e Prazos para um médico
  const getDoctorCycleState = (doctor: Doctor) => {
    const doctorCards = cards.filter((c) => c.doctorId === doctor.id);
    const activeCard = doctorCards.find((c) => !c.completed);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (activeCard) {
      const items = activeCard.checklistItems || [];
      const completedItems = items.filter((i) => i.isDone).length;
      const totalItems = items.length > 0 ? items.length : 4;

      let stage = 1;
      let stageName = '1. Agendamento da Visita';
      if (completedItems >= 3) {
        stage = 4;
        stageName = '4. Envio de Matérias Médicas';
      } else if (completedItems >= 2) {
        stage = 3;
        stageName = '3. Recolhimento do HLC-31';
      } else if (completedItems >= 1) {
        stage = 2;
        stageName = '2. Visita Presencial';
      }

      let daysRemaining: number | null = null;
      let isOverdue = false;
      let isDueToday = false;
      let isDueSoon = false;
      const dueDateObj = activeCard.dueDate ? new Date(activeCard.dueDate) : null;

      if (dueDateObj) {
        const target = new Date(dueDateObj);
        target.setHours(0, 0, 0, 0);
        daysRemaining = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        isOverdue = daysRemaining < 0;
        isDueToday = daysRemaining === 0;
        isDueSoon = daysRemaining > 0 && daysRemaining <= 7;
      }

      return {
        status: 'ACTIVE' as const,
        stage,
        stageName,
        card: activeCard,
        progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 25,
        completedItems,
        totalItems,
        lastCompletedDate: null,
        nextDueDate: dueDateObj,
        daysRemaining,
        isOverdue,
        isDueToday,
        isDueSoon,
      };
    }

    // Se não há card ativo, verifica o último card concluído
    const completedCards = doctorCards
      .filter((c) => c.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if (completedCards.length > 0) {
      const last = completedCards[0];
      const lastDate = new Date(last.updatedAt);
      
      // Próxima visita esperada = última data + periodicidade estipulada
      const nextExpected = new Date(lastDate);
      nextExpected.setMonth(nextExpected.getMonth() + recurrenceMonths);
      nextExpected.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.round((nextExpected.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const isDueForRestart = daysDiff <= 0;

      return {
        status: isDueForRestart ? ('DUE_RESTART' as const) : ('COMPLETED' as const),
        stage: 5,
        stageName: isDueForRestart ? 'Ciclo Vencido (Necessita Reinício)' : 'Ciclo Concluído (Em Intervalo)',
        card: last,
        progress: 100,
        completedItems: 4,
        totalItems: 4,
        lastCompletedDate: lastDate,
        nextDueDate: nextExpected,
        daysRemaining: daysDiff,
        isOverdue: isDueForRestart,
        isDueToday: daysDiff === 0,
        isDueSoon: daysDiff > 0 && daysDiff <= 15,
      };
    }

    // Nunca visitado
    return {
      status: 'NEVER_VISITED' as const,
      stage: 0,
      stageName: 'Ciclo Não Iniciado',
      card: null,
      progress: 0,
      completedItems: 0,
      totalItems: 4,
      lastCompletedDate: null,
      nextDueDate: null,
      daysRemaining: null,
      isOverdue: false,
      isDueToday: false,
      isDueSoon: false,
    };
  };

  // Alternar conclusão de etapa de checklist diretamente no card
  const handleToggleChecklistItem = async (cardId: string, itemId: string, currentDone: boolean) => {
    // Atualização otimista
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const updatedItems = (c.checklistItems || []).map((it) =>
          it.id === itemId ? { ...it, isDone: !currentDone } : it
        );
        return { ...c, checklistItems: updatedItems };
      })
    );

    try {
      await api.patch(`/workspaces/${workspaceId}/boards/checklist-items/${itemId}`, {
        isDone: !currentDone,
      });
      showToast(currentDone ? 'Etapa reaberta.' : 'Etapa concluída com sucesso!');
    } catch (err) {
      console.error('Falha ao alternar checklist:', err);
      showToast('Não foi possível atualizar a etapa. Recarregando...');
      await loadData(true);
    }
  };

  // Gerar checklist canônico dos 4 passos caso o card não o possua
  const handleGenerateCanonicalChecklist = async (cardId: string, doctorName: string) => {
    try {
      const canonical = [
        `1. Agendar visita com Dr(a). ${doctorName}`,
        `2. Realizar visita presencial pelos facilitadores COLIH`,
        `3. Recolher formulário HLC-31 preenchido e assinado`,
        `4. Enviar e-mail formal com matérias e literatura científica PBM`,
      ];
      for (const title of canonical) {
        await api.post(`/workspaces/${workspaceId}/boards/cards/${cardId}/checklist-items`, { title });
      }
      showToast('Checklist dos 4 passos canônicos inserido no cartão!');
      await loadData(true);
    } catch (err) {
      console.error(err);
      showToast('Erro ao gerar checklist canônico.');
    }
  };

  // Abrir Modal Rápido de Alteração/Definição de Prazo da Visita
  const handleOpenDueDateModal = (doctor: Doctor) => {
    const cycle = getDoctorCycleState(doctor);
    setDoctorForDueDate(doctor);
    setActiveCardForDueDate(cycle.card);
    
    if (cycle.card?.dueDate) {
      setEditingDueDateVal(cycle.card.dueDate.split('T')[0]);
    } else {
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 15); // Sugere 15 dias para visita
      setEditingDueDateVal(defaultDate.toISOString().split('T')[0]);
    }

    setDueDateError(null);
    setDueDateSuccessMsg(null);
    setIsDueDateModalOpen(true);
  };

  // Salvar Prazo da Visita
  const handleSaveDueDate = async (customDateStr?: string) => {
    if (!workspaceId || !doctorForDueDate) return;
    setIsSavingDueDate(true);
    setDueDateError(null);
    setDueDateSuccessMsg(null);

    const targetDate = customDateStr !== undefined ? customDateStr : editingDueDateVal;

    try {
      if (activeCardForDueDate) {
        // Atualiza prazo no cartão ativo do Kanban
        await api.patch(`/workspaces/${workspaceId}/boards/cards/${activeCardForDueDate.id}`, {
          dueDate: targetDate ? new Date(targetDate).toISOString() : null,
        });
        setDueDateSuccessMsg('Prazo da visita atualizado com sucesso!');
      } else {
        // Se ainda não tem card ativo, inicia o ciclo com este prazo
        const targetBoard = boards[0];
        if (!targetBoard) throw new Error('Nenhum quadro de ações encontrado.');

        const boardDetailRes = await api.get(`/workspaces/${workspaceId}/boards/${targetBoard.id}`);
        const boardLists = boardDetailRes.data.data.board.lists || [];
        const targetList =
          boardLists.find((l: any) => l.title.toLowerCase().includes('agend')) ||
          boardLists.find((l: any) => l.title.toLowerCase().includes('visita')) ||
          boardLists[0];

        if (!targetList) throw new Error('Nenhuma coluna disponível no quadro.');

        const hosp = hospitals.find((h) => h.id === doctorForDueDate.hospitalId);
        const hospitalTag = hosp ? hosp.name.slice(0, 8).toUpperCase().replace(/\s+/g, '-') : 'COLIH';

        const canonicalChecklist = [
          `1. Agendar visita com Dr(a). ${doctorForDueDate.name}`,
          `2. Realizar visita presencial pelos facilitadores COLIH`,
          `3. Recolher formulário HLC-31 preenchido e assinado`,
          `4. Enviar e-mail formal com matérias e artigos científicos PBM`,
        ];

        await api.post(`/workspaces/${workspaceId}/boards/cards`, {
          listId: targetList.id,
          title: `Visita COLIH: Dr(a). ${doctorForDueDate.name} (${doctorForDueDate.specialty})`,
          description: `Ciclo de visitas programado com prazo estipulado para ${new Date(targetDate).toLocaleDateString('pt-BR')}.`,
          priority: 'ALTA',
          dueDate: targetDate ? new Date(targetDate).toISOString() : null,
          hospitalId: doctorForDueDate.hospitalId || null,
          doctorId: doctorForDueDate.id,
          tag: hospitalTag,
          statusBadge: 'Prazo Estipulado',
          cardCategory: 'VISITA',
          checklistItems: canonicalChecklist,
        });

        setDueDateSuccessMsg('Ciclo iniciado com o prazo estipulado no quadro de ações!');
      }

      await loadData(true);
      setTimeout(() => {
        setIsDueDateModalOpen(false);
      }, 900);
    } catch (err) {
      setDueDateError(getErrorMessage(err));
    } finally {
      setIsSavingDueDate(false);
    }
  };

  // Abrir Modal de Reinício do Processo Completo
  const handleOpenRestartModal = (doc: Doctor) => {
    setTargetDoctor(doc);
    setSelectedBoardId(boards[0]?.id || '');
    setSelectedMemberId(members[0]?.id || '');
    
    // Sugere prazo de 30 dias para completar o novo ciclo
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 30);
    setVisitDueDate(defaultDue.toISOString().split('T')[0]);

    setVisitNotes(
      `Novo ciclo protocolar de visita COLIH com Dr(a). ${doc.name} (${doc.specialty}). Apresentação contínua de estratégias sem sangue (PBM), recolhimento do formulário HLC-31 atualizado e envio de literatura médica.`
    );
    setRestartError(null);
    setRestartSuccessMsg(null);
    setIsRestartModalOpen(true);
  };

  // Executar o Reinício do Processo
  const handleExecuteRestart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !targetDoctor) return;

    setIsSubmittingRestart(true);
    setRestartError(null);
    setRestartSuccessMsg(null);

    try {
      const boardDetailRes = await api.get(`/workspaces/${workspaceId}/boards/${selectedBoardId}`);
      const boardLists = boardDetailRes.data.data.board.lists || [];
      
      const targetList =
        boardLists.find((l: any) => l.title.toLowerCase().includes('agend')) ||
        boardLists.find((l: any) => l.title.toLowerCase().includes('visita')) ||
        boardLists[0];

      if (!targetList) {
        throw new Error('Nenhuma coluna disponível no quadro selecionado para criar a demanda.');
      }

      const hosp = hospitals.find((h) => h.id === targetDoctor.hospitalId);
      const hospitalTag = hosp ? hosp.name.slice(0, 8).toUpperCase().replace(/\s+/g, '-') : 'COLIH';

      const canonicalChecklist = [
        `1. Agendar visita com Dr(a). ${targetDoctor.name}`,
        `2. Realizar visita presencial pelos facilitadores COLIH`,
        `3. Recolher formulário HLC-31 preenchido e assinado`,
        `4. Enviar e-mail formal com matérias e artigos científicos PBM`,
      ];

      const payload = {
        listId: targetList.id,
        title: `Visita COLIH: Dr(a). ${targetDoctor.name} (${targetDoctor.specialty})`,
        description: visitNotes.trim(),
        priority: 'ALTA',
        dueDate: visitDueDate ? new Date(visitDueDate).toISOString() : null,
        assignedMemberId: selectedMemberId || null,
        hospitalId: targetDoctor.hospitalId || null,
        doctorId: targetDoctor.id,
        tag: hospitalTag,
        statusBadge: 'Novo Ciclo Iniciado',
        cardCategory: 'VISITA',
        checklistItems: canonicalChecklist,
      };

      await api.post(`/workspaces/${workspaceId}/boards/cards`, payload);

      setRestartSuccessMsg('Ciclo reiniciado com sucesso! O cartão com o prazo e os 4 passos já está no quadro.');
      setTimeout(async () => {
        setIsRestartModalOpen(false);
        await loadData(true);
        showToast('Novo ciclo iniciado com sucesso no quadro de ações!');
      }, 1100);
    } catch (err) {
      setRestartError(getErrorMessage(err));
    } finally {
      setIsSubmittingRestart(false);
    }
  };

  // Filtragem e Ordenação
  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        const matchesSearch =
          searchQuery.trim() === '' ||
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.crm.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesHospital = selectedHospitalId === 'ALL' || doc.hospitalId === selectedHospitalId;

        const cycle = getDoctorCycleState(doc);
        let matchesCycle = true;
        if (selectedCycleFilter === 'ACTIVE') {
          matchesCycle = cycle.status === 'ACTIVE';
        } else if (selectedCycleFilter === 'OVERDUE') {
          matchesCycle = cycle.isOverdue && (cycle.status === 'ACTIVE' || cycle.status === 'DUE_RESTART');
        } else if (selectedCycleFilter === 'DUE_SOON') {
          matchesCycle = !!cycle.isDueSoon;
        } else if (selectedCycleFilter === 'DUE_RESTART') {
          matchesCycle = cycle.status === 'DUE_RESTART' || cycle.status === 'NEVER_VISITED';
        } else if (selectedCycleFilter === 'COMPLETED') {
          matchesCycle = cycle.status === 'COMPLETED';
        }

        return matchesSearch && matchesHospital && matchesCycle;
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') {
          return a.name.localeCompare(b.name, 'pt-BR');
        }
        if (sortBy === 'SPECIALTY') {
          return a.specialty.localeCompare(b.specialty, 'pt-BR');
        }
        // Padrão: URGENCY (Atrasados > Vencendo hoje > Vencendo em breve > Outros)
        const cycleA = getDoctorCycleState(a);
        const cycleB = getDoctorCycleState(b);

        const scoreA = cycleA.isOverdue ? 100 : cycleA.isDueToday ? 80 : cycleA.isDueSoon ? 60 : cycleA.status === 'DUE_RESTART' ? 40 : cycleA.status === 'ACTIVE' ? 30 : 10;
        const scoreB = cycleB.isOverdue ? 100 : cycleB.isDueToday ? 80 : cycleB.isDueSoon ? 60 : cycleB.status === 'DUE_RESTART' ? 40 : cycleB.status === 'ACTIVE' ? 30 : 10;

        return scoreB - scoreA;
      });
  }, [doctors, cards, searchQuery, selectedHospitalId, selectedCycleFilter, sortBy, recurrenceMonths]);

  // Métricas Consolidadas
  const totalDoctors = doctors.length;
  const activeCount = doctors.filter((d) => getDoctorCycleState(d).status === 'ACTIVE').length;
  const overdueCount = doctors.filter((d) => {
    const c = getDoctorCycleState(d);
    return c.isOverdue && (c.status === 'ACTIVE' || c.status === 'DUE_RESTART');
  }).length;
  const dueSoonCount = doctors.filter((d) => getDoctorCycleState(d).isDueSoon).length;
  const completedCount = doctors.filter((d) => getDoctorCycleState(d).status === 'COMPLETED').length;
  const dueRestartCount = doctors.filter((d) => {
    const s = getDoctorCycleState(d).status;
    return s === 'DUE_RESTART' || s === 'NEVER_VISITED';
  }).length;

  if (isLoading) {
    return <LoadingSpinner message="Carregando assistente de ciclos e prazos de visitas..." />;
  }

  return (
    <div className="space-y-6 text-slate-800 pb-16">
      {/* Toast Notificação Flutuante */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 text-sm font-semibold border border-slate-700">
          <Sparkles className="w-4 h-4 text-brand-400 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadData(true)} className="neu-btn px-3 py-1 text-xs font-bold text-rose-800">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Cabeçalho da Página estilo Assistente COLIH */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-10 h-10 rounded-2xl bg-[#1F619E] text-white flex items-center justify-center shadow-sm font-bold">
              <HeartHandshake className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ciclo de Visitas &amp; Prazos COLIH
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-[#1F619E] border border-sky-200">
              Assistente Protocolar
            </span>

            <Link
              to={`/workspaces/${workspaceId}/members`}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-[#1F619E] border border-slate-300 hover:border-[#1F619E] flex items-center gap-2 rounded-full transition-all"
              title="Acessar Gestão de Facilitadores e Integrantes"
            >
              <Users className="w-4 h-4 text-[#1F619E]" />
              <span>Gestão da Equipe</span>
            </Link>

            <button
              type="button"
              disabled={isRefreshing}
              onClick={() => loadData(true)}
              className="p-2 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-full transition-all"
              title="Recarregar dados em tempo real"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#1F619E]' : ''}`} />
            </button>
          </div>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            Controle automatizado das 4 etapas de visita médica presencial, alertas em tempo real de prazos e reinício periódico estipulado de acompanhamento.
          </p>
        </div>

        {/* Card Seletor Dinâmico de Periodicidade */}
        <div className="bg-[#F4F3F7] p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 self-stretch lg:self-center border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#1F619E] flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Renovação Periódica
              </span>
              <span className="text-sm font-bold text-slate-900">
                A cada: <strong className="text-[#1F619E] font-extrabold">{recurrenceMonths} {recurrenceMonths === 1 ? 'mês' : 'meses'}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { months: 1, label: '1 Mês' },
              { months: 3, label: '3 Meses' },
              { months: 6, label: '6 Meses (Padrão)' },
              { months: 12, label: '1 Ano' },
            ].map((p) => (
              <button
                key={p.months}
                type="button"
                onClick={() => handleRecurrenceChange(p.months)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  recurrenceMonths === p.months
                    ? 'bg-[#1F619E] text-white shadow-sm'
                    : 'border border-slate-300 text-slate-700 hover:border-[#1F619E] hover:text-[#1F619E] bg-white'
                }`}
                title={`Configurar retorno para cada ${p.months} meses`}
              >
                {p.label}
              </button>
            ))}

            {isCustomRecurrenceOpen ? (
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-300 shadow-xs">
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={customRecurrenceInput}
                  onChange={(e) => setCustomRecurrenceInput(e.target.value)}
                  className="w-14 px-2 py-1 text-xs text-center font-bold border border-slate-300 rounded-full"
                />
                <span className="text-xs font-bold text-slate-500 px-0.5">m</span>
                <button
                  type="button"
                  onClick={() => {
                    const parsed = parseInt(customRecurrenceInput, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      handleRecurrenceChange(parsed);
                      setIsCustomRecurrenceOpen(false);
                    }
                  }}
                  className="px-3 py-1 bg-[#1F619E] text-white text-xs font-bold rounded-full hover:bg-[#1A5285]"
                >
                  OK
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCustomRecurrenceOpen(true)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-full bg-white"
                title="Digitar período personalizado"
              >
                Personalizado...
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Métricas Operacionais e Prazos (6 KPIs Interativos) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total */}
        <div
          onClick={() => setSelectedCycleFilter('ALL')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'ALL' ? 'ring-2 ring-brand-500 bg-brand-50/20' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Total</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">{totalDoctors}</span>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Médicos na base</p>
          </div>
        </div>

        {/* Em Andamento */}
        <div
          onClick={() => setSelectedCycleFilter('ACTIVE')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'ACTIVE' ? 'ring-2 ring-amber-500 bg-amber-50/30' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-700 uppercase tracking-wider">Em Andamento</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-800 font-mono tracking-tight">{activeCount}</span>
            <p className="text-xs font-medium text-amber-700/80 mt-0.5">Visitas ativas</p>
          </div>
        </div>

        {/* Visitas Atrasadas */}
        <div
          onClick={() => setSelectedCycleFilter('OVERDUE')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'OVERDUE'
              ? 'ring-2 ring-rose-500 bg-rose-50/70 border-rose-300'
              : overdueCount > 0
              ? 'bg-rose-50/40 border border-rose-200'
              : ''
          }`}
          title="Clique para filtrar apenas visitas com prazos vencidos"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1">
              {overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />}
              <span>Atrasadas</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-3xl font-black font-mono tracking-tight ${overdueCount > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
              {overdueCount}
            </span>
            <p className="text-xs font-bold text-rose-600 mt-0.5">Prazo expirado</p>
          </div>
        </div>

        {/* Vencendo em Breve */}
        <div
          onClick={() => setSelectedCycleFilter('DUE_SOON')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'DUE_SOON' ? 'ring-2 ring-orange-500 bg-orange-50/30' : ''
          }`}
          title="Clique para filtrar visitas com prazo nos próximos 7 dias"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-orange-700 uppercase tracking-wider">Vencendo em 7d</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-orange-800 font-mono tracking-tight">{dueSoonCount}</span>
            <p className="text-xs font-medium text-orange-700/80 mt-0.5">Atenção imediata</p>
          </div>
        </div>

        {/* Em Dia / Concluídas */}
        <div
          onClick={() => setSelectedCycleFilter('COMPLETED')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'COMPLETED' ? 'ring-2 ring-emerald-500 bg-emerald-50/30' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Em Dia</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-800 font-mono tracking-tight">{completedCount}</span>
            <p className="text-xs font-medium text-emerald-700/80 mt-0.5">Em intervalo regular</p>
          </div>
        </div>

        {/* Aguardando Reinício */}
        <div
          onClick={() => setSelectedCycleFilter('DUE_RESTART')}
          className={`neu-card p-4 rounded-2xl flex flex-col justify-between cursor-pointer transition-all hover:scale-101 ${
            selectedCycleFilter === 'DUE_RESTART' ? 'ring-2 ring-indigo-500 bg-indigo-50/30' : ''
          }`}
          title="Clique para filtrar médicos cujo período expirou e necessitam de novo agendamento"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Aguardando Reinício</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-indigo-800 font-mono tracking-tight">{dueRestartCount}</span>
            <p className="text-xs font-medium text-indigo-700/80 mt-0.5">Prontos p/ novo ciclo</p>
          </div>
        </div>
      </div>

      {/* Stepper Pipeline: Ciclo Canônico COLIH (5 Fases Conectadas) */}
      <div className="neu-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-300/40 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              O Pipeline do Ciclo Canônico de Visitas COLIH
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-brand-600" />
            Renovação contínua a cada {recurrenceMonths} meses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
          {/* Etapa 1 */}
          <div className="neu-card p-4 rounded-2xl border-t-4 border-t-amber-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs">
                  1
                </span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Agendamento</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Contato prévio com o cooperador e fixação da data limite da visita presencial.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              <span>Etapa Inicial</span>
              <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="neu-card p-4 rounded-2xl border-t-4 border-t-blue-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-extrabold text-xs">
                  2
                </span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Visita Presencial</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Facilitadores realizam visita técnica e apresentam os recursos e alternativas PBM.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              <span>Diálogo Clínico</span>
              <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="neu-card p-4 rounded-2xl border-t-4 border-t-indigo-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-extrabold text-xs">
                  3
                </span>
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Coleta do HLC-31</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Recolhimento formal do formulário HLC-31 preenchido e devidamente assinado.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
              <span>Diretiva Formal</span>
              <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
            </div>
          </div>

          {/* Etapa 4 */}
          <div className="neu-card p-4 rounded-2xl border-t-4 border-t-teal-500 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">
                  4
                </span>
                <Send className="w-4 h-4 text-teal-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Envio de Matérias</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Envio formal por e-mail com matérias médicas e literatura científica PBM atualizada.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px] font-bold text-teal-700 flex items-center gap-1">
              <span>Fechamento</span>
              <ArrowRight className="w-3 h-3 ml-auto text-slate-400" />
            </div>
          </div>

          {/* Etapa 5 */}
          <div className="neu-card p-4 rounded-2xl border-t-4 border-t-emerald-500 bg-emerald-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-extrabold text-xs">
                  5
                </span>
                <RotateCcw className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Conclusão &amp; Reinício</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Ciclo concluído. O assistente monitora o intervalo de {recurrenceMonths} meses até novo agendamento.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
              <span>Renovação Contínua</span>
              <RotateCcw className="w-3 h-3 ml-auto text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Busca e Ordenação */}
      <div className="neu-panel p-5 rounded-3xl flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por médico, especialidade, CRM ou hospital..."
              className="w-full pl-11 pr-10 py-2.5 neu-input text-sm font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Filtro de Hospital */}
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="neu-input text-sm font-semibold py-2.5 px-3 min-w-[200px]"
            >
              <option value="ALL">Todos os Hospitais ({hospitals.length})</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.city ? `(${h.city})` : ''}
                </option>
              ))}
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="neu-input text-sm font-semibold py-2.5 px-3"
              title="Critério de Ordenação"
            >
              <option value="URGENCY">Ordenar: Urgência de Prazo</option>
              <option value="NAME">Ordenar: Nome do Médico (A-Z)</option>
              <option value="SPECIALTY">Ordenar: Especialidade</option>
            </select>
          </div>
        </div>

        {/* Abas de Filtros de Ciclos & Prazos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-slate-300/40 pt-3">
          {[
            { key: 'ALL', label: 'Todos os Médicos', count: totalDoctors, icon: Users },
            { key: 'ACTIVE', label: 'Em Andamento', count: activeCount, icon: Clock },
            { key: 'OVERDUE', label: '🚨 Atrasadas', count: overdueCount, icon: AlertCircle, danger: overdueCount > 0 },
            { key: 'DUE_SOON', label: '⏳ Vencendo em 7d', count: dueSoonCount, icon: CalendarClock },
            { key: 'COMPLETED', label: 'Em Dia (Concluídos)', count: completedCount, icon: CheckCircle2 },
            { key: 'DUE_RESTART', label: 'Aguardando Reinício', count: dueRestartCount, icon: RotateCcw },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCycleFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCycleFilter(tab.key as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'neu-btn-primary bg-brand-600 text-white shadow-sm'
                    : tab.danger
                    ? 'neu-btn text-rose-700 bg-rose-50/50 hover:bg-rose-100 border-rose-200'
                    : 'neu-btn text-slate-700 hover:text-slate-950'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.danger ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}

          {(selectedHospitalId !== 'ALL' || searchQuery || selectedCycleFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSelectedHospitalId('ALL');
                setSearchQuery('');
                setSelectedCycleFilter('ALL');
              }}
              className="text-xs font-bold text-brand-600 hover:text-brand-800 ml-auto whitespace-nowrap hover:underline px-2"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de Médicos com Controle Detalhado e Ações Interativas */}
      <div className="space-y-4">
        {filteredDoctors.length === 0 ? (
          <div className="neu-panel p-12 text-center text-slate-500 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800">Nenhum médico encontrado</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Não encontramos nenhum médico correspondente aos filtros de busca ou estágio selecionados.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedHospitalId('ALL');
                setSearchQuery('');
                setSelectedCycleFilter('ALL');
              }}
              className="neu-btn px-4 py-2 text-xs font-bold text-slate-700 rounded-xl mt-2"
            >
              Ver todos os médicos
            </button>
          </div>
        ) : (
          filteredDoctors.map((doc) => {
            const cycle = getDoctorCycleState(doc);
            const hosp = hospitals.find((h) => h.id === doc.hospitalId);
            const activeCard = cycle.card;

            return (
              <div
                key={doc.id}
                className={`rounded-2xl border bg-white overflow-hidden shadow-sm transition-all hover:border-slate-300 ${
                  cycle.isOverdue && cycle.status === 'ACTIVE'
                    ? 'border-rose-300 ring-1 ring-rose-300'
                    : cycle.status === 'DUE_RESTART'
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Faixa Superior Azul Claro (#DDE5EE) com Nome, CRM, Especialidade e Status */}
                <div className="bg-[#DDE5EE] px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                      Dr(a). {doc.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 font-mono text-xs font-bold border border-slate-300">
                      CRM {doc.crm} ({doc.crmState})
                    </span>
                    <span className="px-3 py-0.5 rounded-full bg-[#1F619E]/10 text-[#1F619E] text-xs font-bold border border-[#1F619E]/20">
                      {doc.specialty}
                    </span>
                  </div>

                  {/* Badge de Prazo / Status do Ciclo */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {cycle.status === 'ACTIVE' ? (
                      cycle.nextDueDate ? (
                        cycle.isOverdue ? (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-xs border border-rose-300 animate-pulse flex items-center gap-1.5 shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            Atrasada ({Math.abs(cycle.daysRemaining || 0)}d • Prazo: {cycle.nextDueDate.toLocaleDateString('pt-BR')})
                          </span>
                        ) : cycle.isDueToday ? (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-black text-xs border border-amber-300 flex items-center gap-1.5 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                            ⚡ Vence Hoje! ({cycle.nextDueDate.toLocaleDateString('pt-BR')})
                          </span>
                        ) : cycle.isDueSoon ? (
                          <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-900 font-extrabold text-xs border border-orange-300 flex items-center gap-1.5 shadow-xs">
                            <Clock className="w-3.5 h-3.5 text-orange-700" />
                            Vence em {cycle.daysRemaining} dias ({cycle.nextDueDate.toLocaleDateString('pt-BR')})
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-white text-slate-800 font-bold text-xs border border-slate-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#1F619E]" />
                            Prazo: {cycle.nextDueDate.toLocaleDateString('pt-BR')} (faltam {cycle.daysRemaining}d)
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenDueDateModal(doc)}
                          className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-dashed border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
                          title="Clique para estipular o prazo limite desta visita"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-amber-600" />
                          <span>+ Estipular Prazo Limite</span>
                        </button>
                      )
                    ) : cycle.status === 'COMPLETED' ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Ciclo em Dia
                      </span>
                    ) : cycle.status === 'DUE_RESTART' ? (
                      <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 font-extrabold text-xs border border-indigo-300 flex items-center gap-1.5 shadow-xs">
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-700" />
                        Aguardando Reinício ({recurrenceMonths}m atingidos)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-white text-slate-600 font-bold text-xs border border-slate-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Sem Histórico
                      </span>
                    )}
                  </div>
                </div>

                {/* Corpo da Ficha */}
                <div className="p-5 sm:p-6 bg-white space-y-4">
                  {hosp && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pb-2 border-b border-slate-100">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        {hosp.name} {hosp.city ? `• ${hosp.city}/${hosp.state}` : ''}
                      </span>
                    </div>
                  )}

                {/* Área Operacional: Stepper / Checklist Interativo das 4 Etapas */}
                {cycle.status === 'ACTIVE' && activeCard ? (
                  <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 space-y-3 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                          Etapa Atual:
                        </span>
                        <span className="text-sm font-extrabold text-brand-700">
                          {cycle.stageName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Progresso: {cycle.progress}% ({cycle.completedItems} de {cycle.totalItems} etapas)</span>
                      </div>
                    </div>

                    {/* Barra de Progresso Suave */}
                    <div className="w-full bg-slate-200/80 h-2.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${cycle.progress}%` }}
                        className={`h-full transition-all duration-300 rounded-full ${
                          cycle.isOverdue ? 'bg-rose-500' : cycle.progress === 100 ? 'bg-emerald-500' : 'bg-brand-600'
                        }`}
                      />
                    </div>

                    {/* Checklist Interativo dos 4 Passos */}
                    {activeCard.checklistItems && activeCard.checklistItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                        {activeCard.checklistItems.map((item, idx) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleChecklistItem(activeCard.id, item.id, item.isDone)}
                            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                              item.isDone
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-brand-400 text-slate-700'
                            }`}
                            title="Clique para marcar / desmarcar esta etapa"
                          >
                            <span className="mt-0.5 flex-shrink-0">
                              {item.isDone ? (
                                <CheckSquare className="w-5 h-5 text-emerald-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 hover:text-brand-600" />
                              )}
                            </span>
                            <div className="min-w-0">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">
                                Etapa {idx + 1}
                              </span>
                              <span className={`text-xs font-bold leading-tight block truncate ${item.isDone ? 'line-through text-emerald-800' : ''}`}>
                                {item.title.replace(/^\d+\.\s*/, '')}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                        <span>Este cartão no quadro não possui o checklist dos 4 passos estruturado.</span>
                        <button
                          type="button"
                          onClick={() => handleGenerateCanonicalChecklist(activeCard.id, doc.name)}
                          className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 flex items-center gap-1.5 shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Inserir 4 Passos Canônicos</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : cycle.status === 'COMPLETED' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between gap-3 text-sm text-emerald-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold block">Ciclo protocolar concluído com sucesso.</span>
                        <span className="text-xs text-emerald-700 font-medium">
                          Última visita finalizada em {cycle.lastCompletedDate?.toLocaleDateString('pt-BR')}. Próxima renovação recomendada para{' '}
                          <strong>{cycle.nextDueDate?.toLocaleDateString('pt-BR')}</strong> (dentro do intervalo estipulado de {recurrenceMonths} meses).
                        </span>
                      </div>
                    </div>
                  </div>
                ) : cycle.status === 'DUE_RESTART' ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-indigo-950">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-200/80 text-indigo-800 flex items-center justify-center font-bold flex-shrink-0">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-extrabold block">Intervalo de {recurrenceMonths} meses atingido!</span>
                        <span className="text-xs text-indigo-700 font-medium">
                          Já se passou o período programado desde a última visita técnica. Inicie um novo ciclo para agendar retorno com o médico cooperador.
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-600 text-white font-extrabold text-xs rounded-xl self-start sm:self-auto whitespace-nowrap shadow-xs">
                      Renovação Pronta
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200/70 flex items-center gap-2.5 text-xs text-slate-600">
                    <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>Nenhuma visita registrada anteriormente. Clique em <strong>Iniciar Primeiro Ciclo</strong> para criar a primeira demanda no quadro.</span>
                  </div>
                )}

                {/* Rodapé do Card: Responsável & Botões de Ação estilo Assistente COLIH */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>
                      {activeCard?.assignedMember?.user?.name
                        ? `Facilitador: ${activeCard.assignedMember.user.name}`
                        : 'Facilitador: Não atribuído'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 self-stretch sm:self-auto flex-wrap">
                    {/* Botão: Definir / Alterar Prazo */}
                    <button
                      type="button"
                      onClick={() => handleOpenDueDateModal(doc)}
                      className="px-4 py-2 text-xs sm:text-sm font-bold border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 flex items-center gap-1.5 rounded-full transition-colors"
                      title="Estipular ou alterar o prazo limite da visita"
                    >
                      <CalendarClock className="w-4 h-4 text-[#1F619E]" />
                      <span>{activeCard?.dueDate ? 'Alterar Prazo' : 'Definir Prazo'}</span>
                    </button>

                    {/* Botão: Ver no Quadro */}
                    {activeCard && cycle.status === 'ACTIVE' && (
                      <Link
                        to={`/workspaces/${workspaceId}/boards`}
                        className="px-4 py-2 text-xs sm:text-sm font-bold border border-[#1F619E] text-[#1F619E] hover:bg-sky-50 flex items-center gap-1.5 rounded-full transition-colors"
                        title="Abrir demanda no quadro de ações"
                      >
                        <FolderKanban className="w-4 h-4 text-[#1F619E]" />
                        <span>Ver no Quadro</span>
                      </Link>
                    )}

                    {/* Botão Principal: Reiniciar Processo / Iniciar Ciclo (Acessível a Facilitadores e Admins) */}
                    <button
                      type="button"
                      onClick={() => handleOpenRestartModal(doc)}
                      className="px-5 py-2 text-xs sm:text-sm font-bold bg-[#1F619E] hover:bg-[#1A5285] text-white flex items-center gap-2 rounded-full shadow-sm transition-all"
                      title="Criar novo ciclo canônico de visitas no quadro de ações"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{cycle.status === 'NEVER_VISITED' ? 'Iniciar Primeiro Ciclo' : 'Reiniciar Processo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
          })
        )}
      </div>

      {/* Modal Assistente Rápido: Definir / Alterar Prazo da Visita */}
      <Modal
        isOpen={isDueDateModalOpen}
        onClose={() => setIsDueDateModalOpen(false)}
        title=""
        maxWidth="lg"
      >
        <div className="p-5 text-slate-800 space-y-5">
          <div className="border-b border-slate-300/40 pb-3.5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold text-brand-600 uppercase tracking-wider mb-1">
                <CalendarClock className="w-4 h-4" />
                <span>Estipular Prazo da Visita</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Dr(a). {doctorForDueDate?.name}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-0.5">
                {doctorForDueDate?.specialty} • CRM {doctorForDueDate?.crm}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsDueDateModalOpen(false)}
              className="p-1.5 rounded-xl neu-btn text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {dueDateError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
              {dueDateError}
            </div>
          )}

          {dueDateSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{dueDateSuccessMsg}</span>
            </div>
          )}

          {/* Atalhos Rápidos com 1 Clique */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Atalhos Rápidos de Prazo:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { days: 0, label: '⚡ Hoje' },
                { days: 1, label: '📅 Amanhã (+1d)' },
                { days: 7, label: '⏱️ 1 Semana (+7d)' },
                { days: 15, label: '📆 15 Dias' },
                { days: 30, label: '🗓️ 1 Mês (+30d)' },
                { days: 60, label: '🗓️ 2 Meses (+60d)' },
              ].map((preset) => {
                const target = new Date();
                target.setDate(target.getDate() + preset.days);
                const targetStr = target.toISOString().split('T')[0];

                return (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setEditingDueDateVal(targetStr);
                      handleSaveDueDate(targetStr);
                    }}
                    className={`neu-btn px-3.5 py-2.5 text-xs sm:text-sm font-bold text-left transition-all ${
                      editingDueDateVal === targetStr
                        ? 'neu-btn-active bg-brand-50 text-brand-700 border border-brand-300'
                        : 'text-slate-700 hover:text-brand-600'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo Manual de Seleção no Calendário */}
          <div className="neu-panel p-4 space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Data Específica da Visita / Prazo Limite:</span>
            </label>
            <input
              type="date"
              value={editingDueDateVal}
              onChange={(e) => setEditingDueDateVal(e.target.value)}
              className="w-full px-4 py-2.5 neu-input text-sm sm:text-base font-bold text-slate-900"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-300/40">
            {activeCardForDueDate?.dueDate ? (
              <button
                type="button"
                disabled={isSavingDueDate}
                onClick={() => handleSaveDueDate('')}
                className="text-sm font-bold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Limpar Prazo
              </button>
            ) : <div />}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => setIsDueDateModalOpen(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 rounded-full border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingDueDate}
                onClick={() => handleSaveDueDate()}
                className="px-6 py-2 text-sm font-bold text-white rounded-full bg-[#1F619E] hover:bg-[#1A5285] shadow-sm transition-all disabled:opacity-50"
              >
                {isSavingDueDate ? 'Salvando...' : 'Salvar Prazo'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Assistente: Reiniciar Ciclo da Visita Completo */}
      <Modal
        isOpen={isRestartModalOpen}
        onClose={() => setIsRestartModalOpen(false)}
        title=""
        maxWidth="3xl"
      >
        <form onSubmit={handleExecuteRestart} className="p-5 text-slate-800 space-y-5">
          <div className="border-b border-slate-300/40 pb-4">
            <div className="flex items-center gap-2 text-xs text-brand-600 font-extrabold uppercase tracking-wider mb-1">
              <RotateCcw className="w-4 h-4" />
              <span>Assistente de Reinício do Ciclo COLIH</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Reiniciar Ciclo com Dr(a). {targetDoctor?.name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Esta ação cria uma nova demanda no quadro de ações já estruturada com os 4 passos canônicos da COLIH e com o prazo estipulado para acompanhamento.
            </p>
          </div>

          {restartError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
              {restartError}
            </div>
          )}

          {restartSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{restartSuccessMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* 4 Passos Obrigatórios que serão inseridos no Checklist do Card */}
            <div className="neu-well p-4 rounded-xl space-y-2.5 border border-slate-300/40">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-teal-600" />
                <span>Checklist Canônico Inserido Automaticamente no Cartão:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-700 pt-1">
                <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-lg border border-slate-200/60 shadow-xs">
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">1</span>
                  <span>Agendar visita presencial</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-lg border border-slate-200/60 shadow-xs">
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">2</span>
                  <span>Realizar visita presencial pelos facilitadores</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-lg border border-slate-200/60 shadow-xs">
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">3</span>
                  <span>Recolher formulário HLC-31 assinado</span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 bg-white/70 rounded-lg border border-slate-200/60 shadow-xs">
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-xs">4</span>
                  <span>Enviar e-mail formal com literatura PBM</span>
                </div>
              </div>
            </div>

            {/* Layout Widescreen em 2 Colunas para campos do form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Quadro de Ações de Destino */}
              <div className="neu-panel p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Quadro de Ações de Destino
                </label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="w-full px-3 py-2.5 neu-input text-sm font-semibold"
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Facilitador Designado */}
              <div className="neu-panel p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Facilitador Responsável
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2.5 neu-input text-sm font-semibold"
                >
                  <option value="">Não atribuído</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.user.name} ({m.role || 'Membro'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Prazo de Execução da Visita */}
              <div className="neu-panel p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-600" />
                  <span>Prazo Estipulado para a Visita</span>
                </label>
                <input
                  type="date"
                  required
                  value={visitDueDate}
                  onChange={(e) => setVisitDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 neu-input text-sm sm:text-base font-bold text-slate-900"
                />
              </div>

              {/* Notas / Diretrizes */}
              <div className="neu-panel p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Notas Iniciais &amp; Alinhamento
                </label>
                <textarea
                  rows={2}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Instruções para os facilitadores..."
                  className="w-full p-2.5 neu-input text-sm leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsRestartModalOpen(false)}
              className="px-5 py-2 text-sm font-semibold text-slate-600 rounded-full border border-slate-300 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmittingRestart}
              className="px-6 py-2 text-sm font-bold text-white rounded-full bg-[#1F619E] hover:bg-[#1A5285] flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isSubmittingRestart ? 'Reiniciando...' : 'Confirmar e Iniciar Novo Ciclo'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
