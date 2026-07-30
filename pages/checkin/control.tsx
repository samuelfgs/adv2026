import React, { useEffect, useState, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import QRCode from 'qrcode.react';
import CheckinAuthGuard from '@/components/CheckinAuthGuard';

interface CheckinRecord {
  id: number | string;
  createdAt: string;
  inscricaoId: number | string;
  inscricaoNumber: number;
  responsavel: string;
}

interface Participant {
  id: string;
  name: string;
  email: string;
  cpf: string;
  telefone?: string;
  qtt: number;
  kids: number;
  totalTickets: number;
  mercadoPagoId?: string;
  paymentStatus: string;
  createdAt: string;
  checkins: CheckinRecord[];
  checkinCount: number;
  isFullyCheckedIn: boolean;
  isPartiallyCheckedIn: boolean;
  status: 'checked_in' | 'partial' | 'pending';
}

interface Stats {
  totalRegistrations: number;
  totalPeople: number;
  totalAdults: number;
  totalKids: number;
  totalCheckedInPeople: number;
  totalPendingPeople: number;
  completionPercentage: number;
}

export default function CheckinControlPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'checked_in' | 'pending'>('all');
  
  // Selected participant for details/QR modal
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [modalMode, setModalMode] = useState<'details' | 'qr' | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  
  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [adminName, setAdminName] = useState<string>('Admin Control');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const res = await fetch('/api/checkin/list');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao carregar participantes');
      }
      setParticipants(data.data || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error('Error fetching list:', err);
      if (!isSilent) setError(err.message || 'Falha na conexão');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const savedName = localStorage.getItem('isv-admin') || localStorage.getItem('checkin-responsavel');
    if (savedName) setAdminName(savedName);
    fetchData(false);

    // Silent 10-second Auto Refresh Interval
    const interval = setInterval(() => {
      fetchData(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleCheckin = async (
    participant: Participant, 
    entryNumber: number = 0, 
    currentAction: 'checkin' | 'checkout'
  ) => {
    const actionKey = `${participant.id}-${entryNumber}`;
    try {
      setActionLoadingId(actionKey);
      const res = await fetch('/api/checkin/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inscricaoId: participant.id,
          inscricaoNumber: entryNumber,
          action: currentAction,
          responsavel: adminName || 'Admin Controle',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao atualizar check-in');
      }

      showNotification(
        currentAction === 'checkin' ? 'success' : 'info',
        currentAction === 'checkin'
          ? `Check-in realizado para ${participant.name} (Ingresso #${entryNumber + 1})`
          : `Check-in cancelado para ${participant.name}`
      );

      // Refresh list
      await fetchData();
      if (selectedParticipant && selectedParticipant.id === participant.id) {
        // Update modal state
        const updatedRes = await fetch('/api/checkin/list');
        const updatedData = await updatedRes.json();
        const found = updatedData.data?.find((p: Participant) => p.id === participant.id);
        if (found) setSelectedParticipant(found);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Erro no servidor');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckinAll = async (participant: Participant) => {
    try {
      setActionLoadingId(`${participant.id}-all`);
      for (let i = 0; i < participant.totalTickets; i++) {
        const isChecked = participant.checkins.some((c) => c.inscricaoNumber === i);
        if (!isChecked) {
          await fetch('/api/checkin/mark', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inscricaoId: participant.id,
              inscricaoNumber: i,
              action: 'checkin',
              responsavel: adminName || 'Admin Controle',
            }),
          });
        }
      }
      showNotification('success', `Check-in completo realizado para ${participant.name} (${participant.totalTickets} ingressos)`);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Erro ao realizar check-in geral');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenQRModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setModalMode('qr');
  };

  const handleOpenDetailsModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setModalMode('details');
  };

  const exportCSV = () => {
    if (!participants.length) return;
    const headers = ['ID', 'Nome', 'Email', 'CPF', 'Telefone', 'Ingressos Adulto', 'Ingressos Crianca', 'Total Ingressos', 'Checkins Realizados', 'Status Checkin'];
    const rows = participants.map(p => [
      p.id,
      `"${p.name}"`,
      `"${p.email}"`,
      `"${p.cpf}"`,
      `"${p.telefone || ''}"`,
      p.qtt,
      p.kids,
      p.totalTickets,
      p.checkinCount,
      p.isFullyCheckedIn ? 'PRESENTE' : p.isPartiallyCheckedIn ? 'PARCIAL' : 'AUSENTE'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `checkin_ad2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      const query = search.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.cpf.includes(query) ||
        p.id.includes(query);

      if (!matchesSearch) return false;

      if (filterTab === 'checked_in') return p.checkinCount > 0;
      if (filterTab === 'pending') return p.checkinCount < p.totalTickets;

      return true;
    });
  }, [participants, search, filterTab]);

  return (
    <CheckinAuthGuard>
      <Head>
        <title>Painel de Controle do Check-in | AD 2026</title>
        <meta name="description" content="Gestão e controle manual de credenciamento e check-in" />
      </Head>

      <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
        {/* Top Notification Toast */}
        {notification && (
          <div
            className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-2xl shadow-2xl border text-white font-medium flex items-center gap-3 transition-all animate-bounce ${
              notification.type === 'success'
                ? 'bg-emerald-600 border-emerald-400'
                : notification.type === 'error'
                ? 'bg-rose-600 border-rose-400'
                : 'bg-blue-600 border-blue-400'
            }`}
          >
            <span>{notification.type === 'success' ? '✅' : notification.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{notification.message}</span>
          </div>
        )}

        {/* Header Navigation */}
        <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl flex items-center justify-center font-black text-white text-xl shadow-lg">
                AD
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Painel de Controle • Check-in
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Ao Vivo
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Credenciamento e presença em tempo real</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <input
                type="text"
                value={adminName}
                onChange={(e) => {
                  setAdminName(e.target.value);
                  localStorage.setItem('isv-admin', e.target.value);
                  localStorage.setItem('checkin-responsavel', e.target.value);
                }}
                placeholder="Seu Nome (Responsável)"
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 w-44"
                title="Nome salvo como validador nos registros de check-in"
              />
              <Link
                href="/checkin"
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 whitespace-nowrap"
              >
                📷 Scanner QR
              </Link>
              <button
                onClick={() => fetchData(false)}
                disabled={loading}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-slate-600 transition-all active:scale-95 whitespace-nowrap"
              >
                {loading ? '⏳ Updating...' : '🔄 Atualizar'}
              </button>
              <button
                onClick={exportCSV}
                className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-emerald-600/50 transition-all whitespace-nowrap"
              >
                📥 CSV
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('checkin_authenticated');
                  window.location.reload();
                }}
                className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-semibold text-xs px-3.5 py-2.5 rounded-xl border border-rose-800/60 transition-all whitespace-nowrap"
                title="Sair do sistema de check-in"
              >
                🚪 Sair
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* Stats Dashboard Section */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Inscritos</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">{stats.totalRegistrations}</span>
                  <span className="text-xs text-slate-400 font-medium">compras</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex justify-between border-t border-slate-700/60 pt-2">
                  <span>👨 Adultos: <b>{stats.totalAdults}</b></span>
                  <span>👶 Kids: <b>{stats.totalKids}</b></span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-emerald-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Total Presentes</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400">{stats.totalCheckedInPeople}</span>
                  <span className="text-xs text-emerald-300/80 font-medium">/ {stats.totalPeople} pessoas</span>
                </div>
                <div className="mt-3 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${stats.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-amber-900/60 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>
                <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Aguardando Check-in</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-300">{stats.totalPendingPeople}</span>
                  <span className="text-xs text-slate-400 font-medium">ausentes</span>
                </div>
                <div className="mt-2 text-xs text-amber-400/80 font-semibold border-t border-slate-700/60 pt-2">
                  {100 - stats.completionPercentage}% restante
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-bl-full pointer-events-none"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Progresso Geral</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-blue-400">{stats.completionPercentage}%</span>
                  <span className="text-xs text-slate-400 font-medium">concluído</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 border-t border-slate-700/60 pt-2">
                  {stats.totalCheckedInPeople} de {stats.totalPeople} entradas validadas
                </p>
              </div>
            </div>
          )}

          {/* Search Bar & Filter Tabs */}
          <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
            <div className="relative w-full md:w-96">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por Nome, Email, CPF ou ID..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-900 p-1.5 rounded-xl border border-slate-700/80 w-full md:w-auto overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  filterTab === 'all'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({participants.length})
              </button>
              <button
                onClick={() => setFilterTab('checked_in')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  filterTab === 'checked_in'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Presentes ({participants.filter(p => p.checkinCount > 0).length})
              </button>
              <button
                onClick={() => setFilterTab('pending')}
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  filterTab === 'pending'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pendentes ({participants.filter(p => p.checkinCount < p.totalTickets).length})
              </button>
            </div>
          </div>

          {/* Loading or Error State */}
          {loading && !participants.length ? (
            <div className="bg-slate-800 rounded-3xl p-16 text-center border border-slate-700 shadow-xl space-y-4">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-300 font-medium text-base">Carregando lista de inscritos...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-900/30 border border-rose-700/60 rounded-3xl p-8 text-center space-y-4">
              <span className="text-4xl">⚠️</span>
              <h3 className="text-xl font-bold text-rose-300">Erro ao carregar dados</h3>
              <p className="text-rose-200/80 text-sm max-w-md mx-auto">{error}</p>
              <button
                onClick={() => fetchData(false)}
                className="bg-rose-600 hover:bg-rose-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="bg-slate-800 rounded-3xl p-12 text-center border border-slate-700 shadow-xl space-y-3">
              <span className="text-4xl">🔍</span>
              <h3 className="text-lg font-bold text-white">Nenhum inscrito encontrado</h3>
              <p className="text-slate-400 text-sm">
                Nenhum participante corresponde aos filtros selecionados "{search}".
              </p>
            </div>
          ) : (
            /* Table of Attendees */
            <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-200">
                  <thead className="bg-slate-900/90 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="px-5 py-4">Inscrito / Voucher</th>
                      <th className="px-5 py-4">Ingressos</th>
                      <th className="px-5 py-4">Status Check-in</th>
                      <th className="px-5 py-4 text-right">Ação Check-in Manual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {filteredParticipants.map((p) => {
                      const isFullyCheckedIn = p.isFullyCheckedIn;
                      const isPartiallyCheckedIn = p.isPartiallyCheckedIn;

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-700/40 transition-colors group"
                        >
                          {/* Participant Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shrink-0 ${
                                  isFullyCheckedIn
                                    ? 'bg-emerald-600'
                                    : isPartiallyCheckedIn
                                    ? 'bg-amber-600'
                                    : 'bg-slate-700'
                                }`}
                              >
                                {p.name ? p.name.charAt(0).toUpperCase() : '#'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-100 flex items-center gap-2">
                                  <span className="truncate">{p.name}</span>
                                  <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700 shrink-0">
                                    #{p.id}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-400 truncate flex items-center gap-2">
                                  <span>{p.email}</span>
                                  {p.cpf && <span className="text-slate-500">• CPF: {p.cpf}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tickets Breakdown */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold text-white">
                                {p.totalTickets} {p.totalTickets === 1 ? 'entrada' : 'entradas'}
                              </span>
                              <div className="flex gap-1.5 text-[10px]">
                                <span className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded font-medium border border-slate-700">
                                  {p.qtt}x Adulto
                                </span>
                                {p.kids > 0 && (
                                  <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium border border-amber-500/30">
                                    {p.kids}x Criança
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Checkin Status Badge */}
                          <td className="px-5 py-4 whitespace-nowrap">
                            {isFullyCheckedIn ? (
                              <div className="flex flex-col">
                                <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 w-fit">
                                  ✅ PRESENTE ({p.checkinCount}/{p.totalTickets})
                                </span>
                                {p.checkins.length > 0 && (
                                  <span className="text-[10px] text-slate-400 mt-1">
                                    Último: {new Date(p.checkins[0].createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({p.checkins[0].responsavel || 'Portaria'})
                                  </span>
                                )}
                              </div>
                            ) : isPartiallyCheckedIn ? (
                              <div className="flex flex-col">
                                <span className="bg-amber-600/30 text-amber-300 border border-amber-500/50 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 w-fit">
                                  ⚠️ PARCIAL ({p.checkinCount}/{p.totalTickets})
                                </span>
                                <span className="text-[10px] text-amber-400 mt-1">
                                  Faltam {p.totalTickets - p.checkinCount} entradas
                                </span>
                              </div>
                            ) : (
                              <span className="bg-slate-700/60 text-slate-400 border border-slate-600 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5">
                                ⏳ AUSENTE (0/{p.totalTickets})
                              </span>
                            )}
                          </td>

                          {/* Actions: Individual Manual Checkin */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {Array.from({ length: p.totalTickets }).map((_, idx) => {
                                const checkinRecord = p.checkins.find((c) => Number(c.inscricaoNumber) === idx);
                                const isChecked = !!checkinRecord;
                                const isKids = idx >= p.qtt;
                                const label = p.totalTickets === 1
                                  ? 'Check-in'
                                  : `#${idx + 1}${isKids ? ' (Kids)' : ''}`;

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleToggleCheckin(p, idx, isChecked ? 'checkout' : 'checkin')}
                                    disabled={actionLoadingId === `${p.id}-${idx}`}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border flex items-center gap-1.5 ${
                                      isChecked
                                        ? 'bg-emerald-950/80 hover:bg-rose-900/80 text-emerald-300 border-emerald-500/50 hover:border-rose-500/50 hover:text-rose-200'
                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md'
                                    }`}
                                    title={
                                      isChecked
                                        ? `Check-in realizado por ${checkinRecord?.responsavel || 'Portaria'}. Clique para desfazer.`
                                        : `Marcar check-in individual para Ingresso ${label}`
                                    }
                                  >
                                    {actionLoadingId === `${p.id}-${idx}` ? (
                                      '⏳...'
                                    ) : isChecked ? (
                                      <>
                                        <span>✅</span>
                                        <span>{label}</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>⚡</span>
                                        <span>{label}</span>
                                      </>
                                    )}
                                  </button>
                                );
                              })}

                              {/* View QR Code Button */}
                              <button
                                onClick={() => handleOpenQRModal(p)}
                                className="bg-slate-900 hover:bg-black text-amber-400 text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 transition-all ml-1"
                                title="Ver QR Code"
                              >
                                📱 QR
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {/* Modal: Manage Individual Tickets / Details */}
        {modalMode === 'details' && selectedParticipant && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-left">
              <div className="flex justify-between items-start border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedParticipant.name}</h3>
                  <p className="text-xs text-slate-400">
                    ID #{selectedParticipant.id} • CPF: {selectedParticipant.cpf || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModalMode(null);
                    setSelectedParticipant(null);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Ingressos desta Inscrição ({selectedParticipant.totalTickets} total)
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {Array.from({ length: selectedParticipant.totalTickets }).map((_, idx) => {
                    const checkinRecord = selectedParticipant.checkins.find(
                      (c) => Number(c.inscricaoNumber) === idx
                    );
                    const isChecked = !!checkinRecord;
                    const ticketType = idx >= selectedParticipant.qtt ? 'Ingresso Criança' : 'Ingresso Adulto';

                    return (
                      <div
                        key={idx}
                        className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                            <span>Ingresso #{idx + 1}</span>
                            <span className="text-xs font-normal text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                              {ticketType}
                            </span>
                          </div>
                          {isChecked ? (
                            <p className="text-xs text-emerald-400 mt-1">
                              ✅ Check-in realizado às{' '}
                              {new Date(checkinRecord.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              ({checkinRecord.responsavel || 'Portaria'})
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 mt-1">⏳ Pendente de validação</p>
                          )}
                        </div>

                        {isChecked ? (
                          <button
                            onClick={() => handleToggleCheckin(selectedParticipant, idx, 'checkout')}
                            disabled={actionLoadingId === `${selectedParticipant.id}-${idx}`}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                          >
                            Desfazer
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleCheckin(selectedParticipant, idx, 'checkin')}
                            disabled={actionLoadingId === `${selectedParticipant.id}-${idx}`}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow transition-all"
                          >
                            Check-in OK
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-700 flex justify-end">
                <button
                  onClick={() => {
                    setModalMode(null);
                    setSelectedParticipant(null);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: View QR Code */}
        {modalMode === 'qr' && selectedParticipant && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-6">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="font-bold text-white text-lg">QR Code de Check-in</h3>
                <button
                  onClick={() => {
                    setModalMode(null);
                    setSelectedParticipant(null);
                  }}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <p className="font-bold text-slate-100 text-base">{selectedParticipant.name}</p>
                <p className="text-xs text-slate-400">ID #{selectedParticipant.id}</p>
              </div>

              <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
                <QRCode
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkin/${selectedParticipant.id}`}
                  size={200}
                />
              </div>

              <p className="text-xs text-slate-400">
                Link: <span className="text-amber-400 break-all font-mono">{`/checkin/${selectedParticipant.id}`}</span>
              </p>

              <div className="flex gap-2 justify-center">
                <Link
                  href={`/checkin/${selectedParticipant.id}`}
                  target="_blank"
                  className="bg-amber-500 hover:bg-orange-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition-all"
                >
                  Abrir Página de Check-in ↗
                </Link>
                <button
                  onClick={() => {
                    setModalMode(null);
                    setSelectedParticipant(null);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CheckinAuthGuard>
  );
}
