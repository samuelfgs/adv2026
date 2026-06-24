
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import { formatPrice } from '../lib/price-formatter';

interface RegistrationData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  mercado_pago_id: string;
  kids: number;
  qtt: number;
  metadata: {
    payer: {
      nome: string;
      cpf: string;
      email: string;
      telefone: string;
    };
    quantity: number;
    totalPrice: number;
  };
}

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string>("");

  useEffect(() => {
    const fetchRegistration = async () => {
      const { external_reference, status } = router.query;

      if (!router.isReady) return;

      if (status !== 'approved') {
        setError('Pagamento não foi aprovado');
        setLoading(false);
        return;
      }

      if (!external_reference) {
        setError('Referência de pagamento não encontrada');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/registration/${external_reference}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          setError(data.error || 'Registro não encontrado');
          setLoading(false);
          return;
        }

        setRegistration(data.data);

        // Generate a single QR Code for the whole registration
        const qrUrl = `${window.location.origin}/ingresso/adv/${data.data.id}`;
        const generatedQr = await QRCode.toDataURL(qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCode(generatedQr);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching registration:', err);
        setError('Erro ao buscar registro');
        setLoading(false);
      }
    };

    fetchRegistration();
  }, [router.isReady, router.query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-[#F29100] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-slate-600 font-medium">Carregando sua inscrição...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h1>
          <p className="text-slate-600">{error || 'Registro não encontrado'}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-900 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const firstName = registration.nome.split(' ')[0];
  const { quantity, totalPrice } = registration.metadata;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="font-black text-2xl tracking-tighter text-black">
            AD<span className="text-[#F29100]">2026</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="animate-in fade-in zoom-in duration-500 text-center">
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-orange-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative w-24 h-24 bg-[#F29100] text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter mb-4">Compra Confirmada!</h1>
          <p className="text-lg text-slate-600 mb-10">
            Tudo certo, <span className="text-[#F29100] font-bold">{firstName}</span>! Sua participação no AD 2026 está garantida.
          </p>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8 border border-slate-100 text-left">
            <div className="bg-black px-8 py-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Detalhes do Pedido</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center py-4 border-b border-slate-50">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Ingressos</span>
                  <span className="text-2xl font-bold text-slate-900">{quantity}x Passaporte AD 2026</span>
                  {registration.kids > 0 && (
                    <span className="text-sm font-medium text-slate-500 mt-1">
                      {registration.kids}x Inscrição Criança (3-10 anos) - Grátis
                    </span>
                  )}
                </div>
                <div className="text-right flex flex-col">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Pago</span>
                  <span className="text-2xl font-bold text-[#F29100]">{formatPrice(totalPrice.toString())}</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Comprador</p>
                  <p className="text-lg font-bold text-slate-900">{registration.nome}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Data do Evento</p>
                  <p className="text-lg font-bold text-slate-900">31 Jul - 02 Ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden mb-8 border border-slate-100">
            <div className="bg-[#F29100] px-8 py-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Seu Voucher</h2>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600">Apresente este QR Code na recepção para validar seus {quantity + (registration.kids || 0)} ingressos.</p>
              {qrCode && (
                <div className="inline-block p-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-inner">
                  <img src={qrCode} alt="QR Code Access" className="w-64 h-64 mx-auto" />
                </div>
              )}
              <div className="bg-orange-50 rounded-2xl p-4 text-xs text-orange-800 font-bold uppercase tracking-wider">
                Válido para {quantity + (registration.kids || 0)} {quantity + (registration.kids || 0) === 1 ? 'entrada' : 'entradas'}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-4 bg-black text-white font-bold rounded-2xl hover:bg-slate-900 transition-all shadow-xl active:scale-95"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-lg border border-slate-200 active:scale-95"
            >
              Imprimir Voucher
            </button>
          </div>
        </div>
      </main>

      <footer className="py-12 text-center text-slate-400 text-sm">
        <p>© 2026 Igreja em São Vicente • AD 2026</p>
      </footer>
    </div>
  );
};

export default SuccessPage;
