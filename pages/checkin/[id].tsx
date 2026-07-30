import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import CheckinAuthGuard from '@/components/CheckinAuthGuard';

interface CheckinDetailResponse {
  success: boolean;
  isNew?: boolean;
  error?: string;
  registration?: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    telefone?: string;
    qtt: number;
    kids: number;
    totalTickets: number;
    paymentStatus: string;
    createdAt: string;
  };
  currentEntry?: {
    entryNumber: number;
    ticketType: string;
    isCheckedIn: boolean;
    checkin: {
      id: number;
      createdAt: string;
      responsavel: string;
    } | null;
  };
  allCheckins?: any[];
}

export default function CheckinRedirectPage() {
  const router = useRouter();
  const { id, entry, responsavel } = router.query;

  const [data, setData] = useState<CheckinDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validatorName, setValidatorName] = useState('Portaria / Leitor QR');

  useEffect(() => {
    const savedName = localStorage.getItem('isv-admin') || localStorage.getItem('checkin-responsavel');
    if (savedName) setValidatorName(savedName);
  }, []);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const performCheckin = async () => {
      try {
        setLoading(true);
        setError(null);

        const entryNum = entry ? String(entry) : '0';
        const respParam = responsavel ? String(responsavel) : validatorName;

        const res = await fetch(
          `/api/checkin/${id}?entry=${entryNum}&autoMark=true&responsavel=${encodeURIComponent(respParam)}`
        );
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Erro ao processar check-in do QR Code');
        }

        setData(result);
      } catch (err: any) {
        console.error('Error during QR check-in:', err);
        setError(err.message || 'Falha ao comunicar com o servidor');
      } finally {
        setLoading(false);
      }
    };

    performCheckin();
  }, [router.isReady, id, entry, responsavel, validatorName]);

  const registration = data?.registration;
  const currentEntry = data?.currentEntry;
  const checkinInfo = currentEntry?.checkin;
  const isNew = data?.isNew;

  return (
    <CheckinAuthGuard>
      <Head>
        <title>Validação de Check-in | AD 2026</title>
        <meta name="description" content="Página de marcação e leitura de QR Code para evento" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
        {/* Header */}
        <header className="w-full max-w-md flex items-center justify-between py-4 border-b border-slate-800">
          <Link href="/checkin/control" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-lg flex items-center justify-center font-black text-white text-sm shadow">
              AD
            </div>
            <span className="font-bold text-white tracking-tight text-sm">AD 2026 Check-in</span>
          </Link>
          <Link
            href="/checkin/control"
            className="text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 transition-all"
          >
            📊 Painel Geral
          </Link>
        </header>

        {/* Content Body */}
        <main className="w-full max-w-md my-auto py-8">
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-6 shadow-2xl animate-pulse">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-2xl">📱</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lendo QR Code...</h2>
                <p className="text-sm text-slate-400 mt-1">Registrando entrada no sistema...</p>
              </div>
            </div>
          ) : error ? (
            /* Error Card */
            <div className="bg-slate-900 border border-rose-800/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-20 h-20 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                ❌
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-rose-300">Inscrição Inválida</h2>
                <p className="text-sm text-rose-200/80">{error}</p>
              </div>
              <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                <Link
                  href="/checkin"
                  className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl border border-slate-700 transition-all"
                >
                  📷 Escanear Outro QR Code
                </Link>
                <Link
                  href="/checkin/control"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-800 transition-all"
                >
                  🔍 Buscar Manualmente no Controle
                </Link>
              </div>
            </div>
          ) : isNew ? (
            /* SUCCESS CARD - JUST MARKED AS READ */
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>

              {/* Glowing Icon */}
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-40 rounded-full animate-pulse"></div>
                <div className="relative w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-emerald-400/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/30">
                  Check-in Confirmado
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-3">
                  CHECK-IN REALIZADO!
                </h1>
                <p className="text-xs text-slate-400 mt-1">QR Code lido e validado com sucesso</p>
              </div>

              {/* Attendee Details Box */}
              {registration && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-sm">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Participante</span>
                    <p className="font-bold text-white text-base">{registration.name}</p>
                    <p className="text-xs text-slate-400">{registration.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ingresso</span>
                      <p className="font-bold text-amber-400">
                        {currentEntry?.ticketType || 'Ingresso'} (#{ (currentEntry?.entryNumber || 0) + 1 } de {registration.totalTickets})
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pagamento</span>
                      <p className="font-bold text-emerald-400 capitalize">{registration.paymentStatus}</p>
                    </div>
                  </div>

                  {checkinInfo && (
                    <div className="pt-3 border-t border-slate-800/80 text-xs flex justify-between items-center text-slate-400">
                      <span>⏰ Horário: <b className="text-white">{new Date(checkinInfo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</b></span>
                      <span>👤 Validador: <b className="text-white">{checkinInfo.responsavel || 'Portaria'}</b></span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <Link
                  href="/checkin"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  📷 Escanear Próximo QR Code
                </Link>
                <Link
                  href="/checkin/control"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  📊 Ver Lista Geral de Presença
                </Link>
              </div>
            </div>
          ) : (
            /* ALREADY USED / READ CARD */
            <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none"></div>

              <div className="w-20 h-20 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                ⚠️
              </div>

              <div>
                <span className="bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
                  QR Code Já Utilizado
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight mt-3">
                  CHECK-IN JÁ REALIZADO!
                </h1>
                <p className="text-xs text-slate-400 mt-1">Este QR code foi marcado como lido anteriormente</p>
              </div>

              {/* Attendance Info */}
              {registration && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-left space-y-3 text-sm">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Participante</span>
                    <p className="font-bold text-white text-base">{registration.name}</p>
                    <p className="text-xs text-slate-400">{registration.email}</p>
                  </div>

                  {checkinInfo && (
                    <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-xs space-y-1 text-amber-200">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>🕒</span> Realizado em:{' '}
                        {new Date(checkinInfo.createdAt).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(checkinInfo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-amber-300/80">👤 Validador por: {checkinInfo.responsavel || 'Portaria'}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <Link
                  href="/checkin"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
                >
                  📷 Escanear Próximo QR Code
                </Link>
                <Link
                  href="/checkin/control"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 text-xs"
                >
                  📊 Abrir Painel de Controle
                </Link>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-500">
          AD 2026 • Sistema de Check-in em Tempo Real
        </footer>
      </div>
    </CheckinAuthGuard>
  );
}
