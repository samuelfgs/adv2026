import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';
import { formatPrice } from '../lib/price-formatter';

interface ParticipantData {
  nome: string;
  cpf: string;
  dataNascimento: string;
  gender: string;
  shirtSize: string;
  modalidade: 'walk' | 'run';
  isElderly?: boolean;
  price?: number;
}

interface RegistrationData {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  mercado_pago_id: string;
  metadata: {
    people: ParticipantData[];
    modalidadeDescription: string;
    totalQuantity: number;
    totalPrice: number;
    price: number;
  };
}

const SuccessPage: React.FC = () => {
  const router = useRouter();
  const [registration, setRegistration] = useState<RegistrationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<string[]>([]);

  useEffect(() => {
    const fetchRegistration = async () => {
      const { external_reference, status } = router.query;

      // Wait for router to be ready
      if (!router.isReady) return;

      // Check if payment was approved
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

        // Generate QR Codes for each participant
        const qrCodePromises = data.data.metadata.people.map(async (_: any, index: number) => {
          const qrUrl = `${window.location.origin}/ingresso/run/${data.data.id}/${index}`;
          return await QRCode.toDataURL(qrUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#1e293b',
              light: '#ffffff',
            },
          });
        });
        const generatedQrCodes = await Promise.all(qrCodePromises);
        setQrCodes(generatedQrCodes);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg text-slate-600 font-medium">Carregando sua inscrição...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Ops! Algo deu errado</h1>
            <p className="text-slate-600">{error || 'Registro não encontrado'}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const firstName = registration.nome.split(' ')[0];
  const { people, modalidadeDescription, totalPrice } = registration.metadata;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="font-black text-2xl tracking-tighter text-blue-600">
            ISV<span className="text-slate-900">RUN</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Igreja em São Vicente
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="animate-in fade-in zoom-in duration-500">
          {/* Success Icon */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-400 blur-3xl opacity-20 rounded-full animate-pulse"></div>
              <div className="relative w-24 h-24 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center space-y-3 mb-10">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">Pagamento Confirmado!</h1>
            <p className="text-lg md:text-xl text-slate-600">
              Bem-vindo(a) ao ISV RUN, <span className="text-blue-600 font-bold">{firstName}</span>!
            </p>
            <p className="text-slate-500">
              Sua inscrição foi confirmada com sucesso. Um e-mail de confirmação foi enviado para{' '}
              <span className="font-semibold">{registration.email}</span>.
            </p>
          </div>

          {/* Event Details Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Detalhes da Inscrição</h2>
            </div>

            <div className="p-8 space-y-6">
              {/* Registration Info */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  {people.length === 1 ? 'Participante' : `Participantes (${people.length})`}
                </p>
                <div className="space-y-4">
                  {people.map((person, index) => (
                    <div key={index} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-lg font-bold text-slate-900">{person.nome}</p>
                        {person.isElderly && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                            Idoso - 50% desconto
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Modalidade:</span>{' '}
                          <span className="font-semibold text-blue-600">
                            {person.modalidade === 'run' ? 'Corrida 5km' : 'Caminhada 5km'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Camisa:</span>{' '}
                          <span className="font-semibold text-slate-900">{person.shirtSize.toUpperCase()}</span>
                        </div>
                      </div>
                      {person.price && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <span className="text-slate-500 text-sm">Valor:</span>{' '}
                          <span className="font-semibold text-green-600">{formatPrice(person.price.toString())}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-200"></div>

              {/* Event Info */}
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Data</p>
                  <p className="text-lg font-semibold text-slate-900">07 de Fevereiro, 2026</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Horário</p>
                  <p className="text-lg font-semibold text-slate-900">18:30</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Pago</p>
                  <p className="text-lg font-semibold text-green-600">{formatPrice(totalPrice.toString())}</p>
                </div>
              </div>

              <div className="h-px bg-slate-200"></div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Local de Partida</p>
                <p className="text-lg font-semibold text-slate-900">Canto do Ilha - Ilha Porchat, São Vicente/SP</p>
                <p className="text-sm text-slate-500 mt-1">Praia Central (Posto 2), São Vicente</p>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">
                {people.length === 1 ? 'Seu QR Code de Check-in' : 'QR Codes de Check-in'}
              </h2>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-center">
                {people.length === 1
                  ? 'Apresente este QR Code no dia do evento para fazer seu check-in'
                  : 'Cada participante deve apresentar seu QR Code individual no dia do evento'}
              </p>

              <div className={`grid ${people.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6`}>
                {people.map((person, index) => (
                  <div key={index} className="text-center">
                    <p className="text-sm font-bold text-slate-700 mb-3">{person.nome}</p>
                    {qrCodes[index] && (
                      <div className="inline-block p-4 bg-slate-50 rounded-2xl border-2 border-slate-200">
                        <img src={qrCodes[index]} alt={`QR Code de ${person.nome}`} className="w-48 h-48 mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700">
                <p className="font-semibold text-blue-900 mb-1">💡 Dica importante:</p>
                <p>Salve {people.length === 1 ? 'este QR Code' : 'estes QR Codes'} ou tire uma captura de tela para acesso rápido no dia do evento!</p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-xl p-8 text-white mb-8">
            <h3 className="text-2xl font-bold mb-4">Próximos Passos</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold">1</span>
                </span>
                <span>Verifique seu e-mail para a confirmação e comprovante de inscrição</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold">2</span>
                </span>
                <span>Salve ou imprima seu QR Code para apresentar no dia do evento</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold">3</span>
                </span>
                <span>Chegue com antecedência para fazer seu check-in e retirar o kit</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-bold">4</span>
                </span>
                <span>Prepare-se e nos vemos no dia 7 de Fevereiro às 18:30!</span>
              </li>
              {people.some((p) => p.isElderly) && (
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-400/30 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-sm font-bold">⚠️</span>
                  </span>
                  <span className="font-semibold">
                    Participantes idosos devem apresentar documento com data de nascimento no check-in
                  </span>
                </li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              Voltar ao Início
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-lg border-2 border-blue-200 active:scale-95"
            >
              Imprimir Confirmação
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400">
            © 2026 Igreja em São Vicente. Nos vemos na corrida! 🏃‍♂️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SuccessPage;
